'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  Calendar, MapPin, Truck, Fuel, CheckCircle2, 
  Activity, Target, RefreshCw, Search, ChevronLeft, ChevronRight,
  BarChart3, ZoomIn, ZoomOut
} from 'lucide-react'
import { useGantt } from '@/lib/hooks/useGantt'
import { useProjectSettings } from '@/lib/hooks/useProjectSettings'

interface TimelineDate {
  date: Date
  label: string
  fullLabel: string
  cellWidth: number
  isHourMark: boolean
  isFullHour: boolean
}

interface TaskDimensions {
  left: number
  width: number
}

const WorkingGanttChart: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1200)
  
  // Get project settings to calculate current day
  const { settings: projectSettings } = useProjectSettings()

  // Handle window resize for responsive scaling
  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth - 420) // Account for left panel + margins
    }
    
    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth)
    return () => window.removeEventListener('resize', updateViewportWidth)
  }, [])

  // Calculate current project day based on actual project start date
  const currentProjectDay = useMemo(() => {
    if (!projectSettings?.project_start_date) return 1
    
    const start = new Date(projectSettings.project_start_date)
    const today = new Date()
    const diffTime = today.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    // If project hasn't started yet, default to Day 1 but don't show "today" data
    if (diffDays < 1) {
      return 1 // Show Day 1 by default, but it won't be "today"
    }
    
    return diffDays
  }, [projectSettings?.project_start_date])
  
  const displayDay = selectedDay || currentProjectDay

  // Use real-time Gantt data
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
    try {
      if (refreshAllData) {
        await refreshAllData()
      }
    } catch (error) {
      console.error('Failed to refresh Gantt data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshAllData, isRefreshing])

  // Dynamic timeline boundaries based on actual task times
  const timelineStart = useMemo(() => {
    if (!ganttTasks || ganttTasks.length === 0) {
      // Fallback to standard work day start
      const start = new Date(displayDate)
      start.setHours(8, 0, 0, 0)
      return start
    }
    
    // Find earliest task start time
    const earliestTask = ganttTasks.reduce((earliest, task) => 
      task.startDate < earliest ? task.startDate : earliest, 
      ganttTasks[0].startDate
    )
    
    // Round down to the nearest 30-minute mark for clean timeline
    const roundedStart = new Date(earliestTask)
    const minutes = roundedStart.getMinutes()
    roundedStart.setMinutes(minutes < 30 ? 0 : 30, 0, 0)
    
    // Ensure minimum start time is not before 6:00 AM
    const minStart = new Date(displayDate)
    minStart.setHours(6, 0, 0, 0)
    
    return roundedStart < minStart ? minStart : roundedStart
  }, [displayDate, ganttTasks])
  
  const timelineEnd = useMemo(() => {
    if (!ganttTasks || ganttTasks.length === 0) {
      // Fallback to standard work day end
      const end = new Date(displayDate)
      end.setHours(17, 30, 0, 0)
      return end
    }
    
    // Find latest task end time
    const latestTask = ganttTasks.reduce((latest, task) => 
      task.endDate > latest ? task.endDate : latest, 
      ganttTasks[0].endDate
    )
    
    // Round up to the nearest 30-minute mark for clean timeline
    const roundedEnd = new Date(latestTask)
    const minutes = roundedEnd.getMinutes()
    roundedEnd.setMinutes(minutes > 30 ? 60 : 30, 0, 0)
    
    // Ensure minimum end time is not before 6:00 PM
    const minEnd = new Date(displayDate)
    minEnd.setHours(18, 0, 0, 0)
    
    return roundedEnd > minEnd ? roundedEnd : minEnd
  }, [displayDate, ganttTasks])

  // Generate timeline dates with viewport-based scaling
  const timelineDates = useMemo(() => {
    const dates: TimelineDate[] = []
    const current = new Date(timelineStart)
    const endTime = timelineEnd.getTime()
    const thirtyMinutes = 30 * 60 * 1000
    
    // Use responsive viewport width
    
    // Calculate total 30-minute intervals
    const totalIntervals = Math.ceil((endTime - timelineStart.getTime()) / thirtyMinutes)
    
    // Calculate cell width to fit viewport perfectly
    const cellWidth = Math.max(60, Math.floor(viewportWidth / totalIntervals)) * zoomLevel

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

      current.setTime(currentTime + thirtyMinutes)
    }

    return dates
  }, [timelineStart, timelineEnd, zoomLevel, viewportWidth])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!ganttTasks || ganttTasks.length === 0) return []
    
    
    return ganttTasks.filter(task => {
      if (selectedLocation !== 'All' && task.location !== selectedLocation) return false
      if (selectedStatus !== 'All' && task.status !== selectedStatus) return false
      if (searchTerm && !task.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
  }, [ganttTasks, selectedLocation, selectedStatus, searchTerm])

  // Group tasks by vehicle
  const groupedTasks = useMemo(() => {
    if (!filteredTasks || filteredTasks.length === 0) return {}
    
    const groups: { [key: string]: typeof filteredTasks } = {}
    
    filteredTasks.forEach(task => {
      const groupKey = task.vehicleId || 'Shared Tasks'
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(task)
    })


    // Sort tasks within each group by start time
    Object.keys(groups).forEach(groupKey => {
      groups[groupKey].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    })

    return groups
  }, [filteredTasks])

  // Calculate task dimensions with viewport scaling
  const getTaskDimensions = useCallback((task: any): TaskDimensions => {
    if (!timelineDates.length) return { left: 0, width: 100 }
    
    const timelineStartTime = timelineStart.getTime()
    const startOffsetMinutes = (task.startDate.getTime() - timelineStartTime) / 60000
    const durationMinutes = (task.endDate.getTime() - task.startDate.getTime()) / 60000
    
    // Use the actual cell width from timelineDates
    const cellWidth = timelineDates[0]?.cellWidth || 60
    const pixelsPerMinute = cellWidth / 30 // 30 minutes per cell
    const left = Math.max(0, startOffsetMinutes * pixelsPerMinute)
    const calculatedWidth = durationMinutes * pixelsPerMinute
    const minWidth = Math.max(cellWidth * 0.8, 80) // Minimum width relative to cell size
    const width = Math.max(calculatedWidth, minWidth)
    
    return { left, width }
  }, [timelineStart, timelineDates])

  // Calculate task progress
  const calculateProgress = useCallback((task: any) => {
    if (task.status === 'Completed') return 100
    if (task.status === 'Blocked') return 0
    if (task.status === 'In Progress') return task.progress || 50
    return task.progress || 0
  }, [])

  // Render task bar
  const renderTaskBar = useCallback((task: any, groupIndex: number, taskIndex: number) => {
    const { left, width } = getTaskDimensions(task)
    const top = 60 + (groupIndex * 100) + (taskIndex * 35) + 30

    return (
      <div
        key={task.id}
        className="absolute flex items-center group cursor-pointer"
        style={{ 
          left: `${left}px`, 
          top: `${top}px`, 
          width: `${width}px`, 
          height: '28px',
          backgroundColor: task.color || '#3B82F6',
          borderRadius: '4px',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
        title={`${task.name} (${task.assignedTo || 'Unassigned'})`}
      >
        {/* Progress bar */}
        <div 
          className="absolute top-0 left-0 h-full bg-white bg-opacity-30 rounded-l transition-all duration-500"
          style={{ width: `${calculateProgress(task)}%` }}
        />
        
        {/* Task content */}
        <div className="flex items-center px-2 text-xs font-medium overflow-hidden text-white">
          <div className="flex items-center space-x-1 min-w-0 flex-1">
            {task.type === 'installation' ? <Truck className="w-3 h-3 flex-shrink-0" /> : 
             task.type === 'break' ? <Activity className="w-3 h-3 flex-shrink-0" /> : 
             <Target className="w-3 h-3 flex-shrink-0" />}
            <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={task.name}>
              {task.name}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
          style={{ 
            backgroundColor: task.status === 'Completed' ? '#10B981' : 
                           task.status === 'In Progress' ? '#3B82F6' : 
                           task.status === 'Blocked' ? '#EF4444' : '#F59E0B'
          }}
        />

        {/* Hover tooltip */}
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
          <div className="font-medium text-yellow-300 mb-1">{task.name}</div>
          <div className="mb-1">Status: <span className="text-green-300">{task.status}</span></div>
          <div className="mb-1">Progress: <span className="text-green-300">{calculateProgress(task)}%</span></div>
          <div className="mb-1">
            Time: {task.startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - 
            {task.endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
          <div>Assigned: {task.assignedTo || 'Unassigned'}</div>
        </div>
      </div>
    )
  }, [getTaskDimensions, calculateProgress])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Gantt chart...</p>
        </div>
      </div>
    )
  }
  
  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load Gantt chart</h3>
          <p className="text-red-700 mb-4">Please check your connection and try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const totalTimelineWidth = timelineDates.length * (80 * zoomLevel)
  const filteredGroupEntries = Object.entries(groupedTasks)
  const totalTaskCount = filteredGroupEntries.reduce((count, [, tasks]) => count + tasks.length, 0)
  const dynamicHeight = Math.max(400, 60 + (filteredGroupEntries.length * 100) + (totalTaskCount * 35))

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gantt Chart - Day {displayDay}</h2>
                <p className="text-sm text-gray-600">
                  {displayDate.toLocaleDateString('en-US', { 
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
                <span className="text-sm text-gray-600 px-2 min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                  className="p-2 hover:bg-gray-50"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setSelectedDay(currentProjectDay)}
                className={`px-3 py-2 rounded-md text-sm flex items-center space-x-1 ${
                  currentProjectDay < 1 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                disabled={currentProjectDay < 1}
                title={currentProjectDay < 1 ? 'Project has not started yet' : 'Go to current project day'}
              >
                <Calendar className="w-4 h-4" />
                <span>{currentProjectDay < 1 ? 'Not Started' : 'Today'}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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

            <button
              onClick={forceRefresh}
              disabled={isRefreshing}
              className={`px-4 py-2 text-white rounded-md flex items-center space-x-2 ${
                isRefreshing 
                  ? 'bg-purple-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              title="Refresh Gantt data"
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
            <div className="flex-1 overflow-hidden">
              <div className="flex bg-gray-50 border-r border-gray-200" style={{ width: '100%' }}>
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
        <div className="relative overflow-hidden" style={{ minHeight: '600px', zIndex: 1 }}>
          <div className="flex">
            {/* Left panel for vehicle list */}
            <div className="w-80 bg-gray-50 border-r border-gray-200">
              {Object.entries(groupedTasks).map(([groupKey, tasks], groupIndex) => {
                const isSharedTasks = groupKey === 'Shared Tasks'
                return (
                  <div key={groupKey} className="border-b border-gray-200">
                    <div className="p-4 bg-white hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSharedTasks 
                            ? 'bg-gray-100' 
                            : 'bg-blue-100'
                        }`}>
                          {isSharedTasks ? (
                            <Activity className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Truck className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{groupKey}</div>
                          <div className="text-xs text-gray-600">
                            {tasks.length} {isSharedTasks ? 'shared tasks' : 'tasks scheduled'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500">
                          {Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100)}%
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          tasks.some(t => t.status === 'In Progress') ? 'bg-blue-500' :
                          tasks.every(t => t.status === 'Completed') ? 'bg-green-500' : 
                          'bg-gray-300'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Timeline area */}
            <div className="flex-1 relative bg-white" style={{ width: '100%', minHeight: '600px' }}>
              {/* Grid lines */}
              {timelineDates.map((date, index) => (
                <div
                  key={index}
                  className={`absolute top-0 border-r opacity-50 ${
                    date.isFullHour ? 'border-gray-200' : 'border-gray-100'
                  }`}
                  style={{ 
                    left: `${index * date.cellWidth}px`,
                    height: '100%',
                    width: '1px'
                  }}
                />
              ))}

              {/* Render task bars */}
              {Object.entries(groupedTasks).map(([groupKey, tasks], groupIndex) => 
                tasks.map((task, taskIndex) => 
                  renderTaskBar(task, groupIndex, taskIndex)
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Tasks', 
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
              label: `Vehicles Day ${displayDay}`, 
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
  )
}

export default WorkingGanttChart
