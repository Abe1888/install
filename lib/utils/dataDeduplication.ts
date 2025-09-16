'use client'

import type { Task, Vehicle, Location, TeamMember } from '@/lib/supabase/types'

/**
 * Generic deduplication function for any data with an ID field
 */
export function deduplicateById<T extends { id: string }>(
  data: T[], 
  debugLabel?: string
): T[] {
  if (!data || data.length === 0) return data

  const seen = new Set<string>()
  const deduplicated: T[] = []
  let duplicatesFound = 0

  for (const item of data) {
    if (item.id && !seen.has(item.id)) {
      seen.add(item.id)
      deduplicated.push(item)
    } else if (item.id) {
      duplicatesFound++
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🔍 Duplicate ${debugLabel || 'item'} filtered:`, {
          id: item.id,
          duplicatesFound,
          originalCount: data.length,
          deduplicatedCount: deduplicated.length
        })
      }
    }
  }

  if (duplicatesFound > 0 && process.env.NODE_ENV === 'development') {
    console.log(`✅ Deduplication complete for ${debugLabel}:`, {
      originalCount: data.length,
      deduplicatedCount: deduplicated.length,
      duplicatesRemoved: duplicatesFound
    })
  }

  return deduplicated
}

/**
 * Specialized deduplication for tasks with additional validation
 */
export function deduplicateTasks(tasks: Task[]): Task[] {
  if (!tasks || tasks.length === 0) return tasks

  const seen = new Set<string>()
  const seenVehicleTasks = new Map<string, string[]>() // vehicle_id -> task_ids
  const deduplicated: Task[] = []
  let duplicatesFound = 0

  for (const task of tasks) {
    // Primary deduplication by task ID
    if (task.id && !seen.has(task.id)) {
      seen.add(task.id)
      
      // Normalize and validate task data WITHOUT corrupting arrays
      const normalizedTask: Task = {
        ...task,
        // Keep vehicle_id and assigned_to in their original format (DO NOT convert arrays to strings)
        vehicle_id: task.vehicle_id, // Preserve original format
        assigned_to: task.assigned_to, // Preserve original format
        // Ensure status is valid
        status: ['Pending', 'In Progress', 'Completed', 'Blocked', 'Scheduled'].includes(task.status) 
          ? task.status 
          : 'Pending',
        // Ensure priority is valid
        priority: ['High', 'Medium', 'Low'].includes(task.priority) 
          ? task.priority 
          : 'Medium',
        // Validate time fields
        estimated_duration: task.estimated_duration && task.estimated_duration > 0 
          ? task.estimated_duration 
          : undefined,
        actual_duration: task.actual_duration && task.actual_duration > 0 
          ? task.actual_duration 
          : undefined,
        // Validate completion percentage
        completion_percentage: task.completion_percentage !== undefined
          ? Math.max(0, Math.min(100, task.completion_percentage))
          : undefined
      };
      
      // Track tasks by vehicle ID for additional validation
      if (normalizedTask.vehicle_id) {
        const vehicleId = Array.isArray(task.vehicle_id) ? task.vehicle_id[0] : task.vehicle_id;
        const vehicleTasks = seenVehicleTasks.get(vehicleId) || []
        vehicleTasks.push(normalizedTask.id)
        seenVehicleTasks.set(vehicleId, vehicleTasks)
      }
      
      deduplicated.push(normalizedTask)
    } else if (task.id) {
      duplicatesFound++
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔍 Duplicate task filtered:', {
          taskId: task.id,
          vehicleId: task.vehicle_id,
          name: task.name,
          status: task.status
        })
      }
    }
  }

  if (process.env.NODE_ENV === 'development' && duplicatesFound > 0) {
    console.log('✅ Task deduplication summary:', {
      originalCount: tasks.length,
      deduplicatedCount: deduplicated.length,
      duplicatesRemoved: duplicatesFound,
      tasksByVehicle: Object.fromEntries(seenVehicleTasks)
    })
  }

  return deduplicated
}

/**
 * Deduplication for locations (using name as key)
 */
export function deduplicateLocations(locations: Location[]): Location[] {
  if (!locations || locations.length === 0) return locations

  const seen = new Set<string>()
  const deduplicated: Location[] = []
  let duplicatesFound = 0

  for (const location of locations) {
    if (location.name && !seen.has(location.name)) {
      seen.add(location.name)
      deduplicated.push(location)
    } else if (location.name) {
      duplicatesFound++
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔍 Duplicate location filtered:', {
          name: location.name,
          vehicles: location.vehicles
        })
      }
    }
  }

  if (duplicatesFound > 0 && process.env.NODE_ENV === 'development') {
    console.log('✅ Location deduplication complete:', {
      originalCount: locations.length,
      deduplicatedCount: deduplicated.length,
      duplicatesRemoved: duplicatesFound
    })
  }

  return deduplicated
}

/**
 * Batch deduplication for mixed data types
 */
export function deduplicateAllData(data: {
  vehicles?: Vehicle[]
  locations?: Location[]
  teamMembers?: TeamMember[]
  tasks?: Task[]
}) {
  const result = {
    vehicles: data.vehicles ? deduplicateById(data.vehicles, 'vehicles') : [],
    locations: data.locations ? deduplicateLocations(data.locations) : [],
    teamMembers: data.teamMembers ? deduplicateById(data.teamMembers, 'team members') : [],
    tasks: data.tasks ? deduplicateTasks(data.tasks) : []
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Batch deduplication complete:', {
      vehicles: { original: data.vehicles?.length || 0, deduplicated: result.vehicles.length },
      locations: { original: data.locations?.length || 0, deduplicated: result.locations.length },
      teamMembers: { original: data.teamMembers?.length || 0, deduplicated: result.teamMembers.length },
      tasks: { original: data.tasks?.length || 0, deduplicated: result.tasks.length }
    })
  }

  return result
}

/**
 * Data integrity checker for development
 */
export function checkDataIntegrity(tasks: Task[], vehicles: Vehicle[]): {
  valid: boolean
  issues: string[]
} {
  if (process.env.NODE_ENV !== 'development') {
    return { valid: true, issues: [] }
  }

  const issues: string[] = []
  const vehicleIds = new Set(vehicles.map(v => v.id))

  // Check for orphaned tasks
  const orphanedTasks = tasks.filter(task => {
    if (!task.vehicle_id) return false;
    const vehicleIdArray = Array.isArray(task.vehicle_id) ? task.vehicle_id : [task.vehicle_id];
    return vehicleIdArray.some(vId => !vehicleIds.has(vId));
  })
  if (orphanedTasks.length > 0) {
    issues.push(`Found ${orphanedTasks.length} tasks with invalid vehicle_id references`)
  }

  // Check for duplicate task names within same vehicle
  const tasksByVehicle = new Map<string, Task[]>()
  tasks.forEach(task => {
    if (task.vehicle_id) {
      const vehicleIdArray = Array.isArray(task.vehicle_id) ? task.vehicle_id : [task.vehicle_id];
      vehicleIdArray.forEach(vId => {
        const vehicleTasks = tasksByVehicle.get(vId) || []
        vehicleTasks.push(task)
        tasksByVehicle.set(vId, vehicleTasks)
      });
    }
  })

  tasksByVehicle.forEach((vehicleTasks, vehicleId) => {
    const taskNames = new Set<string>()
    const duplicateNames: string[] = []
    
    vehicleTasks.forEach(task => {
      if (taskNames.has(task.name)) {
        duplicateNames.push(task.name)
      } else {
        taskNames.add(task.name)
      }
    })
    
    if (duplicateNames.length > 0) {
      issues.push(`Vehicle ${vehicleId} has duplicate task names: ${duplicateNames.join(', ')}`)
    }
  })

  return {
    valid: issues.length === 0,
    issues
  }
}
