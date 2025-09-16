import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', 'PRODUCTION_READY', 'FINAL_production_schema.sql')
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Schema file not found' },
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
    console.error('Error serving schema file:', error)
    return NextResponse.json(
      { error: 'Failed to serve schema file' },
      { status: 500 }
    )
  }
}