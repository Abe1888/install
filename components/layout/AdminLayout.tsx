'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Shield, Database, Settings, User, Home, LogOut
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()

  const handleBackToApp = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Admin Branding */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Admin Panel
                </h1>
                <p className="text-xs text-gray-400">
                  Content Management System
                </p>
              </div>
            </div>
            
            {/* Admin Actions */}
            <div className="flex items-center space-x-4">
              {/* Back to Main App */}
              <button
                onClick={handleBackToApp}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to App</span>
              </button>
              
              {/* Admin Profile */}
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium hidden sm:block">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Admin Footer */}
      <footer className="bg-gray-800 border-t border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-400">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>CMS v1.0</span>
              </div>
              <div className="hidden sm:block">
                <span>GPS Installation Management System</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Main App</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
