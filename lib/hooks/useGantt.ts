'use client'

import { useMemo, useCallback } from 'react'
import { useVehicles, useLocations, useTasks, useTeamMembers } from '@/lib/hooks/useUnifiedData'
import { useProjectSettings } from '@/lib/hooks/useProjectSettings'
import { calculateDateForDay } from '@/lib/utils/projectUtils'
import { getTaskDisplayName } from '@/lib/utils/taskNameCleanup'
import type { Vehicle, Task, Location, TeamMember } from '@/lib/supabase/types'

export interface GanttTask {
  id: string
  name: string
  vehicleId?: string
  vehicleType?: string
  startDate: Date
  endDate: Date
  duration: number
  progress: number
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked'
  priority: 'High' | 'Medium' | 'Low'
  assignedTo: string
  location?: string
  type: 'vehicle' | 'task' | 'installation' | 'break'
  color: string
  textColor: string
  category?: 'inspection' | 'installation' | 'configuration' | 'testing' | 'documentation' | 'break' | 'calibration'
}

// Dynamic schedule generation based on vehicle requirements
const generateDynamicVehicleSchedule = (
  vehicle: Vehicle,
  timeSlotRange: { start: Date, end: Date },
  displayDate: Date
) => {
  const schedule: Array<{
    name: string;
    start: string;
    end: string;
    category: 'inspection' | 'installation' | 'configuration' | 'testing' | 'documentation' | 'calibration';
    priority: 'High' | 'Medium' | 'Low';
  }> = []
  
  // Calculate available time in minutes
  const totalMinutes = (timeSlotRange.end.getTime() - timeSlotRange.start.getTime()) / (1000 * 60)
  let currentTimeMinutes = 0
  
  const startHour = timeSlotRange.start.getHours()
  const startMinute = timeSlotRange.start.getMinutes()
  
  // Helper to format time
  const formatTime = (minutes: number) => {
    const totalMins = startMinute + minutes
    const hours = startHour + Math.floor(totalMins / 60)
    const mins = totalMins % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }
  
  // 1. Always start with vehicle inspection (safety requirement)
  const inspectionDuration = 30 // 30 minutes
  schedule.push({
    name: `${vehicle.id} Vehicle Inspection`,
    start: formatTime(currentTimeMinutes),
    end: formatTime(currentTimeMinutes + inspectionDuration),
    category: 'inspection',
    priority: 'High'
  })
  currentTimeMinutes += inspectionDuration
  
  // 2. GPS Installation (if required)
  if (vehicle.gps_required > 0) {
    const gpsDuration = Math.max(60, vehicle.gps_required * 30) // Minimum 60 minutes
    schedule.push({
      name: `${vehicle.id} GPS Installation`,
      start: formatTime(currentTimeMinutes),
      end: formatTime(currentTimeMinutes + gpsDuration),
      category: 'installation',
      priority: 'High'
    })
    currentTimeMinutes += gpsDuration
  }
  
  // 3. Fuel Sensor Installation (if required)
  if (vehicle.fuel_sensors > 0) {
    const fuelDuration = Math.max(90, vehicle.fuel_sensors * 45) // Scale with sensor count
    schedule.push({
      name: `Fuel Sensor Installation`,
      start: formatTime(currentTimeMinutes),
      end: formatTime(currentTimeMinutes + fuelDuration),
      category: 'installation',
      priority: 'High'
    })
    currentTimeMinutes += fuelDuration
  }
  
  // 4. System Configuration (if any devices installed)
  if (vehicle.gps_required > 0 || vehicle.fuel_sensors > 0) {
    const configDuration = 45 + (vehicle.fuel_sensors * 15) // More sensors = more config time
    schedule.push({
      name: `System Configuration`,
      start: formatTime(currentTimeMinutes),
      end: formatTime(currentTimeMinutes + configDuration),
      category: 'configuration',
      priority: 'High'
    })
    currentTimeMinutes += configDuration
    
    // 5. System Testing (follows configuration)
    const testDuration = 30
    if (currentTimeMinutes + testDuration < totalMinutes) {
      schedule.push({
        name: `Quality Assurance`,
        start: formatTime(currentTimeMinutes),
        end: formatTime(currentTimeMinutes + testDuration),
        category: 'testing',
        priority: 'Medium'
      })
      currentTimeMinutes += testDuration
    }
    
    // 6. Documentation (final step)
    const docDuration = 20
    if (currentTimeMinutes + docDuration < totalMinutes) {
      schedule.push({
        name: `Documentation`,
        start: formatTime(currentTimeMinutes),
        end: formatTime(currentTimeMinutes + docDuration),
        category: 'documentation',
        priority: 'Low'
      })
      currentTimeMinutes += docDuration
    }
  }
  
  return schedule
}

