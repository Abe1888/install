import { DashboardLayout } from '@/components/layout/DashboardLayout'
import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Dynamically import VehicleSchedule with no SSR to prevent hydration issues
const VehicleSchedule = dynamic(() => import('@/components/schedule/VehicleSchedule').then(mod => ({ default: mod.VehicleSchedule })), {
  loading: () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
        <LoadingSpinner text="Loading vehicle schedule..." />
      </div>
    </div>
  ),
  ssr: false,
})

export default function SchedulePage() {
  return (
    <DashboardLayout>
      <VehicleSchedule />
    </DashboardLayout>
  )
}
