import { supabase } from '@/lib/supabase/client'
import type { ProjectSettings } from '@/lib/supabase/types'

/**
 * Get project settings
 */
export async function getProjectSettings(): Promise<ProjectSettings | null> {
  try {
    const { data, error } = await supabase
      .from('project_settings')
      .select('*')
      .eq('id', 'default')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Create default settings if none exist
        return createDefaultProjectSettings()
      }
      throw new Error(`Failed to fetch project settings: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error fetching project settings:', error)
    throw error
  }
}

/**
 * Create default project settings
 */
export async function createDefaultProjectSettings(): Promise<ProjectSettings> {
  try {
    const { data, error } = await supabase
      .from('project_settings')
      .insert([{
        id: 'default',
        project_start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create project settings: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error creating project settings:', error)
    throw error
  }
}

/**
 * Update project start date
 */
export async function updateProjectStartDate(startDate: string): Promise<ProjectSettings> {
  try {
    const { data, error } = await supabase
      .from('project_settings')
      .upsert({
        id: 'default',
        project_start_date: startDate,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update project start date: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error updating project start date:', error)
    throw error
  }
}

/**
 * Reset project to initial state
 */
export async function resetProject(): Promise<void> {
  try {
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

    // Clear all comments
    const { error: commentError } = await supabase
      .from('comments')
      .delete()
      .neq('id', '')

    if (commentError) {
      throw new Error(`Failed to clear comments: ${commentError.message}`)
    }

  } catch (error) {
    console.error('Error resetting project:', error)
    throw error
  }
}

/**
 * Get project statistics
 */
export async function getProjectStats() {
  try {
    const settings = await getProjectSettings()
    
    // Get vehicle stats
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('status, location, gps_required, fuel_sensors')

    if (vehicleError) {
      throw new Error(`Failed to fetch vehicles for stats: ${vehicleError.message}`)
    }

    // Get task stats
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('status, priority')

    if (taskError) {
      throw new Error(`Failed to fetch tasks for stats: ${taskError.message}`)
    }

    // Get team member count
    const { count: teamMemberCount, error: teamError } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })

    if (teamError) {
      throw new Error(`Failed to fetch team member count: ${teamError.message}`)
    }

    const vehicleStats = {
      total: vehicles?.length || 0,
      completed: vehicles?.filter((v: any) => v.status === 'Completed').length || 0,
      inProgress: vehicles?.filter((v: any) => v.status === 'In Progress').length || 0,
      pending: vehicles?.filter((v: any) => v.status === 'Pending').length || 0,
      totalGpsDevices: vehicles?.reduce((sum: any, v: any) => sum + v.gps_required, 0) || 0,
      totalFuelSensors: vehicles?.reduce((sum: any, v: any) => sum + v.fuel_sensors, 0) || 0
    }

    const taskStats = {
      total: tasks?.length || 0,
      completed: tasks?.filter((t: any) => t.status === 'Completed').length || 0,
      inProgress: tasks?.filter((t: any) => t.status === 'In Progress').length || 0,
      pending: tasks?.filter((t: any) => t.status === 'Pending').length || 0,
      blocked: tasks?.filter((t: any) => t.status === 'Blocked').length || 0,
      highPriority: tasks?.filter((t: any) => t.priority === 'High').length || 0
    }

    const projectProgress = vehicleStats.total > 0 
      ? Math.round((vehicleStats.completed / vehicleStats.total) * 100)
      : 0

    return {
      settings,
      vehicles: vehicleStats,
      tasks: taskStats,
      teamMemberCount: teamMemberCount || 0,
      projectProgress,
      startDate: settings?.project_start_date || new Date().toISOString().split('T')[0]
    }
  } catch (error) {
    console.error('Error getting project stats:', error)
    throw error
  }
}