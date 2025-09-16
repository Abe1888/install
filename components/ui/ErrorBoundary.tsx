'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number | boolean | undefined | null>
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)
    
    // Enhanced logging
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && resetOnPropsChange) {
      const hasResetKeyChanged = resetKeys?.some((key, idx) => {
        return key !== prevProps.resetKeys?.[idx]
      })

      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }
  }

  private resetErrorBoundary = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    })
  }

  private handleRetry = () => {
    this.resetErrorBoundary()
    this.resetTimeoutId = window.setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  private handleGoHome = () => {
    this.resetErrorBoundary()
    window.location.href = '/'
  }

  private copyErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state
    const errorDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => alert('Error details copied to clipboard'))
      .catch(() => console.log('Error details:', errorDetails))
  }

  render() {
    const { hasError, error, errorId } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-6 text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Error Title */}
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Something went wrong
              </h1>

              {/* Error Message */}
              <p className="text-sm text-slate-600 mb-6">
                {process.env.NODE_ENV === 'development' 
                  ? error?.message || 'An unexpected error occurred'
                  : 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.'
                }
              </p>

              {/* Error ID for support */}
              {errorId && (
                <p className="text-xs text-slate-500 mb-6 font-mono bg-slate-100 p-2 rounded">
                  Error ID: {errorId}
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </button>

                {/* Debug button for development */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={this.copyErrorDetails}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Bug className="w-4 h-4" />
                    <span>Copy Error Details</span>
                  </button>
                )}
              </div>

              {/* Development-only error details */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                    Technical Details
                  </summary>
                  <div className="mt-3 p-3 bg-slate-100 rounded text-xs font-mono text-slate-800 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {error?.stack || 'No stack trace available'}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

// Hook for functional components to trigger error boundaries
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export { ErrorBoundary }
export default ErrorBoundary
