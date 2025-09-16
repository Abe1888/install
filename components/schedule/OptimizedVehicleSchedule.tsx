'use client';

import React, { useState, memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Truck, Navigation, Fuel, CheckCircle2, AlertTriangle, 
  Activity, Target, RefreshCw, Filter, Search, Loader2, ChevronDown, ChevronUp,
  Zap, Users
} from 'lucide-react';
import { useSchedule } from '@/lib/hooks/useSchedule'
import { db } from '@/lib/supabase/database'
import { Vehicle, Task } from '@/lib/supabase/types'
import { calculateDateForDay } from '@/lib/utils/projectUtils'
import { useDataConsistency, useEnhancedTasks } from '@/lib/hooks/useDataConsistency'
import { validateTask, validateTaskConflicts } from '@/lib/utils/taskValidation'
import dynamic from 'next/dynamic'
// import { FixedSizeList as List } from 'react-window' // TODO: Add virtualization when needed

// Lazy load the heavy VehicleTaskManager component
const VehicleTaskManager = dynamic(() => import('./VehicleTaskManager'), {
  loading: () => <div className="animate-pulse bg-slate-100 h-20 rounded-md"></div>,
  ssr: false,
});

const VehicleSchedule = memo(() => {
  // Enhanced data consistency and task management
  const { syncDataAcrossPages, refreshTaskData } = useDataConsistency()
  const { tasks: allTasks, updateTask, createTask } = useEnhancedTasks()
  
  // Use unified schedule hook for better performance
  const {
    vehicles,
    locations,
    scheduleStats,
    uniqueDays,
    projectStartDate,
    isLoading: loading,
    hasError: vehiclesError,
    refetchVehicles: refetch,
    getStatusIcon,
    getStatusColor,
    getFilteredVehicles,
    getVehicleInstallationDate
  } = useSchedule()
  
  // Local state
  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'day' | 'location' | 'status' | 'type'>('day')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [taskConflicts, setTaskConflicts] = useState<Array<any>>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  // Toggle vehicle expansion for task management
  const toggleVehicleExpansion = useCallback((vehicleId: string) => {
    const newExpanded = new Set(expandedVehicles)
    if (expandedVehicles.has(vehicleId)) {
      newExpanded.delete(vehicleId)
    } else {
      newExpanded.add(vehicleId)
    }
    setExpandedVehicles(newExpanded)
  }, [expandedVehicles])

  // Enhanced status update with task conflict validation and real-time sync
  const updateVehicleStatus = useCallback(async (vehicleId: string, status: Vehicle['status']) => {
    try {
      // Validate task conflicts before status update
      const vehicleTasks = allTasks.filter(task => 
        Array.isArray(task.vehicle_id) ? task.vehicle_id.includes(vehicleId) : task.vehicle_id === vehicleId
      )
      
      if (status === 'In Progress' && vehicleTasks.length > 0) {
        const { conflicts } = validateTaskConflicts(vehicleTasks)
        if (conflicts.length > 0) {
          console.warn('⚠️ Task conflicts detected for vehicle:', vehicleId, conflicts)
          setTaskConflicts(conflicts)
        }
      }
      
      // Direct database update with optimistic UI
      const { error } = await db.vehicles.update(vehicleId, {
        status,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      
      // Sync data across all pages after status update
      syncDataAcrossPages('vehicles')
      
      // Update related tasks if vehicle is completed
      if (status === 'Completed' && vehicleTasks.length > 0) {
        for (const task of vehicleTasks) {
          if (task.status !== 'Completed') {
            await updateTask(task.id, { 
              status: 'Completed'
            })
          }
        }
      }
      
      setLastSyncTime(new Date())
    } catch (error) {
      // Only log errors in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update vehicle status:', error)
      }
      // Show user-friendly error notification
      // TODO: Add toast notification system
    }
  }, [allTasks, syncDataAcrossPages, updateTask]);
  
  // Enhanced refresh with data validation and conflict detection
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    try {
      // Refresh all related data
      await Promise.all([
        refetch(),
        refreshTaskData()
      ])
      
      // Validate task conflicts after refresh
      const { conflicts } = validateTaskConflicts(allTasks)
      setTaskConflicts(conflicts)
      
      // Sync across all pages
      syncDataAcrossPages('vehicles')
      syncDataAcrossPages('tasks')
      
      setLastSyncTime(new Date())
    } finally {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      // Set new timeout
      refreshTimeoutRef.current = setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [isRefreshing, refetch, refreshTaskData, allTasks, syncDataAcrossPages]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    }
  }, []);

  // Optimized filtering with debouncing for search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms debounce
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  // Memoized filtered and sorted vehicles with task information
  const filteredAndSortedVehicles = useMemo(() => {
    const vehicles = getFilteredVehicles({
      location: selectedLocation,
      day: selectedDay,
      status: selectedStatus,
      search: debouncedSearchTerm, // Use debounced search term
      sortBy,
      sortOrder
    })
    
    // Enhance vehicles with task counts and conflict information
    return vehicles.map(vehicle => {
      const vehicleTasks = allTasks.filter(task => 
        Array.isArray(task.vehicle_id) ? task.vehicle_id.includes(vehicle.id) : task.vehicle_id === vehicle.id
      )
      
      const vehicleConflicts = taskConflicts.filter(conflict => 
        vehicleTasks.some(task => task.id === conflict.taskId)
      )
      
      return {
        ...vehicle,
        taskCount: vehicleTasks.length,
        completedTasks: vehicleTasks.filter(task => task.status === 'Completed').length,
        conflictCount: vehicleConflicts.length,
        hasConflicts: vehicleConflicts.length > 0
      }
    })
  }, [getFilteredVehicles, selectedLocation, selectedDay, selectedStatus, debouncedSearchTerm, sortBy, sortOrder, allTasks, taskConflicts])

  // Status utility functions are now provided by the unified hook

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-slate-600">Loading vehicle schedule...</span>
          </div>
        </div>
      </div>
    );
  }

  if (vehiclesError) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Schedule</h3>
          <p className="text-sm text-slate-600 mb-4">{typeof vehiclesError === 'string' ? vehiclesError : 'Failed to load vehicle schedule'}</p>
          <button
            onClick={handleRefresh}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Add safety check for data
  if (!Array.isArray(vehicles)) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Invalid Data Format</h3>
        <p className="text-sm text-slate-600 mb-4">Vehicle data format is invalid. Please refresh the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Vehicle Schedule</h2>
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <span>GPS installation schedule with task management</span>
                  {taskConflicts.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                      <span className="text-orange-600 font-medium">{taskConflicts.length} conflicts</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
              <Truck className="w-4 h-4 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-blue-800">{scheduleStats.total}</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-green-800">{scheduleStats.completed}</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-md border border-orange-200">
              <Activity className="w-4 h-4 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-orange-800">{scheduleStats.inProgress}</div>
              <div className="text-xs text-orange-600">In Progress</div>
            </div>
            
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Clock className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{scheduleStats.pending}</div>
              <div className="text-xs text-slate-600">Pending</div>
            </div>
            
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Navigation className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{scheduleStats.totalGps}</div>
              <div className="text-xs text-slate-600">GPS Devices</div>
            </div>
            
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Fuel className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{scheduleStats.totalSensors}</div>
              <div className="text-xs text-slate-600">Fuel Sensors</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-md border border-purple-200">
              <Zap className="w-4 h-4 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-purple-800">{allTasks.length}</div>
              <div className="text-xs text-purple-600">Total Tasks</div>
            </div>
            
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Users className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{allTasks.filter(t => t.status === 'Completed').length}</div>
              <div className="text-xs text-slate-600">Tasks Done</div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              {/* Location Filter */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="All">All Locations</option>
                {locations.map(location => (
                  <option key={location.name} value={location.name}>{location.name}</option>
                ))}
              </select>

              {/* Day Filter */}
              <select
                value={selectedDay || ''}
                onChange={(e) => setSelectedDay(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="">All Days</option>
                {uniqueDays.map(day => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Sort Options */}
              <div className="flex space-x-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-l-md"
                >
                  <option value="day">Day</option>
                  <option value="location">Location</option>
                  <option value="status">Status</option>
                  <option value="type">Type</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-2 bg-slate-100 text-slate-600 rounded-r-md hover:bg-slate-200"
                  aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle List - Virtualized for performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAndSortedVehicles.map((vehicle) => {
          const isExpanded = expandedVehicles.has(vehicle.id);
          
          return (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isExpanded={isExpanded}
              onToggleExpansion={() => toggleVehicleExpansion(vehicle.id)}
              onStatusUpdate={updateVehicleStatus}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              projectStartDate={projectStartDate}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAndSortedVehicles.length === 0 && !loading && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Vehicles Found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm || selectedLocation !== 'All' || selectedDay !== null || selectedStatus !== 'All'
              ? 'Try adjusting your filters to see more vehicles.'
              : 'No vehicles are currently scheduled for installation.'}
          </p>
          {(searchTerm || selectedLocation !== 'All' || selectedDay !== null || selectedStatus !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedLocation('All');
                setSelectedDay(null);
                setSelectedStatus('All');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// Separate memoized component for vehicle cards
const VehicleCard = memo(({ vehicle, isExpanded, onToggleExpansion, onStatusUpdate, getStatusIcon, getStatusColor, projectStartDate }: {
  vehicle: any & {
    taskCount?: number;
    completedTasks?: number;
    conflictCount?: number;
    hasConflicts?: boolean;
  };
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onStatusUpdate: (id: string, status: any) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  projectStartDate: string;
}) => (
  <div className={`bg-white border rounded-lg overflow-hidden transition-all duration-200 ${
    vehicle.hasConflicts ? 'border-orange-300 bg-orange-50/50' : 'border-slate-200'
  } ${
    isExpanded ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
  }`}>
    {/* Installation Date Header - Prominent Display */}
    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-blue-100 uppercase tracking-wide">Installation Date</div>
          <div className="text-lg font-bold">
            {(() => {
              // Calculate date based on project start date and vehicle day
              const calculatedDate = calculateDateForDay(projectStartDate, vehicle.day);
              return new Date(calculatedDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });
            })()
            }
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-blue-100 uppercase tracking-wide">Day</div>
          <div className="text-2xl font-bold">{vehicle.day}</div>
        </div>
      </div>
    </div>

    {/* Vehicle Header */}
    <div className="p-4 border-b border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
            <Truck className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{vehicle.id}</h3>
            <p className="text-xs text-slate-600">{vehicle.type}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {vehicle.hasConflicts && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 rounded-md">
              <AlertTriangle className="w-3 h-3 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">
                {vehicle.conflictCount} conflict{vehicle.conflictCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(vehicle.status)}`}>
            {vehicle.status}
          </span>
          <button
            onClick={onToggleExpansion}
            className="p-1 hover:bg-slate-100 rounded-md"
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} vehicle details`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Vehicle Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600">{vehicle.location}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600">{vehicle.time_slot}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Fuel className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600">{vehicle.fuel_tanks} Tank{vehicle.fuel_tanks > 1 ? 's' : ''}</span>
        </div>
        {(vehicle.taskCount || 0) > 0 && (
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-blue-400" />
            <span className="text-slate-600">
              {vehicle.completedTasks || 0}/{vehicle.taskCount || 0} tasks done
            </span>
          </div>
        )}
      </div>
    </div>

    {/* Equipment Requirements */}
    <div className="p-4 bg-slate-50">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Navigation className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">GPS Devices</span>
          </div>
          <div className="text-lg font-semibold text-blue-900">{vehicle.gps_required}</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Fuel className="w-3 h-3 text-green-600" />
            <span className="text-xs font-medium text-green-800">Fuel Sensors</span>
          </div>
          <div className="text-lg font-semibold text-green-900">{vehicle.fuel_sensors}</div>
        </div>
      </div>
    </div>

    {/* Status Actions */}
    <div className="p-4 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon(vehicle.status)}
          <span className="text-sm font-medium text-slate-700">Status</span>
        </div>
        
        <div className="flex space-x-1">
          {vehicle.status !== 'Completed' && (
            <button
              onClick={() => onStatusUpdate(vehicle.id, 'In Progress')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              disabled={vehicle.status === 'In Progress'}
            >
              Start
            </button>
          )}
          {vehicle.status === 'In Progress' && (
            <button
              onClick={() => onStatusUpdate(vehicle.id, 'Completed')}
              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Expanded Task Management */}
    {isExpanded && (
      <div className="border-t border-slate-200 animate-fade-in">
        <VehicleTaskManager vehicleId={vehicle.id} />
      </div>
    )}
  </div>
));

VehicleCard.displayName = 'VehicleCard';
VehicleSchedule.displayName = 'VehicleSchedule';

export default VehicleSchedule;