'use client'

import { useMemo, useCallback } from 'react'
import { useVehicles, useLocations, useTeamMembers } from './useUnifiedData'
import { useProjectSettings } from './useProjectSettings'
import { Vehicle } from '@/lib/supabase/types'
import { calculateDateForDay } from '@/lib/utils/projectUtils'

// Specialized hook for Schedule pages that optimizes data fetching and computation
export function useSchedule() {
  const { data: vehicles = [], isLoading: vehiclesLoading, error: vehiclesError, mutate: refetchVehicles } = useVehicles()
  const { data: locations = [], isLoading: locationsLoading } = useLocations()
  const { data: teamMembers = [], isLoading: teamMembersLoading } = useTeamMembers()
  const { settings: projectSettings, loading: settingsLoading } = useProjectSettings()
  
  // Aggregate loading and error states
  const isLoading = vehiclesLoading || locationsLoading || teamMembersLoading || settingsLoading
  const hasError = vehiclesError
  
  // Memoized computed values for schedule
  const scheduleData = useMemo(() => {
    if (!vehicles || !locations || !teamMembers || !projectSettings) {
      return {
        projectStartDate: new Date().toISOString().split('T')[0],
        scheduleStats: { total: 0, completed: 0, inProgress: 0, pending: 0, totalGps: 0, totalSensors: 0 },
        uniqueDays: [],
        isDataReady: false,
        totalDays: 14,
        timeSlots: []
      }
    }
    
    const projectStartDate = projectSettings.project_start_date || new Date().toISOString().split('T')[0]
    
    // Calculate schedule statistics
    const scheduleStats = {
      total: vehicles.length,
      completed: vehicles.filter(v => v.status === 'Completed').length,
      inProgress: vehicles.filter(v => v.status === 'In Progress').length,
      pending: vehicles.filter(v => v.status === 'Pending').length,
      totalGps: vehicles.reduce((sum, v) => sum + v.gps_required, 0),
      totalSensors: vehicles.reduce((sum, v) => sum + v.fuel_sensors, 0)
    }
    
    // Get unique days and time slots from actual data
    const uniqueDays = Array.from(new Set(vehicles.map(v => v.day))).sort((a, b) => a - b)
    const timeSlots = Array.from(new Set(vehicles.map(v => v.time_slot))).filter(Boolean).sort()
    
    return {
      projectStartDate,
      scheduleStats,
      uniqueDays,
      timeSlots,
      totalDays: 14, // 2-week project
      isDataReady: true
    }
  }, [vehicles, locations, teamMembers, projectSettings])
  
  // Utility functions
  const getVehicleInstallationDate = useCallback((vehicle: Vehicle) => {
    return calculateDateForDay(scheduleData.projectStartDate, vehicle.day)
  }, [scheduleData.projectStartDate])
  
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completed': return '✅'
      case 'In Progress': return '🔄'
      case 'Pending': return '⏳'
      default: return '⚠️'
    }
  }, [])
  
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-red-100 text-red-800 border-red-200'
    }
  }, [])
  
  // Filter and sort vehicles efficiently
  const getFilteredVehicles = useCallback((filters: {
    location?: string
    day?: number | null
    status?: string
    search?: string
    sortBy?: 'day' | 'location' | 'status' | 'type'
    sortOrder?: 'asc' | 'desc'
  }) => {
    const { location, day, status, search, sortBy = 'day', sortOrder = 'asc' } = filters
    
    // Filter vehicles
    let filtered = vehicles.filter(vehicle => {
      const locationMatch = !location || location === 'All' || vehicle.location === location
      const dayMatch = day === null || vehicle.day === day
      const statusMatch = !status || status === 'All' || vehicle.status === status
      const searchMatch = !search || search === '' || 
        vehicle.id.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.type.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.location.toLowerCase().includes(search.toLowerCase())
      
      return locationMatch && dayMatch && statusMatch && searchMatch
    })
    
    // Sort vehicles
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'day':
          aValue = a.day
          bValue = b.day
          break
        case 'location':
          aValue = a.location
          bValue = b.location
          break
        case 'status':
          const statusOrder = { 'In Progress': 3, 'Pending': 2, 'Completed': 1 }
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return filtered
  }, [vehicles])
  
  // Group vehicles by day and time slot for calendar view
  const getVehiclesByDayAndTime = useCallback((filters: {
    location?: string
    status?: string
    search?: string
  } = {}) => {
    const filtered = getFilteredVehicles(filters)
    const grouped: Record<number, Record<string, Vehicle[]>> = {}
    
    filtered.forEach(vehicle => {
      if (!grouped[vehicle.day]) {
        grouped[vehicle.day] = {}
      }
      if (!grouped[vehicle.day][vehicle.time_slot]) {
        grouped[vehicle.day][vehicle.time_slot] = []
      }
      grouped[vehicle.day][vehicle.time_slot].push(vehicle)
    })
    
    return grouped
  }, [getFilteredVehicles])
  
  return {
    ...scheduleData,
    isLoading,
    hasError,
    // Data
    vehicles,
    locations,
    teamMembers,
    projectSettings,
    // Functions
    refetchVehicles,
    getVehicleInstallationDate,
    getStatusIcon,
    getStatusColor,
    getFilteredVehicles,
    getVehiclesByDayAndTime
  }
}

// Specialized hooks for performance
export function useScheduleStats() {
  const { scheduleStats, isLoading, hasError } = useSchedule()
  return { scheduleStats, isLoading, hasError }
}

export function useScheduleFilters() {
  const { vehicles, locations, uniqueDays, timeSlots, getFilteredVehicles, getVehiclesByDayAndTime } = useSchedule()
  return { vehicles, locations, uniqueDays, timeSlots, getFilteredVehicles, getVehiclesByDayAndTime }
}
