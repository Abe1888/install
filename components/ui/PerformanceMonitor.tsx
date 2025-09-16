'use client';

import React, { useState, useEffect, memo, useRef } from 'react';
import { Activity, Clock, Database, Zap, TrendingUp, RefreshCw } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'poor';
  description: string;
}

interface ResourceUsage {
  memory: number;
  timing: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
}

const PerformanceMonitor: React.FC = memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const collectMetrics = () => {
    const newMetrics: PerformanceMetric[] = [];

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
      newMetrics.push({
        name: 'Memory Usage',
        value: memoryUsage,
        unit: '%',
        status: memoryUsage < 70 ? 'good' : memoryUsage < 85 ? 'warning' : 'poor',
        description: 'JavaScript heap memory usage'
      });
    }

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const domContentLoaded = Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart);
      const loadComplete = Math.round(navigation.loadEventEnd - navigation.fetchStart);

      newMetrics.push({
        name: 'DOM Content Loaded',
        value: domContentLoaded,
        unit: 'ms',
        status: domContentLoaded < 1500 ? 'good' : domContentLoaded < 3000 ? 'warning' : 'poor',
        description: 'Time to DOM content loaded'
      });

      newMetrics.push({
        name: 'Page Load Complete',
        value: loadComplete,
        unit: 'ms',
        status: loadComplete < 3000 ? 'good' : loadComplete < 5000 ? 'warning' : 'poor',
        description: 'Total page load time'
      });

      setResourceUsage({
        memory: 'memory' in performance ? Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024)) : 0,
        timing: {
          domContentLoaded,
          loadComplete,
          firstPaint: Math.round(navigation.responseStart - navigation.fetchStart),
          firstContentfulPaint: Math.round(navigation.responseEnd - navigation.fetchStart)
        }
      });
    }

    // Resource timing
    const resources = performance.getEntriesByType('resource');
    const avgResourceTime = resources.length > 0 
      ? Math.round(resources.reduce((sum, resource) => sum + resource.duration, 0) / resources.length)
      : 0;

    if (avgResourceTime > 0) {
      newMetrics.push({
        name: 'Avg Resource Load',
        value: avgResourceTime,
        unit: 'ms',
        status: avgResourceTime < 200 ? 'good' : avgResourceTime < 500 ? 'warning' : 'poor',
        description: 'Average resource loading time'
      });
    }

    // FPS estimation (rough)
    const now = performance.now();
    const fps = Math.round(1000 / (now - (window as any).lastFrameTime || now));
    (window as any).lastFrameTime = now;

    if (fps > 0 && fps < 200) { // Filter out unrealistic values
      newMetrics.push({
        name: 'Frame Rate',
        value: fps,
        unit: 'fps',
        status: fps >= 50 ? 'good' : fps >= 30 ? 'warning' : 'poor',
        description: 'Estimated frames per second'
      });
    }

    // Connection info (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        const effectiveType = connection.effectiveType;
        const connectionScore = ({
          'slow-2g': 1,
          '2g': 2,
          '3g': 3,
          '4g': 4
        } as Record<string, number>)[effectiveType] || 3;

        newMetrics.push({
          name: 'Connection Quality',
          value: connectionScore,
          unit: '/4',
          status: connectionScore >= 3 ? 'good' : connectionScore >= 2 ? 'warning' : 'poor',
          description: `Network: ${effectiveType}`
        });
      }
    }

    setMetrics(newMetrics);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    collectMetrics();
    intervalRef.current = setInterval(collectMetrics, 2000);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    // Initial collection
    collectMetrics();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'poor':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'poor':
        return <Activity className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const overallStatus = metrics.length > 0 
    ? metrics.some(m => m.status === 'poor') 
      ? 'poor' 
      : metrics.some(m => m.status === 'warning') 
        ? 'warning' 
        : 'good'
    : 'good';

  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
              overallStatus === 'good' ? 'bg-green-600' :
              overallStatus === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
            }`}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Performance Monitor</h3>
              <p className="text-sm text-slate-600">Real-time application performance metrics</p>
            </div>
          </div>
          
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`btn-secondary flex items-center space-x-2 ${
              isMonitoring ? 'bg-red-50 text-red-700 border-red-200' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isMonitoring ? 'animate-spin' : ''}`} />
            <span>{isMonitoring ? 'Stop Monitor' : 'Start Monitor'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Overall Status */}
        <div className={`rounded-lg p-4 mb-6 border ${getStatusColor(overallStatus)}`}>
          <div className="flex items-center space-x-3">
            {getStatusIcon(overallStatus)}
            <div>
              <h4 className="text-base font-semibold">
                Performance Status: {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
              </h4>
              <p className="text-sm opacity-75">
                {overallStatus === 'good' 
                  ? 'Application is performing well'
                  : overallStatus === 'warning'
                    ? 'Some performance issues detected'
                    : 'Performance issues need attention'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 border ${getStatusColor(metric.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{metric.name}</span>
                {getStatusIcon(metric.status)}
              </div>
              
              <div className="text-2xl font-bold mb-1">
                {metric.value}{metric.unit}
              </div>
              
              <p className="text-xs opacity-75">{metric.description}</p>
            </div>
          ))}
        </div>

        {/* Resource Usage Details */}
        {resourceUsage && (
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-4">Resource Usage Details</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Database className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Memory</span>
                </div>
                <div className="text-lg font-semibold text-slate-900">{resourceUsage.memory} MB</div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">DOM Ready</span>
                </div>
                <div className="text-lg font-semibold text-slate-900">{resourceUsage.timing.domContentLoaded}ms</div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Activity className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Load Complete</span>
                </div>
                <div className="text-lg font-semibold text-slate-900">{resourceUsage.timing.loadComplete}ms</div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">First Paint</span>
                </div>
                <div className="text-lg font-semibold text-slate-900">{resourceUsage.timing.firstPaint}ms</div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tips */}
        <div className="border-t border-slate-200 pt-6 mt-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Performance Tips</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <h5 className="font-medium text-slate-700 mb-1">Good Performance:</h5>
              <ul className="space-y-1 text-xs">
                <li>• DOM load time under 1.5s</li>
                <li>• Memory usage below 70%</li>
                <li>• Frame rate above 50 FPS</li>
                <li>• Resource load time under 200ms</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-slate-700 mb-1">Optimization:</h5>
              <ul className="space-y-1 text-xs">
                <li>• Use browser caching</li>
                <li>• Minimize JavaScript bundles</li>
                <li>• Optimize images and assets</li>
                <li>• Enable compression</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;