// Task color scheme based on type and status
const getTaskColor = (taskName: string, status: string, type: string): { bg: string, text: string } => {
  // Color by status first
  switch (status) {
    case 'Completed': return { bg: '#10B981', text: '#FFFFFF' }
    case 'In Progress': return { bg: '#3B82F6', text: '#FFFFFF' }
    case 'Blocked': return { bg: '#EF4444', text: '#FFFFFF' }
  }

  // Color by task type/name if pending
  const name = taskName.toLowerCase()
  if (name.includes('vehicle') || name.includes('inspection')) return { bg: '#F59E0B', text: '#1F2937' }
  if (name.includes('gps') || name.includes('installation')) return { bg: '#8B5CF6', text: '#FFFFFF' }
  if (name.includes('fuel') || name.includes('sensor')) return { bg: '#06B6D4', text: '#FFFFFF' }
  if (name.includes('system') || name.includes('configuration')) return { bg: '#84CC16', text: '#1F2937' }
  if (name.includes('quality') || name.includes('documentation')) return { bg: '#F97316', text: '#FFFFFF' }
  if (name.includes('lunch') || name.includes('break')) return { bg: '#6B7280', text: '#FFFFFF' }

  return { bg: '#9CA3AF', text: '#1F2937' }
}

// Generate timeline tasks from REAL database tasks (not synthetic)
const generateTimelineTasks = (
  vehicles: Vehicle[],
  tasks: Task[],
  teamMembers: TeamMember[],
  projectStartDate: string,
  day: number
): GanttTask[] => {
  const ganttTasks: GanttTask[] = []
  const displayDate = new Date(calculateDateForDay(projectStartDate, day))
  
  // Filter vehicles for the selected day and sort by ID for consistent V001, V002 order
  const dayVehicles = vehicles
    .filter(vehicle => vehicle.day === day)
    .sort((a, b) => a.id.localeCompare(b.id))
  const dayVehicleIds = new Set(dayVehicles.map(v => v.id))
  
  // Use REAL database tasks including both vehicle-specific and shared tasks
  const dayTasks = tasks.filter(task => {
    // Include vehicle-specific tasks for this day
    if (task.vehicle_id) {
      const vehicleIds = Array.isArray(task.vehicle_id) ? task.vehicle_id : [task.vehicle_id];
      if (vehicleIds.some(vId => dayVehicleIds.has(vId))) {
        return true
      }
    }
    // Include shared tasks (like lunch break) that don't have vehicle_id
    if (!task.vehicle_id && (task.name === 'Lunch Break' || task.name.includes('Break'))) {
      return true
    }
    return false
  })
  
  // Group tasks by vehicle for proper scheduling
  const tasksByVehicle = dayTasks.reduce((acc, task) => {
    // Handle vehicle_id being either string or string[]
    if (task.vehicle_id) {
      const vehicleIds = Array.isArray(task.vehicle_id) ? task.vehicle_id : [task.vehicle_id];
      vehicleIds.forEach(vId => {
        if (!acc[vId]) acc[vId] = []
        acc[vId].push(task)
      });
    } else {
      // Shared tasks without vehicle_id
      const groupKey = 'Shared Tasks';
      if (!acc[groupKey]) acc[groupKey] = []
      acc[groupKey].push(task)
    }
    return acc
  }, {} as Record<string, typeof dayTasks>)

  // Convert database tasks to GanttTasks format with proper timing
  Object.entries(tasksByVehicle).forEach(([groupKey, vehicleTasks]) => {
    const vehicle = dayVehicles.find(v => v.id === groupKey)
    const isSharedTask = groupKey === 'Shared Tasks'
    
    // For shared tasks, we don't need a vehicle context
    if (!vehicle && !isSharedTask) return
    
    let timeSlotRange = null
    let currentStartTime = 0
    
    if (!isSharedTask) {
      // Parse vehicle time slot to get base timing
      timeSlotRange = parseVehicleTimeSlot(vehicle!.time_slot, displayDate)
      if (!timeSlotRange) return
      
      // Distribute tasks evenly within the vehicle's time slot
      currentStartTime = timeSlotRange.start.getTime()
    }
    
    // Sort tasks by priority and category for logical sequence
    const sortedTasks = vehicleTasks.sort((a, b) => {
      // For shared tasks, just sort by start time
      if (isSharedTask && a.start_time && b.start_time) {
        return a.start_time.localeCompare(b.start_time)
      }
      
      const categoryOrder = {
        'Vehicle Inspection': 1,
        'GPS Installation': 2, 
        'Fuel Sensor Installation': 3,
        'Fuel Sensor Installation 1': 3,
        'System Configuration': 4,
        'Fuel Sensor Calibration': 5,
        'Quality Assurance': 6,
        'Documentation': 7
      }
      const aOrder = categoryOrder[a.name as keyof typeof categoryOrder] || 8
      const bOrder = categoryOrder[b.name as keyof typeof categoryOrder] || 8
      return aOrder - bOrder
    })
    
    sortedTasks.forEach((task, taskIndex) => {
      // PRIORITY 1: Use actual start_time and end_time from database (REAL DATA)
      let taskStart: Date
      let taskEnd: Date
      
      if (task.start_time && task.end_time) {
        // Parse actual database times - THIS IS THE REAL DATA
        taskStart = parseTimeString(task.start_time, displayDate)
        taskEnd = parseTimeString(task.end_time, displayDate)
        
      } else {
        // FALLBACK: Only use if database times are missing
        
        const taskDuration = getTaskDuration(task.name, task.estimated_duration)
        taskStart = new Date(currentStartTime)
        taskEnd = new Date(currentStartTime + (taskDuration * 60 * 1000))
        
        // Ensure task doesn't exceed vehicle's time slot (only for vehicle tasks)
        if (timeSlotRange) {
          const maxEndTime = timeSlotRange.end.getTime()
          if (taskEnd.getTime() > maxEndTime) {
            taskEnd.setTime(maxEndTime)
          }
          
          // Update currentStartTime for next task (only for fallback)
          currentStartTime = taskEnd.getTime()
        }
      }
    
    const colors = getTaskColor(task.name, task.status, 'task')
    
    ganttTasks.push({
      id: task.id,
      name: getTaskDisplayName({ name: task.name, vehicle_id: Array.isArray(task.vehicle_id) ? task.vehicle_id[0] : task.vehicle_id }), // Use cleaned name
      vehicleId: Array.isArray(task.vehicle_id) ? task.vehicle_id[0] : task.vehicle_id,
      vehicleType: vehicle?.type || 'Shared',
      startDate: taskStart,
      endDate: taskEnd,
      duration: (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60),
      progress: task.status === 'Completed' ? 100 : task.status === 'In Progress' ? 50 : 0,
      status: task.status === 'Scheduled' ? 'Pending' : task.status,
      priority: task.priority,
      assignedTo: Array.isArray(task.assigned_to) ? task.assigned_to[0] || '' : task.assigned_to || '',
      location: vehicle?.location || 'All Locations',
      type: 'task',
      color: colors.bg,
      textColor: colors.text,
      category: getCategoryFromTaskName(task.name)
    })
    })
  })
  
  // Tasks are already sorted by database, but ensure proper time order
  return ganttTasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
}

