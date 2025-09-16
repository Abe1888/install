"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileText, AlertTriangle, Check, Download } from "lucide-react";

type DataType = 'vehicles' | 'locations' | 'team_members' | 'tasks' | 'project_settings' | 'realtime_api' | 'system_status';

interface ImportModalProps {
  dataType: DataType;
  onImport: (data: any[]) => void;
  onClose: () => void;
}

export function ImportModal({ dataType, onImport, onClose }: ImportModalProps) {
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [textData, setTextData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample data templates for each data type
  const getSampleData = () => {
    switch (dataType) {
      case 'vehicles':
        return [
          { type: "Truck", location: "Warehouse A", day: 1, time_slot: "09:00-17:00", status: "Pending", gps_required: true, fuel_sensors: 2 },
          { type: "Van", location: "Warehouse B", day: 1, time_slot: "08:00-16:00", status: "In Progress", gps_required: true, fuel_sensors: 1 }
        ];
      
      case 'locations':
        return [
          { name: "Main Warehouse", vehicles: 5, gps_devices: 3, fuel_sensors: 2 },
          { name: "Distribution Center", vehicles: 3, gps_devices: 2, fuel_sensors: 1 }
        ];
      
      case 'team_members':
        return [
          { name: "John Doe", role: "Technician", completion_rate: 0.85, average_task_time: 120, quality_score: 8.5 },
          { name: "Jane Smith", role: "Specialist", completion_rate: 0.92, average_task_time: 90, quality_score: 9.2 }
        ];
      
      case 'tasks':
        return [
          { name: "Install GPS Tracker", vehicle_id: "V001", status: "Pending", priority: "High", assigned_to: "John Doe", installation_date: "2025-09-15", start_time: "09:00", end_time: "11:00" },
          { name: "Fuel System Check", vehicle_id: "V002", status: "In Progress", priority: "Medium", assigned_to: "Jane Smith", installation_date: "2025-09-16", start_time: "13:00", end_time: "14:30" }
        ];
      
      default:
        return [];
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const text = await file.text();
      let data: any[];

      if (file.name.endsWith('.json')) {
        try {
          const jsonData = JSON.parse(text);
          data = Array.isArray(jsonData) ? jsonData : [jsonData];
        } catch (e) {
          throw new Error('Invalid JSON format');
        }
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else {
        throw new Error('Only CSV and JSON files are supported');
      }

      if (data.length === 0) {
        throw new Error('No data found in file');
      }

      if (data.length > 1000) {
        throw new Error('Maximum 1000 records allowed per import');
      }

      setPreview(data.slice(0, 5)); // Show first 5 records
    } catch (error: any) {
      setError(error.message || 'Failed to process file');
      setPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};

      headers.forEach((header, index) => {
        let value: any = values[index] || '';
        
        // Try to convert to appropriate type
        if (value === 'true' || value === 'false') {
          value = value === 'true';
        } else if (!isNaN(Number(value)) && value !== '') {
          value = Number(value);
        }

        row[header] = value;
      });

      data.push(row);
    }

    return data;
  };

  const handleTextDataChange = (value: string) => {
    setTextData(value);
    setError(null);

    if (value.trim()) {
      try {
        const data = JSON.parse(value);
        const arrayData = Array.isArray(data) ? data : [data];
        
        if (arrayData.length > 1000) {
          throw new Error('Maximum 1000 records allowed per import');
        }
        
        setPreview(arrayData.slice(0, 5));
      } catch (e) {
        setError('Invalid JSON format');
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  };

  const handleImport = async () => {
    try {
      let data: any[];

      if (importMethod === 'file') {
        if (!file) {
          setError('Please select a file to import');
          return;
        }

        const text = await file.text();
        if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(text);
          data = Array.isArray(jsonData) ? jsonData : [jsonData];
        } else {
          data = parseCSV(text);
        }
      } else {
        if (!textData.trim()) {
          setError('Please paste some data to import');
          return;
        }

        const jsonData = JSON.parse(textData);
        data = Array.isArray(jsonData) ? jsonData : [jsonData];
      }

      // Validate data structure
      if (data.length === 0) {
        setError('No data found to import');
        return;
      }

      // Basic validation based on data type
      const requiredFields = getRequiredFields();
      const invalidRows: number[] = [];

      data.forEach((row, index) => {
        const missingFields = requiredFields.filter(field => !row[field] && row[field] !== 0 && row[field] !== false);
        if (missingFields.length > 0) {
          invalidRows.push(index + 1);
        }
      });

      if (invalidRows.length > 0) {
        setError(`Rows ${invalidRows.join(', ')} are missing required fields: ${requiredFields.join(', ')}`);
        return;
      }

      await onImport(data);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to import data');
    }
  };

  const getRequiredFields = (): string[] => {
    switch (dataType) {
      case 'vehicles':
        return ['type', 'location', 'day', 'time_slot', 'status'];
      case 'locations':
        return ['name', 'vehicles'];
      case 'team_members':
        return ['name', 'role', 'completion_rate', 'average_task_time', 'quality_score'];
      case 'tasks':
        return ['name', 'status', 'priority'];
      default:
        return [];
    }
  };

  const downloadSample = () => {
    const sampleData = getSampleData();
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_sample.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Import {dataType.replace('_', ' ')}
              </h3>
              <p className="text-sm text-gray-500">
                Upload CSV or JSON files, or paste data directly
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Import method selection */}
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setImportMethod('file')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  importMethod === 'file'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setImportMethod('paste')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  importMethod === 'paste'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paste Data
              </button>
              <button
                onClick={downloadSample}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 inline-flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Sample Data</span>
              </button>
            </div>

            {/* File upload */}
            {importMethod === 'file' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {file ? file.name : 'Click to select CSV or JSON file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum 1000 records, 10MB file size
                  </p>
                </div>
              </div>
            )}

            {/* Text input */}
            {importMethod === 'paste' && (
              <div>
                <textarea
                  value={textData}
                  onChange={(e) => handleTextDataChange(e.target.value)}
                  placeholder={`Paste JSON data here...\n\nExample:\n${JSON.stringify(getSampleData().slice(0, 1), null, 2)}`}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-sm text-gray-600">Processing...</span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                Preview ({preview.length} of {importMethod === 'file' && file ? 'file' : 'pasted'} data shown)
              </h4>
              <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Required fields info */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Required Fields</h4>
            <p className="text-xs text-blue-700">
              {getRequiredFields().join(', ')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!preview || preview.length === 0 || isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}