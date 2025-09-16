import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ImprovedDashboard } from '@/components/dashboard/ImprovedDashboard'

export default function HomePage() {
  return (
    <DashboardLayout>
      <ImprovedDashboard />
    </DashboardLayout>
  )
}