// REMOVED: Synthetic schedule generation that conflicts with database data
// The generateDetailedSchedule function has been disabled to prevent conflicts
// with real database tasks. All task data now comes directly from the tasks table
// with start_time and end_time fields.
//
// This eliminates the dual timeline system that was causing misalignment.

// REMOVED: Hardcoded lunch break logic - now using database lunch breaks only
// This prevents conflicts with database lunch break tasks

// Helper function to get task duration in minutes based on task type and estimated duration
const getTaskDuration = (taskName: string, estimatedDuration?: number): number => {
  // Use estimated duration if available
  if (estimatedDuration && estimatedDuration > 0) {
    return estimatedDuration
  }
  
  // Default durations based on task type (in minutes)
  const name = taskName.toLowerCase()
  if (name.includes('vehicle') || name.includes('inspection')) return 30
  if (name.includes('gps') && name.includes('installation')) return 60
  if (name.includes('fuel') && name.includes('sensor')) return 90
  if (name.includes('system') && name.includes('configuration')) return 45
  if (name.includes('quality') || name.includes('assurance')) return 30
  if (name.includes('calibration')) return 20
  if (name.includes('documentation')) return 20
  
  // Default duration for unknown tasks
  return 45
}

// Helper functions
const parseTimeSlot = (timeSlot: string, baseDate: Date): Date => {
  const [hours, minutes] = timeSlot.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
}

const parseTimeString = (timeStr: string, baseDate: Date): Date => {
  try {
    // Handle HH:MM format from database (e.g., "08:30:00" or "08:30")
    const timeParts = timeStr.split(':')
    const hours = parseInt(timeParts[0], 10)
    const minutes = parseInt(timeParts[1] || '0', 10)
    
    // Validate time values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time format: ${timeStr}`)
    }
    
    const date = new Date(baseDate)
    date.setHours(hours, minutes, 0, 0)
    
    
    return date
  } catch (error) {
    console.error(`❌ Failed to parse time string "${timeStr}":`, error)
    // Fallback to 8:00 AM if parsing fails
    const date = new Date(baseDate)
    date.setHours(8, 0, 0, 0)
    return date
  }
}

