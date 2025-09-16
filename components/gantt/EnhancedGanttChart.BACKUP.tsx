'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { 
  Calendar, MapPin, Truck, Navigation, Fuel, CheckCircle2, AlertTriangle, 
  Activity, Target, RefreshCw, Filter, Search, ChevronLeft, ChevronRight,
  Users, Edit, Save, X, Move, RotateCcw, AlertCircle, Info, Plus, Trash2,
  ZoomIn, ZoomOut, Maximize2, Minimize2, BarChart3
} from 'lucide-react'
import { useVehiclesOptimized, useLocationsOptimized, useTasksOptimized, useTeamMembersOptimized } from '@/lib/hooks/useOptimizedSWR'
import { supabase } from '@/lib/supabase/client'
import { Vehicle, Task, Location, TeamMember } from '@/lib/supabase/types'
import { useProjectSettings } from '@/lib/hooks/useProjectSettings'
import { calculateDateForDay } from '@/lib/utils/projectUtils'
import { 
  getAllHardcodedTasks, 
  parseTimeToDate, 
  extractVehicleId, 
  getTaskType, 
  getTaskPriority, 
  getTaskStatus, 
  getTaskColor,
  type ScheduleTask 
} from '@/lib/utils/taskParser'

interface GanttTask {
  id: string
  name: string
  vehicleId?: string
  vehicleType?: string
  startDate: Date
  endDate: Date
  duration: number
  progress: number
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked' | 'Scheduled'
  priority: 'High' | 'Medium' | 'Low'
  assignedTo: string
  location?: string
  type: 'vehicle' | 'task'
  color: string
  textColor: string
  dependencies?: string[]
  resources?: { gps: number, fuel: number, tanks: number }
}

interface TimelineScale {
  unit: 'day' | 'week' | 'month'
  step: number
  format: string
}

