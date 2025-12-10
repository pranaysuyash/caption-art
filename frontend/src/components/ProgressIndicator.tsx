/**
 * ProgressIndicator - Visual progress indicator component
 * Requirements: 1.3, 1.4, 6.1, 6.3, 6.4, 6.6
 * 
 * Displays:
 * - Operation name and status
 * - Progress bar with percentage
 * - Estimated time remaining
 * - Cancel button for cancellable operations
 * - Current step information
 */

import { useEffect, useState } from 'react'
import type { ProgressInfo } from '../lib/progress/ProgressTracker'

export interface ProgressIndicatorProps {
  progressInfo: ProgressInfo
  operation: string
  onCancel?: () => void
  compact?: boolean
}

export function ProgressIndicator({
  progressInfo,
  operation,
  onCancel,
  compact = false,
}: ProgressIndicatorProps) {
  const [displayedPercentage, setDisplayedPercentage] = useState(0)

  // Smooth progress animation
  useEffect(() => {
    const targetPercentage = progressInfo.percentage
    const diff = targetPercentage - displayedPercentage

    if (Math.abs(diff) < 0.1) {
      setDisplayedPercentage(targetPercentage)
      return
    }

    const animationFrame = requestAnimationFrame(() => {
      setDisplayedPercentage((prev) => prev + diff * 0.1)
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [progressInfo.percentage, displayedPercentage])

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000)

    if (seconds < 60) {
      return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getStateColor = (): string => {
    switch (progressInfo.state) {
      case 'running':
        return 'var(--color-primary, #3b82f6)'
      case 'success':
        return 'var(--color-success, #10b981)'
      case 'error':
        return 'var(--color-error, #ef4444)'
      case 'cancelled':
        return 'var(--color-text-secondary, #6b7280)'
      default:
        return 'var(--color-border, #d1d5db)'
    }
  }

  const getStateIcon = (): string => {
    switch (progressInfo.state) {
      case 'running':
        return '⏳'
      case 'success':
        return '✓'
      case 'error':
        return '⚠️'
      case 'cancelled':
        return '⊗'
      default:
        return '○'
    }
  }

  const getStateLabel = (): string => {
    switch (progressInfo.state) {
      case 'running':
        return 'In Progress'
      case 'success':
        return 'Complete'
      case 'error':
        return 'Failed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Idle'
    }
  }

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          backgroundColor: 'var(--color-bg-secondary, #f3f4f6)',
          borderRadius: '8px',
          border: '2px solid var(--color-border, #e5e7eb)',
        }}
      >
        <span style={{ fontSize: '1.25rem' }} aria-hidden="true">
          {getStateIcon()}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              height: '6px',
              backgroundColor: 'var(--color-bg-primary, white)',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid var(--color-border, #e5e7eb)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${displayedPercentage}%`,
                backgroundColor: getStateColor(),
                transition: 'width 0.3s ease-out',
              }}
              role="progressbar"
              aria-valuenow={Math.round(displayedPercentage)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text, #1f2937)',
            minWidth: '3rem',
            textAlign: 'right',
          }}
        >
          {Math.round(displayedPercentage)}%
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-primary, white)',
        border: '3px solid var(--color-border, #000)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '4px 4px 0 var(--color-border, #000)',
      }}
      role="region"
      aria-label={`Progress: ${operation}`}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }} aria-hidden="true">
            {getStateIcon()}
          </span>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text, #1f2937)',
              }}
            >
              {operation}
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary, #6b7280)',
              }}
            >
              {getStateLabel()}
            </p>
          </div>
        </div>

        {/* Cancel button */}
        {progressInfo.canCancel && progressInfo.state === 'running' && onCancel && (
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '12px',
          backgroundColor: 'var(--color-bg-secondary, #f3f4f6)',
          borderRadius: '6px',
          overflow: 'hidden',
          border: '2px solid var(--color-border, #e5e7eb)',
          marginBottom: '0.75rem',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${displayedPercentage}%`,
            backgroundColor: getStateColor(),
            transition: 'width 0.3s ease-out',
            position: 'relative',
          }}
          role="progressbar"
          aria-valuenow={Math.round(displayedPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(displayedPercentage)}% complete`}
        >
          {/* Animated stripes for running state */}
          {progressInfo.state === 'running' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage:
                  'linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)',
                backgroundSize: '20px 20px',
                animation: 'progress-stripes 1s linear infinite',
              }}
            />
          )}
        </div>
      </div>

      {/* Progress details */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary, #6b7280)',
        }}
      >
        <div>
          {/* Current step */}
          {progressInfo.currentStep && (
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>Step:</strong> {progressInfo.currentStep}
            </div>
          )}

          {/* Step counter */}
          {progressInfo.totalSteps > 0 && (
            <div>
              <strong>Progress:</strong> {progressInfo.completedSteps} of{' '}
              {progressInfo.totalSteps} steps
            </div>
          )}

          {/* Message */}
          {progressInfo.message && (
            <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
              {progressInfo.message}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          {/* Percentage */}
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text, #1f2937)',
              marginBottom: '0.25rem',
            }}
          >
            {Math.round(displayedPercentage)}%
          </div>

          {/* Time remaining */}
          {progressInfo.state === 'running' &&
            progressInfo.estimatedTimeRemaining !== undefined && (
              <div>
                <strong>ETA:</strong> {formatTime(progressInfo.estimatedTimeRemaining)}
              </div>
            )}

          {/* Elapsed time */}
          {progressInfo.elapsedTime > 0 && (
            <div>
              <strong>Elapsed:</strong> {formatTime(progressInfo.elapsedTime)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// CSS animation for progress stripes
const styles = `
@keyframes progress-stripes {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 20px 0;
  }
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}
