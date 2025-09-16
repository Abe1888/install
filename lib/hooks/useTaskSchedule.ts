'use client'

import { useMemo, useCallback } from 'react'
import { useVehicles, useLocations, useTeamMembers } from './useUnifiedData'
import { useProjectSettings } from './useProjectSettings'
import { Vehicle } from '@/lib/supabase/types'
import { calculateDateForDay } from '@/lib/utils/projectUtils'
import {
  generateAllTasksFromVehicles,
  filterTasks,
  groupTasks,
  type GanttTask
} from '@/lib/utils/taskManager'

export interface TaskScheduleFilters {
  day?: Date | number | null
  location?: string
  status?: string
  vehicleId?: string
  type?: string
  category?: string
  search?: string
}

export interface TaskScheduleOptions {
  showVehicles?: boolean
  showTasks?: boolean
  showInstallations?: boolean
  groupBy?: 'vehicle' | 'location' | 'type' | 'category' | 'assignee'
}

// Unified task scheduling hook for both Gantt Chart and Vehicle Schedule
export function useTaskSchedule(
  filters: TaskScheduleFilters = {},
  options: TaskScheduleOptions = {}
) {
  const { data: vehicles = [], isLoading: vehiclesLoading, error: vehiclesError, mutate: refetchVehicles } = useVehicles()
  const { data: locations = [], isLoading: locationsLoading } = useLocations()
  const { data: teamMembers = [], isLoading: teamMembersLoading } = useTeamMembers()
  const { settings: projectSettings, loading: settingsLoading } = useProjectSettings()
  
  // Default options
  const {
    showVehicles = true,
    showTasks = true,
    showInstallations = true,
    groupBy = 'vehicle'
  } = options
  
  // Aggregate loading and error states
  const isLoading = vehiclesLoading || locationsLoading || teamMembersLoading || settingsLoading
  const hasError = vehiclesError
  
  // Memoized computed values
  const taskData = useMemo(() => {
    if (!vehicles || !locations || !teamMembers || !projectSettings) {
      return {
        projectStartDate: new Date().toISOString().split('T')[0],
        allTasks: [],
        taskStats: { total: 0, completed: 0, inProgress: 0, pending: 0, blocked: 0 },
        uniqueDays: [],
        uniqueLocations: [],
        uniqueVehicles: [],
        uniqueCategories: [],
        timeSlots: [],
        isDataReady: false
      }
    }
    
    const projectStartDate = projectSettings.project_start_date || new Date().toISOString().split('T')[0]
    
    // Generate all tasks from current vehicle data
    const allTasks = generateAllTasksFromVehicles(vehicles, projectStartDate)
    
    // Apply type filters
    const filteredByType = allTasks.filter(task => {
      const shouldShowVehicle = task.type === 'vehicle' && showVehicles
      const shouldShowInstallation = task.type === 'installation' && showInstallations
      const shouldShowTask = task.type === 'task' && showTasks
      
      return shouldShowVehicle || shouldShowInstallation || shouldShowTask
    })
    
    // Calculate task statistics
    const taskStats = {
      total: filteredByType.length,
      completed: filteredByType.filter(t => t.status === 'Completed').length,
      inProgress: filteredByType.filter(t => t.status === 'In Progress').length,
      pending: filteredByType.filter(t => t.status === 'Pending').length,
      blocked: filteredByType.filter(t => t.status === 'Blocked').length
    }
    
    // Extract unique values for filters
    const uniqueDays = Array.from(new Set(
      filteredByType.map(t => Math.ceil((t.startDate.getTime() - new Date(projectStartDate).getTime()) / (1000 * 60 * 60 * 24)))
    )).sort((a, b) => a - b)
    
    const uniqueLocations = Array.from(new Set(
      filteredByType.map(t => t.location).filter(Boolean)
    )).sort()
    
    const uniqueVehicles = Array.from(new Set(
      filteredByType.map(t => t.vehicleId).filter(Boolean)
    )).sort()
    
    const uniqueCategories = Array.from(new Set(
      filteredByType.map(t => t.category).filter(Boolean)
    )).sort()
    
    const timeSlots = Array.from(new Set(
      vehicles.map(v => v.time_slot).filter(Boolean)
    )).sort()
    
    return {
      projectStartDate,
      allTasks: filteredByType,
      taskStats,
      uniqueDays,
      uniqueLocations,
      uniqueVehicles,
      uniqueCategories,
      timeSlots,
      isDataReady: true
    }
  }, [vehicles, locations, teamMembers, projectSettings, showVehicles, showTasks, showInstallations])
  
  // Apply filters
  const filteredTasks = useMemo(() => {
    if (!taskData.isDataReady) return []
    
    // Convert day number to date if needed
    let dayFilter: Date | undefined
    if (filters.day !== null && filters.day !== undefined) {
      if (typeof filters.day === 'number') {
        dayFilter = new Date(calculateDateForDay(taskData.projectStartDate, filters.day))
      } else if (filters.day instanceof Date) {
        dayFilter = filters.day
      }
    }
    
    return filterTasks(taskData.allTasks, {
      day: dayFilter,
      location: filters.location,
      status: filters.status,
      vehicleId: filters.vehicleId,
      type: filters.type,
      category: filters.category,
      search: filters.search
    })
  }, [taskData, filters])
  
  // Group tasks
  const groupedTasks = useMemo(() => {
    if (!filteredTasks.length) return {}
    return groupTasks(filteredTasks, groupBy)
  }, [filteredTasks, groupBy])
  
  // Utility functions
  const getTasksForDay = useCallback((day: number) => {
    const dayDate = new Date(calculateDateForDay(taskData.projectStartDate, day))
    return filterTasks(taskData.allTasks, { day: dayDate })
  }, [taskData])
  
  const getTasksForVehicle = useCallback((vehicleId: string) => {
    return filterTasks(taskData.allTasks, { vehicleId })
  }, [taskData])
  
  const getTasksForLocation = useCallback((location: string) => {
    return filterTasks(taskData.allTasks, { location })
  }, [taskData])
  
  const getVehicleInstallationDate = useCallback((vehicle: Vehicle) => {
    return calculateDateForDay(taskData.projectStartDate, vehicle.day)
  }, [taskData.projectStartDate])
  
  const getTaskProgress = useCallback((task: GanttTask) => {
    switch (task.status) {
      case 'Completed': return 100
      case 'In Progress': return task.progress || 60
      case 'Blocked': return 0
      case 'Pending': return 0
      default: return 0
    }
  }, [])
  
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completed': return '✅'
      case 'In Progress': return '🔄'
      case 'Pending': return '⏳'
      case 'Blocked': return '🚫'
      default: return '⚠️'
    }
  }, [])
  
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Blocked': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }, [])
  
  const getTasksByDayAndTime = useCallback((filters: TaskScheduleFilters = {}) => {
    const tasks = filterTasks(taskData.allTasks, filters as any)
    const grouped: Record<number, Record<string, GanttTask[]>> = {}
    
    tasks.forEach(task => {
      const dayNumber = Math.ceil((task.startDate.getTime() - new Date(taskData.projectStartDate).getTime()) / (1000 * 60 * 60 * 24))
      const timeSlot = task.startDate.getHours() < 13 ? '8:30-11:30 AM' : '1:30-5:30 PM'
      
      if (!grouped[dayNumber]) {
        grouped[dayNumber] = {}
      }
      if (!grouped[dayNumber][timeSlot]) {
        grouped[dayNumber][timeSlot] = []
      }
      grouped[dayNumber][timeSlot].push(task)
    })
    
    return grouped
  }, [taskData])
  
  return {
    // Data state
    isLoading,
    hasError,
    isDataReady: taskData.isDataReady,
    
    // Raw data
    vehicles,
    locations,
    teamMembers,
    projectSettings,
    
    // Computed data
    projectStartDate: taskData.projectStartDate,
    allTasks: taskData.allTasks,
    filteredTasks,
    groupedTasks,
    taskStats: taskData.taskStats,
    
    // Filter options
    uniqueDays: taskData.uniqueDays,
    uniqueLocations: taskData.uniqueLocations,
    uniqueVehicles: taskData.uniqueVehicles,
    uniqueCategories: taskData.uniqueCategories,
    timeSlots: taskData.timeSlots,
    
    // Utility functions
    getTasksForDay,
    getTasksForVehicle,
    getTasksForLocation,
    getVehicleInstallationDate,
    getTaskProgress,
    getStatusIcon,
    getStatusColor,
    getTasksByDayAndTime,
    
    // Data management
    refetchVehicles
  }
}

// Specialized hooks for specific use cases
export function useGanttSchedule(day?: number, filters: TaskScheduleFilters = {}) {
  const dayFilters = day ? { ...filters, day } : filters
  return useTaskSchedule(dayFilters, {
    showVehicles: true,
    showTasks: true,
    showInstallations: true,
    groupBy: 'vehicle'
  })
}

export function useCalendarSchedule(filters: TaskScheduleFilters = {}) {
  return useTaskSchedule(filters, {
    showVehicles: true,
    showTasks: true,
    showInstallations: true,
    groupBy: 'location'
  })
}

export function useVehicleListSchedule(filters: TaskScheduleFilters = {}) {
  return useTaskSchedule(filters, {
    showVehicles: true,
    showTasks: false,
    showInstallations: true,
    groupBy: 'vehicle'
  })
}
