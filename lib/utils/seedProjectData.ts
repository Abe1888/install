import { supabase } from '@/lib/supabase/client';

// Real project data from Vehicle-GPS-Tracking-Device.md
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
  location: string;
}

// Real project locations
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

// Real project team members
const projectTeamMembers: ProjectTeamMember[] = [
  {
    name: 'Alemayehu Tadesse',
    role: 'Senior GPS Technician',
    email: 'alemayehu.tadesse@company.et',
    phone: '+251-91-111-2233',
    location: 'Bahir Dar'
  },
  {
    name: 'Tigist Bekele',
    role: 'Fuel Systems Specialist',
    email: 'tigist.bekele@company.et',
    phone: '+251-91-222-3344',
    location: 'Bahir Dar'
  },
  {
    name: 'Dawit Mekonnen',
    role: 'Installation Team Lead',
    email: 'dawit.mekonnen@company.et',
    phone: '+251-91-333-4455',
    location: 'Kombolcha'
  },
  {
    name: 'Hanan Mohammed',
    role: 'Technical Supervisor',
    email: 'hanan.mohammed@company.et',
    phone: '+251-91-444-5566',
    location: 'Kombolcha'
  },
  {
    name: 'Solomon Girma',
    role: 'Regional Coordinator',
    email: 'solomon.girma@company.et',
    phone: '+251-91-555-6677',
    location: 'Addis Ababa'
  },
  {
    name: 'Martha Hailu',
    role: 'Quality Control Inspector',
    email: 'martha.hailu@company.et',
    phone: '+251-91-666-7788',
    location: 'Addis Ababa'
  }
];

