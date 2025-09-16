'use client'

import React from 'react'
import { 
  useVehicleStatsApi, 
  useTeamMembersApi, 
  useLocationStatsApi,
  useProjectStatsApi 
} from '@/lib/hooks/useApi'

export default function DataDebugger() {
  const [showDetails, setShowDetails] = React.useState(false)
  
  // Test all the hooks
  const vehicleStats = useVehicleStatsApi()
  const teamMembers = useTeamMembersApi()
  const locationStats = useLocationStatsApi()
  const projectStats = useProjectStatsApi()
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-yellow-800">🐛 Data Debug Information</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <div className="text-sm font-medium text-gray-900">Vehicle Stats</div>
          <div className="text-xs text-gray-600 mt-1">
            Loading: {vehicleStats.isLoading ? '✅' : '❌'}<br/>
            Error: {vehicleStats.error ? '⚠️' : '✅'}<br/>
            Data: {vehicleStats.data ? '✅' : '❌'}
          </div>
          {vehicleStats.data && (
            <div className="text-xs text-blue-600 mt-1">
              Total: {vehicleStats.data.total || 'N/A'}
            </div>
          )}
        </div>
        
        <div className="bg-white p-3 rounded border">
          <div className="text-sm font-medium text-gray-900">Team Members</div>
          <div className="text-xs text-gray-600 mt-1">
            Loading: {teamMembers.isLoading ? '✅' : '❌'}<br/>
            Error: {teamMembers.error ? '⚠️' : '✅'}<br/>
            Data: {teamMembers.data ? '✅' : '❌'}
          </div>
          {teamMembers.data && (
            <div className="text-xs text-blue-600 mt-1">
              Count: {Array.isArray(teamMembers.data) ? teamMembers.data.length : 'N/A'}
            </div>
          )}
        </div>
        
        <div className="bg-white p-3 rounded border">
          <div className="text-sm font-medium text-gray-900">Location Stats</div>
          <div className="text-xs text-gray-600 mt-1">
            Loading: {locationStats.isLoading ? '✅' : '❌'}<br/>
            Error: {locationStats.error ? '⚠️' : '✅'}<br/>
            Data: {locationStats.data ? '✅' : '❌'}
          </div>
          {locationStats.data && (
            <div className="text-xs text-blue-600 mt-1">
              Count: {Array.isArray(locationStats.data) ? locationStats.data.length : 'N/A'}
            </div>
          )}
        </div>
        
        <div className="bg-white p-3 rounded border">
          <div className="text-sm font-medium text-gray-900">Project Stats</div>
          <div className="text-xs text-gray-600 mt-1">
            Loading: {projectStats.isLoading ? '✅' : '❌'}<br/>
            Error: {projectStats.error ? '⚠️' : '✅'}<br/>
            Data: {projectStats.data ? '✅' : '❌'}
          </div>
          {projectStats.data && (
            <div className="text-xs text-blue-600 mt-1">
              Vehicles: {projectStats.data.vehicles?.total || 'N/A'}
            </div>
          )}
        </div>
      </div>
      
      {showDetails && (
        <div className="space-y-4 text-xs">
          <div>
            <div className="font-medium text-gray-900 mb-2">🚗 Vehicle Stats Data:</div>
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(vehicleStats, null, 2)}
            </pre>
          </div>
          
          <div>
            <div className="font-medium text-gray-900 mb-2">👥 Team Members Data:</div>
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(teamMembers, null, 2)}
            </pre>
          </div>
          
          <div>
            <div className="font-medium text-gray-900 mb-2">📍 Location Stats Data:</div>
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(locationStats, null, 2)}
            </pre>
          </div>
          
          <div>
            <div className="font-medium text-gray-900 mb-2">📊 Project Stats Data:</div>
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(projectStats, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
