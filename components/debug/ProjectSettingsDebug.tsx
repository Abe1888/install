'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function ProjectSettingsDebug() {
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testTableStructure = async () => {
    setIsLoading(true);
    try {
      // Test 1: Try to get existing data to see current structure
      console.log('🔍 Testing project_settings table structure...');
      
      const { data: existingData, error: queryError } = await supabase
        .from('project_settings')
        .select('*')
        .limit(1);

      if (queryError) {
        console.error('Query error:', queryError);
        setTestResult({ error: queryError, step: 'query' });
        return;
      }

      console.log('✅ Existing data:', existingData);
      
      // Test 2: Try to upsert minimal data (only required fields)
      const minimalData = {
        id: 'structure-test',
        project_start_date: '2024-01-01',
        updated_at: new Date().toISOString(),
      };

      const { data: minimalResult, error: minimalError } = await supabase
        .from('project_settings')
        .upsert(minimalData)
        .select('*');

      if (minimalError) {
        console.error('Minimal upsert failed:', minimalError);
        setTestResult({ 
          error: minimalError, 
          step: 'minimal_upsert',
          existingData 
        });
        return;
      }

      console.log('✅ Minimal upsert successful:', minimalResult);

      // Test 3: Try to upsert with additional fields
      const fullData = {
        id: 'structure-test',
        project_start_date: '2024-01-01',
        project_end_date: '2024-12-31',
        total_days: 365,
        updated_at: new Date().toISOString(),
      };

      const { data: fullResult, error: fullError } = await supabase
        .from('project_settings')
        .upsert(fullData)
        .select('*');

      if (fullError) {
        console.error('Full upsert failed:', fullError);
        setTestResult({
          error: fullError,
          step: 'full_upsert',
          minimalResult,
          existingData,
          message: 'Table is missing project_end_date and/or total_days columns'
        });
      } else {
        console.log('✅ Full upsert successful:', fullResult);
        setTestResult({
          success: true,
          minimalResult,
          fullResult,
          existingData,
          message: 'All columns are present in the table'
        });
      }

      // Clean up test data
      await supabase
        .from('project_settings')
        .delete()
        .eq('id', 'structure-test');

    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ error, step: 'general' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 m-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Project Settings Table Debug
      </h3>
      
      <button
        onClick={testTableStructure}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Table Structure'}
      </button>

      {testResult && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-white font-medium mb-2">Test Results:</h4>
          
          {testResult.success ? (
            <div className="text-green-400">
              <p>✅ {testResult.message}</p>
              <details className="mt-2">
                <summary className="cursor-pointer">View Details</summary>
                <pre className="mt-2 text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-red-400">
              <p>❌ {testResult.message || 'Test failed'}</p>
              <p className="text-sm mt-1">Failed at step: {testResult.step}</p>
              <details className="mt-2">
                <summary className="cursor-pointer">View Error Details</summary>
                <pre className="mt-2 text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(testResult.error, null, 2)}
                </pre>
              </details>
              {testResult.existingData && (
                <details className="mt-2">
                  <summary className="cursor-pointer">View Existing Data</summary>
                  <pre className="mt-2 text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(testResult.existingData, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
