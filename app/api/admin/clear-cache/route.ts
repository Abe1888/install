import { NextRequest, NextResponse } from 'next/server';

/**
 * Clear Cache API Endpoint
 * 
 * This endpoint instructs the frontend to clear all cached data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Cache clear requested');
    
    return NextResponse.json({
      success: true,
      message: 'Cache clear signal sent',
      timestamp: new Date().toISOString(),
      instructions: [
        'Clear SWR cache',
        'Force revalidation of all data hooks',
        'Reset component states'
      ]
    });

  } catch (error: any) {
    console.error('❌ Cache clear failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Cache clear failed',
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
      message: 'Use POST to clear cache'
    },
    { status: 405 }
  );
}
