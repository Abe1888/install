// Aligned task management system that matches Gantt-Chart.md timeline exactly
'use client'

import { Vehicle, Task } from '@/lib/supabase/types'
import { calculateDateForDay } from '@/lib/utils/projectUtils'

export interface AlignedGanttTask {
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
  dependencies?: string[]
  resources?: { gps: number, fuel: number, tanks: number }
  category?: 'inspection' | 'installation' | 'configuration' | 'testing' | 'documentation' | 'break' | 'calibration'
}

// Exact schedule from Gantt-Chart.md with overlapping tasks support
export const ALIGNED_SCHEDULE_TEMPLATES = {
  morning: [
    {
      name: "Vehicle Inspection",
      start: "08:30",
      end: "08:40",
      duration: 10,
      type: 'vehicle' as const,
      category: 'inspection' as const,
      priority: 'High' as const,
      assignedTo: 'Installation Team',
      color: '#F59E0B',
      textColor: '#1F2937',
      vehicleSpecific: true,
      resources: {}
    },
    {
      name: "GPS Installation", 
      start: "08:40",
      end: "09:40",
      duration: 60,
      type: 'installation' as const,
      category: 'installation' as const,
      priority: 'Medium' as const,
      assignedTo: 'Technical Team',
      color: '#8B5CF6',
      textColor: '#FFFFFF',
      vehicleSpecific: true,
      resources: { gps: true }
    },
    {
      name: "Fuel Sensor Installation",
      start: "08:30",
      end: "10:30", 
      duration: 120,
      type: 'installation' as const,
      category: 'installation' as const,
      priority: 'Medium' as const,
      assignedTo: 'Technical Team',
      color: '#06B6D4',
      textColor: '#FFFFFF',
      vehicleSpecific: false, // Can be shared across vehicles
      resources: { fuel: true }
    },
    {
      name: "System Configuration",
      start: "09:00",
      end: "09:30",
      duration: 30,
      type: 'task' as const,
      category: 'configuration' as const,
      priority: 'Medium' as const,
      assignedTo: 'Technical Team',
      color: '#84CC16',
      textColor: '#1F2937',
      vehicleSpecific: false,
      resources: {}
    },
    // Second round for specific vehicles
    {
      name: "Vehicle Inspection", 
      start: "09:40",
      end: "09:50",
      duration: 10,
      type: 'vehicle' as const,
      category: 'inspection' as const,
      priority: 'High' as const,
      assignedTo: 'Installation Team',
      color: '#F59E0B',
      textColor: '#1F2937',
      vehicleSpecific: true,
      resources: {},
      round: 2
    },
    {
      name: "GPS Installation",
      start: "09:50", 
      end: "10:50",
      duration: 60,
      type: 'installation' as const,
      category: 'installation' as const,
      priority: 'Medium' as const,
      assignedTo: 'Technical Team',
      color: '#8B5CF6',
      textColor: '#FFFFFF',
      vehicleSpecific: true,
      resources: { gps: true },
      round: 2
    },
    {
      name: "Fuel Sensor Calibration",
      start: "10:30",
      end: "11:30",
      duration: 60,
      type: 'task' as const,
      category: 'calibration' as const,
      priority: 'High' as const,
      assignedTo: 'Quality Team',
      color: '#10B981',
      textColor: '#FFFFFF',
      vehicleSpecific: false,
      resources: { fuel: true }
    },
    {
      name: "Quality Assurance",
      start: "11:30",
      end: "11:40", 
      duration: 10,
      type: 'task' as const,
      category: 'testing' as const,
      priority: 'High' as const,
      assignedTo: 'Quality Team',
      color: '#F97316',
      textColor: '#FFFFFF',
      vehicleSpecific: false,
      resources: {}
    },
    {
      name: "Documentation",
      start: "11:40",
      end: "11:50",
      duration: 10,
      type: 'task' as const,
      category: 'documentation' as const,
      priority: 'Low' as const,
      assignedTo: 'Installation Team',
      color: '#6B7280',
      textColor: '#FFFFFF',
      vehicleSpecific: false,
      resources: {}
    }
  ],
  lunch: [
    {
      name: "Lunch Break",
      start: "12:30",
      end: "13:30",
      duration: 60,
      type: 'break' as const,
      category: 'break' as const,
      priority: 'Low' as const,
      assignedTo: 'All Team',
      color: '#6B7280',
      textColor: '#FFFFFF',
      vehicleSpecific: false,
      resources: {}
    }
  ],
  afternoon: [
    {
      name: "Fuel Sensor Installation",
      start: "13:30",
      end: "15:30",
      duration: 120,
      type: 'installation' as const,
      category: 'installation' as const,
      priority: 'Medium' as const,
      assignedTo: 'Technical Team',
      color: '#06B6D4',
      textColor: '#FFFFFF',
      vehicleSpecific: false,
      resources: { fuel: true }
    },
    {
      name: "System Configuration",
      start: "13:50",
      end: "14:20",
      duration: 30,
      type: 'task' as const,
      category: 'configuration' as const,
      priority: 'Medium' as const,
      assignedTo: 'Technical Team', 
      color: '#84CC16',
      textColor: '#1F2937',
      vehicleSpecific: false,
      resources: {}
    },
    {
      name: "Fuel Sensor Calibration",
      start: "15:30",
      end: "16:30",
      duration: 60,
      type: 'task' as const,
      category: 'calibration' as const,
      priority: 'High' as const,
      assignedTo: 'Quality Team',
      color: '#10B981',
      textColor: '#FFFFFF',
      vehicleSpecific: false,
      resources: { fuel: true }
    },
    {
      name: "Quality Assurance",
      start: "16:30",
      end: "16:40",
      duration: 10,
      type: 'task' as const,
      category: 'testing' as const,
      priority: 'High' as const,
      assignedTo: 'Quality Team',
      color: '#F97316',
      textColor: '#FFFFFF',
      vehicleSpecific: false,
      resources: {}
    },
    {
      name: "Documentation",
      start: "16:40",
      end: "16:50", 
      duration: 10,
      type: 'task' as const,
      category: 'documentation' as const,
      priority: 'Low' as const,
      assignedTo: 'Installation Team',
      color: '#6B7280',
      textColor: '#FFFFFF',
      vehicleSpecific: false,
      resources: {}
    }
  ]
}

