"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

// Project Settings Types
export interface ProjectSettings {
  id: string;
  project_start_date: string;
  project_end_date?: string | null;
  total_days?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSettingsInput {
  project_start_date: string;
  project_end_date?: string | null;
}

// Hook return type
export interface UseProjectSettingsReturn {
  settings: ProjectSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (input: ProjectSettingsInput) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export function useProjectSettings(): UseProjectSettingsReturn {
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project settings
  const fetchSettings = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('project_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (fetchError) {
        // If no record exists, that's okay - we'll create one when user saves
        if (fetchError.code === 'PGRST116') {
          setSettings(null);
        } else {
          throw fetchError;
        }
      } else {
        setSettings(data);
      }
    } catch (err: any) {
      console.error('Error fetching project settings:', err);
      setError(err.message || 'Failed to fetch project settings');
    } finally {
      setLoading(false);
    }
  };

  // Update project settings
  const updateSettings = async (input: ProjectSettingsInput) => {
    try {
      setError(null);
      setLoading(true);

      // Calculate total days if both dates are provided
      let totalDays: number | null = null;
      if (input.project_start_date && input.project_end_date) {
        const start = new Date(input.project_start_date);
        const end = new Date(input.project_end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      }

      // Prepare data for upsert
      const upsertData = {
        id: 'default',
        project_start_date: input.project_start_date,
        project_end_date: input.project_end_date || null,
        total_days: totalDays,
        updated_at: new Date().toISOString()
      };

      // Upsert the settings
      const { data, error: upsertError } = await supabase
        .from('project_settings')
        .upsert(upsertData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      setSettings(data);
      console.log('✅ Project settings updated successfully:', data);
      
    } catch (err: any) {
      console.error('❌ Error updating project settings:', err);
      setError(err.message || 'Failed to update project settings');
      throw err; // Re-throw so component can handle it
    } finally {
      setLoading(false);
    }
  };

  // Refresh settings
  const refreshSettings = async () => {
    setLoading(true);
    await fetchSettings();
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Set up real-time subscription for updates
  useEffect(() => {
    const subscription = supabase
      .channel('project_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_settings'
        },
        (payload: any) => {
          console.log('🔄 Real-time project settings update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setSettings(payload.new as ProjectSettings);
          } else if (payload.eventType === 'DELETE') {
            setSettings(null);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings
  };
}
