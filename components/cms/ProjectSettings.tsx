"use client";

import React, { useState, useMemo } from 'react';
import { 
  Calendar,
  CalendarDays,
  Settings,
  Save,
  X,
  Timer,
  Plus,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { useProjectSettings, type ProjectSettingsInput } from '@/lib/hooks/useProjectSettings';

// Notification component
interface NotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => (
  <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md ${
    type === 'success' ? 'bg-green-900 border-green-700 text-green-100' :
    type === 'error' ? 'bg-red-900 border-red-700 text-red-100' :
    'bg-blue-900 border-blue-700 text-blue-100'
  }`}>
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-3 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// Main ProjectSettings component
export const ProjectSettings: React.FC = () => {
  const { settings, loading, error, updateSettings } = useProjectSettings();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectSettingsInput>({
    project_start_date: '',
    project_end_date: null
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Calculate project statistics
  const projectStats = useMemo(() => {
    if (!settings?.project_start_date) return null;
    
    const startDate = new Date(settings.project_start_date);
    const endDate = settings.project_end_date ? new Date(settings.project_end_date) : null;
    const today = new Date();
    
    const daysSinceStart = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) + 1;
    const totalDays = settings.total_days || (endDate ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : null);
    
    return {
      startDate: startDate.toLocaleDateString(),
      endDate: endDate?.toLocaleDateString() || 'Not set',
      daysSinceStart,
      totalDays,
      progressPercentage: totalDays ? Math.min(100, Math.round((daysSinceStart / totalDays) * 100)) : null
    };
  }, [settings]);

  // Open modal with current settings
  const openModal = () => {
    setFormData({
      project_start_date: settings?.project_start_date || '',
      project_end_date: settings?.project_end_date || null
    });
    setIsModalOpen(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      project_start_date: '',
      project_end_date: null
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.project_start_date) {
      showNotification('error', 'Please enter a project start date');
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings(formData);
      showNotification('success', 'Project settings updated successfully!');
      closeModal();
    } catch (error: any) {
      console.error('Failed to save project settings:', error);
      showNotification('error', error.message || 'Failed to update project settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate duration for display in modal
  const calculateDuration = () => {
    if (!formData.project_start_date || !formData.project_end_date) return null;
    
    const start = new Date(formData.project_start_date);
    const end = new Date(formData.project_end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Project Timeline Settings</h3>
          <p className="text-sm text-gray-300">Loading project settings...</p>
        </div>
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-600 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error && !error.includes('PGRST116')) {
    return (
      <div className="p-6 space-y-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Project Timeline Settings</h3>
          <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2 text-red-200">
              Make sure the project_settings table exists in your database. 
              Run the SQL script from: sql/create_project_settings_clean.sql
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Notifications */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="p-6 space-y-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Project Timeline Settings</h3>
          <p className="text-sm text-gray-300">Configure project start/end dates and track project progress.</p>
        </div>

        {/* Current Project Settings */}
        {settings ? (
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                <span>Current Project Settings</span>
              </h4>
              <button
                onClick={openModal}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Edit Settings</span>
              </button>
            </div>

            {projectStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Project Start</span>
                  </div>
                  <div className="text-xl font-bold text-white">{projectStats.startDate}</div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-red-400 mb-2">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm font-medium">Project End</span>
                  </div>
                  <div className="text-xl font-bold text-white">{projectStats.endDate}</div>
                </div>

                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-400 mb-2">
                    <Timer className="w-4 h-4" />
                    <span className="text-sm font-medium">Progress</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    Day {projectStats.daysSinceStart}
                    {projectStats.totalDays && ` of ${projectStats.totalDays}`}
                  </div>
                  {projectStats.progressPercentage !== null && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${projectStats.progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{projectStats.progressPercentage}% Complete</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-600">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-center">
                  <TrendingUp className="w-5 h-5 text-teal-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-teal-300">Active</div>
                </div>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-center">
                  <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-blue-300">Real-time</div>
                </div>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-center">
                  <Target className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <div className="text-sm font-medium text-green-300">Tracked</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-8 text-center">
            <CalendarDays className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">No Project Settings Configured</h4>
            <p className="text-gray-400 mb-6">Set up your project timeline to track progress and manage schedules.</p>
            <button
              onClick={openModal}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Configure Project Settings</span>
            </button>
          </div>
        )}

        {/* Settings Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-600">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-teal-400" />
                  <span>Project Settings</span>
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Form Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.project_start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_start_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">The date when your project begins</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.project_end_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_end_date: e.target.value || null }))}
                    min={formData.project_start_date}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Optional end date for your project</p>
                </div>
                
                {/* Duration Display */}
                {(() => {
                  const duration = calculateDuration();
                  return duration ? (
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-teal-400 mb-2">
                        <Timer className="w-4 h-4" />
                        <span className="text-sm font-medium">Project Duration</span>
                      </div>
                      <div className="text-white text-lg font-semibold">{duration} days</div>
                    </div>
                  ) : null;
                })()}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-600">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving || !formData.project_start_date}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
