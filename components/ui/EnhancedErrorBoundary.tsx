'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle2 } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
  copied?: boolean
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Enhanced Error Boundary caught an error:', error, errorInfo)
    
    this.setState({ errorInfo })
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo, this.state.errorId)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleCopyError = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
    this.setState({ copied: true })
    setTimeout(() => this.setState({ copied: false }), 2000)
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="px-8 py-6 border-b border-slate-200">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isNetworkError ? 'bg-orange-100' : 'bg-red-100'
                }`}>
                  {isNetworkError ? (
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  ) : (
                    <Bug className="w-8 h-8 text-red-600" />
                  )}
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {isNetworkError ? 'Connection Error' : 'Application Error'}
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Error ID: <code className="text-xs bg-slate-100 px-2 py-1 rounded">{this.state.errorId}</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6">
              <div className="space-y-6">
                {/* Error Message */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">What happened?</h3>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-700">
                      {isNetworkError 
                        ? 'Unable to connect to the server. Please check your internet connection and try again.'
                        : this.state.error?.message || 'An unexpected error occurred while running the application.'
                      }
                    </p>
                  </div>
                </div>

                {/* Suggested Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">What can you do?</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-blue-600">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Try refreshing the page</p>
                        <p className="text-xs text-slate-600">This often resolves temporary issues</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-blue-600">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Check your internet connection</p>
                        <p className="text-xs text-slate-600">Ensure you have a stable connection</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-blue-600">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Return to the dashboard</p>
                        <p className="text-xs text-slate-600">Start fresh from the main page</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh Page</span>
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </button>
                </div>

                {/* Technical Details (Development) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">Technical Details</h3>
                      <button
                        onClick={this.handleCopyError}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-md flex items-center space-x-1 transition-colors"
                      >
                        {this.state.copied ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Error</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <details className="bg-slate-50 rounded-lg border border-slate-200">
                      <summary className="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                        View Error Stack
                      </summary>
                      <div className="px-4 pb-4">
                        <pre className="text-xs text-slate-600 overflow-auto max-h-40 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    </details>
                    
                    {this.state.errorInfo && (
                      <details className="bg-slate-50 rounded-lg border border-slate-200 mt-2">
                        <summary className="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                          View Component Stack
                        </summary>
                        <div className="px-4 pb-4">
                          <pre className="text-xs text-slate-600 overflow-auto max-h-40 whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
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

export default EnhancedErrorBoundary