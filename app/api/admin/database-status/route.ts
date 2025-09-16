import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Simple admin token for basic security
const ADMIN_TOKEN = process.env.ADMIN_RESET_TOKEN || 'admin123';

/**
 * Database Status API Endpoint
 * 
 * This endpoint returns actual record counts from all tables
 * to verify if the database is truly empty
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
    
    console.log('🔍 Checking actual database status...');
    
    const tablesToCheck = [
      'tasks',
      'vehicles', 
      'team_members',
      'locations',
      'calendar_exceptions',
      'project_settings'
    ];

    const results: any = {};

    for (const table of tablesToCheck) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' });
        
        if (error) {
          console.warn(`⚠️ Error querying ${table}:`, error.message);
          results[table] = { error: error.message, count: 'unknown' };
        } else {
          console.log(`📊 ${table}: ${count} records`);
          results[table] = { 
            count: count || 0, 
            sampleData: data && data.length > 0 ? data.slice(0, 3) : null 
          };
        }
      } catch (err: any) {
        console.warn(`⚠️ Exception querying ${table}:`, err.message);
        results[table] = { error: err.message, count: 'unknown' };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database status retrieved',
      timestamp: new Date().toISOString(),
      tables: results
    });

  } catch (error: any) {
    console.error('❌ Database status check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Database status check failed',
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
      message: 'Use POST to check database status'
    },
    { status: 405 }
  );
}
