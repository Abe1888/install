'use client';

import React from 'react';

// Performance metrics interface
interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ComponentMetrics {
  componentName: string;
  mountTime: number;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  dataFetchTime?: number;
  errorCount: number;
  memoryUsage?: number;
}

// Performance monitor class
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private componentMetrics = new Map<string, ComponentMetrics>();
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    try {
      // Observe paint timings
      if (PerformanceObserver.supportedEntryTypes.includes('paint')) {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: entry.name,
              value: entry.startTime,
              unit: 'ms',
              timestamp: Date.now(),
            });
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      }

      // Observe navigation timings
      if (PerformanceObserver.supportedEntryTypes.includes('navigation')) {
        const navObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'page-load-time',
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              unit: 'ms',
              timestamp: Date.now(),
              metadata: {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                firstByte: navEntry.responseStart - navEntry.fetchStart,
                domComplete: navEntry.domComplete - navEntry.fetchStart,
              }
            });
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      }

      // Observe resource timings
      if (PerformanceObserver.supportedEntryTypes.includes('resource')) {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.name.includes('api') || resourceEntry.name.includes('supabase')) {
              this.recordMetric({
                name: 'api-request-time',
                value: resourceEntry.responseEnd - resourceEntry.requestStart,
                unit: 'ms',
                timestamp: Date.now(),
                metadata: {
                  url: resourceEntry.name,
                  size: resourceEntry.transferSize,
                  type: resourceEntry.initiatorType,
                }
              });
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      }

      // Observe layout shifts (CLS)
      if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          if (clsValue > 0) {
            this.recordMetric({
              name: 'cumulative-layout-shift',
              value: clsValue,
              unit: 'count',
              timestamp: Date.now(),
            });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      }

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  // Record a performance metric
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to avoid memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance: ${metric.name} = ${metric.value}${metric.unit}`);
    }
  }

  // Record component performance
  recordComponentMetric(componentName: string, type: 'mount' | 'render' | 'fetch' | 'error', value?: number) {
    const existing = this.componentMetrics.get(componentName) || {
      componentName,
      mountTime: 0,
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      errorCount: 0,
    };

    const now = performance.now();

    switch (type) {
      case 'mount':
        existing.mountTime = now;
        break;
      case 'render':
        existing.renderCount++;
        existing.lastRenderTime = now;
        if (value) {
          existing.averageRenderTime = 
            (existing.averageRenderTime * (existing.renderCount - 1) + value) / existing.renderCount;
        }
        break;
      case 'fetch':
        if (value) existing.dataFetchTime = value;
        break;
      case 'error':
        existing.errorCount++;
        break;
    }

    this.componentMetrics.set(componentName, existing);
  }

  // Get performance summary
  getPerformanceSummary() {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes

    const summary = {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      components: Array.from(this.componentMetrics.values()),
      averagePageLoad: this.getAverageMetric('page-load-time'),
      averageApiResponse: this.getAverageMetric('api-request-time'),
      cumulativeLayoutShift: this.getLatestMetric('cumulative-layout-shift'),
      firstPaint: this.getLatestMetric('first-paint'),
      firstContentfulPaint: this.getLatestMetric('first-contentful-paint'),
      memoryUsage: this.getMemoryUsage(),
    };

    return summary;
  }

  private getAverageMetric(name: string): number {
    const metrics = this.metrics.filter(m => m.name === name && Date.now() - m.timestamp < 300000);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  private getLatestMetric(name: string): number {
    const metric = this.metrics.filter(m => m.name === name).pop();
    return metric?.value || 0;
  }

  private getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  // Export metrics for external analysis
  exportMetrics() {
    return {
      metrics: this.metrics,
      components: Array.from(this.componentMetrics.entries()),
      summary: this.getPerformanceSummary(),
      timestamp: new Date().toISOString(),
    };
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const renderStartTime = React.useRef<number>();
  const mountTime = React.useRef<number>();

  // Track mount time
  React.useEffect(() => {
    mountTime.current = performance.now();
    performanceMonitor.recordComponentMetric(componentName, 'mount');

    return () => {
      // Component unmount cleanup
      const lifetime = performance.now() - (mountTime.current || 0);
      performanceMonitor.recordMetric({
        name: `component-lifetime-${componentName}`,
        value: lifetime,
        unit: 'ms',
        timestamp: Date.now(),
      });
    };
  }, [componentName]);

  // Track render performance
  React.useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitor.recordComponentMetric(componentName, 'render', renderTime);
    }
  });

  const startRender = React.useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const recordDataFetch = React.useCallback((fetchTime: number) => {
    performanceMonitor.recordComponentMetric(componentName, 'fetch', fetchTime);
  }, [componentName]);

  const recordError = React.useCallback(() => {
    performanceMonitor.recordComponentMetric(componentName, 'error');
  }, [componentName]);

  const recordCustomMetric = React.useCallback((name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms') => {
    performanceMonitor.recordMetric({
      name: `${componentName}-${name}`,
      value,
      unit,
      timestamp: Date.now(),
    });
  }, [componentName]);

  // Start render timing automatically
  React.useLayoutEffect(() => {
    startRender();
  });

  return {
    startRender,
    recordDataFetch,
    recordError,
    recordCustomMetric,
  };
}

// React hook for performance analytics
export function usePerformanceAnalytics() {
  const [analytics, setAnalytics] = React.useState(() => performanceMonitor.getPerformanceSummary());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(performanceMonitor.getPerformanceSummary());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const exportData = React.useCallback(() => {
    return performanceMonitor.exportMetrics();
  }, []);

  const clearMetrics = React.useCallback(() => {
    performanceMonitor['metrics'] = [];
    performanceMonitor['componentMetrics'].clear();
    setAnalytics(performanceMonitor.getPerformanceSummary());
  }, []);

  return {
    analytics,
    exportData,
    clearMetrics,
  };
}

// Higher-order component for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const WithPerformanceMonitoring = React.forwardRef<any, P>((props, ref) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    const { recordError } = usePerformanceMonitoring(name);

    // Error boundary integration
    React.useEffect(() => {
      const errorHandler = (event: ErrorEvent) => {
        if (event.filename?.includes(name) || event.message?.includes(name)) {
          recordError();
        }
      };

      window.addEventListener('error', errorHandler);
      return () => window.removeEventListener('error', errorHandler);
    }, [name, recordError]);

    return React.createElement(WrappedComponent, { ...props, ref } as any);
  });

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPerformanceMonitoring;
}

// Utility function to measure async operations
export async function measureAsync<T>(
  operation: () => Promise<T>,
  metricName: string
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    performanceMonitor.recordMetric({
      name: metricName,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    performanceMonitor.recordMetric({
      name: `${metricName}-error`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    });
    
    throw error;
  }
}

// Performance debugging component for development
export const PerformanceDebugger: React.FC = () => {
  const { analytics, exportData, clearMetrics } = usePerformanceAnalytics();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-md font-mono max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">Performance Monitor</span>
        <div className="space-x-1">
          <button 
            onClick={() => console.log(exportData())}
            className="bg-blue-600 px-2 py-1 rounded"
          >
            Export
          </button>
          <button 
            onClick={clearMetrics}
            className="bg-red-600 px-2 py-1 rounded"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        <div>Components: {analytics.components.length}</div>
        <div>Avg Page Load: {Math.round(analytics.averagePageLoad)}ms</div>
        <div>Avg API: {Math.round(analytics.averageApiResponse)}ms</div>
        <div>FCP: {Math.round(analytics.firstContentfulPaint)}ms</div>
        <div>CLS: {analytics.cumulativeLayoutShift.toFixed(3)}</div>
        {analytics.memoryUsage && (
          <div>Memory: {Math.round(analytics.memoryUsage.used / 1024 / 1024)}MB</div>
        )}
      </div>
      
      <div className="mt-2 space-y-1">
        {analytics.components.slice(0, 3).map(comp => (
          <div key={comp.componentName} className="flex justify-between">
            <span className="truncate">{comp.componentName}</span>
            <span>{Math.round(comp.averageRenderTime)}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default performanceMonitor;
