import { DashboardLayout } from '@/components/layout/DashboardLayout'
import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Dynamically import WorkingGanttChart with no SSR to prevent hydration issues  
const WorkingGanttChart = dynamic(() => import('@/components/gantt/WorkingGanttChart'), {
  loading: () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
        <LoadingSpinner text="Loading Gantt chart..." />
      </div>
    </div>
  ),
  ssr: false,
})

export default function GanttPage() {
  return (
    <DashboardLayout>
      <WorkingGanttChart />
    </DashboardLayout>
  )
}
