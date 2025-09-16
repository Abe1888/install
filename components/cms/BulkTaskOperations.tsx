'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  CheckSquare,
  Calendar,
  Users,
  Truck,
  Clock,
  Target,
  Download,
  Upload,
  Copy,
  Edit3,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Settings,
  Filter,
  ArrowRight,
  Plus,
  Save,
  RefreshCw,
  FileText,
  Layers,
  Workflow
} from 'lucide-react';
import { Task, Vehicle, TeamMember } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';

interface BulkTaskOperationsProps {
  tasks: Task[];
  vehicles: Vehicle[];
  teamMembers: TeamMember[];
  selectedTaskIds: string[];
  onSelectionChange: (taskIds: string[]) => void;
  onTasksUpdated: () => void;
  onClose: () => void;
}

export function BulkTaskOperations({
  tasks,
  vehicles,
  teamMembers,
  selectedTaskIds,
  onSelectionChange,
  onTasksUpdated,
  onClose
}: BulkTaskOperationsProps) {
  const [operation, setOperation] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationParams, setOperationParams] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const selectedTasks = useMemo(() => 
    tasks.filter(task => selectedTaskIds.includes(task.id)),
    [tasks, selectedTaskIds]
  );

  // Bulk operation handlers
  const handleBulkStatusUpdate = useCallback(async (status: Task['status']) => {
    setIsProcessing(true);
    setProgress(0);
    
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < selectedTasks.length; i++) {
        const task = selectedTasks[i];
        
        try {
          const { error } = await supabase
            .from('tasks')
            .update({ 
              status, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', task.id);

          if (error) throw error;
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Failed to update ${task.name}: ${error.message}`);
        }
        
        setProgress(((i + 1) / selectedTasks.length) * 100);
      }
      
      setResults({ success, failed, errors });
      onTasksUpdated();
    } catch (error) {
      console.error('Bulk status update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTasks, onTasksUpdated]);

  const handleBulkAssignment = useCallback(async (assignee: string) => {
    setIsProcessing(true);
    setProgress(0);
    
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < selectedTasks.length; i++) {
        const task = selectedTasks[i];
        
        try {
          const { error } = await supabase
            .from('tasks')
            .update({ 
              assigned_to: assignee, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', task.id);

          if (error) throw error;
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Failed to assign ${task.name}: ${error.message}`);
        }
        
        setProgress(((i + 1) / selectedTasks.length) * 100);
      }
      
      setResults({ success, failed, errors });
      onTasksUpdated();
    } catch (error) {
      console.error('Bulk assignment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTasks, onTasksUpdated]);

  const handleBulkPriorityUpdate = useCallback(async (priority: Task['priority']) => {
    setIsProcessing(true);
    setProgress(0);
    
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < selectedTasks.length; i++) {
        const task = selectedTasks[i];
        
        try {
          const { error } = await supabase
            .from('tasks')
            .update({ 
              priority, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', task.id);

          if (error) throw error;
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Failed to update priority for ${task.name}: ${error.message}`);
        }
        
        setProgress(((i + 1) / selectedTasks.length) * 100);
      }
      
      setResults({ success, failed, errors });
      onTasksUpdated();
    } catch (error) {
      console.error('Bulk priority update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTasks, onTasksUpdated]);

  const handleBulkScheduleUpdate = useCallback(async (scheduleData: { 
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
  }) => {
    setIsProcessing(true);
    setProgress(0);
    
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < selectedTasks.length; i++) {
        const task = selectedTasks[i];
        
        try {
          const updates: Partial<Task> = {
            ...scheduleData,
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', task.id);

          if (error) throw error;
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Failed to schedule ${task.name}: ${error.message}`);
        }
        
        setProgress(((i + 1) / selectedTasks.length) * 100);
      }
      
      setResults({ success, failed, errors });
      onTasksUpdated();
    } catch (error) {
      console.error('Bulk schedule update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTasks, onTasksUpdated]);

  const handleBulkDelete = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);
    
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < selectedTasks.length; i++) {
        const task = selectedTasks[i];
        
        try {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', task.id);

          if (error) throw error;
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Failed to delete ${task.name}: ${error.message}`);
        }
        
        setProgress(((i + 1) / selectedTasks.length) * 100);
      }
      
      setResults({ success, failed, errors });
      onSelectionChange([]); // Clear selection
      onTasksUpdated();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTasks, onTasksUpdated, onSelectionChange]);

  const handleBulkClone = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);
    
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < selectedTasks.length; i++) {
        const task = selectedTasks[i];
        
        try {
          const clonedTask = {
            ...task,
            id: undefined, // Let Supabase generate new ID
            name: `${task.name} (Copy)`,
            status: 'Pending' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('tasks')
            .insert([clonedTask]);

          if (error) throw error;
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Failed to clone ${task.name}: ${error.message}`);
        }
        
        setProgress(((i + 1) / selectedTasks.length) * 100);
      }
      
      setResults({ success, failed, errors });
      onTasksUpdated();
    } catch (error) {
      console.error('Bulk clone failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTasks, onTasksUpdated]);

  const handleBulkExport = useCallback(() => {
    const exportData = selectedTasks.map(task => ({
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to,
      vehicle_id: task.vehicle_id,
      estimated_duration: task.estimated_duration,
      start_time: task.start_time,
      end_time: task.end_time,
      start_date: task.start_date,
      end_date: task.end_date,
      tags: task.tags
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedTasks]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Bulk Task Operations</h2>
                <p className="text-indigo-100">
                  Manage {selectedTasks.length} selected task{selectedTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {!operation && !isProcessing && !results && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Choose Bulk Operation
                </h3>
                <p className="text-gray-600">
                  Select an operation to apply to all {selectedTasks.length} selected tasks
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Operations */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Status Updates</span>
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleBulkStatusUpdate('In Progress')}
                      className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Mark as In Progress
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate('Completed')}
                      className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Mark as Completed
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate('Blocked')}
                      className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Mark as Blocked
                    </button>
                  </div>
                </div>

                {/* Assignment Operations */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Assignment</span>
                  </h4>
                  <div className="space-y-2">
                    <select
                      onChange={(e) => e.target.value && handleBulkAssignment(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      defaultValue=""
                    >
                      <option value="">Assign to...</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.name}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority Operations */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Priority</span>
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleBulkPriorityUpdate('High')}
                      className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Set High Priority
                    </button>
                    <button
                      onClick={() => handleBulkPriorityUpdate('Medium')}
                      className="w-full px-3 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Set Medium Priority
                    </button>
                    <button
                      onClick={() => handleBulkPriorityUpdate('Low')}
                      className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Set Low Priority
                    </button>
                  </div>
                </div>

                {/* Scheduling Operations */}
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h4 className="font-semibold text-teal-900 mb-3 flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Scheduling</span>
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setOperation('schedule')}
                      className="w-full px-3 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                    >
                      Bulk Schedule
                    </button>
                  </div>
                </div>

                {/* Data Operations */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Data Operations</span>
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleBulkExport}
                      className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Tasks</span>
                    </button>
                    <button
                      onClick={handleBulkClone}
                      className="w-full px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Clone Tasks</span>
                    </button>
                  </div>
                </div>

                {/* Destructive Operations */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-3 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Destructive</span>
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setOperation('confirm-delete')}
                      className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Tasks</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scheduling Form */}
          {operation === 'schedule' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bulk Schedule Update
                </h3>
                <p className="text-gray-600">
                  Set schedule for {selectedTasks.length} selected tasks
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={operationParams.start_date || ''}
                    onChange={(e) => setOperationParams(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={operationParams.end_date || ''}
                    onChange={(e) => setOperationParams(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={operationParams.start_time || ''}
                    onChange={(e) => setOperationParams(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={operationParams.end_time || ''}
                    onChange={(e) => setOperationParams(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setOperation('')}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkScheduleUpdate(operationParams)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Apply Schedule</span>
                </button>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {operation === 'confirm-delete' && (
            <div className="space-y-6">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Confirm Bulk Delete
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete {selectedTasks.length} selected tasks?
                </p>
                <p className="text-sm text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Tasks to be deleted:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedTasks.slice(0, 10).map(task => (
                    <div key={task.id} className="text-sm text-red-700">
                      • {task.name} ({task.status})
                    </div>
                  ))}
                  {selectedTasks.length > 10 && (
                    <div className="text-sm text-red-600 font-medium">
                      ...and {selectedTasks.length - 10} more tasks
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setOperation('')}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete {selectedTasks.length} Tasks</span>
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="space-y-6">
              <div className="text-center">
                <RefreshCw className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Tasks
                </h3>
                <p className="text-gray-600 mb-4">
                  Please wait while we update your tasks...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Operation Complete
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{results.success}</div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                
                {results.failed > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-900">{results.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                )}
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
