'use client'

import React, { useState } from 'react'
import { RefreshCw, Trash2, CheckCircle2 } from 'lucide-react'

export default function CacheCleaner() {
  const [isClearing, setIsClearing] = useState(false)
  const [cleared, setCleared] = useState(false)

  const clearAllCaches = async () => {
    setIsClearing(true)
    setCleared(false)

    try {
      // Clear SWR cache
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear any stored SWR keys
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes('swr-key') || key.includes('optimized')) {
            localStorage.removeItem(key)
          }
        })
      }

      // Clear browser caches if available
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      }

      // Force reload SWR cache by mutating the global cache
      if (typeof window !== 'undefined' && (window as any).swrCache) {
        (window as any).swrCache.clear()
      }

      setCleared(true)
      
      // Auto reload the page after clearing caches
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('Error clearing caches:', error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Clear All Caches</h3>
          <p className="text-sm text-slate-600">Clear SWR cache and browser caches to force fresh data fetch</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> This will clear all cached data and reload the page. 
            Use this if you're experiencing stale data issues.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={clearAllCaches}
            disabled={isClearing || cleared}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : cleared ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>
              {isClearing ? 'Clearing...' : cleared ? 'Cleared! Reloading...' : 'Clear All Caches'}
            </span>
          </button>

          {cleared && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Caches cleared successfully!</span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <p>This will clear:</p>
          <ul className="list-disc list-inside ml-2">
            <li>SWR cache for data fetching</li>
            <li>Browser cache</li>
            <li>Local storage cache entries</li>
            <li>Service worker caches (if any)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
