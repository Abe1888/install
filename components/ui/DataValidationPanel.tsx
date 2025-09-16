'use client';

import React, { useState, useMemo, memo } from 'react';
import { 
  CheckCircle2, AlertTriangle, Info, RefreshCw, Database, 
  Truck, MapPin, Users, Target, Calendar, Clock 
} from 'lucide-react';
import { useVehiclesOptimized, useLocationsOptimized, useTeamMembersOptimized, useTasksOptimized } from '@/lib/hooks/useOptimizedSWR';

interface ValidationResult {
  category: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
  count?: number;
  items?: string[];
}

const DataValidationPanel: React.FC = memo(() => {
  const [isValidating, setIsValidating] = useState(false);
  const { data: vehicles = [] } = useVehiclesOptimized();
  const { data: locations = [] } = useLocationsOptimized();
  const { data: teamMembers = [] } = useTeamMembersOptimized();
  const { data: tasks = [] } = useTasksOptimized();

  const validationResults = useMemo(() => {
    const results: ValidationResult[] = [];

    // Vehicle Data Validation
    if (vehicles.length === 0) {
      results.push({
        category: 'Vehicle Data',
        type: 'warning',
        message: 'No vehicles found',
        details: 'The system should have vehicle data for proper operation'
      });
    } else {
      results.push({
        category: 'Vehicle Data',
        type: 'success',
        message: `${vehicles.length} vehicles loaded successfully`,
        count: vehicles.length
      });

      // Check for missing required fields
      const missingFields = vehicles.filter(v => !v.id || !v.type || !v.location);
      if (missingFields.length > 0) {
        results.push({
          category: 'Vehicle Data',
          type: 'error',
          message: `${missingFields.length} vehicles have missing required fields`,
          items: missingFields.map(v => v.id || 'Unknown ID')
        });
      }

      // Check for duplicate IDs
      const ids = vehicles.map(v => v.id);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        results.push({
          category: 'Vehicle Data',
          type: 'error',
          message: `Duplicate vehicle IDs found`,
          items: Array.from(new Set(duplicateIds))
        });
      }

      // Check for invalid day values
      const invalidDays = vehicles.filter(v => v.day < 1 || v.day > 14);
      if (invalidDays.length > 0) {
        results.push({
          category: 'Vehicle Data',
          type: 'warning',
          message: `${invalidDays.length} vehicles have invalid day values`,
          details: 'Days should be between 1 and 14 for the project timeline'
        });
      }

      // Check fuel tank/sensor consistency
      const inconsistentFuel = vehicles.filter(v => v.fuel_sensors > v.fuel_tanks);
      if (inconsistentFuel.length > 0) {
        results.push({
          category: 'Vehicle Data',
          type: 'warning',
          message: `${inconsistentFuel.length} vehicles have more sensors than tanks`,
          items: inconsistentFuel.map(v => v.id)
        });
      }
    }

    // Location Data Validation
    if (locations.length === 0) {
      results.push({
        category: 'Location Data',
        type: 'error',
        message: 'No locations found',
        details: 'Locations are required for vehicle scheduling'
      });
    } else {
      results.push({
        category: 'Location Data',
        type: 'success',
        message: `${locations.length} locations configured`,
        count: locations.length
      });

      // Check location-vehicle consistency
      const vehicleLocations = new Set(vehicles.map(v => v.location));
      const definedLocations = new Set(locations.map(l => l.name));
      const undefinedLocations = Array.from(vehicleLocations).filter(loc => !definedLocations.has(loc));
      
      if (undefinedLocations.length > 0) {
        results.push({
          category: 'Location Data',
          type: 'error',
          message: `${undefinedLocations.length} undefined locations in vehicle data`,
          items: undefinedLocations
        });
      }

      // Check location capacity vs actual vehicles
      locations.forEach(location => {
        const actualVehicles = vehicles.filter(v => v.location === location.name).length;
        if (actualVehicles !== location.vehicles) {
          results.push({
            category: 'Location Data',
            type: 'warning',
            message: `${location.name}: Expected ${location.vehicles} vehicles, found ${actualVehicles}`,
            details: 'Location capacity may need updating'
          });
        }
      });
    }

    // Team Data Validation
    if (teamMembers.length === 0) {
      results.push({
        category: 'Team Data',
        type: 'warning',
        message: 'No team members found',
        details: 'Team members are needed for task assignments'
      });
    } else {
      results.push({
        category: 'Team Data',
        type: 'success',
        message: `${teamMembers.length} team members available`,
        count: teamMembers.length
      });

      // Check for team members with low performance scores
      const lowPerformance = teamMembers.filter(tm => tm.completion_rate < 70);
      if (lowPerformance.length > 0) {
        results.push({
          category: 'Team Data',
          type: 'info',
          message: `${lowPerformance.length} team members with completion rate below 70%`,
          items: lowPerformance.map(tm => tm.name)
        });
      }
    }

    // Task Data Validation
    if (tasks.length === 0) {
      results.push({
        category: 'Task Data',
        type: 'info',
        message: 'No tasks created yet',
        details: 'Tasks can be generated automatically or created manually'
      });
    } else {
      results.push({
        category: 'Task Data',
        type: 'success',
        message: `${tasks.length} tasks in system`,
        count: tasks.length
      });

      // Check for tasks assigned to non-existent team members
      const teamMemberNames = new Set(teamMembers.map(tm => tm.name));
      const invalidAssignments = tasks.filter(t => {
        const assignees = Array.isArray(t.assigned_to) ? t.assigned_to : [t.assigned_to];
        return assignees.some(assignee => !teamMemberNames.has(assignee));
      });
      if (invalidAssignments.length > 0) {
        results.push({
          category: 'Task Data',
          type: 'warning',
          message: `${invalidAssignments.length} tasks assigned to unknown team members`,
          items: Array.from(new Set(invalidAssignments.flatMap(t => 
            Array.isArray(t.assigned_to) ? t.assigned_to : [t.assigned_to]
          )))
        });
      }

      // Check for tasks with invalid vehicle references
      const vehicleIds = new Set(vehicles.map(v => v.id));
      const invalidVehicleRefs = tasks.filter(t => {
        const vehicleIdArray = Array.isArray(t.vehicle_id) ? t.vehicle_id : [t.vehicle_id];
        return vehicleIdArray.some(vId => !vehicleIds.has(vId));
      });
      if (invalidVehicleRefs.length > 0) {
        results.push({
          category: 'Task Data',
          type: 'error',
          message: `${invalidVehicleRefs.length} tasks reference non-existent vehicles`,
          items: Array.from(new Set(invalidVehicleRefs.flatMap(t => 
            Array.isArray(t.vehicle_id) ? t.vehicle_id : [t.vehicle_id]
          )))
        });
      }

      // Check task distribution
      const tasksByStatus = {
        pending: tasks.filter(t => t.status === 'Pending').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        blocked: tasks.filter(t => t.status === 'Blocked').length
      };

      if (tasksByStatus.blocked > 0) {
        results.push({
          category: 'Task Data',
          type: 'warning',
          message: `${tasksByStatus.blocked} blocked tasks need attention`,
          details: 'Blocked tasks may delay project completion'
        });
      }
    }

    // Schedule Validation
    if (vehicles.length > 0) {
      const dayDistribution = vehicles.reduce((acc, v) => {
        acc[v.day] = (acc[v.day] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const daysWithVehicles = Object.keys(dayDistribution).length;
      const expectedDays = 14; // Project duration

      if (daysWithVehicles < expectedDays) {
        results.push({
          category: 'Schedule Data',
          type: 'info',
          message: `Vehicles scheduled for ${daysWithVehicles} out of ${expectedDays} project days`,
          details: 'Some days may not have scheduled installations'
        });
      }

      // Check for overloaded days
      const overloadedDays = Object.entries(dayDistribution)
        .filter(([_, count]) => count > 4) // Assuming max 4 vehicles per day
        .map(([day, count]) => `Day ${day}: ${count} vehicles`);

      if (overloadedDays.length > 0) {
        results.push({
          category: 'Schedule Data',
          type: 'warning',
          message: `${overloadedDays.length} days may be overloaded`,
          items: overloadedDays
        });
      }
    }

    return results;
  }, [vehicles, locations, teamMembers, tasks]);

  const handleValidation = async () => {
    setIsValidating(true);
    // Simulate validation process
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsValidating(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const summaryStats = useMemo(() => {
    const stats = validationResults.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: validationResults.length,
      success: stats.success || 0,
      warning: stats.warning || 0,
      error: stats.error || 0,
      info: stats.info || 0
    };
  }, [validationResults]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Data Validation</h3>
              <p className="text-sm text-slate-600">System data integrity and consistency checks</p>
            </div>
          </div>
          
          <button
            onClick={handleValidation}
            disabled={isValidating}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
            <span>{isValidating ? 'Validating...' : 'Re-validate'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="text-lg font-semibold text-slate-800">{summaryStats.total}</div>
            <div className="text-xs text-slate-600">Total Checks</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
            <div className="text-lg font-semibold text-green-800">{summaryStats.success}</div>
            <div className="text-xs text-green-600">Passed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-md border border-yellow-200">
            <div className="text-lg font-semibold text-yellow-800">{summaryStats.warning}</div>
            <div className="text-xs text-yellow-600">Warnings</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-md border border-red-200">
            <div className="text-lg font-semibold text-red-800">{summaryStats.error}</div>
            <div className="text-xs text-red-600">Errors</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-lg font-semibold text-blue-800">{summaryStats.info}</div>
            <div className="text-xs text-blue-600">Info</div>
          </div>
        </div>

        {/* Validation Results */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-700">Validation Results</h4>
          
          {validationResults.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No validation results available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {validationResults.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 border ${getResultColor(result.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getResultIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900">
                          {result.category}
                        </span>
                        {result.count && (
                          <span className="text-xs text-slate-500">
                            Count: {result.count}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-700 mb-2">{result.message}</p>
                      
                      {result.details && (
                        <p className="text-xs text-slate-600 bg-white bg-opacity-50 rounded p-2 mb-2">
                          {result.details}
                        </p>
                      )}
                      
                      {result.items && result.items.length > 0 && (
                        <div className="text-xs text-slate-600">
                          <span className="font-medium">Items: </span>
                          <span>{result.items.slice(0, 5).join(', ')}</span>
                          {result.items.length > 5 && (
                            <span> and {result.items.length - 5} more...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

DataValidationPanel.displayName = 'DataValidationPanel';

export default DataValidationPanel;