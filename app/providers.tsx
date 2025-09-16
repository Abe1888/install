'use client'

import React from 'react'
import { SWRConfig } from 'swr'
import { EnhancedErrorBoundary } from '@/components/ui/EnhancedErrorBoundary'
import { ConnectionGuard } from '@/components/ui/ConnectionGuard'

// SWR configuration for optimal performance
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 60000, // 60 seconds - reduced frequency
  dedupingInterval: 10000, // 10 seconds - increased deduping
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  loadingTimeout: 10000,
  focusThrottleInterval: 5000,
  keepPreviousData: true, // Keep previous data while fetching new data
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EnhancedErrorBoundary>
      {/* Temporarily bypassed ConnectionGuard for debugging */}
      <SWRConfig value={swrConfig}>
        {children}
      </SWRConfig>
    </EnhancedErrorBoundary>
  )
}
