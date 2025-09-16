import { supabase } from '@/lib/supabase/client'
import type { Vehicle } from '@/lib/supabase/types'

export interface VehicleFilters {
  location?: string
  status?: string
  day?: number
  search?: string
}

export interface VehicleCreateData {
  id: string
  type: string
  location: string
  day: number
  time_slot: string
  gps_required: number
  fuel_sensors: number
  fuel_tanks: number
}

export interface VehicleUpdateData {
  type?: string
  location?: string
  day?: number
  time_slot?: string
  status?: Vehicle['status']
  gps_required?: number
  fuel_sensors?: number
  fuel_tanks?: number
}

/**
 * Fetch all vehicles with optional filtering
 */
export async function getVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {
  try {
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('day', { ascending: true })

    // Apply filters
    if (filters?.location && filters.location !== 'All') {
      query = query.eq('location', filters.location)
    }

    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status)
    }

    if (filters?.day) {
      query = query.eq('day', filters.day)
    }

    if (filters?.search) {
      query = query.or(`id.ilike.%${filters.search}%,type.ilike.%${filters.search}%,location.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch vehicles: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    throw error
  }
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicle(id: string): Promise<Vehicle | null> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Vehicle not found
      }
      throw new Error(`Failed to fetch vehicle: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error fetching vehicle:', error)
    throw error
  }
}

/**
 * Create a new vehicle
 */
export async function createVehicle(vehicleData: VehicleCreateData): Promise<Vehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{
        ...vehicleData,
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create vehicle: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error creating vehicle:', error)
    throw error
  }
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle(id: string, updates: VehicleUpdateData): Promise<Vehicle> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update vehicle: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error updating vehicle:', error)
    throw error
  }
}

/**
 * Update vehicle status
 */
export async function updateVehicleStatus(id: string, status: Vehicle['status']): Promise<Vehicle> {
  return updateVehicle(id, { status })
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete vehicle: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    throw error
  }
}

/**
 * Get vehicles by location
 */
export async function getVehiclesByLocation(location: string): Promise<Vehicle[]> {
  return getVehicles({ location })
}

/**
 * Get vehicles by day
 */
export async function getVehiclesByDay(day: number): Promise<Vehicle[]> {
  return getVehicles({ day })
}

/**
 * Get vehicles by status
 */
export async function getVehiclesByStatus(status: Vehicle['status']): Promise<Vehicle[]> {
  return getVehicles({ status })
}

/**
 * Get vehicle statistics
 */
export async function getVehicleStats() {
  try {
    const vehicles = await getVehicles()
    
    const stats = {
      total: vehicles.length,
      completed: vehicles.filter(v => v.status === 'Completed').length,
      inProgress: vehicles.filter(v => v.status === 'In Progress').length,
      pending: vehicles.filter(v => v.status === 'Pending').length,
      totalGpsDevices: vehicles.reduce((sum, v) => sum + v.gps_required, 0),
      totalFuelSensors: vehicles.reduce((sum, v) => sum + v.fuel_sensors, 0),
      totalFuelTanks: vehicles.reduce((sum, v) => sum + v.fuel_tanks, 0),
      locationBreakdown: vehicles.reduce((acc, v) => {
        if (!acc[v.location]) {
          acc[v.location] = { total: 0, completed: 0, inProgress: 0, pending: 0 }
        }
        acc[v.location].total++
        if (v.status === 'Completed') acc[v.location].completed++
        if (v.status === 'In Progress') acc[v.location].inProgress++
        if (v.status === 'Pending') acc[v.location].pending++
        return acc
      }, {} as Record<string, any>)
    }

    return stats
  } catch (error) {
    console.error('Error getting vehicle stats:', error)
    throw error
  }
}

/**
 * Bulk update vehicle statuses
 */
export async function bulkUpdateVehicleStatus(
  vehicleIds: string[], 
  status: Vehicle['status']
): Promise<Vehicle[]> {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', vehicleIds)
      .select()

    if (error) {
      throw new Error(`Failed to bulk update vehicles: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error bulk updating vehicles:', error)
    throw error
  }
}