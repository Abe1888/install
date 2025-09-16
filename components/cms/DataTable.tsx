"use client";

import React from "react";
import { Edit3, Trash2, Eye, MoreHorizontal } from "lucide-react";

type DataType = 'vehicles' | 'locations' | 'team_members' | 'tasks' | 'project_settings' | 'realtime_api' | 'system_status';

interface DataTableProps {
  data: any[];
  dataType: DataType;
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export function DataTable({
  data,
  dataType,
  selectedItems,
  onSelectionChange,
  onEdit,
  onDelete,
}: DataTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  };

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  // Define columns based on data type
  const getColumns = () => {
    switch (dataType) {
      case 'vehicles':
        return [
          { key: 'id', label: 'ID', width: 'w-20' },
          { key: 'type', label: 'Type', width: 'w-32' },
          { key: 'location', label: 'Location', width: 'w-40' },
          { key: 'day', label: 'Day', width: 'w-20' },
          { key: 'time_slot', label: 'Time Slot', width: 'w-32' },
          { key: 'status', label: 'Status', width: 'w-28' },
          { key: 'gps_required', label: 'GPS', width: 'w-20' },
          { key: 'fuel_sensors', label: 'Fuel Sensors', width: 'w-32' },
        ];

      case 'locations':
        return [
          { key: 'name', label: 'Name', width: 'w-48' },
          { key: 'vehicles', label: 'Vehicles', width: 'w-24' },
          { key: 'gps_devices', label: 'GPS Devices', width: 'w-32' },
          { key: 'fuel_sensors', label: 'Fuel Sensors', width: 'w-32' },
        ];

      case 'team_members':
        return [
          { key: 'id', label: 'ID', width: 'w-20' },
          { key: 'name', label: 'Name', width: 'w-48' },
          { key: 'role', label: 'Role', width: 'w-32' },
          { key: 'completion_rate', label: 'Completion Rate', width: 'w-32', render: (value: number) => `${Math.round(value * 100)}%` },
          { key: 'average_task_time', label: 'Avg Task Time', width: 'w-32', render: (value: number) => `${value}m` },
          { key: 'quality_score', label: 'Quality Score', width: 'w-28' },
        ];

      case 'tasks':
        return [
          { key: 'id', label: 'ID', width: 'w-20' },
          { key: 'vehicle_id', label: 'Vehicle', width: 'w-24' },
          { key: 'name', label: 'Name', width: 'w-64' },
          { key: 'status', label: 'Status', width: 'w-28' },
          { key: 'priority', label: 'Priority', width: 'w-24' },
          { key: 'assigned_to', label: 'Assigned To', width: 'w-32' },
          { key: 'created_at', label: 'Created', width: 'w-32', render: (value: string) => new Date(value).toLocaleDateString() },
        ];

      default:
        return [];
    }
  };

  const columns = getColumns();

  const renderCellValue = (item: any, column: any) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value);
    }
    
    if (column.key === 'status') {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'Completed' ? 'bg-green-100 text-green-800' :
          value === 'In Progress' ? 'bg-blue-100 text-blue-800' :
          value === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Blocked' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      );
    }

    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No {dataType} found</div>
        <div className="text-gray-500 text-sm">
          {dataType === 'vehicles' && "Start by adding some vehicles to your project"}
          {dataType === 'locations' && "Add locations where work will be performed"}
          {dataType === 'team_members' && "Add team members to assign tasks"}
          {dataType === 'tasks' && "Create tasks to track work progress"}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Selection column */}
              <th className="px-6 py-3 w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </th>

              {/* Data columns */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width}`}
                >
                  {column.label}
                </th>
              ))}

              {/* Actions column */}
              <th className="px-6 py-3 w-24 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr 
                key={item.id} 
                className={`hover:bg-gray-50 transition-colors ${
                  selectedItems.includes(item.id) ? 'bg-blue-50' : ''
                }`}
              >
                {/* Selection column */}
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </td>

                {/* Data columns */}
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className={`px-6 py-4 text-sm text-gray-900 ${column.width}`}
                    title={String(item[column.key] || '')}
                  >
                    <div className="truncate">
                      {renderCellValue(item, column)}
                    </div>
                  </td>
                ))}

                {/* Actions column */}
                <td className="px-6 py-4 text-right text-sm">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with summary */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-700">
          <div>
            Showing {data.length} {dataType}
            {selectedItems.length > 0 && (
              <span className="ml-2 text-indigo-600 font-medium">
                ({selectedItems.length} selected)
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Real-time data • Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
