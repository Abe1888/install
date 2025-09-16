'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useVehicles, useLocations, useTeamMembers, useTasks } from './useUnifiedData'
import { useProjectSettings } from './useProjectSettings'
import { supabase } from '@/lib/supabase/client'
import useSWR from 'swr'
import type { Vehicle, Location, TeamMember, Task, Comment, ProjectSettings } from '@/lib/supabase/types'

export interface APIDataMetrics {
  totalRecords: number
  lastUpdateTime: Date
  fetchDuration: number
  cacheHitRate: number
  realtimeConnections: number
}

export interface APIDataSummary {
  vehicles: {
    total: number
    completed: number
    inProgress: number
    pending: number
    byLocation: Record<string, number>
  }
  tasks: {
    total: number
    completed: number
    inProgress: number
    pending: number
    blocked: number
    byPriority: Record<string, number>
  }
  locations: {
    total: number
    totalVehicles: number
    totalGPS: number
    totalFuelSensors: number
  }
  teamMembers: {
    total: number
    averageCompletionRate: number
    averageTaskTime: number
    averageQualityScore: number
  }
  comments: {
    total: number
    byTask: Record<string, number>
    recentComments: number
  }
  projectSettings: {
    configured: boolean
    startDate: string | null
    totalDays: number
    activeTimeslots: number
  }
}

// Fetcher for comments
const fetchComments = async () => {
  const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Performance monitoring hook for real-time API data
export function useRealTimeAPIData() {
  const fetchStartTime = useRef(Date.now())
  
  // Fetch all data with real-time enabled
  const { 
    data: vehicles = [], 
    isLoading: vehiclesLoading, 
    error: vehiclesError 
  } = useVehicles(true)
  
  const { 
    data: locations = [], 
    isLoading: locationsLoading, 
    error: locationsError 
  } = useLocations(true)
  
  const { 
    data: teamMembers = [], 
    isLoading: teamLoading, 
    error: teamError 
  } = useTeamMembers(true)
  
  const { 
    data: tasks = [], 
    isLoading: tasksLoading, 
    error: tasksError 
  } = useTasks(undefined, true)
  
  const { 
    settings: projectSettings, 
    loading: projectLoading, 
    error: projectError 
  } = useProjectSettings()
  
  const { 
    data: comments = [], 
    isLoading: commentsLoading, 
    error: commentsError 
  } = useSWR<Comment[]>(
    'comments',
    fetchComments,
    {
      refreshInterval: 0, // Use real-time subscriptions
      revalidateOnFocus: false
    }
  )

  // Aggregate loading states
  const isLoading = vehiclesLoading || locationsLoading || teamLoading || tasksLoading || projectLoading || commentsLoading
  const hasError = vehiclesError || locationsError || teamError || tasksError || projectError || commentsError
  const isReady = !isLoading && !hasError

  // Performance metrics calculation
  const metrics = useMemo((): APIDataMetrics => {
    const now = new Date()
    const fetchDuration = Date.now() - fetchStartTime.current
    
    return {
      totalRecords: vehicles.length + locations.length + teamMembers.length + tasks.length + comments.length + (projectSettings ? 1 : 0),
      lastUpdateTime: now,
      fetchDuration,
      cacheHitRate: 0.85, // Simulated - would be calculated from SWR cache hits
      realtimeConnections: 6 // One for each table subscription
    }
  }, [vehicles.length, locations.length, teamMembers.length, tasks.length, comments.length, projectSettings])

  // Comprehensive data summary with optimized calculations
  const dataSummary = useMemo((): APIDataSummary => {
    // Vehicle statistics
    const vehiclesByStatus = vehicles.reduce((acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const vehiclesByLocation = vehicles.reduce((acc, vehicle) => {
      acc[vehicle.location] = (acc[vehicle.location] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Task statistics  
    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Location aggregations
    const locationTotals = locations.reduce(
      (acc, location) => ({
        totalVehicles: acc.totalVehicles + location.vehicles,
        totalGPS: acc.totalGPS + location.gps_devices,
        totalFuelSensors: acc.totalFuelSensors + location.fuel_sensors
      }),
      { totalVehicles: 0, totalGPS: 0, totalFuelSensors: 0 }
    )

    // Team member averages
    const teamAverages = teamMembers.reduce(
      (acc, member, _, arr) => ({
        completionRate: acc.completionRate + member.completion_rate / arr.length,
        taskTime: acc.taskTime + member.average_task_time / arr.length,
        qualityScore: acc.qualityScore + member.quality_score / arr.length
      }),
      { completionRate: 0, taskTime: 0, qualityScore: 0 }
    )
    
    // Comments statistics
    const commentsByTask = comments.reduce((acc, comment) => {
      acc[comment.task_id] = (acc[comment.task_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const recentComments = comments.filter(comment => {
      const commentDate = new Date(comment.created_at)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return commentDate > dayAgo
    }).length
    
    // Project settings analysis
    const uniqueTimeslots = new Set(vehicles.map(v => v.time_slot)).size
    const maxDay = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.day)) : 0

    return {
      vehicles: {
        total: vehicles.length,
        completed: vehiclesByStatus['Completed'] || 0,
        inProgress: vehiclesByStatus['In Progress'] || 0,
        pending: vehiclesByStatus['Pending'] || 0,
        byLocation: vehiclesByLocation
      },
      tasks: {
        total: tasks.length,
        completed: tasksByStatus['Completed'] || 0,
        inProgress: tasksByStatus['In Progress'] || 0,
        pending: tasksByStatus['Pending'] || 0,
        blocked: tasksByStatus['Blocked'] || 0,
        byPriority: tasksByPriority
      },
      locations: {
        total: locations.length,
        ...locationTotals
      },
      teamMembers: {
        total: teamMembers.length,
        averageCompletionRate: Math.round(teamAverages.completionRate * 100) / 100,
        averageTaskTime: Math.round(teamAverages.taskTime * 100) / 100,
        averageQualityScore: Math.round(teamAverages.qualityScore * 100) / 100
      },
      comments: {
        total: comments.length,
        byTask: commentsByTask,
        recentComments
      },
      projectSettings: {
        configured: !!projectSettings,
        startDate: projectSettings?.project_start_date || null,
        totalDays: maxDay,
        activeTimeslots: uniqueTimeslots
      }
    }
  }, [vehicles, tasks, locations, teamMembers, comments, projectSettings])

  // Raw data access
  const rawData = useMemo(() => ({
    vehicles,
    locations,
    teamMembers,
    tasks,
    comments,
    projectSettings
  }), [vehicles, locations, teamMembers, tasks, comments, projectSettings])

  // Update fetch start time when loading begins
  useEffect(() => {
    if (isLoading) {
      fetchStartTime.current = Date.now()
    }
  }, [isLoading])

  return {
    // Data
    data: rawData,
    summary: dataSummary,
    metrics,
    
    // States
    isLoading,
    hasError,
    isReady,
    
    // Individual errors for debugging
    errors: {
      vehicles: vehiclesError,
      locations: locationsError,
      teamMembers: teamError,
      tasks: tasksError,
      comments: commentsError,
      projectSettings: projectError
    }
  }
}

// Lightweight version for quick stats only
export function useRealTimeAPIStats() {
  const { summary, metrics, isLoading, hasError } = useRealTimeAPIData()
  
  return {
    summary,
    metrics,
    isLoading,
    hasError
  }
}
