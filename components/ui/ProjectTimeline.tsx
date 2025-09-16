"use client";

import React from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Users,
  Truck,
  Target
} from 'lucide-react';
import { useVehicleScheduleAdjustment } from '@/lib/hooks/useVehicleScheduleAdjustment';

interface ProjectTimelineProps {
  projectSettings: any;
  projectStatus: { status: string; message: string };
  className?: string;
}

export function ProjectTimeline({ 
  projectSettings, 
  projectStatus, 
  className = '' 
}: ProjectTimelineProps) {
  const { scheduleStats, isAutoAdjusting } = useVehicleScheduleAdjustment();

  if (!projectSettings?.project_start_date) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Timeline</h3>
          <p className="text-gray-600 text-sm">
            Configure project dates in the Project Settings to see the timeline.
          </p>
        </div>
      </div>
    );
  }

  const startDate = new Date(projectSettings.project_start_date);
  const endDate = projectSettings.project_end_date ? new Date(projectSettings.project_end_date) : null;
  const now = new Date();
  
  const daysSinceStart = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) + 1;
  const totalDays = projectSettings.total_days || (endDate ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : null);
  const daysRemaining = endDate ? Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
  
  const progressPercentage = totalDays ? Math.min(100, Math.round((daysSinceStart / totalDays) * 100)) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-600';
      case 'completed': return 'text-blue-600';
      case 'pending': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-50 border-green-200';
      case 'completed': return 'bg-blue-50 border-blue-200';
      case 'pending': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return <TrendingUp className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Timeline</h3>
        <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getStatusBgColor(projectStatus.status)}`}>
          <div className={getStatusColor(projectStatus.status)}>
            {getStatusIcon(projectStatus.status)}
          </div>
          <span className={`font-medium ${getStatusColor(projectStatus.status)}`}>
            {projectStatus.message}
          </span>
        </div>
      </div>

      {/* Timeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Start Date</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {startDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-600 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">End Date</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {endDate ? endDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : 'Not set'}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-600 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            Day {daysSinceStart}
            {totalDays && ` of ${totalDays}`}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalDays && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Timeline Progress</span>
            <span className="text-sm text-gray-600">
              {progressPercentage}% Complete
              {daysRemaining !== null && ` • ${daysRemaining} days remaining`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                projectStatus.status === 'live' ? 'bg-green-500' :
                projectStatus.status === 'completed' ? 'bg-blue-500' : 
                'bg-orange-500'
              }`}
              style={{ width: `${progressPercentage || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Schedule Statistics */}
      {scheduleStats && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Vehicle Schedule Status</h4>
            {isAutoAdjusting && (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Auto-adjusting</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{scheduleStats.total}</div>
              <div className="text-xs text-gray-600 font-medium">Total Vehicles</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{scheduleStats.scheduled}</div>
              <div className="text-xs text-gray-600 font-medium">Scheduled</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{scheduleStats.unscheduled}</div>
              <div className="text-xs text-gray-600 font-medium">Unscheduled</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{scheduleStats.overdue}</div>
              <div className="text-xs text-gray-600 font-medium">Overdue</div>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Schedule Compliance</span>
              <span className="text-sm text-gray-600">{Math.round(scheduleStats.scheduleCompliance)}%</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${scheduleStats.scheduleCompliance}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
