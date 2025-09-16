import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Test API to update vehicle status for real-time synchronization testing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleId, status = 'In Progress' } = body;
    
    const supabase = createAdminClient();
    
    console.log(`🚗 Updating vehicle ${vehicleId} status to ${status}...`);
    
    // Update vehicle status
    const { data, error } = await supabase
      .from('vehicles')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Vehicle ${vehicleId} status updated to ${status}`);
    
    return NextResponse.json({
      success: true,
      message: `Vehicle status updated to ${status}`,
      data: {
        vehicleId: data.id,
        newStatus: data.status,
        location: data.location,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Failed to update vehicle status:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update vehicle status',
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
      message: 'Use POST to update vehicle status'
    },
    { status: 405 }
  );
}
