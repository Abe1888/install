"use client";

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useProjectSettings } from './useProjectSettings';
import { useVehicles } from './useUnifiedData';

/**
 * Hook that automatically adjusts vehicle schedules when project end date changes
 * This ensures all vehicle schedules align with the project timeline
 */
export function useVehicleScheduleAdjustment() {
  const { settings: projectSettings } = useProjectSettings();
  const { data: vehicles = [], mutate: mutateVehicles } = useVehicles();

  // Calculate optimal schedule distribution based on project timeline
  const calculateOptimalSchedules = useCallback(async (startDate: string, endDate: string) => {
    if (!vehicles.length) return;

    try {
      console.log('🔄 Adjusting vehicle schedules based on project timeline...');
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Group vehicles by location for better scheduling
      const vehiclesByLocation = vehicles.reduce((acc, vehicle) => {
        const location = vehicle.location || 'Unknown';
        if (!acc[location]) acc[location] = [];
        acc[location].push(vehicle);
        return acc;
      }, {} as Record<string, any[]>);

      const updates = [];
      
      for (const [location, locationVehicles] of Object.entries(vehiclesByLocation)) {
        const vehiclesPerDay = Math.ceil(locationVehicles.length / totalDays);
        
        for (let i = 0; i < locationVehicles.length; i++) {
          const vehicle = locationVehicles[i];
          const dayOffset = Math.floor(i / vehiclesPerDay);
          const scheduledDate = new Date(start);
          scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
          
          // Ensure we don't schedule beyond the end date
          if (scheduledDate > end) {
            scheduledDate.setTime(end.getTime());
          }
          
          // Calculate time slot based on position within day
          const slotInDay = i % vehiclesPerDay;
          const timeSlots = ['Morning (8AM-12PM)', 'Afternoon (12PM-4PM)', 'Evening (4PM-8PM)'];
          const timeSlot = timeSlots[slotInDay % timeSlots.length];
          
          updates.push({
            id: vehicle.id,
            day: dayOffset + 1,
            time_slot: timeSlot,
            updated_at: new Date().toISOString()
          });
        }
      }

      // Batch update all vehicles
      if (updates.length > 0) {
        console.log(`📅 Updating schedules for ${updates.length} vehicles`);
        
        for (const update of updates) {
          const { error } = await supabase
            .from('vehicles')
            .update({
              day: update.day,
              time_slot: update.time_slot,
              updated_at: update.updated_at
            })
            .eq('id', update.id);
            
          if (error) {
            console.error(`❌ Failed to update vehicle ${update.id}:`, error);
          }
        }
        
        // Refresh vehicle data
        await mutateVehicles();
        
        console.log('✅ Vehicle schedules updated successfully!');
        return { success: true, updated: updates.length };
      }
      
    } catch (error) {
      console.error('❌ Error adjusting vehicle schedules:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }, [vehicles, mutateVehicles]);

  // Auto-adjust schedules when project end date changes
  useEffect(() => {
    if (projectSettings?.project_start_date && projectSettings?.project_end_date) {
      const startDate = projectSettings.project_start_date;
      const endDate = projectSettings.project_end_date;
      
      // Only adjust if we have both dates
      calculateOptimalSchedules(startDate, endDate);
    }
  }, [projectSettings?.project_start_date, projectSettings?.project_end_date, calculateOptimalSchedules]);

  // Manual schedule adjustment function
  const adjustSchedules = useCallback(async () => {
    if (!projectSettings?.project_start_date || !projectSettings?.project_end_date) {
      throw new Error('Both project start and end dates are required for schedule adjustment');
    }
    
    return await calculateOptimalSchedules(
      projectSettings.project_start_date,
      projectSettings.project_end_date
    );
  }, [projectSettings, calculateOptimalSchedules]);

  // Get schedule statistics
  const getScheduleStats = useCallback(() => {
    if (!vehicles.length || !projectSettings?.project_start_date) return null;

    const now = new Date();
    const startDate = new Date(projectSettings.project_start_date);
    const endDate = projectSettings.project_end_date ? new Date(projectSettings.project_end_date) : null;
    
    // A vehicle is considered scheduled if it has a day and time_slot assigned
    const scheduledVehicles = vehicles.filter(v => v.day && v.time_slot);
    const unscheduledVehicles = vehicles.filter(v => !v.day || !v.time_slot);
    
    // Calculate overdue vehicles based on project day vs current date
    const overdueVehicles = vehicles.filter(v => {
      if (!v.day || v.status === 'Completed') return false;
      
      // Calculate the actual date for this vehicle's scheduled day
      const vehicleDate = new Date(startDate);
      vehicleDate.setDate(vehicleDate.getDate() + (v.day - 1));
      
      return vehicleDate < now;
    });
    
    return {
      total: vehicles.length,
      scheduled: scheduledVehicles.length,
      unscheduled: unscheduledVehicles.length,
      overdue: overdueVehicles.length,
      onTrack: scheduledVehicles.length - overdueVehicles.length,
      scheduleCompliance: vehicles.length > 0 ? (scheduledVehicles.length / vehicles.length) * 100 : 0
    };
  }, [vehicles, projectSettings]);

  return {
    adjustSchedules,
    getScheduleStats,
    isAutoAdjusting: Boolean(projectSettings?.project_start_date && projectSettings?.project_end_date),
    scheduleStats: getScheduleStats()
  };
}
