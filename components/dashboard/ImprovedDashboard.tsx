'use client'

import React, { Suspense, useMemo, useCallback, memo } from 'react'
import dynamic from 'next/dynamic'
import { ProjectCountdown } from '../ui/ProjectCountdown'
import { ProjectTimeline } from '../ui/ProjectTimeline'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import ApiErrorBoundary from '../ui/ApiErrorBoundary'
import { DashboardSkeleton } from './DashboardSkeleton'

// Lazy load components for better performance with preload hints
const ProjectStats = dynamic(() => import('./ImprovedProjectStats'), {
  loading: () => <LoadingSpinner text="Loading statistics..." />,
  ssr: false,
})

const LocationOverview = dynamic(() => import('./ImprovedLocationOverview'), {
  loading: () => <LoadingSpinner text="Loading locations..." />,
  ssr: false,
})

// Memoized project overview component to prevent unnecessary re-renders
const ProjectOverview = memo(({ projectStats }: { projectStats: any }) => {
  if (!projectStats) return null
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{projectStats.vehicles.total}</div>
          <div className="text-sm text-gray-600">Total Vehicles</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{projectStats.vehicles.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600">{projectStats.tasks.total}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">{projectStats.teamMemberCount}</div>
          <div className="text-sm text-gray-600">Team Members</div>
        </div>
      </div>
      
      {/* Optimized Progress Bar with memoized calculation */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">{projectStats.projectProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, projectStats.projectProgress))}%` }}
          />
        </div>
      </div>
    </div>
  )
})

ProjectOverview.displayName = 'ProjectOverview'

export const ImprovedDashboard = memo(function ImprovedDashboard() {
  // Use optimized dashboard hook that handles all data fetching and memoization
  const {
    currentStartDate,
    currentEndDate,
    projectStatus,
    projectStats,
    projectSettings,
    isLoading,
    hasError,
    isDataReady
  } = useDashboard()

  // Memoized refresh handler to prevent unnecessary re-renders
  const handleDataRefresh = useCallback(() => {
    // Refresh handled automatically by unified data system
    // Force a hard refresh if needed
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }, [])

  // Early return for error state with better error handling
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load dashboard data. Please check your connection.</p>
          <div className="space-y-2">
            <button 
              onClick={handleDataRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full"
            >
              Reload Dashboard
            </button>
            <p className="text-xs text-gray-500">Check your internet connection and Supabase configuration</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Show loading skeleton for better UX
  if (isLoading) {
    return <DashboardSkeleton />
  }
  
  return (
    <ApiErrorBoundary onRetry={handleDataRefresh}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Monitor project progress and manage installation schedules
          </p>
        </div>

        {/* Project Countdown */}
        <ProjectCountdown 
          startDate={currentStartDate}
          endDate={currentEndDate}
          projectStatus={projectStatus}
          onCountdownComplete={() => {
            // Project started - could trigger analytics or notifications
            // Removed console.log for production
          }}
        />

        {/* Project Timeline - Show project status and vehicle scheduling */}
        <ProjectTimeline 
          projectSettings={projectSettings}
          projectStatus={projectStatus}
        />

        {/* Main Content Grid with better loading states */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Suspense fallback={<div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"><div className="h-32 bg-gray-100 rounded"></div></div>}>
            <ProjectStats />
          </Suspense>
          <Suspense fallback={<div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"><div className="h-32 bg-gray-100 rounded"></div></div>}>
            <LocationOverview />
          </Suspense>
        </div>

        {/* Optimized Project Overview with memoization */}
        <ProjectOverview projectStats={projectStats} />
      </div>
    </ApiErrorBoundary>
  )
})

ImprovedDashboard.displayName = 'ImprovedDashboard'
