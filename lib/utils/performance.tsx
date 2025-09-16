import React, { useEffect, useRef, useCallback, useState } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentName: string;
  props?: Record<string, any>;
  timestamp: number;
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Limit stored metrics

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && metric.renderTime > 100) {
      console.warn(
        `🐌 Slow render detected: ${metric.componentName} took ${metric.renderTime.toFixed(2)}ms`,
        metric
      );
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageRenderTime(componentName?: string): number {
    const relevantMetrics = componentName 
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics;
    
    if (relevantMetrics.length === 0) return 0;
    
    const totalTime = relevantMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return totalTime / relevantMetrics.length;
  }

  getSlowRenders(threshold: number = 100): PerformanceMetrics[] {
    return this.metrics.filter(m => m.renderTime > threshold);
  }

  clear() {
    this.metrics = [];
  }

  generateReport(): {
    totalRenders: number;
    averageRenderTime: number;
    slowRenders: number;
    memoryStats?: {
      average: number;
      peak: number;
    };
    componentStats: Record<string, {
      renders: number;
      averageTime: number;
      slowRenders: number;
    }>;
  } {
    const totalRenders = this.metrics.length;
    const averageRenderTime = this.getAverageRenderTime();
    const slowRenders = this.getSlowRenders().length;
    
    // Memory statistics
    const memoryMetrics = this.metrics.filter(m => m.memoryUsage !== undefined);
    const memoryStats = memoryMetrics.length > 0 ? {
      average: memoryMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / memoryMetrics.length,
      peak: Math.max(...memoryMetrics.map(m => m.memoryUsage || 0))
    } : undefined;

    // Component-specific statistics
    const componentStats: Record<string, any> = {};
    
    this.metrics.forEach(metric => {
      if (!componentStats[metric.componentName]) {
        componentStats[metric.componentName] = {
          renders: 0,
          totalTime: 0,
          slowRenders: 0
        };
      }
      
      const stats = componentStats[metric.componentName];
      stats.renders++;
      stats.totalTime += metric.renderTime;
      
      if (metric.renderTime > 100) {
        stats.slowRenders++;
      }
    });

    // Calculate averages
    Object.keys(componentStats).forEach(name => {
      const stats = componentStats[name];
      stats.averageTime = stats.totalTime / stats.renders;
      delete stats.totalTime;
    });

    return {
      totalRenders,
      averageRenderTime,
      slowRenders,
      memoryStats,
      componentStats
    };
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string, dependencies?: any[]) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current++;

    // Get memory usage if available
    const memoryUsage = (performance as any).memory 
      ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
      : undefined;

    monitor.addMetric({
      renderTime,
      memoryUsage,
      componentName,
      props: dependencies ? { dependencyCount: dependencies.length } : undefined,
      timestamp: Date.now()
    });
  }, dependencies);

  return {
    renderCount: renderCount.current,
    getAverageRenderTime: () => monitor.getAverageRenderTime(componentName),
    getComponentMetrics: () => monitor.getMetrics().filter(m => m.componentName === componentName)
  };
}

// HOC for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    usePerformanceMonitor(name, [props]);
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Memory usage hook
export function useMemoryMonitor(intervalMs: number = 5000) {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    if (!(performance as any).memory) {
      return; // Memory API not available
    }

    const updateMemoryUsage = () => {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1024 / 1024; // MB
      const total = memory.totalJSHeapSize / 1024 / 1024; // MB
      const percentage = (used / total) * 100;

      setMemoryUsage({ used, total, percentage });

      // Warn about high memory usage
      if (percentage > 80) {
        console.warn(`🚨 High memory usage: ${percentage.toFixed(1)}% (${used.toFixed(1)}MB)`);
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, intervalMs);
    
    return () => clearInterval(interval);
  }, [intervalMs]);

  return memoryUsage;
}

// Bundle size analyzer (development only)
export function analyzeBundleImpact() {
  if (process.env.NODE_ENV !== 'development') return null;

  const getResourceSizes = () => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const scripts = resources.filter(r => r.name.endsWith('.js'));
    const styles = resources.filter(r => r.name.endsWith('.css'));
    
    const totalScriptSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalStyleSize = styles.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    return {
      scripts: {
        count: scripts.length,
        totalSize: totalScriptSize,
        largest: scripts.sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))[0]
      },
      styles: {
        count: styles.length,
        totalSize: totalStyleSize,
        largest: styles.sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))[0]
      }
    };
  };

  return getResourceSizes();
}

// React DevTools Profiler integration
export function useProfiler(id: string, onRender?: (id: string, phase: string, actualDuration: number) => void) {
  const onRenderCallback = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Profiler [${id}]:`, {
        phase,
        actualDuration: actualDuration.toFixed(2) + 'ms',
        baseDuration: baseDuration.toFixed(2) + 'ms'
      });
    }
    
    onRender?.(id, phase, actualDuration);
  }, [onRender]);

  return onRenderCallback;
}

// Performance testing utilities
export const performanceTest = {
  // Measure function execution time
  measureFunction: <T extends any[], R>(
    fn: (...args: T) => R,
    name: string = 'Function'
  ) => {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      console.log(`⚡ ${name} execution time: ${(end - start).toFixed(2)}ms`);
      return result;
    };
  },

  // Measure async function execution time
  measureAsyncFunction: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    name: string = 'Async Function'
  ) => {
    return async (...args: T): Promise<R> => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      
      console.log(`⚡ ${name} execution time: ${(end - start).toFixed(2)}ms`);
      return result;
    };
  },

  // Measure component render time
  measureRender: (renderFn: () => JSX.Element, name: string = 'Component') => {
    const start = performance.now();
    const element = renderFn();
    const end = performance.now();
    
    console.log(`🎨 ${name} render time: ${(end - start).toFixed(2)}ms`);
    return element;
  }
};

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