// Parse vehicle time slot like "8:30–11:30 AM" into actual Date objects
const parseVehicleTimeSlot = (timeSlot: string, baseDay: Date): { start: Date, end: Date } | null => {
  if (!timeSlot) return null
  
  try {
    // Handle formats like "8:30–11:30 AM" or "1:00–4:00 PM"
    const timeRange = timeSlot.replace(/\s+/g, ' ').trim()
    const parts = timeRange.split(/[–-]/)
    
    if (parts.length !== 2) return null
    
    let [startPart, endPart] = parts
    startPart = startPart.trim()
    endPart = endPart.trim()
    
    // Extract AM/PM from end time
    const amPmMatch = endPart.match(/(AM|PM)$/i)
    const amPm = amPmMatch ? amPmMatch[1].toUpperCase() : 'AM'
    const isPM = amPm === 'PM'
    
    // Remove AM/PM from end part
    endPart = endPart.replace(/(AM|PM)$/i, '').trim()
    
    // Parse start time
    const [startHour, startMin = 0] = startPart.split(':').map(Number)
    // Parse end time  
    const [endHour, endMin = 0] = endPart.split(':').map(Number)
    
    const baseDate = new Date(baseDay)
    baseDate.setHours(0, 0, 0, 0)
    
    // Create start date - determine start time AM/PM based on logic
    const startDate = new Date(baseDate)
    let adjustedStartHour = startHour
    
    // Logic for start time:
    // Handle common patterns:
    // - Morning: 08:30–11:50 AM (both AM)
    // - Afternoon: 01:30–04:50 PM (both PM)
    // - Mixed: 09:00–12:00 PM (start AM, end PM noon)
    const isStartPM = isPM && !(startHour < endHour && endHour === 12 && startHour < 12)
    
    if (isStartPM && startHour < 12) {
      adjustedStartHour += 12
    } else if (!isStartPM && startHour === 12) {
      adjustedStartHour = 0
    }
    startDate.setHours(adjustedStartHour, startMin || 0, 0, 0)
    
    // Create end date
    const endDate = new Date(baseDate)
    let adjustedEndHour = endHour
    if (isPM && endHour < 12) {
      adjustedEndHour += 12
    } else if (!isPM && endHour === 12) {
      adjustedEndHour = 0
    }
    endDate.setHours(adjustedEndHour, endMin || 0, 0, 0)
    
    return { start: startDate, end: endDate }
  } catch (error) {
    return null
  }
}

const getCategoryFromTaskName = (taskName: string): GanttTask['category'] => {
  const name = taskName.toLowerCase()
  if (name.includes('inspect')) return 'inspection'
  if (name.includes('install')) return 'installation'
  if (name.includes('config')) return 'configuration'
  if (name.includes('test') || name.includes('quality')) return 'testing'
  if (name.includes('document')) return 'documentation'
  if (name.includes('calibrat')) return 'calibration'
  return 'testing'
}

// Helper to assign team members based on task type (DATABASE-DRIVEN)
const getAssignedTeam = (category: string, teamMembers: TeamMember[]): string => {
  if (teamMembers.length === 0) {
    // Fallback only if no team members in database
    return 'Unassigned'
  }
  
  // Find team member with role most suitable for the category
  const roleMapping: Record<string, string[]> = {
    'inspection': ['senior', 'lead', 'supervisor', 'technician'],
    'installation': ['installation', 'technician', 'specialist'],
    'configuration': ['engineer', 'system', 'software', 'technical'],
    'testing': ['qa', 'quality', 'inspector', 'testing'],
    'documentation': ['coordinator', 'manager', 'admin'],
    'calibration': ['calibration', 'specialist', 'expert', 'technician'],
    'break': ['all']
  }
  
  if (category === 'break') {
    return 'All Team'
  }
  
  const preferredRoles = roleMapping[category] || ['technician']
  
  // Find best matching team member based on role
  for (const roleKeyword of preferredRoles) {
    const member = teamMembers.find(tm => 
      tm.role.toLowerCase().includes(roleKeyword)
    )
    if (member) {
      return member.name
    }
  }
  
  // If no specific match, return first available team member
  return teamMembers[0].name
}

