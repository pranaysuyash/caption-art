/**
 * ErrorToast - Enhanced toast component for error display
 * Requirements: 1.1, 1.2, 3.1, 3.3
 * 
 * Displays errors with:
 * - Specific, actionable error messages
 * - Retry buttons for retryable errors
 * - Recovery action buttons
 * - Auto-dismiss for non-critical errors
 * - Persistent display for critical errors
 */

import { useEffect, useState } from 'react'
import type { ErrorInfo } from '../lib/errors/ErrorManager'

export interface ErrorToastProps {
  errorInfo: ErrorInfo
  onRetry?: () => void | Promise<void>
  onDismiss?: () => void
}

export function ErrorToast({ errorInfo, onRetry, onDismiss }: ErrorToastProps) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [retrying, setRetrying] = useState(false)

  // Determine if error is critical (should not auto-dismiss)
  const isCritical = ['unauthorized', 'api_error'].includes(errorInfo.type)

  // Auto-dismiss for non-critical errors
  useEffect(() => {
    if (!isCritical) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, 10000) // 10 seconds for errors

      return () => clearTimeout(timer)
    }
  }, [isCritical])

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, 300)
  }

  const handleRetry = async () => {
    if (!onRetry) return

    setRetrying(true)
    try {
      await onRetry()
      handleDismiss()
    } catch (err) {
      // Error will be handled by the caller
      console.error('Retry failed:', err)
    } finally {
      setRetrying(false)
    }
  }

  const handleRecoveryAction = async (action: () => void | Promise<void>) => {
    try {
      await action()
      handleDismiss()
    } catch (err) {
      console.error('Recovery action failed:', err)
    }
  }

  if (!visible) return null

  const toastClass = `error-toast error-toast-${errorInfo.type} ${exiting ? 'error-toast-exit' : ''}`

  return (
    <div
      className={toastClass}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        maxWidth: '400px',
        backgroundColor: 'var(--color-bg-primary, white)',
        border: '3px solid var(--color-error, #ef4444)',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '4px 4px 0 var(--color-border, #000)',
        zIndex: 10000,
        animation: exiting ? 'slideOut 0.3s ease-out' : 'slideIn 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span
          style={{
            fontSize: '1.5rem',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          ⚠️
        </span>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text, #1f2937)',
            }}
          >
            {errorInfo.type === 'network' && 'Network Error'}
            {errorInfo.type === 'api_rate_limit' && 'Rate Limit Exceeded'}
            {errorInfo.type === 'timeout' && 'Request Timeout'}
            {errorInfo.type === 'validation' && 'Validation Error'}
            {errorInfo.type === 'not_found' && 'Not Found'}
            {errorInfo.type === 'unauthorized' && 'Unauthorized'}
            {errorInfo.type === 'api_error' && 'Server Error'}
            {errorInfo.type === 'unknown' && 'Error'}
          </h4>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss error"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary, #6b7280)',
            cursor: 'pointer',
            fontSize: '1.25rem',
            padding: 0,
            minWidth: '24px',
            minHeight: '24px',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Message */}
      <p
        style={{
          margin: '0 0 1rem 0',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary, #6b7280)',
          lineHeight: 1.5,
        }}
      >
        {errorInfo.userMessage}
      </p>

      {/* Actions */}
      {(errorInfo.isRetryable || errorInfo.recoveryActions.length > 0) && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Retry button */}
          {errorInfo.isRetryable && onRetry && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="btn btn-primary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                opacity: retrying ? 0.6 : 1,
              }}
            >
              {retrying ? 'Retrying...' : 'Retry'}
            </button>
          )}

          {/* Recovery action buttons */}
          {errorInfo.recoveryActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleRecoveryAction(action.action)}
              className={action.isPrimary ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Retry count indicator */}
      {errorInfo.context.retryCount > 0 && (
        <div
          style={{
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary, #9ca3af)',
          }}
        >
          Retry attempt {errorInfo.context.retryCount} of 3
        </div>
      )}
    </div>
  )
}

// CSS animations (add to global styles or component styles)
const styles = `
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.error-toast-exit {
  animation: slideOut 0.3s ease-out forwards;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}
