'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { AlertTriangle, Database, RefreshCw } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface ConnectionGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ConnectionGuard({ children, fallback }: ConnectionGuardProps) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    // Check configuration on client side only
    if (typeof window !== 'undefined') {
      const checkConfig = async () => {
        try {
          console.log('ConnectionGuard: Starting configuration check...')
          const configured = isSupabaseConfigured()
          console.log('ConnectionGuard: Configuration result:', configured)
          setIsConfigured(configured)
        } catch (error) {
          console.error('Error checking Supabase configuration:', error)
          setIsConfigured(false)
        } finally {
          console.log('ConnectionGuard: Check completed, setting isChecking to false')
          setIsChecking(false)
        }
      }
      
      // Small delay to prevent hydration issues
      const timer = setTimeout(checkConfig, 100)
      
      // Safety timeout to prevent infinite loading
      const safetyTimer = setTimeout(() => {
        console.warn('ConnectionGuard: Safety timeout triggered, forcing check completion')
        setIsChecking(false)
        setIsConfigured(true) // Assume configured if check takes too long
      }, 5000) // 5 second timeout
      
      return () => {
        clearTimeout(timer)
        clearTimeout(safetyTimer)
      }
    }
  }, [])
  
  // Show loading state during initial check
  if (isChecking || isConfigured === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="card max-w-lg w-full text-center">
          <div className="card-body">
            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing Application</h2>
            <p className="text-sm text-gray-600">Checking database configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isConfigured === false) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="card max-w-lg w-full">
          <div className="card-body text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Configuration Required</h2>
            <p className="text-sm text-gray-600 mb-6">
              To use this application, you need to configure your Supabase database connection.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Required Environment Variables:</h3>
              <div className="space-y-1 text-xs font-mono text-gray-700">
                <div>NEXT_PUBLIC_SUPABASE_URL=your_project_url</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <p>
                1. Create a Supabase project at{' '}
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 underline"
                >
                  supabase.com
                </a>
              </p>
              <p>2. Copy your project URL and anon key from Settings → API</p>
              <p>3. Add them to your .env.local file</p>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload After Setup
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}