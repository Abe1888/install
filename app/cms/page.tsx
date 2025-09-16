'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Dynamically import CMS component with no SSR to prevent hydration issues
const RealTimeCMS = dynamic(() => import('@/components/cms/RealTimeCMS').then(mod => ({ default: mod.RealTimeCMS })), {
  loading: () => (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-10 text-center">
        <LoadingSpinner text="Loading CMS interface..." />
      </div>
    </div>
  ),
  ssr: false,
})

export default function CMSPage() {
  return (
    <AdminLayout>
      <RealTimeCMS />
    </AdminLayout>
  )
}
