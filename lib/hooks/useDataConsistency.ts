'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { mutate } from 'swr';
import { supabase } from '@/lib/supabase/client';
import { Task, Vehicle, TeamMember, Location } from '@/lib/supabase/types';
import { deduplicateTasks } from '@/lib/utils/dataDeduplication';
import { validateTaskConflicts, runDataIntegrityTests } from '@/lib/utils/taskValidation';

/**
 * Central data consistency manager for real-time updates
 * Ensures all user-facing pages reflect the same data state
 */
export function useDataConsistency() {
  // Global data refresh function
  const refreshAllData = useCallback(() => {
    // Trigger SWR revalidation for all cached data
    mutate('vehicles-unified');
    mutate('locations-unified');
    mutate('team_members-unified');
    mutate('tasks-unified');
    
    // Also refresh related computed data
    mutate((key) => typeof key === 'string' && key.includes('schedule'));
    mutate((key) => typeof key === 'string' && key.includes('timeline'));
    mutate((key) => typeof key === 'string' && key.includes('gantt'));
    mutate((key) => typeof key === 'string' && key.includes('dashboard'));
  }, []);

  // Task-specific refresh with conflict validation
  const refreshTaskData = useCallback(async () => {
    try {
      // Fetch fresh task data
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate and validate
      const cleanTasks = deduplicateTasks(tasks || []);
      
      // Update all task-related cache keys
      mutate('tasks-unified', cleanTasks, false);
      mutate((key) => typeof key === 'string' && key.includes('task'), undefined, true);
      
      return cleanTasks;
    } catch (error) {
      console.error('Failed to refresh task data:', error);
      return [];
    }
  }, []);

  // Vehicle-specific refresh
  const refreshVehicleData = useCallback(async () => {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      mutate('vehicles-unified', vehicles, false);
      mutate((key) => typeof key === 'string' && key.includes('vehicle'), undefined, true);
      
      return vehicles || [];
    } catch (error) {
      console.error('Failed to refresh vehicle data:', error);
      return [];
    }
  }, []);

  // Cross-page data synchronization
  const syncDataAcrossPages = useCallback((dataType: 'tasks' | 'vehicles' | 'team_members' | 'locations') => {
    const swrKey = `${dataType === 'team_members' ? 'team_members' : dataType}-unified`;
    
    // Refresh the main data
    mutate(swrKey);
    
    // Refresh related computed views
    switch (dataType) {
      case 'tasks':
        // Task changes affect all views
        mutate((key) => typeof key === 'string' && (
          key.includes('schedule') || 
          key.includes('timeline') || 
          key.includes('gantt') || 
          key.includes('dashboard')
        ));
        break;
      case 'vehicles':
        // Vehicle changes affect schedule and dashboard
        mutate((key) => typeof key === 'string' && (
          key.includes('schedule') || 
          key.includes('dashboard')
        ));
        break;
      case 'team_members':
        // Team member changes affect task assignments
        mutate((key) => typeof key === 'string' && key.includes('task'));
        break;
    }
  }, []);

  // Data validation across pages
  const validateDataConsistency = useCallback(async () => {
    try {
      // Fetch current data
      const [vehiclesResponse, tasksResponse, teamMembersResponse] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('team_members').select('*')
      ]);

      if (vehiclesResponse.error || tasksResponse.error || teamMembersResponse.error) {
        throw new Error('Failed to fetch data for validation');
      }

      const vehicles = vehiclesResponse.data || [];
      const tasks = deduplicateTasks(tasksResponse.data || []);
      const teamMembers = teamMembersResponse.data || [];

      // Run integrity tests
      const integrityResults = runDataIntegrityTests({ tasks, vehicles, teamMembers });
      
      // Check for conflicts
      const { conflicts } = validateTaskConflicts(tasks);

      return {
        isValid: integrityResults.failed === 0,
        integrity: integrityResults,
        conflicts,
        summary: {
          totalRecords: vehicles.length + tasks.length + teamMembers.length,
          conflictsFound: conflicts.length,
          criticalIssues: integrityResults.failed,
          lastValidated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Data consistency validation failed:', error);
      return {
        isValid: false,
        integrity: { passed: 0, failed: 1, issues: ['Validation failed'] },
        conflicts: [],
        summary: {
          totalRecords: 0,
          conflictsFound: 0,
          criticalIssues: 1,
          lastValidated: new Date().toISOString()
        }
      };
    }
  }, []);

  // Set up real-time subscriptions for cross-page consistency
  useEffect(() => {
    const channels = [
      supabase
        .channel('task-consistency')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload: any) => {
          console.log('🔄 Task change detected, syncing across pages:', payload.eventType);
          syncDataAcrossPages('tasks');
        })
        .subscribe(),

      supabase
        .channel('vehicle-consistency')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload: any) => {
          console.log('🔄 Vehicle change detected, syncing across pages:', payload.eventType);
          syncDataAcrossPages('vehicles');
        })
        .subscribe(),

      supabase
        .channel('team-consistency')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, (payload: any) => {
          console.log('🔄 Team member change detected, syncing across pages:', payload.eventType);
          syncDataAcrossPages('team_members');
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [syncDataAcrossPages]);

  return {
    refreshAllData,
    refreshTaskData,
    refreshVehicleData,
    syncDataAcrossPages,
    validateDataConsistency
  };
}

