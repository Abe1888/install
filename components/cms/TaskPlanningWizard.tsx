'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Settings,
  Target,
  Zap,
  Brain,
  Save,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  Activity,
  MapPin,
  FileText,
  Star
} from 'lucide-react';
import { useTaskPlanning, useTaskTemplates } from '@/lib/hooks/useTaskPlanning';
import { Task, TaskWizardState, TaskTemplate } from '@/lib/supabase/types';

interface TaskPlanningWizardProps {
  onClose: () => void;
  onComplete: (tasks: Task[]) => void;
}

export function TaskPlanningWizard({ onClose, onComplete }: TaskPlanningWizardProps) {
  const {
    wizardState,
    conflicts,
    metrics,
    isAnalyzing,
    isSaving,
    isLoading,
    nextStep,
    previousStep,
    updateWizardState,
    selectVehicle,
    selectAllVehicles,
    clearVehicleSelection,
    addCustomTask,
    removeCustomTask,
    updateCustomTask,
    analyzeConflicts,
    resolveConflicts,
    optimizeSchedule,
    saveTasks,
    vehicles,
    teamMembers
  } = useTaskPlanning();

  const { templates, isLoading: templatesLoading } = useTaskTemplates();

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    name: '',
    description: '',
    priority: 'Medium' as Task['priority'],
    estimated_duration: 60,
    assigned_to: ''
  });

  // Predefined tasks with default settings - moved to main component
  const predefinedTasks = [
    {
      id: 'fuel-sensor-installation',
      name: 'Fuel Sensor Installation',
      description: 'Install and connect fuel level sensors to the vehicle fuel tank',
      estimatedDuration: 45,
      priority: 'High' as const,
      required: true
    },
    {
      id: 'vehicle-inspection',
      name: 'Vehicle Inspection',
      description: 'Conduct pre-installation inspection of vehicle systems',
      estimatedDuration: 30,
      priority: 'Medium' as const,
      required: false
    },
    {
      id: 'gps-installation',
      name: 'GPS Installation',
      description: 'Install GPS tracking device and establish connectivity',
      estimatedDuration: 60,
      priority: 'High' as const,
      required: true
    },
    {
      id: 'system-configuration',
      name: 'System Configuration',
      description: 'Configure device settings and network connectivity',
      estimatedDuration: 40,
      priority: 'High' as const,
      required: true
    },
    {
      id: 'fuel-sensor-calibration',
      name: 'Fuel Sensor Calibration',
      description: 'Calibrate fuel sensors for accurate readings',
      estimatedDuration: 35,
      priority: 'Medium' as const,
      required: false
    },
    {
      id: 'quality-assurance',
      name: 'Quality Assurance',
      description: 'Perform final testing and quality checks',
      estimatedDuration: 25,
      priority: 'Medium' as const,
      required: false
    },
    {
      id: 'documentation',
      name: 'Documentation',
      description: 'Complete installation documentation and paperwork',
      estimatedDuration: 20,
      priority: 'Low' as const,
      required: false
    }
  ];
  
  const [selectedTasks, setSelectedTasks] = useState<string[]>(
    predefinedTasks.filter(task => task.required).map(task => task.id)
  );
  
  const [taskSchedules, setTaskSchedules] = useState<Record<string, { startTime: string; endTime: string; assignee: string }>>({});

  // Handle wizard completion
  const handleComplete = useCallback(async () => {
    const result = await saveTasks();
    if (result.success) {
      const allTasks = [...wizardState.customTasks, ...(wizardState.taskTemplate?.tasks || [])];
      onComplete(allTasks as Task[]);
    }
  }, [saveTasks, wizardState, onComplete]);

  // Helper functions for task management
  const toggleTask = useCallback((taskId: string) => {
    const task = predefinedTasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (task.required) return; // Can't unselect required tasks
    
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
      setTaskSchedules(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
    } else {
      setSelectedTasks(prev => [...prev, taskId]);
    }
  }, [selectedTasks, predefinedTasks]);
  
  const updateTaskSchedule = useCallback((taskId: string, field: 'startTime' | 'endTime' | 'assignee', value: string) => {
    setTaskSchedules(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
  }, []);
  
  const validateTaskSchedules = useCallback(() => {
    return selectedTasks.every(taskId => {
      const schedule = taskSchedules[taskId];
      return schedule && schedule.startTime && schedule.endTime && schedule.assignee;
    });
  }, [selectedTasks, taskSchedules]);

  // Add custom task
  const handleAddCustomTask = useCallback(() => {
    if (!newTaskForm.name.trim()) return;

    addCustomTask({
      ...newTaskForm,
      vehicle_id: wizardState.selectedVehicles[0] || '',
      status: 'Scheduled'
    });

    setNewTaskForm({
      name: '',
      description: '',
      priority: 'Medium',
      estimated_duration: 60,
      assigned_to: ''
    });
  }, [newTaskForm, addCustomTask, wizardState.selectedVehicles]);

  // Select template
  const handleSelectTemplate = useCallback((template: TaskTemplate) => {
    updateWizardState({ taskTemplate: template });
    nextStep();
  }, [updateWizardState, nextStep]);

  // Wizard steps configuration
  const steps = [
    {
      id: 1,
      title: 'Select Vehicles',
      description: 'Choose which vehicles need task scheduling',
      icon: Truck
    },
    {
      id: 2,
      title: 'Choose Tasks',
      description: 'Select installation tasks and set schedules',
      icon: CheckSquare
    },
    {
      id: 3,
      title: 'Configure Schedule',
      description: 'Set timing, assignments, and scheduling preferences',
      icon: Calendar
    },
    {
      id: 4,
      title: 'Review & Optimize',
      description: 'Review conflicts and optimize the schedule',
      icon: Brain
    },
    {
      id: 5,
      title: 'Confirm & Save',
      description: 'Final review and save the task schedule',
      icon: Save
    }
  ];

  const currentStep = steps.find(s => s.id === wizardState.step) || steps[0];

  if (isLoading || templatesLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Task Planner</h3>
            <p className="text-sm text-gray-600">Preparing your scheduling workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Easy Task Wizard</h2>
                <p className="text-blue-100">Smart task planning and scheduling</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === wizardState.step;
              const isCompleted = step.id < wizardState.step;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 bg-opacity-80 text-white'
                        : 'text-blue-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-blue-200 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {wizardState.step === 1 && <VehicleSelectionStep />}
          {wizardState.step === 2 && <TemplateSelectionStep />}
          {wizardState.step === 3 && <ScheduleConfigurationStep />}
          {wizardState.step === 4 && <ReviewOptimizeStep />}
          {wizardState.step === 5 && <ConfirmSaveStep />}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {metrics.totalTasks > 0 && (
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <CheckSquare className="w-4 h-4" />
                    <span>{metrics.totalTasks} tasks</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.round(metrics.totalDuration / 60)}h {metrics.totalDuration % 60}m</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{Math.round(metrics.resourceUtilization)}% utilization</span>
                  </div>
                  {conflicts.length > 0 && (
                    <div className="flex items-center space-x-1 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{conflicts.length} conflicts</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={previousStep}
                disabled={wizardState.step === 1}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              {wizardState.step < 5 ? (
                <button
                  onClick={() => {
                    // For step 2, ensure we have valid task selection and schedules
                    if (wizardState.step === 2) {
                      // Get all selected tasks with schedules
                      const tasksToAdd: Partial<Task>[] = [];
                      
                      selectedTasks.forEach(taskId => {
                        const predefinedTask = predefinedTasks.find(t => t.id === taskId);
                        const schedule = taskSchedules[taskId];
                        
                        if (predefinedTask && schedule) {
                          tasksToAdd.push({
                            id: taskId,
                            name: predefinedTask.name,
                            description: predefinedTask.description,
                            estimated_duration: predefinedTask.estimatedDuration,
                            priority: predefinedTask.priority as Task['priority'],
                            start_time: schedule.startTime,
                            end_time: schedule.endTime,
                            assigned_to: schedule.assignee,
                            vehicle_id: wizardState.selectedVehicles[0] || '',
                            status: 'Scheduled' as Task['status']
                          });
                        }
                      });
                      
                      // Update wizard state with selected tasks
                      updateWizardState({ 
                        customTasks: [...wizardState.customTasks, ...tasksToAdd] 
                      });
                    }
                    
                    nextStep();
                  }}
                  disabled={
                    (wizardState.step === 1 && wizardState.selectedVehicles.length === 0) ||
                    (wizardState.step === 2 && selectedTasks.length === 0 && wizardState.customTasks.length === 0) ||
                    (wizardState.step === 2 && selectedTasks.length > 0 && !validateTaskSchedules())
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={isSaving || conflicts.filter(c => c.severity === 'critical').length > 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save Tasks'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 1: Vehicle Selection
  function VehicleSelectionStep() {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <Truck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Vehicles</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the vehicles that need task scheduling. You can select multiple vehicles to create coordinated installation plans.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h4 className="text-lg font-semibold text-gray-900">Available Vehicles</h4>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {vehicles.length} total
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={selectAllVehicles}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearVehicleSelection}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => {
            const isSelected = wizardState.selectedVehicles.includes(vehicle.id);
            
            return (
              <div
                key={vehicle.id}
                onClick={() => selectVehicle(vehicle.id)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{vehicle.id}</h5>
                      <p className="text-sm text-gray-600">{vehicle.type}</p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{vehicle.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Day {vehicle.day}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehicle.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.status}
                    </span>
                    <div className="text-xs text-gray-500">
                      {vehicle.gps_required} GPS • {vehicle.fuel_sensors} Sensors
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {wizardState.selectedVehicles.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h5 className="font-semibold text-blue-900">
                {wizardState.selectedVehicles.length} Vehicle{wizardState.selectedVehicles.length > 1 ? 's' : ''} Selected
              </h5>
            </div>
            <p className="text-sm text-blue-700">
              Ready to proceed with task planning for the selected vehicles.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Task Selection (Checklist)
  function TemplateSelectionStep() {
    const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');

    return (
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <CheckSquare className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Tasks</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select the tasks you need for installation and set their schedule. Start and end times are required for each task.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('predefined')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'predefined'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Select Tasks
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'custom'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Custom Tasks
          </button>
        </div>

        {/* Predefined Tasks Tab */}
        {activeTab === 'predefined' && (
          <div className="space-y-6">
            {/* Task Selection Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                Installation Tasks ({selectedTasks.length} selected)
              </h4>
              <div className="text-sm text-gray-600">
                <span className="text-red-600">*</span> Required tasks cannot be deselected
              </div>
            </div>
            
            {/* Task Checklist */}
            <div className="space-y-4">
              {predefinedTasks.map((task) => {
                const isSelected = selectedTasks.includes(task.id);
                const schedule = taskSchedules[task.id] || { startTime: '', endTime: '', assignee: '' };
                
                return (
                  <div
                    key={task.id}
                    className={`border rounded-lg transition-all duration-200 ${
                      isSelected
                        ? task.required
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Task Header */}
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTask(task.id)}
                            disabled={task.required}
                            className={`w-4 h-4 rounded border-gray-300 ${
                              task.required
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-green-600'
                            } focus:ring-2 focus:ring-offset-0 ${
                              task.required ? 'focus:ring-blue-500' : 'focus:ring-green-500'
                            }`}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-semibold text-gray-900">{task.name}</h5>
                            {task.required && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                Required
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              task.priority === 'High' ? 'bg-red-100 text-red-800' :
                              task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>~{task.estimatedDuration} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Task Schedule Details (only if selected) */}
                    {isSelected && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <h6 className="text-sm font-medium text-gray-900 mb-3">
                          Schedule Details <span className="text-red-500">*</span>
                        </h6>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Start Time <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="time"
                              value={schedule.startTime}
                              onChange={(e) => updateTaskSchedule(task.id, 'startTime', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              End Time <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="time"
                              value={schedule.endTime}
                              onChange={(e) => updateTaskSchedule(task.id, 'endTime', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Assignee <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={schedule.assignee}
                              onChange={(e) => updateTaskSchedule(task.id, 'assignee', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Select assignee...</option>
                              {teamMembers.map(member => (
                                <option key={member.id} value={member.name}>{member.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        {/* Validation Warning */}
                        {(!schedule.startTime || !schedule.endTime || !schedule.assignee) && (
                          <div className="mt-2 text-xs text-red-600 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>All schedule fields are required</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Schedule Validation Summary */}
            {selectedTasks.length > 0 && (
              <div className={`p-4 rounded-lg border ${
                validateTaskSchedules()
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {validateTaskSchedules() ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  <h6 className={`font-semibold ${
                    validateTaskSchedules() ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    {validateTaskSchedules() ? 'All Tasks Scheduled' : 'Schedule Incomplete'}
                  </h6>
                </div>
                <p className={`text-sm ${
                  validateTaskSchedules() ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {validateTaskSchedules()
                    ? `${selectedTasks.length} tasks are ready with complete schedules.`
                    : 'Please set start time, end time, and assignee for all selected tasks.'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Custom Tasks Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-6">
            {/* Add Task Form */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Add Custom Task</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                  <input
                    type="text"
                    value={newTaskForm.name}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, name: e.target.value })}
                    placeholder="Enter task name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                  <select
                    value={newTaskForm.assigned_to}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select assignee...</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  placeholder="Task description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as Task['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newTaskForm.estimated_duration}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, estimated_duration: Number(e.target.value) })}
                    min="15"
                    step="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <button
                onClick={handleAddCustomTask}
                disabled={!newTaskForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Custom Tasks List */}
            {wizardState.customTasks.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Custom Tasks ({wizardState.customTasks.length})</h4>
                
                {wizardState.customTasks.map((task, index) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-medium text-gray-900">{task.name}</h5>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {task.assigned_to && (
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{task.assigned_to}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimated_duration}min</span>
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeCustomTask(task.id!)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Step 3: Schedule Configuration
  function ScheduleConfigurationStep() {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Configure Schedule</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Set up timing preferences, working hours, and assignment strategies for optimal task scheduling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Settings */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Basic Timing</span>
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={wizardState.startDateTime.slice(0, 16)}
                    onChange={(e) => updateWizardState({ startDateTime: e.target.value + ':00.000Z' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduling Mode</label>
                  <select
                    value={wizardState.schedulingMode}
                    onChange={(e) => updateWizardState({ schedulingMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="sequential">Sequential (one after another)</option>
                    <option value="parallel">Parallel (simultaneous)</option>
                    <option value="custom">Custom timing</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Assignment Strategy</span>
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Method</label>
                  <select
                    value={wizardState.assignmentStrategy}
                    onChange={(e) => updateWizardState({ assignmentStrategy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="auto">Auto-assign based on availability</option>
                    <option value="load-balance">Load balance across team</option>
                    <option value="manual">Manual assignment</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conflict Resolution</label>
                  <select
                    value={wizardState.conflictResolution}
                    onChange={(e) => updateWizardState({ conflictResolution: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="adjust">Auto-adjust timing</option>
                    <option value="skip">Skip conflicting tasks</option>
                    <option value="ask">Ask for resolution</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Working Hours</span>
              </h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={wizardState.workingHours.start}
                      onChange={(e) => updateWizardState({
                        workingHours: { ...wizardState.workingHours, start: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={wizardState.workingHours.end}
                      onChange={(e) => updateWizardState({
                        workingHours: { ...wizardState.workingHours, end: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
                  <div className="flex space-x-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => {
                      const isSelected = wizardState.workingHours.workDays.includes(index);
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            const workDays = isSelected 
                              ? wizardState.workingHours.workDays.filter(d => d !== index)
                              : [...wizardState.workingHours.workDays, index];
                            updateWizardState({
                              workingHours: { ...wizardState.workingHours, workDays }
                            });
                          }}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Advanced Options</span>
              </h4>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>Show Advanced Options</span>
                  <ArrowRight className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-90' : ''}`} />
                </button>
                
                {showAdvancedOptions && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notifications"
                        checked={wizardState.notifications.enabled}
                        onChange={(e) => updateWizardState({
                          notifications: { ...wizardState.notifications, enabled: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="notifications" className="text-sm text-gray-700">
                        Enable task notifications
                      </label>
                    </div>
                    
                    <button
                      onClick={optimizeSchedule}
                      className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Brain className="w-4 h-4" />
                      <span>Optimize Schedule</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Review & Optimize
  function ReviewOptimizeStep() {
    const allTasks = [...wizardState.customTasks, ...(wizardState.taskTemplate?.tasks || [])];

    return (
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <Brain className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Review & Optimize</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Review your task schedule, resolve any conflicts, and optimize for the best efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics Overview */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Schedule Metrics</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="font-medium">{metrics.totalTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Duration</span>
                  <span className="font-medium">
                    {Math.floor(metrics.totalDuration / 60)}h {metrics.totalDuration % 60}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Resource Usage</span>
                  <span className="font-medium">{Math.round(metrics.resourceUtilization)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Est. Completion</span>
                  <span className="font-medium text-xs">
                    {metrics.estimatedCompletionDate || 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div className="bg-white border border-red-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">Conflicts Found</h4>
                </div>
                
                <div className="space-y-3">
                  {conflicts.slice(0, 3).map((conflict) => (
                    <div key={conflict.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-900">{conflict.description}</p>
                          <p className="text-xs text-red-600 mt-1">Severity: {conflict.severity}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          conflict.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          conflict.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {conflict.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {conflicts.length > 3 && (
                    <p className="text-xs text-gray-500">+{conflicts.length - 3} more conflicts...</p>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-red-200">
                  <button
                    onClick={analyzeConflicts}
                    disabled={isAnalyzing}
                    className="w-full px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>{isAnalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
                  </button>
                  
                  {conflicts.filter(c => c.auto_resolvable).length > 0 && (
                    <button
                      onClick={() => resolveConflicts(conflicts.filter(c => c.auto_resolvable))}
                      className="w-full mt-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Auto-resolve</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {conflicts.length === 0 && (
              <div className="bg-white border border-green-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">No Conflicts</h4>
                </div>
                <p className="text-sm text-green-700">Your schedule is optimized and ready to save!</p>
              </div>
            )}
          </div>

          {/* Task Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Task Schedule</h4>
                <button
                  onClick={analyzeConflicts}
                  disabled={isAnalyzing}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  <span>Analyze</span>
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allTasks.map((task, index) => (
                  <div key={task.id || index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-medium text-gray-900">{task.name}</h5>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="space-y-1">
                            {task.vehicle_id && (
                              <div className="flex items-center space-x-1">
                                <Truck className="w-3 h-3" />
                                <span>Vehicle: {Array.isArray(task.vehicle_id) ? task.vehicle_id.join(', ') : task.vehicle_id}</span>
                              </div>
                            )}
                            {task.assigned_to && (
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>Assignee: {Array.isArray(task.assigned_to) ? task.assigned_to.join(', ') : task.assigned_to}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            {task.start_time && task.end_time && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{task.start_time} - {task.end_time}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>Duration: {task.estimated_duration || 60}min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {allTasks.length === 0 && (
                  <div className="text-center py-8">
                    <CheckSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No tasks scheduled yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Confirm & Save
  function ConfirmSaveStep() {
    const allTasks = [...wizardState.customTasks, ...(wizardState.taskTemplate?.tasks || [])];
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
    
    return (
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <Save className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Save</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Review your final task schedule before saving. All tasks will be created and team members notified.
          </p>
        </div>

        {criticalConflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-900">Critical Issues Found</h4>
            </div>
            <p className="text-sm text-red-700 mb-3">
              You have {criticalConflicts.length} critical conflict(s) that must be resolved before saving.
            </p>
            <button
              onClick={() => previousStep()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Go Back to Resolve
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Schedule Summary</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Selected Vehicles</span>
                  <span className="font-medium">{wizardState.selectedVehicles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="font-medium">{allTasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Template Used</span>
                  <span className="font-medium text-sm">
                    {wizardState.taskTemplate?.name || 'Custom Tasks'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Start Date</span>
                  <span className="font-medium text-sm">
                    {new Date(wizardState.startDateTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estimated Duration</span>
                  <span className="font-medium">
                    {Math.floor(metrics.totalDuration / 60)}h {metrics.totalDuration % 60}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conflicts</span>
                  <span className={`font-medium ${conflicts.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {conflicts.length === 0 ? 'None' : conflicts.length}
                  </span>
                </div>
              </div>
            </div>

            {wizardState.notifications.enabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Notifications Enabled</span>
                </div>
                <p className="text-sm text-blue-700">
                  Team members will receive notifications {wizardState.notifications.timing.join(' and ')} minutes before their tasks.
                </p>
              </div>
            )}
          </div>

          {/* Task List Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Tasks to Create</h4>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {allTasks.map((task, index) => (
                <div key={task.id || index} className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 text-sm">{task.name}</h5>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.priority === 'High' ? 'bg-red-100 text-red-800' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      {task.vehicle_id && (
                        <div className="flex items-center space-x-1 mb-1">
                          <Truck className="w-3 h-3" />
                          <span>Vehicle {Array.isArray(task.vehicle_id) ? task.vehicle_id[0] : task.vehicle_id}</span>
                        </div>
                      )}
                      {task.assigned_to && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{Array.isArray(task.assigned_to) ? task.assigned_to[0] : task.assigned_to}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div>{task.estimated_duration || 60}min</div>
                      {task.start_time && (
                        <div className="text-gray-500">{task.start_time}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
