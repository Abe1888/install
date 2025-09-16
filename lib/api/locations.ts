import { supabase } from '@/lib/supabase/client'
import type { Location } from '@/lib/supabase/types'

export interface LocationCreateData {
  name: string
  vehicles: number
  gps_devices: number
  fuel_sensors: number
}

export interface LocationUpdateData {
  vehicles?: number
  gps_devices?: number
  fuel_sensors?: number
}

/**
 * Fetch all locations
 */
export async function getLocations(): Promise<Location[]> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch locations: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error fetching locations:', error)
    throw error
  }
}

/**
 * Get a single location by name
 */
export async function getLocation(name: string): Promise<Location | null> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Location not found
      }
      throw new Error(`Failed to fetch location: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error fetching location:', error)
    throw error
  }
}

/**
 * Create a new location
 */
export async function createLocation(locationData: LocationCreateData): Promise<Location> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .insert([{
        ...locationData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create location: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error creating location:', error)
    throw error
  }
}

/**
 * Update an existing location
 */
export async function updateLocation(name: string, updates: LocationUpdateData): Promise<Location> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('name', name)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update location: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error updating location:', error)
    throw error
  }
}

/**
 * Delete a location
 */
export async function deleteLocation(name: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('name', name)

    if (error) {
      throw new Error(`Failed to delete location: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting location:', error)
    throw error
  }
}

/**
 * Get location statistics with vehicle progress
 */
export async function getLocationStats() {
  try {
    const locations = await getLocations()
    
    // Get vehicles for each location
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('location, status')

    if (vehiclesError) {
      throw new Error(`Failed to fetch vehicles for stats: ${vehiclesError.message}`)
    }

    const locationStats = locations.map(location => {
      const locationVehicles = vehicles?.filter((v: any) => v.location === location.name) || []
      const completed = locationVehicles.filter((v: any) => v.status === 'Completed').length
      const inProgress = locationVehicles.filter((v: any) => v.status === 'In Progress').length
      const pending = locationVehicles.filter((v: any) => v.status === 'Pending').length
      const total = locationVehicles.length
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        ...location,
        actualVehicles: total,
        completed,
        inProgress,
        pending,
        progress
      }
    })

    return locationStats
  } catch (error) {
    console.error('Error getting location stats:', error)
    throw error
  }
}

/**
 * Update location vehicle counts based on actual data
 */
export async function syncLocationCounts(): Promise<Location[]> {
  try {
    const locations = await getLocations()
    const updatedLocations: Location[] = []

    for (const location of locations) {
      // Get actual vehicle counts
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('gps_required, fuel_sensors')
        .eq('location', location.name)

      if (error) {
        throw new Error(`Failed to fetch vehicles for location ${location.name}: ${error.message}`)
      }

      const actualVehicleCount = vehicles?.length || 0
      const actualGpsDevices = vehicles?.reduce((sum: any, v: any) => sum + v.gps_required, 0) || 0
      const actualFuelSensors = vehicles?.reduce((sum: any, v: any) => sum + v.fuel_sensors, 0) || 0

      // Update location with actual counts
      const updatedLocation = await updateLocation(location.name, {
        vehicles: actualVehicleCount,
        gps_devices: actualGpsDevices,
        fuel_sensors: actualFuelSensors
      })

      updatedLocations.push(updatedLocation)
    }

    return updatedLocations
  } catch (error) {
    console.error('Error syncing location counts:', error)
    throw error
  }
}
