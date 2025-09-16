import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', 'PRODUCTION_READY', 'CORRECTED_production_seed_data.sql')
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Seed data file not found' },
        { status: 404 }
      )
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error serving seed data file:', error)
    return NextResponse.json(
      { error: 'Failed to serve seed data file' },
      { status: 500 }
    )
  }
}