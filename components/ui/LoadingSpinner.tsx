import React from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center justify-center space-x-3', className)}>
      <RefreshCw className={cn(sizeClasses[size], 'text-primary-600 animate-spin')} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}