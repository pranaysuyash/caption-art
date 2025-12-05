/**
 * ConfirmDialog Component
 * Reusable confirmation dialog for user confirmations
 * Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 5.2, 5.3, 5.4, 5.5
 */

import { useEffect, useRef, useState } from 'react'
import './ConfirmDialog.css'

export interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'warning'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  isOpen: boolean
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isOpen,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Store the previously focused element when dialog opens
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the confirm button when dialog opens
      setTimeout(() => confirmButtonRef.current?.focus(), 0)
    } else {
      // Restore focus when dialog closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key cancels
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
        return
      }

      // Enter key confirms (if not loading)
      if (e.key === 'Enter' && !isLoading) {
        e.preventDefault()
        handleConfirm()
        return
      }

      // Tab key for focus trap
      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          // Shift+Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onCancel])

  const handleConfirm = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      await onConfirm()
    } catch (error) {
      console.error('Confirm action failed:', error)
      setIsLoading(false)
      // Keep dialog open on error
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="confirm-dialog" ref={dialogRef}>
        <div className="confirm-dialog-header">
          <h2 id="confirm-dialog-title">{title}</h2>
        </div>

        <div className="confirm-dialog-body">
          <p id="confirm-dialog-message">{message}</p>
        </div>

        <div className="confirm-dialog-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`button button-${variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary'}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
