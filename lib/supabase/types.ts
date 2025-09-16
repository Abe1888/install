export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: Vehicle
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Vehicle, 'id'>>
      }
      locations: {
        Row: Location
        Insert: Omit<Location, 'created_at'>
        Update: Partial<Location>
      }
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'created_at'>
        Update: Partial<TeamMember>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id'>>
      }
      project_settings: {
        Row: ProjectSettings
        Insert: Omit<ProjectSettings, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProjectSettings, 'id'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'>
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Vehicle {
  id: string
  type: string
  location: string
  day: number
  time_slot: string
  status: 'Pending' | 'In Progress' | 'Completed' // Removed 'Blocked' to match DB constraint
  gps_required: number // Changed from boolean to number to match DB
  fuel_sensors: number
  fuel_tanks: number // Added this field that was missing
  created_at?: string
  updated_at?: string
}

export interface Location {
  name: string
  vehicles: number
  gps_devices: number
  fuel_sensors: number
  created_at?: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  specializations: string[]
  completion_rate: number
  average_task_time: number
  quality_score: number
  created_at?: string
}

export interface Task {
  id: string
  vehicle_id: string | string[] // Support multiple vehicles
  name: string
  description?: string
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked' | 'Scheduled'
  assigned_to: string | string[] // Support multiple assignees
  priority: 'High' | 'Medium' | 'Low'
  estimated_duration?: number // Duration in minutes
  actual_duration?: number // Actual time taken
  start_time?: string  // Format: HH:MM (24-hour)
  end_time?: string    // Format: HH:MM (24-hour)
  start_date?: string  // Format: YYYY-MM-DD
  end_date?: string    // Format: YYYY-MM-DD
  duration_days?: number
  notes?: string
  tags?: string[]
  // Advanced scheduling features
  dependencies?: string[] // Task IDs that must complete before this task
  blocked_by?: string[] // Task IDs that block this task
  recurrence_pattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom'
    interval: number
    end_date?: string
    days_of_week?: number[]
  }
  location_id?: string
  resource_requirements?: {
    equipment?: string[]
    skills?: string[]
    team_size?: number
  }
  // Workflow and automation
  template_id?: string
  parent_task_id?: string
  is_milestone?: boolean
  completion_percentage?: number
  // Real-time tracking
  last_updated_by?: string
  version?: number
  is_template?: boolean
  created_at?: string
  updated_at?: string
}

export interface ProjectSettings {
  id: string
  project_start_date: string
  project_end_date?: string
  total_days?: number
  created_at?: string
  updated_at?: string
}

export interface Comment {
  id: string
  task_id: string
  text: string
  author: string
  created_at: string
}

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  tasks: Partial<Task>[]
  category: 'installation' | 'maintenance' | 'inspection' | 'custom'
  estimated_total_duration: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskWizardState {
  step: number
  selectedVehicles: string[]
  taskTemplate?: TaskTemplate
  customTasks: Partial<Task>[]
  schedulingMode: 'sequential' | 'parallel' | 'custom'
  startDateTime: string
  workingHours: {
    start: string // HH:MM
    end: string   // HH:MM
    workDays: number[] // 0-6 (Sunday-Saturday)
  }
  assignmentStrategy: 'auto' | 'manual' | 'load-balance'
  conflictResolution: 'skip' | 'adjust' | 'ask'
  notifications: {
    enabled: boolean
    channels: ('email' | 'sms' | 'push')[]
    timing: number[] // minutes before task start
  }
}

export interface TaskConflict {
  id: string
  type: 'resource' | 'time' | 'dependency' | 'vehicle'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  conflicting_tasks: string[]
  suggested_resolution?: {
    action: 'reschedule' | 'reassign' | 'split' | 'cancel'
    details: any
  }
  auto_resolvable: boolean
}

export interface TaskMetrics {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  blocked_tasks: number
  overdue_tasks: number
  average_completion_time: number
  efficiency_score: number
  resource_utilization: number
}
