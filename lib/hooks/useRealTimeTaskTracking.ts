'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Vehicle } from '@/lib/supabase/types'
import { db } from '@/lib/supabase/database'
import type { GanttTask } from '@/lib/utils/taskManager'

interface TaskUpdate {
  vehicleId: string
  status: Vehicle['status']
  progress?: number
  timestamp: Date
}

interface RealTimeTaskTrackingOptions {
  autoUpdateInterval?: number // in seconds
  enableRealTimeUpdates?: boolean
  enableProgressTracking?: boolean
}

// Real-time task tracking hook that automatically updates task status based on vehicle progress
export function useRealTimeTaskTracking(
  tasks: GanttTask[],
  options: RealTimeTaskTrackingOptions = {}
) {
  const {
    autoUpdateInterval = 30, // 30 seconds
    enableRealTimeUpdates = true,
    enableProgressTracking = true
  } = options
  
  const [taskUpdates, setTaskUpdates] = useState<Map<string, TaskUpdate>>(new Map())
  const [isTracking, setIsTracking] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionRef = useRef<any>(null)
  
  // Update task status based on real-time vehicle data
  const updateTaskStatus = useCallback(async (vehicleId: string, newStatus: Vehicle['status']) => {
    try {
      const { error } = await db.vehicles.update(vehicleId, {
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      
      if (error) throw error
      
      // Track the update locally
      setTaskUpdates(prev => new Map(prev).set(vehicleId, {
        vehicleId,
        status: newStatus,
        progress: newStatus === 'Completed' ? 100 : newStatus === 'In Progress' ? 60 : 0,
        timestamp: new Date()
      }))
      
    } catch (error) {
      console.error('Failed to update task status:', error)
    }
  }, [])
  
  // Auto-update task status based on time and current status
  const autoUpdateTaskStatus = useCallback(async () => {
    if (!enableProgressTracking) return
    
    const now = new Date()
    let updatesCount = 0
    
    for (const task of tasks) {
      if (!task.vehicleId) continue
      
      // Skip if task is already completed or blocked
      if (task.status === 'Completed' || task.status === 'Blocked') continue
      
      const shouldBeInProgress = now >= task.startDate && now <= task.endDate
      const shouldBeCompleted = now > task.endDate
      
      // Determine what the status should be
      let expectedStatus: Vehicle['status']
      if (shouldBeCompleted) {
        expectedStatus = 'Completed'
      } else if (shouldBeInProgress) {
        expectedStatus = 'In Progress'
      } else {
        expectedStatus = 'Pending'
      }
      
      // Update if status has changed
      if (task.status !== expectedStatus) {
        await updateTaskStatus(task.vehicleId, expectedStatus)
        updatesCount++
      }
    }
    
    if (updatesCount > 0) {
      setLastUpdateTime(new Date())
    }
  }, [tasks, enableProgressTracking, updateTaskStatus])
  
  // Set up real-time subscription for vehicle status changes
  useEffect(() => {
    if (!enableRealTimeUpdates) return
    
    const setupRealtimeSubscription = () => {
      subscriptionRef.current = supabase
        .channel('vehicle-status-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'vehicles',
          filter: 'status=neq.NULL'
        }, (payload: any) => {
          const { new: newRecord } = payload
          if (newRecord?.id && newRecord?.status) {
            setTaskUpdates(prev => new Map(prev).set(newRecord.id, {
              vehicleId: newRecord.id,
              status: newRecord.status,
              progress: newRecord.status === 'Completed' ? 100 : 
                       newRecord.status === 'In Progress' ? 60 : 0,
              timestamp: new Date()
            }))
            setLastUpdateTime(new Date())
          }
        })
        .subscribe()
    }
    
    setupRealtimeSubscription()
    
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [enableRealTimeUpdates])
  
  // Set up auto-update interval
  useEffect(() => {
    if (!enableProgressTracking || autoUpdateInterval <= 0) return
    
    setIsTracking(true)
    
    intervalRef.current = setInterval(() => {
      autoUpdateTaskStatus()
    }, autoUpdateInterval * 1000)
    
    return () => {
      setIsTracking(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoUpdateTaskStatus, autoUpdateInterval, enableProgressTracking])
  
  // Get updated task with real-time status
  const getUpdatedTask = useCallback((task: GanttTask): GanttTask => {
    if (!task.vehicleId) return task
    
    const update = taskUpdates.get(task.vehicleId)
    if (!update) return task
    
    return {
      ...task,
      status: update.status,
      progress: update.progress || task.progress,
      // Update color based on new status
      color: update.status === 'Completed' ? '#10B981' : 
             update.status === 'In Progress' ? '#3B82F6' : 
             (update.status as any) === 'Blocked' ? '#EF4444' : task.color,
      textColor: update.status === 'Completed' || update.status === 'In Progress' || (update.status as any) === 'Blocked' ? '#FFFFFF' : task.textColor
    }
  }, [taskUpdates])
  
  // Get all updated tasks
  const getUpdatedTasks = useCallback((taskList: GanttTask[]): GanttTask[] => {
    return taskList.map(task => getUpdatedTask(task))
  }, [getUpdatedTask])
  
  // Manual methods for external control
  const startTracking = useCallback(() => {
    if (intervalRef.current) return
    
    setIsTracking(true)
    intervalRef.current = setInterval(() => {
      autoUpdateTaskStatus()
    }, autoUpdateInterval * 1000)
  }, [autoUpdateTaskStatus, autoUpdateInterval])
  
  const stopTracking = useCallback(() => {
    setIsTracking(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])
  
  const forceUpdate = useCallback(() => {
    autoUpdateTaskStatus()
  }, [autoUpdateTaskStatus])
  
  // Clear all updates
  const clearUpdates = useCallback(() => {
    setTaskUpdates(new Map())
  }, [])
  
  return {
    // State
    isTracking,
    lastUpdateTime,
    taskUpdates: Array.from(taskUpdates.values()),
    
    // Methods
    updateTaskStatus,
    getUpdatedTask,
    getUpdatedTasks,
    startTracking,
    stopTracking,
    forceUpdate,
    clearUpdates,
    
    // Stats
    totalUpdates: taskUpdates.size,
    hasUpdates: taskUpdates.size > 0
  }
}

// Hook for simpler use cases - just get updated tasks
export function useRealTimeTasks(tasks: GanttTask[], autoUpdate: boolean = true) {
  const { getUpdatedTasks, isTracking, lastUpdateTime } = useRealTimeTaskTracking(tasks, {
    enableRealTimeUpdates: autoUpdate,
    enableProgressTracking: autoUpdate
  })
  
  return {
    tasks: getUpdatedTasks(tasks),
    isTracking,
    lastUpdateTime
  }
}

// Hook for manual task status updates
export function useTaskStatusUpdater() {
  const [isUpdating, setIsUpdating] = useState(false)
  
  const updateTaskStatus = useCallback(async (vehicleId: string, newStatus: Vehicle['status']) => {
    setIsUpdating(true)
    try {
      const { error } = await db.vehicles.update(vehicleId, {
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to update task status:', error)
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [])
  
  return {
    updateTaskStatus,
    isUpdating
  }
}
