"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useVehicles, useLocations, useTeamMembers, useTasks } from "@/lib/hooks/useUnifiedData";
import { supabase } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { 
  Database, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  Download, 
  RefreshCw, 
  Search, 
  Filter,
  Eye,
  Save,
  X,
  Check,
  AlertTriangle,
  Truck,
  MapPin,
  Users,
  CheckSquare,
  FileText,
  Settings,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Zap,
  CalendarDays,
} from "lucide-react";
import { ModernDataTable } from "./ModernDataTable";
import { DataEditor } from "./DataEditor";
import { ImportModal } from "./ImportModal";
import { ConfirmDialog } from "./ConfirmDialog";
import SystemHealthCheck from "../ui/SystemHealthCheck";
import DataValidationPanel from "../ui/DataValidationPanel";
import PerformanceMonitor from "../ui/PerformanceMonitor";
import AccessibilityChecker from "../ui/AccessibilityChecker";
import { DatabaseResetManager } from "./DatabaseResetManager";
import { DatabaseBackupManager } from "./DatabaseBackupManager";
import { ShareLinkManager } from "./ShareLinkManager";
import { VehicleTaskExtractor } from "@/components/debug/VehicleTaskExtractor";
import { ProjectSettings } from "./ProjectSettings";

// Define the data types we can manage
type DataType = 'vehicles' | 'locations' | 'team_members' | 'tasks' | 'project_settings' | 'realtime_api' | 'system_status';

interface CMSStats {
  totalRecords: number;
  recentlyModified: number;
  pendingChanges: number;
  lastUpdate: string;
}

