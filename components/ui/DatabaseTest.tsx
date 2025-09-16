'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import CacheCleaner from './CacheCleaner'
import { mutate } from 'swr'

interface DatabaseTestResult {
  table: string
  count: number
  error?: string
  sample?: any[]
}

export default function DatabaseTest() {
  const [results, setResults] = useState<DatabaseTestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const testDatabase = async () => {
    setIsLoading(true)
    setResults([])

    // Clear SWR caches for all optimized hooks
    await mutate('team_members-optimized', undefined, { revalidate: false })
    await mutate('vehicles-optimized', undefined, { revalidate: false })
    await mutate('locations-optimized', undefined, { revalidate: false })
    await mutate('tasks-optimized', undefined, { revalidate: false })

    const tables = ['locations', 'team_members', 'vehicles', 'tasks']
    const newResults: DatabaseTestResult[] = []

    for (const table of tables) {
      try {
        // Get count
        const { data: countData, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (countError) {
          newResults.push({
            table,
            count: 0,
            error: countError.message
          })
          continue
        }

        const count = countData?.length || 0

        // Get sample data
        const { data: sampleData, error: sampleError } = await supabase
          .from(table)
          .select('*')
          .limit(3)

        newResults.push({
          table,
          count,
          error: sampleError?.message,
          sample: sampleData || []
        })

      } catch (error) {
        newResults.push({
          table,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    setResults(newResults)
    setIsLoading(false)
  }

  // Removed auto-refresh - user must manually trigger database test

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Database Connection Test</h3>
            <p className="text-sm text-slate-600">Test database connectivity and data availability</p>
          </div>
        </div>
        <button
          onClick={testDatabase}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Test Connection</span>
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.table} className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {result.error ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                <h4 className="font-semibold text-slate-900 capitalize">
                  {result.table.replace('_', ' ')}
                </h4>
              </div>
              <div className="text-sm">
                <span className="font-medium">{result.count}</span> records
              </div>
            </div>

            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                <p className="text-sm text-red-800">Error: {result.error}</p>
              </div>
            )}

            {result.sample && result.sample.length > 0 && (
              <div className="bg-slate-50 rounded-md p-3">
                <h5 className="text-xs font-medium text-slate-700 mb-2">Sample Data:</h5>
                <div className="space-y-1">
                  {result.sample.map((item, index) => (
                    <div key={index} className="text-xs text-slate-600">
                      {result.table === 'team_members' && (
                        <span><strong>{item.name}</strong> - {item.role}</span>
                      )}
                      {result.table === 'locations' && (
                        <span><strong>{item.name}</strong> - {item.vehicles} vehicles</span>
                      )}
                      {result.table === 'vehicles' && (
                        <span><strong>{item.id}</strong> - {item.type} ({item.location}, Day {item.day})</span>
                      )}
                      {result.table === 'tasks' && (
                        <span><strong>{item.name}</strong> - {item.status} (assigned to: {item.assigned_to})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-slate-600">Click "Test Connection" to check database status</p>
        </div>
      )}
      </div>
      
      <CacheCleaner />
    </div>
  )
}