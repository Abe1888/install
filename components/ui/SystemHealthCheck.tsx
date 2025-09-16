'use client';

import React, { useState, useEffect, memo } from 'react';
import { 
  Database, CheckCircle2, AlertTriangle, RefreshCw, Wifi, 
  Server, Activity, Clock, Users, Truck, Target, Settings 
} from 'lucide-react';
import { testConnection } from '@/lib/supabase/client';
import { useVehiclesOptimized, useLocationsOptimized, useTeamMembersOptimized, useTasksOptimized } from '@/lib/hooks/useOptimizedSWR';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: string;
  responseTime?: number;
}

const SystemHealthCheck: React.FC = memo(() => {
  const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Hook into data fetching for health monitoring
  const { data: vehicles, error: vehiclesError } = useVehiclesOptimized();
  const { data: locations, error: locationsError } = useLocationsOptimized();
  const { data: teamMembers, error: teamError } = useTeamMembersOptimized();
  const { data: tasks, error: tasksError } = useTasksOptimized();

  const runHealthCheck = async () => {
    setIsRunning(true);
    const results: HealthCheckResult[] = [];
    const startTime = Date.now();

    try {
      // Database Connection Test
      const dbStart = Date.now();
      const dbConnected = await testConnection();
      const dbTime = Date.now() - dbStart;
      
      results.push({
        component: 'Database Connection',
        status: dbConnected ? 'healthy' : 'error',
        message: dbConnected ? 'Connected successfully' : 'Connection failed',
        responseTime: dbTime
      });

      // Data Integrity Tests
      results.push({
        component: 'Vehicle Data',
        status: vehiclesError ? 'error' : vehicles?.length ? 'healthy' : 'warning',
        message: vehiclesError 
          ? 'Failed to load vehicles' 
          : vehicles?.length 
            ? `${vehicles.length} vehicles loaded` 
            : 'No vehicle data',
        details: vehiclesError ? String(vehiclesError) : undefined
      });

      results.push({
        component: 'Location Data',
        status: locationsError ? 'error' : locations?.length ? 'healthy' : 'warning',
        message: locationsError 
          ? 'Failed to load locations' 
          : locations?.length 
            ? `${locations.length} locations loaded` 
            : 'No location data',
        details: locationsError ? String(locationsError) : undefined
      });

      results.push({
        component: 'Team Data',
        status: teamError ? 'error' : teamMembers?.length ? 'healthy' : 'warning',
        message: teamError 
          ? 'Failed to load team members' 
          : teamMembers?.length 
            ? `${teamMembers.length} team members loaded` 
            : 'No team data',
        details: teamError ? String(teamError) : undefined
      });

      results.push({
        component: 'Task Data',
        status: tasksError ? 'error' : 'healthy',
        message: tasksError 
          ? 'Failed to load tasks' 
          : `${tasks?.length || 0} tasks loaded`,
        details: tasksError ? String(tasksError) : undefined
      });

      // API Response Time Test
      const totalTime = Date.now() - startTime;
      results.push({
        component: 'System Performance',
        status: totalTime < 2000 ? 'healthy' : totalTime < 5000 ? 'warning' : 'error',
        message: `Health check completed in ${totalTime}ms`,
        responseTime: totalTime
      });

      // Data Consistency Checks
      if (vehicles && locations) {
        const vehicleLocations = new Set(vehicles.map(v => v.location));
        const definedLocations = new Set(locations.map(l => l.name));
        const missingLocations = Array.from(vehicleLocations).filter(loc => !definedLocations.has(loc));
        
        results.push({
          component: 'Data Consistency',
          status: missingLocations.length === 0 ? 'healthy' : 'warning',
          message: missingLocations.length === 0 
            ? 'All vehicle locations are properly defined' 
            : `${missingLocations.length} undefined locations found`,
          details: missingLocations.length > 0 ? `Missing: ${missingLocations.join(', ')}` : undefined
        });
      }

    } catch (error) {
      results.push({
        component: 'Health Check System',
        status: 'error',
        message: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setHealthResults(results);
    setLastCheck(new Date());
    setIsRunning(false);
  };

  useEffect(() => {
    // Run initial health check
    runHealthCheck();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const overallStatus = healthResults.some(r => r.status === 'error') 
    ? 'error' 
    : healthResults.some(r => r.status === 'warning') 
      ? 'warning' 
      : 'healthy';

  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
              overallStatus === 'healthy' ? 'bg-green-600' :
              overallStatus === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
            }`}>
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">System Health Check</h3>
              <p className="text-sm text-slate-600">
                {lastCheck ? `Last checked: ${lastCheck.toLocaleTimeString()}` : 'Running initial check...'}
              </p>
            </div>
          </div>
          
          <button
            onClick={runHealthCheck}
            disabled={isRunning}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Checking...' : 'Run Check'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Overall Status */}
        <div className={`rounded-lg p-4 mb-6 border ${getStatusColor(overallStatus)}`}>
          <div className="flex items-center space-x-3">
            {getStatusIcon(overallStatus)}
            <div>
              <h4 className="text-base font-semibold text-slate-900">
                System Status: {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
              </h4>
              <p className="text-sm text-slate-600">
                {overallStatus === 'healthy' 
                  ? 'All systems are operating normally'
                  : overallStatus === 'warning'
                    ? 'Some components need attention'
                    : 'Critical issues detected'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-700">Component Status</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthResults.map((result, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="text-sm font-medium text-slate-900">
                      {result.component}
                    </span>
                  </div>
                  {result.responseTime && (
                    <span className="text-xs text-slate-500">
                      {result.responseTime}ms
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-slate-700 mb-1">{result.message}</p>
                
                {result.details && (
                  <p className="text-xs text-slate-600 bg-white bg-opacity-50 rounded p-2">
                    {result.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reload App
            </button>
            <button
              onClick={() => localStorage.clear()}
              className="btn-secondary text-xs"
            >
              <Database className="w-3 h-3 mr-1" />
              Clear Cache
            </button>
            <button
              onClick={() => console.log('Health Results:', healthResults)}
              className="btn-secondary text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              Export Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

SystemHealthCheck.displayName = 'SystemHealthCheck';

export default SystemHealthCheck;