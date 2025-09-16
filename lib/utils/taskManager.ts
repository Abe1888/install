// Database-driven task management system replacing hardcoded taskParser
'use client'

import { Vehicle, Task } from '@/lib/supabase/types'
import { calculateDateForDay } from '@/lib/utils/projectUtils'

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
  type: 'vehicle' | 'task' | 'installation'
  color: string
  textColor: string
  dependencies?: string[]
  resources?: { gps: number, fuel: number, tanks: number }
  category?: 'inspection' | 'installation' | 'configuration' | 'testing' | 'documentation' | 'break'
}

export interface TaskTemplate {
  name: string
  duration: number // in minutes
  type: 'vehicle' | 'task' | 'installation'
  category: 'inspection' | 'installation' | 'configuration' | 'testing' | 'documentation' | 'break'
  priority: 'High' | 'Medium' | 'Low'
  assignedTo: string
  prerequisites?: string[]
  resources?: { gps?: boolean, fuel?: boolean, tanks?: boolean }
  color?: string
  textColor?: string
}

// Database-driven task generation based on vehicle requirements
// Tasks are now generated from actual database tasks and vehicle specifications
function generateDynamicTaskTemplates(vehicle: Vehicle): TaskTemplate[] {
  const templates: TaskTemplate[] = []
  
  // Base inspection task (always required)
  templates.push({
    name: 'Vehicle Inspection',
    duration: 30,
    type: 'vehicle',
    category: 'inspection',
    priority: 'High',
    assignedTo: 'Installation Team',
    color: '#F59E0B',
    textColor: '#1F2937'
  })
  
  // GPS installation (based on vehicle requirements)
  if (vehicle.gps_required > 0) {
    templates.push({
      name: 'GPS Device Installation',
      duration: 60,
      type: 'installation',
      category: 'installation',
      priority: 'Medium',
      assignedTo: 'Technical Team',
      prerequisites: ['Vehicle Inspection'],
      resources: { gps: true },
      color: '#8B5CF6',
      textColor: '#FFFFFF'
    })
  }
  
  // Fuel sensor installation (based on vehicle requirements)
  if (vehicle.fuel_sensors > 0) {
    templates.push({
      name: 'Fuel Sensor Installation',
      duration: Math.max(60, vehicle.fuel_sensors * 30), // Dynamic duration based on sensor count
      type: 'installation',
      category: 'installation',
      priority: 'Medium',
      assignedTo: 'Technical Team',
      prerequisites: ['Vehicle Inspection'],
      resources: { fuel: true },
      color: '#06B6D4',
      textColor: '#FFFFFF'
    })
  }
  
  // System configuration (if any devices installed)
  if (vehicle.gps_required > 0 || vehicle.fuel_sensors > 0) {
    const prerequisites = []
    if (vehicle.gps_required > 0) prerequisites.push('GPS Device Installation')
    if (vehicle.fuel_sensors > 0) prerequisites.push('Fuel Sensor Installation')
    
    templates.push({
      name: 'System Configuration',
      duration: 45,
      type: 'task',
      category: 'configuration',
      priority: 'Medium',
      assignedTo: 'Technical Team',
      prerequisites,
      color: '#84CC16',
      textColor: '#1F2937'
    })
    
    // System testing follows configuration
    templates.push({
      name: 'System Testing',
      duration: 30,
      type: 'task',
      category: 'testing',
      priority: 'High',
      assignedTo: 'Quality Team',
      prerequisites: ['System Configuration'],
      color: '#F97316',
      textColor: '#FFFFFF'
    })
    
    // Documentation is final step
    templates.push({
      name: 'Documentation',
      duration: 15,
      type: 'task',
      category: 'documentation',
      priority: 'Low',
      assignedTo: 'Installation Team',
      prerequisites: ['System Testing'],
      color: '#6B7280',
      textColor: '#FFFFFF'
    })
  }
  
  return templates
}

// Break templates (lunch break is universal)
function getLunchBreakTemplate(): TaskTemplate {
  return {
    name: 'Lunch Break',
    duration: 60,
    type: 'task',
    category: 'break',
    priority: 'Low',
    assignedTo: 'All Team',
    color: '#6B7280',
    textColor: '#FFFFFF'
  }
}

