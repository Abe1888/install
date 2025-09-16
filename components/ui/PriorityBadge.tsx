import React from 'react'
import { AlertTriangle, Minus, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PriorityBadgeProps {
  priority: 'High' | 'Medium' | 'Low'
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function PriorityBadge({ 
  priority, 
  size = 'md', 
  showIcon = true, 
  className 
}: PriorityBadgeProps) {
  const config = {
    'High': {
      icon: AlertTriangle,
      className: 'priority-high'
    },
    'Medium': {
      icon: Minus,
      className: 'priority-medium'
    },
    'Low': {
      icon: ArrowDown,
      className: 'priority-low'
    }
  }

  const { icon: Icon, className: priorityClass } = config[priority]
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <span className={cn(priorityClass, className)}>
      {showIcon && <Icon className={cn(iconSize, 'mr-1')} />}
      {priority}
    </span>
  )
}