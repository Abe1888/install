"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, Filter, Search, ChevronRight } from "lucide-react";
import { getTaskDisplayName } from "@/lib/utils/taskNameCleanup";

type DataType = 'vehicles' | 'locations' | 'team_members' | 'tasks' | 'project_settings' | 'realtime_api' | 'system_status';

interface ModernDataTableProps {
  data: any[];
  dataType: DataType;
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export function ModernDataTable({
  data,
  dataType,
  selectedItems,
  onSelectionChange,
  onEdit,
  onDelete,
}: ModernDataTableProps) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const columns = useMemo(() => {
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
          { key: 'fuel_sensors', label: 'Fuel Sensors', width: 'w-28' },
          { key: 'fuel_tanks', label: 'Fuel Tanks', width: 'w-26' },
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
          { key: 'completion_rate', label: 'Completion Rate', width: 'w-32' },
          { key: 'average_task_time', label: 'Avg Task Time', width: 'w-32' },
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
          { key: 'start_time', label: 'Start Time', width: 'w-24' },
          { key: 'end_time', label: 'End Time', width: 'w-24' },
          { key: 'created_at', label: 'Created', width: 'w-40' },
        ];
      default:
        return [];
    }
  }, [dataType]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let rows = [...data];
    // Column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (!value) return;
      rows = rows.filter((row) => String(row[key] ?? '').toLowerCase().includes(value.toLowerCase()));
    });
    // Sorting
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av === bv) return 0;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc' 
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [data, columnFilters, sortKey, sortDir]);

  // Selection state relative to the filtered set
  const isAllSelected = filtered.length > 0 && selectedItems.length === filtered.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < filtered.length;

  // Group tasks by vehicle, sorting vehicles by the first task ID and tasks within each group by ID
  const groupedTasks = useMemo(() => {
    if (dataType !== 'tasks') return null as null | { vehicleId: string; rows: any[]; sortKey: number | null; firstId: string }[];
    const groups: Record<string, any[]> = {};
    for (const row of filtered) {
      const key = row.vehicle_id ?? 'Unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    const entries = Object.entries(groups).map(([vehicleId, rows]) => {
      rows.sort((a, b) => {
        const ai = Number(a.id);
        const bi = Number(b.id);
        if (!Number.isNaN(ai) && !Number.isNaN(bi)) return ai - bi;
        return String(a.id).localeCompare(String(b.id));
      });
      const firstId = rows[0]?.id;
      const firstNum = Number(firstId);
      const sortKey = Number.isNaN(firstNum) ? null : firstNum;
      return { vehicleId, rows, sortKey, firstId: String(firstId ?? '') };
    });
    entries.sort((a, b) => {
      if (a.sortKey !== null && b.sortKey !== null) return (a.sortKey as number) - (b.sortKey as number);
      if (a.sortKey !== null) return -1;
      if (b.sortKey !== null) return 1;
      return a.firstId.localeCompare(b.firstId);
    });
    return entries;
  }, [dataType, filtered]);

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange(checked ? filtered.map(d => d.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) onSelectionChange([...selectedItems, id]);
    else onSelectionChange(selectedItems.filter(s => s !== id));
  };

  const toggleGroupExpansion = (vehicleId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(vehicleId)) {
      newExpanded.delete(vehicleId);
    } else {
      newExpanded.add(vehicleId);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAllGroups = () => {
    if (groupedTasks) {
      setExpandedGroups(new Set(groupedTasks.map(g => g.vehicleId)));
    }
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  const renderCell = (row: any, key: string) => {
    const value = row[key];
    
    // Special handling for task names - show clean names without vehicle ID prefixes
    if (key === 'name' && dataType === 'tasks') {
      const displayName = getTaskDisplayName({ name: value, vehicle_id: row.vehicle_id });
      return displayName;
    }
    
    if (key === 'status') {
      const map: Record<string, string> = {
        'Completed': 'bg-green-100 text-green-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Blocked': 'bg-red-100 text-red-800',
      };
      return <span className={`px-2 py-0.5 rounded text-xs ${map[String(value)] || 'bg-gray-100 text-gray-800'}`}>{String(value)}</span>;
    }
    if (key === 'start_time' || key === 'end_time') {
      if (!value) return '—';
      // Format time: "14:30:00" -> "2:30 PM" or "09:00:00" -> "9:00 AM"
      const timeStr = String(value);
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return timeStr;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (key === 'created_at') return value ? new Date(value).toLocaleString() : '—';
    return value ?? '—';
  };

  return (
    <div className="overflow-hidden">
      {/* Group controls for tasks */}
      {dataType === 'tasks' && groupedTasks && groupedTasks.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedItems.length} of {filtered.length} selected
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">
                {groupedTasks.length} vehicle group{groupedTasks.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAllGroups}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Expand All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={collapseAllGroups}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                />
              </th>
              {columns.map((c) => (
                <th key={c.key} className={`px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider ${c.width}`}>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => toggleSort(c.key)} className="flex items-center space-x-1 group">
                      <span>{c.label}</span>
                      <span className="text-gray-400 group-hover:text-gray-600">
                        {sortKey !== c.key && <ArrowUpDown className="w-3.5 h-3.5" />}
                        {sortKey === c.key && (sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                      </span>
                    </button>
                  </div>
                  {/* Column filter */}
                  <div className="mt-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        value={columnFilters[c.key] || ''}
                        onChange={(e) => setColumnFilters({ ...columnFilters, [c.key]: e.target.value })}
                        placeholder={`Filter ${c.label}`}
                        className="pl-7 pr-2 py-1.5 w-full border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dataType === 'tasks' && groupedTasks && groupedTasks.map((group) => {
              const isExpanded = expandedGroups.has(group.vehicleId);
              return (
                <React.Fragment key={`group-${group.vehicleId}`}>
                  <tr 
                    className="bg-gray-50 hover:bg-gray-100 cursor-pointer border-t-2 border-gray-200" 
                    onClick={() => toggleGroupExpansion(group.vehicleId)}
                  >
                    <td colSpan={columns.length + 2} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ChevronRight 
                            className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
                              isExpanded ? 'transform rotate-90' : ''
                            }`} 
                          />
                          <span className="text-sm font-semibold text-gray-800">
                            Vehicle {group.vehicleId}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {group.rows.length} task{group.rows.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 italic">
                          {isExpanded ? 'Click to collapse' : 'Click to expand'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && group.rows.map((row, index) => (
                    <tr key={row.id} className={`hover:bg-gray-50 ${selectedItems.includes(row.id) ? 'bg-indigo-50' : ''} ${index === group.rows.length - 1 ? 'border-b-2 border-gray-200' : ''}`}>
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(row.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(row.id, e.target.checked);
                          }}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                        />
                      </td>
                      {columns.map((c) => (
                        <td key={c.key} className={`px-6 py-3 text-sm text-gray-900 ${c.width}`} title={String(row[c.key] ?? '')}>
                          <div className="truncate">{renderCell(row, c.key)}</div>
                        </td>
                      ))}
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onEdit(row); 
                            }} 
                            className="px-2 py-1 text-xs rounded-md border border-gray-200 hover:bg-gray-50 text-indigo-700"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onDelete(row); 
                            }} 
                            className="px-2 py-1 text-xs rounded-md border border-gray-200 hover:bg-gray-50 text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {dataType !== 'tasks' && filtered.map((row) => (
              <tr key={row.id} className={`hover:bg-gray-50 ${selectedItems.includes(row.id) ? 'bg-indigo-50' : ''}`}>
                <td className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(row.id)}
                    onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                  />
                </td>
                {columns.map((c) => (
                  <td key={c.key} className={`px-6 py-3 text-sm text-gray-900 ${c.width}`} title={String(row[c.key] ?? '')}>
                    <div className="truncate">{renderCell(row, c.key)}</div>
                  </td>
                ))}
                <td className="px-6 py-3 text-right">
                  <div className="inline-flex items-center space-x-1">
                    <button onClick={() => onEdit(row)} className="px-2 py-1 text-xs rounded-md border border-gray-200 hover:bg-gray-50 text-indigo-700">Edit</button>
                    <button onClick={() => onDelete(row)} className="px-2 py-1 text-xs rounded-md border border-gray-200 hover:bg-gray-50 text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-10 text-center text-sm text-gray-500">No results match the current filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-700">
        <div>
          Showing {filtered.length} of {data.length}
          {selectedItems.length > 0 && (
            <span className="ml-2 text-indigo-600 font-medium">({selectedItems.length} selected)</span>
          )}
        </div>
        <div className="text-xs text-gray-500">Real-time data • Updated {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
