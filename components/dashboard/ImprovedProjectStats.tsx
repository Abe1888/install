'use client'

import React, { memo } from 'react'
import { 
  Calendar, MapPin, Truck, Navigation, Fuel, Users, 
  BarChart3, AlertTriangle, TrendingUp 
} from 'lucide-react'
import { useVehicleStats, useTeamMembers, useLocationStats } from '@/lib/hooks/useUnifiedData'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const ImprovedProjectStats = memo(function ImprovedProjectStats() {
  const { data: vehicleStats, isLoading: vehiclesLoading, error: vehiclesError } = useVehicleStats()
  const { data: teamMembers = [], isLoading: teamLoading } = useTeamMembers()
  const { data: locationStats = [], isLoading: locationsLoading } = useLocationStats()
  
  const loading = vehiclesLoading || teamLoading || locationsLoading
  
  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner text="Loading project statistics..." />
        </div>
      </div>
    )
  }

  if (vehiclesError) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-sm text-gray-600">Failed to load project statistics</p>
        </div>
      </div>
    )
  }

  if (!vehicleStats) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p className="text-gray-600">No statistics available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Project Statistics</h3>
            <p className="text-sm text-gray-600">Comprehensive project overview</p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Statistics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Vehicle Fleet</h4>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Vehicles</span>
                </div>
                <span className="text-2xl font-bold text-blue-900">{vehicleStats.total}</span>
              </div>
              <div className="text-xs text-blue-700">Across {locationStats.length} locations</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Completed</span>
                </div>
                <span className="text-2xl font-bold text-green-900">{vehicleStats.completed}</span>
              </div>
              <div className="text-xs text-green-700">
                {vehicleStats.total > 0 ? Math.round((vehicleStats.completed / vehicleStats.total) * 100) : 0}% completion rate
              </div>
            </div>
          </div>

          {/* Equipment Statistics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Equipment</h4>
            
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">GPS Devices</span>
                </div>
                <span className="text-2xl font-bold text-indigo-900">
                  {locationStats.reduce((sum, loc) => sum + loc.gps_devices, 0)}
                </span>
              </div>
              <div className="text-xs text-indigo-700">
                Real-time from {locationStats.length} locations
              </div>
            </div>

            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Fuel className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-medium text-teal-800">Fuel Sensors</span>
                </div>
                <span className="text-2xl font-bold text-teal-900">
                  {locationStats.reduce((sum, loc) => sum + loc.fuel_sensors, 0)}
                </span>
              </div>
              <div className="text-xs text-teal-700">
                Real-time from database
              </div>
            </div>
          </div>

          {/* Timeline Statistics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Project Info</h4>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Duration</span>
                </div>
                <span className="text-2xl font-bold text-purple-900">0</span>
              </div>
              <div className="text-xs text-purple-700">No project configured</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Team Size</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{teamMembers.length}</div>
              <div className="text-xs text-orange-700">Installation specialists</div>
            </div>
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Location Progress</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationStats.map((location) => (
              <div key={location.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{location.name}</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs font-medium text-gray-900">{location.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${location.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{location.actualVehicles}</div>
                    <div className="text-xs text-gray-600">Vehicles</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{location.completed}</div>
                    <div className="text-xs text-green-600">Done</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{location.pending}</div>
                    <div className="text-xs text-blue-600">Pending</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

export default ImprovedProjectStats
