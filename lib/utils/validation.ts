import { Task, TeamMember, Vehicle, Location } from '@/lib/supabase/types';

// Generic validation result type
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  issues: string[];
};

// Validation error class
export class ValidationError extends Error {
  public issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

// Helper functions
const isString = (value: any): value is string => typeof value === 'string';
const isNumber = (value: any): value is number => typeof value === 'number' && !isNaN(value);
const isBoolean = (value: any): value is boolean => typeof value === 'boolean';
const isDate = (value: any): value is string => {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};
const isArray = (value: any): value is any[] => Array.isArray(value);

// Task validation schema
export const validateTask = (data: any): ValidationResult<Task> => {
  const issues: string[] = [];

  // Required fields
  if (!isString(data?.id) || data.id.trim() === '') {
    issues.push('Task ID is required and must be a non-empty string');
  }

  if (!isString(data?.name) || data.name.trim() === '') {
    issues.push('Task name is required and must be a non-empty string');
  }

  if (!isString(data?.vehicle_id) || data.vehicle_id.trim() === '') {
    issues.push('Vehicle ID is required and must be a non-empty string');
  }

  if (!isString(data?.assigned_to) || data.assigned_to.trim() === '') {
    issues.push('Assigned to is required and must be a non-empty string');
  }

  // Status validation
  const validStatuses = ['Pending', 'In Progress', 'Completed', 'Blocked'];
  if (!isString(data?.status) || !validStatuses.includes(data.status)) {
    issues.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Priority validation
  const validPriorities = ['High', 'Medium', 'Low'];
  if (!isString(data?.priority) || !validPriorities.includes(data.priority)) {
    issues.push(`Priority must be one of: ${validPriorities.join(', ')}`);
  }

  // Optional fields validation
  if (data?.description !== undefined && !isString(data.description)) {
    issues.push('Description must be a string if provided');
  }

  if (data?.estimated_duration !== undefined && !isNumber(data.estimated_duration)) {
    issues.push('Estimated duration must be a number if provided');
  }

  if (data?.start_date !== undefined && !isDate(data.start_date)) {
    issues.push('Start date must be a valid date string if provided');
  }

  if (data?.end_date !== undefined && !isDate(data.end_date)) {
    issues.push('End date must be a valid date string if provided');
  }

  if (data?.tags !== undefined && !isArray(data.tags)) {
    issues.push('Tags must be an array if provided');
  } else if (data?.tags && !data.tags.every((tag: any) => isString(tag))) {
    issues.push('All tags must be strings');
  }

  if (data?.notes !== undefined && !isString(data.notes)) {
    issues.push('Notes must be a string if provided');
  }

  // Date validation
  if (!isDate(data?.created_at)) {
    issues.push('Created at must be a valid date string');
  }

  if (!isDate(data?.updated_at)) {
    issues.push('Updated at must be a valid date string');
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: `Task validation failed: ${issues.length} issue(s) found`,
      issues
    };
  }

  // Return validated data with proper typing
  return {
    success: true,
    data: {
      id: data.id,
      name: data.name,
      description: data.description || null,
      vehicle_id: data.vehicle_id,
      assigned_to: data.assigned_to,
      status: data.status,
      priority: data.priority,
      estimated_duration: data.estimated_duration || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      tags: data.tags || null,
      notes: data.notes || null,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as Task
  };
};

// Team Member validation schema
export const validateTeamMember = (data: any): ValidationResult<TeamMember> => {
  const issues: string[] = [];

  // Required fields
  if (!isString(data?.id) || data.id.trim() === '') {
    issues.push('Team member ID is required and must be a non-empty string');
  }

  if (!isString(data?.name) || data.name.trim() === '') {
    issues.push('Team member name is required and must be a non-empty string');
  }

  if (!isString(data?.role) || data.role.trim() === '') {
    issues.push('Team member role is required and must be a non-empty string');
  }

  // Specializations validation
  if (!isArray(data?.specializations)) {
    issues.push('Specializations must be an array');
  } else if (!data.specializations.every((spec: any) => isString(spec))) {
    issues.push('All specializations must be strings');
  }

  // Performance metrics validation
  if (!isNumber(data?.completion_rate) || data.completion_rate < 0 || data.completion_rate > 100) {
    issues.push('Completion rate must be a number between 0 and 100');
  }

  if (!isNumber(data?.quality_score) || data.quality_score < 0 || data.quality_score > 100) {
    issues.push('Quality score must be a number between 0 and 100');
  }

  if (!isNumber(data?.average_task_time) || data.average_task_time < 0) {
    issues.push('Average task time must be a non-negative number');
  }

  // Date validation
  if (!isDate(data?.created_at)) {
    issues.push('Created at must be a valid date string');
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: `Team member validation failed: ${issues.length} issue(s) found`,
      issues
    };
  }

  return {
    success: true,
    data: {
      id: data.id,
      name: data.name,
      role: data.role,
      specializations: data.specializations,
      completion_rate: data.completion_rate,
      quality_score: data.quality_score,
      average_task_time: data.average_task_time,
      created_at: data.created_at
    } as TeamMember
  };
};

// Vehicle validation schema
export const validateVehicle = (data: any): ValidationResult<Vehicle> => {
  const issues: string[] = [];

  // Required fields
  if (!isString(data?.id) || data.id.trim() === '') {
    issues.push('Vehicle ID is required and must be a non-empty string');
  }

  if (!isString(data?.type) || data.type.trim() === '') {
    issues.push('Vehicle type is required and must be a non-empty string');
  }

  if (!isString(data?.location) || data.location.trim() === '') {
    issues.push('Vehicle location is required and must be a non-empty string');
  }

  // Status validation
  const validStatuses = ['Pending', 'In Progress', 'Completed', 'Blocked'];
  if (!isString(data?.status) || !validStatuses.includes(data.status)) {
    issues.push(`Vehicle status must be one of: ${validStatuses.join(', ')}`);
  }

  // Optional number fields
  if (data?.day !== undefined && !isNumber(data.day)) {
    issues.push('Day must be a number if provided');
  }

  if (data?.installation_progress !== undefined && 
      (!isNumber(data.installation_progress) || data.installation_progress < 0 || data.installation_progress > 100)) {
    issues.push('Installation progress must be a number between 0 and 100 if provided');
  }

  // Date validation
  if (data?.scheduled_date !== undefined && !isDate(data.scheduled_date)) {
    issues.push('Scheduled date must be a valid date string if provided');
  }

  if (data?.completion_date !== undefined && !isDate(data.completion_date)) {
    issues.push('Completion date must be a valid date string if provided');
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: `Vehicle validation failed: ${issues.length} issue(s) found`,
      issues
    };
  }

