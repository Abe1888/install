import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Test API to apply cleaned seed data with minimal shared tasks
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    console.log('🌱 Applying cleaned seed data...');
    
    // 1. Project Settings
    await supabase.from('project_settings').insert([{
      id: 'default',
      project_start_date: '2025-09-10',
      project_end_date: '2025-09-24',
      total_days: 15
    }]);
    
    // 2. Locations
    await supabase.from('locations').insert([
      {
        name: 'Bahir Dar',
        vehicles: 15,
        gps_devices: 15,
        fuel_sensors: 16,
        address: 'Bahir Dar, Ethiopia',
        contact_person: 'Installation Team Lead',
        contact_phone: '+251-91-234-5678',
        installation_days: 'Days 1-8'
      },
      {
        name: 'Kombolcha',
        vehicles: 6,
        gps_devices: 6,
        fuel_sensors: 7,
        address: 'Kombolcha, Ethiopia',
        contact_person: 'Field Operations Manager',
        contact_phone: '+251-91-345-6789',
        installation_days: 'Days 10-12'
      },
      {
        name: 'Addis Ababa',
        vehicles: 3,
        gps_devices: 3,
        fuel_sensors: 3,
        address: 'Addis Ababa, Ethiopia',
        contact_person: 'Regional Coordinator',
        contact_phone: '+251-91-456-7890',
        installation_days: 'Days 13-14'
      }
    ]);
    
    // 3. Team Members
    await supabase.from('team_members').insert([
      {
        id: 'TM001',
        name: 'Abebaw',
        role: 'Software Engineer',
        specializations: ['System Configuration', 'Quality Assurance', 'Documentation'],
        completion_rate: 85,
        average_task_time: 45,
        quality_score: 92,
        email: 'abebaw@company.com',
        phone: '+251-91-111-1111'
      },
      {
        id: 'TM002',
        name: 'Tewachew',
        role: 'Electrical Engineer',
        specializations: ['Vehicle Inspection', 'GPS Device Installation'],
        completion_rate: 90,
        average_task_time: 50,
        quality_score: 94,
        email: 'tewachew@company.com',
        phone: '+251-91-222-2222'
      },
      {
        id: 'TM003',
        name: 'Mandefro',
        role: 'Mechanical Engineer',
        specializations: ['Fuel Sensor Installation', 'Fuel Sensor Calibration'],
        completion_rate: 88,
        average_task_time: 55,
        quality_score: 89,
        email: 'mandefro@company.com',
        phone: '+251-91-333-3333'
      },
      {
        id: 'TM004',
        name: 'Mamaru',
        role: 'Mechanic',
        specializations: ['Fuel Sensor Installation', 'Fuel Sensor Calibration'],
        completion_rate: 82,
        average_task_time: 60,
        quality_score: 87,
        email: 'mamaru@company.com',
        phone: '+251-91-444-4444'
      },
      {
        id: 'TM005',
        name: 'David Rodriguez',
        role: 'Installation Technician',
        specializations: ['GPS Installation', 'Documentation'],
        completion_rate: 90,
        average_task_time: 48,
        quality_score: 93,
        email: 'david.rodriguez@company.com',
        phone: '+251-91-555-5555'
      }
    ]);
    
    // 4. Vehicles (first 3 as sample)
    await supabase.from('vehicles').insert([
      { id: 'V001', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 1, time_slot: '08:30–11:50 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V002', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 1, time_slot: '01:30–04:50 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V003', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 2, time_slot: '08:30–11:50 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 }
    ]);
    
    // 5. ONLY Essential Shared Tasks
    
    // Lunch Break (only 2 days for test)
    await supabase.from('tasks').insert([
      {
        vehicle_id: null,
        name: 'Lunch Break',
        description: 'Daily lunch break for all team members - 12:30 PM to 1:30 PM',
        status: 'Completed',
        assigned_to: 'All Team',
        priority: 'Low',
        start_date: '2025-09-10',
        end_date: '2025-09-10',
        start_time: '12:30:00',
        end_time: '13:30:00',
        timeslot_bucket: 'lunch',
        location: 'Bahir Dar',
        category: 'break',
        installation_step: 0,
        sub_task_order: 1,
        duration_minutes: 60,
        task_template_id: 'lunch_break',
        is_recurring: true,
        estimated_duration: 0.125
      },
      {
        vehicle_id: null,
        name: 'Lunch Break',
        description: 'Daily lunch break for all team members - 12:30 PM to 1:30 PM',
        status: 'Completed',
        assigned_to: 'All Team',
        priority: 'Low',
        start_date: '2025-09-11',
        end_date: '2025-09-11',
        start_time: '12:30:00',
        end_time: '13:30:00',
        timeslot_bucket: 'lunch',
        location: 'Bahir Dar',
        category: 'break',
        installation_step: 0,
        sub_task_order: 1,
        duration_minutes: 60,
        task_template_id: 'lunch_break',
        is_recurring: true,
        estimated_duration: 0.125
      }
    ]);
    
    // Travel to Kombolcha
    await supabase.from('tasks').insert([{
      vehicle_id: null,
      name: 'Travel to Kombolcha',
      description: 'Team and equipment transport from Bahir Dar to Kombolcha location',
      status: 'Pending',
      assigned_to: 'All Team',
      priority: 'High',
      start_date: '2025-09-18', // Day 9
      end_date: '2025-09-18',
      start_time: '09:00:00',
      end_time: '12:00:00',
      timeslot_bucket: 'morning',
      location: 'Travel',
      category: 'travel',
      installation_step: 0,
      sub_task_order: 1,
      duration_minutes: 180,
      task_template_id: 'travel_transport',
      is_recurring: false,
      estimated_duration: 0.25
    }]);
    
    // Add some vehicle installation tasks for testing
    await supabase.from('tasks').insert([
      {
        vehicle_id: 'V001',
        name: 'Vehicle Inspection',
        description: 'Comprehensive vehicle inspection and documentation',
        status: 'Pending',
        assigned_to: 'TM002',
        priority: 'High',
        start_date: '2025-09-10',
        end_date: '2025-09-10',
        start_time: '08:30:00',
        end_time: '08:40:00',
        timeslot_bucket: 'morning',
        location: 'Bahir Dar',
        category: 'installation',
        installation_step: 1,
        sub_task_order: 1,
        duration_minutes: 10,
        task_template_id: 'vehicle_inspection',
        is_recurring: false,
        estimated_duration: 0.021
      },
      {
        vehicle_id: 'V001',
        name: 'GPS Installation',
        description: 'Install and mount GPS tracking device',
        status: 'Pending',
        assigned_to: 'TM002',
        priority: 'High',
        start_date: '2025-09-10',
        end_date: '2025-09-10',
        start_time: '08:40:00',
        end_time: '09:40:00',
        timeslot_bucket: 'morning',
        location: 'Bahir Dar',
        category: 'installation',
        installation_step: 2,
        sub_task_order: 2,
        duration_minutes: 60,
        task_template_id: 'gps_installation',
        is_recurring: false,
        estimated_duration: 0.125
      }
    ]);
    
    console.log('✅ Cleaned seed data applied successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Cleaned seed data applied successfully',
      sharedTasksSummary: {
        lunchBreaks: 2,
        travelTasks: 1,
        totalSharedTasks: 3,
        removedUnnecessaryTasks: [
          'Daily Team Briefing',
          'Progress Review Meeting', 
          'Equipment Check',
          'Equipment Packing',
          'Site Setup',
          'Equipment Verification',
          'Next Day Planning'
        ]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Failed to apply cleaned seed data:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to apply cleaned seed data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'Use POST to apply cleaned seed data'
    },
    { status: 405 }
  );
}