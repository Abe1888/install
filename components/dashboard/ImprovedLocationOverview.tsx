'use client'

import React, { useState, memo } from 'react'
import { MapPin, AlertTriangle } from 'lucide-react'
import { useLocationStats } from '@/lib/hooks/useUnifiedData'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const ImprovedLocationOverview = memo(function ImprovedLocationOverview() {
  const { data: locationStats = [], isLoading: loading } = useLocationStats()
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner text="Loading location data..." />
        </div>
      </div>
    )
  }

  if (locationStats.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Locations Available</h3>
          <p className="text-sm text-gray-600">Location data is not yet configured.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Location Overview</h3>
            <p className="text-sm text-gray-600">Installation progress by location</p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {locationStats.map((location) => {
            const isSelected = selectedLocation === location.name
            
            return (
              <div 
                key={location.name}
                className={`rounded-lg p-6 cursor-pointer border transition-all duration-200 ${
                  isSelected 
                    ? 'bg-primary-600 text-white border-primary-600 transform scale-105 shadow-lg' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:shadow-md'
                }`}
                onClick={() => setSelectedLocation(isSelected ? null : location.name)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-white bg-opacity-20' : 'bg-white'
                    }`}>
                      <MapPin className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {location.name}
                      </h4>
                    </div>
                  </div>
                  
                  <div className={`text-right ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                    <div className="text-2xl font-bold">{location.progress}%</div>
                    <div className="text-xs">Complete</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={`w-full rounded-full h-2 mb-4 ${isSelected ? 'bg-white bg-opacity-20' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isSelected ? 'bg-white' : 'bg-primary-500'
                    }`}
                    style={{ width: `${location.progress}%` }}
                  />
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`text-center p-3 rounded-lg ${
                    isSelected ? 'bg-white bg-opacity-10' : 'bg-white border border-gray-200'
                  }`}>
                    <div className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {location.actualVehicles}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-primary-100' : 'text-gray-600'}`}>
                      Vehicles
                    </div>
                  </div>
                  
                  <div className={`text-center p-3 rounded-lg ${
                    isSelected ? 'bg-white bg-opacity-10' : 'bg-white border border-gray-200'
                  }`}>
                    <div className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-primary-600'}`}>
                      {location.gps_devices}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-primary-100' : 'text-primary-600'}`}>
                      GPS
                    </div>
                  </div>
                  
                  <div className={`text-center p-3 rounded-lg ${
                    isSelected ? 'bg-white bg-opacity-10' : 'bg-white border border-gray-200'
                  }`}>
                    <div className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-green-600'}`}>
                      {location.fuel_sensors}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-primary-100' : 'text-green-600'}`}>
                      Sensors
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-white border-opacity-20 animate-fade-in">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary-100">Status Breakdown</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white bg-opacity-10 rounded-lg p-2">
                          <div className="text-sm font-semibold text-white">{location.completed}</div>
                          <div className="text-xs text-primary-100">Done</div>
                        </div>
                        <div className="bg-white bg-opacity-10 rounded-lg p-2">
                          <div className="text-sm font-semibold text-white">{location.inProgress}</div>
                          <div className="text-xs text-primary-100">Active</div>
                        </div>
                        <div className="bg-white bg-opacity-10 rounded-lg p-2">
                          <div className="text-sm font-semibold text-white">{location.pending}</div>
                          <div className="text-xs text-primary-100">Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default ImprovedLocationOverview
