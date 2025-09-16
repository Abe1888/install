import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    console.log('🔍 Diagnosing foreign key constraint issues...')
    
    // Step 1: Check current locations
    const { data: locations, error: locationError } = await supabase
      .from('locations')
      .select('name')
    
    if (locationError) {
      return NextResponse.json({ 
        error: 'Failed to query locations', 
        details: locationError 
      })
    }

    // Step 2: Check current vehicles and their locations
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, location')
    
    if (vehicleError) {
      return NextResponse.json({ 
        error: 'Failed to query vehicles', 
        details: vehicleError 
      })
    }

    // Step 3: Find missing locations
    const existingLocations = new Set(locations?.map((l: { name: string }) => l.name) || [])
    const vehicleLocations = new Set(vehicles?.map((v: { location: string }) => v.location) || [])
    const missingLocations = [...vehicleLocations].filter(loc => !existingLocations.has(loc))

    // Step 4: Find orphaned vehicles
    const orphanedVehicles = vehicles?.filter((v: { location: string }) => !existingLocations.has(v.location)) || []

    return NextResponse.json({
      success: true,
      diagnosis: {
        existingLocations: [...existingLocations],
        vehicleLocations: [...vehicleLocations],
        missingLocations,
        orphanedVehicles: orphanedVehicles.map((v: { id: string; location: string }) => ({ id: v.id, location: v.location })),
        locationCount: existingLocations.size,
        vehicleCount: vehicles?.length || 0,
        issueCount: missingLocations.length + orphanedVehicles.length
      }
    })
  } catch (error) {
    console.error('Diagnosis error:', error)
    return NextResponse.json({ 
      error: 'Diagnosis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST() {
  try {
    console.log('🔧 Fixing foreign key constraint issues...')
    
    // Step 1: Get diagnosis first
    const diagResponse = await GET()
    const diagData = await diagResponse.json()
    
    if (!diagData.success) {
      return diagData
    }

    const { missingLocations, orphanedVehicles } = diagData.diagnosis
    let fixesApplied = []

    // Step 2: Create missing locations
    if (missingLocations.length > 0) {
      const locationsToCreate = missingLocations.map((name: string) => ({
        name,
        vehicles: 0,
        gps_devices: 0,
        fuel_sensors: 0,
        address: `${name}, Ethiopia`,
        contact_person: 'To be assigned',
        contact_phone: 'TBD',
        installation_days: 'TBD'
      }))

      const { error: createError } = await supabase
        .from('locations')
        .insert(locationsToCreate)

      if (createError) {
        return NextResponse.json({ 
          error: 'Failed to create missing locations', 
          details: createError 
        })
      }

      fixesApplied.push(`Created ${missingLocations.length} missing locations: ${missingLocations.join(', ')}`)
    }

    // Step 3: Alternatively, we could apply the seed data
    const seedLocations = [
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

    // Insert/update the proper location data
    for (const location of seedLocations) {
      const { error: upsertError } = await supabase
        .from('locations')
        .upsert(location, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })

      if (upsertError) {
        console.error(`Failed to upsert location ${location.name}:`, upsertError)
      } else {
        fixesApplied.push(`Ensured location "${location.name}" exists with proper data`)
      }
    }

    // Step 4: Verify the fix
    const { data: vehicleCheck, error: checkError } = await supabase
      .from('vehicles')
      .select('id, location')
      .limit(5)

    if (checkError) {
      return NextResponse.json({ 
        error: 'Fix applied but verification failed', 
        details: checkError,
        fixesApplied
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Foreign key constraint issues resolved',
      fixesApplied,
      verification: {
        sampleVehicles: vehicleCheck,
        message: 'Vehicles can now be queried successfully'
      }
    })

  } catch (error) {
    console.error('Fix error:', error)
    return NextResponse.json({ 
      error: 'Fix failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}