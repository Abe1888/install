'use client'

/**
 * Utility functions to clean up task names that have vehicle ID prefixes
 * since we already have the vehicle_id field to store this relationship
 */

/**
 * Remove vehicle ID prefix or suffix from task name
 * Examples:
 * "V001 GPS Installation" -> "GPS Installation" (prefix)
 * "GPS Installation - V001" -> "GPS Installation" (suffix)
 * "Vehicle Inspection - V002" -> "Vehicle Inspection" (suffix)
 * "System Configuration" -> "System Configuration" (unchanged)
 */
export function cleanTaskName(taskName: string): string {
  if (!taskName) return taskName
  
  let cleaned = taskName
  
  // Remove vehicle ID prefix pattern like "V001 ", "V002 ", etc.
  cleaned = cleaned.replace(/^V\d{3,4}\s+/, '')
  
  // Remove vehicle ID suffix pattern like " - V001", " - V002", etc.
  cleaned = cleaned.replace(/\s*-\s*V\d{3,4}$/, '')
  
  return cleaned.trim() || taskName // Return original if cleaning results in empty string
}

/**
 * Extract vehicle ID from task name (if present)
 * Examples:
 * "V001 GPS Installation" -> "V001" (prefix)
 * "GPS Installation - V001" -> "V001" (suffix)
 * "Vehicle Inspection - V002" -> "V002" (suffix)
 * "System Configuration" -> null
 */
export function extractVehicleIdFromTaskName(taskName: string): string | null {
  if (!taskName) return null
  
  // Check for prefix pattern first
  let match = taskName.match(/^V(\d{3,4})/)
  if (match) {
    return `V${match[1]}`
  }
  
  // Check for suffix pattern
  match = taskName.match(/V(\d{3,4})$/)
  if (match) {
    return `V${match[1]}`
  }
  
  return null
}

/**
 * Check if task name has vehicle ID prefix or suffix
 */
export function hasVehicleIdPrefix(taskName: string): boolean {
  if (!taskName) return false
  // Check for both prefix (V001 GPS) and suffix (GPS - V001) patterns
  return /^V\d{3,4}\s+/.test(taskName) || /\s*-\s*V\d{3,4}$/.test(taskName)
}

/**
 * Batch clean task names from an array of tasks
 */
export function cleanTaskNames(tasks: Array<{ id: string; name: string; [key: string]: any }>): Array<{ id: string; name: string; [key: string]: any }> {
  return tasks.map(task => ({
    ...task,
    name: cleanTaskName(task.name)
  }))
}

/**
 * Get display name for task (for UI components that want to show clean names)
 */
export function getTaskDisplayName(task: { name: string; vehicle_id?: string }): string {
  // If we have a vehicle_id, use clean name
  if (task.vehicle_id) {
    return cleanTaskName(task.name)
  }
  
  // Otherwise return name as-is (for generic tasks like "Lunch Break")
  return task.name
}

/**
 * Development utility to identify tasks that need name cleanup
 */
export function identifyTasksNeedingCleanup(tasks: Array<{ id: string; name: string; vehicle_id?: string }>): Array<{
  id: string
  name: string
  cleanedName: string
  vehicleIdFromName: string | null
  vehicleIdFromField: string | undefined
  needsCleanup: boolean
  hasConflict: boolean
}> {
  return tasks.map(task => {
    const cleanedName = cleanTaskName(task.name)
    const vehicleIdFromName = extractVehicleIdFromTaskName(task.name)
    const needsCleanup = hasVehicleIdPrefix(task.name)
    const hasConflict = !!(vehicleIdFromName && task.vehicle_id && vehicleIdFromName !== task.vehicle_id)
    
    return {
      id: task.id,
      name: task.name,
      cleanedName,
      vehicleIdFromName,
      vehicleIdFromField: task.vehicle_id,
      needsCleanup,
      hasConflict
    }
  })
}

/**
 * Generate SQL update statements to clean up task names in database
 * (for development/migration purposes)
 */
export function generateCleanupSQL(tasks: Array<{ id: string; name: string }>): string[] {
  const updates: string[] = []
  
  tasks.forEach(task => {
    const cleanedName = cleanTaskName(task.name)
    if (cleanedName !== task.name) {
      updates.push(
        `UPDATE tasks SET name = '${cleanedName.replace(/'/g, "''")}' WHERE id = '${task.id}';`
      )
    }
  })
  
  return updates
}
