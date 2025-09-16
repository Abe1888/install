import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    console.log('Testing API endpoint...')
    
    // Test basic connection
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase client not initialized',
        client: !!supabase,
        env: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      })
    }

    // Test vehicles query
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .limit(5)
    
    if (vehicleError) {
      console.error('Vehicle error:', vehicleError)
      return NextResponse.json({ error: 'Vehicle query failed', details: vehicleError })
    }

    // Test project stats
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('status, priority')
    
    if (taskError) {
      console.error('Task error:', taskError)
    }

    const taskStats = {
      total: tasks?.length || 0,
      completed: tasks?.filter((t: any) => t.status === 'Completed').length || 0,
      pending: tasks?.filter((t: any) => t.status === 'Pending').length || 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        vehicleCount: vehicles?.length || 0,
        sampleVehicle: vehicles?.[0] || null,
        taskStats,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json({ 
      error: 'API test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
