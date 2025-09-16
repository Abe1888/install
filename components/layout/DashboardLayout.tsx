'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Truck, Calendar, Users, BarChart3, Menu, X, 
  CheckSquare, MapPin, Clock, Activity, Database
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { 
  prefetchVehiclesOptimized, 
  prefetchLocationsOptimized, 
  prefetchTeamMembersOptimized, 
  prefetchTasksOptimized,
  prefetchAllDataOptimized 
} from '@/lib/hooks/useOptimizedSWR'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/' },
  { id: 'schedule', label: 'Vehicle Schedule', icon: Truck, href: '/schedule' },
  { id: 'timeline', label: 'Installation Timeline', icon: Clock, href: '/timeline' },
  { id: 'gantt', label: 'Gantt Chart', icon: Calendar, href: '/gantt' },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  // Instant prefetch on hover with route-specific data
  const handleNavHover = useCallback((href: string) => {
    switch (href) {
      case '/schedule':
        prefetchVehiclesOptimized()
        prefetchLocationsOptimized()
        break
      case '/timeline':
        prefetchVehiclesOptimized()
        prefetchLocationsOptimized()
        break
      case '/gantt':
        prefetchVehiclesOptimized()
        prefetchLocationsOptimized()
        break
      case '/':
        prefetchAllDataOptimized()
        break
    }
  }, [])

  // Instant navigation with prefetch
  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    
    // Prefetch data before navigation
    handleNavHover(href)
    
    // Use router.push for instant navigation
    router.push(href)
  }, [router, handleNavHover])

  // Aggressive prefetch on layout mount
  React.useEffect(() => {
    let mounted = true
    
    const timer = setTimeout(() => {
      if (mounted && typeof window !== 'undefined') {
        try {
          prefetchAllDataOptimized()
        } catch (error) {
          console.warn('Failed to prefetch data:', error)
        }
      }
    }, 100) // Reduced delay for faster prefetch
    
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  GPS Installation Management
                </h1>
                <p className="text-xs text-gray-600 hidden sm:block">
                  Vehicle Tracking System Installation Platform
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Admin Link */}
              <Link
                href="/cms"
                className="hidden md:flex items-center space-x-1 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Admin Panel"
              >
                <Database className="w-4 h-4" />
                <span>Admin</span>
              </Link>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={cn(
        'bg-white border-b border-gray-200 sticky top-16 z-30',
        isMobileMenuOpen ? 'block' : 'hidden md:block'
      )}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:space-x-8 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={true}
                  onMouseEnter={() => handleNavHover(item.href)}
                  onClick={(e) => {
                    handleNavClick(e, item.href)
                    setIsMobileMenuOpen(false)
                  }}
                  className={cn(
                    'flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}