'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Database } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('API Error caught by boundary:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isNetworkError = this.state.error?.message.includes('fetch') || 
                            this.state.error?.message.includes('network') ||
                            this.state.error?.message.includes('Failed to')

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="card max-w-md w-full text-center">
            <div className="card-body">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isNetworkError ? 'bg-orange-100' : 'bg-red-100'
              }`}>
                {isNetworkError ? (
                  <Database className={`w-8 h-8 ${isNetworkError ? 'text-orange-600' : 'text-red-600'}`} />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isNetworkError ? 'Connection Error' : 'Something went wrong'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {isNetworkError 
                  ? 'Unable to connect to the database. Please check your connection.'
                  : this.state.error?.message || 'An unexpected error occurred'
                }
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={this.handleRetry}
                  className="btn-primary w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="text-left mt-4">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      Error Details (Development)
                    </summary>
                    <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-auto">
                      {this.state.error?.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ApiErrorBoundary