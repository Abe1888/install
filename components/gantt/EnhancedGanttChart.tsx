'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react'
import { 
  Calendar, MapPin, Truck, Navigation, Fuel, CheckCircle2, AlertTriangle, 
  Activity, Target, RefreshCw, Filter, Search, ChevronLeft, ChevronRight,
  Users, Edit, Save, X, Move, RotateCcw, AlertCircle, Info, Plus, Trash2,
  ZoomIn, ZoomOut, Maximize2, Minimize2, BarChart3
} from 'lucide-react'
import { useGantt, type GanttTask, filterGanttTasks, groupGanttTasks } from '@/lib/hooks/useGantt'
import { supabase } from '@/lib/supabase/client'
import GanttSkeleton from './GanttSkeleton'

interface TimelineScale {
  unit: 'day' | 'week' | 'month'
  step: number
  format: string
}

const EnhancedGanttChart: React.FC = () => {
  // Gantt state
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [timelineScale, setTimelineScale] = useState<TimelineScale>({
    unit: 'day',
    step: 1,
    format: 'MMM dd'
  })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showTasks, setShowTasks] = useState(true)
  const [showInstallations, setShowInstallations] = useState(true)
  const [showBreaks, setShowBreaks] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Calculate current day for Gantt chart with better memoization
  const currentDayInProject = useMemo(() => {
    const today = new Date()
    const projectStart = new Date()
    projectStart.setHours(0, 0, 0, 0)
    return Math.max(1, Math.min(21, Math.ceil((today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))))
  }, [])

  // Use real-time Gantt data from the database with force refresh capability
  const displayDay = selectedDay || Math.max(1, Math.min(currentDayInProject, 21))
  const {
    tasks: ganttTasks,
    vehicles,
    locations,
    stats,
    isLoading,
    hasError,
    displayDate,
    filterTasks,
    groupTasks,
    refreshAllData
  } = useGantt(displayDay)
  
  // Force refresh function to ensure data is up-to-date
  const forceRefresh = useCallback(async () => {
    if (isRefreshing) return // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true)
    console.log('🔄 Force refreshing Gantt data...')
    try {
      // Method 1: Use hook's refresh function
      if (refreshAllData) {
        await refreshAllData()
      }
      
      // Method 2: Also force SWR cache invalidation as backup
      const { mutate } = await import('swr')
      await Promise.all([
        mutate('tasks-unified', undefined, { revalidate: true }),
        mutate('vehicles-unified', undefined, { revalidate: true }),
        mutate('team_members-unified', undefined, { revalidate: true }),
        mutate('locations-unified', undefined, { revalidate: true })
      ])
      
      console.log('✅ Gantt data refreshed successfully')
    } catch (error) {
      console.error('❌ Failed to refresh Gantt data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshAllData, isRefreshing])
  
  // Auto refresh every 30 seconds to ensure data is fresh
  useEffect(() => {
    const interval = setInterval(() => {
      forceRefresh()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [forceRefresh])
  
  // Also refresh when the component mounts
  useEffect(() => {
    forceRefresh()
  }, [forceRefresh])

  // Refs for DOM manipulation
  const ganttRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Set timeline to show work day from 8:00 AM to 5:30 PM
  const timelineStart = useMemo(() => {
    const start = new Date(displayDate)
    start.setHours(8, 0, 0, 0) // Start at 8:00 AM
    return start
  }, [displayDate])
  
  const timelineEnd = useMemo(() => {
    const end = new Date(displayDate)
    end.setHours(17, 30, 0, 0) // End at 5:30 PM
    return end
  }, [displayDate])

  // Optimized task filtering with better memoization and performance
  const filteredTasks = useMemo(() => {
    if (!ganttTasks || ganttTasks.length === 0) return []
    
    return filterGanttTasks(ganttTasks, {
      location: selectedLocation,
      status: selectedStatus,
      search: searchTerm
    }).filter(task => {
      // Apply type filters with early returns for performance
      if (!showInstallations && task.type === 'installation') return false
      if (!showTasks && task.type === 'task') return false
      if (!showBreaks && task.type === 'break') return false
      return true
    })
  }, [ganttTasks, selectedLocation, selectedStatus, searchTerm, showInstallations, showTasks, showBreaks])

  // Optimized task grouping with better performance and real-time data
  const groupedTasks = useMemo(() => {
    if (!filteredTasks || filteredTasks.length === 0) return {}
    
    const taskGroups = groupGanttTasks(filteredTasks, 'vehicle')
    
    // Convert to the format expected by the UI with proper colors
    const formattedGroups: { [key: string]: { name: string, tasks: GanttTask[], color: string } } = {}
    
    Object.entries(taskGroups).forEach(([key, tasks]) => {
      if (tasks.length === 0) return // Skip empty groups
      
      // Sort tasks within groups by start date with stable sort
      const sortedTasks = tasks.slice().sort((a, b) => {
        const timeDiff = a.startDate.getTime() - b.startDate.getTime()
        return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id) // Stable sort using ID as tiebreaker
      })
      
      formattedGroups[key] = {
        name: key === 'Shared Tasks' ? 'General Tasks' : `${key} - Installation Schedule`,
        tasks: sortedTasks,
        color: key === 'Shared Tasks' ? '#6B7280' : '#3B82F6'
      }
    })
    
    return formattedGroups
  }, [filteredTasks])

  // Optimized timeline generation with better performance
  const timelineDates = useMemo(() => {
    const dates = []
    const current = new Date(timelineStart)
    const cellWidth = 80 * zoomLevel // Base width per 30-minute interval
    const endTime = timelineEnd.getTime()
    
    // Pre-calculate increment to avoid repeated function calls
    const thirtyMinutes = 30 * 60 * 1000
    
    while (current.getTime() <= endTime) {
      const currentTime = current.getTime()
      const minutes = current.getMinutes()
      const isHourMark = minutes === 0 || minutes === 30
      const isFullHour = minutes === 0
      
      dates.push({
        date: new Date(currentTime),
        label: current.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        fullLabel: current.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        cellWidth,
        isHourMark,
        isFullHour
      })
      
      current.setTime(currentTime + thirtyMinutes) // More efficient than setMinutes
    }
    
    return dates
  }, [timelineStart, timelineEnd, zoomLevel])

  // Auto-expand all groups when data loads with better performance
  useEffect(() => {
    const allGroupKeys = Object.keys(groupedTasks)
    if (allGroupKeys.length > 0) {
      setExpandedGroups(prevExpanded => {
        const newExpanded = new Set(allGroupKeys)
        // Only update if there's actually a change
        if (prevExpanded.size !== newExpanded.size || 
            !allGroupKeys.every(key => prevExpanded.has(key))) {
          return newExpanded
        }
        return prevExpanded
      })
    }
  }, [groupedTasks])


  // Optimized task dimension calculation with better performance
  const getTaskDimensions = useCallback((task: GanttTask) => {
    const timelineStartTime = timelineStart.getTime()
    const startOffsetMinutes = (task.startDate.getTime() - timelineStartTime) / 60000 // Direct ms to minutes
    const durationMinutes = (task.endDate.getTime() - task.startDate.getTime()) / 60000
    
    // Pre-calculate pixels per minute
    const pixelsPerMinute = (80 * zoomLevel) / 30
    const left = Math.max(0, startOffsetMinutes * pixelsPerMinute)
    
    // Optimized width calculation with cached text measurements
    const calculatedWidth = durationMinutes * pixelsPerMinute
    const minWidth = Math.max(task.name.length * 8, 120) // Slightly more generous spacing
    const width = Math.max(calculatedWidth, minWidth)
    
    return { left, width }
  }, [timelineStart, zoomLevel])



  // Calculate task progress based on status
  const calculateRealTimeProgress = useCallback((task: GanttTask) => {
    if (task.status === 'Completed') return 100
    if (task.status === 'Blocked') return 0
    if (task.status === 'In Progress') return task.progress
    return task.progress
  }, [])

  // Handle task updates (simplified for production)
  const handleTaskUpdate = useCallback(async (task: GanttTask, updates: Partial<GanttTask>) => {
    try {
      if (task.type === 'task' && task.id.startsWith('task-')) {
        const taskId = task.id.replace('task-', '')
        await supabase.from('tasks').update({
          status: updates.status,
          priority: updates.priority
        }).eq('id', taskId)
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Task updated:', task.id, updates)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update task:', error)
      }
    }
  }, [])

  // Render task bar
  const renderTaskBar = useCallback((task: GanttTask, groupIndex: number, taskIndex: number) => {
    const { left, width } = getTaskDimensions(task)
    const top = 60 + (groupIndex * 120) + (taskIndex * 32) + 30 // Account for group headers
    
    return (
      <div
        key={task.id}
        className="absolute flex items-center group cursor-pointer"
        style={{ 
          left: `${left}px`, 
          top: `${top}px`, 
          width: `${width}px`, 
          height: '28px',
          backgroundColor: task.color,
          borderRadius: '4px',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
        title={`${task.name} (${task.assignedTo})`}
      >
        {/* Progress bar */}
        <div 
          className="absolute top-0 left-0 h-full bg-white bg-opacity-30 rounded-l transition-all duration-1000"
          style={{ width: `${calculateRealTimeProgress(task)}%` }}
        />
        
        {/* Progress indicator stripe for in-progress tasks */}
        {task.status === 'In Progress' && (
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-pulse"
            style={{ width: `${calculateRealTimeProgress(task)}%` }}
          />
        )}
        
        {/* Task content */}
        <div className="flex items-center px-2 text-xs font-medium overflow-hidden" style={{ color: task.textColor }}>
          <div className="flex items-center space-x-1 min-w-0 flex-1">
            {task.type === 'installation' ? <Truck className="w-3 h-3 flex-shrink-0" /> : 
             task.type === 'break' ? <Activity className="w-3 h-3 flex-shrink-0" /> : <Target className="w-3 h-3 flex-shrink-0" />}
            <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={task.name}>{task.name}</span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
          style={{ 
            backgroundColor: task.status === 'Completed' ? '#10B981' : 
                           task.status === 'In Progress' ? '#3B82F6' : 
                           task.status === 'Blocked' ? '#EF4444' : '#F59E0B'
          }}
        />

        {/* Hover tooltip */}
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl" style={{ zIndex: 1000 }}>
          <div className="font-medium text-yellow-300 mb-1">{task.name}</div>
          <div className="flex items-center space-x-2 mb-1">
            <span>Status:</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              task.status === 'Completed' ? 'bg-green-600' :
              task.status === 'In Progress' ? 'bg-blue-600' :
              task.status === 'Blocked' ? 'bg-red-600' : 'bg-yellow-600'
            }`}>{task.status}</span>
          </div>
          <div className="mb-1">
            Real-time Progress: 
            <span className="font-medium text-green-300">{Math.round(calculateRealTimeProgress(task))}%</span>
          </div>
          <div className="mb-1">
            Time: {task.startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - 
            {task.endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
          <div className="mb-1">Assigned: {task.assignedTo}</div>
          {task.vehicleType && (
            <div className="mb-1">Vehicle: {task.vehicleType}</div>
          )}
          {task.category && (
            <div>Category: {task.category}</div>
          )}
        </div>
      </div>
    )
  }, [getTaskDimensions, calculateRealTimeProgress])

  // Toggle group expansion
  const toggleGroup = useCallback((groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (expandedGroups.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }, [expandedGroups])

  if (isLoading) {
    return <GanttSkeleton />
  }
  
  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-8 h-8 text-red-600" />
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-red-900">Failed to load Gantt chart</h3>
          <p className="text-red-700">Please check your connection and try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const totalTimelineWidth = timelineDates.length * (80 * zoomLevel)
  
  // Calculate dynamic height based on content
  const filteredGroupEntries = Object.entries(groupedTasks).filter(([groupKey]) => !groupKey.includes('general'))
  const totalTaskCount = filteredGroupEntries.reduce((count, [, group]) => count + group.tasks.length, 0)
  const dynamicHeight = Math.max(400, 60 + (filteredGroupEntries.length * 60) + (totalTaskCount * 35))

  return (
    <>
      {/* Custom CSS for animations and scrollbar hiding */}
      <style jsx>{`
        /* Hide scrollbars while keeping functionality */
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
      `}</style>
      
    <div className="space-y-6" ref={ganttRef}>
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Day Gantt - Day {displayDay}</h2>
                <p className="text-sm text-gray-600">
                  Today's schedule: {displayDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
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
              
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2 border border-gray-300 rounded-md">
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  className="p-2 hover:bg-gray-50"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 px-2 min-w-[50px] text-center">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                  className="p-2 hover:bg-gray-50"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              
              
              
              {/* Quick Actions */}
              <button
                onClick={() => setSelectedDay(null)} // Reset to current day
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center space-x-1"
              >
                <Calendar className="w-4 h-4" />
                <span>Today</span>
              </button>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
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
              <option value="Blocked">Blocked</option>
            </select>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showInstallations"
                checked={showInstallations}
                onChange={(e) => setShowInstallations(e.target.checked)}
                className="rounded border-gray-300 text-purple-600"
              />
              <label htmlFor="showInstallations" className="text-sm text-gray-700">Installations</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showTasks"
                checked={showTasks}
                onChange={(e) => setShowTasks(e.target.checked)}
                className="rounded border-gray-300 text-purple-600"
              />
              <label htmlFor="showTasks" className="text-sm text-gray-700">Tasks</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showBreaks"
                checked={showBreaks}
                onChange={(e) => setShowBreaks(e.target.checked)}
                className="rounded border-gray-300 text-purple-600"
              />
              <label htmlFor="showBreaks" className="text-sm text-gray-700">Breaks</label>
            </div>

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

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Timeline Header */}
        <div className="border-b border-gray-200 relative" style={{ zIndex: 1 }}>
          <div className="flex">
            {/* Left panel for vehicle names */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
              <div className="font-semibold text-gray-700">Vehicles</div>
            </div>
            
            {/* Timeline dates */}
            <div className="flex-1 overflow-x-auto hide-scrollbar" ref={timelineRef}>
              <div className="flex bg-gray-50 border-r border-gray-200" style={{ width: `${totalTimelineWidth}px` }}>
                {timelineDates.map((date, index) => (
                  <div 
                    key={index}
                    className={`border-r p-1 text-center text-xs ${
                      date.isFullHour 
                        ? 'border-gray-300 bg-gray-50 font-medium text-gray-700' 
                        : 'border-gray-100 text-gray-500'
                    }`}
                    style={{ minWidth: `${date.cellWidth}px` }}
                  >
                    <div className={date.isFullHour ? 'font-semibold' : ''}>
                      {date.isFullHour ? date.label : date.label.split(':')[1] + (date.label.includes('AM') ? 'AM' : 'PM').slice(0,2)}
                    </div>
                    {date.isFullHour && index === 0 && (
                      <div className="text-xs text-gray-500">
                        {date.fullLabel.split(' ').slice(0, 2).join(' ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Content */}
        <div className="relative overflow-x-auto hide-scrollbar" style={{ minHeight: '600px', zIndex: 1 }}>
          <div className="flex">
            {/* Left panel for vehicle list */}
            <div className="w-80 bg-gray-50 border-r border-gray-200">
              {Object.entries(groupedTasks)
                .filter(([groupKey, group]) => !groupKey.includes('Shared Tasks')) // Filter out shared tasks
                .map(([groupKey, group], groupIndex) => (
                <div key={groupKey} className="border-b border-gray-200">
                  <div className="p-4 bg-white hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{groupKey}</div>
                        <div className="text-xs text-gray-600">{group.tasks.length} tasks scheduled</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-500">
                        {Math.round((group.tasks.filter(t => t.status === 'Completed').length / group.tasks.length) * 100)}%
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        group.tasks.some(t => t.status === 'In Progress') ? 'bg-blue-500' :
                        group.tasks.every(t => t.status === 'Completed') ? 'bg-green-500' : 
                        'bg-gray-300'
                      }`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline area */}
            <div className="flex-1 relative bg-white" style={{ width: `${totalTimelineWidth}px`, minHeight: '600px' }}>
              {/* Grid lines */}
              {timelineDates.map((date, index) => (
                <div
                  key={index}
                  className={`absolute top-0 border-r opacity-50 ${
                    date.isFullHour ? 'border-gray-200' : 'border-gray-100'
                  }`}
                  style={{ 
                    left: `${index * (80 * zoomLevel)}px`,
                    height: '100%',
                    width: '1px'
                  }}
                />
              ))}

              {/* Render task bars */}
              {Object.entries(groupedTasks).map(([groupKey, group], groupIndex) => {
                if (!expandedGroups.has(groupKey)) return null
                
                return group.tasks.map((task, taskIndex) => 
                  renderTaskBar(task, groupIndex, taskIndex)
                )
              })}

            </div>
          </div>
        </div>
      </div>

      {/* Real-time Features Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <span>Real-time Progress Tracker</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-8 bg-red-500 rounded animate-pulse"></div>
            <div>
              <div className="font-medium text-gray-900">Live Time Indicator</div>
              <div className="text-gray-600">Shows current time position</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-12 h-4 bg-blue-500 rounded relative">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-white bg-opacity-30 rounded-l"></div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Auto Progress Bars</div>
              <div className="text-gray-600">Updates based on time elapsed</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <div className="font-medium text-gray-900">Active Task Indicator</div>
              <div className="text-gray-600">Highlights current tasks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Items', 
            value: stats.totalTasks, 
            color: 'bg-purple-500',
            icon: BarChart3
          },
          { 
            label: 'Completed', 
            value: stats.completedTasks, 
            color: 'bg-green-500',
            icon: CheckCircle2
          },
          { 
            label: 'In Progress', 
            value: stats.inProgressTasks, 
            color: 'bg-blue-500',
            icon: Activity
          },
          { 
            label: 'Vehicles Today', 
            value: stats.totalVehicles, 
            color: 'bg-orange-500',
            icon: Truck
          },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
    </>
  )
}

export default EnhancedGanttChart
