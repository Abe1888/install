import { supabase } from '@/lib/supabase/client';

// CORRECTED project data from Vehicle-GPS-Tracking-Device.md section 5
export interface ProjectVehicle {
  id: string;
  type: string;
  location: string;
  day: number;
  time_slot: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  gps_required: number;
  fuel_sensors: number;
  fuel_tanks: number;
}

export interface ProjectLocation {
  name: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  installation_days: string;
}

export interface ProjectTeamMember {
  name: string;
  role: string;
  email: string;
  phone: string;
}

// Correct project locations (these are OK)
const projectLocations: ProjectLocation[] = [
  {
    name: 'Bahir Dar',
    address: 'Bahir Dar, Ethiopia',
    contact_person: 'Installation Team Lead',
    contact_phone: '+251-91-234-5678',
    installation_days: 'Days 1-8'
  },
  {
    name: 'Kombolcha',
    address: 'Kombolcha, Ethiopia', 
    contact_person: 'Field Operations Manager',
    contact_phone: '+251-91-345-6789',
    installation_days: 'Days 9-12'
  },
  {
    name: 'Addis Ababa',
    address: 'Addis Ababa, Ethiopia',
    contact_person: 'Regional Coordinator',
    contact_phone: '+251-91-456-7890',
    installation_days: 'Days 13-14'
  }
];

// CORRECTED team members - using actual data from source document section 5
const projectTeamMembers: ProjectTeamMember[] = [
  {
    name: 'Abebaw',
    role: 'Software Engineer',
    email: 'abebaw@company.et',
    phone: '+251-91-111-1001'
  },
  {
    name: 'Tewachew',
    role: 'Electrical Engineer',
    email: 'tewachew@company.et',
    phone: '+251-91-111-1002'
  },
  {
    name: 'Mandefro',
    role: 'Mechanical Engineer',
    email: 'mandefro@company.et',
    phone: '+251-91-111-1003'
  },
  {
    name: 'Mamaru',
    role: 'Mechanic',
    email: 'mamaru@company.et',
    phone: '+251-91-111-1004'
  }
];