// Filter tasks based on criteria
export const filterGanttTasks = (
  tasks: GanttTask[],
  filters: {
    location?: string
    status?: string
    search?: string
    vehicleId?: string
  }
): GanttTask[] => {
  return tasks.filter(task => {
    if (filters.location && filters.location !== 'All' && task.location !== filters.location) {
      return false
    }
    
    if (filters.status && filters.status !== 'All' && task.status !== filters.status) {
      return false
    }
    
    if (filters.vehicleId && task.vehicleId !== filters.vehicleId) {
      return false
    }
    
    if (filters.search && !task.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    
    return true
  })
}

// Group tasks by vehicle or location
export const groupGanttTasks = (
  tasks: GanttTask[],
  groupBy: 'vehicle' | 'location' | 'category'
): Record<string, GanttTask[]> => {
  return tasks.reduce((groups, task) => {
    let key: string
    
    switch (groupBy) {
      case 'vehicle':
        key = task.vehicleId || 'Shared Tasks'
        break
      case 'location':
        key = task.location || 'General'
        break
      case 'category':
        key = task.category || 'Other'
        break
      default:
        key = 'All'
    }
    
    if (!groups[key]) {
      groups[key] = []
    }
    
    groups[key].push(task)
    return groups
  }, {} as Record<string, GanttTask[]>)
}

// Main hook for Gantt chart data with real-time updates
export function useGantt(selectedDay: number = 1) {
  // Ensure real-time updates are enabled for all data sources
  const { data: vehicles = [], isLoading: vehiclesLoading, error: vehiclesError, mutate: refreshVehicles } = useVehicles(true)
  const { data: tasks = [], isLoading: tasksLoading, mutate: refreshTasks } = useTasks(undefined, true) 
  const { data: teamMembers = [], isLoading: teamMembersLoading, mutate: refreshTeamMembers } = useTeamMembers(true)
  const { data: locations = [], mutate: refreshLocations } = useLocations(true)
  const { settings: projectSettings, refreshSettings: refreshProjectSettings } = useProjectSettings()
  
  const isLoading = vehiclesLoading || tasksLoading || teamMembersLoading
  const hasError = vehiclesError
  const projectStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0]
  
  // Generate timeline tasks for the selected day
  const timelineTasks = useMemo(() => {
    if (!vehicles.length || !projectStartDate) return []
    
    const generatedTasks = generateTimelineTasks(vehicles, tasks, teamMembers, projectStartDate, selectedDay)
    
    
    return generatedTasks
  }, [vehicles, tasks, teamMembers, projectStartDate, selectedDay])
  
  // Calculate statistics
  const stats = useMemo(() => {
    const dayVehicles = vehicles.filter(v => v.day === selectedDay)
    const totalTasks = timelineTasks.length
    const completedTasks = timelineTasks.filter(t => t.status === 'Completed').length
    const inProgressTasks = timelineTasks.filter(t => t.status === 'In Progress').length
    const pendingTasks = timelineTasks.filter(t => t.status === 'Pending').length
    
    return {
      totalVehicles: dayVehicles.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      locations: [...new Set(dayVehicles.map(v => v.location))],
      timeRange: {
        start: timelineTasks[0]?.startDate,
        end: timelineTasks[timelineTasks.length - 1]?.endDate
      }
    }
  }, [vehicles, timelineTasks, selectedDay])
  
  // Utility functions
  const filterTasks = (filters: Parameters<typeof filterGanttTasks>[1]) => {
    return filterGanttTasks(timelineTasks, filters)
  }
  
  const groupTasks = (groupBy: Parameters<typeof groupGanttTasks>[1]) => {
    return groupGanttTasks(timelineTasks, groupBy)
  }
  
  // Manual refresh function for all data sources
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      refreshTasks?.(),
      refreshVehicles?.(),
      refreshTeamMembers?.(),
      refreshLocations?.(),
      refreshProjectSettings?.()
    ])
  }, [refreshTasks, refreshVehicles, refreshTeamMembers, refreshLocations, refreshProjectSettings])
  
  return {
    tasks: timelineTasks,
    vehicles: vehicles.filter(v => v.day === selectedDay),
    locations,
    stats,
    isLoading,
    hasError,
    projectStartDate,
    filterTasks,
    groupTasks,
    refreshAllData, // Add refresh function
    
    // Additional computed data
    displayDate: new Date(calculateDateForDay(projectStartDate, selectedDay)),
    availableDays: [...new Set(vehicles.map(v => v.day))].sort((a, b) => a - b),
    locationStats: locations.map(loc => ({
      ...loc,
      vehicleCount: vehicles.filter(v => v.location === loc.name && v.day === selectedDay).length
    }))
  }
}