// Generate tasks for a vehicle based on its schedule and requirements
export function generateVehicleTasks(
  vehicle: Vehicle,
  projectStartDate: string,
  timeSlot: string = '8:30-11:30 AM'
): GanttTask[] {
  const tasks: GanttTask[] = []
  const vehicleDate = calculateDateForDay(projectStartDate, vehicle.day)
  const baseDate = new Date(vehicleDate)
  
  // Determine start time based on time slot
  let startHour = 8
  let startMinute = 30
  
  if (timeSlot.includes('1:30')) {
    startHour = 13
    startMinute = 30
  }
  
  let currentTime = new Date(baseDate)
  currentTime.setHours(startHour, startMinute, 0, 0)
  
  // Add lunch break for morning sessions
  if (timeSlot.includes('8:30')) {
    const lunchStart = new Date(baseDate)
    lunchStart.setHours(12, 30, 0, 0)
    const lunchTemplate = getLunchBreakTemplate()
    
    tasks.push({
      id: `lunch-${vehicle.id}`,
      name: lunchTemplate.name,
      startDate: lunchStart,
      endDate: new Date(lunchStart.getTime() + lunchTemplate.duration * 60 * 1000),
      duration: lunchTemplate.duration / 60, // Convert to hours
      progress: 100, // Always complete
      status: 'Completed',
      priority: lunchTemplate.priority,
      assignedTo: lunchTemplate.assignedTo,
      location: vehicle.location,
      type: lunchTemplate.type,
      category: lunchTemplate.category,
      color: lunchTemplate.color!,
      textColor: lunchTemplate.textColor!
    })
  }
  
  // Generate installation tasks based on vehicle requirements (dynamic, not hardcoded)
  const templates = generateDynamicTaskTemplates(vehicle)
  const completedPrereqs = new Set<string>()
  
  templates.forEach((template, index) => {
    // Check prerequisites
    const canStart = !template.prerequisites || 
                    template.prerequisites.every(prereq => completedPrereqs.has(prereq))
    
    if (!canStart && template.prerequisites) {
      // Skip if prerequisites not met (shouldn't happen with proper sequencing)
      return
    }
    
    // Check if vehicle needs this installation
    const needsGps = template.resources?.gps && vehicle.gps_required > 0
    const needsFuel = template.resources?.fuel && vehicle.fuel_sensors > 0
    const isGeneralTask = !template.resources || Object.keys(template.resources).length === 0
    
    if (needsGps || needsFuel || isGeneralTask) {
      const startDate = new Date(currentTime)
      const endDate = new Date(startDate.getTime() + template.duration * 60 * 1000)
      
      // Calculate status based on current time and vehicle status
      const now = new Date()
      const taskStatus = getTaskStatus(vehicle, startDate, endDate, now)
      const progress = calculateTaskProgress(taskStatus)
      
      const task: GanttTask = {
        id: `${vehicle.id}-${template.category}-${index}`,
        name: `${vehicle.id} ${template.name}`,
        vehicleId: vehicle.id,
        vehicleType: vehicle.type,
        startDate,
        endDate,
        duration: template.duration / 60, // Convert to hours
        progress,
        status: taskStatus,
        priority: template.priority,
        assignedTo: template.assignedTo,
        location: vehicle.location,
        type: template.type,
        category: template.category,
        color: getTaskColor(template, taskStatus).bg,
        textColor: getTaskColor(template, taskStatus).text,
        resources: {
          gps: needsGps ? vehicle.gps_required : 0,
          fuel: needsFuel ? vehicle.fuel_sensors : 0,
          tanks: needsFuel ? vehicle.fuel_tanks : 0
        }
      }
      
      tasks.push(task)
      
      // Mark this task as complete for prerequisite checking
      completedPrereqs.add(template.name)
      
      // Update current time for next task
      currentTime = new Date(endDate)
    }
  })
  
  return tasks
}

// Get task status based on vehicle status and timing
function getTaskStatus(
  vehicle: Vehicle,
  taskStart: Date,
  taskEnd: Date,
  currentTime: Date
): 'Pending' | 'In Progress' | 'Completed' | 'Blocked' {
  // If vehicle is completed, all its tasks are completed
  if (vehicle.status === 'Completed') {
    return 'Completed'
  }
  
  // If vehicle is blocked, pending tasks are blocked (handle extended status)
  if ((vehicle.status as any) === 'Blocked') {
    return currentTime < taskStart ? 'Blocked' : 'Completed'
  }
  
  // Time-based status determination
  if (currentTime < taskStart) {
    return vehicle.status === 'In Progress' ? 'Pending' : 'Pending'
  }
  
  if (currentTime >= taskStart && currentTime <= taskEnd) {
    return vehicle.status === 'In Progress' ? 'In Progress' : 'Completed'
  }
  
  if (currentTime > taskEnd) {
    return 'Completed'
  }
  
  return 'Pending'
}

// Calculate task progress based on status
function calculateTaskProgress(status: string): number {
  switch (status) {
    case 'Completed': return 100
    case 'In Progress': return 60
    case 'Blocked': return 0
    case 'Pending': return 0
    default: return 0
  }
}

