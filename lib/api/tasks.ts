import { supabase } from '@/lib/supabase/client'
import type { Task } from '@/lib/supabase/types'

export interface TaskFilters {
  vehicleId?: string
  assignedTo?: string
  status?: string
  priority?: string
  search?: string
}

export interface TaskCreateData {
  vehicle_id: string
  name: string
  description?: string
  assigned_to: string
  priority: 'High' | 'Medium' | 'Low'
  estimated_duration?: number
  start_time?: string  // Format: HH:MM (24-hour)
  end_time?: string    // Format: HH:MM (24-hour)
  start_date?: string
  end_date?: string
  duration_days?: number
  notes?: string
  tags?: string[]
}

export interface TaskUpdateData {
  name?: string
  description?: string
  status?: Task['status']
  assigned_to?: string
  priority?: 'High' | 'Medium' | 'Low'
  estimated_duration?: number
  start_time?: string  // Format: HH:MM (24-hour)
  end_time?: string    // Format: HH:MM (24-hour)
  start_date?: string
  end_date?: string
  duration_days?: number
  notes?: string
  tags?: string[]
}

/**
 * Fetch all tasks with optional filtering
 */
export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.vehicleId) {
      query = query.eq('vehicle_id', filters.vehicleId)
    }

    if (filters?.assignedTo && filters.assignedTo !== 'All') {
      query = query.eq('assigned_to', filters.assignedTo)
    }

    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status)
    }

    if (filters?.priority && filters.priority !== 'All') {
      query = query.eq('priority', filters.priority)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,assigned_to.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error fetching tasks:', error)
    throw error
  }
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Task not found
      }
      throw new Error(`Failed to fetch task: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error fetching task:', error)
    throw error
  }
}

/**
 * Create a new task
 */
export async function createTask(taskData: TaskCreateData): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...taskData,
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, updates: TaskUpdateData): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error updating task:', error)
    throw error
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
  return updateTask(id, { status })
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}

/**
 * Get tasks by vehicle ID
 */
export async function getTasksByVehicle(vehicleId: string): Promise<Task[]> {
  return getTasks({ vehicleId })
}

/**
 * Get tasks by assignee
 */
export async function getTasksByAssignee(assignedTo: string): Promise<Task[]> {
  return getTasks({ assignedTo })
}

/**
 * Get task statistics
 */
export async function getTaskStats() {
  try {
    const tasks = await getTasks()
    
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      pending: tasks.filter(t => t.status === 'Pending').length,
      blocked: tasks.filter(t => t.status === 'Blocked').length,
      highPriority: tasks.filter(t => t.priority === 'High').length,
      mediumPriority: tasks.filter(t => t.priority === 'Medium').length,
      lowPriority: tasks.filter(t => t.priority === 'Low').length,
      assigneeBreakdown: tasks.reduce((acc, t) => {
        // Handle assigned_to being either string or string[]
        const assignees = Array.isArray(t.assigned_to) ? t.assigned_to : [t.assigned_to];
        
        assignees.forEach(assignee => {
          if (!acc[assignee]) {
            acc[assignee] = { total: 0, completed: 0, inProgress: 0, pending: 0, blocked: 0 }
          }
          acc[assignee].total++
          if (t.status === 'Completed') acc[assignee].completed++
          if (t.status === 'In Progress') acc[assignee].inProgress++
          if (t.status === 'Pending') acc[assignee].pending++
          if (t.status === 'Blocked') acc[assignee].blocked++
        });
        
        return acc
      }, {} as Record<string, any>)
    }

    return stats
  } catch (error) {
    console.error('Error getting task stats:', error)
    throw error
  }
}

/**
 * Create standard tasks for a vehicle
 */
export async function createStandardTasks(vehicleId: string, assignedTo: string): Promise<Task[]> {
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
      description: 'Calibrate fuel sensors for accurate fuel level readings',
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
    let currentStartTime = 9 * 60 // Start at 9:00 AM (in minutes)
    
    for (const taskTemplate of standardTasks) {
      // Calculate time range based on estimated_duration
      const startMinutes = currentStartTime
      const endMinutes = currentStartTime + taskTemplate.estimated_duration
      
      const startHour = Math.floor(startMinutes / 60)
      const startMin = startMinutes % 60
      const endHour = Math.floor(endMinutes / 60)
      const endMin = endMinutes % 60
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00`
      const endTime = `${Math.min(endHour, 23).toString().padStart(2, '0')}:${(endHour > 23 ? 59 : endMin).toString().padStart(2, '0')}:00`
      
      const task = await createTask({
        vehicle_id: vehicleId,
        name: taskTemplate.name,
        description: taskTemplate.description,
        assigned_to: assignedTo,
        priority: taskTemplate.priority,
        estimated_duration: taskTemplate.estimated_duration,
        start_time: startTime,
        end_time: endTime,
        start_date: new Date().toISOString().split('T')[0],
        duration_days: 1,
        tags: taskTemplate.tags,
      })
      createdTasks.push(task)
      
      // Move start time for next task (add 15 minute buffer)
      currentStartTime = endMinutes + 15
      // Don't schedule beyond reasonable working hours
      if (currentStartTime >= 17 * 60) { // 5:00 PM
        currentStartTime = 9 * 60 // Reset to 9:00 AM for remaining tasks
      }
    }

    return createdTasks
  } catch (error) {
    console.error('Error creating standard tasks:', error)
    throw error
  }
}

/**
 * Bulk update task statuses
 */
export async function bulkUpdateTaskStatus(
  taskIds: string[], 
  status: Task['status']
): Promise<Task[]> {
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