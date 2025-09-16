'use client';

import React, { useState, memo, useMemo, useCallback } from 'react';
import { 
  Calendar, Clock, MapPin, Truck, Navigation, Fuel, CheckCircle2, AlertTriangle, 
  Activity, Target, RefreshCw, Filter, Search, ChevronLeft, ChevronRight,
  Users, Edit, Save, X, Move, RotateCcw, AlertCircle, Info, Settings, ChevronDown
} from 'lucide-react';
import { useVehicles, useLocations, useTeamMembers } from '@/lib/hooks/useUnifiedData';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/supabase/database';
import { Vehicle } from '@/lib/supabase/types';
import { useProjectSettings } from '@/lib/hooks/useProjectSettings';
import { calculateDateForDay } from '@/lib/utils/projectUtils';
import { cn } from '@/lib/utils/cn';

interface VehicleScheduleCalendarProps {
  className?: string;
}

interface RescheduleModalProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onConfirm: (vehicleId: string, newDay: number, newTimeSlot: string) => Promise<void>;
  availableDays: number[];
  currentDay: number;
  currentTimeSlot: string;
  availableTimeSlots: string[];
}

const timeSlots = [
  '8:30-11:30 AM', '1:30-5:30 PM'
];

const RescheduleModal: React.FC<RescheduleModalProps> = memo(({ 
  isOpen, vehicle, onClose, onConfirm, availableDays, currentDay, currentTimeSlot, availableTimeSlots 
}) => {
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(currentTimeSlot);
  const [isLoading, setIsLoading] = useState(false);
  const { settings: projectSettings } = useProjectSettings();

  const handleConfirm = async () => {
    if (!vehicle || (selectedDay === currentDay && selectedTimeSlot === currentTimeSlot)) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(vehicle.id, selectedDay, selectedTimeSlot);
      onClose();
    } catch (error) {
      // Log error only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to reschedule vehicle:', error)
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !vehicle) return null;

  const projectStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0];
  const newInstallationDate = calculateDateForDay(projectStartDate, selectedDay);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md mx-4">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Reschedule Installation
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="card-body space-y-4">
          <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
            <div className="flex items-start space-x-3">
              <Truck className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Vehicle: {vehicle.id}</h4>
                <p className="text-sm text-gray-600">{vehicle.type} • {vehicle.location}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Current: Day {currentDay} • {currentTimeSlot}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">
              Select New Day
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="form-select"
            >
              {availableDays.map(day => (
                <option key={day} value={day}>
                  Day {day} ({new Date(calculateDateForDay(projectStartDate, day)).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">
              Select New Time Slot
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableTimeSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-colors",
                    selectedTimeSlot === slot
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-primary-300"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {selectedDay !== currentDay || selectedTimeSlot !== currentTimeSlot ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">New Schedule</p>
                  <p className="text-sm text-gray-600">
                    Day {selectedDay} • {selectedTimeSlot}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(newInstallationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Select a different day or time slot to reschedule
              </p>
            </div>
          )}
        </div>

        <div className="card-footer">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || (selectedDay === currentDay && selectedTimeSlot === currentTimeSlot)}
              className="btn-primary flex items-center space-x-2"
            >
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Reschedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const VehicleScheduleCalendar: React.FC<VehicleScheduleCalendarProps> = memo(({ className }) => {
  const { data: vehicles = [], isLoading: vehiclesLoading, mutate: refetchVehicles } = useVehicles();
  const { data: locations = [] } = useLocations();
  const { data: teamMembers = [] } = useTeamMembers();
  const { settings: projectSettings } = useProjectSettings();
  
  // State for rescheduling
  const [rescheduleModal, setRescheduleModal] = useState({
    isOpen: false,
    vehicle: null as Vehicle | null,
  });
  
  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentWeek, setCurrentWeek] = useState(0);

  // Get current project start date
  const projectStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0];
  
  // Calculate days and weeks
  const totalDays = 14; // 2-week project
  const daysPerWeek = 7;
  const totalWeeks = Math.ceil(totalDays / daysPerWeek);
  
  const getCurrentWeekDays = useMemo(() => {
    const start = currentWeek * daysPerWeek + 1;
    const end = Math.min(start + daysPerWeek - 1, totalDays);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentWeek, totalDays, daysPerWeek]);

  // Calculate schedule statistics like in the original
  const getScheduleStats = useMemo(() => {
    const total = vehicles.length;
    const completed = vehicles.filter(v => v.status === 'Completed').length;
    const inProgress = vehicles.filter(v => v.status === 'In Progress').length;
    const pending = vehicles.filter(v => v.status === 'Pending').length;
    
    return { total, completed, inProgress, pending };
  }, [vehicles]);

  // Group vehicles by day and time slot
  const getVehiclesByDayAndTime = useMemo(() => {
    const filtered = vehicles.filter(vehicle => {
      const locationMatch = selectedLocation === 'All' || vehicle.location === selectedLocation;
      const statusMatch = selectedStatus === 'All' || vehicle.status === selectedStatus;
      const searchMatch = searchTerm === '' || 
        vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      return locationMatch && statusMatch && searchMatch;
    });

    const grouped: Record<number, Record<string, Vehicle[]>> = {};
    
    filtered.forEach(vehicle => {
      if (!grouped[vehicle.day]) {
        grouped[vehicle.day] = {};
      }
      if (!grouped[vehicle.day][vehicle.time_slot]) {
        grouped[vehicle.day][vehicle.time_slot] = [];
      }
      grouped[vehicle.day][vehicle.time_slot].push(vehicle);
    });

    return grouped;
  }, [vehicles, selectedLocation, selectedStatus, searchTerm]);

  // Available days for rescheduling (all project days)
  const availableDays = useMemo(() => 
    Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays]
  );

  // Reschedule functionality
  const handleRescheduleClick = useCallback((vehicle: Vehicle) => {
    setRescheduleModal({
      isOpen: true,
      vehicle,
    });
  }, []);

  const handleRescheduleConfirm = useCallback(async (vehicleId: string, newDay: number, newTimeSlot: string) => {
    try {
      const { error } = await db.vehicles.update(vehicleId, {
        day: newDay,
        time_slot: newTimeSlot,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      
      // Refetch vehicles to update the calendar
      await refetchVehicles()
    } catch (error) {
      // Log error only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to reschedule vehicle:', error)
      }
      throw error
    }
  }, [refetchVehicles]);

  const handleStatusUpdate = useCallback(async (vehicleId: string, status: Vehicle['status']) => {
    try {
      const { error } = await db.vehicles.update(vehicleId, {
        status, 
        updated_at: new Date().toISOString() 
      });

      if (error) throw error;
      await refetchVehicles()
    } catch (error) {
      // Log error only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update vehicle status:', error)
      }
    }
  }, [refetchVehicles]);


  // Utility functions
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  }, []);

  // Get unique time slots from actual data
  const actualTimeSlots = Array.from(new Set(vehicles.map(v => v.time_slot))).filter(Boolean).sort();
  

  if (vehiclesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Loading installation schedule data...</p>
      </div>
    );
  }

  // Show debug info if no vehicles
  if (vehicles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Installation Schedule Calendar</h2>
            <p className="text-gray-600">No vehicle data found in database</p>
          </div>
          <button
            onClick={() => refetchVehicles()}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-900">No Installation Data</h3>
          </div>
          <div className="space-y-2 text-sm text-yellow-800">
            <p>No vehicle installation data found in the database.</p>
            <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
              <p className="font-medium text-yellow-900 mb-2">To populate with data:</p>
              <ol className="list-decimal pl-5 space-y-1 text-yellow-800">
                <li>Go to <strong>Data Management</strong> page</li>
                <li>Use the <strong>Vehicle Data Manager</strong> to add vehicles</li>
                <li>Make sure vehicles have proper day and time_slot values</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Modern Professional Header */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Installation Schedule</h1>
                <p className="text-gray-600 text-sm mt-1">Manage and track vehicle installation schedules</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{getScheduleStats.total}</div>
                  <div className="text-xs text-gray-500">Total Vehicles</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{getScheduleStats.completed}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{getScheduleStats.inProgress}</div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{getScheduleStats.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>
              
              <button
                onClick={() => refetchVehicles()}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Filter Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search vehicles..."
                  className="form-input pl-9"
                />
              </div>
            </div>
            
            <div>
              <label className="form-label">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="form-select"
              >
                <option value="All">All Locations</option>
                {locations.map(location => (
                  <option key={location.name} value={location.name}>{location.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="form-label">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Week Navigation */}
      <div className="card">
        <div className="card-body py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
              disabled={currentWeek === 0}
              className="btn-secondary flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Week {currentWeek + 1} of {totalWeeks}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Days {getCurrentWeekDays[0]} - {getCurrentWeekDays[getCurrentWeekDays.length - 1]} • 
                {Object.keys(getVehiclesByDayAndTime).filter(day => getCurrentWeekDays.includes(Number(day))).length} active days
              </p>
            </div>
            
            <button
              onClick={() => setCurrentWeek(Math.min(totalWeeks - 1, currentWeek + 1))}
              disabled={currentWeek >= totalWeeks - 1}
              className="btn-secondary flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clean Calendar Grid */}
      <div className="card overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
          <div className="p-4 border-r border-gray-200">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900 text-sm">Time Slot</span>
            </div>
          </div>
          {getCurrentWeekDays.map(day => {
            const dayDate = new Date(calculateDateForDay(projectStartDate, day));
            const hasVehicles = getVehiclesByDayAndTime[day];
            return (
              <div key={day} className="p-4 border-r border-gray-200 last:border-r-0 text-center">
                <div className="flex flex-col items-center space-y-1">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm",
                    hasVehicles 
                      ? "bg-primary-100 text-primary-700" 
                      : "bg-gray-200 text-gray-600"
                  )}>
                    {day}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-xs">
                      {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar Rows */}
        {actualTimeSlots.map((timeSlot, index) => (
          <div key={timeSlot} className={cn(
            "grid grid-cols-8 border-t border-gray-200",
            index % 2 === 0 ? "bg-gray-25" : "bg-white"
          )}>
            <div className="p-4 border-r border-gray-200 bg-gray-50">
              <div className="space-y-1">
                <div className="font-semibold text-gray-900 text-sm">{timeSlot}</div>
                <div className="text-xs text-gray-500">
                  {getVehiclesByDayAndTime && Object.keys(getVehiclesByDayAndTime).reduce((count, day) => {
                    return count + (getVehiclesByDayAndTime[parseInt(day)]?.[timeSlot]?.length || 0);
                  }, 0)} vehicles
                </div>
              </div>
            </div>
            {getCurrentWeekDays.map(day => (
              <div key={`${day}-${timeSlot}`} className="p-3 border-r border-gray-200 last:border-r-0 min-h-[120px]">
                <div className="space-y-2">
                  {getVehiclesByDayAndTime[day]?.[timeSlot]?.map(vehicle => (
                    <div
                      key={vehicle.id}
                      className={cn(
                        "relative p-3 rounded-lg border text-sm cursor-pointer transition-all duration-200 hover:shadow-md",
                        getStatusColor(vehicle.status)
                      )}
                      onClick={() => handleRescheduleClick(vehicle)}
                    >
                      {/* Status indicator */}
                      <div className="absolute top-2 right-2">
                        {getStatusIcon(vehicle.status)}
                      </div>
                      
                      <div className="space-y-2 pr-6">
                        {/* Vehicle Header */}
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4" />
                          <span className="font-semibold">{vehicle.id}</span>
                        </div>
                        
                        {/* Vehicle Info */}
                        <div className="space-y-1 text-xs">
                          <div className="font-medium truncate">{vehicle.type}</div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{vehicle.location}</span>
                          </div>
                        </div>
                        
                        {/* Equipment Info */}
                        {(vehicle.gps_required > 0 || vehicle.fuel_sensors > 0) && (
                          <div className="flex items-center space-x-3 pt-1 text-xs text-gray-600">
                            {vehicle.gps_required > 0 && (
                              <div className="flex items-center space-x-1">
                                <Navigation className="w-3 h-3" />
                                <span>{vehicle.gps_required}</span>
                              </div>
                            )}
                            {vehicle.fuel_sensors > 0 && (
                              <div className="flex items-center space-x-1">
                                <Fuel className="w-3 h-3" />
                                <span>{vehicle.fuel_sensors}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-current border-opacity-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRescheduleClick(vehicle);
                            }}
                            className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 font-medium"
                          >
                            <Move className="w-3 h-3" />
                            <span>Move</span>
                          </button>
                          <select
                            value={vehicle.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(vehicle.id, e.target.value as Vehicle['status']);
                            }}
                            className="text-xs bg-transparent border-none p-0 font-medium cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Empty slot indicator */}
                  {(!getVehiclesByDayAndTime[day]?.[timeSlot] || getVehiclesByDayAndTime[day][timeSlot].length === 0) && (
                    <div className="h-full flex items-center justify-center text-center py-8">
                      <div className="text-xs text-gray-400">
                        No installations
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>


      {/* Clean Legend */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Legend</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Indicators */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Status</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">In Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Pending</span>
                </div>
              </div>
            </div>
            
            {/* Equipment Icons */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Equipment</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">GPS Devices</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Fuel className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Fuel Sensors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Move className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Click to reschedule</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={rescheduleModal.isOpen}
        vehicle={rescheduleModal.vehicle}
        onClose={() => setRescheduleModal({ isOpen: false, vehicle: null })}
        onConfirm={handleRescheduleConfirm}
        availableDays={availableDays}
        currentDay={rescheduleModal.vehicle?.day || 1}
        currentTimeSlot={rescheduleModal.vehicle?.time_slot || actualTimeSlots[0] || '8:30-11:30 AM'}
        availableTimeSlots={actualTimeSlots}
      />
    </div>
  );
});

VehicleScheduleCalendar.displayName = 'VehicleScheduleCalendar';
RescheduleModal.displayName = 'RescheduleModal';

export default VehicleScheduleCalendar;