/**
 * Hook for enhanced task data with real-time consistency
 */
export function useEnhancedTasks(vehicleId?: string) {
  const { refreshTaskData } = useDataConsistency();

  // Get raw task data (properly typed)
  const taskData = useMemo((): Task[] => {
    // This would be connected to your existing task hooks
    // For now, returning empty array as placeholder but with proper typing
    return [] as Task[];
  }, []);

  // Filter tasks by vehicle if specified
  const filteredTasks = useMemo(() => {
    if (!vehicleId) return taskData;
    
    return taskData.filter((task: Task) => {
      if (Array.isArray(task.vehicle_id)) {
        return task.vehicle_id.includes(vehicleId);
      }
      return task.vehicle_id === vehicleId;
    });
  }, [taskData, vehicleId]);

  // Enhanced task operations
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Refresh task data across all pages
      await refreshTaskData();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update task:', error);
      return { success: false, error };
    }
  }, [refreshTaskData]);

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await refreshTaskData();
      return { success: true };
    } catch (error) {
      console.error('Failed to create task:', error);
      return { success: false, error };
    }
  }, [refreshTaskData]);

  return {
    tasks: filteredTasks,
    updateTask,
    createTask,
    refreshTasks: refreshTaskData
  };
}

/**
 * Hook for page-specific data subscriptions
 */
export function usePageDataSubscription(pageType: 'dashboard' | 'schedule' | 'timeline' | 'gantt') {
  const { syncDataAcrossPages } = useDataConsistency();

  useEffect(() => {
    // Set up page-specific optimized subscriptions
    const subscriptionKey = `page-${pageType}-${Date.now()}`;
    
    // Different pages need different data update frequencies
    const updateFrequency = {
      dashboard: 5000,    // 5 seconds for dashboard
      schedule: 10000,    // 10 seconds for schedule
      timeline: 15000,    // 15 seconds for timeline  
      gantt: 15000        // 15 seconds for gantt
    };

    const interval = setInterval(() => {
      // Only sync if the page is visible to avoid unnecessary updates
      if (!document.hidden) {
        syncDataAcrossPages('tasks');
      }
    }, updateFrequency[pageType]);

    // Clean up
    return () => {
      clearInterval(interval);
    };
  }, [pageType, syncDataAcrossPages]);
}

/**
 * Hook for monitoring data health across pages
 */
export function useDataHealthMonitor() {
  const { validateDataConsistency } = useDataConsistency();

  const runHealthCheck = useCallback(async () => {
    return await validateDataConsistency();
  }, [validateDataConsistency]);

  // Auto health check every 5 minutes
  useEffect(() => {
    const healthCheckInterval = setInterval(async () => {
      const health = await runHealthCheck();
      
      if (!health.isValid) {
        console.warn('⚠️ Data consistency issues detected:', health.integrity.issues);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(healthCheckInterval);
  }, [runHealthCheck]);

  return {
    runHealthCheck
  };
}
