'use client';

import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Shield,
  Trash2,
  Upload,
  Clock,
  Zap,
  FileText,
  Loader
} from 'lucide-react';

interface ResetResult {
  success: boolean;
  message: string;
  details?: {
    vehiclesCreated: number;
    tasksCreated: number;
    locationsCreated: number;
    teamMembersCreated: number;
    executionLog: string[];
  };
  error?: string;
}

export function DatabaseResetManager() {
  const [adminToken, setAdminToken] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resetLog, setResetLog] = useState<string[]>([]);

  const handleResetDatabase = async () => {
    if (!adminToken.trim()) {
      setResetResult({
        success: false,
        error: 'Admin token is required',
        message: 'Please enter the admin token to proceed'
      });
      return;
    }

    setIsResetting(true);
    setResetResult(null);
    setResetLog(['🔄 Initiating database reset...']);
    setShowConfirm(false);

    try {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminToken: adminToken.trim()
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResetResult(result);
        setResetLog([
          '✅ Database reset completed successfully!',
          `📊 Created ${result.details.vehiclesCreated} vehicles`,
          `📋 Created ${result.details.tasksCreated} tasks`,
          `📍 Created ${result.details.locationsCreated} locations`,
          `👥 Created ${result.details.teamMembersCreated} team members`,
          '🔄 Real-time data will refresh automatically'
        ]);

        // Clear the admin token for security
        setAdminToken('');
        
        // Trigger a page refresh after a short delay to show fresh data
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } else {
        setResetResult({
          success: false,
          error: result.error || 'Unknown error',
          message: result.details || 'Database reset failed'
        });
        setResetLog([
          '❌ Database reset failed',
          `Error: ${result.error || 'Unknown error'}`,
          `Details: ${result.details || 'No additional details'}`
        ]);
      }
    } catch (error: any) {
      setResetResult({
        success: false,
        error: 'Network error',
        message: 'Failed to connect to reset API'
      });
      setResetLog([
        '❌ Network error occurred',
        'Failed to connect to the database reset API',
        'Please check your connection and try again'
      ]);
    } finally {
      setIsResetting(false);
    }
  };

  const resetStyles = resetResult?.success
    ? 'bg-green-900 border-green-700 text-green-100'
    : resetResult?.error
    ? 'bg-red-900 border-red-700 text-red-100'
    : 'bg-gray-700 border-gray-600 text-white';

  return (
    <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">Database Reset & Re-seed</h4>
            <p className="text-sm text-gray-400">Clear all data and apply corrected seed data</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Warning Notice */}
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-red-200 font-semibold mb-2">⚠️ Destructive Operation</h5>
              <ul className="text-red-300 text-sm space-y-1">
                <li>• All existing data will be permanently deleted</li>
                <li>• Database will be reset with corrected seed data</li>
                <li>• All 24 vehicles will get proper 7-task coverage</li>
                <li>• Real-time data will refresh automatically</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What will be reset */}
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-blue-200 font-semibold mb-2">📊 Data to be Reset & Re-imported</h5>
              <div className="grid grid-cols-2 gap-4 text-blue-300 text-sm">
                <div>
                  <div className="font-medium">Core Data:</div>
                  <ul className="space-y-1">
                    <li>• 24 Vehicles (V001-V024)</li>
                    <li>• 168+ Tasks (corrected scheduling)</li>
                    <li>• 3 Installation locations</li>
                    <li>• 5 Team members</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Improvements:</div>
                  <ul className="space-y-1">
                    <li>• Fixed task coverage per vehicle</li>
                    <li>• Proper morning/afternoon scheduling</li>
                    <li>• Dual-tank vehicle support</li>
                    <li>• Project timeline configuration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Token Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            <Shield className="w-4 h-4 inline mr-2" />
            Admin Token
          </label>
          <input
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="Enter admin token to proceed"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={isResetting}
          />
          <p className="text-xs text-gray-400">
            Required for security. Contact admin if you don't have the token.
          </p>
        </div>

        {/* Reset Button */}
        <div className="flex items-center space-x-3">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!adminToken.trim() || isResetting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
              <span>Reset Database</span>
            </button>
          ) : (
            <div className="flex-1 space-y-3">
              <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3">
                <p className="text-yellow-200 text-sm font-medium">
                  ⚠️ Are you absolutely sure? This will delete ALL current data!
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleResetDatabase}
                  disabled={isResetting}
                  className="flex-1 px-4 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isResetting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>Confirm Reset</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isResetting}
                  className="px-4 py-3 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset Status/Result */}
        {(resetResult || resetLog.length > 0) && (
          <div className={`border rounded-lg p-4 ${resetStyles}`}>
            <div className="flex items-start space-x-3">
              {resetResult?.success ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : resetResult?.error ? (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              ) : isResetting ? (
                <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
              ) : null}
              
              <div className="flex-1">
                <div className="font-semibold mb-2">
                  {resetResult?.success ? '✅ Reset Successful' : 
                   resetResult?.error ? '❌ Reset Failed' : 
                   isResetting ? '🔄 Reset in Progress' : 'Reset Status'}
                </div>
                
                {resetLog.length > 0 && (
                  <div className="bg-black bg-opacity-20 rounded-lg p-3 font-mono text-sm space-y-1">
                    {resetLog.map((logEntry, index) => (
                      <div key={index} className="opacity-90">
                        {logEntry}
                      </div>
                    ))}
                  </div>
                )}

                {resetResult?.details && (
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium opacity-75">Data Created:</div>
                      <div>🚚 {resetResult.details.vehiclesCreated} vehicles</div>
                      <div>📋 {resetResult.details.tasksCreated} tasks</div>
                    </div>
                    <div>
                      <div className="font-medium opacity-75">System Status:</div>
                      <div>📍 {resetResult.details.locationsCreated} locations</div>
                      <div>👥 {resetResult.details.teamMembersCreated} team members</div>
                    </div>
                  </div>
                )}

                {resetResult?.success && (
                  <div className="mt-3 bg-green-800 bg-opacity-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-green-200">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Page will refresh automatically to show fresh data...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <h5 className="text-gray-200 font-semibold mb-2">📖 Usage Instructions</h5>
          <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
            <li>Enter the admin token (contact system administrator)</li>
            <li>Click "Reset Database" and confirm the destructive operation</li>
            <li>Wait for the process to complete (usually 10-30 seconds)</li>
            <li>The page will refresh automatically with fresh corrected data</li>
            <li>Verify all vehicles now have proper 7-task coverage</li>
          </ol>
          
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xs text-gray-400">
              <strong>Note:</strong> This operation applies the corrected seed data from 
              <code className="bg-gray-700 px-1 rounded">CORRECTED_production_seed_data.sql</code>
              ensuring all 24 vehicles get proper task scheduling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
