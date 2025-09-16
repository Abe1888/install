import { supabase } from '@/lib/supabase/client';

export interface SampleVehicle {
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

const sampleVehicles: SampleVehicle[] = [
  // Day 1
  { id: 'VH-001', type: 'Delivery Truck', location: 'Downtown', day: 1, time_slot: '08:00-10:00', status: 'Completed', gps_required: 1, fuel_sensors: 2, fuel_tanks: 1 },
  { id: 'VH-002', type: 'Van', location: 'Suburb North', day: 1, time_slot: '10:00-12:00', status: 'Completed', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'VH-003', type: 'Semi-Truck', location: 'Industrial Zone', day: 1, time_slot: '14:00-16:00', status: 'In Progress', gps_required: 1, fuel_sensors: 4, fuel_tanks: 2 },
  
  // Day 2
  { id: 'VH-004', type: 'Pickup Truck', location: 'Downtown', day: 2, time_slot: '08:00-10:00', status: 'Completed', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'VH-005', type: 'Box Truck', location: 'Suburb South', day: 2, time_slot: '12:00-14:00', status: 'In Progress', gps_required: 1, fuel_sensors: 2, fuel_tanks: 1 },
  { id: 'VH-006', type: 'Delivery Van', location: 'City Center', day: 2, time_slot: '16:00-18:00', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  
  // Day 3
  { id: 'VH-007', type: 'Semi-Truck', location: 'Industrial Zone', day: 3, time_slot: '08:00-10:00', status: 'Pending', gps_required: 1, fuel_sensors: 4, fuel_tanks: 2 },
  { id: 'VH-008', type: 'Van', location: 'Suburb East', day: 3, time_slot: '10:00-12:00', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'VH-009', type: 'Delivery Truck', location: 'Downtown', day: 3, time_slot: '14:00-16:00', status: 'Pending', gps_required: 1, fuel_sensors: 2, fuel_tanks: 1 },
  
  // Day 4
  { id: 'VH-010', type: 'Pickup Truck', location: 'Suburb West', day: 4, time_slot: '08:00-10:00', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  { id: 'VH-011', type: 'Box Truck', location: 'City Center', day: 4, time_slot: '12:00-14:00', status: 'Pending', gps_required: 1, fuel_sensors: 2, fuel_tanks: 1 },
  
  // Day 5
  { id: 'VH-012', type: 'Semi-Truck', location: 'Industrial Zone', day: 5, time_slot: '08:00-10:00', status: 'Pending', gps_required: 1, fuel_sensors: 4, fuel_tanks: 2 },
  { id: 'VH-013', type: 'Van', location: 'Suburb North', day: 5, time_slot: '16:00-18:00', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  
  // Day 6
  { id: 'VH-014', type: 'Delivery Truck', location: 'Downtown', day: 6, time_slot: '10:00-12:00', status: 'Pending', gps_required: 1, fuel_sensors: 2, fuel_tanks: 1 },
  { id: 'VH-015', type: 'Pickup Truck', location: 'Suburb South', day: 6, time_slot: '14:00-16:00', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
  
  // Day 7
  { id: 'VH-016', type: 'Box Truck', location: 'City Center', day: 7, time_slot: '08:00-10:00', status: 'Pending', gps_required: 1, fuel_sensors: 2, fuel_tanks: 1 },
  { id: 'VH-017', type: 'Van', location: 'Suburb East', day: 7, time_slot: '12:00-14:00', status: 'Pending', gps_required: 1, fuel_sensors: 1, fuel_tanks: 1 },
];

const sampleLocations = [
  { name: 'Downtown', address: '123 Main St', contact_person: 'John Smith', contact_phone: '555-0101' },
  { name: 'Suburb North', address: '456 Oak Ave', contact_person: 'Jane Doe', contact_phone: '555-0102' },
  { name: 'Suburb South', address: '789 Pine Rd', contact_person: 'Mike Johnson', contact_phone: '555-0103' },
  { name: 'Suburb East', address: '321 Elm St', contact_person: 'Sarah Wilson', contact_phone: '555-0104' },
  { name: 'Suburb West', address: '654 Maple Dr', contact_person: 'David Brown', contact_phone: '555-0105' },
  { name: 'City Center', address: '987 Central Blvd', contact_person: 'Lisa Davis', contact_phone: '555-0106' },
  { name: 'Industrial Zone', address: '147 Factory Way', contact_person: 'Tom Anderson', contact_phone: '555-0107' },
];

const sampleTeamMembers = [
  { name: 'Alex Johnson', role: 'Lead Technician', email: 'alex.johnson@company.com', phone: '555-1001' },
  { name: 'Maria Garcia', role: 'GPS Specialist', email: 'maria.garcia@company.com', phone: '555-1002' },
  { name: 'James Wilson', role: 'Fuel Systems Tech', email: 'james.wilson@company.com', phone: '555-1003' },
  { name: 'Emily Chen', role: 'Installation Manager', email: 'emily.chen@company.com', phone: '555-1004' },
  { name: 'Robert Taylor', role: 'Senior Technician', email: 'robert.taylor@company.com', phone: '555-1005' },
];

export async function seedDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if data already exists
    const { data: existingVehicles } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);

    if (existingVehicles && existingVehicles.length > 0) {
      return { success: true, message: 'Database already contains data. Skipping seed.' };
    }

    // Insert locations first
    console.log('📍 Seeding locations...');
    const { error: locationsError } = await supabase
      .from('locations')
      .insert(sampleLocations);

    if (locationsError) {
      console.error('Error seeding locations:', locationsError);
      // Don't fail if locations already exist
    }

    // Insert team members
    console.log('👥 Seeding team members...');
    const { error: teamError } = await supabase
      .from('team_members')
      .insert(sampleTeamMembers);

    if (teamError) {
      console.error('Error seeding team members:', teamError);
      // Don't fail if team members already exist
    }

    // Insert vehicles
    console.log('🚚 Seeding vehicles...');
    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .insert(sampleVehicles);

    if (vehiclesError) {
      console.error('Error seeding vehicles:', vehiclesError);
      throw vehiclesError;
    }

    console.log('✅ Database seeding completed successfully!');
    return { success: true, message: `Successfully seeded ${sampleVehicles.length} vehicles, ${sampleLocations.length} locations, and ${sampleTeamMembers.length} team members.` };

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred during seeding' 
    };
  }
}

export async function clearDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧹 Clearing database...');

    // Clear in reverse order of dependencies
    await supabase.from('tasks').delete().neq('id', '');
    await supabase.from('comments').delete().neq('id', '');
    await supabase.from('vehicles').delete().neq('id', '');
    await supabase.from('team_members').delete().neq('id', '');
    await supabase.from('locations').delete().neq('id', '');

    console.log('✅ Database cleared successfully!');
    return { success: true, message: 'Database cleared successfully.' };

  } catch (error) {
    console.error('❌ Database clearing failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred during clearing' 
    };
  }
}
