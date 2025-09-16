import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Test API to add sample data for real-time synchronization testing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    console.log('🧪 Adding sample data for real-time testing...');
    
    // Add a test location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert([{
        name: 'Test Location',
        vehicles: 1,
        gps_devices: 1,
        fuel_sensors: 1,
        address: 'Test Address',
        contact_person: 'Test Person',
        contact_phone: '+1-234-567-8901',
        installation_days: 'Day 1'
      }])
      .select()
      .single();
    
    if (locationError) throw locationError;
    
    // Add a test team member
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .insert([{
        id: 'TEST001',
        name: 'Test Engineer',
        role: 'Test Engineer',
        specializations: ['Testing'],
        completion_rate: 100,
        average_task_time: 30,
        quality_score: 95,
        email: 'test@example.com',
        phone: '+1-234-567-8901'
      }])
      .select()
      .single();
    
    if (teamError) throw teamError;
    
    // Add a test vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert([{
        id: 'TEST001',
        type: 'Test Vehicle',
        location: 'Test Location',
        day: 1,
        time_slot: '09:00-10:00 AM',
        status: 'Pending',
        gps_required: 1,
        fuel_sensors: 1,
        fuel_tanks: 1
      }])
      .select()
      .single();
    
    if (vehicleError) throw vehicleError;
    
    // Add a test task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert([{
        vehicle_id: 'TEST001',
        name: 'Test Installation',
        description: 'Test task for real-time sync verification',
        status: 'Pending',
        assigned_to: 'TEST001',
        priority: 'Medium',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        timeslot_bucket: 'morning',
        location: 'Test Location',
        category: 'test',
        installation_step: 1,
        sub_task_order: 1,
        duration_minutes: 60,
        estimated_duration: 1
      }])
      .select()
      .single();
    
    if (taskError) throw taskError;
    
    console.log('✅ Sample data added successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Sample data added for real-time testing',
      data: {
        location: location.name,
        teamMember: teamMember.name,
        vehicle: vehicle.id,
        task: task.name,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Failed to add sample data:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to add sample data',
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
      message: 'Use POST to add sample data'
    },
    { status: 405 }
  );
}
