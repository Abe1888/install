'use client'

import React from 'react'
import { BarChart3, Search, Calendar, ZoomIn, ZoomOut, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react'

const GanttSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Controls Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-gray-300 animate-pulse" />
              <div>
                <div className="h-5 bg-gray-300 rounded-md w-64 animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-80 animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Day Navigation Skeleton */}
              <div className="flex items-center space-x-2 border border-gray-300 rounded-md">
                <div className="p-2 bg-gray-100 rounded-l-md">
                  <ChevronLeft className="w-4 h-4 text-gray-300" />
                </div>
                <div className="px-3 py-2 bg-gray-50 animate-pulse">
                  <div className="h-4 w-10 bg-gray-300 rounded"></div>
                </div>
                <div className="p-2 bg-gray-100 rounded-r-md">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
              
              {/* Zoom Controls Skeleton */}
              <div className="flex items-center space-x-2 border border-gray-300 rounded-md">
                <div className="p-2 bg-gray-100 rounded-l-md">
                  <ZoomOut className="w-4 h-4 text-gray-300" />
                </div>
                <div className="px-2 py-2 bg-gray-50 animate-pulse">
                  <div className="h-4 w-10 bg-gray-300 rounded"></div>
                </div>
                <div className="p-2 bg-gray-100 rounded-r-md">
                  <ZoomIn className="w-4 h-4 text-gray-300" />
                </div>
              </div>
              
              {/* Today Button Skeleton */}
              <div className="px-3 py-2 bg-gray-200 rounded-md animate-pulse flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div className="h-4 w-12 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            {/* Search Input Skeleton */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
              <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
            </div>

            {/* Location Filter Skeleton */}
            <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>

            {/* Status Filter Skeleton */}
            <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>

            {/* Show Vehicles Checkbox Skeleton */}
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
            </div>

            {/* Show Tasks Checkbox Skeleton */}
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
            </div>

            {/* Refresh Button Skeleton */}
            <div className="px-4 py-2 bg-gray-200 rounded-md animate-pulse flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <div className="h-4 w-14 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Timeline Header Skeleton */}
        <div className="border-b border-gray-200 relative">
          <div className="flex">
            {/* Left panel skeleton */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
              <div className="h-5 bg-gray-300 rounded animate-pulse w-16"></div>
            </div>
            
            {/* Timeline dates skeleton */}
            <div className="flex-1 bg-gray-50 border-r border-gray-200 p-2">
              <div className="flex space-x-1">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="h-4 bg-gray-300 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Content Skeleton */}
        <div className="relative" style={{ minHeight: '600px' }}>
          <div className="flex">
            {/* Left panel for task list skeleton */}
            <div className="w-80 bg-gray-50 border-r border-gray-200">
              {Array.from({ length: 6 }, (_, groupIndex) => (
                <div key={groupIndex} className="border-b border-gray-200">
                  {/* Group header skeleton */}
                  <div className="p-3 bg-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-300 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-8"></div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 rotate-90" />
                  </div>
                  
                  {/* Task items skeleton */}
                  <div>
                    {Array.from({ length: 3 }, (_, taskIndex) => (
                      <div key={taskIndex} className="p-2 pl-6 border-b border-gray-100 flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-300 rounded animate-pulse w-24 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded animate-pulse w-16"></div>
                        </div>
                        <div className="h-2 w-6 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline area skeleton */}
            <div className="flex-1 relative bg-white" style={{ minHeight: '600px' }}>
              {/* Grid lines skeleton */}
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 border-r border-gray-100"
                  style={{ 
                    left: `${i * 80}px`,
                    height: '100%',
                    width: '1px'
                  }}
                />
              ))}

              {/* Task bars skeleton */}
              {Array.from({ length: 18 }, (_, i) => (
                <div
                  key={i}
                  className="absolute bg-gray-300 rounded animate-pulse"
                  style={{ 
                    left: `${(i % 3) * 120 + 20}px`, 
                    top: `${Math.floor(i / 3) * 40 + 100}px`, 
                    width: `${80 + (i % 4) * 40}px`, 
                    height: '28px'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse mb-3"></div>
            <div className="h-6 bg-gray-300 rounded animate-pulse w-8 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          </div>
        ))}
      </div>

      {/* Features Legend Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded animate-pulse w-40"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-8 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div>
                <div className="h-3 bg-gray-300 rounded animate-pulse w-20 mb-1"></div>
                <div className="h-2 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GanttSkeleton
