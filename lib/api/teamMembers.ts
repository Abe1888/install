import { supabase } from '@/lib/supabase/client'
import type { TeamMember } from '@/lib/supabase/types'

export interface TeamMemberCreateData {
  id: string
  name: string
  role: string
  specializations: string[]
  completion_rate?: number
  average_task_time?: number
  quality_score?: number
}

export interface TeamMemberUpdateData {
  name?: string
  role?: string
  specializations?: string[]
  completion_rate?: number
  average_task_time?: number
  quality_score?: number
}

/**
 * Fetch all team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch team members: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error fetching team members:', error)
    throw error
  }
}

/**
 * Get a single team member by ID
 */
export async function getTeamMember(id: string): Promise<TeamMember | null> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Team member not found
      }
      throw new Error(`Failed to fetch team member: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error fetching team member:', error)
    throw error
  }
}

/**
 * Create a new team member
 */
export async function createTeamMember(memberData: TeamMemberCreateData): Promise<TeamMember> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .insert([{
        ...memberData,
        completion_rate: memberData.completion_rate || 0,
        average_task_time: memberData.average_task_time || 0,
        quality_score: memberData.quality_score || 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create team member: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error creating team member:', error)
    throw error
  }
}

/**
 * Update an existing team member
 */
export async function updateTeamMember(id: string, updates: TeamMemberUpdateData): Promise<TeamMember> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update team member: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error updating team member:', error)
    throw error
  }
}

/**
 * Delete a team member
 */
export async function deleteTeamMember(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete team member: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting team member:', error)
    throw error
  }
}

/**
 * Get team member statistics with task performance
 */
export async function getTeamMemberStats() {
  try {
    const teamMembers = await getTeamMembers()
    
    // Get tasks for each team member
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('assigned_to, status, estimated_duration')

    if (tasksError) {
      throw new Error(`Failed to fetch tasks for stats: ${tasksError.message}`)
    }

    const memberStats = teamMembers.map(member => {
      const memberTasks = tasks?.filter((t: any) => t.assigned_to === member.name) || []
      const completed = memberTasks.filter((t: any) => t.status === 'Completed').length
      const inProgress = memberTasks.filter((t: any) => t.status === 'In Progress').length
      const pending = memberTasks.filter((t: any) => t.status === 'Pending').length
      const blocked = memberTasks.filter((t: any) => t.status === 'Blocked').length
      const total = memberTasks.length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        ...member,
        taskStats: {
          total,
          completed,
          inProgress,
          pending,
          blocked,
          completionRate
        }
      }
    })

    return memberStats
  } catch (error) {
    console.error('Error getting team member stats:', error)
    throw error
  }
}

/**
 * Update team member performance metrics
 */
export async function updateTeamMemberMetrics(id: string): Promise<TeamMember> {
  try {
    // Get member's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status, estimated_duration')
      .eq('assigned_to', id)

    if (tasksError) {
      throw new Error(`Failed to fetch tasks for member ${id}: ${tasksError.message}`)
    }

    const totalTasks = tasks?.length || 0
    const completedTasks = tasks?.filter((t: any) => t.status === 'Completed').length || 0
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    const averageTaskTime = tasks && tasks.length > 0 
      ? Math.round(tasks.reduce((sum: any, t: any) => sum + (t.estimated_duration || 0), 0) / tasks.length)
      : 0

    // Calculate quality score based on completion rate and other factors
    const qualityScore = Math.min(100, completionRate + (averageTaskTime > 0 ? 10 : 0))

    return updateTeamMember(id, {
      completion_rate: completionRate,
      average_task_time: averageTaskTime,
      quality_score: qualityScore
    })
  } catch (error) {
    console.error('Error updating team member metrics:', error)
    throw error
  }
}

/**
 * Get team member workload
 */
export async function getTeamMemberWorkload(memberId: string) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', memberId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch workload for member ${memberId}: ${error.message}`)
    }

    const workload = {
      total: tasks?.length || 0,
      completed: tasks?.filter((t: any) => t.status === 'Completed').length || 0,
      inProgress: tasks?.filter((t: any) => t.status === 'In Progress').length || 0,
      pending: tasks?.filter((t: any) => t.status === 'Pending').length || 0,
      blocked: tasks?.filter((t: any) => t.status === 'Blocked').length || 0,
      tasks: tasks || []
    }

    return workload
  } catch (error) {
    console.error('Error getting team member workload:', error)
    throw error
  }
}