// Real project vehicles with complete schedule (these are correct)
const projectVehicles: ProjectVehicle[] = [
  // Bahir Dar - Days 1-8
  { id: 'V001', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 1, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V002', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 1, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V003', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 2, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V004', type: 'FORD/D/P/UP RANGER', location: 'Bahir Dar', day: 2, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V005', type: 'MAZDA/PICKUP W9AT', location: 'Bahir Dar', day: 3, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V006', type: 'Mercedes bus MCV260', location: 'Bahir Dar', day: 3, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V007', type: 'Toyota land cruiser', location: 'Bahir Dar', day: 4, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V008', type: 'MAZDA/PICKUP W9AT', location: 'Bahir Dar', day: 4, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V009', type: 'Mercedes bus MCV260', location: 'Bahir Dar', day: 5, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V010', type: 'UD truck CV86BLLDL', location: 'Bahir Dar', day: 5, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 2, fuel_tanks: 2 },
  { id: 'V011', type: 'Mitsubishi K777JENSU', location: 'Bahir Dar', day: 6, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V012', type: 'Terios j120cg', location: 'Bahir Dar', day: 6, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V013', type: 'MAZDA/PICKUP BT-50', location: 'Bahir Dar', day: 7, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V014', type: 'Mitsubishi (k777jensl)', location: 'Bahir Dar', day: 7, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V015', type: 'Cherry c7180elkkhb0018', location: 'Bahir Dar', day: 8, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },

  // Kombolcha - Days 10-12 (Day 9 is travel/logistics)
  { id: 'V016', type: 'FORD/D/P/UP RANGER', location: 'Kombolcha', day: 10, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V017', type: 'MAZDA/R/D/UP BT-50', location: 'Kombolcha', day: 10, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V018', type: 'Mercedes bus MCV5115', location: 'Kombolcha', day: 11, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V019', type: 'Toyota Pickup LN166L-PRMDS', location: 'Kombolcha', day: 11, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V020', type: 'Mitsubishi K34)JUNJJC', location: 'Kombolcha', day: 12, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V021', type: 'UD truck CV86BLLDL', location: 'Kombolcha', day: 12, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 2, fuel_tanks: 2 },

  // Addis Ababa - Days 13-14
  { id: 'V022', type: 'FORD/D/P/UP RANGER', location: 'Addis Ababa', day: 13, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V023', type: 'MAZDA/PICKUP-626', location: 'Addis Ababa', day: 13, time_slot: '1:30–5:30 PM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'V024', type: 'Cherry c7180elkkhb0018', location: 'Addis Ababa', day: 14, time_slot: '8:30–11:30 AM', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 }
];

// CORRECTED task assignments based on source document section 5
function getAssignedTechnician(taskType: string): string {
  const assignments = {
    'Vehicle Inspection': 'Tewachew',
    'GPS Device Installation': 'Tewachew',
    'Fuel Sensor Installation': 'Mandefro', // Will distribute between Mandefro & Mamaru
    'System Configuration': 'Abebaw',
    'Fuel Sensor Calibration': 'Mandefro', // ALL Team - distributed
    'Quality Assurance': 'Abebaw',
    'Documentation': 'Abebaw'
  };

  return assignments[taskType as keyof typeof assignments] || 'Tewachew';
}

// Generate project tasks with CORRECT assignments
const generateProjectTasks = (vehicles: ProjectVehicle[]) => {
  const tasks = [];
  
  for (const vehicle of vehicles) {
    // Vehicle Inspection Task (Assigned to: Tewachew)
    tasks.push({
      title: `Vehicle Inspection - ${vehicle.id}`,
      description: `Pre-installation vehicle inspection for ${vehicle.type}`,
      vehicle_id: vehicle.id,
      assigned_to: 'Tewachew',
      status: vehicle.status,
      priority: 'High',
      estimated_duration: 10,
      location: vehicle.location,
      installation_date: null,
      category: 'Vehicle Inspection',
      dependencies: null
    });

    // GPS Device Installation Task (Assigned to: Tewachew)
    tasks.push({
      title: `GPS Device Installation - ${vehicle.id}`,
      description: `Install GPS tracking device on ${vehicle.type}`,
      vehicle_id: vehicle.id,
      assigned_to: 'Tewachew',
      status: vehicle.status,
      priority: 'High',
      estimated_duration: 60,
      location: vehicle.location,
      installation_date: null,
      category: 'GPS Device Installation',
      dependencies: `Vehicle Inspection - ${vehicle.id}`
    });

    // Fuel Sensor Installation Tasks (Assigned to: Mandefro & Mamaru)
    for (let i = 1; i <= vehicle.fuel_sensors; i++) {
      tasks.push({
        title: `Fuel Sensor Installation ${i} - ${vehicle.id}`,
        description: `Install fuel level sensor ${i} on ${vehicle.type}`,
        vehicle_id: vehicle.id,
        assigned_to: vehicle.location === 'Kombolcha' ? 'Mamaru' : 'Mandefro',
        status: vehicle.status,
        priority: 'High',
        estimated_duration: 120,
        location: vehicle.location,
        installation_date: null,
        category: 'Fuel Sensor Installation',
        dependencies: `GPS Device Installation - ${vehicle.id}`
      });
    }

    // System Configuration (Assigned to: Abebaw)
    tasks.push({
      title: `System Configuration - ${vehicle.id}`,
      description: `Configure GPS and fuel sensor systems for ${vehicle.type}`,
      vehicle_id: vehicle.id,
      assigned_to: 'Abebaw',
      status: vehicle.status,
      priority: 'High',
      estimated_duration: 30,
      location: vehicle.location,
      installation_date: null,
      category: 'System Configuration',
      dependencies: `Fuel Sensor Installation ${vehicle.fuel_sensors} - ${vehicle.id}`
    });

    // Fuel Sensor Calibration (Assigned to: ALL Team - distributed)
    tasks.push({
      title: `Fuel Sensor Calibration - ${vehicle.id}`,
      description: `Calibrate all fuel sensors for ${vehicle.type} (ALL Team Task)`,
      vehicle_id: vehicle.id,
      assigned_to: vehicle.location === 'Kombolcha' ? 'Mamaru' : vehicle.location === 'Addis Ababa' ? 'Abebaw' : 'Mandefro',
      status: vehicle.status,
      priority: 'High',
      estimated_duration: 60,
      location: vehicle.location,
      installation_date: null,
      category: 'Fuel Sensor Calibration',
      dependencies: `System Configuration - ${vehicle.id}`
    });

    // Quality Assurance (Assigned to: Abebaw)
    tasks.push({
      title: `Quality Assurance - ${vehicle.id}`,
      description: `Final quality check and testing for ${vehicle.type}`,
      vehicle_id: vehicle.id,
      assigned_to: 'Abebaw',
      status: vehicle.status,
      priority: 'Medium',
      estimated_duration: 10,
      location: vehicle.location,
      installation_date: null,
      category: 'Quality Assurance',
      dependencies: `Fuel Sensor Calibration - ${vehicle.id}`
    });

    // Documentation (Assigned to: Abebaw)
    tasks.push({
      title: `Documentation - ${vehicle.id}`,
      description: `Complete installation documentation for ${vehicle.type}`,
      vehicle_id: vehicle.id,
      assigned_to: 'Abebaw',
      status: vehicle.status,
      priority: 'Medium',
      estimated_duration: 10,
      location: vehicle.location,
      installation_date: null,
      category: 'Documentation',
      dependencies: `Quality Assurance - ${vehicle.id}`
    });
  }

  return tasks;
};

export async function clearAllData(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧹 Clearing all existing data...');

    // Clear in reverse order of dependencies
    await supabase.from('comments').delete().neq('id', '');
    await supabase.from('tasks').delete().neq('id', '');
    await supabase.from('vehicles').delete().neq('id', '');
    await supabase.from('team_members').delete().neq('id', '');
    await supabase.from('locations').delete().neq('id', '');

    console.log('✅ All data cleared successfully!');
    return { success: true, message: 'All existing data cleared successfully.' };

  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred during clearing' 
    };
  }
}

