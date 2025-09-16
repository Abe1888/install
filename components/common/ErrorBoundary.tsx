'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showRefresh?: boolean;
  showHomeButton?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;
  
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      retryCount: 0
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to logging service
      // logErrorToService(error, errorInfo);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Force page reload after max retries
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleShowDetails = () => {
    // Toggle error details visibility
    const details = document.getElementById('error-details');
    if (details) {
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
  };

  public render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Something went wrong',
        fallbackMessage = 'An unexpected error occurred. Please try refreshing the page.',
        showRefresh = true,
        showHomeButton = true
      } = this.props;

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>

                {/* Error Title */}
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  {fallbackTitle}
                </h2>

                {/* Error Message */}
                <p className="text-sm text-gray-600 mb-6">
                  {fallbackMessage}
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {showRefresh && (
                    <button
                      onClick={this.handleRetry}
                      className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>
                        {this.state.retryCount >= this.maxRetries ? 'Reload Page' : 'Try Again'}
                      </span>
                    </button>
                  )}

                  {showHomeButton && (
                    <button
                      onClick={this.handleGoHome}
                      className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Home className="h-4 w-4" />
                      <span>Go to Dashboard</span>
                    </button>
                  )}

                  {/* Developer Details Toggle (only in development) */}
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <button
                      onClick={this.handleShowDetails}
                      className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100"
                    >
                      <Bug className="h-4 w-4" />
                      <span>Show Error Details</span>
                    </button>
                  )}
                </div>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div id="error-details" className="mt-6 text-left" style={{ display: 'none' }}>
                    <div className="bg-gray-100 rounded-md p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h4>
                      <pre className="text-xs text-red-600 whitespace-pre-wrap break-words">
                        {this.state.error.toString()}
                      </pre>
                      
                      {this.state.errorInfo && (
                        <>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 mt-4">Component Stack:</h4>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Retry Information */}
                <div className="mt-4 text-xs text-gray-500">
                  {this.state.retryCount > 0 && (
                    <p>Retry attempt: {this.state.retryCount}/{this.maxRetries}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
}

// Specialized error boundaries for different component types
export const TimelineErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallbackTitle="Timeline Loading Failed"
    fallbackMessage="There was an issue loading the installation timeline. This might be due to data connectivity issues."
    onError={(error, errorInfo) => {
      console.error('Timeline Error:', error);
      // Could send to analytics here
    }}
  >
    {children}
  </ErrorBoundary>
);

export const GanttErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallbackTitle="Gantt Chart Error"
    fallbackMessage="The Gantt chart couldn't be displayed. This might be due to complex data processing requirements."
    onError={(error, errorInfo) => {
      console.error('Gantt Chart Error:', error);
      // Could send to analytics here
    }}
  >
    {children}
  </ErrorBoundary>
);

export const TaskErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallbackTitle="Task Management Error"
    fallbackMessage="There was an issue with the task management system. Please try refreshing to restore functionality."
    onError={(error, errorInfo) => {
      console.error('Task Management Error:', error);
      // Could send to analytics here
    }}
  >
    {children}
  </ErrorBoundary>
);

export const TeamErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallbackTitle="Team Management Error"
    fallbackMessage="The team management interface encountered an error. Please refresh to continue managing team members."
    onError={(error, errorInfo) => {
      console.error('Team Management Error:', error);
      // Could send to analytics here
    }}
  >
    {children}
  </ErrorBoundary>
);
