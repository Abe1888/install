'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Play, Pause, Check } from 'lucide-react'

interface ProjectCountdownProps {
  startDate: string
  endDate?: string | null
  projectStatus?: { status: string; message: string }
  className?: string
  onCountdownComplete?: () => void
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function ProjectCountdown({ 
  startDate, 
  endDate = null,
  projectStatus = { status: 'pending', message: 'Project not started yet' },
  className = '',
  onCountdownComplete 
}: ProjectCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  })
  const [endTimeRemaining, setEndTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  })
  const [isActive, setIsActive] = useState(true)

  const calculateTimeRemaining = (targetDate: string): TimeRemaining => {
    const now = new Date().getTime()
    const target = new Date(targetDate).getTime()
    const difference = target - now

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, total: difference }
  }

  useEffect(() => {
    if (!isActive) return

    const timer = setInterval(() => {
      // Calculate time to start
      const startRemaining = calculateTimeRemaining(startDate)
      setTimeRemaining(startRemaining)
      
      // Calculate time to end if we have an end date
      if (endDate) {
        const endRemaining = calculateTimeRemaining(endDate)
        setEndTimeRemaining(endRemaining)
      }

      // Trigger callback when project starts
      if (startRemaining.total <= 0 && projectStatus.status === 'pending' && onCountdownComplete) {
        onCountdownComplete()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [startDate, endDate, isActive, projectStatus.status, onCountdownComplete])

  // Initial calculation
  useEffect(() => {
    const startRemaining = calculateTimeRemaining(startDate)
    setTimeRemaining(startRemaining)
    
    if (endDate) {
      const endRemaining = calculateTimeRemaining(endDate)
      setEndTimeRemaining(endRemaining)
    }
  }, [startDate, endDate])

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0')
  }

  const isProjectLive = projectStatus.status === 'live'
  const isProjectCompleted = projectStatus.status === 'completed'
  const isStartingSoon = timeRemaining.days <= 7 && timeRemaining.total > 0 && projectStatus.status === 'pending'
  const isEndingSoon = endTimeRemaining.days <= 7 && endTimeRemaining.total > 0 && isProjectLive

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isProjectLive ? 'bg-green-600' : 
              isProjectCompleted ? 'bg-blue-600' :
              isStartingSoon || isEndingSoon ? 'bg-orange-600' : 'bg-primary-600'
            }`}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {projectStatus.message}
              </h3>
              <p className="text-sm text-gray-600">
                {isProjectLive ? (
                  endDate ? (
                    `Project ends on: ${new Date(endDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}`
                  ) : 'Installation project is now active'
                ) : isProjectCompleted ? (
                  'Project has been completed successfully'
                ) : (
                  `Project starts on: ${new Date(startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}`
                )}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsActive(!isActive)}
            className={`p-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label={isActive ? 'Pause countdown' : 'Resume countdown'}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="card-body">
        {isProjectLive ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-xl font-semibold text-green-800 mb-2">Project is Live!</h4>
            <p className="text-sm text-green-700 mb-4">
              Installation work is currently active and ongoing.
            </p>
            {endDate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {isEndingSoon ? 'Project Ending Soon!' : 'Time Remaining'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{formatNumber(endTimeRemaining.days)}</div>
                    <div className="text-xs text-green-700 font-medium">DAYS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{formatNumber(endTimeRemaining.hours)}</div>
                    <div className="text-xs text-green-700 font-medium">HRS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{formatNumber(endTimeRemaining.minutes)}</div>
                    <div className="text-xs text-green-700 font-medium">MIN</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{formatNumber(endTimeRemaining.seconds)}</div>
                    <div className="text-xs text-green-700 font-medium">SEC</div>
                  </div>
                </div>
                <p className="text-xs text-green-700">
                  {isEndingSoon ? 'Project deadline is approaching!' : `Project ends on ${new Date(endDate).toLocaleDateString()}`}
                </p>
              </div>
            )}
          </div>
        ) : isProjectCompleted ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-xl font-semibold text-blue-800 mb-2">Project Completed!</h4>
            <p className="text-sm text-blue-700">
              All installation work has been completed successfully.
            </p>
          </div>
        ) : (
          <>
            {/* Countdown Display */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`}>
                  {formatNumber(timeRemaining.days)}
                </div>
                <div className="text-xs text-gray-600 font-medium">DAYS</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`}>
                  {formatNumber(timeRemaining.hours)}
                </div>
                <div className="text-xs text-gray-600 font-medium">HOURS</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`}>
                  {formatNumber(timeRemaining.minutes)}
                </div>
                <div className="text-xs text-gray-600 font-medium">MINUTES</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`}>
                  {formatNumber(timeRemaining.seconds)}
                </div>
                <div className="text-xs text-gray-600 font-medium">SECONDS</div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`text-center p-4 rounded-lg border ${
              isStartingSoon 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-primary-50 border-primary-200'
            }`}>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className={`w-4 h-4 ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`} />
                <span className={`text-sm font-medium ${
                  isStartingSoon ? 'text-orange-800' : 'text-primary-800'
                }`}>
                  {isStartingSoon ? 'Starting Soon!' : 'Countdown Active'}
                </span>
              </div>
              <p className={`text-xs ${
                isStartingSoon ? 'text-orange-700' : 'text-primary-700'
              }`}>
                {isStartingSoon 
                  ? 'Project starts in less than a week. Prepare for installation activities.'
                  : 'Monitor the countdown and prepare for the upcoming installation project.'
                }
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Time Progress</span>
                <span className="text-xs text-gray-600">
                  {timeRemaining.days > 0 ? `${timeRemaining.days} days remaining` : 'Starting today!'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    isStartingSoon ? 'bg-orange-500' : 'bg-primary-500'
                  }`}
                  style={{ 
                    width: `${Math.max(0, Math.min(100, 100 - (timeRemaining.days / 30) * 100))}%` 
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectCountdown
