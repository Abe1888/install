'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Task, TaskWizardState, TaskConflict, TaskTemplate, Vehicle, TeamMember } from '@/lib/supabase/types';
import { useVehicles, useTeamMembers, useTasks } from './useUnifiedData';

// Task Planning Hook
export function useTaskPlanning() {
  const [wizardState, setWizardState] = useState<TaskWizardState>({
    step: 1,
    selectedVehicles: [],
    customTasks: [],
    schedulingMode: 'sequential',
    startDateTime: new Date().toISOString(),
    workingHours: {
      start: '08:00',
      end: '17:00',
      workDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    assignmentStrategy: 'auto',
    conflictResolution: 'adjust',
    notifications: {
      enabled: true,
      channels: ['email'],
      timing: [15, 60] // 15 mins and 1 hour before
    }
  });

  const [conflicts, setConflicts] = useState<TaskConflict[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data hooks
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles(true);
  const { data: teamMembers = [], isLoading: teamMembersLoading } = useTeamMembers(true);
  const { data: existingTasks = [], mutate: mutateTasks } = useTasks(undefined, true);

  // Wizard navigation
  const nextStep = useCallback(() => {
    setWizardState(prev => ({ ...prev, step: Math.min(prev.step + 1, 5) }));
  }, []);

  const previousStep = useCallback(() => {
    setWizardState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  const updateWizardState = useCallback((updates: Partial<TaskWizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  }, []);

  // Vehicle selection
  const selectVehicle = useCallback((vehicleId: string) => {
    setWizardState(prev => ({
      ...prev,
      selectedVehicles: prev.selectedVehicles.includes(vehicleId)
        ? prev.selectedVehicles.filter(id => id !== vehicleId)
        : [...prev.selectedVehicles, vehicleId]
    }));
  }, []);

  const selectAllVehicles = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      selectedVehicles: vehicles.map(v => v.id)
    }));
  }, [vehicles]);

  const clearVehicleSelection = useCallback(() => {
    setWizardState(prev => ({ ...prev, selectedVehicles: [] }));
  }, []);

  // Task management
  const addCustomTask = useCallback((task: Partial<Task>) => {
    setWizardState(prev => ({
      ...prev,
      customTasks: [...prev.customTasks, { ...task, id: `temp-${Date.now()}` }]
    }));
  }, []);

  const removeCustomTask = useCallback((taskId: string) => {
    setWizardState(prev => ({
      ...prev,
      customTasks: prev.customTasks.filter(t => t.id !== taskId)
    }));
  }, []);

  const updateCustomTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setWizardState(prev => ({
      ...prev,
      customTasks: prev.customTasks.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      )
    }));
  }, []);

  // Conflict detection
  const analyzeConflicts = useCallback(async () => {
    setIsAnalyzing(true);
    setConflicts([]);

    try {
      const tasksToAnalyze = [
        ...wizardState.customTasks,
        ...(wizardState.taskTemplate?.tasks || [])
      ];

      const detectedConflicts: TaskConflict[] = [];

      // Time conflict detection
      for (let i = 0; i < tasksToAnalyze.length; i++) {
        for (let j = i + 1; j < tasksToAnalyze.length; j++) {
          const task1 = tasksToAnalyze[i];
          const task2 = tasksToAnalyze[j];

          // Check for vehicle conflicts
          const vehicles1 = Array.isArray(task1.vehicle_id) ? task1.vehicle_id : [task1.vehicle_id];
          const vehicles2 = Array.isArray(task2.vehicle_id) ? task2.vehicle_id : [task2.vehicle_id];
          const vehicleOverlap = vehicles1.some(v => vehicles2.includes(v));

          if (vehicleOverlap && task1.start_time && task1.end_time && task2.start_time && task2.end_time) {
            const start1 = new Date(`2000-01-01T${task1.start_time}`);
            const end1 = new Date(`2000-01-01T${task1.end_time}`);
            const start2 = new Date(`2000-01-01T${task2.start_time}`);
            const end2 = new Date(`2000-01-01T${task2.end_time}`);

            if ((start1 <= start2 && start2 < end1) || (start2 <= start1 && start1 < end2)) {
              detectedConflicts.push({
                id: `conflict-${Date.now()}-${i}-${j}`,
                type: 'time',
                severity: 'high',
                description: `Time conflict between "${task1.name}" and "${task2.name}" on the same vehicle`,
                conflicting_tasks: [task1.id!, task2.id!],
                auto_resolvable: true,
                suggested_resolution: {
                  action: 'reschedule',
                  details: { adjustTask: task2.id, newStartTime: task1.end_time }
                }
              });
            }
          }

          // Check for resource conflicts
          const assignees1 = Array.isArray(task1.assigned_to) ? task1.assigned_to : [task1.assigned_to];
          const assignees2 = Array.isArray(task2.assigned_to) ? task2.assigned_to : [task2.assigned_to];
          const assigneeOverlap = assignees1.some(a => assignees2.includes(a));

          if (assigneeOverlap && task1.start_time && task1.end_time && task2.start_time && task2.end_time) {
            const start1 = new Date(`2000-01-01T${task1.start_time}`);
            const end1 = new Date(`2000-01-01T${task1.end_time}`);
            const start2 = new Date(`2000-01-01T${task2.start_time}`);
            const end2 = new Date(`2000-01-01T${task2.end_time}`);

            if ((start1 <= start2 && start2 < end1) || (start2 <= start1 && start1 < end2)) {
              detectedConflicts.push({
                id: `conflict-resource-${Date.now()}-${i}-${j}`,
                type: 'resource',
                severity: 'medium',
                description: `Resource conflict: Same team member assigned to overlapping tasks`,
                conflicting_tasks: [task1.id!, task2.id!],
                auto_resolvable: true,
                suggested_resolution: {
                  action: 'reassign',
                  details: { task: task2.id, findAlternativeAssignee: true }
                }
              });
            }
          }
        }
      }

      setConflicts(detectedConflicts);
    } catch (error) {
      console.error('Failed to analyze conflicts:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [wizardState.customTasks, wizardState.taskTemplate]);

  // Auto-resolve conflicts
  const resolveConflicts = useCallback(async (conflictsToResolve: TaskConflict[]) => {
    for (const conflict of conflictsToResolve) {
      if (!conflict.auto_resolvable || !conflict.suggested_resolution) continue;

      const { action, details } = conflict.suggested_resolution;

      switch (action) {
        case 'reschedule':
          if (details.adjustTask && details.newStartTime) {
            updateCustomTask(details.adjustTask, { 
              start_time: details.newStartTime,
              end_time: addMinutesToTime(details.newStartTime, 60) // Assume 1 hour default
            });
          }
          break;
        case 'reassign':
          if (details.task && details.findAlternativeAssignee) {
            // Find available team member
            const availableMembers = teamMembers.filter(member => 
              !wizardState.customTasks.some(task => 
                task.id !== details.task && 
                (Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to]).includes(member.name)
              )
            );
            if (availableMembers.length > 0) {
              updateCustomTask(details.task, { assigned_to: availableMembers[0].name });
            }
          }
          break;
      }
    }

    // Remove resolved conflicts
    setConflicts(prev => prev.filter(c => !conflictsToResolve.includes(c)));
  }, [wizardState.customTasks, teamMembers, updateCustomTask]);

  // Task scheduling optimization
  const optimizeSchedule = useCallback(() => {
    const { schedulingMode, startDateTime, workingHours, selectedVehicles } = wizardState;
    const tasksToSchedule = [...wizardState.customTasks, ...(wizardState.taskTemplate?.tasks || [])];

    if (tasksToSchedule.length === 0) return;

    const startDate = new Date(startDateTime);
    let currentTime = new Date(startDate);
    
    // Set to working hours start
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const optimizedTasks = tasksToSchedule.map(task => {
      if (schedulingMode === 'sequential') {
        // Schedule tasks one after another
        const duration = task.estimated_duration || 60;
        const endTime = new Date(currentTime.getTime() + duration * 60000);

        // Check if task extends beyond working hours
        const [endHour, endMinute] = workingHours.end.split(':').map(Number);
        const workEndTime = new Date(currentTime);
        workEndTime.setHours(endHour, endMinute, 0, 0);

        if (endTime > workEndTime) {
          // Move to next working day
          currentTime.setDate(currentTime.getDate() + 1);
          currentTime.setHours(startHour, startMinute, 0, 0);
          endTime.setTime(currentTime.getTime() + duration * 60000);
        }

        const scheduledTask = {
          ...task,
          start_date: currentTime.toISOString().split('T')[0],
          start_time: currentTime.toTimeString().substring(0, 5),
          end_time: endTime.toTimeString().substring(0, 5),
          vehicle_id: selectedVehicles[0] || task.vehicle_id // Assign to first selected vehicle
        };

        currentTime = endTime;
        return scheduledTask;
      } else if (schedulingMode === 'parallel') {
        // Schedule all tasks to start at the same time on different vehicles
        const duration = task.estimated_duration || 60;
        const endTime = new Date(currentTime.getTime() + duration * 60000);
        
        return {
          ...task,
          start_date: currentTime.toISOString().split('T')[0],
          start_time: currentTime.toTimeString().substring(0, 5),
          end_time: endTime.toTimeString().substring(0, 5),
          vehicle_id: selectedVehicles[tasksToSchedule.indexOf(task) % selectedVehicles.length] || task.vehicle_id
        };
      }

      return task;
    });

    setWizardState(prev => ({ ...prev, customTasks: optimizedTasks }));
  }, [wizardState]);

  // Save tasks to database
  const saveTasks = useCallback(async () => {
    setIsSaving(true);

    try {
      const tasksToSave = [
        ...wizardState.customTasks,
        ...(wizardState.taskTemplate?.tasks || [])
      ].map(task => ({
        ...task,
        id: task.id?.startsWith('temp-') ? undefined : task.id, // Remove temp IDs
        status: task.status || 'Scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      for (const task of tasksToSave) {
        const { error } = await supabase
          .from('tasks')
          .insert([task]);

        if (error) throw error;
      }

      // Refresh tasks data
      await mutateTasks();

      // Reset wizard state
      setWizardState({
        step: 1,
        selectedVehicles: [],
        customTasks: [],
        schedulingMode: 'sequential',
        startDateTime: new Date().toISOString(),
        workingHours: {
          start: '08:00',
          end: '17:00',
          workDays: [1, 2, 3, 4, 5]
        },
        assignmentStrategy: 'auto',
        conflictResolution: 'adjust',
        notifications: {
          enabled: true,
          channels: ['email'],
          timing: [15, 60]
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to save tasks:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  }, [wizardState, mutateTasks]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const tasks = wizardState.customTasks;
    const totalDuration = tasks.reduce((sum, task) => sum + (task.estimated_duration || 0), 0);
    const vehicleCount = wizardState.selectedVehicles.length;
    const taskCount = tasks.length;

    return {
      totalTasks: taskCount,
      totalDuration,
      averageDurationPerTask: taskCount > 0 ? totalDuration / taskCount : 0,
      estimatedCompletionDate: calculateCompletionDate(wizardState),
      resourceUtilization: calculateResourceUtilization(tasks, teamMembers),
      conflictCount: conflicts.length,
      criticalConflicts: conflicts.filter(c => c.severity === 'critical').length
    };
  }, [wizardState, conflicts, teamMembers]);

  return {
    // State
    wizardState,
    conflicts,
    metrics,
    isAnalyzing,
    isSaving,
    isLoading: vehiclesLoading || teamMembersLoading,

    // Navigation
    nextStep,
    previousStep,
    updateWizardState,

    // Vehicle selection
    selectVehicle,
    selectAllVehicles,
    clearVehicleSelection,

    // Task management
    addCustomTask,
    removeCustomTask,
    updateCustomTask,

    // Conflict management
    analyzeConflicts,
    resolveConflicts,

    // Scheduling
    optimizeSchedule,
    saveTasks,

    // Data
    vehicles,
    teamMembers,
    existingTasks
  };
}

// Utility functions
function addMinutesToTime(timeString: string, minutes: number): string {
  const [hours, mins] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  return date.toTimeString().substring(0, 5);
}

function calculateCompletionDate(wizardState: TaskWizardState): string {
  const tasks = wizardState.customTasks;
  if (tasks.length === 0) return '';

  const totalDuration = tasks.reduce((sum, task) => sum + (task.estimated_duration || 0), 0);
  const workingHoursPerDay = 8; // Assume 8-hour work day
  const workingDays = Math.ceil(totalDuration / (workingHoursPerDay * 60));
  
  const startDate = new Date(wizardState.startDateTime);
  startDate.setDate(startDate.getDate() + workingDays);
  
  return startDate.toISOString().split('T')[0];
}

function calculateResourceUtilization(tasks: Partial<Task>[], teamMembers: TeamMember[]): number {
  if (teamMembers.length === 0) return 0;

  const assignedMembers = new Set<string>();
  tasks.forEach(task => {
    if (task.assigned_to) {
      if (Array.isArray(task.assigned_to)) {
        task.assigned_to.forEach(member => assignedMembers.add(member));
      } else {
        assignedMembers.add(task.assigned_to);
      }
    }
  });

  return (assignedMembers.size / teamMembers.length) * 100;
}

// Task Templates Hook
export function useTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      // For now, return predefined templates
      // In production, this would fetch from database
      const predefinedTemplates: TaskTemplate[] = [
        {
          id: 'gps-installation',
          name: 'Standard GPS Installation',
          description: 'Complete GPS tracking system installation workflow',
          category: 'installation',
          estimated_total_duration: 240, // 4 hours
          is_active: true,
          created_by: 'System',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tasks: [
            {
              name: 'Vehicle Inspection',
              description: 'Pre-installation vehicle assessment',
              priority: 'High',
              estimated_duration: 30,
              tags: ['inspection', 'pre-installation']
            },
            {
              name: 'GPS Device Installation',
              description: 'Install and mount GPS tracking device',
              priority: 'High',
              estimated_duration: 60,
              tags: ['gps', 'installation', 'hardware']
            },
            {
              name: 'Fuel Sensor Installation',
              description: 'Install fuel level monitoring sensors',
              priority: 'High',
              estimated_duration: 90,
              tags: ['fuel-sensor', 'installation', 'hardware']
            },
            {
              name: 'System Configuration',
              description: 'Configure GPS and sensor settings',
              priority: 'High',
              estimated_duration: 45,
              tags: ['configuration', 'software']
            },
            {
              name: 'Quality Assurance Testing',
              description: 'Test all installed systems',
              priority: 'Medium',
              estimated_duration: 30,
              tags: ['qa', 'testing', 'validation']
            }
          ]
        },
        {
          id: 'maintenance-check',
          name: 'Maintenance Check',
          description: 'Routine maintenance and system verification',
          category: 'maintenance',
          estimated_total_duration: 120, // 2 hours
          is_active: true,
          created_by: 'System',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tasks: [
            {
              name: 'System Health Check',
              description: 'Verify GPS and sensor functionality',
              priority: 'High',
              estimated_duration: 45,
              tags: ['health-check', 'verification']
            },
            {
              name: 'Calibration Check',
              description: 'Verify and adjust sensor calibration',
              priority: 'Medium',
              estimated_duration: 45,
              tags: ['calibration', 'sensors']
            },
            {
              name: 'Documentation Update',
              description: 'Update maintenance records',
              priority: 'Low',
              estimated_duration: 30,
              tags: ['documentation', 'records']
            }
          ]
        }
      ];

      setTemplates(predefinedTemplates);
    } catch (error) {
      console.error('Failed to load task templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const createTemplate = useCallback(async (template: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTemplate: TaskTemplate = {
        ...template,
        id: `custom-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTemplates(prev => [...prev, newTemplate]);
      return { success: true, template: newTemplate };
    } catch (error) {
      console.error('Failed to create template:', error);
      return { success: false, error };
    }
  }, []);

  return {
    templates,
    isLoading,
    loadTemplates,
    createTemplate
  };
}
