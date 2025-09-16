/**
 * Task Planning System - Comprehensive Testing & Validation
 * Provides data validation, error handling, and testing utilities
 */

import { Task, Vehicle, TeamMember, TaskWizardState, TaskConflict } from '@/lib/supabase/types';

// Validation error types
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
}

/**
 * Comprehensive task validation
 */
export function validateTask(task: Partial<Task>, context?: {
  vehicles?: Vehicle[];
  teamMembers?: TeamMember[];
  existingTasks?: Task[];
}): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const suggestions: ValidationError[] = [];

  // Required field validation
  if (!task.name || task.name.trim().length === 0) {
    errors.push({
      field: 'name',
      code: 'REQUIRED',
      message: 'Task name is required',
      severity: 'error'
    });
  } else if (task.name.length > 255) {
    errors.push({
      field: 'name',
      code: 'TOO_LONG',
      message: 'Task name must be less than 255 characters',
      severity: 'error'
    });
  }

  if (!task.vehicle_id) {
    errors.push({
      field: 'vehicle_id',
      code: 'REQUIRED',
      message: 'Vehicle assignment is required',
      severity: 'error'
    });
  } else if (context?.vehicles) {
    // Validate vehicle exists
    const vehicleIds = Array.isArray(task.vehicle_id) ? task.vehicle_id : [task.vehicle_id];
    const validVehicleIds = context.vehicles.map(v => v.id);
    const invalidVehicles = vehicleIds.filter(id => !validVehicleIds.includes(id));
    
    if (invalidVehicles.length > 0) {
      errors.push({
        field: 'vehicle_id',
        code: 'INVALID_REFERENCE',
        message: `Invalid vehicle ID(s): ${invalidVehicles.join(', ')}`,
        severity: 'error'
      });
    }
  }

  if (!task.assigned_to) {
    errors.push({
      field: 'assigned_to',
      code: 'REQUIRED',
      message: 'Task assignment is required',
      severity: 'error'
    });
  } else if (context?.teamMembers) {
    // Validate team member exists
    const assignees = Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to];
    const validAssignees = context.teamMembers.map(tm => tm.name);
    const invalidAssignees = assignees.filter(assignee => !validAssignees.includes(assignee));
    
    if (invalidAssignees.length > 0) {
      errors.push({
        field: 'assigned_to',
        code: 'INVALID_REFERENCE',
        message: `Invalid assignee(s): ${invalidAssignees.join(', ')}`,
        severity: 'error'
      });
    }
  }

  // Status validation
  const validStatuses = ['Pending', 'In Progress', 'Completed', 'Blocked', 'Scheduled'];
  if (task.status && !validStatuses.includes(task.status)) {
    errors.push({
      field: 'status',
      code: 'INVALID_VALUE',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      severity: 'error'
    });
  }

  // Priority validation
  const validPriorities = ['High', 'Medium', 'Low'];
  if (task.priority && !validPriorities.includes(task.priority)) {
    errors.push({
      field: 'priority',
      code: 'INVALID_VALUE',
      message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
      severity: 'error'
    });
  }

  // Time validation
  if (task.start_time && task.end_time) {
    const startTime = parseTime(task.start_time);
    const endTime = parseTime(task.end_time);
    
    if (!startTime) {
      errors.push({
        field: 'start_time',
        code: 'INVALID_FORMAT',
        message: 'Invalid start time format. Use HH:MM (24-hour)',
        severity: 'error'
      });
    }
    
    if (!endTime) {
      errors.push({
        field: 'end_time',
        code: 'INVALID_FORMAT',
        message: 'Invalid end time format. Use HH:MM (24-hour)',
        severity: 'error'
      });
    }
    
    if (startTime && endTime && startTime >= endTime) {
      errors.push({
        field: 'time_range',
        code: 'INVALID_RANGE',
        message: 'End time must be after start time',
        severity: 'error'
      });
    }
  }

  // Date validation
  if (task.start_date && task.end_date) {
    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);
    
    if (isNaN(startDate.getTime())) {
      errors.push({
        field: 'start_date',
        code: 'INVALID_FORMAT',
        message: 'Invalid start date format',
        severity: 'error'
      });
    }
    
    if (isNaN(endDate.getTime())) {
      errors.push({
        field: 'end_date',
        code: 'INVALID_FORMAT',
        message: 'Invalid end date format',
        severity: 'error'
      });
    }
    
    if (startDate.getTime() > endDate.getTime()) {
      errors.push({
        field: 'date_range',
        code: 'INVALID_RANGE',
        message: 'End date must be after start date',
        severity: 'error'
      });
    }
  }

  // Duration validation
  if (task.estimated_duration !== undefined) {
    if (typeof task.estimated_duration !== 'number' || task.estimated_duration <= 0) {
      errors.push({
        field: 'estimated_duration',
        code: 'INVALID_VALUE',
        message: 'Estimated duration must be a positive number',
        severity: 'error'
      });
    } else if (task.estimated_duration > 1440) { // More than 24 hours
      warnings.push({
        field: 'estimated_duration',
        code: 'UNUSUAL_VALUE',
        message: 'Task duration exceeds 24 hours. Is this correct?',
        severity: 'warning'
      });
    }
  }

  if (task.actual_duration !== undefined) {
    if (typeof task.actual_duration !== 'number' || task.actual_duration < 0) {
      errors.push({
        field: 'actual_duration',
        code: 'INVALID_VALUE',
        message: 'Actual duration must be a non-negative number',
        severity: 'error'
      });
    }
  }

  // Completion percentage validation
  if (task.completion_percentage !== undefined) {
    if (typeof task.completion_percentage !== 'number' || 
        task.completion_percentage < 0 || 
        task.completion_percentage > 100) {
      errors.push({
        field: 'completion_percentage',
        code: 'INVALID_RANGE',
        message: 'Completion percentage must be between 0 and 100',
        severity: 'error'
      });
    }
    
    // Logical validation with status
    if (task.status === 'Completed' && task.completion_percentage < 100) {
      warnings.push({
        field: 'completion_percentage',
        code: 'INCONSISTENT_STATE',
        message: 'Task is marked as completed but completion percentage is less than 100%',
        severity: 'warning'
      });
    }
    
    if (task.status === 'Pending' && task.completion_percentage > 0) {
      warnings.push({
        field: 'completion_percentage',
        code: 'INCONSISTENT_STATE',
        message: 'Task is pending but has completion progress',
        severity: 'warning'
      });
    }
  }

  // Dependency validation
  if (task.dependencies && task.dependencies.length > 0) {
    if (!Array.isArray(task.dependencies)) {
      errors.push({
        field: 'dependencies',
        code: 'INVALID_TYPE',
        message: 'Dependencies must be an array of task IDs',
        severity: 'error'
      });
    } else if (context?.existingTasks) {
      const existingTaskIds = context.existingTasks.map(t => t.id);
      const invalidDeps = task.dependencies.filter(depId => !existingTaskIds.includes(depId));
      
      if (invalidDeps.length > 0) {
        errors.push({
          field: 'dependencies',
          code: 'INVALID_REFERENCE',
          message: `Invalid dependency task IDs: ${invalidDeps.join(', ')}`,
          severity: 'error'
        });
      }
      
      // Check for circular dependencies
      if (task.id && task.dependencies.includes(task.id)) {
        errors.push({
          field: 'dependencies',
          code: 'CIRCULAR_DEPENDENCY',
          message: 'Task cannot depend on itself',
          severity: 'error'
        });
      }
    }
  }

  // Business logic suggestions
  if (task.priority === 'High' && task.estimated_duration && task.estimated_duration > 480) {
    suggestions.push({
      field: 'task_structure',
      code: 'CONSIDER_BREAKING_DOWN',
      message: 'High priority tasks over 8 hours might benefit from being broken into smaller tasks',
      severity: 'info'
    });
  }

  if (task.status === 'Blocked' && !task.blocked_by?.length && !task.description?.toLowerCase().includes('blocked')) {
    suggestions.push({
      field: 'blocked_reason',
      code: 'MISSING_CONTEXT',
      message: 'Consider adding block reason in description or blocked_by field',
      severity: 'info'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Validate wizard state for step transitions
 */
export function validateWizardState(wizardState: TaskWizardState, step: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const suggestions: ValidationError[] = [];

  switch (step) {
    case 1: // Vehicle Selection
      if (wizardState.selectedVehicles.length === 0) {
        errors.push({
          field: 'selectedVehicles',
          code: 'REQUIRED',
          message: 'At least one vehicle must be selected',
          severity: 'error'
        });
      }
      break;

    case 2: // Template/Custom Tasks
      if (!wizardState.taskTemplate && wizardState.customTasks.length === 0) {
        errors.push({
          field: 'tasks',
          code: 'REQUIRED',
          message: 'Either select a template or create custom tasks',
          severity: 'error'
        });
      }
      
      if (wizardState.customTasks.length > 0) {
        wizardState.customTasks.forEach((task, index) => {
          const taskValidation = validateTask(task);
          taskValidation.errors.forEach(error => {
            errors.push({
              ...error,
              field: `customTasks[${index}].${error.field}`,
              message: `Task ${index + 1}: ${error.message}`
            });
          });
        });
      }
      break;

    case 3: // Schedule Configuration
      if (!wizardState.startDateTime) {
        errors.push({
          field: 'startDateTime',
          code: 'REQUIRED',
          message: 'Start date and time is required',
          severity: 'error'
        });
      } else {
        const startDate = new Date(wizardState.startDateTime);
        if (startDate < new Date()) {
          warnings.push({
            field: 'startDateTime',
            code: 'PAST_DATE',
            message: 'Start date is in the past',
            severity: 'warning'
          });
        }
      }
      
      if (wizardState.workingHours.workDays.length === 0) {
        errors.push({
          field: 'workingDays',
          code: 'REQUIRED',
          message: 'At least one working day must be selected',
          severity: 'error'
        });
      }
      break;

    case 4: // Review & Optimize
      // This step is mainly for conflict resolution, no specific validation
      break;

    case 5: // Final Confirmation
      // All previous validations should pass
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Validate task conflicts and suggest resolutions
 */
export function validateTaskConflicts(tasks: Task[]): {
  conflicts: TaskConflict[];
  suggestions: string[];
} {
  const conflicts: TaskConflict[] = [];
  const suggestions: string[] = [];

  // Time-based conflict detection
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const task1 = tasks[i];
      const task2 = tasks[j];

      // Check vehicle conflicts
      const vehicles1 = Array.isArray(task1.vehicle_id) ? task1.vehicle_id : [task1.vehicle_id];
      const vehicles2 = Array.isArray(task2.vehicle_id) ? task2.vehicle_id : [task2.vehicle_id];
      const hasVehicleOverlap = vehicles1.some(v => vehicles2.includes(v));

      if (hasVehicleOverlap && task1.start_time && task1.end_time && task2.start_time && task2.end_time) {
        const conflict = checkTimeOverlap(task1, task2);
        if (conflict) {
          conflicts.push({
            id: `time-conflict-${i}-${j}`,
            type: 'time',
            severity: 'high',
            description: `Time conflict between "${task1.name}" and "${task2.name}" on vehicle ${vehicles1.find(v => vehicles2.includes(v))}`,
            conflicting_tasks: [task1.id, task2.id],
            auto_resolvable: true,
            suggested_resolution: {
              action: 'reschedule',
              details: {
                taskToAdjust: task2.id,
                newStartTime: task1.end_time
              }
            }
          });
        }
      }

      // Check resource conflicts
      const assignees1 = Array.isArray(task1.assigned_to) ? task1.assigned_to : [task1.assigned_to];
      const assignees2 = Array.isArray(task2.assigned_to) ? task2.assigned_to : [task2.assigned_to];
      const hasAssigneeOverlap = assignees1.some(a => assignees2.includes(a));

      if (hasAssigneeOverlap && task1.start_time && task1.end_time && task2.start_time && task2.end_time) {
        const conflict = checkTimeOverlap(task1, task2);
        if (conflict) {
          conflicts.push({
            id: `resource-conflict-${i}-${j}`,
            type: 'resource',
            severity: 'medium',
            description: `Resource conflict: "${assignees1.find(a => assignees2.includes(a))}" assigned to overlapping tasks`,
            conflicting_tasks: [task1.id, task2.id],
            auto_resolvable: true,
            suggested_resolution: {
              action: 'reassign',
              details: {
                taskToReassign: task2.id
              }
            }
          });
        }
      }
    }
  }

  // Dependency validation
  tasks.forEach(task => {
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach(depId => {
        const dependency = tasks.find(t => t.id === depId);
        if (!dependency) {
          conflicts.push({
            id: `missing-dependency-${task.id}-${depId}`,
            type: 'dependency',
            severity: 'critical',
            description: `Task "${task.name}" depends on missing task ${depId}`,
            conflicting_tasks: [task.id],
            auto_resolvable: false
          });
        } else if (task.start_date && dependency.end_date && task.start_date <= dependency.end_date) {
          conflicts.push({
            id: `dependency-timing-${task.id}-${depId}`,
            type: 'dependency',
            severity: 'high',
            description: `Task "${task.name}" scheduled before dependency "${dependency.name}" completes`,
            conflicting_tasks: [task.id, depId],
            auto_resolvable: true,
            suggested_resolution: {
              action: 'reschedule',
              details: {
                taskToAdjust: task.id,
                newStartDate: dependency.end_date
              }
            }
          });
        }
      });
    }
  });

  // Generate optimization suggestions
  if (conflicts.length === 0) {
    suggestions.push('✅ No conflicts detected. Your schedule is optimized!');
  } else {
    const autoResolvable = conflicts.filter(c => c.auto_resolvable).length;
    if (autoResolvable > 0) {
      suggestions.push(`🔧 ${autoResolvable} conflict(s) can be automatically resolved`);
    }
    
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length;
    if (criticalConflicts > 0) {
      suggestions.push(`⚠️ ${criticalConflicts} critical conflict(s) require manual attention`);
    }
  }

  return { conflicts, suggestions };
}

/**
 * Performance testing utilities
 */
export class TaskPlanningPerformanceMonitor {
  private metrics: Record<string, { start: number; end?: number; duration?: number }> = {};

  startTimer(operation: string): void {
    this.metrics[operation] = {
      start: performance.now()
    };
  }

  endTimer(operation: string): number {
    if (!this.metrics[operation]) {
      console.warn(`Timer for operation "${operation}" was not started`);
      return 0;
    }

    const end = performance.now();
    const duration = end - this.metrics[operation].start;
    
    this.metrics[operation].end = end;
    this.metrics[operation].duration = duration;

    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${operation}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getMetrics(): Record<string, { duration: number }> {
    const results: Record<string, { duration: number }> = {};
    
    Object.entries(this.metrics).forEach(([operation, data]) => {
      if (data.duration !== undefined) {
        results[operation] = { duration: data.duration };
      }
    });

    return results;
  }

  reset(): void {
    this.metrics = {};
  }
}

/**
 * Data integrity checker for production
 */
export function runDataIntegrityTests(data: {
  tasks: Task[];
  vehicles: Vehicle[];
  teamMembers: TeamMember[];
}): {
  passed: number;
  failed: number;
  issues: string[];
} {
  const issues: string[] = [];
  let passed = 0;
  let failed = 0;
  
  // If no data to test, consider it as passed with no issues
  if (data.tasks.length === 0 && data.vehicles.length === 0 && data.teamMembers.length === 0) {
    return { passed: 1, failed: 0, issues: [] };
  }

  // Test 1: All tasks have valid vehicle references (skip if no tasks)
  if (data.tasks.length > 0) {
    const vehicleIds = new Set(data.vehicles.map(v => v.id));
    const invalidVehicleRefs = data.tasks.filter(task => {
      const vehicleId = Array.isArray(task.vehicle_id) ? task.vehicle_id[0] : task.vehicle_id;
      return vehicleId && !vehicleIds.has(vehicleId);
    });

    if (invalidVehicleRefs.length === 0) {
      passed++;
    } else {
      failed++;
      issues.push(`${invalidVehicleRefs.length} tasks have invalid vehicle references`);
    }
  } else {
    // No tasks to test, consider passed
    passed++;
  }

  // Test 2: All tasks have valid assignee references (skip if no tasks)
  if (data.tasks.length > 0) {
    const assigneeNames = new Set(data.teamMembers.map(tm => tm.name));
    const invalidAssigneeRefs = data.tasks.filter(task => {
      const assignee = Array.isArray(task.assigned_to) ? task.assigned_to[0] : task.assigned_to;
      return assignee && !assigneeNames.has(assignee);
    });

    if (invalidAssigneeRefs.length === 0) {
      passed++;
    } else {
      failed++;
      issues.push(`${invalidAssigneeRefs.length} tasks have invalid assignee references`);
    }
  } else {
    // No tasks to test, consider passed
    passed++;
  }

  // Test 3: No duplicate task IDs (skip if no tasks)
  if (data.tasks.length > 0) {
    const taskIds = data.tasks.map(t => t.id);
    const uniqueTaskIds = new Set(taskIds);
    
    if (taskIds.length === uniqueTaskIds.size) {
      passed++;
    } else {
      failed++;
      issues.push(`${taskIds.length - uniqueTaskIds.size} duplicate task IDs found`);
    }
  } else {
    // No tasks to test, consider passed
    passed++;
  }

  // Test 4: Task time ranges are valid (skip if no tasks)
  if (data.tasks.length > 0) {
    const invalidTimeRanges = data.tasks.filter(task => {
      if (task.start_time && task.end_time) {
        const start = parseTime(task.start_time);
        const end = parseTime(task.end_time);
        return start && end && start >= end;
      }
      return false;
    });

    if (invalidTimeRanges.length === 0) {
      passed++;
    } else {
      failed++;
      issues.push(`${invalidTimeRanges.length} tasks have invalid time ranges`);
    }
  } else {
    // No tasks to test, consider passed
    passed++;
  }

  return { passed, failed, issues };
}

// Utility functions
function parseTime(timeStr: string): Date | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  
  const date = new Date(2000, 0, 1, hours, minutes);
  return date;
}

function checkTimeOverlap(task1: Task, task2: Task): boolean {
  if (!task1.start_time || !task1.end_time || !task2.start_time || !task2.end_time) {
    return false;
  }

  const start1 = parseTime(task1.start_time);
  const end1 = parseTime(task1.end_time);
  const start2 = parseTime(task2.start_time);
  const end2 = parseTime(task2.end_time);

  if (!start1 || !end1 || !start2 || !end2) {
    return false;
  }

  return (start1 < end2) && (start2 < end1);
}

// Export performance monitor instance
export const performanceMonitor = new TaskPlanningPerformanceMonitor();
