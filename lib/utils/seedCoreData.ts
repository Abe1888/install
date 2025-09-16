import { supabase } from '@/lib/supabase/client';

// Simplified core project data without complex dependencies
export async function seedCoreProjectData(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🌱 Starting core project data seeding...');

    // Core locations
    const locations = [
      { name: 'Bahir Dar', address: 'Bahir Dar, Ethiopia', contact_person: 'Installation Team Lead', contact_phone: '+251-91-234-5678' },
      { name: 'Kombolcha', address: 'Kombolcha, Ethiopia', contact_person: 'Field Operations Manager', contact_phone: '+251-91-345-6789' },
      { name: 'Addis Ababa', address: 'Addis Ababa, Ethiopia', contact_person: 'Regional Coordinator', contact_phone: '+251-91-456-7890' }
    ];

    // Core team members
    const teamMembers = [
      { name: 'Alemayehu Tadesse', role: 'Senior GPS Technician', email: 'alemayehu.tadesse@company.et', phone: '+251-91-111-2233' },
      { name: 'Tigist Bekele', role: 'Fuel Systems Specialist', email: 'tigist.bekele@company.et', phone: '+251-91-222-3344' },
      { name: 'Dawit Mekonnen', role: 'Installation Team Lead', email: 'dawit.mekonnen@company.et', phone: '+251-91-333-4455' },
      { name: 'Hanan Mohammed', role: 'Technical Supervisor', email: 'hanan.mohammed@company.et', phone: '+251-91-444-5566' },
      { name: 'Solomon Girma', role: 'Regional Coordinator', email: 'solomon.girma@company.et', phone: '+251-91-555-6677' },
      { name: 'Martha Hailu', role: 'Quality Control Inspector', email: 'martha.hailu@company.et', phone: '+251-91-666-7788' }
    ];

    // Core vehicles (simplified)
    const vehicles = [
      // Bahir Dar - Days 1-8
      { id: 'V001', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 1, time_slot: '08:30-11:30', status: 'Completed', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V002', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 1, time_slot: '13:30-17:30', status: 'Completed', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V003', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 2, time_slot: '08:30-11:30', status: 'Completed', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V004', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 2, time_slot: '13:30-17:30', status: 'In Progress', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V005', type: 'MAZDA/PICKUP W9AT', location: 'Bahir Dar', day: 3, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V006', type: 'Mercedes bus MCV260', location: 'Bahir Dar', day: 3, time_slot: '13:30-17:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V007', type: 'Toyota land cruiser', location: 'Bahir Dar', day: 4, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V008', type: 'MAZDA/PICKUP W9AT', location: 'Bahir Dar', day: 4, time_slot: '13:30-17:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V009', type: 'Mercedes bus MCV260', location: 'Bahir Dar', day: 5, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V010', type: 'UD truck CV86BLLDL', location: 'Bahir Dar', day: 5, time_slot: '13:30-17:30', status: 'Pending', gps_required: 1, fuel_sensors: 2, fuel_tanks: 2 },
      { id: 'V011', type: 'Mitsubishi K777JENSU', location: 'Bahir Dar', day: 6, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V012', type: 'Terios j120cg', location: 'Bahir Dar', day: 6, time_slot: '13:30-17:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V013', type: 'MAZDA/PICKUP BT-50', location: 'Bahir Dar', day: 7, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V014', type: 'Mitsubishi (k777jensl)', location: 'Bahir Dar', day: 7, time_slot: '13:30-17:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V015', type: 'Cherry c7180elkkhb0018', location: 'Bahir Dar', day: 8, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },

      // Kombolcha - Days 10-12
      { id: 'V016', type: 'FORD/D/P/UP RANGER', location: 'Kombolcha', day: 10, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V017', type: 'MAZDA/R/D/UP BT-50', location: 'Kombolcha', day: 10, time_slot: '13:30-17:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V018', type: 'Mercedes bus MCV5115', location: 'Kombolcha', day: 11, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V019', type: 'Toyota Pickup LN166L-PRMDS', location: 'Kombolcha', day: 11, time_slot: '13:30-17:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V020', type: 'Mitsubishi K34)JUNJJC', location: 'Kombolcha', day: 12, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V021', type: 'UD truck CV86BLLDL', location: 'Kombolcha', day: 12, time_slot: '13:30-17:30', status: 'Pending', gps_required: 1, fuel_sensors: 2, fuel_tanks: 2 },

      // Addis Ababa - Days 13-14
      { id: 'V022', type: 'FORD/D/P/UP RANGER', location: 'Addis Ababa', day: 13, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V023', type: 'MAZDA/PICKUP-626', location: 'Addis Ababa', day: 13, time_slot: '13:30-17:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
      { id: 'V024', type: 'Cherry c7180elkkhb0018', location: 'Addis Ababa', day: 14, time_slot: '08:30-11:30', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 }
    ];

    // 1. Insert locations
    console.log('📍 Inserting locations...');
    const { error: locationsError } = await supabase
      .from('locations')
      .upsert(locations.map(loc => ({
        name: loc.name,
        duration: loc.name === 'Bahir Dar' ? 'Days 1-8' : loc.name === 'Kombolcha' ? 'Days 10-12' : 'Days 13-14',
        vehicles: loc.name === 'Bahir Dar' ? 15 : loc.name === 'Kombolcha' ? 6 : 3,
        gps_devices: loc.name === 'Bahir Dar' ? 15 : loc.name === 'Kombolcha' ? 6 : 3,
        fuel_sensors: loc.name === 'Bahir Dar' ? 16 : loc.name === 'Kombolcha' ? 7 : 3
      })), { onConflict: 'name' });

    if (locationsError) {
      console.error('Locations error:', locationsError);
    }

    // 2. Insert team members
    console.log('👥 Inserting team members...');
    const { error: teamError } = await supabase
      .from('team_members')
      .upsert(teamMembers.map((member, index) => ({
        id: `TM00${index + 1}`,
        name: member.name,
        role: member.role,
        specializations: [],
        completion_rate: 0,
        average_task_time: 0,
        quality_score: 0
      })), { onConflict: 'id' });

    if (teamError) {
      console.error('Team members error:', teamError);
    }

    // 3. Insert vehicles
    console.log('🚚 Inserting vehicles...');
    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .upsert(vehicles, { onConflict: 'id' });

    if (vehiclesError) {
      console.error('Vehicles error:', vehiclesError);
      throw new Error(`Failed to insert vehicles: ${vehiclesError.message}`);
    }

    console.log('✅ Core project data seeding completed!');
    return {
      success: true,
      message: `Successfully seeded core project data:
• ${locations.length} locations
• ${teamMembers.length} team members  
• ${vehicles.length} vehicles`
    };

  } catch (error) {
    console.error('❌ Core project data seeding failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during seeding'
    };
  }
}

export async function clearCoreData(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧹 Clearing core data...');

    await supabase.from('vehicles').delete().neq('id', '');
    await supabase.from('team_members').delete().neq('id', '');
    await supabase.from('locations').delete().neq('id', '');

    return { success: true, message: 'Core data cleared successfully.' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error clearing data' 
    };
  }
}

export async function resetAndSeedCore(): Promise<{ success: boolean; message: string }> {
  const clearResult = await clearCoreData();
  if (!clearResult.success) {
    return clearResult;
  }

  return await seedCoreProjectData();
}