  return {
    success: true,
    data: data as Vehicle
  };
};

// Location validation schema
export const validateLocation = (data: any): ValidationResult<Location> => {
  const issues: string[] = [];

  // Required fields
  if (!isString(data?.name) || data.name.trim() === '') {
    issues.push('Location name is required and must be a non-empty string');
  }

  if (!isNumber(data?.total_vehicles) || data.total_vehicles < 0) {
    issues.push('Total vehicles must be a non-negative number');
  }

  if (!isNumber(data?.gps_devices) || data.gps_devices < 0) {
    issues.push('GPS devices must be a non-negative number');
  }

  if (!isNumber(data?.fuel_sensors) || data.fuel_sensors < 0) {
    issues.push('Fuel sensors must be a non-negative number');
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: `Location validation failed: ${issues.length} issue(s) found`,
      issues
    };
  }

  return {
    success: true,
    data: data as Location
  };
};

// Form validation helper
export const validateFormData = <T>(
  data: any,
  validator: (data: any) => ValidationResult<T>
): T => {
  const result = validator(data);
  
  if (!result.success) {
    throw new ValidationError(result.error, result.issues);
  }
  
  return result.data;
};

// Array validation helper
export const validateArray = <T>(
  data: any[],
  validator: (item: any) => ValidationResult<T>
): ValidationResult<T[]> => {
  const issues: string[] = [];
  const validatedItems: T[] = [];

  data.forEach((item, index) => {
    const result = validator(item);
    if (result.success) {
      validatedItems.push(result.data);
    } else {
      issues.push(`Item at index ${index}: ${result.error}`);
    }
  });

  if (issues.length > 0) {
    return {
      success: false,
      error: `Array validation failed: ${issues.length} issue(s) found`,
      issues
    };
  }

  return {
    success: true,
    data: validatedItems
  };
};

// Runtime type guards
export const isTask = (data: any): data is Task => {
  return validateTask(data).success;
};

export const isTeamMember = (data: any): data is TeamMember => {
  return validateTeamMember(data).success;
};

export const isVehicle = (data: any): data is Vehicle => {
  return validateVehicle(data).success;
};

export const isLocation = (data: any): data is Location => {
  return validateLocation(data).success;
};

// Sanitization helpers
export const sanitizeString = (value: any): string => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>\"']/g, ''); // Basic XSS protection
};

export const sanitizeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

export const sanitizeArray = (value: any): any[] => {
  return Array.isArray(value) ? value : [];
};
