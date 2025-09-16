'use client'

import React, { memo, Suspense } from 'react'
import { List, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ScheduleSkeleton } from './ScheduleSkeleton'
import dynamic from 'next/dynamic'
import { useVehicleListSchedule } from '@/lib/hooks/useTaskSchedule'
import { useDataConsistency, usePageDataSubscription, useDataHealthMonitor } from '@/lib/hooks/useDataConsistency'
import { useState, useEffect } from 'react'

// Lazy load heavy components with proper loading states
const OptimizedVehicleSchedule = dynamic(() => import('./OptimizedVehicleSchedule').then(mod => ({ default: mod.default || mod })), {
  loading: () => <ScheduleSkeleton />,
  ssr: false,
})


export function VehicleSchedule() {
  // Enhanced data consistency and real-time synchronization
  const { refreshAllData, validateDataConsistency } = useDataConsistency()
  const { runHealthCheck } = useDataHealthMonitor()
  
  // Page-specific data subscription for optimized updates
  usePageDataSubscription('schedule')
  
  // Prefetch data using unified task schedule hook
  const { isLoading } = useVehicleListSchedule()
  
  // Data health monitoring state
  const [dataHealth, setDataHealth] = useState<{
    isValid: boolean;
    integrity: { passed: number; failed: number; issues: string[] };
    conflicts: any[];
    summary: { totalRecords: number; conflictsFound: number; criticalIssues: number; lastValidated: string };
  } | null>(null)
  const [showHealthWarning, setShowHealthWarning] = useState(false)
  
  // Run periodic health checks
  useEffect(() => {
    const checkHealth = async () => {
      const health = await runHealthCheck()
      setDataHealth(health)
      // Only show warning if there are actual failures or conflicts
      setShowHealthWarning(
        (!health.isValid && health.integrity.failed > 0) || 
        health.conflicts.length > 0
      )
    }
    
    // Initial health check
    checkHealth()
    
    // Periodic health checks every 2 minutes
    const healthInterval = setInterval(checkHealth, 2 * 60 * 1000)
    
    return () => clearInterval(healthInterval)
  }, [runHealthCheck])
  
  // Handle data refresh with health validation
  const handleRefreshWithValidation = async () => {
    await refreshAllData()
    const health = await validateDataConsistency()
    setDataHealth(health)
    // Only show warning if there are actual failures or conflicts
    setShowHealthWarning(
      (!health.isValid && health.integrity.failed > 0) || 
      health.conflicts.length > 0
    )
  }
  
  // Show loading skeleton while data is loading
  if (isLoading) {
    return <ScheduleSkeleton />
  }
  
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <List className="w-5 h-5 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Vehicle Schedule</h1>
                {dataHealth && (
                  <p className="text-xs text-gray-500">
                    Last validated: {new Date(dataHealth.summary.lastValidated).toLocaleTimeString()}
                    {dataHealth.summary.totalRecords > 0 && (
                      <span> • {dataHealth.summary.totalRecords} records</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            
            {/* Real-time status indicator */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  dataHealth?.isValid ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-xs text-gray-500">
                  {dataHealth?.isValid ? 'Data Synced' : 'Validating'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-screen">
        <Suspense fallback={<LoadingSpinner text="Loading schedule..." />}>
          <OptimizedVehicleSchedule />
        </Suspense>
      </div>
    </div>
  )
}
