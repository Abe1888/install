'use client';

import React, { useState, useCallback } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  FileText,
  Archive,
  HardDrive,
  Settings,
  Server,
  Layers,
  BookOpen,
  Save,
  FolderOpen,
  Calendar,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface BackupResult {
  success: boolean;
  message: string;
  filename?: string;
  size?: number;
  downloadUrl?: string;
  error?: string;
  metadata?: {
    timestamp: string;
    tables: string[];
    recordCount: number;
    schemaVersion: string;
  };
}

interface MigrationBackupResult {
  success: boolean;
  message: string;
  migrations: Array<{
    filename: string;
    content: string;
    timestamp: string;
  }>;
  error?: string;
}

export function DatabaseBackupManager() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isCreatingMigrationBackup, setIsCreatingMigrationBackup] = useState(false);
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationBackupResult | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([
    'vehicles',
    'tasks', 
    'team_members',
    'locations',
    'project_settings',
    'comments'
  ]);

  // Available tables for backup
  const availableTables = [
    { name: 'vehicles', label: 'Vehicles', description: 'Vehicle information and status' },
    { name: 'tasks', label: 'Tasks', description: 'Task assignments and scheduling' },
    { name: 'team_members', label: 'Team Members', description: 'Staff and team information' },
    { name: 'locations', label: 'Locations', description: 'Installation locations' },
    { name: 'project_settings', label: 'Project Settings', description: 'Project configuration' },
    { name: 'comments', label: 'Comments', description: 'Task comments and notes' }
  ];

  const toggleTableSelection = useCallback((tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(name => name !== tableName)
        : [...prev, tableName]
    );
  }, []);

  const selectAllTables = useCallback(() => {
    setSelectedTables(availableTables.map(table => table.name));
  }, []);

  const clearTableSelection = useCallback(() => {
    setSelectedTables([]);
  }, []);

  // Create SQL Database Backup
  const handleCreateDatabaseBackup = useCallback(async () => {
    if (selectedTables.length === 0) {
      setBackupResult({
        success: false,
        message: 'Please select at least one table to backup',
        error: 'No tables selected'
      });
      return;
    }

    setIsCreatingBackup(true);
    setBackupResult(null);

    try {
      // Get data from each selected table
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;

      for (const tableName of selectedTables) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) {
          throw new Error(`Failed to backup table ${tableName}: ${error.message}`);
        }

        backupData[tableName] = data || [];
        totalRecords += (data || []).length;
      }

      // Create comprehensive backup object
      const timestamp = new Date().toISOString();
      const backup = {
        metadata: {
          timestamp,
          version: '1.0',
          source: 'Task Management System',
          tables: selectedTables,
          recordCount: totalRecords,
          schemaVersion: 'latest',
          backupType: 'full'
        },
        data: backupData,
        schema: {
          // Include basic schema information
          tables: availableTables.filter(table => selectedTables.includes(table.name))
        }
      };

      // Convert to SQL format
      let sqlContent = `-- Task Management System Database Backup\n`;
      sqlContent += `-- Created: ${new Date(timestamp).toLocaleString()}\n`;
      sqlContent += `-- Tables: ${selectedTables.join(', ')}\n`;
      sqlContent += `-- Total Records: ${totalRecords}\n\n`;

      sqlContent += `-- Backup Metadata\n`;
      sqlContent += `-- This backup contains data from the following tables:\n`;
      selectedTables.forEach(tableName => {
        sqlContent += `-- - ${tableName}: ${backupData[tableName].length} records\n`;
      });
      sqlContent += `\n`;

      // Generate SQL INSERT statements for each table
      for (const tableName of selectedTables) {
        const tableData = backupData[tableName];
        if (tableData.length === 0) continue;

        sqlContent += `-- Data for table: ${tableName}\n`;
        sqlContent += `DELETE FROM ${tableName}; -- Clear existing data\n`;

        // Get column names from first record
        const columns = Object.keys(tableData[0]);
        
        tableData.forEach(record => {
          const values = columns.map(col => {
            const value = record[col];
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
            if (value instanceof Date) return `'${value.toISOString()}'`;
            return String(value);
          });

          sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        });

        sqlContent += `\n`;
      }

      // Add JSON backup as comment for reference
      sqlContent += `/*\nJSON Backup Data:\n${JSON.stringify(backup, null, 2)}\n*/\n`;

      // Create downloadable file
      const filename = `database_backup_${timestamp.slice(0, 19).replace(/:/g, '-')}.sql`;
      const blob = new Blob([sqlContent], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupResult({
        success: true,
        message: `Database backup created successfully`,
        filename,
        size: blob.size,
        metadata: {
          timestamp,
          tables: selectedTables,
          recordCount: totalRecords,
          schemaVersion: 'latest'
        }
      });

    } catch (error: any) {
      setBackupResult({
        success: false,
        message: 'Failed to create database backup',
        error: error.message || 'Unknown error occurred'
      });
    } finally {
      setIsCreatingBackup(false);
    }
  }, [selectedTables]);

  // Create Migration Schema Backup
  const handleCreateMigrationBackup = useCallback(async () => {
    setIsCreatingMigrationBackup(true);
    setMigrationResult(null);

    try {
      // Get migration files from the server
      const response = await fetch('/api/admin/backup-migrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch migration files');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to backup migrations');
      }

      // Create a comprehensive migration backup
      const timestamp = new Date().toISOString();
      const migrationBackup = {
        metadata: {
          timestamp,
          version: '1.0',
          source: 'Task Management System',
          migrationCount: result.migrations.length,
          backupType: 'migrations'
        },
        migrations: result.migrations
      };

      // Create migration backup file content
      let backupContent = `-- Migration Schema Backup\n`;
      backupContent += `-- Created: ${new Date(timestamp).toLocaleString()}\n`;
      backupContent += `-- Migration Files: ${result.migrations.length}\n\n`;

      result.migrations.forEach((migration: any, index: number) => {
        backupContent += `-- Migration ${index + 1}: ${migration.filename}\n`;
        backupContent += `-- Created: ${migration.timestamp}\n`;
        backupContent += `${migration.content}\n\n`;
        backupContent += `-- End of ${migration.filename}\n`;
        backupContent += `${'='.repeat(80)}\n\n`;
      });

      // Add JSON metadata as comment
      backupContent += `/*\nMigration Backup Metadata:\n${JSON.stringify(migrationBackup.metadata, null, 2)}\n*/\n`;

      // Create downloadable file
      const filename = `migration_backup_${timestamp.slice(0, 19).replace(/:/g, '-')}.sql`;
      const blob = new Blob([backupContent], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMigrationResult({
        success: true,
        message: `Migration backup created successfully`,
        migrations: result.migrations
      });

    } catch (error: any) {
      setMigrationResult({
        success: false,
        message: 'Failed to create migration backup',
        migrations: [],
        error: error.message || 'Unknown error occurred'
      });
    } finally {
      setIsCreatingMigrationBackup(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* SQL Database Backup Section */}
      <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-600 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">SQL Database Backup</h4>
              <p className="text-sm text-gray-400">Export database tables as downloadable SQL file</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Table Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-md font-semibold text-white">Select Tables to Backup</h5>
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllTables}
                  className="px-3 py-1 text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-900/20 rounded transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearTableSelection}
                  className="px-3 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableTables.map(table => (
                <div
                  key={table.name}
                  onClick={() => toggleTableSelection(table.name)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedTables.includes(table.name)
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(table.name)}
                          onChange={() => toggleTableSelection(table.name)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <h6 className="font-medium text-white">{table.label}</h6>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 ml-6">{table.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-blue-300">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} selected for backup
                </span>
              </div>
            </div>
          </div>

          {/* Backup Button */}
          <button
            onClick={handleCreateDatabaseBackup}
            disabled={selectedTables.length === 0 || isCreatingBackup}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Creating Backup...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Create SQL Database Backup</span>
              </>
            )}
          </button>

          {/* Backup Result */}
          {backupResult && (
            <div className={`border rounded-lg p-4 ${
              backupResult.success 
                ? 'bg-green-900/20 border-green-700 text-green-100'
                : 'bg-red-900/20 border-red-700 text-red-100'
            }`}>
              <div className="flex items-start space-x-3">
                {backupResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold mb-1">{backupResult.message}</div>
                  {backupResult.success && backupResult.metadata && (
                    <div className="text-sm space-y-1">
                      <div>📁 File: {backupResult.filename}</div>
                      <div>📊 Records: {backupResult.metadata.recordCount.toLocaleString()}</div>
                      <div>📅 Created: {new Date(backupResult.metadata.timestamp).toLocaleString()}</div>
                      <div>🗃️ Tables: {backupResult.metadata.tables.join(', ')}</div>
                    </div>
                  )}
                  {backupResult.error && (
                    <div className="text-sm text-red-300 mt-2">
                      Error: {backupResult.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Migration Schema Backup Section */}
      <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-600 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Migration Schema Backup</h4>
              <p className="text-sm text-gray-400">Backup database migration files and schema changes</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-purple-200 font-semibold mb-2">Migration Backup Contents</h5>
                <ul className="text-purple-300 text-sm space-y-1">
                  <li>• All SQL migration files from /supabase/migrations/</li>
                  <li>• Database schema changes and evolution history</li>
                  <li>• Table structure modifications and additions</li>
                  <li>• Complete migration timeline for restoration</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateMigrationBackup}
            disabled={isCreatingMigrationBackup}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
          >
            {isCreatingMigrationBackup ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Creating Migration Backup...</span>
              </>
            ) : (
              <>
                <Archive className="w-5 h-5" />
                <span>Create Migration Schema Backup</span>
              </>
            )}
          </button>

          {/* Migration Backup Result */}
          {migrationResult && (
            <div className={`border rounded-lg p-4 ${
              migrationResult.success 
                ? 'bg-green-900/20 border-green-700 text-green-100'
                : 'bg-red-900/20 border-red-700 text-red-100'
            }`}>
              <div className="flex items-start space-x-3">
                {migrationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold mb-1">{migrationResult.message}</div>
                  {migrationResult.success && (
                    <div className="text-sm space-y-1">
                      <div>📁 Migration files: {migrationResult.migrations.length}</div>
                      <div>📅 Created: {new Date().toLocaleString()}</div>
                      <div className="mt-2">
                        <details className="text-xs">
                          <summary className="cursor-pointer hover:text-green-200">View migration files</summary>
                          <div className="mt-1 pl-4">
                            {migrationResult.migrations.map((migration, index) => (
                              <div key={index} className="text-green-300">
                                • {migration.filename}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                  {migrationResult.error && (
                    <div className="text-sm text-red-300 mt-2">
                      Error: {migrationResult.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
        <h5 className="text-gray-200 font-semibold mb-3">📋 Backup Instructions</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <div className="font-medium text-blue-300 mb-2">SQL Database Backup:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Select the tables you want to backup</li>
              <li>Click "Create SQL Database Backup"</li>
              <li>Wait for the backup to be generated</li>
              <li>File will download automatically as .sql file</li>
            </ol>
          </div>
          <div>
            <div className="font-medium text-purple-300 mb-2">Migration Schema Backup:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Create Migration Schema Backup"</li>
              <li>System will collect all migration files</li>
              <li>Wait for the backup to be generated</li>
              <li>File will download automatically as .sql file</li>
            </ol>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-400">
            <strong>Note:</strong> Both backups can be used to restore your database in a retail environment. 
            The SQL backup contains your data, while the migration backup contains your schema structure.
          </p>
        </div>
      </div>
    </div>
  );
}
