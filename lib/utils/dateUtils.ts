/**
 * Calculate the actual date for a given project day
 */
export function calculateDateForDay(startDate: string, day: number): string {
  const start = new Date(startDate)
  const targetDate = new Date(start)
  targetDate.setDate(start.getDate() + (day - 1))
  return targetDate.toISOString().split('T')[0]
}

/**
 * Get project phase information
 */
export function getProjectPhase(startDate: string) {
  const start = new Date(startDate)
  const today = new Date()
  const projectEnd = new Date(start)
  projectEnd.setDate(start.getDate() + 13) // 14-day project

  const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysSinceStart = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = 14
  const progressPercentage = Math.max(0, Math.min(100, Math.round((daysSinceStart / totalDays) * 100)))

  if (today < start) {
    return {
      phase: 'planning' as const,
      daysUntilStart,
      daysSinceStart: 0,
      progressPercentage: 0,
    }
  } else if (today <= projectEnd) {
    return {
      phase: 'active' as const,
      daysUntilStart: 0,
      daysSinceStart,
      progressPercentage,
    }
  } else {
    return {
      phase: 'completed' as const,
      daysUntilStart: 0,
      daysSinceStart: totalDays,
      progressPercentage: 100,
    }
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options })
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 days")
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = dateObj.getTime() - now.getTime()
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Tomorrow'
  if (diffInDays === -1) return 'Yesterday'
  if (diffInDays > 0) return `In ${diffInDays} days`
  return `${Math.abs(diffInDays)} days ago`
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return dateObj.toDateString() === today.toDateString()
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return dateObj < today
}

/**
 * Get working days between two dates (excluding weekends)
 */
export function getWorkingDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  
  let workingDays = 0
  const current = new Date(start)
  
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return workingDays
}