const EnhancedGanttChart: React.FC = () => {
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehiclesOptimized()
  const { data: tasks = [], isLoading: tasksLoading } = useTasksOptimized()
  const { data: locations = [] } = useLocationsOptimized()
  const { data: teamMembers = [] } = useTeamMembersOptimized()
  const { settings: projectSettings } = useProjectSettings()

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
  const [showVehicles, setShowVehicles] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Drag state for timeline manipulation
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedTask: null as GanttTask | null,
    initialX: 0,
    currentX: 0
  })

  const ganttRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Project settings
  const projectStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0]
  const projectStart = new Date(projectStartDate)
  
  // Calculate current day in project
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const currentDayInProject = Math.ceil((today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
  
  // Show selected day, current day, or day 1 if project hasn't started
  const displayDay = selectedDay || Math.max(1, Math.min(currentDayInProject, 21))
  const displayDate = new Date(calculateDateForDay(projectStartDate, displayDay))
  
  
  // Set timeline to show work day from 8:00 AM to 5:30 PM
  const timelineStart = new Date(displayDate)
  timelineStart.setHours(8, 0, 0, 0) // Start at 8:00 AM
  const timelineEnd = new Date(displayDate)
  timelineEnd.setHours(17, 30, 0, 0) // End at 5:30 PM

  const isLoading = vehiclesLoading || tasksLoading

  // Convert hardcoded tasks and database data to Gantt tasks
  const ganttTasks = useMemo(() => {
    const allTasks: GanttTask[] = []
    const currentTime = new Date()

    // Use hardcoded task schedule as primary source
    const scheduleTasks = getAllHardcodedTasks()
    
    scheduleTasks.forEach((scheduleTask, index) => {
      const startDate = parseTimeToDate(scheduleTask.start, displayDate)
      const endDate = parseTimeToDate(scheduleTask.end, displayDate)
      const vehicleId = extractVehicleId(scheduleTask.name)
      const taskType = getTaskType(scheduleTask.name)
      const priority = getTaskPriority(scheduleTask.name)
      const status = getTaskStatus(scheduleTask.name, currentTime, startDate, endDate)
      const colors = getTaskColor(scheduleTask.name, status)
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60) // hours
      
      // Find matching database task for real-time status updates
      const dbTask = tasks.find(t => 
        t.name.toLowerCase().includes(scheduleTask.name.toLowerCase().split(' ')[0]) ||
        (vehicleId && t.vehicle_id === vehicleId)
      )
      
      // Find matching vehicle for real-time vehicle data
      const dbVehicle = vehicleId ? vehicles.find(v => v.id === vehicleId) : null
      
      const ganttTask: GanttTask = {
        id: `schedule-${index}`,
        name: scheduleTask.name,
        vehicleId: vehicleId || undefined,
        vehicleType: dbVehicle?.type,
        startDate,
        endDate,
        duration,
        progress: dbTask?.status === 'Completed' ? 100 : 
                 dbTask?.status === 'In Progress' ? 60 : 
                 dbTask?.status === 'Blocked' ? 0 : 
                 status === 'Completed' ? 100 : 
                 status === 'In Progress' ? 50 : 0,
        status: dbTask?.status || status,
        priority: dbTask?.priority || priority,
        assignedTo: (Array.isArray(dbTask?.assigned_to) ? dbTask.assigned_to[0] : dbTask?.assigned_to) || 
                   (taskType === 'vehicle' ? 'Installation Team' : 
                    scheduleTask.period === 'lunch' ? 'All Team' : 
                    'Technical Team'),
        location: dbVehicle?.location || 'Bahir Dar',
        type: taskType,
        color: getTaskColor(scheduleTask.name, dbTask?.status || status).bg,
        textColor: getTaskColor(scheduleTask.name, dbTask?.status || status).text,
        resources: dbVehicle ? {
          gps: dbVehicle.gps_required,
          fuel: dbVehicle.fuel_sensors,
          tanks: dbVehicle.fuel_tanks
        } : undefined
      }
      
      // Apply show filters
      const shouldShow = (taskType === 'vehicle' && showVehicles) || 
                        (taskType === 'task' && showTasks)
      
      if (shouldShow) {
        allTasks.push(ganttTask)
      }
    })

    return allTasks
  }, [displayDate, vehicles, tasks, showVehicles, showTasks])

  // Filter tasks based on current filters AND current day
  const filteredTasks = useMemo(() => {
    return ganttTasks.filter(task => {
      // Check if task is scheduled for current day
      const taskDate = new Date(task.startDate.toDateString())
      const currentDate = new Date(displayDate.toDateString())
      const isCurrentDay = taskDate.getTime() === currentDate.getTime()
      
      // Also include tasks that span current day
      const taskSpansCurrentDay = task.startDate <= displayDate && task.endDate >= displayDate
      
      const dayMatch = isCurrentDay || taskSpansCurrentDay
      const locationMatch = selectedLocation === 'All' || task.location === selectedLocation
      const statusMatch = selectedStatus === 'All' || task.status === selectedStatus
      const searchMatch = searchTerm === '' || 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.vehicleId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
      
      return dayMatch && locationMatch && statusMatch && searchMatch
    })
  }, [ganttTasks, selectedLocation, selectedStatus, searchTerm, displayDate])

  // Group tasks by type and vehicle with proper sorting
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: { name: string, tasks: GanttTask[], color: string, sortKey?: string } } = {}

    // Group by individual vehicle for tasks
    filteredTasks.forEach(task => {
      const groupKey = task.type === 'vehicle' 
        ? `vehicles-${task.location || 'Unknown'}` 
        : `tasks-${task.vehicleId || 'general'}`
      
      const groupName = task.type === 'vehicle'
        ? `${task.location || 'Unknown'} - Vehicle Installations`
        : `${task.vehicleId || 'General'} - Tasks`
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          name: groupName,
          tasks: [],
          color: task.type === 'vehicle' ? '#3B82F6' : '#8B5CF6',
          sortKey: task.vehicleId || task.location || 'zzz'
        }
      }
      
      groups[groupKey].tasks.push(task)
    })

    // Sort tasks within groups by start date
    Object.values(groups).forEach(group => {
      group.tasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    })

    // Convert to sorted array and back to object to maintain order
    const sortedEntries = Object.entries(groups).sort(([keyA, groupA], [keyB, groupB]) => {
      // Extract vehicle numbers for proper numerical sorting
      const getVehicleNumber = (sortKey: string) => {
        const match = sortKey.match(/V(\d+)/)
        return match ? parseInt(match[1]) : 999999
      }
      
      const numA = getVehicleNumber(groupA.sortKey || keyA)
      const numB = getVehicleNumber(groupB.sortKey || keyB)
      
      return numA - numB
    })

    // Rebuild groups object in sorted order
    const sortedGroups: { [key: string]: { name: string, tasks: GanttTask[], color: string } } = {}
    sortedEntries.forEach(([key, group]) => {
      sortedGroups[key] = {
        name: group.name,
        tasks: group.tasks,
        color: group.color
      }
    })

    return sortedGroups
  }, [filteredTasks])

  // Generate timeline intervals for current day (30-minute intervals)
  const timelineDates = useMemo(() => {
    const dates = []
    const current = new Date(timelineStart)
    const cellWidth = 80 * zoomLevel // Base width per 30-minute interval
    
    while (current <= timelineEnd) {
      const isHourMark = current.getMinutes() === 0 || current.getMinutes() === 30
      const isFullHour = current.getMinutes() === 0
      
      dates.push({
        date: new Date(current),
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
      
      current.setMinutes(current.getMinutes() + 30) // Increment by 30 minutes
    }
    
    return dates
  }, [timelineStart, timelineEnd, zoomLevel])

  // Auto-expand all groups when data loads
  useEffect(() => {
    const allGroupKeys = Object.keys(groupedTasks)
    if (allGroupKeys.length > 0) {
      setExpandedGroups(new Set(allGroupKeys))
    }
  }, [groupedTasks])


  // Calculate task position and width for 30-minute interval timeline
  const getTaskDimensions = useCallback((task: GanttTask) => {
    const startOffsetMinutes = (task.startDate.getTime() - timelineStart.getTime()) / (1000 * 60)
    const durationMinutes = (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60)
    
    // Each 30-minute interval is 80px * zoomLevel
    const pixelsPerMinute = (80 * zoomLevel) / 30
    const left = Math.max(0, startOffsetMinutes * pixelsPerMinute)
    
    // Calculate minimum width based on text length to prevent truncation
    const textLength = task.name.length
    const minWidthForText = Math.max(textLength * 7.5, 140) // ~7.5px per character, minimum 140px
    const calculatedWidth = durationMinutes * pixelsPerMinute
    const width = Math.max(calculatedWidth, minWidthForText)
    
    return { left, width }
  }, [timelineStart, zoomLevel])



  // Calculate task progress based on status
  const calculateRealTimeProgress = useCallback((task: GanttTask) => {
    if (task.status === 'Completed') return 100
    if (task.status === 'Blocked') return 0
    if (task.status === 'In Progress') return task.progress
    return task.progress
  }, [])

  // Handle task drag
  const handleTaskDrag = useCallback((task: GanttTask, newStartDate: Date) => {
    const duration = task.endDate.getTime() - task.startDate.getTime()
    const newEndDate = new Date(newStartDate.getTime() + duration)
    
    // Update task in database
    if (task.type === 'task') {
      supabase.from('tasks').update({
        start_date: newStartDate.toISOString(),
        end_date: newEndDate.toISOString()
      }).eq('id', task.id)
    } else if (task.type === 'vehicle') {
      const dayNumber = Math.ceil((newStartDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
      supabase.from('vehicles').update({
        day: Math.max(1, dayNumber)
      }).eq('id', task.vehicleId)
    }
  }, [projectStart])

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
            {task.type === 'vehicle' ? <Truck className="w-3 h-3 flex-shrink-0" /> : <Target className="w-3 h-3 flex-shrink-0" />}
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
          {task.resources && (
            <div>Resources: GPS:{task.resources.gps} Fuel:{task.resources.fuel}</div>
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
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading Gantt chart...</span>
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
        
        /* Ensure main container doesn't cause page scrolling */
        .gantt-container {
          max-height: calc(100vh - 200px);
          overflow: hidden;
        }
      `}</style>
      
    <div className="space-y-6 gantt-container" ref={ganttRef}>
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
                id="showVehicles"
                checked={showVehicles}
                onChange={(e) => setShowVehicles(e.target.checked)}
                className="rounded border-gray-300 text-purple-600"
              />
              <label htmlFor="showVehicles" className="text-sm text-gray-700">Vehicles</label>
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

            <button
              onClick={() => {
                // Refresh data
                window.location.reload()
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Timeline Header */}
        <div className="border-b border-gray-200 relative" style={{ zIndex: 1 }}>
          <div className="flex">
            {/* Left panel for task names */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
              <div className="font-semibold text-gray-700">Tasks</div>
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
            {/* Left panel for task list */}
            <div className="w-80 bg-gray-50 border-r border-gray-200">
              {Object.entries(groupedTasks)
                .filter(([groupKey, group]) => !groupKey.includes('general')) // Filter out General - Tasks
                .map(([groupKey, group], groupIndex) => (
                <div key={groupKey} className="border-b border-gray-200">
                  <div 
                    className="p-3 bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-between"
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: group.color }}></div>
                      <span className="font-medium text-gray-900">{group.name}</span>
                      <span className="text-xs text-gray-600">({group.tasks.length})</span>
                    </div>
                    <ChevronRight 
                      className={`w-4 h-4 transition-transform ${
                        expandedGroups.has(groupKey) ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                  
                  {expandedGroups.has(groupKey) && (
                    <div>
                      {group.tasks.map((task, taskIndex) => (
                        <div key={task.id} className="p-2 pl-6 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-center space-x-2">
                            {task.type === 'vehicle' ? <Truck className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">{task.name}</div>
                              <div className="text-xs text-gray-600">{task.assignedTo}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-gray-500">{Math.round(calculateRealTimeProgress(task))}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
            value: filteredTasks.length, 
            color: 'bg-purple-500',
            icon: BarChart3
          },
          { 
            label: 'Completed', 
            value: filteredTasks.filter(t => t.status === 'Completed').length, 
            color: 'bg-green-500',
            icon: CheckCircle2
          },
          { 
            label: 'In Progress', 
            value: filteredTasks.filter(t => t.status === 'In Progress').length, 
            color: 'bg-blue-500',
            icon: Activity
          },
          { 
            label: 'Behind Schedule', 
            value: filteredTasks.filter(t => t.endDate < new Date() && t.status !== 'Completed').length, 
            color: 'bg-red-500',
            icon: AlertTriangle
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
