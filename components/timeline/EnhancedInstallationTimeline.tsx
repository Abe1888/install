'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, Truck, Navigation, Fuel, CheckCircle2, 
  AlertTriangle, Activity, Target, RefreshCw, Filter, Search, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2,
  Users, Zap, ArrowRight, MoreHorizontal
} from 'lucide-react';
import { 
  useDataConsistency, 
  usePageDataSubscription, 
  useEnhancedTasks 
} from '@/lib/hooks/useDataConsistency';
import { useSchedule } from '@/lib/hooks/useSchedule';
import { validateTaskConflicts } from '@/lib/utils/taskValidation';
import { calculateDateForDay } from '@/lib/utils/projectUtils';
import { Task, Vehicle } from '@/lib/supabase/types';

interface TimelineEvent {
  id: string;
  date: Date;
  vehicleId: string;
  vehicleName: string;
  location: string;
  status: 'completed' | 'in_progress' | 'pending' | 'delayed';
  tasks: Task[];
  conflictCount: number;
  equipmentCount: {
    gps: number;
    sensors: number;
  };
  estimatedDuration: number; // in hours
  actualDuration?: number;
  assignedTeam?: string[];
}

interface TimelineViewConfig {
  scale: 'day' | 'week' | 'month';
  showConflicts: boolean;
  showTasks: boolean;
  showTeamAssignments: boolean;
  compactMode: boolean;
}

