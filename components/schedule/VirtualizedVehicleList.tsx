'use client'

import React, { useMemo, useState, useCallback } from 'react'
const { FixedSizeList } = require('react-window')
import { 
  Calendar, Clock, MapPin, Truck, Navigation, Fuel, CheckCircle2, AlertTriangle, 
  Activity, Target, RefreshCw, Filter, Search, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'
import { useVehicleListSchedule } from '@/lib/hooks/useTaskSchedule'
import { useRealTimeTasks } from '@/lib/hooks/useRealTimeTaskTracking'
import { Vehicle } from '@/lib/supabase/types'
import { calculateDateForDay } from '@/lib/utils/projectUtils'
import { db } from '@/lib/supabase/database'

interface VehicleItemProps {
  index: number
  style: React.CSSProperties
  data: {
    vehicles: Vehicle[]
    expandedVehicles: Set<string>
    toggleVehicleExpansion: (vehicleId: string) => void
    updateVehicleStatus: (vehicleId: string, status: Vehicle['status']) => void
    getStatusIcon: (status: string) => string
    getStatusColor: (status: string) => string
    projectStartDate: string
  }
}

// Individual vehicle item component (memoized for performance)
const VehicleItem = React.memo<VehicleItemProps>(({ index, style, data }) => {
  const {
    vehicles,
    expandedVehicles,
    toggleVehicleExpansion,
    updateVehicleStatus,
    getStatusIcon,
    getStatusColor,
    projectStartDate
  } = data
  
  const vehicle = vehicles[index]
  if (!vehicle) return null
  
  const isExpanded = expandedVehicles.has(vehicle.id)
  const installationDate = calculateDateForDay(projectStartDate, vehicle.day)
  
  return (
    <div style={style} className="px-2">
      <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 ${
        isExpanded ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}>
        {/* Installation Date Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-blue-100 uppercase tracking-wide">Installation Date</div>
              <div className="text-lg font-bold">
                {new Date(installationDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
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
                <div className="font-semibold text-slate-900">{vehicle.id}</div>
                <div className="text-sm text-slate-600">{vehicle.type} • {vehicle.location}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                <div className="flex items-center space-x-1">
                  <span>{getStatusIcon(vehicle.status)}</span>
                  <span>{vehicle.status}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-2 rounded border border-blue-200">
              <Navigation className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-blue-800">{vehicle.gps_required}</div>
              <div className="text-xs text-blue-600">GPS</div>
            </div>
            
            <div className="bg-green-50 p-2 rounded border border-green-200">
              <Fuel className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-green-800">{vehicle.fuel_sensors}</div>
              <div className="text-xs text-green-600">Sensors</div>
            </div>
            
            <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
              <Target className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-yellow-800">{vehicle.fuel_tanks}</div>
              <div className="text-xs text-yellow-600">Tanks</div>
            </div>
          </div>
          
          {/* Expand Button */}
          <button
            onClick={() => toggleVehicleExpansion(vehicle.id)}
            className="w-full mt-3 px-3 py-2 bg-slate-50 text-slate-700 rounded border hover:bg-slate-100 transition-colors flex items-center justify-center space-x-2"
          >
            <span className="text-sm">
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="p-4 bg-slate-50">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={vehicle.status}
                  onChange={(e) => updateVehicleStatus(vehicle.id, e.target.value as Vehicle['status'])}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
                <div className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-md">
                  {vehicle.time_slot || 'Not assigned'}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <div className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-md min-h-[60px]">
                  {'No notes'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

VehicleItem.displayName = 'VehicleItem'

export const VirtualizedVehicleList: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Use unified task schedule hook with filters
  const {
    isLoading,
    hasError,
    vehicles: allVehicles,
    locations,
    taskStats,
    getStatusIcon,
    getStatusColor,
    projectStartDate,
    refetchVehicles
  } = useVehicleListSchedule({
    location: selectedLocation,
    status: selectedStatus,
    search: searchTerm
  })
  
  // Add real-time updates to vehicles
  const { tasks: realTimeVehicleTasks } = useRealTimeTasks(
    allVehicles.map(v => ({
      id: v.id,
      vehicleId: v.id,
      name: v.id,
      status: v.status,
      progress: 0,
      startDate: new Date(),
      endDate: new Date(),
      duration: 0,
      priority: 'Medium' as const,
      assignedTo: 'Team',
      type: 'vehicle' as const,
      color: '#3B82F6',
      textColor: '#FFFFFF'
    }))
  )
  
  // Update vehicles with real-time status
  const vehicles = useMemo(() => {
    return allVehicles.map(vehicle => {
      const realtimeTask = realTimeVehicleTasks.find(t => t.vehicleId === vehicle.id)
      return realtimeTask ? { ...vehicle, status: realtimeTask.status } : vehicle
    })
  }, [allVehicles, realTimeVehicleTasks])
  
  // Toggle vehicle expansion
  const toggleVehicleExpansion = useCallback((vehicleId: string) => {
    const newExpanded = new Set(expandedVehicles)
    if (expandedVehicles.has(vehicleId)) {
      newExpanded.delete(vehicleId)
    } else {
      newExpanded.add(vehicleId)
    }
    setExpandedVehicles(newExpanded)
  }, [expandedVehicles])

  // Update vehicle status
  const updateVehicleStatus = useCallback(async (vehicleId: string, status: Vehicle['status']) => {
    try {
      const { error } = await db.vehicles.update(vehicleId, {
        status,
        updated_at: new Date().toISOString()
      })
      if (error) throw error
      refetchVehicles()
    } catch (error) {
      console.error('Failed to update vehicle status:', error)
    }
  }, [refetchVehicles])
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetchVehicles()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Item data for the virtualized list
  const itemData = useMemo(() => ({
    vehicles,
    expandedVehicles,
    toggleVehicleExpansion,
    updateVehicleStatus,
    getStatusIcon,
    getStatusColor,
    projectStartDate
  }), [
    vehicles,
    expandedVehicles,
    toggleVehicleExpansion,
    updateVehicleStatus,
    getStatusIcon,
    getStatusColor,
    projectStartDate
  ])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-slate-600">Loading vehicle schedule...</span>
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Schedule</h3>
          <p className="text-sm text-slate-600 mb-4">Failed to load vehicle schedule</p>
          <button onClick={handleRefresh} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Calculate item height - base height + expanded height if needed
  const getItemSize = (index: number) => {
    const vehicle = vehicles[index]
    if (!vehicle) return 240
    
    const isExpanded = expandedVehicles.has(vehicle.id)
    return isExpanded ? 380 : 240 // Adjust based on content
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Stats */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Vehicle Schedule</h2>
                <p className="text-sm text-slate-600">Virtualized list for optimal performance</p>
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
        
        {/* Statistics */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
              <Truck className="w-4 h-4 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-blue-800">{taskStats.total}</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-green-800">{taskStats.completed}</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-md border border-orange-200">
              <Activity className="w-4 h-4 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-orange-800">{taskStats.inProgress}</div>
              <div className="text-xs text-orange-600">In Progress</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <Clock className="w-4 h-4 text-slate-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-slate-800">{taskStats.pending}</div>
              <div className="text-xs text-slate-600">Pending</div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Virtualized Vehicle List */}
      {vehicles.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-md font-semibold text-slate-900">
              Vehicles ({vehicles.length})
            </h3>
          </div>
          <div style={{ height: '600px' }}>
            <FixedSizeList
                height={600}
              itemCount={vehicles.length}
              itemSize={getItemSize}
              itemData={itemData}
              overscanCount={5}
            >
              {VehicleItem}
            </FixedSizeList>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Vehicles Found</h3>
          <p className="text-sm text-slate-600">No vehicles match your current filters.</p>
        </div>
      )}
    </div>
  )
}

export default VirtualizedVehicleList