// Real project vehicles with complete schedule
const projectVehicles: ProjectVehicle[] = [
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

  // Kombolcha - Days 10-12 (Day 9 is travel/logistics)
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

// Project tasks for vehicle installations
const generateProjectTasks = (vehicles: ProjectVehicle[]) => {
  const tasks = [];
  
  for (const vehicle of vehicles) {
    // GPS Installation Task
    tasks.push({
      title: `GPS Device Installation - ${vehicle.id}`,
      description: `Install GPS tracking device on ${vehicle.type}`,
      vehicle_id: vehicle.id,
      assigned_to: getAssignedTechnician(vehicle.location, 'GPS'),
      status: vehicle.status === 'Completed' ? 'Completed' : vehicle.status === 'In Progress' ? 'In Progress' : 'Pending',
      priority: 'High',
      estimated_duration: 120, // 2 hours
      location: vehicle.location,
      installation_date: null, // Will be calculated based on project start date
      category: 'GPS Installation',
      dependencies: null
    });

    // Fuel Sensor Installation Task  
    for (let i = 1; i <= vehicle.fuel_sensors; i++) {
      tasks.push({
        title: `Fuel Sensor Installation ${i} - ${vehicle.id}`,
        description: `Install fuel level sensor ${i} on ${vehicle.type}`,
        vehicle_id: vehicle.id,
        assigned_to: getAssignedTechnician(vehicle.location, 'Fuel'),
        status: vehicle.status === 'Completed' ? 'Completed' : vehicle.status === 'In Progress' ? 'In Progress' : 'Pending',
        priority: 'Medium',
        estimated_duration: 90, // 1.5 hours
        location: vehicle.location,
        installation_date: null,
        category: 'Fuel Sensor Installation',
        dependencies: `GPS Device Installation - ${vehicle.id}`
      });
    }

    // System Testing Task
    tasks.push({
      title: `System Testing - ${vehicle.id}`,
      description: `Test GPS and fuel sensor systems on ${vehicle.type}`,
      vehicle_id: vehicle.id,
      assigned_to: getAssignedTechnician(vehicle.location, 'QC'),
      status: vehicle.status === 'Completed' ? 'Completed' : 'Pending',
      priority: 'High',
      estimated_duration: 30, // 30 minutes
      location: vehicle.location,
      installation_date: null,
      category: 'Quality Control',
      dependencies: `Fuel Sensor Installation ${vehicle.fuel_sensors} - ${vehicle.id}`
    });
  }

  return tasks;
};

// Helper function to assign technicians based on location and expertise
function getAssignedTechnician(location: string, expertise: 'GPS' | 'Fuel' | 'QC'): string {
  const assignments = {
    'Bahir Dar': {
      'GPS': 'Alemayehu Tadesse',
      'Fuel': 'Tigist Bekele', 
      'QC': 'Tigist Bekele'
    },
    'Kombolcha': {
      'GPS': 'Dawit Mekonnen',
      'Fuel': 'Hanan Mohammed',
      'QC': 'Hanan Mohammed'
    },
    'Addis Ababa': {
      'GPS': 'Solomon Girma',
      'Fuel': 'Martha Hailu',
      'QC': 'Martha Hailu'
    }
  };

  return assignments[location as keyof typeof assignments]?.[expertise] || 'Unassigned';
}

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

export async function seedProjectData(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🌱 Starting project data seeding...');

    // Check if data already exists
    const { data: existingVehicles } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);

    if (existingVehicles && existingVehicles.length > 0) {
      return { success: true, message: 'Database already contains vehicle data. Use "Reset & Seed" to replace existing data.' };
    }

    // 1. Insert locations first
    console.log('📍 Seeding project locations...');
    try {
      const { error: locationsError } = await supabase
        .from('locations')
        .insert(projectLocations.map(loc => ({
          name: loc.name,
          address: loc.address,
          contact_person: loc.contact_person,
          contact_phone: loc.contact_phone
        })));

      if (locationsError && !locationsError.message.includes('duplicate key')) {
        console.error('Locations seeding error:', locationsError);
        throw new Error(`Failed to insert locations: ${locationsError.message}`);
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('duplicate key')) {
        throw err;
      }
    }

    // 2. Insert team members
    console.log('👥 Seeding project team members...');
    try {
      const { error: teamError } = await supabase
        .from('team_members')
        .insert(projectTeamMembers.map(member => ({
          name: member.name,
          role: member.role,
          email: member.email,
          phone: member.phone,
          completion_rate: 0,
          average_task_time: 0,
          quality_score: 0
        })));

      if (teamError && !teamError.message.includes('duplicate key')) {
        console.error('Team members seeding error:', teamError);
        throw new Error(`Failed to insert team members: ${teamError.message}`);
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('duplicate key')) {
        throw err;
      }
    }

    // 3. Insert vehicles
    console.log('🚚 Seeding project vehicles...');
    try {
      const { error: vehiclesError } = await supabase
        .from('vehicles')
        .insert(projectVehicles);

      if (vehiclesError) {
        console.error('Vehicles seeding error:', vehiclesError);
        throw new Error(`Failed to insert vehicles: ${vehiclesError.message}`);
      }
    } catch (err) {
      throw err;
    }

    // 4. Insert tasks (optional, may fail if tasks table has different schema)
    console.log('📋 Seeding project tasks...');
    try {
      const projectTasks = generateProjectTasks(projectVehicles);
      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(projectTasks);

      if (tasksError) {
        console.warn('Tasks seeding warning (non-critical):', tasksError.message);
        // Don't throw error for tasks, as the main data is vehicles
      }
    } catch (err) {
      console.warn('Tasks insertion failed (non-critical):', err instanceof Error ? err.message : 'Unknown error');
    }

    console.log('✅ Project data seeding completed successfully!');
    return { 
      success: true, 
      message: `Successfully seeded project data:\n• ${projectLocations.length} locations\n• ${projectTeamMembers.length} team members\n• ${projectVehicles.length} vehicles\n• Tasks (if table schema compatible)` 
    };

  } catch (error) {
    console.error('❌ Project data seeding failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred during seeding' 
    };
  }
}

export async function resetAndSeedProject(): Promise<{ success: boolean; message: string }> {
  try {
    // Clear existing data first
    const clearResult = await clearAllData();
    if (!clearResult.success) {
      return clearResult;
    }

    // Seed with project data
    const seedResult = await seedProjectData();
    return seedResult;

  } catch (error) {
    console.error('❌ Reset and seed failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Export project data for reference
export { projectVehicles, projectLocations, projectTeamMembers };