export function EnhancedInstallationTimeline() {
  // Data consistency and real-time updates
  const { syncDataAcrossPages, refreshTaskData } = useDataConsistency();
  const { tasks: allTasks, updateTask } = useEnhancedTasks();
  
  // Page-specific data subscription
  usePageDataSubscription('timeline');
  
  // Schedule data
  const {
    vehicles,
    locations,
    projectStartDate,
    isLoading,
    hasError,
    refetchVehicles
  } = useSchedule();
  
  // Local state
  const [viewConfig, setViewConfig] = useState<TimelineViewConfig>({
    scale: 'week',
    showConflicts: true,
    showTasks: false,
    showTeamAssignments: false,
    compactMode: false
  });
  
  const [selectedDateRange, setSelectedDateRange] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const endOfWeek = new Date(startOfWeek.getTime() + (6 * 24 * 60 * 60 * 1000));
    return { start: startOfWeek, end: endOfWeek };
  });
  
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conflictingEvents, setConflictingEvents] = useState<string[]>([]);
  
  // Generate timeline events from vehicles and tasks
  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!vehicles || !projectStartDate) return [];
    
    return vehicles.map(vehicle => {
      const installationDate = calculateDateForDay(projectStartDate, vehicle.day);
      const vehicleTasks = allTasks.filter(task => 
        Array.isArray(task.vehicle_id) 
          ? task.vehicle_id.includes(vehicle.id)
          : task.vehicle_id === vehicle.id
      );
      
      // Check for conflicts
      const { conflicts } = validateTaskConflicts(vehicleTasks);
      const vehicleConflicts = conflicts.filter(conflict => 
        conflict.conflicting_tasks.some(taskId => 
          vehicleTasks.some(task => task.id === taskId)
        )
      );
      
      // Determine status based on vehicle status and tasks
      let status: TimelineEvent['status'] = 'pending';
      if (vehicle.status === 'Completed') {
        status = 'completed';
      } else if (vehicle.status === 'In Progress') {
        status = 'in_progress';
      } else if (vehicleConflicts.length > 0 || 
                 vehicleTasks.some(task => task.end_date && new Date(task.end_date) < new Date())) {
        status = 'delayed';
      }
      
      // Estimate duration based on equipment and task complexity
      const baseDuration = 4; // 4 hours base
      const equipmentMultiplier = ((vehicle.gps_required || 0) + (vehicle.fuel_sensors || 0)) * 0.5;
      const taskMultiplier = vehicleTasks.length * 0.25;
      const estimatedDuration = baseDuration + equipmentMultiplier + taskMultiplier;
      
      // Get actual duration if completed (simplified since we don't have completed_at)
      let actualDuration: number | undefined;
      if (status === 'completed' && vehicleTasks.length > 0) {
        // Use estimated duration as fallback since we don't have actual completion times
        actualDuration = estimatedDuration;
      }
      
      return {
        id: vehicle.id,
        date: new Date(installationDate),
        vehicleId: vehicle.id,
        vehicleName: vehicle.id,
        location: vehicle.location,
        status,
        tasks: vehicleTasks,
        conflictCount: vehicleConflicts.length,
        equipmentCount: {
          gps: vehicle.gps_required || 0,
          sensors: vehicle.fuel_sensors || 0
        },
        estimatedDuration,
        actualDuration,
        assignedTeam: vehicleTasks
          .filter(task => task.assigned_to)
          .flatMap(task => Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to])
          .filter((assignee, index, arr) => arr.indexOf(assignee) === index) // Unique assignees
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [vehicles, allTasks, projectStartDate]);
  
  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let filtered = timelineEvents.filter(event => {
      // Date range filter
      if (event.date < selectedDateRange.start || event.date > selectedDateRange.end) {
        return false;
      }
      
      // Vehicle type filter
      if (selectedVehicleTypes.length > 0) {
        const vehicle = vehicles?.find(v => v.id === event.vehicleId);
        if (!vehicle || !selectedVehicleTypes.includes(vehicle.type)) {
          return false;
        }
      }
      
      // Location filter
      if (selectedLocations.length > 0 && !selectedLocations.includes(event.location)) {
        return false;
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!event.vehicleName.toLowerCase().includes(searchLower) &&
            !event.location.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Update conflicting events
    const conflictIds = filtered
      .filter(event => event.conflictCount > 0)
      .map(event => event.id);
    setConflictingEvents(conflictIds);
    
    return filtered;
  }, [timelineEvents, selectedDateRange, selectedVehicleTypes, selectedLocations, searchTerm, vehicles]);
  
  // Navigate date range
  const navigateDateRange = useCallback((direction: 'prev' | 'next') => {
    const { scale } = viewConfig;
    const multiplier = direction === 'next' ? 1 : -1;
    
    let daysToMove = 1;
    if (scale === 'week') daysToMove = 7;
    else if (scale === 'month') daysToMove = 30;
    
    const msToMove = daysToMove * 24 * 60 * 60 * 1000 * multiplier;
    
    setSelectedDateRange(prev => ({
      start: new Date(prev.start.getTime() + msToMove),
      end: new Date(prev.end.getTime() + msToMove)
    }));
  }, [viewConfig.scale]);
  
  // Refresh timeline data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchVehicles(),
        refreshTaskData()
      ]);
      syncDataAcrossPages('vehicles');
      syncDataAcrossPages('tasks');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchVehicles, refreshTaskData, syncDataAcrossPages]);
  
  // Update task status
  const handleTaskStatusUpdate = useCallback(async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { 
        status: newStatus as Task['status']
      });
      syncDataAcrossPages('tasks');
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }, [updateTask, syncDataAcrossPages]);
  
  // Get status color classes
  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'delayed':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'delayed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (hasError) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Timeline Error</h3>
        <p className="text-sm text-slate-600 mb-4">Failed to load timeline data</p>
        <button onClick={handleRefresh} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Installation Timeline</h1>
            <p className="text-sm text-slate-600">
              {filteredEvents.length} installations • {conflictingEvents.length} conflicts
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Filters & View Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search vehicles or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            
            <div className="flex space-x-2">
              <select
                multiple
                value={selectedLocations}
                onChange={(e) => setSelectedLocations(Array.from(e.target.selectedOptions, option => option.value))}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md"
                size={3}
              >
                {locations?.map(location => (
                  <option key={location.name} value={location.name}>{location.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Date Navigation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateDateRange('prev')}
                className="p-2 hover:bg-slate-100 rounded-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="text-center">
                <div className="text-sm font-medium text-slate-900">
                  {selectedDateRange.start.toLocaleDateString()} - {selectedDateRange.end.toLocaleDateString()}
                </div>
              </div>
              
              <button
                onClick={() => navigateDateRange('next')}
                className="p-2 hover:bg-slate-100 rounded-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex space-x-1">
              {(['day', 'week', 'month'] as const).map(scale => (
                <button
                  key={scale}
                  onClick={() => setViewConfig(prev => ({ ...prev, scale }))}
                  className={`flex-1 px-3 py-1 text-sm rounded-md capitalize ${
                    viewConfig.scale === scale
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>
          
          {/* View Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-900">View Options</div>
            <div className="space-y-2">
              {[
                { key: 'showConflicts', label: 'Show Conflicts' },
                { key: 'showTasks', label: 'Show Tasks' },
                { key: 'showTeamAssignments', label: 'Show Team' },
                { key: 'compactMode', label: 'Compact Mode' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={viewConfig[key as keyof TimelineViewConfig] as boolean}
                    onChange={(e) => setViewConfig(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                  />
                  <span className="text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline Events */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Installation Schedule
          </h3>
        </div>
        
        <div className="p-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Installations Found</h3>
              <p className="text-sm text-slate-600">
                No installations match your current filters and date range.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    event.conflictCount > 0 ? 'border-orange-300 bg-orange-50/50' : 'border-slate-200'
                  } ${viewConfig.compactMode ? 'p-3' : 'p-4'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    {/* Event Header */}
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded-full border text-sm font-medium ${getStatusColor(event.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(event.status)}
                          <span className="capitalize">{event.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900">{event.vehicleName}</h4>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{event.date.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              ~{event.estimatedDuration.toFixed(1)}h
                              {event.actualDuration && (
                                <span className="ml-1 text-slate-400">
                                  (actual: {event.actualDuration.toFixed(1)}h)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Conflict Badge */}
                    {viewConfig.showConflicts && event.conflictCount > 0 && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 rounded-md">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span className="text-xs font-medium text-red-700">
                          {event.conflictCount} conflict{event.conflictCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Equipment Info */}
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1 text-sm text-slate-600">
                      <Navigation className="w-4 h-4 text-blue-500" />
                      <span>{event.equipmentCount.gps} GPS</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-slate-600">
                      <Fuel className="w-4 h-4 text-green-500" />
                      <span>{event.equipmentCount.sensors} Sensors</span>
                    </div>
                    {event.tasks.length > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-slate-600">
                        <Zap className="w-4 h-4 text-purple-500" />
                        <span>{event.tasks.length} tasks</span>
                      </div>
                    )}
                    {viewConfig.showTeamAssignments && event.assignedTeam && event.assignedTeam.length > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-orange-500" />
                        <span>{event.assignedTeam.length} assigned</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Task List */}
                  {viewConfig.showTasks && event.tasks.length > 0 && (
                    <div className="border-t border-slate-200 pt-3">
                      <div className="space-y-2">
                        {event.tasks.slice(0, 3).map(task => (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${
                                task.status === 'Completed' ? 'bg-green-500' :
                                task.status === 'In Progress' ? 'bg-blue-500' :
                                'bg-slate-400'
                              }`}></span>
                              <span className="text-sm font-medium text-slate-900">{task.name}</span>
                            </div>
                            {task.status !== 'Completed' && (
                              <button
                                onClick={() => handleTaskStatusUpdate(task.id, 
                                  task.status === 'In Progress' ? 'Completed' : 'In Progress'
                                )}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                              >
                                {task.status === 'In Progress' ? 'Complete' : 'Start'}
                              </button>
                            )}
                          </div>
                        ))}
                        {event.tasks.length > 3 && (
                          <div className="text-xs text-slate-500 text-center">
                            +{event.tasks.length - 3} more tasks
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedInstallationTimeline;
