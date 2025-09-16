'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, Database, Clock, TrendingUp } from 'lucide-react';
import { useGantt } from '@/lib/hooks/useGantt';
import { useTasks } from '@/lib/hooks/useUnifiedData';

interface GanttDataVerificationProps {
  selectedDay: number;
}

export function GanttDataVerification({ selectedDay }: GanttDataVerificationProps) {
  // Get data from both sources for comparison
  const ganttData = useGantt(selectedDay);
  const { data: rawTasks = [] } = useTasks(undefined, true);

  // Filter tasks for the current day (similar to Gantt logic)
  const dayTasks = rawTasks.filter(task => {
    // Include tasks with start_time and end_time (real scheduled tasks)
    return task.start_time && task.end_time;
  });

  const ganttTasks = ganttData.tasks || [];
  
  // Data alignment verification
  const verificationResults = {
    totalDatabaseTasks: dayTasks.length,
    totalGanttTasks: ganttTasks.length,
    tasksWithRealTimes: dayTasks.filter(t => t.start_time && t.end_time).length,
    tasksWithParsedTimes: ganttTasks.filter(t => t.startDate && t.endDate).length,
    alignment: dayTasks.length > 0 ? Math.round((ganttTasks.length / dayTasks.length) * 100) : 0
  };

  const isAligned = verificationResults.alignment >= 80; // 80% or better alignment
  const hasRealTimes = verificationResults.tasksWithRealTimes > 0;

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Gantt Chart Data Verification (Day {selectedDay})
          </h3>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
          isAligned && hasRealTimes 
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {isAligned && hasRealTimes ? (
            <>
              <CheckCircle className="w-3 h-3" />
              <span>Aligned</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>Misaligned</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-600">Database Tasks</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {verificationResults.totalDatabaseTasks}
          </div>
          <div className="text-xs text-gray-500">
            With Times: {verificationResults.tasksWithRealTimes}
          </div>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-600">Gantt Tasks</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {verificationResults.totalGanttTasks}
          </div>
          <div className="text-xs text-gray-500">
            Parsed: {verificationResults.tasksWithParsedTimes}
          </div>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-600">Alignment</span>
          </div>
          <div className={`text-lg font-bold ${
            isAligned ? 'text-green-600' : 'text-red-600'
          }`}>
            {verificationResults.alignment}%
          </div>
          <div className="text-xs text-gray-500">
            Data Match
          </div>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-gray-600">Status</span>
          </div>
          <div className={`text-sm font-medium ${
            hasRealTimes ? 'text-green-600' : 'text-red-600'
          }`}>
            {hasRealTimes ? 'Real Data' : 'Fallback'}
          </div>
          <div className="text-xs text-gray-500">
            Source Type
          </div>
        </div>
      </div>

      {/* Sample Task Comparison */}
      {dayTasks.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Sample Database Tasks:</h4>
          <div className="space-y-1">
            {dayTasks.slice(0, 3).map((task, index) => (
              <div key={task.id} className="text-xs text-gray-600 flex items-center justify-between">
                <span className="truncate mr-2">{task.name}</span>
                <span className="text-blue-600 font-mono">
                  {task.start_time} - {task.end_time}
                </span>
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayTasks.length - 3} more tasks...
              </div>
            )}
          </div>
        </div>
      )}

      {!hasRealTimes && (
        <div className="border-t pt-3 text-xs text-red-600">
          ⚠️ No database tasks with start_time/end_time found for Day {selectedDay}. 
          Gantt Chart may be showing fallback/synthetic data.
        </div>
      )}
    </div>
  );
}
