import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Define the migrations directory path
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      return NextResponse.json({
        success: false,
        error: 'Migrations directory not found',
        migrations: []
      }, { status: 404 });
    }

    // Read all migration files
    const files = fs.readdirSync(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));
    
    const migrations = [];
    
    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);
        
        migrations.push({
          filename: file,
          content: content,
          timestamp: stats.birthtime.toISOString(),
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        });
      } catch (fileError) {
        console.warn(`Failed to read migration file ${file}:`, fileError);
        // Continue with other files
      }
    }

    // Sort by filename (which usually includes timestamps)
    migrations.sort((a, b) => a.filename.localeCompare(b.filename));

    return NextResponse.json({
      success: true,
      message: `Successfully backed up ${migrations.length} migration files`,
      migrations: migrations,
      metadata: {
        totalFiles: migrations.length,
        timestamp: new Date().toISOString(),
        directory: migrationsDir
      }
    });

  } catch (error: any) {
    console.error('Migration backup error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to backup migrations',
      migrations: []
    }, { status: 500 });
  }
}
