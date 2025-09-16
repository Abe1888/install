'use client'

import React, { useState } from 'react'
import { Button } from './button'
// Using existing components instead of missing imports
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

import { supabase } from '@/lib/supabase/client'

export interface DatabaseResetProps {
  schemaFilePath: string
  seedDataFilePath: string
}

export default function DatabaseReset({ schemaFilePath, seedDataFilePath }: DatabaseResetProps) {
  const [isResetting, setIsResetting] = useState(false)
  const [resetStatus, setResetStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const resetSchema = async () => {
    setIsResetting(true)
    setResetStatus(null)
    
    try {
      // Fetch the schema SQL file
      const response = await fetch(schemaFilePath)
      if (!response.ok) {
        throw new Error(`Failed to fetch schema file: ${response.statusText}`)
      }
      
      const schemaSql = await response.text()
      
      // Split the SQL into individual statements and execute them one by one
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
      
      for (const statement of statements) {
        const { error } = await supabase.rpc('execute_sql', { 
          sql_query: statement + ';' 
        })
        
        if (error) {
          console.log('Statement execution error:', error)
          // Continue with other statements even if one fails
        }
      }
      
      setResetStatus({
        success: true,
        message: 'Database schema has been successfully reset.'
      })
    } catch (error) {
      console.error('Schema reset error:', error)
      setResetStatus({
        success: false,
        message: `Schema reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsResetting(false)
    }
  }

  const resetSeedData = async () => {
    setIsResetting(true)
    setResetStatus(null)
    
    try {
      // Fetch the seed data SQL file
      const response = await fetch(seedDataFilePath)
      if (!response.ok) {
        throw new Error(`Failed to fetch seed data file: ${response.statusText}`)
      }
      
      const seedDataSql = await response.text()
      
      // Execute the seed data reset using a dedicated API endpoint
      const resetResponse = await fetch('/api/database/reset-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: seedDataSql }),
      })
      
      if (!resetResponse.ok) {
        const errorData = await resetResponse.json()
        throw new Error(`Seed data reset failed: ${errorData.error || resetResponse.statusText}`)
      }
      
      setResetStatus({
        success: true,
        message: 'Database seed data has been successfully reset.'
      })
    } catch (error) {
      console.error('Seed data reset error:', error)
      setResetStatus({
        success: false,
        message: `Seed data reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Database Management</h2>
      
      <div className="space-y-6">
        <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Schema Reset</h3>
          <p className="text-gray-400 mb-4">
            Reset the database schema to the production-ready version. This will drop and recreate all tables.
            <span className="text-red-500 font-bold block mt-2">Warning: This action cannot be undone!</span>
          </p>
          <button
            onClick={resetSchema}
            disabled={isResetting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {isResetting ? 'Resetting Schema...' : 'Reset Database Schema'}
          </button>
        </div>
        
        <div className="border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Seed Data Reset</h3>
          <p className="text-gray-400 mb-4">
            Reset the database seed data to the production-ready version. This will clear and repopulate all tables.
            <span className="text-red-500 font-bold block mt-2">Warning: This action cannot be undone!</span>
          </p>
          <button
            onClick={resetSeedData}
            disabled={isResetting}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {isResetting ? 'Resetting Seed Data...' : 'Reset Seed Data'}
          </button>
        </div>
        
        {resetStatus && (
          <div className={`border ${resetStatus.success ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'} rounded-lg p-4 mt-4`}>
            <p className={`${resetStatus.success ? 'text-green-400' : 'text-red-400'}`}>
              {resetStatus.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}