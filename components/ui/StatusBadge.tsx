import React from 'react'
import { CheckCircle2, Clock, Activity, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatusBadgeProps {
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked'
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className 
}: StatusBadgeProps) {
  const config = {
    'Completed': {
      icon: CheckCircle2,
      className: 'status-completed'
    },
    'In Progress': {
      icon: Activity,
      className: 'status-in-progress'
    },
    'Pending': {
      icon: Clock,
      className: 'status-pending'
    },
    'Blocked': {
      icon: AlertTriangle,
      className: 'status-blocked'
    }
  }

  const { icon: Icon, className: statusClass } = config[status]
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <span className={cn(statusClass, className)}>
      {showIcon && <Icon className={cn(iconSize, 'mr-1')} />}
      {status}
    </span>
  )
}