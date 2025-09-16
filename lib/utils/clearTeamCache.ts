import { mutate } from 'swr'

/**
 * Clear all team-related SWR cache to force fresh data fetch
 */
export function clearTeamCache() {
  // Clear SWR cache for team-related data
  mutate('team_members-optimized', undefined, { revalidate: true })
  mutate('tasks-optimized', undefined, { revalidate: true })
  
  // Clear all cached data to be safe
  mutate(() => true, undefined, { revalidate: true })
  
  console.log('✅ Team cache cleared - refreshing data...')
}

/**
 * Force refresh team data immediately
 */
export async function forceRefreshTeamData() {
  try {
    // Clear cache first
    clearTeamCache()
    
    // Wait a bit for the cache to clear
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Force reload the page if necessary
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  } catch (error) {
    console.error('Error refreshing team data:', error)
  }
}
