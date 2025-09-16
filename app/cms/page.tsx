'use client'

import React from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/layout/AdminLayout'
import DatabaseReset from '@/components/ui/DatabaseReset'
import { ProjectSettings } from '@/docs/ProjectSettings'

export default function CMSPage() {
  // Paths to the schema and seed data SQL files
  const schemaPath = '/api/sql/schema'
  const seedDataPath = '/api/sql/seeddata'

  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center space-y-6 p-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-10 text-center w-full max-w-3xl">
          <h1 className="text-2xl font-bold mb-4">Content Management System</h1>
          <p className="text-gray-400 mb-6">
            Database Management and Reset Functions
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
        
        {/* Project Timeline Settings */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-3xl">
          <h2 className="text-xl font-bold mb-4">Project Timeline Settings</h2>
          <p className="text-gray-400 mb-4">
            Configure project start/end dates and track project progress
          </p>
          <ProjectSettings />
        </div>
        
        <DatabaseReset 
          schemaFilePath={schemaPath}
          seedDataFilePath={seedDataPath}
        />
      </div>
    </AdminLayout>
  )
}