// Parse time string to Date object
function parseAlignedTime(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
}

// Generate aligned tasks that match Gantt-Chart.md exactly
export function generateAlignedVehicleTasks(
  vehicles: Vehicle[],
  projectStartDate: string,
  selectedDay?: number
): AlignedGanttTask[] {
  const tasks: AlignedGanttTask[] = []
  
  // Group vehicles by day and time slot for parallel processing
  const vehiclesByDayAndSlot = vehicles.reduce((acc, vehicle) => {
    const key = `${vehicle.day}-${vehicle.time_slot}`
    if (!acc[key]) acc[key] = []
    acc[key].push(vehicle)
    return acc
  }, {} as Record<string, Vehicle[]>)
  
  Object.entries(vehiclesByDayAndSlot).forEach(([key, dayVehicles]) => {
    const [dayStr, timeSlot] = key.split('-')
    const day = parseInt(dayStr)
    
    // Filter by selected day if provided
    if (selectedDay && day !== selectedDay) return
    
    const vehicleDate = calculateDateForDay(projectStartDate, day)
    const baseDate = new Date(vehicleDate)
    
    // Determine which schedule to use based on time slot
    const isMorningSlot = timeSlot.includes('8:30')
    const scheduleKey = isMorningSlot ? 'morning' : 'afternoon'
    const scheduleTemplates = ALIGNED_SCHEDULE_TEMPLATES[scheduleKey]
    
    // Add lunch break for morning sessions
    if (isMorningSlot) {
      ALIGNED_SCHEDULE_TEMPLATES.lunch.forEach((template) => {
        const startDate = parseAlignedTime(template.start, baseDate)
        const endDate = parseAlignedTime(template.end, baseDate)
        
        tasks.push({
          id: `lunch-${day}`,
          name: template.name,
          startDate,
          endDate,
          duration: template.duration / 60, // Convert to hours
          progress: 100, // Always complete
          status: 'Completed',
          priority: template.priority,
          assignedTo: template.assignedTo,
          location: dayVehicles[0]?.location,
          type: template.type,
          category: template.category,
          color: template.color,
          textColor: template.textColor,
          resources: { gps: 0, fuel: 0, tanks: 0 }
        })
      })
    }
    
    // Generate tasks from schedule templates
    scheduleTemplates.forEach((template, templateIndex) => {
      const startDate = parseAlignedTime(template.start, baseDate)
      const endDate = parseAlignedTime(template.end, baseDate)
      const now = new Date()
      
      if (template.vehicleSpecific) {
        // Create vehicle-specific tasks (like V001 Vehicle Inspection)
        dayVehicles.forEach((vehicle, vehicleIndex) => {
          // Handle multiple rounds (e.g., V001 inspection at 8:30 and V001 inspection at 9:40)
          const shouldIncludeVehicle = (template as any).round 
            ? vehicleIndex < Math.min((template as any).round, dayVehicles.length)
            : vehicleIndex < 2 // Limit to first 2 vehicles per template as per Gantt-Chart.md
          
          if (!shouldIncludeVehicle) return
          
          // Check if vehicle needs this type of task
          const needsGps = (template.resources as any)?.gps && vehicle.gps_required > 0
          const needsFuel = (template.resources as any)?.fuel && vehicle.fuel_sensors > 0
          const isGeneralTask = !template.resources || Object.keys(template.resources).length === 0
          
          if (needsGps || needsFuel || isGeneralTask) {
            const taskStatus = getAlignedTaskStatus(vehicle, startDate, endDate, now)
            const progress = calculateAlignedTaskProgress(taskStatus)
            
            tasks.push({
              id: `${vehicle.id}-${template.category}-${templateIndex}-${(template as any).round || 1}`,
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
              color: getAlignedTaskColor(template, taskStatus).bg,
              textColor: getAlignedTaskColor(template, taskStatus).text,
              resources: {
                gps: needsGps ? vehicle.gps_required : 0,
                fuel: needsFuel ? vehicle.fuel_sensors : 0,
                tanks: needsFuel ? vehicle.fuel_tanks : 0
              }
            })
          }
        })
      } else {
        // Create shared tasks (like Fuel Sensor Installation that affects multiple vehicles)
        const affectedVehicles = dayVehicles.filter(vehicle => {
          const needsGps = (template.resources as any)?.gps && vehicle.gps_required > 0
          const needsFuel = (template.resources as any)?.fuel && vehicle.fuel_sensors > 0
          const isGeneralTask = !template.resources || Object.keys(template.resources).length === 0
          return needsGps || needsFuel || isGeneralTask
        })
        
        if (affectedVehicles.length > 0) {
          const representativeVehicle = affectedVehicles[0]
          const taskStatus = getAlignedTaskStatus(representativeVehicle, startDate, endDate, now)
          const progress = calculateAlignedTaskProgress(taskStatus)
          
          tasks.push({
            id: `shared-${template.category}-${day}-${templateIndex}`,
            name: template.name,
            startDate,
            endDate,
            duration: template.duration / 60, // Convert to hours
            progress,
            status: taskStatus,
            priority: template.priority,
            assignedTo: template.assignedTo,
            location: representativeVehicle.location,
            type: template.type,
            category: template.category,
            color: getAlignedTaskColor(template, taskStatus).bg,
            textColor: getAlignedTaskColor(template, taskStatus).text,
            resources: {
              gps: (template.resources as any)?.gps ? affectedVehicles.reduce((sum, v) => sum + v.gps_required, 0) : 0,
              fuel: (template.resources as any)?.fuel ? affectedVehicles.reduce((sum, v) => sum + v.fuel_sensors, 0) : 0,
              tanks: (template.resources as any)?.fuel ? affectedVehicles.reduce((sum, v) => sum + v.fuel_tanks, 0) : 0
            }
          })
        }
      }
    })
  })
  
  return tasks
}

