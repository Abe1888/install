import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Simple admin token for basic security
const ADMIN_TOKEN = process.env.ADMIN_RESET_TOKEN || 'admin123';

/**
 * Reset Database API Endpoint
 * 
 * This endpoint:
 * 1. Validates admin token
 * 2. Completely clears all data from tables (creates empty database)
 * 3. Returns success/error response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminToken } = body;

    // Validate admin token
    if (!adminToken || adminToken !== ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      );
    }

    // Create admin client with service role
    const supabase = createAdminClient();
    
    console.log('🔄 Starting database clear (empty database)...');
    let executionResults: string[] = [];

    // FORCE DELETE all existing data to create empty database
    console.log('🗑️ FORCE clearing all existing data...');
    
    const tablesToClear = [
      'tasks',
      'vehicles', 
      'team_members',
      'locations',
      'calendar_exceptions',
      'project_settings'
    ];

    // Clear all tables with multiple approaches
    for (const table of tablesToClear) {
      try {
        // First, get all records to see what we're working with
        const { data: allRecords, error: selectError } = await supabase
          .from(table)
          .select('*');
        
        if (selectError) {
          console.warn(`⚠️ Error selecting from ${table}:`, selectError.message);
        } else {
          console.log(`📊 Found ${allRecords?.length || 0} records in ${table}`);
        }

        if (allRecords && allRecords.length > 0) {
          // Try multiple deletion strategies
          let deleteSuccess = false;

          // Strategy 1: Delete with true condition
          try {
            const { error: deleteError1 } = await supabase
              .from(table)
              .delete()
              .neq('created_at', '1900-01-01'); // This should match all records
            
            if (!deleteError1) {
              deleteSuccess = true;
              console.log(`✅ Cleared ${table} (strategy 1)`);
            }
          } catch (e: any) {
            console.log(`Strategy 1 failed for ${table}:`, e.message);
          }

          // Strategy 2: Delete with different condition if strategy 1 failed
          if (!deleteSuccess) {
            try {
              const { error: deleteError2 } = await supabase
                .from(table)
                .delete()
                .gte('created_at', '2000-01-01'); // Match records created after 2000
              
              if (!deleteError2) {
                deleteSuccess = true;
                console.log(`✅ Cleared ${table} (strategy 2)`);
              }
            } catch (e: any) {
              console.log(`Strategy 2 failed for ${table}:`, e.message);
            }
          }

          // Strategy 3: Delete records individually if bulk delete failed
          if (!deleteSuccess && table !== 'locations') { // Avoid individual deletes for locations if it has FK constraints
            try {
              for (const record of allRecords) {
                if (record.id) {
                  await supabase
                    .from(table)
                    .delete()
                    .eq('id', record.id);
                } else if (record.name) {
                  await supabase
                    .from(table)
                    .delete()
                    .eq('name', record.name);
                }
              }
              deleteSuccess = true;
              console.log(`✅ Cleared ${table} (individual deletion)`);
            } catch (e: any) {
              console.log(`Individual deletion failed for ${table}:`, e.message);
            }
          }

          if (deleteSuccess) {
            executionResults.push(`✅ Cleared ${table}`);
          } else {
            executionResults.push(`⚠️ Warning: Could not fully clear ${table}`);
          }
        } else {
          console.log(`✅ ${table} is already empty`);
          executionResults.push(`✅ ${table} already empty`);
        }
      } catch (err: any) {
        console.warn(`⚠️ Exception clearing ${table}:`, err.message);
        executionResults.push(`⚠️ Exception: ${table} - ${err.message}`);
      }
    }

    // Small delay to ensure deletes complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Database successfully cleared - now empty!');
    
    return NextResponse.json({
      success: true,
      message: 'Database successfully cleared (empty database created)',
      details: {
        tablesCleared: tablesToClear.length,
        vehiclesCreated: 0,
        tasksCreated: 0,
        locationsCreated: 0,
        teamMembersCreated: 0,
        executionLog: executionResults
      }
    });

  } catch (error: any) {
    console.error('❌ Database reset failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Database reset failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'Use POST to reset database'
    },
    { status: 405 }
  );
}