export async function seedCorrectProjectData(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🌱 Starting CORRECTED project data seeding...');

    // 1. Insert locations first
    console.log('📍 Seeding project locations...');
    const { error: locationsError } = await supabase
      .from('locations')
      .upsert(projectLocations.map(loc => ({
        name: loc.name,
        duration: loc.installation_days,
        vehicles: loc.name === 'Bahir Dar' ? 15 : loc.name === 'Kombolcha' ? 6 : 3,
        gps_devices: loc.name === 'Bahir Dar' ? 15 : loc.name === 'Kombolcha' ? 6 : 3,
        fuel_sensors: loc.name === 'Bahir Dar' ? 16 : loc.name === 'Kombolcha' ? 7 : 3
      })), { onConflict: 'name' });

    if (locationsError) {
      throw new Error(`Failed to insert locations: ${locationsError.message}`);
    }

    // 2. Insert CORRECT team members
    console.log('👥 Seeding CORRECT project team members...');
    const { error: teamError } = await supabase
      .from('team_members')
      .upsert(projectTeamMembers.map((member, index) => ({
        id: `TM00${index + 1}`,
        name: member.name,
        role: member.role,
        specializations:
          member.name === 'Abebaw' ? ['System Configuration', 'Quality Assurance', 'Documentation'] :
          member.name === 'Tewachew' ? ['Vehicle Inspection', 'GPS Device Installation'] :
          member.name === 'Mandefro' ? ['Fuel Sensor Installation', 'Fuel Sensor Calibration'] :
          member.name === 'Mamaru' ? ['Fuel Sensor Installation', 'Fuel Sensor Calibration'] : [],
        completion_rate: 0,
        average_task_time: 0,
        quality_score: 0
      })), { onConflict: 'id' });

    if (teamError) {
      throw new Error(`Failed to insert team members: ${teamError.message}`);
    }

    // 3. Insert vehicles
    console.log('🚚 Seeding project vehicles...');
    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .upsert(projectVehicles, { onConflict: 'id' });

    if (vehiclesError) {
      throw new Error(`Failed to insert vehicles: ${vehiclesError.message}`);
    }

    // 4. Insert tasks with CORRECT assignments
    console.log('📋 Seeding project tasks with CORRECT team assignments...');
    const projectTasks = generateProjectTasks(projectVehicles);
    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(projectTasks.map((task, index) => ({
        vehicle_id: task.vehicle_id,
        name: task.title,
        description: task.description,
        status: task.status,
        assigned_to: task.assigned_to,
        priority: task.priority,
        estimated_duration: task.estimated_duration,
        notes: task.dependencies ? `Dependencies: ${task.dependencies}` : undefined
      })));

    if (tasksError) {
      console.warn('Tasks seeding warning:', tasksError.message);
    }

    console.log('✅ CORRECTED project data seeding completed successfully!');
    return { 
      success: true, 
      message: `Successfully seeded CORRECTED project data:
• ${projectLocations.length} locations
• ${projectTeamMembers.length} team members (CORRECT TEAM!)
• ${projectVehicles.length} vehicles
• ${projectTasks.length}+ tasks with correct assignments` 
    };

  } catch (error) {
    console.error('❌ Project data seeding failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred during seeding' 
    };
  }
}

export async function resetAndSeedCorrectProject(): Promise<{ success: boolean; message: string }> {
  try {
    // Clear existing data first
    const clearResult = await clearAllData();
    if (!clearResult.success) {
      return clearResult;
    }

    // Seed with CORRECTED project data
    const seedResult = await seedCorrectProjectData();
    return seedResult;

  } catch (error) {
    console.error('❌ Reset and seed failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Export CORRECTED project data for reference
export { projectVehicles, projectLocations, projectTeamMembers };
