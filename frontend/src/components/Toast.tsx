/**
 * Toast Notification Component
 * Simple toast system for user feedback with neo-brutalism styling
 */

import { useEffect, useState } from 'react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'loading'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

export function Toast({ message, type = 'info', duration = 3000, action, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        setExiting(true)
        setTimeout(() => {
          setVisible(false)
          onClose?.()
        }, 300) // Match animation duration
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, type, onClose])

  if (!visible) return null

  const icons = {
    success: '✓',
    error: '⚠️',
    info: 'ℹ️',
    loading: '⏳'
  }

  const toastClass = `toast toast-${type} ${exiting ? 'toast-exit' : ''}`

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, 300)
  }

  return (
    <div 
      className={toastClass}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="toast-icon" aria-hidden="true">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="button button-accent"
          style={{ padding: '6px 12px', fontSize: '12px', textTransform: 'uppercase' }}
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
      {type !== 'loading' && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 4px',
            minWidth: '24px',
            minHeight: '24px'
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

// Toast Manager Hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])

  const show = (props: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...props, id }])
    return id
  }

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const success = (message: string, action?: ToastProps['action']) => {
    return show({ message, type: 'success', action })
  }

  const error = (message: string, action?: ToastProps['action']) => {
    return show({ message, type: 'error', duration: 5000, action })
  }

  const info = (message: string) => {
    return show({ message, type: 'info' })
  }

  const loading = (message: string) => {
    return show({ message, type: 'loading', duration: 0 })
  }

  return {
    toasts,
    show,
    dismiss,
    success,
    error,
    info,
    loading
  }
}

// Toast Container Component
export function ToastContainer({ toasts, onDismiss }: { 
  toasts: Array<ToastProps & { id: string }>
  onDismiss: (id: string) => void 
}) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}
