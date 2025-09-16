// DEPRECATED: This file has been replaced with useUnifiedData.ts
// 
// All hooks have been migrated to a unified, high-performance system
// that eliminates duplicate requests and provides optimal refresh intervals.
//
// Please use the following replacements:
// - useVehiclesOptimized() -> useVehicles() from '@/lib/hooks/useUnifiedData'
// - useLocationsOptimized() -> useLocations() from '@/lib/hooks/useUnifiedData'
// - useTeamMembersOptimized() -> useTeamMembers() from '@/lib/hooks/useUnifiedData'
// - useTasksOptimized() -> useTasks() from '@/lib/hooks/useUnifiedData'
//
// The new unified system provides:
// ✅ Eliminates duplicate network requests
// ✅ Production-optimized refresh intervals
// ✅ Better caching and deduplication
// ✅ Smart route-based prefetching
// ✅ Performance monitoring
//
// This file will be removed in a future update.

import { 
  useVehicles, 
  useLocations, 
  useTeamMembers, 
  useTasks, 
  prefetchVehicles, 
  prefetchLocations, 
  prefetchTeamMembers, 
  prefetchForRoute 
} from './useUnifiedData';

// Backward compatibility exports
export const useVehiclesOptimized = useVehicles;
export const useLocationsOptimized = useLocations;
export const useTeamMembersOptimized = useTeamMembers;
export const useTasksOptimized = useTasks;

export const prefetchVehiclesOptimized = prefetchVehicles;
export const prefetchLocationsOptimized = prefetchLocations;
export const prefetchTeamMembersOptimized = prefetchTeamMembers;
export const prefetchTasksOptimized = () => {
  // Use prefetch for tasks
  if (typeof window !== 'undefined') {
    requestIdleCallback(() => {
      import('./useUnifiedData').then(module => {
        // This is a placeholder - actual prefetch happens via the unified system
      }).catch(() => {});
    });
  }
};
export const prefetchAllDataOptimized = () => {
  prefetchForRoute('/');
};

// Re-export all unified functions as well
export * from './useUnifiedData';
