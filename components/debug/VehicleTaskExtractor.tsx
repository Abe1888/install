'use client';

import React, { useState, useEffect } from 'react';
import { Download, Database, Clock, Truck, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { useTasks, useVehicles } from '@/lib/hooks/useUnifiedData';

interface VehicleTaskData {
  vehicleId: string;
  vehicleInfo?: any;
  tasks: Array<{
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    status: string;
    assigned_to: string;
    priority: string;
    estimated_duration?: number;
  }>;
  taskCount: number;
}

export function VehicleTaskExtractor() {
  const { data: allTasks = [], isLoading: tasksLoading, mutate: refreshTasks } = useTasks(undefined, true);
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles(true);
  const [extractedData, setExtractedData] = useState<VehicleTaskData[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Target vehicles
  const targetVehicles = ['V001', 'V002'];

  useEffect(() => {
    if (!tasksLoading && !vehiclesLoading) {
      extractVehicleTaskData();
    }
  }, [allTasks, vehicles, tasksLoading, vehiclesLoading]);

  const extractVehicleTaskData = () => {
    const vehicleTaskData: VehicleTaskData[] = [];

    targetVehicles.forEach(vehicleId => {
      // Find vehicle info
      const vehicleInfo = vehicles.find(v => v.id === vehicleId);
      
      // Filter tasks for this vehicle that have start_time and end_time
      const vehicleTasks = allTasks.filter(task => {
        // Handle both string and array vehicle_id formats
        const taskVehicleIds = Array.isArray(task.vehicle_id) ? task.vehicle_id : [task.vehicle_id];
        return taskVehicleIds.includes(vehicleId) && task.start_time && task.end_time;
      });

      // Sort tasks by start_time
      const sortedTasks = vehicleTasks
        .map(task => ({
          id: task.id,
          name: task.name,
          start_time: task.start_time || '',
          end_time: task.end_time || '',
          status: task.status,
          assigned_to: Array.isArray(task.assigned_to) ? task.assigned_to.join(', ') : task.assigned_to || '',
          priority: task.priority,
          estimated_duration: task.estimated_duration
        }))
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      vehicleTaskData.push({
        vehicleId,
        vehicleInfo,
        tasks: sortedTasks,
        taskCount: sortedTasks.length
      });
    });

    setExtractedData(vehicleTaskData);
    
    // Log the data for console inspection
    console.log('🚛 Vehicle Task Data Extracted:', {
      timestamp: new Date().toISOString(),
      totalVehicles: vehicleTaskData.length,
      data: vehicleTaskData
    });
  };

  const refreshData = async () => {
    await refreshTasks?.();
    extractVehicleTaskData();
  };

  const exportToJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      source: 'Task Management System - Real-time Database',
      vehicles: extractedData.map(vd => ({
        vehicleId: vd.vehicleId,
        vehicleInfo: vd.vehicleInfo,
        taskCount: vd.taskCount,
        tasks: vd.tasks
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-tasks-V001-V002-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const csvRows = ['Vehicle ID,Task Name,Start Time,End Time,Status,Assigned To,Priority,Duration (min)'];
    
    extractedData.forEach(vehicleData => {
      vehicleData.tasks.forEach(task => {
        csvRows.push([
          vehicleData.vehicleId,
          `"${task.name}"`,
          task.start_time,
          task.end_time,
          task.status,
          `"${task.assigned_to}"`,
          task.priority,
          task.estimated_duration || ''
        ].join(','));
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-tasks-V001-V002-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (data: string, type: string) => {
    try {
      await navigator.clipboard.writeText(data);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateReadableText = () => {
    let output = `Vehicle Task Data - ${new Date().toLocaleString()}\n`;
    output += `Source: Task Management System - Real-time Database\n\n`;

    extractedData.forEach(vehicleData => {
      output += `=== ${vehicleData.vehicleId} ===\n`;
      if (vehicleData.vehicleInfo) {
        output += `Type: ${vehicleData.vehicleInfo.type}\n`;
        output += `Location: ${vehicleData.vehicleInfo.location}\n`;
        output += `Day: ${vehicleData.vehicleInfo.day}\n`;
        output += `Time Slot: ${vehicleData.vehicleInfo.time_slot}\n`;
        output += `Status: ${vehicleData.vehicleInfo.status}\n`;
      }
      output += `Total Tasks: ${vehicleData.taskCount}\n\n`;

      vehicleData.tasks.forEach((task, index) => {
        output += `Task ${index + 1}:\n`;
        output += `  Name: ${task.name}\n`;
        output += `  Start Time: ${task.start_time}\n`;
        output += `  End Time: ${task.end_time}\n`;
        output += `  Status: ${task.status}\n`;
        output += `  Assigned To: ${task.assigned_to}\n`;
        output += `  Priority: ${task.priority}\n`;
        if (task.estimated_duration) {
          output += `  Duration: ${task.estimated_duration} minutes\n`;
        }
        output += `\n`;
      });
      output += `\n`;
    });

    return output;
  };

  if (tasksLoading || vehiclesLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-blue-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading real-time task data...</span>
        </div>
      </div>
    );
  }

  const totalTasks = extractedData.reduce((sum, vd) => sum + vd.taskCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vehicle Task Data Extraction</h2>
              <p className="text-sm text-gray-600">Real-time data from Tasks by Vehicle Installation</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Truck className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Vehicles</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{extractedData.length}</div>
            <div className="text-xs text-gray-500">V001, V002</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Total Tasks</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
            <div className="text-xs text-gray-500">With start/end times</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Data Status</span>
            </div>
            <div className="text-lg font-bold text-green-600">Live</div>
            <div className="text-xs text-gray-500">Real-time sync</div>
          </div>
        </div>

        {/* Export Options */}
        <div className="flex items-center space-x-3 border-t pt-4">
          <button
            onClick={exportToJSON}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => copyToClipboard(generateReadableText(), 'readable')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            {copySuccess === 'readable' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>Copy Text</span>
          </button>
        </div>
      </div>

      {/* Vehicle Data Display */}
      {extractedData.map(vehicleData => (
        <div key={vehicleData.vehicleId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vehicle {vehicleData.vehicleId}
                  </h3>
                  {vehicleData.vehicleInfo && (
                    <div className="text-sm text-gray-600">
                      {vehicleData.vehicleInfo.type} • {vehicleData.vehicleInfo.location} • Day {vehicleData.vehicleInfo.day}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{vehicleData.taskCount}</div>
                <div className="text-sm text-gray-500">Tasks</div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {vehicleData.tasks.length > 0 ? (
              <div className="space-y-3">
                {vehicleData.tasks.map((task, index) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.name}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Start:</span> {task.start_time}
                          </div>
                          <div>
                            <span className="font-medium">End:</span> {task.end_time}
                          </div>
                          <div>
                            <span className="font-medium">Assigned:</span> {task.assigned_to}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'High' ? 'bg-red-100 text-red-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </div>
                        {task.estimated_duration && (
                          <div className="text-xs text-gray-500 mt-1">
                            {task.estimated_duration}min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tasks with start/end times found for this vehicle</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* JSON Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">JSON Data Preview</h3>
          <button
            onClick={() => copyToClipboard(JSON.stringify(extractedData, null, 2), 'json')}
            className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors flex items-center space-x-1"
          >
            {copySuccess === 'json' ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>Copy JSON</span>
          </button>
        </div>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-64">
          {JSON.stringify(extractedData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
