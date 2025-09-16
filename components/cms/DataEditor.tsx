"use client";

import React, { useState, useEffect } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import { supabase } from '@/lib/supabase/client';

type DataType = 'vehicles' | 'locations' | 'team_members' | 'tasks' | 'project_settings' | 'realtime_api' | 'system_status';

interface DataEditorProps {
  dataType: DataType;
  item?: any;
  onSave: (data: any) => void;
  onClose: () => void;
}

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date' | 'time';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function DataEditor({ dataType, item, onSave, onClose }: DataEditorProps) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load reference data (vehicles, team members) when needed
  useEffect(() => {
    const loadReferenceData = async () => {
      if (dataType !== 'tasks') return;
      
      setLoadingData(true);
      try {
        
        // Load vehicles
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id, type, location')
          .order('id');
          
        if (vehicleError) {
          console.error('Error loading vehicles:', vehicleError);
        } else {
          setVehicles(vehicleData || []);
        }
        
        // Load team members for assigned_to field
        const { data: teamData, error: teamError } = await supabase
          .from('team_members')
          .select('id, name, role')
          .order('name');
          
        if (teamError) {
          console.error('Error loading team members:', teamError);
        } else {
          setTeamMembers(teamData || []);
        }
      } catch (error) {
        console.error('Error loading reference data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    
    loadReferenceData();
  }, [dataType]);

  // Get form fields based on data type
  const getFormFields = (): FormField[] => {
    switch (dataType) {
      case 'vehicles':
        return [
          { key: 'type', label: 'Vehicle Type', type: 'text', required: true, placeholder: 'e.g., Truck, Van, Car' },
          { key: 'location', label: 'Location', type: 'text', required: true, placeholder: 'e.g., Warehouse A' },
          { key: 'day', label: 'Day', type: 'number', required: true, min: 1, max: 365 },
          { key: 'time_slot', label: 'Time Slot', type: 'text', required: true, placeholder: 'e.g., 09:00-17:00' },
          { key: 'status', label: 'Status', type: 'select', required: true, options: ['Pending', 'In Progress', 'Completed'] },
          { key: 'gps_required', label: 'GPS Required', type: 'number', min: 0, max: 10, placeholder: 'Number of GPS devices' },
          { key: 'fuel_sensors', label: 'Fuel Sensors', type: 'number', min: 0, max: 10 },
          { key: 'fuel_tanks', label: 'Fuel Tanks', type: 'number', min: 0, max: 5 },
        ];

      case 'locations':
        return [
          { key: 'name', label: 'Location Name', type: 'text', required: true, placeholder: 'e.g., Main Warehouse' },
          { key: 'duration', label: 'Duration (hours)', type: 'number', required: true, min: 0.5, max: 24, step: 0.5 },
          { key: 'vehicles', label: 'Number of Vehicles', type: 'number', required: true, min: 1, max: 100 },
          { key: 'gps_devices', label: 'GPS Devices', type: 'number', min: 0, max: 100 },
          { key: 'fuel_sensors', label: 'Fuel Sensors', type: 'number', min: 0, max: 100 },
        ];

      case 'team_members':
        return [
          { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., John Doe' },
          { key: 'role', label: 'Role', type: 'select', required: true, options: ['Technician', 'Specialist', 'Manager', 'Driver', 'Supervisor'] },
          { key: 'completion_rate', label: 'Completion Rate', type: 'number', required: true, min: 0, max: 1, step: 0.01, placeholder: '0.85 for 85%' },
          { key: 'average_task_time', label: 'Avg Task Time (minutes)', type: 'number', required: true, min: 1, max: 1440 },
          { key: 'quality_score', label: 'Quality Score', type: 'number', required: true, min: 0, max: 10, step: 0.1 },
        ];

      case 'tasks':
        // Create vehicle options
        const vehicleOptions = [''] // Empty option for no vehicle selection
          .concat(vehicles.map(v => `${v.id}|${v.type} (${v.location})`));
          
        // Create team member options
        const teamMemberOptions = [''] // Empty option for no assignment
          .concat(teamMembers.map(tm => `${tm.name} (${tm.role})`));
        
        return [
          { key: 'vehicle_id', label: 'Vehicle ID', type: 'select', placeholder: 'Select a vehicle', options: vehicleOptions },
          { key: 'name', label: 'Task Name', type: 'text', required: true, placeholder: 'e.g., Install GPS tracker' },
          { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed task description...' },
          { key: 'status', label: 'Status', type: 'select', required: true, options: ['Pending', 'In Progress', 'Completed', 'Blocked'] },
          { key: 'priority', label: 'Priority', type: 'select', required: true, options: ['High', 'Medium', 'Low'] },
          { key: 'assigned_to', label: 'Assigned To', type: 'select', placeholder: 'Select team member', options: teamMemberOptions },
          { key: 'installation_date', label: 'Installation Date', type: 'date' },
          { key: 'start_time', label: 'Start Time', type: 'time', placeholder: 'e.g., 09:00' },
          { key: 'end_time', label: 'End Time', type: 'time', placeholder: 'e.g., 17:00' },
        ];

      case 'project_settings':
      case 'realtime_api':
      case 'system_status':
        return []; // These types don't support traditional editing
      default:
        return [];
    }
  };

  const formFields = getFormFields();

  // Initialize form data
  useEffect(() => {
    if (item) {
      // Editing existing item
      const initialData = { ...item };
      
      // Convert date fields for form inputs
      if (initialData.installation_date) {
        initialData.installation_date = new Date(initialData.installation_date).toISOString().split('T')[0];
      }
      
      // Convert time fields for form inputs (if they come as timestamps)
      if (initialData.start_time && typeof initialData.start_time === 'string' && initialData.start_time.includes('T')) {
        initialData.start_time = new Date(initialData.start_time).toTimeString().slice(0, 5);
      }
      if (initialData.end_time && typeof initialData.end_time === 'string' && initialData.end_time.includes('T')) {
        initialData.end_time = new Date(initialData.end_time).toTimeString().slice(0, 5);
      }
      
      // For task editing, convert vehicle_id to display format for dropdown
      if (dataType === 'tasks' && initialData.vehicle_id && vehicles.length > 0) {
        const vehicle = vehicles.find(v => v.id === initialData.vehicle_id);
        if (vehicle) {
          initialData.vehicle_id = `${vehicle.id}|${vehicle.type} (${vehicle.location})`;
        }
      }
      
      // For assigned_to, try to match with team members
      if (dataType === 'tasks' && initialData.assigned_to && teamMembers.length > 0) {
        const teamMember = teamMembers.find(tm => tm.name === initialData.assigned_to);
        if (teamMember) {
          initialData.assigned_to = `${teamMember.name} (${teamMember.role})`;
        }
      }
      
      setFormData(initialData);
    } else {
      // Creating new item - set defaults
      const defaultData: any = {};
      
      formFields.forEach(field => {
        if (field.type === 'checkbox') {
          defaultData[field.key] = false;
        } else if (field.type === 'number' && field.min !== undefined) {
          // Special handling for vehicle fields to match database defaults
          if (dataType === 'vehicles' && ['gps_required', 'fuel_sensors', 'fuel_tanks'].includes(field.key)) {
            defaultData[field.key] = 1; // Match database DEFAULT 1
          } else {
            defaultData[field.key] = field.min;
          }
        } else if (field.type === 'select' && field.options) {
          defaultData[field.key] = field.options[0];
        } else if (field.type === 'time') {
          // Set default times for new tasks
          if (field.key === 'start_time') {
            defaultData[field.key] = '09:00';
          } else if (field.key === 'end_time') {
            defaultData[field.key] = '17:00';
          } else {
            defaultData[field.key] = '';
          }
        } else {
          defaultData[field.key] = '';
        }
      });
      
      setFormData(defaultData);
    }
  }, [item, dataType, vehicles, teamMembers]); // Re-run when reference data loads

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    formFields.forEach(field => {
      const value = formData[field.key];

      if (field.required && (!value && value !== 0 && value !== false)) {
        newErrors[field.key] = `${field.label} is required`;
        return;
      }

      if (field.type === 'number' && value !== undefined && value !== '') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          newErrors[field.key] = `${field.label} must be a valid number`;
        } else {
          if (field.min !== undefined && numValue < field.min) {
            newErrors[field.key] = `${field.label} must be at least ${field.min}`;
          }
          if (field.max !== undefined && numValue > field.max) {
            newErrors[field.key] = `${field.label} must be at most ${field.max}`;
          }
        }
      }

      if (field.type === 'text' && value && typeof value === 'string') {
        if (value.length < 2) {
          newErrors[field.key] = `${field.label} must be at least 2 characters`;
        }
        if (value.length > 255) {
          newErrors[field.key] = `${field.label} must be less than 255 characters`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      [key]: value
    }));

    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Process form data
      const processedData = { ...formData };
      
      // Convert numeric strings to numbers
      formFields.forEach(field => {
        if (field.type === 'number' && processedData[field.key] !== '') {
          processedData[field.key] = Number(processedData[field.key]);
        }
      });
      
      // For tasks, extract actual values from display formats
      if (dataType === 'tasks') {
        // Extract vehicle ID from display format "V001|FORD/D/P/UP RANGER (Bahir Dar)"
        if (processedData.vehicle_id && processedData.vehicle_id.includes('|')) {
          processedData.vehicle_id = processedData.vehicle_id.split('|')[0];
        } else if (processedData.vehicle_id === '') {
          processedData.vehicle_id = null; // Set to null for empty selection
        }
        
        // Extract team member name from display format "John Doe (Technician)"
        if (processedData.assigned_to && processedData.assigned_to.includes('(')) {
          processedData.assigned_to = processedData.assigned_to.split(' (')[0];
        } else if (processedData.assigned_to === '') {
          processedData.assigned_to = null; // Set to null for empty selection
        }
        
        // Filter out fields that don't exist in the database schema
        const validTaskFields = [
          'id', 'vehicle_id', 'name', 'description', 'status', 'assigned_to', 
          'priority', 'estimated_duration', 'start_date', 'end_date', 'duration_days', 
          'notes', 'tags', 'created_at', 'updated_at', 'title', 'location', 
          'category', 'installation_date', 'dependencies', 'timeslot_bucket', 
          'sub_task_order', 'duration_minutes', 'task_template_id', 'is_recurring', 
          'installation_step', 'start_time', 'end_time'
        ];
        
        Object.keys(processedData).forEach(key => {
          if (!validTaskFields.includes(key)) {
            console.warn(`Removing invalid field '${key}' from task data`);
            delete processedData[key];
          }
        });
      }

      // For vehicles, validate and filter fields to match database schema
      if (dataType === 'vehicles') {
        const validVehicleFields = [
          'id', 'type', 'location', 'day', 'time_slot', 'status', 
          'gps_required', 'fuel_sensors', 'fuel_tanks', 'created_at', 'updated_at'
        ];
        
        Object.keys(processedData).forEach(key => {
          if (!validVehicleFields.includes(key)) {
            console.warn(`Removing invalid field '${key}' from vehicle data`);
            delete processedData[key];
          }
        });
        
        // Ensure required fields are present for new vehicles
        if (!item) {
          const requiredFields = ['type', 'location', 'day', 'time_slot', 'status'];
          requiredFields.forEach(field => {
            if (!processedData[field] && processedData[field] !== 0) {
              console.error(`Missing required vehicle field: ${field}`);
            }
          });
        }
      }

      // Remove empty string values only for optional fields (preserve required fields)
      Object.keys(processedData).forEach(key => {
        const field = formFields.find(f => f.key === key);
        // Only remove empty strings for non-required fields that can safely be null
        if (processedData[key] === '' && field && !field.required) {
          // Convert to null instead of deleting to maintain data structure
          processedData[key] = null;
        }
      });

      // Add timestamps
      if (!item) {
        processedData.created_at = new Date().toISOString();
      }
      processedData.updated_at = new Date().toISOString();

      await onSave(processedData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.key] ?? '';
    const hasError = !!errors[field.key];

    const baseInputClasses = `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      hasError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
    }`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'select':
        const isLoadingOptions = dataType === 'tasks' && loadingData && 
                                 (field.key === 'vehicle_id' || field.key === 'assigned_to');
        
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className={baseInputClasses}
            required={field.required}
            disabled={isLoadingOptions}
          >
            {isLoadingOptions ? (
              <option value="">Loading...</option>
            ) : (
              <>
                {field.placeholder && <option value="">{field.placeholder}</option>}
                {field.options?.map(option => (
                  <option key={option} value={option}>
                    {option || field.placeholder || 'None'}
                  </option>
                ))}
              </>
            )}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(field.key, e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-600">Yes</span>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className={baseInputClasses}
            required={field.required}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            required={field.required}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {item ? `Edit ${dataType.slice(0, -1)}` : `Add New ${dataType.slice(0, -1)}`}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formFields.map((field) => (
                <div 
                  key={field.key}
                  className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                >
                  <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {renderField(field)}
                  
                  {errors[field.key] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors[field.key]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
