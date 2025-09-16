'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import type { Vehicle, Location, TeamMember, Task, ProjectSettings } from '@/lib/supabase/types'

// Generic fetcher function
async function fetcher<T>(
  table: string,
  select: string = '*',
  orderBy?: { column: string; ascending?: boolean }
): Promise<T[]> {
  let query = supabase.from(table).select(select)
  
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch ${table}: ${error.message}`)
  }
  
  return data || []
}

// Vehicles hook
export function useVehicles() {
  return useSWR<Vehicle[]>(
    'vehicles',
    () => fetcher<Vehicle>('vehicles', '*', { column: 'day', ascending: true }),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  )
}

// Locations hook
export function useLocations() {
  return useSWR<Location[]>(
    'locations',
    () => fetcher<Location>('locations'),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

// Team members hook
export function useTeamMembers() {
  return useSWR<TeamMember[]>(
    'team_members',
    () => fetcher<TeamMember>('team_members', '*', { column: 'name', ascending: true }),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

// Tasks hook
export function useTasks() {
  return useSWR<Task[]>(
    'tasks',
    () => fetcher<Task>('tasks', '*', { column: 'created_at', ascending: false }),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
    }
  )
}

// Project settings hook
export function useProjectSettings() {
  const { data, error, mutate, isLoading } = useSWR<ProjectSettings[]>(
    'project_settings',
    () => fetcher<ProjectSettings>('project_settings'),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )

  const projectSettings = data?.[0]

  const updateProjectStartDate = async (newDate: string) => {
    const { error } = await supabase
      .from('project_settings')
      .upsert({
        id: 'default',
        project_start_date: newDate,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      throw new Error(`Failed to update project start date: ${error.message}`)
    }

    mutate()
  }

  const resetProject = async () => {
    // Reset all vehicles to pending
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ 
        status: 'Pending',
        updated_at: new Date().toISOString()
      })
      .neq('id', '')

    if (vehicleError) {
      throw new Error(`Failed to reset vehicles: ${vehicleError.message}`)
    }

    // Reset all tasks to pending
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ 
        status: 'Pending',
        updated_at: new Date().toISOString()
      })
      .neq('id', '')

    if (taskError) {
      throw new Error(`Failed to reset tasks: ${taskError.message}`)
    }

    // Trigger revalidation of all data
    mutate()
  }

  return {
    projectSettings,
    loading: isLoading,
    error,
    updateProjectStartDate,
    resetProject,
    mutate,
  }
}

// Optimized hooks for better performance
export function useVehiclesByLocation(location?: string) {
  return useSWR<Vehicle[]>(
    location ? `vehicles-location-${location}` : 'vehicles-all',
    async () => {
      let query = supabase.from('vehicles').select('*').order('day', { ascending: true })
      
      if (location && location !== 'All') {
        query = query.eq('location', location)
      }
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(`Failed to fetch vehicles: ${error.message}`)
      }
      
      return data || []
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  )
}

export function useTasksByVehicle(vehicleId?: string) {
  return useSWR<Task[]>(
    vehicleId ? `tasks-vehicle-${vehicleId}` : null,
    async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`)
      }
      
      return data || []
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
    }
  )
}