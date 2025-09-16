'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  Calendar, Clock, MapPin, Truck, Navigation, Fuel, CheckCircle2, AlertTriangle, 
  Activity, RefreshCw, Filter, Search, ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react'
import { useGantt } from '@/lib/hooks/useGantt'

const SimpleGanttChart = () => {
  // State
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Current day calculation
  const currentDayInProject = useMemo(() => {
    return 1 // Default to day 1
  }, [])

  const displayDay = selectedDay || currentDayInProject
  
  // Get data from hook
  const {
    tasks: ganttTasks,
    vehicles,
    locations,
    stats,
    isLoading,
    hasError,
    displayDate,
    refreshAllData
  } = useGantt(displayDay)

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    console.log('🔄 Force refreshing Gantt data...')
    try {
      if (refreshAllData) {
        await refreshAllData()
      }
      console.log('✅ Gantt data refreshed successfully')
    } catch (error) {
      console.error('❌ Failed to refresh Gantt data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshAllData, isRefreshing])

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      forceRefresh()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [forceRefresh])

  // Refresh on mount
  useEffect(() => {
    forceRefresh()
  }, [forceRefresh])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!ganttTasks) return []
    
    return ganttTasks.filter(task => {
      const locationMatch = selectedLocation === 'All' || task.location === selectedLocation
      const statusMatch = selectedStatus === 'All' || task.status === selectedStatus
      const searchMatch = searchTerm === '' || task.name.toLowerCase().includes(searchTerm.toLowerCase())
      return locationMatch && statusMatch && searchMatch
    })
  }, [ganttTasks, selectedLocation, selectedStatus, searchTerm])

  // Group tasks by vehicle
  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof filteredTasks> = {}
    
    filteredTasks.forEach(task => {
      const key = task.vehicleId || 'Shared Tasks'
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(task)
    })
    
    return groups
  }, [filteredTasks])

  // Get task color based on status
  const getTaskColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500'
      case 'In Progress': return 'bg-blue-500'
      case 'Pending': return 'bg-gray-400'
      default: return 'bg-red-500'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'In Progress':
        return <Activity className="w-4 h-4 text-blue-600" />
      case 'Pending':
        return <Clock className="w-4 h-4 text-gray-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-red-600" />
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Gantt chart...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load Gantt chart</h3>
          <p className="text-red-700 mb-4">Please check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gantt Chart - Day {displayDay}</h2>
                <p className="text-sm text-gray-600">
                  {displayDate.toLocaleDateString()} • {filteredTasks.length} tasks • {stats.totalVehicles} vehicles
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Day Navigation */}
              <div className="flex items-center space-x-2 border border-gray-300 rounded-md">
                <button
                  onClick={() => setSelectedDay(Math.max(1, displayDay - 1))}
                  disabled={displayDay <= 1}
                  className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700 min-w-[60px] text-center">
                  Day {displayDay}
                </span>
                <button
                  onClick={() => setSelectedDay(Math.min(21, displayDay + 1))}
                  disabled={displayDay >= 21}
                  className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setSelectedDay(null)}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center space-x-1"
              >
                <Calendar className="w-4 h-4" />
                <span>Today</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="All">All Locations</option>
              {locations.map(location => (
                <option key={location.name} value={location.name}>{location.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <button
              onClick={forceRefresh}
              disabled={isRefreshing}
              className={`px-4 py-2 text-white rounded-md flex items-center space-x-2 ${
                isRefreshing 
                  ? 'bg-purple-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              title="Refresh Gantt data from database"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simple Task List View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Schedule</h3>
          
          {Object.entries(groupedTasks).map(([groupKey, tasks]) => (
            <div key={groupKey} className="mb-6 last:mb-0">
              <div className="flex items-center space-x-3 mb-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">{groupKey}</h4>
                <span className="text-sm text-gray-500">({tasks.length} tasks)</span>
              </div>
              
              <div className="space-y-2">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <div className="font-medium text-gray-900">{task.name}</div>
                        <div className="text-sm text-gray-600">
                          {task.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {task.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                          • {Math.round(task.duration)} min
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-600">{task.assignedTo}</div>
                      <div className={`w-3 h-3 rounded-full ${getTaskColor(task.status)}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tasks found for the current filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</div>
              <div className="text-sm text-gray-600">Vehicles</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.completedTasks}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.inProgressTasks}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleGanttChart
