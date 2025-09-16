'use client';

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { 
  Clock, User, AlertCircle, CheckCircle2, Plus, MessageSquare, 
  Edit3, Trash2, Target, Filter, Search, ChevronDown, ChevronUp,
  Activity, AlertTriangle, RefreshCw, Send, Calendar, Tag, 
  FileText, Users, Zap, Star, TrendingUp
} from 'lucide-react';
import { useTasksSWR, useTeamMembersSWR } from '@/lib/hooks/useSWR';
import { Task } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/supabase/database';
import { useProjectSettings } from '@/lib/hooks/useProjectSettings';
import { calculateDateForDay } from '@/lib/utils/projectUtils';

interface VehicleTaskManagerProps {
  vehicleId: string;
}

const VehicleTaskManager: React.FC<VehicleTaskManagerProps> = memo(({ vehicleId }) => {
  const { data: tasks = [], isLoading: loading, mutate: refetch } = useTasksSWR();
  const { data: teamMembers = [] } = useTeamMembersSWR();
  const { settings: projectSettings } = useProjectSettings();
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'assigned_to' | 'created_at'>('priority');
  
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskDuration, setNewTaskDuration] = useState(60);
  
  const [taskComments, setTaskComments] = useState<Record<string, any[]>>({});
  
  // Get current project start date
  const projectStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0];

  // Filter tasks for this vehicle
  const vehicleTasks = useMemo(() => 
    tasks.filter(task => task.vehicle_id === vehicleId),
    [tasks, vehicleId]
  );

  // Optimized task operations
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await db.tasks.create(task);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  }, [refetch]);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    try {
      const { error } = await db.tasks.update(taskId, {
        status, 
        updated_at: new Date().toISOString() 
      });

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to update task status:', error);
      throw error;
    }
  }, [refetch]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await db.tasks.delete(taskId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }, [refetch]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await db.tasks.update(taskId, {
        ...updates, 
        updated_at: new Date().toISOString() 
      });

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }, [refetch]);

  const addComment = useCallback(async (taskId: string, text: string, author: string) => {
    try {
      const { error } = await db.comments.create({
        task_id: taskId,
        text,
        author
      });

      if (error) throw error;
      
      // Refresh comments for this task
      const updatedComments = await fetchTaskComments(taskId);
      setTaskComments(prev => ({
        ...prev,
        [taskId]: updatedComments
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }, []);

  const fetchTaskComments = useCallback(async (taskId: string) => {
    try {
      const { data, error } = await db.comments.getByTaskId(taskId);

      if (error) throw error;
      const comments = (data || []) as any[];
      return comments.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  }, []);

  // Apply filters and sorting
  const getFilteredAndSortedTasks = useMemo(() => {
    let filtered = vehicleTasks.filter(task => {
      const statusMatch = selectedStatus === 'All' || task.status === selectedStatus;
      const priorityMatch = selectedPriority === 'All' || task.priority === selectedPriority;
      const assigneeMatch = selectedAssignee === 'All' || task.assigned_to === selectedAssignee;
      const searchMatch = searchTerm === '' || 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && priorityMatch && assigneeMatch && searchMatch;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
        case 'status':
          const statusOrder = { 'In Progress': 3, 'Pending': 2, 'Completed': 1, 'Blocked': 0 };
          return statusOrder[b.status as keyof typeof statusOrder] - statusOrder[a.status as keyof typeof statusOrder];
        case 'assigned_to':
          const aAssignee = Array.isArray(a.assigned_to) ? a.assigned_to[0] || '' : a.assigned_to || '';
          const bAssignee = Array.isArray(b.assigned_to) ? b.assigned_to[0] || '' : b.assigned_to || '';
          return aAssignee.localeCompare(bAssignee);
        case 'created_at':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [vehicleTasks, selectedStatus, selectedPriority, selectedAssignee, searchTerm, sortBy]);

  // Calculate task statistics
  const getTaskStats = useMemo(() => {
    const total = vehicleTasks.length;
    const completed = vehicleTasks.filter(t => t.status === 'Completed').length;
    const inProgress = vehicleTasks.filter(t => t.status === 'In Progress').length;
    const pending = vehicleTasks.filter(t => t.status === 'Pending').length;
    const blocked = vehicleTasks.filter(t => t.status === 'Blocked').length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, inProgress, pending, blocked, completionPercentage };
  }, [vehicleTasks]);

  // Load comments for tasks
  useEffect(() => {
    const loadComments = async () => {
      if (vehicleTasks.length === 0) return;
      
      const commentsData: Record<string, any[]> = {};
      
      try {
        for (const task of vehicleTasks) {
          const comments = await fetchTaskComments(task.id);
          commentsData[task.id] = comments;
        }
        setTaskComments(commentsData);
      } catch (error) {
        console.error('Failed to load task comments:', error);
      }
    };

    loadComments();
  }, [vehicleTasks, fetchTaskComments]);

  const handleGenerateStandardTasks = useCallback(async () => {
    const standardTasks = [
      {
        name: 'Vehicle Inspection',
        description: 'Pre-installation vehicle assessment and documentation',
        priority: 'High' as const,
        estimated_duration: 30,
        tags: ['inspection', 'pre-installation']
      },
      {
        name: 'GPS Device Installation',
        description: 'Install and mount GPS tracking devices',
        priority: 'High' as const,
        estimated_duration: 60,
        tags: ['gps', 'installation']
      },
      {
        name: 'Fuel Sensor Installation',
        description: 'Install fuel level sensors in tanks',
        priority: 'High' as const,
        estimated_duration: 90,
        tags: ['fuel-sensor', 'installation']
      },
      {
        name: 'System Configuration',
        description: 'Configure GPS and sensor settings',
        priority: 'High' as const,
        estimated_duration: 45,
        tags: ['configuration', 'system']
      },
      {
        name: 'Fuel Sensor Calibration',
        description: 'Calibrate fuel sensors for accurate fuel level readings',
        priority: 'High' as const,
        estimated_duration: 60,
        tags: ['calibration', 'fuel-sensor']
      },
      {
        name: 'Quality Assurance',
        description: 'Final system testing and validation',
        priority: 'Medium' as const,
        estimated_duration: 30,
        tags: ['qa', 'testing']
      },
      {
        name: 'Documentation',
        description: 'Complete installation documentation',
        priority: 'Medium' as const,
        estimated_duration: 20,
        tags: ['documentation', 'completion']
      }
    ];

    try {
      for (const taskTemplate of standardTasks) {
        await addTask({
          vehicle_id: vehicleId,
          name: taskTemplate.name,
          description: taskTemplate.description,
          status: 'Pending',
          assigned_to: teamMembers[0]?.name || 'Unassigned',
          priority: taskTemplate.priority,
          estimated_duration: taskTemplate.estimated_duration,
          start_date: new Date().toISOString().split('T')[0],
          duration_days: 1,
          tags: taskTemplate.tags,
        });
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to generate standard tasks:', error);
    }
  }, [vehicleId, teamMembers, addTask]);

  const handleAddTask = useCallback(async () => {
    if (!newTaskName.trim() || !newTaskAssignee) return;

    try {
      await addTask({
        vehicle_id: vehicleId,
        name: newTaskName,
        description: newTaskDescription,
        status: 'Pending',
        assigned_to: newTaskAssignee,
        priority: newTaskPriority,
        estimated_duration: newTaskDuration,
        start_date: projectStartDate,
        duration_days: 1,
      });

      // Reset form
      setNewTaskName('');
      setNewTaskDescription('');
      setNewTaskAssignee('');
      setNewTaskPriority('Medium');
      setNewTaskDuration(60);
      setShowAddTask(false);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to add task:', error);
    }
  }, [newTaskName, newTaskDescription, newTaskAssignee, newTaskPriority, newTaskDuration, vehicleId, addTask, projectStartDate]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setDeleteConfirm(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to delete task:', error);
    }
  }, [deleteTask]);

  const toggleTaskExpansion = useCallback((taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (expandedTasks.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  }, [expandedTasks]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm text-slate-600">Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white min-h-full">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Task Management</h2>
                <p className="text-sm text-slate-600">Vehicle {vehicleId} • Installation Tasks</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
              
              <button
                onClick={handleGenerateStandardTasks}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <Zap className="w-4 h-4" />
                <span>Generate Tasks</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Enhanced Statistics */}
          {vehicleTasks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{getTaskStats.total}</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Done</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{getTaskStats.completed}</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">Active</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{getTaskStats.inProgress}</div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-medium text-slate-700 uppercase tracking-wide">Pending</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{getTaskStats.pending}</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Blocked</span>
                </div>
                <div className="text-2xl font-bold text-red-900">{getTaskStats.blocked}</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Progress</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{getTaskStats.completionPercentage}%</div>
              </div>
            </div>
          )}

          {/* Enhanced Filters */}
          {vehicleTasks.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filters & Search</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>

                {/* Assignee Filter */}
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="All">All Assignees</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.name}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <div className="p-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 animate-slide-up">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Add New Task</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Task Name</label>
                <input
                  type="text"
                  placeholder="Enter task name..."
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assignee</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select assignee...</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.name}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                placeholder="Task description..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    placeholder="Duration"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    min="15"
                    step="15"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTaskName.trim() || !newTaskAssignee}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List or Empty State */}
      <div className="p-6">
        {getFilteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Tasks Yet</h3>
            <p className="text-sm text-slate-600 mb-8 max-w-md mx-auto">Get started by creating tasks for this vehicle installation. You can add individual tasks or generate a standard set.</p>
            
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setShowAddTask(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Task</span>
              </button>
              
              <button
                onClick={handleGenerateStandardTasks}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <Zap className="w-4 h-4" />
                <span>Generate Standard Tasks</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredAndSortedTasks.map((task) => (
              <EnhancedTaskCard
                key={task.id}
                task={task}
                comments={taskComments[task.id] || []}
                isExpanded={expandedTasks.has(task.id)}
                isEditing={editingTask === task.id}
                onToggleExpansion={() => toggleTaskExpansion(task.id)}
                onStartEdit={() => setEditingTask(task.id)}
                onCancelEdit={() => setEditingTask(null)}
                onDelete={() => setDeleteConfirm(task.id)}
                onStatusUpdate={updateTaskStatus}
                onAddComment={(taskId, comment) => addComment(taskId, comment, 'Current User')}
                onUpdateTask={updateTask}
                teamMembers={teamMembers}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Task</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this task? All associated comments and data will be permanently removed.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VehicleTaskManager.displayName = 'VehicleTaskManager';

// Enhanced TaskCard component with nested comments
interface TaskCardProps {
  task: Task;
  comments: any[];
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpansion: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onStatusUpdate: (taskId: string, status: Task['status']) => Promise<void>;
  onAddComment: (taskId: string, comment: string) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  teamMembers: any[];
}

const EnhancedTaskCard: React.FC<TaskCardProps> = memo(({ 
  task, 
  comments, 
  isExpanded,
  isEditing,
  onToggleExpansion,
  onStartEdit,
  onCancelEdit,
  onDelete,
  onStatusUpdate, 
  onAddComment,
  onUpdateTask,
  teamMembers
}) => {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const [editForm, setEditForm] = useState({
    name: task.name,
    description: task.description || '',
    assigned_to: task.assigned_to,
    priority: task.priority,
    estimated_duration: task.estimated_duration || 60,
  });

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;
    
    setIsAddingComment(true);
    try {
      await onAddComment(task.id, newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  }, [newComment, task.id, onAddComment]);

  const handleSaveEdit = useCallback(async () => {
    try {
      await onUpdateTask(task.id, editForm);
      onCancelEdit();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to update task:', error);
    }
  }, [task.id, editForm, onUpdateTask, onCancelEdit]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'In Progress':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'Blocked':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Task Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 min-w-0 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(task.status)}
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-base font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <h3 className="text-base font-semibold text-slate-900 mb-2">{task.name}</h3>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  {isEditing ? (
                    <select
                      value={editForm.assigned_to}
                      onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                      className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{task.assigned_to}</span>
                  )}
                </div>
                
                {task.estimated_duration && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{task.estimated_duration}min</span>
                  </div>
                )}
                
                {task.created_at && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1 text-xs bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                <button
                  onClick={onStartEdit}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onToggleExpansion}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Task Description */}
        {(task.description || isEditing) && (
          <div className="mb-4">
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Task description..."
              />
            ) : (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                {task.description}
              </p>
            )}
          </div>
        )}

        {/* Task Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200"
              >
                <Tag className="w-3 h-3" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* Task Actions */}
        {!isEditing && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex space-x-2">
              {task.status === 'Pending' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'In Progress')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200"
                >
                  <Activity className="w-4 h-4" />
                  <span>Start Task</span>
                </button>
              )}
              {task.status === 'In Progress' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'Completed')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete</span>
                </button>
              )}
              {task.status === 'Blocked' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'Pending')}
                  className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Unblock
                </button>
              )}
            </div>
            
            <button
              onClick={onToggleExpansion}
              className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Expanded Details with Nested Comments */}
      {isExpanded && !isEditing && (
        <div className="border-t border-slate-200 bg-slate-50">
          {/* Task Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">Start Date</span>
                </div>
                <span className="text-slate-600">{task.start_date || 'Not set'}</span>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">Duration</span>
                </div>
                <span className="text-slate-600">{task.duration_days || 1} day(s)</span>
              </div>
            </div>
            
            {task.notes && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Notes</span>
                </div>
                <p className="text-sm text-slate-600">{task.notes}</p>
              </div>
            )}
          </div>

          {/* Comments Section - Nested under task */}
          <div className="border-t border-slate-200 bg-white">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <h4 className="text-base font-semibold text-slate-900">
                  Comments ({comments.length})
                </h4>
              </div>
              
              {/* Comments List */}
              {comments.length > 0 && (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {comments.map((comment, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-900">{comment.author}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Comment Form */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                      rows={3}
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isAddingComment}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {isAddingComment ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>{isAddingComment ? 'Adding...' : 'Add Comment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedTaskCard.displayName = 'EnhancedTaskCard';

export default VehicleTaskManager;