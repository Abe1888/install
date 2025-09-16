import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST() {
  try {
    console.log('🌱 Applying seed data to fix database issues...')
    
    let results = []

    // Step 1: Ensure project settings
    const { error: projectError } = await supabase
      .from('project_settings')
      .upsert({
        id: 'default',
        project_start_date: '2025-09-10',
        project_end_date: '2025-09-24',
        total_days: 15
      })

    if (projectError) {
      results.push({ table: 'project_settings', status: 'error', details: projectError })
    } else {
      results.push({ table: 'project_settings', status: 'success', message: 'Project settings updated' })
    }

    // Step 2: Ensure locations exist
    const locations = [
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
    ]

    const { error: locationError } = await supabase
      .from('locations')
      .upsert(locations, { onConflict: 'name' })

    if (locationError) {
      results.push({ table: 'locations', status: 'error', details: locationError })
    } else {
      results.push({ table: 'locations', status: 'success', message: `${locations.length} locations upserted` })
    }

    // Step 3: Ensure team members exist
    const teamMembers = [
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
    ]

    const { error: teamError } = await supabase
      .from('team_members')
      .upsert(teamMembers, { onConflict: 'id' })

    if (teamError) {
      results.push({ table: 'team_members', status: 'error', details: teamError })
    } else {
      results.push({ table: 'team_members', status: 'success', message: `${teamMembers.length} team members upserted` })
    }

    // Step 4: Check if locations now work for vehicles
    const { data: vehicleTest, error: vehicleTestError } = await supabase
      .from('vehicles')
      .select('id, location')
      .limit(3)

    if (vehicleTestError) {
      results.push({ 
        table: 'vehicles', 
        status: 'test_failed', 
        message: 'Vehicle query still failing after location fixes',
        details: vehicleTestError 
      })
    } else {
      results.push({ 
        table: 'vehicles', 
        status: 'test_success', 
        message: 'Vehicle queries now working',
        sample: vehicleTest
      })
    }

    // Step 5: Summary
    const successCount = results.filter(r => r.status === 'success' || r.status === 'test_success').length
    const errorCount = results.filter(r => r.status === 'error' || r.status === 'test_failed').length

    return NextResponse.json({
      success: errorCount === 0,
      message: `Seed data application complete: ${successCount} success, ${errorCount} errors`,
      results,
      summary: {
        totalOperations: results.length,
        successful: successCount,
        failed: errorCount
      }
    })

  } catch (error) {
    console.error('Seed data application error:', error)
    return NextResponse.json({ 
      error: 'Seed data application failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}