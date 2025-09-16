// Utility to parse hardcoded task data and create proper schedule
export interface ScheduleTask {
  name: string
  start: string // Time format like "08:30"
  end: string   // Time format like "08:40"
  period: 'morning' | 'lunch' | 'afternoon'
}

export const hardcodedTasks: { [key: string]: ScheduleTask[] } = {
  morning: [
    { name: "V001 Vehicle Inspection", start: "08:30", end: "08:40", period: "morning" },
    { name: "V002 GPS Installation", start: "08:40", end: "09:40", period: "morning" },
    { name: "Fuel Sensor Installation", start: "08:30", end: "10:30", period: "morning" },
    { name: "System Configuration", start: "09:00", end: "09:30", period: "morning" },
    { name: "V001 Vehicle Inspection", start: "09:40", end: "09:50", period: "morning" },
    { name: "V002 GPS Installation", start: "09:50", end: "10:50", period: "morning" },
    { name: "Fuel Sensor Calibration", start: "10:30", end: "11:30", period: "morning" },
    { name: "Quality Assurance", start: "11:30", end: "11:40", period: "morning" },
    { name: "Documentation", start: "11:40", end: "11:50", period: "morning" }
  ],
  lunch: [
    { name: "Lunch Break", start: "12:30", end: "13:30", period: "lunch" }
  ],
  afternoon: [
    { name: "Fuel Sensor Installation", start: "13:30", end: "15:30", period: "afternoon" },
    { name: "System Configuration", start: "13:50", end: "14:20", period: "afternoon" },
    { name: "Fuel Sensor Calibration", start: "15:30", end: "16:30", period: "afternoon" },
    { name: "Quality Assurance", start: "16:30", end: "16:40", period: "afternoon" },
    { name: "Documentation", start: "16:40", end: "16:50", period: "afternoon" }
  ]
}

export function parseTimeToDate(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
}

export function extractVehicleId(taskName: string): string | null {
  const match = taskName.match(/V(\d+)/i)
  return match ? `V${match[1].padStart(3, '0')}` : null
}

export function getTaskType(taskName: string): 'vehicle' | 'task' {
  return taskName.toLowerCase().includes('vehicle') || extractVehicleId(taskName) ? 'vehicle' : 'task'
}

export function getTaskPriority(taskName: string): 'High' | 'Medium' | 'Low' {
  const name = taskName.toLowerCase()
  if (name.includes('inspection') || name.includes('calibration')) return 'High'
  if (name.includes('installation') || name.includes('configuration')) return 'Medium'
  return 'Low'
}

export function getTaskStatus(taskName: string, currentTime: Date, taskStart: Date, taskEnd: Date): 'Pending' | 'In Progress' | 'Completed' | 'Blocked' {
  if (currentTime < taskStart) return 'Pending'
  if (currentTime >= taskStart && currentTime <= taskEnd) return 'In Progress'
  if (currentTime > taskEnd) return 'Completed'
  return 'Pending'
}

export function getTaskColor(taskName: string, status: string): { bg: string, text: string } {
  // Color by status first
  switch (status) {
    case 'Completed': return { bg: '#10B981', text: '#FFFFFF' }
    case 'In Progress': return { bg: '#3B82F6', text: '#FFFFFF' }
    case 'Blocked': return { bg: '#EF4444', text: '#FFFFFF' }
  }

  // Color by task type if pending
  const name = taskName.toLowerCase()
  if (name.includes('vehicle') || name.includes('inspection')) return { bg: '#F59E0B', text: '#1F2937' }
  if (name.includes('gps') || name.includes('installation')) return { bg: '#8B5CF6', text: '#FFFFFF' }
  if (name.includes('fuel') || name.includes('sensor')) return { bg: '#06B6D4', text: '#FFFFFF' }
  if (name.includes('system') || name.includes('configuration')) return { bg: '#84CC16', text: '#1F2937' }
  if (name.includes('quality') || name.includes('documentation')) return { bg: '#F97316', text: '#FFFFFF' }
  if (name.includes('lunch') || name.includes('break')) return { bg: '#6B7280', text: '#FFFFFF' }

  return { bg: '#9CA3AF', text: '#1F2937' }
}

export function getAllHardcodedTasks(): ScheduleTask[] {
  return [
    ...hardcodedTasks.morning,
    ...hardcodedTasks.lunch,
    ...hardcodedTasks.afternoon
  ]
}
