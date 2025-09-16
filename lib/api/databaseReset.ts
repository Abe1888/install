import { createClient } from '@supabase/supabase-js'

/**
 * Executes SQL queries for database operations
 * @param sqlQuery The SQL query to execute
 * @returns Result of the operation
 */
export async function executeSql(sqlQuery: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', { 
      sql_query: sqlQuery 
    })
    
    if (error) {
      throw error
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('SQL execution error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Fetches SQL file content from the given path
 * @param filePath Path to the SQL file
 * @returns SQL content as string
 */
export async function fetchSqlFile(filePath: string): Promise<string> {
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch SQL file: ${response.statusText}`)
    }
    return await response.text()
  } catch (error) {
    console.error('Error fetching SQL file:', error)
    throw error
  }
}

/**
 * Resets the database schema using the provided SQL file
 * @param schemaFilePath Path to the schema SQL file
 * @returns Result of the operation
 */
export async function resetDatabaseSchema(schemaFilePath: string) {
  try {
    const schemaSql = await fetchSqlFile(schemaFilePath)
    return await executeSql(schemaSql)
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Resets the database seed data using the provided SQL file
 * @param seedDataFilePath Path to the seed data SQL file
 * @returns Result of the operation
 */
export async function resetDatabaseSeedData(seedDataFilePath: string) {
  try {
    const seedDataSql = await fetchSqlFile(seedDataFilePath)
    return await executeSql(seedDataSql)
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}