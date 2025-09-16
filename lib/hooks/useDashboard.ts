'use client'

import { useMemo } from 'react'
import { useVehicleStats, useLocationStats, useTeamMembers, useTasks } from './useUnifiedData'
import { useProjectSettings } from './useProjectSettings'

// Helper function to determine project status
function getProjectStatus(settings: any) {
  if (!settings?.project_start_date) {
    return { status: 'not_configured', message: 'Project not configured' }
  }
  
  const now = new Date()
  const startDate = new Date(settings.project_start_date)
  const endDate = settings.project_end_date ? new Date(settings.project_end_date) : null
  
  if (now < startDate) {
    return { status: 'pending', message: 'Project not started yet' }
  }
  
  if (endDate && now > endDate) {
    return { status: 'completed', message: 'Project completed' }
  }
  
  return { status: 'live', message: 'Project is Live!' }
}

// Specialized hook for Dashboard that optimizes data fetching and memoizes computed values
export function useDashboard() {
  const { settings: projectSettings, loading: settingsLoading, error: settingsError } = useProjectSettings()
  const { data: vehicleStats, isLoading: vehicleStatsLoading, error: vehicleStatsError } = useVehicleStats()
  const { data: locationStats, isLoading: locationStatsLoading } = useLocationStats()
  const { data: teamMembers = [], isLoading: teamMembersLoading } = useTeamMembers()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks()
  
  // Aggregate loading and error states
  const isLoading = settingsLoading || vehicleStatsLoading || locationStatsLoading || teamMembersLoading || tasksLoading
  const hasError = settingsError || vehicleStatsError
  
  // Calculate project timeline metrics separately to avoid hook nesting
  const timelineMetrics = useMemo(() => {
    if (!projectSettings?.project_start_date) return null
    
    const now = new Date()
    const startDate = new Date(projectSettings.project_start_date)
    const endDate = projectSettings.project_end_date ? new Date(projectSettings.project_end_date) : null
    
    const totalDays = projectSettings.total_days || (endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : null)
    const daysSinceStart = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) + 1
    const daysRemaining = endDate ? Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null
    
    return {
      totalDays,
      daysSinceStart,
      daysRemaining,
      progressPercentage: totalDays ? Math.min(100, Math.round((daysSinceStart / totalDays) * 100)) : null,
      isOverdue: endDate ? now > endDate : false
    }
  }, [projectSettings])
  
  // Memoized computed values to optimize performance
  const computedData = useMemo(() => {
    if (!vehicleStats || !locationStats || !teamMembers || !tasks) {
      return {
        currentStartDate: new Date().toISOString().split('T')[0],
        currentEndDate: null,
        projectStatus: { status: 'not_configured', message: 'Project not configured' },
        projectStats: null,
        isDataReady: false
      }
    }
    
    const currentStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0]
    const currentEndDate = projectSettings?.project_end_date || null
    const projectStatus = getProjectStatus(projectSettings)
    
    const projectStats = {
      vehicles: {
        total: vehicleStats.total,
        completed: vehicleStats.completed,
        inProgress: vehicleStats.inProgress,
        pending: vehicleStats.pending
      },
      tasks: {
        // Real-time task count from database
        total: tasks.length,
        completed: tasks.filter(task => task.status === 'Completed').length,
        inProgress: tasks.filter(task => task.status === 'In Progress').length,
        pending: tasks.filter(task => task.status === 'Pending').length,
        blocked: tasks.filter(task => task.status === 'Blocked').length
      },
      locations: {
        total: locationStats.length,
        activeLocations: locationStats.filter(loc => loc.actualVehicles > 0).length
      },
      teamMemberCount: teamMembers.length,
      projectProgress: vehicleStats.total > 0 ? Math.round((vehicleStats.completed / vehicleStats.total) * 100) : 0,
      // Additional insights
      efficiency: {
        completionRate: vehicleStats.total > 0 ? (vehicleStats.completed / vehicleStats.total) : 0,
        activeWorkRate: vehicleStats.total > 0 ? (vehicleStats.inProgress / vehicleStats.total) : 0,
        pendingRate: vehicleStats.total > 0 ? (vehicleStats.pending / vehicleStats.total) : 0
      },
      // Project timeline metrics
      timeline: timelineMetrics
    }
    
    return {
      currentStartDate,
      currentEndDate,
      projectStatus,
      projectStats,
      isDataReady: true
    }
  }, [vehicleStats, locationStats, teamMembers, tasks, projectSettings, timelineMetrics])
  
  return {
    ...computedData,
    isLoading,
    hasError,
    // Individual data for components that need specific parts
    vehicleStats,
    locationStats,
    teamMembers,
    projectSettings
  }
}

// Additional specialized hooks for performance
export function useDashboardStats() {
  const { projectStats, isLoading, hasError } = useDashboard()
  return { projectStats, isLoading, hasError }
}

export function useDashboardData() {
  const { vehicleStats, locationStats, teamMembers, isLoading, hasError } = useDashboard()
  return { vehicleStats, locationStats, teamMembers, isLoading, hasError }
}
