import { supabase } from '@/lib/supabase/client'
import type { Vehicle, Location, TeamMember, Task, Comment } from '@/lib/supabase/types'

// Generic CRUD operations with validation
export class DataManager<T extends Record<string, any>> {
  constructor(private tableName: string) {}

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert([{
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create ${this.tableName}: ${error.message}`)
      }

      return result
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      throw error
    }
  }

  async read(filters?: Record<string, any>, orderBy?: { column: string; ascending?: boolean }): Promise<T[]> {
    try {
      let query = supabase.from(this.tableName).select('*')

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value)
          }
        })
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to read ${this.tableName}: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error(`Error reading ${this.tableName}:`, error)
      throw error
    }
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update ${this.tableName}: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete ${this.tableName}: ${error.message}`)
      }
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      throw error
    }
  }

  async search(searchTerm: string, searchFields: string[]): Promise<T[]> {
    try {
      const searchConditions = searchFields
        .map(field => `${field}.ilike.%${searchTerm}%`)
        .join(',')

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(searchConditions)

      if (error) {
        throw new Error(`Failed to search ${this.tableName}: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error(`Error searching ${this.tableName}:`, error)
      throw error
    }
  }
}

// Location manager with special handling for name-based primary key
export class LocationManager extends DataManager<Location> {
  constructor() {
    super('locations')
  }

  async update(name: string, updates: Partial<Location>): Promise<Location> {
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

  async delete(name: string): Promise<void> {
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
}

// Specialized data managers for each entity
export const vehicleManager = new DataManager<Vehicle>('vehicles')
export const locationManager = new LocationManager()
export const teamMemberManager = new DataManager<TeamMember>('team_members')
export const taskManager = new DataManager<Task>('tasks')

// Comment manager with special handling for task relationships
export class CommentManager extends DataManager<Comment> {
  constructor() {
    super('comments')
  }

  async getByTaskId(taskId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch comments: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching comments:', error)
      throw error
    }
  }

  async createForTask(taskId: string, text: string, author: string): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          task_id: taskId,
          text,
          author,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create comment: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    }
  }

  async updateComment(id: string, text: string): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ text })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update comment: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error
    }
  }
}

export const commentManager = new CommentManager()

// Data validation utilities
export class DataValidator {
  static validateVehicle(vehicle: Partial<Vehicle>): string[] {
    const errors: string[] = []

    if (!vehicle.id?.trim()) errors.push('Vehicle ID is required')
    if (!vehicle.type?.trim()) errors.push('Vehicle type is required')
    if (!vehicle.location?.trim()) errors.push('Location is required')
    if (!vehicle.day || vehicle.day < 1 || vehicle.day > 14) errors.push('Day must be between 1 and 14')
    if (!vehicle.time_slot?.trim()) errors.push('Time slot is required')
    if (!vehicle.gps_required || vehicle.gps_required < 1) errors.push('GPS devices required must be at least 1')
    if (!vehicle.fuel_sensors || vehicle.fuel_sensors < 1) errors.push('Fuel sensors must be at least 1')
    if (!vehicle.fuel_tanks || vehicle.fuel_tanks < 1) errors.push('Fuel tanks must be at least 1')
    if (vehicle.fuel_sensors && vehicle.fuel_tanks && vehicle.fuel_sensors > vehicle.fuel_tanks) {
      errors.push('Fuel sensors cannot exceed fuel tanks')
    }

    return errors
  }

  static validateTask(task: Partial<Task>): string[] {
    const errors: string[] = []

    if (!task.name?.trim()) errors.push('Task name is required')
    // Handle vehicle_id which can be string or string[]
    const vehicleId = Array.isArray(task.vehicle_id) ? task.vehicle_id[0] : task.vehicle_id;
    if (!vehicleId?.trim()) errors.push('Vehicle ID is required')
    
    // Handle assigned_to which can be string or string[]
    const assignedTo = Array.isArray(task.assigned_to) ? task.assigned_to[0] : task.assigned_to;
    if (!assignedTo?.trim()) errors.push('Assignee is required')
    if (!task.priority || !['High', 'Medium', 'Low'].includes(task.priority)) {
      errors.push('Priority must be High, Medium, or Low')
    }
    if (task.estimated_duration && task.estimated_duration < 1) {
      errors.push('Estimated duration must be positive')
    }

    return errors
  }

  static validateTeamMember(member: Partial<TeamMember>): string[] {
    const errors: string[] = []

    if (!member.id?.trim()) errors.push('Team member ID is required')
    if (!member.name?.trim()) errors.push('Name is required')
    if (!member.role?.trim()) errors.push('Role is required')
    if (member.completion_rate && (member.completion_rate < 0 || member.completion_rate > 100)) {
      errors.push('Completion rate must be between 0 and 100')
    }
    if (member.quality_score && (member.quality_score < 0 || member.quality_score > 100)) {
      errors.push('Quality score must be between 0 and 100')
    }

    return errors
  }

  static validateLocation(location: Partial<Location>): string[] {
    const errors: string[] = []

    if (!location.name?.trim()) errors.push('Location name is required')
    if (!location.vehicles || location.vehicles < 0) errors.push('Vehicle count must be non-negative')
    if (!location.gps_devices || location.gps_devices < 0) errors.push('GPS device count must be non-negative')
    if (!location.fuel_sensors || location.fuel_sensors < 0) errors.push('Fuel sensor count must be non-negative')

    return errors
  }

  static validateComment(comment: Partial<Comment>): string[] {
    const errors: string[] = []

    if (!comment.task_id?.trim()) errors.push('Task ID is required')
    if (!comment.text?.trim()) errors.push('Comment text is required')
    if (!comment.author?.trim()) errors.push('Author is required')

    return errors
  }
}

// Bulk operations for efficiency
export class BulkOperations {
  static async bulkUpdateVehicleStatus(vehicleIds: string[], status: Vehicle['status']): Promise<Vehicle[]> {
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

  static async bulkUpdateTaskStatus(taskIds: string[], status: Task['status']): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', taskIds)
        .select()

      if (error) {
        throw new Error(`Failed to bulk update tasks: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error bulk updating tasks:', error)
      throw error
    }
  }

  static async createStandardTasksForVehicle(vehicleId: string, assignedTo: string): Promise<Task[]> {
    const standardTasks = [
      {
        name: 'Vehicle Inspection',
        description: 'Pre-installation vehicle assessment and documentation',
        priority: 'High' as const,
        estimated_duration: 30,
        tags: ['inspection', 'pre-installation']
      },
      {
        name: 'GPS Device Installation',
        description: 'Install and mount GPS tracking devices',
        priority: 'High' as const,
        estimated_duration: 60,
        tags: ['gps', 'installation']
      },
      {
        name: 'Fuel Sensor Installation',
        description: 'Install fuel level sensors in tanks',
        priority: 'High' as const,
        estimated_duration: 90,
        tags: ['fuel-sensor', 'installation']
      },
      {
        name: 'System Configuration',
        description: 'Configure GPS and sensor settings',
        priority: 'High' as const,
        estimated_duration: 45,
        tags: ['configuration', 'system']
      },
      {
        name: 'Fuel Sensor Calibration',
        description: 'Calibrate fuel sensors for accurate readings',
        priority: 'High' as const,
        estimated_duration: 60,
        tags: ['calibration', 'fuel-sensor']
      },
      {
        name: 'Quality Assurance',
        description: 'Final system testing and validation',
        priority: 'Medium' as const,
        estimated_duration: 30,
        tags: ['qa', 'testing']
      },
      {
        name: 'Documentation',
        description: 'Complete installation documentation',
        priority: 'Medium' as const,
        estimated_duration: 20,
        tags: ['documentation', 'completion']
      }
    ]

    const createdTasks: Task[] = []

    try {
      for (const taskTemplate of standardTasks) {
        const task = await taskManager.create({
          vehicle_id: vehicleId,
          name: taskTemplate.name,
          description: taskTemplate.description,
          status: 'Pending',
          assigned_to: assignedTo,
          priority: taskTemplate.priority,
          estimated_duration: taskTemplate.estimated_duration,
          start_date: new Date().toISOString().split('T')[0],
          duration_days: 1,
          tags: taskTemplate.tags,
        })
        createdTasks.push(task)
      }

      return createdTasks
    } catch (error) {
      console.error('Error creating standard tasks:', error)
      throw error
    }
  }
}
