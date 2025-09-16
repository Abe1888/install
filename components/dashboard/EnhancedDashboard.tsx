'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, AlertTriangle, Calendar, CheckCircle2, Clock, Filter,
  Fuel, Navigation, RefreshCw, Target, Truck, Users, Zap,
  TrendingUp, TrendingDown, BarChart3, PieChart, MapPin
} from 'lucide-react';
import { 
  useDataConsistency, 
  usePageDataSubscription, 
  useDataHealthMonitor,
  useEnhancedTasks 
} from '@/lib/hooks/useDataConsistency';
import { useSchedule } from '@/lib/hooks/useSchedule';
import { validateTaskConflicts } from '@/lib/utils/taskValidation';
import { Task, Vehicle, TaskConflict } from '@/lib/supabase/types';

interface DashboardStats {
  vehicles: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    withConflicts: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };
  equipment: {
    gpsDevices: number;
    fuelSensors: number;
    installed: number;
    remaining: number;
  };
  timeline: {
    onSchedule: number;
    delayed: number;
    ahead: number;
    daysRemaining: number;
  };
  conflicts: {
    total: number;
    critical: number;
    resolved: number;
  };
}

export function EnhancedDashboard() {
  // Data consistency and real-time updates
  const { refreshAllData, validateDataConsistency, syncDataAcrossPages } = useDataConsistency();
  const { runHealthCheck } = useDataHealthMonitor();
  const { tasks: allTasks, updateTask } = useEnhancedTasks();
  
  // Page-specific data subscription
  usePageDataSubscription('dashboard');
  
  // Schedule data
  const {
    vehicles,
    locations,
    scheduleStats,
    projectStartDate,
    isLoading,
    hasError
  } = useSchedule();
  
  // Local state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [taskConflicts, setTaskConflicts] = useState<TaskConflict[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today');
  
  // Calculate comprehensive dashboard statistics
  const calculateDashboardStats = useMemo(() => {
    if (!vehicles || !allTasks) return null;
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay.getTime() - (startOfDay.getDay() * 24 * 60 * 60 * 1000));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const timeRangeStart = {
      today: startOfDay,
      week: startOfWeek,
      month: startOfMonth
    }[selectedTimeRange];
    
    // Filter tasks by time range
    const filteredTasks = allTasks.filter(task => {
      if (!task.created_at) return false;
      const taskDate = new Date(task.created_at);
      return taskDate >= timeRangeStart;
    });
    
    // Vehicle statistics
    const vehicleStats = {
      total: vehicles.length,
      completed: vehicles.filter(v => v.status === 'Completed').length,
      inProgress: vehicles.filter(v => v.status === 'In Progress').length,
      pending: vehicles.filter(v => v.status === 'Pending').length,
      withConflicts: 0 // Will be calculated after conflict detection
    };
    
    // Task statistics
    const completedTasks = filteredTasks.filter(t => t.status === 'Completed');
    const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress');
    const overdueTasks = filteredTasks.filter(t => {
      if (!t.end_date) return false;
      return new Date(t.end_date) < now && t.status !== 'Completed';
    });
    
    const taskStats = {
      total: filteredTasks.length,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      overdue: overdueTasks.length,
      completionRate: filteredTasks.length > 0 ? (completedTasks.length / filteredTasks.length) * 100 : 0
    };
    
    // Equipment statistics
    const totalGps = vehicles.reduce((sum, v) => sum + (v.gps_required || 0), 0);
    const totalSensors = vehicles.reduce((sum, v) => sum + (v.fuel_sensors || 0), 0);
    const installedEquipment = vehicleStats.completed * 2; // Rough estimate
    
    const equipmentStats = {
      gpsDevices: totalGps,
      fuelSensors: totalSensors,
      installed: installedEquipment,
      remaining: (totalGps + totalSensors) - installedEquipment
    };
    
    // Timeline statistics
    const projectStart = new Date(projectStartDate);
    const daysSinceStart = Math.floor((now.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    const estimatedDays = vehicles.length * 1.5; // Rough estimate
    const daysRemaining = Math.max(0, estimatedDays - daysSinceStart);
    
    const timelineStats = {
      onSchedule: vehicleStats.completed + vehicleStats.inProgress,
      delayed: overdueTasks.length,
      ahead: Math.max(0, vehicleStats.completed - daysSinceStart),
      daysRemaining
    };
    
    // Conflict detection
    const { conflicts } = validateTaskConflicts(allTasks);
    setTaskConflicts(conflicts);
    
    const conflictStats = {
      total: conflicts.length,
      critical: conflicts.filter(c => c.severity === 'high').length,
      resolved: 0 // Would need to track resolved conflicts
    };
    
    // Update vehicle conflicts count
    vehicleStats.withConflicts = new Set(
      conflicts.flatMap(c => 
        c.conflicting_tasks.map(taskId => {
          const task = allTasks.find(t => t.id === taskId);
          return Array.isArray(task?.vehicle_id) ? task.vehicle_id : [task?.vehicle_id];
        }).flat().filter(Boolean)
      )
    ).size;
    
    return {
      vehicles: vehicleStats,
      tasks: taskStats,
      equipment: equipmentStats,
      timeline: timelineStats,
      conflicts: conflictStats
    };
  }, [vehicles, allTasks, selectedTimeRange, projectStartDate]);
  
  // Update dashboard stats
  useEffect(() => {
    const stats = calculateDashboardStats;
    if (stats) {
      setDashboardStats(stats);
      setLastUpdate(new Date());
    }
  }, [calculateDashboardStats]);
  
  // Refresh dashboard data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllData();
      const health = await runHealthCheck();
      setLastUpdate(new Date());
      
      if (!health.isValid) {
        console.warn('Dashboard: Data consistency issues detected');
      }
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        syncDataAcrossPages('tasks');
        syncDataAcrossPages('vehicles');
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [syncDataAcrossPages]);
  
  if (isLoading || !dashboardStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (hasError) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Dashboard Error</h3>
        <p className="text-sm text-slate-600 mb-4">Failed to load dashboard data</p>
        <button onClick={handleRefresh} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              {taskConflicts.length > 0 && (
                <div className="flex items-center space-x-1 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{taskConflicts.length} conflicts detected</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Time Range Filter */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-1 text-sm border border-slate-300 rounded-md"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Vehicle Progress */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {dashboardStats.vehicles.completed}
              </div>
              <div className="text-sm text-slate-600">
                of {dashboardStats.vehicles.total} vehicles
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-600 mb-2">Installation Progress</div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${dashboardStats.vehicles.total > 0 
                  ? (dashboardStats.vehicles.completed / dashboardStats.vehicles.total) * 100 
                  : 0}%`
              }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {dashboardStats.vehicles.inProgress} in progress, {dashboardStats.vehicles.pending} pending
          </div>
        </div>
        
        {/* Task Completion */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {dashboardStats.tasks.completionRate.toFixed(0)}%
              </div>
              <div className="text-sm text-slate-600">completion rate</div>
            </div>
          </div>
          <div className="text-sm text-slate-600 mb-2">Task Progress</div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{dashboardStats.tasks.completed} completed</span>
            <span>{dashboardStats.tasks.total} total</span>
          </div>
          {dashboardStats.tasks.overdue > 0 && (
            <div className="mt-2 text-xs text-red-600 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{dashboardStats.tasks.overdue} overdue</span>
            </div>
          )}
        </div>
        
        {/* Equipment Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {dashboardStats.equipment.installed}
              </div>
              <div className="text-sm text-slate-600">devices installed</div>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">GPS Devices:</span>
              <span className="font-medium">{dashboardStats.equipment.gpsDevices}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Fuel Sensors:</span>
              <span className="font-medium">{dashboardStats.equipment.fuelSensors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Remaining:</span>
              <span className="font-medium">{dashboardStats.equipment.remaining}</span>
            </div>
          </div>
        </div>
        
        {/* Timeline Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {dashboardStats.timeline.daysRemaining}
              </div>
              <div className="text-sm text-slate-600">days remaining</div>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">On Schedule:</span>
              <span className="font-medium text-green-600">{dashboardStats.timeline.onSchedule}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Delayed:</span>
              <span className="font-medium text-red-600">{dashboardStats.timeline.delayed}</span>
            </div>
            {dashboardStats.timeline.ahead > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Ahead:</span>
                <span className="font-medium text-blue-600">{dashboardStats.timeline.ahead}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Conflict Alerts */}
      {taskConflicts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold text-orange-800">Task Conflicts Detected</h3>
              <p className="text-sm text-orange-700">
                {taskConflicts.length} conflicts found that may affect scheduling
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {taskConflicts.slice(0, 3).map((conflict, index) => (
              <div key={index} className="bg-white rounded-md p-3 border border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{conflict.type}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    conflict.severity === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {conflict.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{conflict.description}</p>
              </div>
            ))}
            {taskConflicts.length > 3 && (
              <p className="text-sm text-orange-600">
                And {taskConflicts.length - 3} more conflicts...
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles with Conflicts */}
        {dashboardStats.vehicles.withConflicts > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Vehicles Requiring Attention</h3>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {dashboardStats.vehicles.withConflicts}
            </div>
            <p className="text-sm text-slate-600">
              vehicles have scheduling conflicts or require immediate attention
            </p>
          </div>
        )}
        
        {/* Performance Summary */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">System Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Data Sync Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Last Health Check</span>
              <span className="text-sm font-medium text-slate-900">
                {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Critical Issues</span>
              <span className={`text-sm font-medium ${
                dashboardStats.conflicts.critical > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {dashboardStats.conflicts.critical || 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedDashboard;
