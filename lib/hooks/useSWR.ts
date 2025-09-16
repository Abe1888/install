// DEPRECATED: This file has been replaced with useUnifiedData.ts
// 
// All hooks have been migrated to a unified, high-performance system
// that eliminates duplicate requests and provides optimal refresh intervals.
//
// Please use the following replacements:
// - useVehiclesSWR() -> useVehicles() from '@/lib/hooks/useUnifiedData'
// - useLocationsSWR() -> useLocations() from '@/lib/hooks/useUnifiedData'
// - useTeamMembersSWR() -> useTeamMembers() from '@/lib/hooks/useUnifiedData'
// - useTasksSWR() -> useTasks() from '@/lib/hooks/useUnifiedData'
//
// The new unified system provides:
// ✅ Eliminates duplicate network requests
// ✅ Production-optimized refresh intervals  
// ✅ Better caching and deduplication
// ✅ Smart route-based prefetching
// ✅ Performance monitoring
//
// This file will be removed in a future update.

import { useVehicles, useLocations, useTeamMembers, useTasks } from './useUnifiedData';

// Backward compatibility exports
export const useVehiclesSWR = useVehicles;
export const useLocationsSWR = useLocations;
export const useTeamMembersSWR = useTeamMembers;
export const useTasksSWR = useTasks;

// Re-export all unified functions as well
export * from './useUnifiedData';