export function RealTimeCMS() {
  // Data hooks with real-time subscriptions
  const { data: vehicles = [], isLoading: vehiclesLoading, error: vehiclesError, mutate: mutateVehicles } = useVehicles(true);
  const { data: locations = [], isLoading: locationsLoading, error: locationsError, mutate: mutateLocations } = useLocations(true);
  const { data: teamMembers = [], isLoading: teamMembersLoading, error: teamMembersError, mutate: mutateTeamMembers } = useTeamMembers(true);
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, mutate: mutateTasks } = useTasks(undefined, true);

  // UI State
  const [activeDataType, setActiveDataType] = useState<DataType>('vehicles');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Loading and error states
  const isLoading = vehiclesLoading || locationsLoading || teamMembersLoading || tasksLoading;
  const hasError = vehiclesError || locationsError || teamMembersError || tasksError;

  // Helper function to deduplicate data by ID
  const deduplicateById = useCallback((data: any[]) => {
    if (!data || data.length === 0) return data;
    
    const seen = new Set<string>();
    const deduplicated: any[] = [];
    
    for (const item of data) {
      const id = item.id || item.name; // Use name for locations as primary key
      if (id && !seen.has(id)) {
        seen.add(id);
        deduplicated.push(item);
      } else if (process.env.NODE_ENV === 'development' && id) {
        console.warn(`🔍 CMS: Filtered duplicate ${activeDataType} with ID: ${id}`);
      }
    }
    
    return deduplicated;
  }, [activeDataType]);

  // Get current data based on active type with deduplication
  const getCurrentData = useCallback(() => {
    let rawData: any[];
    switch (activeDataType) {
      case 'vehicles':
        rawData = vehicles;
        break;
      case 'locations':
        rawData = locations;
        break;
      case 'team_members':
        rawData = teamMembers;
        break;
      case 'tasks':
        rawData = tasks;
        break;
      default:
        rawData = [];
    }
    
    // Apply deduplication safety net
    return deduplicateById(rawData);
  }, [activeDataType, vehicles, locations, teamMembers, tasks, deduplicateById]);

  // Get current mutate function
  const getCurrentMutate = useCallback(() => {
    switch (activeDataType) {
      case 'vehicles':
        return mutateVehicles;
      case 'locations':
        return mutateLocations;
      case 'team_members':
        return mutateTeamMembers;
      case 'tasks':
        return mutateTasks;
      default:
        return () => {};
    }
  }, [activeDataType, mutateVehicles, mutateLocations, mutateTeamMembers, mutateTasks]);

  // Get table name for Supabase operations
  const getTableName = useCallback(() => {
    switch (activeDataType) {
      case 'vehicles':
        return 'vehicles';
      case 'locations':
        return 'locations';
      case 'team_members':
        return 'team_members';
      case 'tasks':
        return 'tasks';
      default:
        return 'vehicles';
    }
  }, [activeDataType]);

  // Show notification
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // Data validation helper
  const validateDataConsistency = useCallback(() => {
    const currentData = getCurrentData();
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Data validation for ${activeDataType}:`, {
        count: currentData.length,
        sample: currentData.slice(0, 2),
        lastUpdated: new Date().toISOString()
      });
    }
    return currentData;
  }, [getCurrentData, activeDataType]);

  // Database connectivity test for vehicles
  const testVehicleDatabase = useCallback(async () => {
    if (activeDataType !== 'vehicles') return;
    
    try {
      console.group('🧪 Vehicle Database Connectivity Test');
      
      // Step 1: Test SELECT operation
      console.log('Step 1: Testing SELECT operation...');
      const { data: selectTest, error: selectError } = await supabase
        .from('vehicles')
        .select('*')
        .limit(1);
      
      console.log('SELECT test result:', { data: selectTest, error: selectError });
      
      if (selectError) {
        throw new Error(`SELECT failed: ${selectError.message}`);
      }
      
      // Step 2: Ensure we have valid locations for the foreign key constraint
      console.log('Step 2: Validating available locations...');
      const { data: availableLocations, error: locationError } = await supabase
        .from('locations')
        .select('name')
        .limit(1);
        
      console.log('Available locations:', { data: availableLocations, error: locationError });
      
      if (locationError || !availableLocations || availableLocations.length === 0) {
        // If no locations exist, create a test location first
        console.log('Step 2a: Creating test location to satisfy foreign key constraint...');
        const { error: createLocationError } = await supabase
          .from('locations')
          .insert([{
            name: 'TEST_LOCATION_' + Date.now(),
            vehicles: 0,
            gps_devices: 0,
            fuel_sensors: 0,
            address: 'Test Address',
            contact_person: 'Test Contact',
            contact_phone: 'Test Phone',
            installation_days: 'Test Days'
          }]);
          
        if (createLocationError) {
          throw new Error(`Failed to create test location: ${createLocationError.message}`);
        }
        
        // Refresh locations list
        const { data: newLocations } = await supabase
          .from('locations')
          .select('name')
          .limit(1);
        availableLocations.push(...(newLocations || []));
      }
      
      // Step 3: Test INSERT operation with valid location
      console.log('Step 3: Testing INSERT operation with valid location...');
      const testLocation = availableLocations?.[0]?.name || locations?.[0]?.name || 'Bahir Dar';
      const testVehicle = {
        id: 'TEST_VEHICLE_' + Date.now(),
        type: 'Test Vehicle',
        location: testLocation, // Use validated location
        day: 999,
        time_slot: '00:00-00:01',
        status: 'Pending',
        gps_required: 1,
        fuel_sensors: 1,
        fuel_tanks: 1
      };
      
      console.log('Attempting to insert test vehicle:', testVehicle);
      
      const { data: insertTest, error: insertError } = await supabase
        .from('vehicles')
        .insert([testVehicle])
        .select();
      
      console.log('INSERT test result:', { data: insertTest, error: insertError });
      
      if (insertError) {
        throw new Error(`INSERT failed: ${insertError.message}`);
      }
      
      // Step 4: Clean up test data
      console.log('Step 4: Cleaning up test data...');
      if (insertTest && insertTest[0]) {
        const { error: deleteError } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', testVehicle.id);
          
        if (deleteError) {
          console.warn('Failed to clean up test vehicle:', deleteError.message);
        } else {
          console.log('Test vehicle cleaned up successfully');
        }
      }
      
      // Clean up test location if we created one
      if (availableLocations?.length > 0 && availableLocations[0].name.startsWith('TEST_LOCATION_')) {
        const { error: deleteLocationError } = await supabase
          .from('locations')
          .delete()
          .eq('name', availableLocations[0].name);
          
        if (deleteLocationError) {
          console.warn('Failed to clean up test location:', deleteLocationError.message);
        } else {
          console.log('Test location cleaned up successfully');
        }
      }
      
      console.groupEnd();
      showNotification('success', '✅ Database connectivity test passed! All CRUD operations working correctly.');
      
    } catch (error: any) {
      console.error('❌ Database test error:', error);
      showNotification('error', `Database test failed: ${error.message || 'Unknown error'}`);
      console.groupEnd();
    }
  }, [activeDataType, showNotification, locations]);


  // Calculate CMS statistics
  const cmsStats: CMSStats = React.useMemo(() => {
    const allRecords = vehicles.length + locations.length + teamMembers.length + tasks.length;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Count recently modified records (example logic)
    const recentlyModified = [
      ...vehicles.filter(v => v.updated_at && new Date(v.updated_at) > oneHourAgo),
      ...tasks.filter(t => t.updated_at && new Date(t.updated_at) > oneHourAgo),
    ].length;

    return {
      totalRecords: allRecords,
      recentlyModified,
      pendingChanges: selectedItems.length,
      lastUpdate: now.toLocaleTimeString()
    };
  }, [vehicles, locations, teamMembers, tasks, selectedItems]);

  // CRUD Operations
  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setIsEditorOpen(true);
  }, []);

  const handleEdit = useCallback((item: any) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  }, []);

  const handleSave = useCallback(async (data: any) => {
    try {
      const tableName = getTableName();
      const mutate = getCurrentMutate();

      // Optimistic update - immediately update UI
      if (editingItem) {
        const optimisticData = { ...editingItem, ...data, updated_at: new Date().toISOString() };
        
        // Use optimistic update functions if available
        if (activeDataType === 'vehicles') {
          const vehicleHook = vehicles as any;
          if (vehicleHook.optimisticUpdate) {
            vehicleHook.optimisticUpdate(optimisticData);
          }
        }
      }

      let result;
      if (editingItem) {
        // Update existing record - get the updated data back
        const { data: updatedData, error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id', editingItem.id)
          .select(); // Return updated data

        if (error) throw error;
        result = updatedData;

        showNotification('success', `${activeDataType.slice(0, -1)} updated successfully`);
      } else {
        // Create new record - get the created data back
        const { data: createdData, error } = await supabase
          .from(tableName)
          .insert([data])
          .select(); // Return created data

        if (error) throw error;
        result = createdData;

        showNotification('success', `${activeDataType.slice(0, -1)} created successfully`);
      }

      // Force immediate cache invalidation and refresh
      await mutate(); // SWR revalidation
      
      // Additional cache invalidation for cross-dependencies
      if (activeDataType === 'vehicles') {
        // Also invalidate tasks cache since vehicle data affects task display
        mutateTasks();
      }
      
      // Comprehensive logging for debugging
      if (process.env.NODE_ENV === 'development') {
        console.group(`🔍 ${activeDataType.toUpperCase()} ${editingItem ? 'UPDATE' : 'CREATE'} Debug`);
        console.log('Original form data:', data);
        console.log('Database result:', result);
        console.log('Table name:', tableName);
        if (activeDataType === 'vehicles') {
          console.log('Vehicle data validation:');
          console.log('- Required fields present:', {
            type: !!data.type,
            location: !!data.location,
            day: data.day !== undefined,
            time_slot: !!data.time_slot,
            status: !!data.status
          });
          console.log('- Numeric fields:', {
            gps_required: typeof data.gps_required === 'number' ? data.gps_required : 'NOT A NUMBER',
            fuel_sensors: typeof data.fuel_sensors === 'number' ? data.fuel_sensors : 'NOT A NUMBER',
            fuel_tanks: typeof data.fuel_tanks === 'number' ? data.fuel_tanks : 'NOT A NUMBER'
          });
        }
        console.groupEnd();
      }
      
      setIsEditorOpen(false);
      setEditingItem(null);

    } catch (error: any) {
      console.error('Save error:', error);
      showNotification('error', error.message || 'Failed to save record');
      
      // Revert optimistic update on error
      await getCurrentMutate()();
    }
  }, [editingItem, activeDataType, getTableName, getCurrentMutate, showNotification, mutateTasks, vehicles]);

  const handleDelete = useCallback((items: any[]) => {
    const itemCount = items.length;
    const itemType = activeDataType.slice(0, -1);
    
    setConfirmMessage(
      `Are you sure you want to delete ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''}? This action cannot be undone.`
    );
    
    setConfirmAction(() => async () => {
      try {
        const tableName = getTableName();
        const mutate = getCurrentMutate();
        const ids = items.map(item => item.id);

        const { error } = await supabase
          .from(tableName)
          .delete()
          .in('id', ids);

        if (error) throw error;

        showNotification('success', `${itemCount} ${itemType}${itemCount > 1 ? 's' : ''} deleted successfully`);
        
        // Refresh data and clear selection
        await mutate();
        setSelectedItems([]);

      } catch (error: any) {
        console.error('Delete error:', error);
        showNotification('error', error.message || 'Failed to delete records');
      }
    });
    
    setShowConfirmDialog(true);
  }, [activeDataType, getTableName, getCurrentMutate, showNotification]);

  const handleBulkDelete = useCallback(() => {
    const currentData = getCurrentData();
    const itemsToDelete = currentData.filter(item => selectedItems.includes(item.id));
    if (itemsToDelete.length > 0) {
      handleDelete(itemsToDelete);
    }
  }, [selectedItems, getCurrentData, handleDelete]);

  // Delete all tasks for a specific vehicle
  const handleDeleteVehicleTasks = useCallback((vehicleId: string) => {
    const vehicleTasks = tasks.filter(task => task.vehicle_id === vehicleId);
    if (vehicleTasks.length > 0) {
      setConfirmMessage(
        `Are you sure you want to delete all ${vehicleTasks.length} task${vehicleTasks.length > 1 ? 's' : ''} for Vehicle ${vehicleId}? This action cannot be undone.`
      );
      
      setConfirmAction(() => async () => {
        try {
          const taskIds = vehicleTasks.map(task => task.id);
          
          const { error } = await supabase
            .from('tasks')
            .delete()
            .in('id', taskIds);

          if (error) throw error;

          showNotification('success', `${vehicleTasks.length} task${vehicleTasks.length > 1 ? 's' : ''} deleted for Vehicle ${vehicleId}`);
          
          // Refresh tasks data
          await mutateTasks();

        } catch (error: any) {
          console.error('Delete vehicle tasks error:', error);
          showNotification('error', error.message || 'Failed to delete vehicle tasks');
        }
      });
      
      setShowConfirmDialog(true);
    }
  }, [tasks, showNotification, mutateTasks]);

  // Delete individual task
  const handleDeleteTask = useCallback((task: any) => {
    setConfirmMessage(
      `Are you sure you want to delete the task "${task.name}"? This action cannot be undone.`
    );
    
    setConfirmAction(() => async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task.id);

        if (error) throw error;

        showNotification('success', `Task "${task.name}" deleted successfully`);
        
        // Refresh tasks data
        await mutateTasks();

      } catch (error: any) {
        console.error('Delete task error:', error);
        showNotification('error', error.message || 'Failed to delete task');
      }
    });
    
    setShowConfirmDialog(true);
  }, [showNotification, mutateTasks]);

  // Clear all tasks
  const handleClearAllTasks = useCallback(() => {
    if (tasks.length === 0) {
      showNotification('info', 'No tasks to clear');
      return;
    }

    setConfirmMessage(
      `Are you sure you want to clear ALL ${tasks.length} tasks? This will permanently delete all task data and cannot be undone.`
    );
    
    setConfirmAction(() => async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

        if (error) throw error;

        showNotification('success', `All ${tasks.length} tasks cleared successfully`);
        
        // Refresh tasks data
        await mutateTasks();

      } catch (error: any) {
        console.error('Clear all tasks error:', error);
        showNotification('error', error.message || 'Failed to clear all tasks');
      }
    });
    
    setShowConfirmDialog(true);
  }, [tasks.length, showNotification, mutateTasks]);

  const handleImport = useCallback(async (importData: any[]) => {
    try {
      const tableName = getTableName();
      const mutate = getCurrentMutate();

      // Validate and process import data
      const processedData = importData.map(item => ({
        ...item,
        id: undefined, // Let Supabase generate new IDs
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from(tableName)
        .insert(processedData);

      if (error) throw error;

      showNotification('success', `${importData.length} records imported successfully`);
      
      // Refresh data
      await mutate();
      setIsImportOpen(false);

    } catch (error: any) {
      console.error('Import error:', error);
      showNotification('error', error.message || 'Failed to import data');
    }
  }, [getTableName, getCurrentMutate, showNotification]);

  const handleExport = useCallback(() => {
    const currentData = getCurrentData();
    const dataToExport = currentData.map(item => {
      // Remove internal fields for export
      const { created_at, updated_at, ...exportItem } = item;
      return exportItem;
    });

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDataType}_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('success', `${activeDataType} data exported successfully`);
  }, [getCurrentData, activeDataType, showNotification]);

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    const currentData = getCurrentData();
    if (!searchQuery) return currentData;

    return currentData.filter((item: any) =>
      Object.values(item).some((value: any) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [getCurrentData, searchQuery]);

  // Group tasks by vehicle ID with installation details (only for tasks data type)
  const groupedTasksData = React.useMemo(() => {
    if (activeDataType !== 'tasks') return null;
    
    const tasksData = filteredData;
    const grouped = tasksData.reduce((groups: Record<string, any[]>, task: any) => {
      const vehicleId = task.vehicle_id || 'Shared Tasks';
      if (!groups[vehicleId]) {
        groups[vehicleId] = [];
      }
      groups[vehicleId].push(task);
      return groups;
    }, {});
    
    // Sort vehicle IDs numerically and preserve 'Shared Tasks' at the end
    const sortedVehicleIds = Object.keys(grouped).sort((a, b) => {
      if (a === 'Shared Tasks') return 1;
      if (b === 'Shared Tasks') return -1;
      // Extract numeric part from vehicle ID (e.g., V001 -> 1)
      const aNum = parseInt(a.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });
    
    return sortedVehicleIds.map(vehicleId => {
      const vehicleTasks = grouped[vehicleId];
      // Sort tasks by start time if available, otherwise by creation order
      const sortedTasks = vehicleTasks.sort((a, b) => {
        if (a.start_time && b.start_time) {
          return a.start_time.localeCompare(b.start_time);
        }
        return (a.created_at || '').localeCompare(b.created_at || '');
      });

      // Calculate installation progress
      const completedTasks = sortedTasks.filter(t => t.status === 'Completed').length;
      const inProgressTasks = sortedTasks.filter(t => t.status === 'In Progress').length;
      const totalTasks = sortedTasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Get vehicle info if available
      const vehicleInfo = vehicles.find(v => v.id === vehicleId);

      return {
        vehicleId,
        tasks: sortedTasks,
        stats: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          pending: totalTasks - completedTasks - inProgressTasks,
          progress: progressPercentage
        },
        vehicleInfo: vehicleInfo ? {
          type: vehicleInfo.type,
          location: vehicleInfo.location,
          day: vehicleInfo.day,
          timeSlot: vehicleInfo.time_slot,
          status: vehicleInfo.status
        } : null
      };
    });
  }, [activeDataType, filteredData, vehicles]);

  // Data type configuration
  const dataTypes = [
    {
      key: 'vehicles' as DataType,
      name: 'Vehicles',
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      count: vehicles.length
    },
    {
      key: 'locations' as DataType,
      name: 'Locations',
      icon: MapPin,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      count: locations.length
    },
    {
      key: 'team_members' as DataType,
      name: 'Team Members',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      count: teamMembers.length
    },
    {
      key: 'tasks' as DataType,
      name: 'Tasks',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      count: tasks.length
    },
    {
      key: 'project_settings' as DataType,
      name: 'Project Settings',
      icon: CalendarDays,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      count: 1
    },
    {
      key: 'realtime_api' as DataType,
      name: 'Real-Time API',
      icon: Database,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      count: vehicles.length + locations.length + teamMembers.length + tasks.length
    },
    {
      key: 'system_status' as DataType,
      name: 'System Status',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      count: 4 // Health checks, validation, performance, accessibility
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <LoadingSpinner text="Loading CMS data..." />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900 mb-1">Failed to load CMS data</h3>
        <p className="text-sm text-red-700">Please check your connection and try again.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 inline-flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reload</span>
        </button>
      </div>
    );
  }

  // Real-Time API Content Component
  const RealTimeAPIContent = () => {
    // Calculate aggregate stats
    const quickStats = useMemo(() => {
      const completedVehicles = vehicles.filter(v => v.status === 'Completed').length;
      const inProgressVehicles = vehicles.filter(v => v.status === 'In Progress').length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;

      return {
        vehicles: {
          total: vehicles.length,
          completed: completedVehicles,
          inProgress: inProgressVehicles,
          pending: vehicles.filter(v => v.status === 'Pending').length,
        },
        tasks: {
          total: tasks.length,
          completed: completedTasks,
          inProgress: inProgressTasks,
          pending: tasks.filter(t => t.status === 'Pending').length,
        },
        locations: locations.length,
        teamMembers: teamMembers.length,
      };
    }, [vehicles, tasks, locations, teamMembers]);

    return (
      <div className="p-6 space-y-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Real-Time API Data Hub</h3>
          <p className="text-sm text-gray-300">Live data from Supabase database with real-time updates.</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-400 mb-1">
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium">Vehicles</span>
            </div>
            <div className="text-2xl font-bold text-white">{quickStats.vehicles.total}</div>
            <div className="text-xs text-gray-300">Completed: {quickStats.vehicles.completed} • In Progress: {quickStats.vehicles.inProgress}</div>
          </div>

          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-400 mb-1">
              <CheckSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Tasks</span>
            </div>
            <div className="text-2xl font-bold text-white">{quickStats.tasks.total}</div>
            <div className="text-xs text-gray-300">Completed: {quickStats.tasks.completed} • In Progress: {quickStats.tasks.inProgress}</div>
          </div>

          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-pink-400 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Locations</span>
            </div>
            <div className="text-2xl font-bold text-white">{quickStats.locations}</div>
            <div className="text-xs text-gray-300">Active locations</div>
          </div>

          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-purple-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Team Members</span>
            </div>
            <div className="text-2xl font-bold text-white">{quickStats.teamMembers}</div>
            <div className="text-xs text-gray-300">Active team members</div>
          </div>
        </div>

        {/* Real-time Status Indicators */}
        <div className="bg-gradient-to-r from-green-900 to-green-800 border border-green-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h4 className="text-lg font-semibold text-green-100">Live Data Connection</h4>
          </div>
          <p className="text-green-200 mb-4">All data shown above is fetched directly from your Supabase database in real-time. No hardcoded or mock data is used.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-green-200 mb-2">Available Operations:</h5>
              <ul className="space-y-1 text-green-300">
                <li>• Create, Read, Update, Delete (CRUD)</li>
                <li>• Real-time subscriptions</li>
                <li>• Data validation and filtering</li>
                <li>• Import/Export functionality</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-green-200 mb-2">Data Sources:</h5>
              <ul className="space-y-1 text-green-300">
                <li>• Vehicles table: {vehicles.length} records</li>
                <li>• Locations table: {locations.length} records</li>
                <li>• Team Members table: {teamMembers.length} records</li>
                <li>• Tasks table: {tasks.length} records</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // System Status Content Component  
  const SystemStatusContent = () => (
    <div className="p-6 space-y-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">System Health & Status</h3>
        <p className="text-sm text-gray-300">Monitor system health, validate data integrity, check performance, and manage database operations.</p>
      </div>
      
      {/* Vehicle Task Data Extractor */}
      <VehicleTaskExtractor />
      
      {/* Share Link Manager */}
      <ShareLinkManager />
      
      {/* Database Backup Manager */}
      <DatabaseBackupManager />
      
      {/* Database Reset Manager */}
      <DatabaseResetManager />
      
      {/* System Health Check */}
      <SystemHealthCheck />
      
      {/* Data Validation Panel */}
      <DataValidationPanel />
      
      {/* Performance Monitor */}
      <PerformanceMonitor />
      
      {/* Accessibility Checker */}
      <AccessibilityChecker />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          notification.type === 'success' ? 'bg-green-900 border-green-700 text-green-100' :
          notification.type === 'error' ? 'bg-red-900 border-red-700 text-red-100' :
          'bg-blue-900 border-blue-700 text-blue-100'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && <Check className="w-5 h-5" />}
            {notification.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header with Real-Time Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Content Management System</h1>
            <div className="flex items-center space-x-4 text-sm">
              <p className="text-gray-300">Real-time CRUD operations • Admin Interface</p>
              <div className="flex items-center space-x-1 text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Zap className="w-4 h-4" />
                <span className="font-medium">Live Data</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium text-white">{cmsStats.totalRecords}</div>
            <div className="text-xs text-gray-400">Total Records</div>
          </div>
          <div className="flex items-center space-x-2 bg-green-900 text-green-100 px-3 py-2 rounded-lg border border-green-800">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Real-Time Active</span>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-blue-400">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-semibold">Total Records</span>
            </div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold text-blue-300 mb-1">{cmsStats.totalRecords}</div>
          <div className="text-xs text-blue-400 font-medium">Live from database</div>
        </div>

        <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-green-400">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-semibold">Recently Modified</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold text-green-300 mb-1">{cmsStats.recentlyModified}</div>
          <div className="text-xs text-green-400 font-medium">In the last hour</div>
        </div>

        <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-purple-400">
              <Target className="w-5 h-5" />
              <span className="text-sm font-semibold">Selected Items</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-300 mb-1">{selectedItems.length}</div>
          <div className="text-xs text-purple-400 font-medium">Ready for bulk actions</div>
        </div>

        <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Activity className="w-5 h-5" />
              <span className="text-sm font-semibold">Last Update</span>
            </div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-lg font-mono text-amber-300 mb-1">{cmsStats.lastUpdate}</div>
          <div className="text-xs text-amber-400 font-medium">Real-time sync active</div>
        </div>
      </div>

      {/* Enhanced Data Type Tabs */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-0 px-6">
            {dataTypes.map((type) => {
              const Icon = type.icon;
              const isActive = activeDataType === type.key;
              return (
                <button
                  key={type.key}
                  onClick={() => {
                    setActiveDataType(type.key);
                    setSelectedItems([]);
                    setSearchQuery('');
                  }}
                  className={`relative py-4 px-4 border-b-3 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? `border-red-500 ${type.color} bg-gray-700`
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${
                      isActive ? `${type.bgColor}` : 'bg-gray-100'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{type.name}</span>
                      <span className="text-xs text-gray-400">{type.count} records</span>
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isActive 
                        ? `${type.bgColor} ${type.color}` 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {type.count}
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Enhanced Toolbar */}
        <div className="px-6 py-5 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Enhanced Search - Only show for data management types */}
              {!['realtime_api', 'system_status', 'project_settings'].includes(activeDataType) && (
                <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search across all ${activeDataType.replace('_', ' ')} fields...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-gray-700 text-white placeholder-gray-400 shadow-sm"
                  />
                </div>
              )}

              {/* Enhanced Bulk Actions - Only show for data management types */}
              {selectedItems.length > 0 && !['realtime_api', 'system_status', 'project_settings'].includes(activeDataType) && (
                <div className="flex items-center space-x-3 bg-gray-700 px-4 py-2 rounded-lg border border-gray-600">
                  <span className="text-sm font-medium text-blue-300">
                    {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-red-900 text-red-100 rounded-md hover:bg-red-800 transition-all duration-200 text-sm flex items-center space-x-1 font-medium shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected</span>
                  </button>
                </div>
              )}
            </div>

            {/* Enhanced Action Buttons - Only show for data management types */}
            {!['realtime_api', 'system_status', 'project_settings'].includes(activeDataType) && (
              <div className="flex items-center space-x-3">
                {/* Database Test Button - Only for vehicles */}
                {activeDataType === 'vehicles' && (
                  <button
                    onClick={testVehicleDatabase}
                    className="px-4 py-2.5 border border-purple-600 bg-purple-700 text-purple-100 rounded-lg hover:bg-purple-600 transition-all duration-200 text-sm flex items-center space-x-2 font-medium shadow-sm"
                    title="Test database connectivity and operations"
                  >
                    <Database className="w-4 h-4" />
                    <span>Test DB</span>
                  </button>
                )}
                
                {/* Manual Refresh Button */}
                <button
                  onClick={async () => {
                    const mutate = getCurrentMutate();
                    await mutate();
                    showNotification('success', `${activeDataType} data refreshed`);
                  }}
                  className="px-4 py-2.5 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm flex items-center space-x-2 font-medium shadow-sm"
                  title="Force refresh data from database"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="px-4 py-2.5 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm flex items-center space-x-2 font-medium shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Data</span>
                </button>

                <button
                  onClick={handleExport}
                  disabled={filteredData.length === 0}
                  className="px-4 py-2.5 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm flex items-center space-x-2 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>Export ({filteredData.length})</span>
                </button>

                <button
                  onClick={handleCreate}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 text-sm flex items-center space-x-2 font-semibold shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New {activeDataType.slice(0, -1).replace('_', ' ')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {activeDataType === 'realtime_api' ? (
          <RealTimeAPIContent />
        ) : activeDataType === 'project_settings' ? (
          <ProjectSettings />
        ) : activeDataType === 'system_status' ? (
          <SystemStatusContent />
        ) : activeDataType === 'tasks' ? (
          /* Enhanced Tasks View with Vehicle Grouping */
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Tasks by Vehicle Installation</h3>
                <p className="text-sm text-gray-300">Tasks grouped by vehicle ID with installation progress and timeline details.</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Clear All Tasks Button */}
                {tasks.length > 0 && (
                  <button
                    onClick={handleClearAllTasks}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Tasks ({tasks.length})</span>
                  </button>
                )}
                
              </div>
            </div>
            
            {groupedTasksData && groupedTasksData.length > 0 ? (
              <div className="space-y-6">
                {groupedTasksData.map((vehicleGroup) => (
                  <div key={vehicleGroup.vehicleId} className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                    {/* Vehicle Header */}
                    <div className="bg-gray-800 border-b border-gray-600 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            {vehicleGroup.vehicleId === 'Shared Tasks' ? (
                              <Activity className="w-5 h-5 text-white" />
                            ) : (
                              <Truck className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">
                              {vehicleGroup.vehicleId === 'Shared Tasks' ? 'Shared Tasks' : `Vehicle ${vehicleGroup.vehicleId}`}
                            </h4>
                            {vehicleGroup.vehicleInfo && (
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span>{vehicleGroup.vehicleInfo.type}</span>
                                <span>•</span>
                                <span>{vehicleGroup.vehicleInfo.location}</span>
                                <span>•</span>
                                <span>Day {vehicleGroup.vehicleInfo.day}</span>
                                {vehicleGroup.vehicleInfo.timeSlot && (
                                  <>
                                    <span>•</span>
                                    <span>{vehicleGroup.vehicleInfo.timeSlot}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">{vehicleGroup.stats.progress}%</div>
                            <div className="text-xs text-gray-400">Complete</div>
                          </div>
                          <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-500 transition-all duration-500"
                              style={{ width: `${vehicleGroup.stats.progress}%` }}
                            ></div>
                          </div>
                          
                          {/* Vehicle Actions */}
                          {vehicleGroup.vehicleId !== 'Shared Tasks' && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDeleteVehicleTasks(vehicleGroup.vehicleId)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                title={`Delete all tasks for Vehicle ${vehicleGroup.vehicleId}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Stats */}
                      <div className="mt-4 grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{vehicleGroup.stats.total}</div>
                          <div className="text-xs text-gray-400">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">{vehicleGroup.stats.completed}</div>
                          <div className="text-xs text-gray-400">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-400">{vehicleGroup.stats.inProgress}</div>
                          <div className="text-xs text-gray-400">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-400">{vehicleGroup.stats.pending}</div>
                          <div className="text-xs text-gray-400">Pending</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tasks List */}
                    <div className="divide-y divide-gray-600">
                      {vehicleGroup.tasks.map((task, index) => (
                        <div key={task.id} className="p-4 hover:bg-gray-600 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                                task.status === 'Completed' ? 'bg-green-600' :
                                task.status === 'In Progress' ? 'bg-blue-600' :
                                task.status === 'Blocked' ? 'bg-red-600' : 'bg-gray-600'
                              }`}>
                                {task.status === 'Completed' ? (
                                  <Check className="w-4 h-4 text-white" />
                                ) : (
                                  <span className="text-xs font-bold text-white">{index + 1}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-white">{task.name}</div>
                                <div className="text-sm text-gray-400 flex items-center space-x-2">
                                  {task.start_time && task.end_time && (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{task.start_time} - {task.end_time}</span>
                                    </span>
                                  )}
                                  {task.assigned_to && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center space-x-1">
                                        <Users className="w-3 h-3" />
                                        <span>{task.assigned_to}</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                task.status === 'Completed' ? 'bg-green-900 text-green-200' :
                                task.status === 'In Progress' ? 'bg-blue-900 text-blue-200' :
                                task.status === 'Blocked' ? 'bg-red-900 text-red-200' : 'bg-gray-700 text-gray-300'
                              }`}>
                                {task.status}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                task.priority === 'High' ? 'bg-red-900 text-red-200' :
                                task.priority === 'Medium' ? 'bg-yellow-900 text-yellow-200' : 'bg-gray-700 text-gray-300'
                              }`}>
                                {task.priority}
                              </span>
                              
                              {/* Task Actions */}
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleEdit(task)}
                                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                                  title="Edit task"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No tasks found</h3>
                <p className="text-gray-400">Create some tasks to see them grouped by vehicle.</p>
              </div>
            )}
          </div>
        ) : (
          /* Modern Data Table */
          <ModernDataTable
            data={filteredData}
            dataType={activeDataType}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onEdit={handleEdit}
            onDelete={(item) => handleDelete([item])}
          />
        )}
      </div>

      {/* Modals */}
      {isEditorOpen && (
        <DataEditor
          dataType={activeDataType}
          item={editingItem}
          onSave={handleSave}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {isImportOpen && (
        <ImportModal
          dataType={activeDataType}
          onImport={handleImport}
          onClose={() => setIsImportOpen(false)}
        />
      )}

      {showConfirmDialog && (
        <ConfirmDialog
          message={confirmMessage}
          onConfirm={() => {
            confirmAction();
            setShowConfirmDialog(false);
          }}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}


    </div>
  );
}
