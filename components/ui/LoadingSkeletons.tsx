'use client';

import React from 'react';

// Base skeleton animation component
const SkeletonBase = ({ className = "", animate = true }: { className?: string; animate?: boolean }) => (
  <div 
    className={`bg-slate-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
  />
);

// Task Management Loading Skeleton
export const TaskManagementSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonBase className="w-8 h-8 rounded-md" />
            <div>
              <SkeletonBase className="h-5 w-40 mb-2" />
              <SkeletonBase className="h-4 w-60" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <SkeletonBase className="h-9 w-20" />
            <SkeletonBase className="h-9 w-24" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Statistics Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <SkeletonBase className="w-4 h-4 mx-auto mb-2" />
              <SkeletonBase className="h-6 w-8 mx-auto mb-1" />
              <SkeletonBase className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <SkeletonBase className="w-4 h-4" />
            <SkeletonBase className="h-4 w-20" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBase key={i} className="h-10 w-full" />
            ))}
          </div>
          
          {/* Pagination Controls Skeleton */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-4">
              <SkeletonBase className="h-4 w-32" />
              <SkeletonBase className="h-4 w-24" />
            </div>
            <div className="flex items-center space-x-2">
              <SkeletonBase className="h-8 w-20" />
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonBase key={i} className="h-8 w-8" />
              ))}
              <SkeletonBase className="h-8 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Task Cards Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Individual Task Card Skeleton
export const TaskCardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
    {/* Task Header */}
    <div className="p-4 border-b border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <SkeletonBase className="w-4 h-4" />
          <div className="min-w-0 flex-1">
            <SkeletonBase className="h-4 w-32 mb-1" />
            <SkeletonBase className="h-3 w-24" />
          </div>
        </div>
        <SkeletonBase className="w-4 h-4" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SkeletonBase className="w-3 h-3" />
          <SkeletonBase className="h-3 w-16" />
        </div>
        
        <div className="flex items-center space-x-2">
          <SkeletonBase className="h-5 w-12 rounded-full" />
          <SkeletonBase className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>

    {/* Task Actions */}
    <div className="p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SkeletonBase className="w-3 h-3" />
          <SkeletonBase className="h-3 w-20" />
          <SkeletonBase className="w-3 h-3 ml-2" />
          <SkeletonBase className="h-3 w-12" />
        </div>
        <SkeletonBase className="h-6 w-12" />
      </div>
    </div>
  </div>
);

// Team Management Loading Skeleton
export const TeamManagementSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonBase className="w-8 h-8 rounded-md" />
            <div>
              <SkeletonBase className="h-5 w-36 mb-2" />
              <SkeletonBase className="h-4 w-52" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <SkeletonBase className="h-9 w-20" />
            <SkeletonBase className="h-9 w-26" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Team Statistics Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center p-4 bg-blue-50 rounded-md border border-blue-200">
              <SkeletonBase className="w-5 h-5 mx-auto mb-2" />
              <SkeletonBase className="h-6 w-8 mx-auto mb-1" />
              <SkeletonBase className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <SkeletonBase className="w-4 h-4" />
            <SkeletonBase className="h-4 w-28" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBase key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Team Member Cards Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <TeamMemberCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Individual Team Member Card Skeleton
export const TeamMemberCardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
    {/* Member Header */}
    <div className="p-6 border-b border-slate-200">
      <div className="flex items-center space-x-4">
        <SkeletonBase className="w-12 h-12 rounded-full" />
        
        <div className="min-w-0 flex-1">
          <SkeletonBase className="h-4 w-28 mb-1" />
          <SkeletonBase className="h-3 w-20 mb-2" />
          <div className="flex items-center space-x-2">
            <SkeletonBase className="w-3 h-3" />
            <SkeletonBase className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>

    {/* Performance Metrics */}
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <SkeletonBase className="h-5 w-8 mx-auto mb-1" />
            <SkeletonBase className="h-3 w-12 mx-auto" />
          </div>
        ))}
      </div>

      {/* Performance Badge */}
      <div className="flex justify-center mb-4">
        <SkeletonBase className="h-6 w-32 rounded-full" />
      </div>

      {/* Specializations */}
      <div className="mb-4">
        <SkeletonBase className="h-3 w-20 mb-2" />
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBase key={i} className="h-6 w-16 rounded-md" />
          ))}
        </div>
      </div>

      {/* Current Tasks */}
      <div>
        <SkeletonBase className="h-3 w-24 mb-2" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-50 rounded-md p-2">
              <SkeletonBase className="h-4 w-4 mx-auto mb-1" />
              <SkeletonBase className="h-3 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Progressive Loading Component - shows skeleton while loading, then fades to content
export const ProgressiveLoader = ({ 
  isLoading, 
  skeleton, 
  children, 
  showCachedData = false 
}: { 
  isLoading: boolean; 
  skeleton: React.ReactNode; 
  children: React.ReactNode;
  showCachedData?: boolean;
}) => {
  if (isLoading && !showCachedData) {
    return <>{skeleton}</>;
  }

  return (
    <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-75' : 'opacity-100'}`}>
      {children}
    </div>
  );
};

// Mini loading indicators for inline use
export const InlineLoader = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin`} />
  );
};

// Error state placeholder
export const ErrorPlaceholder = ({ 
  title = "Something went wrong",
  message = "Unable to load data at this time",
  onRetry,
  showRetry = true
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}) => (
  <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-600 mb-4">{message}</p>
    {showRetry && onRetry && (
      <button onClick={onRetry} className="btn-primary">
        Try Again
      </button>
    )}
  </div>
);
