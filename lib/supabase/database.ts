import { supabase } from './client'
import type { Database } from './types'

// Type-safe database helper functions
export const db = {
  // Comments
  comments: {
    async create(data: Database['public']['Tables']['comments']['Insert']) {
      return supabase.from('comments').insert(data)
    },
    
    async update(id: string, data: Database['public']['Tables']['comments']['Update']) {
      return supabase.from('comments').update(data).eq('id', id)
    },
    
    async delete(id: string) {
      return supabase.from('comments').delete().eq('id', id)
    },
    
    async getAll() {
      return supabase.from('comments').select('*')
    },
    
    async getByTaskId(taskId: string) {
      return supabase.from('comments').select('*').eq('task_id', taskId)
    }
  },
  
  // Vehicles
  vehicles: {
    async create(data: Database['public']['Tables']['vehicles']['Insert']) {
      // First, ensure location exists to prevent foreign key constraint violations
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('name')
        .eq('name', data.location)
        .single()

      if (locationError || !location) {
        // Create location if it doesn't exist
        const { error: createLocationError } = await supabase
          .from('locations')
          .insert([{
            name: data.location,
            vehicles: 0,
            gps_devices: 0,
            fuel_sensors: 0
          }])
        
        if (createLocationError) throw createLocationError
      }

      // Now create vehicle
      return supabase.from('vehicles').insert(data)
    },
    
    async update(id: string, data: Database['public']['Tables']['vehicles']['Update']) {
      return supabase.from('vehicles').update(data).eq('id', id)
    },
    
    async delete(id: string) {
      return supabase.from('vehicles').delete().eq('id', id)
    },
    
    async getAll() {
      return supabase.from('vehicles').select('*')
    }
  },
  
  // Tasks
  tasks: {
    async create(data: Database['public']['Tables']['tasks']['Insert']) {
      return supabase.from('tasks').insert(data)
    },
    
    async update(id: string, data: Database['public']['Tables']['tasks']['Update']) {
      return supabase.from('tasks').update(data).eq('id', id)
    },
    
    async delete(id: string) {
      return supabase.from('tasks').delete().eq('id', id)
    },
    
    async getAll() {
      return supabase.from('tasks').select('*')
    },
    
    async getByVehicleId(vehicleId: string) {
      return supabase.from('tasks').select('*').eq('vehicle_id', vehicleId)
    }
  },
  
  // Team Members
  teamMembers: {
    async create(data: Database['public']['Tables']['team_members']['Insert']) {
      return supabase.from('team_members').insert(data)
    },
    
    async update(id: string, data: Database['public']['Tables']['team_members']['Update']) {
      return supabase.from('team_members').update(data).eq('id', id)
    },
    
    async delete(id: string) {
      return supabase.from('team_members').delete().eq('id', id)
    },
    
    async getAll() {
      return supabase.from('team_members').select('*')
    }
  },
  
  // Locations
  locations: {
    async create(data: Database['public']['Tables']['locations']['Insert']) {
      return supabase.from('locations').insert(data)
    },
    
    async update(name: string, data: Database['public']['Tables']['locations']['Update']) {
      return supabase.from('locations').update(data).eq('name', name)
    },
    
    async delete(name: string) {
      return supabase.from('locations').delete().eq('name', name)
    },
    
    async getAll() {
      return supabase.from('locations').select('*')
    }
  },
  
  // Project Settings
  projectSettings: {
    async create(data: Database['public']['Tables']['project_settings']['Insert']) {
      return supabase.from('project_settings').insert(data)
    },
    
    async update(id: string, data: Database['public']['Tables']['project_settings']['Update']) {
      return supabase.from('project_settings').update(data).eq('id', id)
    },
    
    async delete(id: string) {
      return supabase.from('project_settings').delete().eq('id', id)
    },
    
    async getAll() {
      return supabase.from('project_settings').select('*')
    }
  }
}
