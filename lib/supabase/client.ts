import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Safely access environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug logging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Supabase URL configured:', !!supabaseUrl)
  console.log('Supabase Key configured:', !!supabaseAnonKey)
  console.log('URL contains supabase:', supabaseUrl.includes('supabase'))
}

// Create client only if credentials are available
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null as any // Use 'as any' to avoid type errors when client is null

// Test connection function
export async function testConnection(): Promise<boolean> {
  if (!supabase) return false
  
  try {
    const { error } = await supabase.from('vehicles').select('count').limit(1)
    return !error
  } catch {
    return false
  }
}

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  const hasUrl = !!supabaseUrl
  const hasKey = !!supabaseAnonKey
  const validUrl = supabaseUrl.includes('supabase')
  const hasClient = !!supabase
  const configured = hasUrl && hasKey && validUrl && hasClient

  // Only log configuration details in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase config check:', { hasUrl, hasKey, validUrl, hasClient })
    console.log('URL:', supabaseUrl ? 'present' : 'missing')
    console.log('Key:', supabaseAnonKey ? 'present' : 'missing')
    console.log('Final configuration status:', configured)
  }
  
  return configured
}
