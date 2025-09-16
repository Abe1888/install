'use client'

import useSWR, { mutate } from 'swr'
import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Vehicle, Location, TeamMember, Task } from '@/lib/supabase/types'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Production-optimized fetcher with error handling and performance logging
async function optimizedFetcher<T>(
  table: string,
  select: string = '*',
  orderBy?: { column: string; ascending?: boolean },
  limit?: number,
  retryCount: number = 0
): Promise<T[]> {
  const startTime = performance.now()
  const maxRetries = 3
  
  try {
    let query = supabase.from(table).select(select)
    
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }
    
    if (limit && limit > 0) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    // Performance monitoring (disabled in production for better performance)
    if (process.env.NODE_ENV === 'development') {
      const duration = performance.now() - startTime
      // Only log if query takes longer than expected
      if (duration > 1000) {
        console.warn(`⚠️ Slow query: ${table} took ${duration.toFixed(2)}ms`)
      }
    }
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    return data || []
  } catch (error) {
    // Retry logic for transient failures
    if (retryCount < maxRetries && shouldRetry(error)) {
      const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay))
      return optimizedFetcher(table, select, orderBy, limit, retryCount + 1)
    }
    
    // Log error for monitoring but don't expose internal details in production
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ Database error fetching ${table}:`, error)
    }
    
    throw error
  }
}

// Helper function to determine if an error should trigger a retry
function shouldRetry(error: any): boolean {
  if (!error) return false
  
  // Retry on network errors, timeouts, and 5xx status codes
  const retryableErrors = [
    'NetworkError',
    'TimeoutError', 
    'AbortError',
    'PGRST301', // JWT expired
  ]
  
  return retryableErrors.some(errorType => 
    error.message?.includes(errorType) || 
    error.code?.includes(errorType) ||
    (error.status >= 500 && error.status < 600)
  )
}

// Unified SWR configuration for production
const PRODUCTION_SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0, // Disable automatic refresh (using real-time subscriptions)
  dedupingInterval: 30000, // 30 seconds
  errorRetryCount: 3,
  errorRetryInterval: 2000,
  keepPreviousData: true,
  fallbackData: [],
  onError: (error: Error, key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`SWR Error for key ${key}:`, error)
    }
    // Could integrate with error reporting service here
  },
}

// Real-time subscription management
const subscriptions = new Map<string, RealtimeChannel>()

// Helper function to setup real-time subscriptions
function setupRealtimeSubscription<T extends Record<string, any>>(
  table: string,
  swrKey: string,
  enabled: boolean = true
) {
  if (!enabled || typeof window === 'undefined') return
  
  // Cleanup existing subscription
  const existingSubscription = subscriptions.get(swrKey)
  if (existingSubscription) {
    supabase.removeChannel(existingSubscription)
    subscriptions.delete(swrKey)
  }
  
  // Create new subscription with unique channel name
  const channel = supabase
    .channel(`realtime-${table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      (payload: RealtimePostgresChangesPayload<T>) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Real-time update for ${table}:`, payload)
        }
        
        // Enhanced debounced approach with increased timeout for reliability
        const debounceKey = `${swrKey}-realtime`
        clearTimeout((globalThis as any)[debounceKey])
        
        ;(globalThis as any)[debounceKey] = setTimeout(() => {
          // Trigger SWR revalidation from server to get fresh data
          mutate(swrKey, undefined, true) // Force revalidate from server
          
          // Also update related keys for cross-table dependencies
          if (table === 'tasks') {
            mutate('team_members-unified') // Update team stats when tasks change
            mutate('vehicles-unified') // Update vehicle info when tasks change
          } else if (table === 'team_members') {
            mutate('tasks-unified') // Update task assignments when team changes
          } else if (table === 'vehicles') {
            mutate('tasks-unified') // Update task display when vehicle data changes
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Real-time update applied for ${table}`);
          }
        }, 150) // Increased from 50ms to 150ms for more reliable updates
      }
    )
    .subscribe((status: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Subscription status for ${table}:`, status)
      }
    })
  
  subscriptions.set(swrKey, channel)
}

// Cleanup function for subscriptions
export function cleanupSubscriptions() {
  subscriptions.forEach((channel) => {
    supabase.removeChannel(channel)
  })
  subscriptions.clear()
}

// 🚀 HIGH-PERFORMANCE VEHICLES HOOK
export function useVehicles(enableRealtime = true) {
  const swrKey = 'vehicles-unified'
  
  const result = useSWR<Vehicle[]>(
    swrKey,
    async () => {
      const vehicles = await optimizedFetcher<Vehicle>('vehicles', '*', { column: 'id', ascending: true })
      // Only deduplicate if we detect actual duplicates (performance optimization)
      const uniqueIds = new Set(vehicles.map(v => v.id))
      if (uniqueIds.size !== vehicles.length) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`🔍 Deduplicating ${vehicles.length - uniqueIds.size} duplicate vehicles`)
        }
        return vehicles.filter((vehicle, index, self) => 
          index === self.findIndex(v => v.id === vehicle.id)
        )
      }
      return vehicles // No deduplication needed
    },
    {
      ...PRODUCTION_SWR_CONFIG,
      refreshInterval: enableRealtime ? 0 : 60000, // No polling if real-time enabled
    }
  )
  
  // Setup real-time subscription
  useEffect(() => {
    setupRealtimeSubscription<Vehicle>('vehicles', swrKey, enableRealtime)
    
    return () => {
      if (enableRealtime) {
        const channel = subscriptions.get(swrKey)
        if (channel) {
          supabase.removeChannel(channel)
          subscriptions.delete(swrKey)
        }
      }
    }
  }, [enableRealtime, swrKey])
  
  return {
    ...result,
    // Add optimistic update function
    optimisticUpdate: useCallback((updatedVehicle: Vehicle) => {
      mutate(swrKey, (current: Vehicle[] = []) => 
        current.map(v => v.id === updatedVehicle.id ? updatedVehicle : v),
        false // Don't revalidate immediately
      )
    }, [swrKey])
  }
}

// 🏢 LOCATIONS HOOK (rarely changes)
export function useLocations(enableRealtime = false) {
  const swrKey = 'locations-unified'
  
  const result = useSWR<Location[]>(
    swrKey,
    () => optimizedFetcher<Location>('locations'),
    {
      ...PRODUCTION_SWR_CONFIG,
      refreshInterval: enableRealtime ? 0 : 300000, // 5 minutes (locations change rarely)
    }
  )
  
  // Setup real-time subscription (optional for locations)
  useEffect(() => {
    setupRealtimeSubscription<Location>('locations', swrKey, enableRealtime)
    
    return () => {
      if (enableRealtime) {
        const channel = subscriptions.get(swrKey)
        if (channel) {
          supabase.removeChannel(channel)
          subscriptions.delete(swrKey)
        }
      }
    }
  }, [enableRealtime, swrKey])
  
  return result
}

// 👥 TEAM MEMBERS HOOK 
export function useTeamMembers(enableRealtime = true) {
  const swrKey = 'team_members-unified'
  
  const result = useSWR<TeamMember[]>(
    swrKey,
    () => optimizedFetcher<TeamMember>('team_members', '*', { column: 'name', ascending: true }),
    {
      ...PRODUCTION_SWR_CONFIG,
      refreshInterval: enableRealtime ? 0 : 300000, // No polling if real-time enabled
    }
  )
  
  // Setup real-time subscription
  useEffect(() => {
    setupRealtimeSubscription<TeamMember>('team_members', swrKey, enableRealtime)
    
    return () => {
      if (enableRealtime) {
        const channel = subscriptions.get(swrKey)
        if (channel) {
          supabase.removeChannel(channel)
          subscriptions.delete(swrKey)
        }
      }
    }
  }, [enableRealtime, swrKey])
  
  return {
    ...result,
    // Add optimistic update functions
    optimisticUpdate: useCallback((updatedMember: TeamMember) => {
      mutate(swrKey, (current: TeamMember[] = []) => 
        current.map(m => m.id === updatedMember.id ? updatedMember : m),
        false
      )
    }, [swrKey]),
    
    optimisticAdd: useCallback((newMember: TeamMember) => {
      mutate(swrKey, (current: TeamMember[] = []) => 
        [...current, newMember],
        false
      )
    }, [swrKey]),
    
    optimisticRemove: useCallback((memberId: string) => {
      mutate(swrKey, (current: TeamMember[] = []) => 
        current.filter(m => m.id !== memberId),
        false
      )
    }, [swrKey])
  }
}

// Import deduplication utilities
import { deduplicateTasks } from '@/lib/utils/dataDeduplication'

// ✅ TASKS HOOK (highly dynamic) - WITH DEDUPLICATION
export function useTasks(limit?: number, enableRealtime = true) {
  const swrKey = limit ? `tasks-unified-${limit}` : 'tasks-unified'
  
  const result = useSWR<Task[]>(
    swrKey,
    async () => {
      const tasks = await optimizedFetcher<Task>('tasks', '*', { column: 'created_at', ascending: false }, limit)
      return deduplicateTasks(tasks) // Apply deduplication
    },
    {
      ...PRODUCTION_SWR_CONFIG,
      refreshInterval: enableRealtime ? 0 : 120000, // No polling if real-time enabled
    }
  )
  
  // Setup real-time subscription
  useEffect(() => {
    setupRealtimeSubscription<Task>('tasks', swrKey, enableRealtime)
    
    return () => {
      if (enableRealtime) {
        const channel = subscriptions.get(swrKey)
        if (channel) {
          supabase.removeChannel(channel)
          subscriptions.delete(swrKey)
        }
      }
    }
  }, [enableRealtime, swrKey])
  
  return {
    ...result,
    // Add optimistic update functions for tasks WITH DEDUPLICATION
    optimisticUpdate: useCallback((updatedTask: Task) => {
      mutate(swrKey, (current: Task[] = []) => {
        const updated = current.map(t => t.id === updatedTask.id ? updatedTask : t)
        return deduplicateTasks(updated) // Ensure no duplicates
      }, false)
      // Also update team stats when tasks change
      mutate('team_members-unified')
    }, [swrKey]),
    
    optimisticAdd: useCallback((newTask: Task) => {
      mutate(swrKey, (current: Task[] = []) => {
        // Check if task already exists before adding
        const exists = current.some(t => t.id === newTask.id)
        if (exists) {
          return deduplicateTasks(current) // Just deduplicate if exists
        }
        const withNew = [newTask, ...current]
        return deduplicateTasks(withNew) // Ensure no duplicates
      }, false)
      mutate('team_members-unified') // Update team stats
    }, [swrKey]),
    
    optimisticRemove: useCallback((taskId: string) => {
      mutate(swrKey, (current: Task[] = []) => {
        const filtered = current.filter(t => t.id !== taskId)
        return deduplicateTasks(filtered) // Ensure no duplicates
      }, false)
      mutate('team_members-unified') // Update team stats
    }, [swrKey]),
    
    optimisticStatusUpdate: useCallback((taskId: string, status: Task['status']) => {
      mutate(swrKey, (current: Task[] = []) => {
        const updated = current.map(t => t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t)
        return deduplicateTasks(updated) // Ensure no duplicates
      }, false)
      mutate('team_members-unified') // Update team stats
    }, [swrKey])
  }
}

// 📊 STATS HOOKS (computed from main data)
export function useVehicleStats() {
  const { data: vehicles = [], isLoading, error, mutate } = useVehicles()
  
  const stats = {
    total: vehicles.length,
    completed: vehicles.filter(v => v.status === 'Completed').length,
    inProgress: vehicles.filter(v => v.status === 'In Progress').length,
    pending: vehicles.filter(v => v.status === 'Pending').length,
    byLocation: vehicles.reduce((acc, v) => {
      acc[v.location] = (acc[v.location] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
  
  return { data: stats, isLoading, error, mutate }
}

export function useLocationStats() {
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles()
  const { data: locations = [], isLoading: locationsLoading } = useLocations()
  
  const isLoading = vehiclesLoading || locationsLoading
  
  const locationStats = locations.map(location => {
    const locationVehicles = vehicles.filter(v => v.location === location.name)
    const completed = locationVehicles.filter(v => v.status === 'Completed').length
    const inProgress = locationVehicles.filter(v => v.status === 'In Progress').length
    const pending = locationVehicles.filter(v => v.status === 'Pending').length
    const total = locationVehicles.length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return {
      ...location,
      actualVehicles: total,
      completed,
      inProgress,
      pending,
      progress,
      gps_devices: location.gps_devices,
      fuel_sensors: location.fuel_sensors
    }
  })
  
  return { data: locationStats, isLoading }
}

// 🚄 PREFETCH FUNCTIONS FOR INSTANT NAVIGATION
export function prefetchVehicles() {
  if (typeof window !== 'undefined') {
    requestIdleCallback(() => {
      optimizedFetcher<Vehicle>('vehicles', '*', { column: 'day', ascending: true }).catch(() => {})
    })
  }
}

export function prefetchLocations() {
  if (typeof window !== 'undefined') {
    requestIdleCallback(() => {
      optimizedFetcher<Location>('locations').catch(() => {})
    })
  }
}

export function prefetchTeamMembers() {
  if (typeof window !== 'undefined') {
    requestIdleCallback(() => {
      optimizedFetcher<TeamMember>('team_members', '*', { column: 'name', ascending: true }).catch(() => {})
    })
  }
}

// 🎯 SMART PREFETCH - Only prefetch what's needed for the route
export function prefetchForRoute(route: string) {
  if (typeof window !== 'undefined') {
    switch (route) {
      case '/':
      case '/dashboard':
        prefetchVehicles()
        prefetchLocations()
        break
      case '/schedule':
      case '/timeline':
      case '/gantt':
        prefetchVehicles()
        prefetchLocations()
        break
      case '/team':
        prefetchTeamMembers()
        break
      case '/tasks':
        requestIdleCallback(() => {
          optimizedFetcher<Task>('tasks', '*', { column: 'created_at', ascending: false }, 50).catch(() => {})
        })
        break
    }
  }
}

// 🔄 MANUAL REFRESH FUNCTION
export function refreshAllData() {
  if (typeof window !== 'undefined') {
    // Use SWR's mutate to refresh all cached data
    import('swr').then(({ mutate }) => {
      mutate('vehicles-unified')
      mutate('locations-unified') 
      mutate('team_members-unified')
      mutate('tasks-unified')
    })
  }
}
