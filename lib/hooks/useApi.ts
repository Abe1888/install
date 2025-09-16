'use client'

import useSWR from 'swr'
import { 
  getVehicles, 
  getVehicle, 
  getVehicleStats,
  type VehicleFilters 
} from '@/lib/api/vehicles'
import { 
  getTasks, 
  getTask, 
  getTaskStats,
  getTasksByVehicle,
  type TaskFilters 
} from '@/lib/api/tasks'
import { 
  getLocations, 
  getLocation, 
  getLocationStats 
} from '@/lib/api/locations'
import { 
  getTeamMembers, 
  getTeamMember, 
  getTeamMemberStats 
} from '@/lib/api/teamMembers'
// Comments API removed - functionality moved to CMS
import { 
  getProjectSettings, 
  getProjectStats 
} from '@/lib/api/projectSettings'

// Vehicle hooks
export function useVehiclesApi(filters?: VehicleFilters) {
  return useSWR(
    ['vehicles', filters],
    () => getVehicles(filters),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  )
}

export function useVehicleApi(id: string) {
  return useSWR(
    id ? ['vehicle', id] : null,
    () => getVehicle(id),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  )
}

export function useVehicleStatsApi() {
  return useSWR(
    'vehicle-stats',
    getVehicleStats,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

// Task hooks
export function useTasksApi(filters?: TaskFilters) {
  return useSWR(
    ['tasks', filters],
    () => getTasks(filters),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
    }
  )
}

export function useTaskApi(id: string) {
  return useSWR(
    id ? ['task', id] : null,
    () => getTask(id),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
    }
  )
}

export function useTasksByVehicleApi(vehicleId: string) {
  return useSWR(
    vehicleId ? ['tasks-vehicle', vehicleId] : null,
    () => getTasksByVehicle(vehicleId),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
    }
  )
}

export function useTaskStatsApi() {
  return useSWR(
    'task-stats',
    getTaskStats,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

// Location hooks
export function useLocationsApi() {
  return useSWR(
    'locations',
    getLocations,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

export function useLocationApi(name: string) {
  return useSWR(
    name ? ['location', name] : null,
    () => getLocation(name),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

export function useLocationStatsApi() {
  return useSWR(
    'location-stats',
    getLocationStats,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

// Team member hooks
export function useTeamMembersApi() {
  return useSWR(
    'team-members',
    getTeamMembers,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

export function useTeamMemberApi(id: string) {
  return useSWR(
    id ? ['team-member', id] : null,
    () => getTeamMember(id),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

export function useTeamMemberStatsApi() {
  return useSWR(
    'team-member-stats',
    getTeamMemberStats,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

// Comment hooks - removed, functionality moved to CMS

// Project settings hooks
export function useProjectSettingsApi() {
  return useSWR(
    'project-settings',
    getProjectSettings,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

export function useProjectStatsApi() {
  return useSWR(
    'project-stats',
    getProjectStats,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}