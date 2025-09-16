import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with admin privileges for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();
    
    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
    }

    // Split the SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map((stmt: string) => stmt.trim())
      .filter((stmt: string) => stmt.length > 0);
    
    const results = [];
    
    for (const statement of statements) {
      try {
        // Execute each statement directly using the admin client
        const { data, error } = await supabaseAdmin.rpc('execute_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.error('Error executing statement:', error);
          results.push({ statement, success: false, error: error.message });
        } else {
          results.push({ statement, success: true });
        }
      } catch (err) {
        console.error('Exception executing statement:', err);
        results.push({ 
          statement, 
          success: false, 
          error: err instanceof Error ? err.message : String(err) 
        });
      }
    }
    
    // Check if any statements failed
    const failedStatements = results.filter(r => !r.success);
    
    if (failedStatements.length > 0) {
      return NextResponse.json({ 
        error: `${failedStatements.length} SQL statements failed execution`,
        details: failedStatements
      }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Seed data reset successful' });
  } catch (error) {
    console.error('Error in reset-seed API:', error);
    return NextResponse.json({ 
      error: 'Failed to reset seed data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}