// Get task colors based on template and status
function getTaskColor(template: TaskTemplate, status: string): { bg: string, text: string } {
  // Override with status colors
  switch (status) {
    case 'Completed': return { bg: '#10B981', text: '#FFFFFF' }
    case 'In Progress': return { bg: '#3B82F6', text: '#FFFFFF' }
    case 'Blocked': return { bg: '#EF4444', text: '#FFFFFF' }
  }
  
  // Use template colors for pending tasks
  return {
    bg: template.color || '#9CA3AF',
    text: template.textColor || '#1F2937'
  }
}

// Generate all tasks from vehicles data
export function generateAllTasksFromVehicles(
  vehicles: Vehicle[],
  projectStartDate: string
): GanttTask[] {
  const allTasks: GanttTask[] = []
  
  vehicles.forEach(vehicle => {
    const timeSlot = vehicle.time_slot || '8:30-11:30 AM'
    const vehicleTasks = generateVehicleTasks(vehicle, projectStartDate, timeSlot)
    allTasks.push(...vehicleTasks)
  })
  
  return allTasks
}

// Filter tasks by various criteria
export function filterTasks(
  tasks: GanttTask[],
  filters: {
    day?: Date
    location?: string
    status?: string
    vehicleId?: string
    type?: string
    category?: string
    search?: string
  }
): GanttTask[] {
  return tasks.filter(task => {
    // Day filter - tasks that start, end, or span the day
    if (filters.day) {
      const filterDay = new Date(filters.day.toDateString())
      const taskStartDay = new Date(task.startDate.toDateString())
      const taskEndDay = new Date(task.endDate.toDateString())
      
      const taskOnDay = taskStartDay <= filterDay && taskEndDay >= filterDay
      if (!taskOnDay) return false
    }
    
    // Location filter
    if (filters.location && filters.location !== 'All' && task.location !== filters.location) {
      return false
    }
    
    // Status filter
    if (filters.status && filters.status !== 'All' && task.status !== filters.status) {
      return false
    }
    
    // Vehicle ID filter
    if (filters.vehicleId && task.vehicleId !== filters.vehicleId) {
      return false
    }
    
    // Type filter
    if (filters.type && filters.type !== 'All' && task.type !== filters.type) {
      return false
    }
    
    // Category filter
    if (filters.category && filters.category !== 'All' && task.category !== filters.category) {
      return false
    }
    
    // Search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase()
      const matchesSearch = 
        task.name.toLowerCase().includes(searchTerm) ||
        task.vehicleId?.toLowerCase().includes(searchTerm) ||
        task.assignedTo.toLowerCase().includes(searchTerm) ||
        task.location?.toLowerCase().includes(searchTerm)
      
      if (!matchesSearch) return false
    }
    
    return true
  })
}

// Group tasks by various criteria
export function groupTasks(
  tasks: GanttTask[],
  groupBy: 'vehicle' | 'location' | 'type' | 'category' | 'assignee'
): Record<string, { name: string, tasks: GanttTask[], color: string }> {
  const groups: Record<string, { name: string, tasks: GanttTask[], color: string }> = {}
  
  tasks.forEach(task => {
    let groupKey: string
    let groupName: string
    let groupColor: string
    
    switch (groupBy) {
      case 'vehicle':
        groupKey = task.vehicleId || 'general'
        groupName = task.vehicleId ? `${task.vehicleId} (${task.location})` : 'General Tasks'
        groupColor = '#3B82F6'
        break
      case 'location':
        groupKey = task.location || 'Unknown'
        groupName = `${task.location || 'Unknown'} Location`
        groupColor = '#8B5CF6'
        break
      case 'type':
        groupKey = task.type
        groupName = `${task.type.charAt(0).toUpperCase() + task.type.slice(1)} Tasks`
        groupColor = task.type === 'vehicle' ? '#F59E0B' : task.type === 'installation' ? '#06B6D4' : '#84CC16'
        break
      case 'category':
        groupKey = task.category || 'general'
        groupName = `${task.category ? task.category.charAt(0).toUpperCase() + task.category.slice(1) : 'General'} Tasks`
        groupColor = '#F97316'
        break
      case 'assignee':
        groupKey = task.assignedTo
        groupName = task.assignedTo
        groupColor = '#10B981'
        break
      default:
        groupKey = 'all'
        groupName = 'All Tasks'
        groupColor = '#6B7280'
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        name: groupName,
        tasks: [],
        color: groupColor
      }
    }
    
    groups[groupKey].tasks.push(task)
  })
  
  // Sort tasks within each group by start date
  Object.values(groups).forEach(group => {
    group.tasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  })
  
  return groups
}

// Utility functions for task management
export const TaskUtils = {
  generateVehicleTasks,
  generateAllTasksFromVehicles,
  filterTasks,
  groupTasks,
  getTaskStatus,
  calculateTaskProgress,
  getTaskColor
}

export default TaskUtils
