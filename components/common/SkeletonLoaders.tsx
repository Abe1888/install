'use client';

import React from 'react';

// Base skeleton component with common styles
const SkeletonBase: React.FC<{ 
  className?: string; 
  children?: React.ReactNode;
}> = ({ className = '', children }) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
);

// Generic skeleton box
export const SkeletonBox: React.FC<{ 
  width?: string; 
  height?: string; 
  className?: string; 
}> = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <div className={`bg-gray-200 rounded ${width} ${height} ${className}`} />
);

// Timeline Skeleton Loader
export const TimelineSkeleton: React.FC = () => (
  <SkeletonBase className="space-y-6">
    {/* Header Skeleton */}
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonBox width="w-8" height="h-8" className="rounded-md" />
            <div className="space-y-2">
              <SkeletonBox width="w-48" height="h-5" />
              <SkeletonBox width="w-64" height="h-4" />
            </div>
          </div>
          <SkeletonBox width="w-32" height="h-10" className="rounded-md" />
        </div>
      </div>
    </div>

    {/* Timeline Content Skeleton */}
    <div className="relative space-y-8">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
      
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="relative">
          {/* Timeline Dot */}
          <div className="absolute left-6 w-4 h-4 rounded-full bg-slate-300"></div>
          
          {/* Timeline Content */}
          <div className="ml-16">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              {/* Day Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SkeletonBox width="w-6" height="h-6" className="rounded-md" />
                    <div className="space-y-2">
                      <SkeletonBox width="w-40" height="h-4" />
                      <SkeletonBox width="w-56" height="h-3" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <SkeletonBox width="w-12" height="h-6" />
                    <SkeletonBox width="w-16" height="h-3" />
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <SkeletonBox width="w-full" height="h-2" className="rounded-full" />
                </div>
              </div>
              
              {/* Vehicles Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }, (_, vehicleIndex) => (
                    <div key={vehicleIndex} className="border border-slate-200 rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <SkeletonBox width="w-4" height="h-4" />
                          <SkeletonBox width="w-16" height="h-4" />
                        </div>
                        <SkeletonBox width="w-4" height="h-4" className="rounded-full" />
                      </div>
                      
                      <div className="space-y-1">
                        <SkeletonBox width="w-20" height="h-3" />
                        <SkeletonBox width="w-24" height="h-3" />
                        <SkeletonBox width="w-28" height="h-3" />
                      </div>
                      
                      <div className="mt-2">
                        <SkeletonBox width="w-16" height="h-5" className="rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </SkeletonBase>
);

// Gantt Chart Skeleton Loader
export const GanttSkeleton: React.FC = () => (
  <SkeletonBase className="space-y-6">
    {/* Header Controls Skeleton */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <SkeletonBox width="w-6" height="h-6" />
            <div className="space-y-2">
              <SkeletonBox width="w-48" height="h-5" />
              <SkeletonBox width="w-64" height="h-4" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <SkeletonBox width="w-32" height="h-10" className="rounded-md" />
            <SkeletonBox width="w-20" height="h-10" className="rounded-md" />
          </div>
        </div>
        
        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonBox key={index} width="w-full" height="h-10" className="rounded-md" />
          ))}
        </div>
      </div>
    </div>

    {/* Gantt Chart Content Skeleton */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Timeline Header */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
            <SkeletonBox width="w-16" height="h-4" />
          </div>
          <div className="flex-1 bg-gray-50 p-2">
            <div className="flex space-x-1">
              {Array.from({ length: 12 }, (_, index) => (
                <SkeletonBox key={index} width="w-16" height="h-8" className="flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Content */}
      <div className="flex">
        <div className="w-80 bg-gray-50 border-r border-gray-200">
          {Array.from({ length: 5 }, (_, groupIndex) => (
            <div key={groupIndex} className="border-b border-gray-200">
              <div className="p-3 bg-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <SkeletonBox width="w-3" height="h-3" className="rounded" />
                    <SkeletonBox width="w-32" height="h-4" />
                    <SkeletonBox width="w-8" height="h-3" />
                  </div>
                  <SkeletonBox width="w-4" height="h-4" />
                </div>
              </div>
              
              <div className="space-y-1">
                {Array.from({ length: 3 }, (_, taskIndex) => (
                  <div key={taskIndex} className="p-2 pl-6 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <SkeletonBox width="w-4" height="h-4" />
                      <div className="flex-1 space-y-1">
                        <SkeletonBox width="w-28" height="h-3" />
                        <SkeletonBox width="w-20" height="h-3" />
                      </div>
                      <SkeletonBox width="w-8" height="h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline bars area */}
        <div className="flex-1 relative bg-white p-4">
          <div className="space-y-4">
            {Array.from({ length: 8 }, (_, index) => (
              <SkeletonBox key={index} width="w-32" height="h-6" className="rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </SkeletonBase>
);

// Task Management Skeleton Loader
export const TaskSkeleton: React.FC = () => (
  <SkeletonBase className="space-y-6">
    {/* Header Skeleton */}
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonBox width="w-8" height="h-8" className="rounded-md" />
            <div className="space-y-2">
              <SkeletonBox width="w-40" height="h-5" />
              <SkeletonBox width="w-56" height="h-4" />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <SkeletonBox width="w-20" height="h-8" className="rounded-md" />
            <SkeletonBox width="w-24" height="h-8" className="rounded-md" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <SkeletonBox width="w-4" height="h-4" className="mx-auto mb-2" />
              <SkeletonBox width="w-8" height="h-6" className="mx-auto mb-1" />
              <SkeletonBox width="w-12" height="h-3" className="mx-auto" />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <SkeletonBox width="w-4" height="h-4" />
            <SkeletonBox width="w-16" height="h-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonBox key={index} width="w-full" height="h-10" className="rounded-md" />
            ))}
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-4">
              <SkeletonBox width="w-32" height="h-6" />
              <SkeletonBox width="w-48" height="h-4" />
            </div>
            
            <div className="flex items-center space-x-2">
              <SkeletonBox width="w-20" height="h-8" className="rounded-md" />
              <div className="flex items-center space-x-1">
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonBox key={index} width="w-8" height="h-8" className="rounded-md" />
                ))}
              </div>
              <SkeletonBox width="w-16" height="h-8" className="rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Task Cards Grid Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {/* Task Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 flex-1">
                <SkeletonBox width="w-4" height="h-4" />
                <div className="flex-1 space-y-2">
                  <SkeletonBox width="w-32" height="h-4" />
                  <SkeletonBox width="w-24" height="h-3" />
                </div>
              </div>
              <SkeletonBox width="w-4" height="h-4" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SkeletonBox width="w-3" height="h-3" />
                <SkeletonBox width="w-16" height="h-3" />
              </div>
              
              <div className="flex items-center space-x-2">
                <SkeletonBox width="w-12" height="h-5" className="rounded-full" />
                <SkeletonBox width="w-16" height="h-5" className="rounded-full" />
              </div>
            </div>
          </div>

          {/* Task Actions */}
          <div className="p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SkeletonBox width="w-3" height="h-3" />
                <SkeletonBox width="w-20" height="h-3" />
                <SkeletonBox width="w-3" height="h-3" />
                <SkeletonBox width="w-12" height="h-3" />
              </div>
              
              <div className="flex space-x-1">
                <SkeletonBox width="w-12" height="h-6" className="rounded-md" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </SkeletonBase>
);

// Team Management Skeleton Loader
export const TeamSkeleton: React.FC = () => (
  <SkeletonBase className="space-y-6">
    {/* Header Skeleton */}
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonBox width="w-8" height="h-8" className="rounded-md" />
            <div className="space-y-2">
              <SkeletonBox width="w-36" height="h-5" />
              <SkeletonBox width="w-48" height="h-4" />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <SkeletonBox width="w-20" height="h-8" className="rounded-md" />
            <SkeletonBox width="w-24" height="h-8" className="rounded-md" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Team Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="text-center p-4 bg-blue-50 rounded-md border border-blue-200">
              <SkeletonBox width="w-5" height="h-5" className="mx-auto mb-2" />
              <SkeletonBox width="w-8" height="h-6" className="mx-auto mb-1" />
              <SkeletonBox width="w-16" height="h-3" className="mx-auto" />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <SkeletonBox width="w-4" height="h-4" />
            <SkeletonBox width="w-24" height="h-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SkeletonBox width="w-full" height="h-10" className="rounded-md" />
            <div className="flex space-x-1">
              <SkeletonBox width="flex-1" height="h-10" className="rounded-l-md" />
              <SkeletonBox width="w-10" height="h-10" className="rounded-r-md" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Team Members Grid Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {/* Member Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-4">
              <SkeletonBox width="w-12" height="h-12" className="rounded-full" />
              
              <div className="flex-1 space-y-2">
                <SkeletonBox width="w-24" height="h-4" />
                <SkeletonBox width="w-20" height="h-3" />
                <div className="flex items-center space-x-2">
                  <SkeletonBox width="w-3" height="h-3" />
                  <SkeletonBox width="w-20" height="h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {Array.from({ length: 3 }, (_, metricIndex) => (
                <div key={metricIndex} className="text-center">
                  <SkeletonBox width="w-8" height="h-6" className="mx-auto mb-1" />
                  <SkeletonBox width="w-12" height="h-3" className="mx-auto" />
                </div>
              ))}
            </div>

            {/* Performance Badge */}
            <div className="flex justify-center mb-4">
              <SkeletonBox width="w-32" height="h-6" className="rounded-full" />
            </div>

            {/* Specializations */}
            <div className="mb-4">
              <SkeletonBox width="w-20" height="h-3" className="mb-2" />
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 3 }, (_, specIndex) => (
                  <SkeletonBox key={specIndex} width="w-16" height="h-5" className="rounded-md" />
                ))}
              </div>
            </div>

            {/* Current Tasks */}
            <div>
              <SkeletonBox width="w-24" height="h-3" className="mb-2" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, taskIndex) => (
                  <div key={taskIndex} className="bg-green-50 rounded-md p-2 text-center">
                    <SkeletonBox width="w-4" height="h-4" className="mx-auto mb-1" />
                    <SkeletonBox width="w-8" height="h-3" className="mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </SkeletonBase>
);

// Generic Data Loading Skeleton
export const DataLoadingSkeleton: React.FC<{
  title?: string;
  rows?: number;
  showHeader?: boolean;
}> = ({ title = "Loading Data", rows = 5, showHeader = true }) => (
  <SkeletonBase className="space-y-4">
    {showHeader && (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <SkeletonBox width="w-48" height="h-6" className="mb-2" />
        <SkeletonBox width="w-64" height="h-4" />
      </div>
    )}
    
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <SkeletonBox width="w-12" height="h-12" className="rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBox width="w-3/4" height="h-4" />
              <SkeletonBox width="w-1/2" height="h-3" />
            </div>
            <SkeletonBox width="w-20" height="h-8" className="rounded-md" />
          </div>
        ))}
      </div>
    </div>
  </SkeletonBase>
);

export default {
  TimelineSkeleton,
  GanttSkeleton,
  TaskSkeleton,
  TeamSkeleton,
  DataLoadingSkeleton,
  SkeletonBox,
};