// Get task status based on vehicle status and timing (aligned version)
function getAlignedTaskStatus(
  vehicle: Vehicle,
  taskStart: Date,
  taskEnd: Date,
  currentTime: Date
): 'Pending' | 'In Progress' | 'Completed' | 'Blocked' {
  // If vehicle is completed, all its tasks are completed
  if (vehicle.status === 'Completed') {
    return 'Completed'
  }
  
  // If vehicle is blocked, tasks are blocked (handle extended status)
  if ((vehicle.status as any) === 'Blocked') {
    return currentTime < taskStart ? 'Blocked' : 'Completed'
  }
  
  // Time-based status determination
  if (currentTime < taskStart) {
    return 'Pending'
  }
  
  if (currentTime >= taskStart && currentTime <= taskEnd) {
    return vehicle.status === 'In Progress' ? 'In Progress' : 'Completed'
  }
  
  if (currentTime > taskEnd) {
    return 'Completed'
  }
  
  return 'Pending'
}

// Calculate task progress based on status (aligned version)
function calculateAlignedTaskProgress(status: string): number {
  switch (status) {
    case 'Completed': return 100
    case 'In Progress': return 60
    case 'Blocked': return 0
    case 'Pending': return 0
    default: return 0
  }
}

// Get task colors based on template and status (aligned version)
function getAlignedTaskColor(template: any, status: string): { bg: string, text: string } {
  // Override with status colors for active states
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

// Generate all aligned tasks from vehicles data
export function generateAllAlignedTasksFromVehicles(
  vehicles: Vehicle[],
  projectStartDate: string,
  selectedDay?: number
): AlignedGanttTask[] {
  return generateAlignedVehicleTasks(vehicles, projectStartDate, selectedDay)
}

// Filter aligned tasks by various criteria
export function filterAlignedTasks(
  tasks: AlignedGanttTask[],
  filters: {
    day?: Date
    location?: string
    status?: string
    vehicleId?: string
    type?: string
    category?: string
    search?: string
  }
): AlignedGanttTask[] {
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

// Group aligned tasks by various criteria  
export function groupAlignedTasks(
  tasks: AlignedGanttTask[],
  groupBy: 'vehicle' | 'location' | 'type' | 'category' | 'assignee'
): Record<string, { name: string, tasks: AlignedGanttTask[], color: string }> {
  const groups: Record<string, { name: string, tasks: AlignedGanttTask[], color: string }> = {}
  
  tasks.forEach(task => {
    let groupKey: string
    let groupName: string
    let groupColor: string
    
    switch (groupBy) {
      case 'vehicle':
        groupKey = task.vehicleId || 'shared'
        groupName = task.vehicleId ? `${task.vehicleId} (${task.location})` : 'Shared Tasks'
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

// Utility functions for aligned task management
export const AlignedTaskUtils = {
  generateAlignedVehicleTasks,
  generateAllAlignedTasksFromVehicles,
  filterAlignedTasks,
  groupAlignedTasks,
  getAlignedTaskStatus,
  calculateAlignedTaskProgress,
  getAlignedTaskColor
}

export default AlignedTaskUtils
