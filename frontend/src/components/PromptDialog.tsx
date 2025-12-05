/**
 * PromptDialog Component
 * Reusable prompt dialog for text input
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.2, 5.2, 5.3, 5.4, 5.5
 */

import { useEffect, useRef, useState } from 'react'
import './PromptDialog.css'

export interface PromptDialogProps {
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
  validate?: (value: string) => string | null
  onConfirm: (value: string) => void | Promise<void>
  onCancel: () => void
  isOpen: boolean
}

export function PromptDialog({
  title,
  message,
  placeholder = '',
  defaultValue = '',
  confirmLabel = 'Submit',
  cancelLabel = 'Cancel',
  validate,
  onConfirm,
  onCancel,
  isOpen,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setError(null)
      setIsLoading(false)
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the input when dialog opens
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      // Restore focus when dialog closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, defaultValue])

  // Validate on value change
  useEffect(() => {
    if (validate && value) {
      const validationError = validate(value)
      setError(validationError)
    } else {
      setError(null)
    }
  }, [value, validate])

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

      // Enter key confirms (if not loading and no validation error)
      if (e.key === 'Enter' && !isLoading && !error) {
        e.preventDefault()
        handleConfirm()
        return
      }

      // Tab key for focus trap
      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
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
  }, [isOpen, isLoading, error, onCancel])

  const handleConfirm = async () => {
    if (isLoading) return

    // Run validation
    if (validate) {
      const validationError = validate(value)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    try {
      setIsLoading(true)
      await onConfirm(value)
    } catch (err) {
      console.error('Confirm action failed:', err)
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
      className="prompt-dialog-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-dialog-title"
      aria-describedby={message ? 'prompt-dialog-message' : undefined}
    >
      <div className="prompt-dialog" ref={dialogRef}>
        <div className="prompt-dialog-header">
          <h2 id="prompt-dialog-title">{title}</h2>
        </div>

        <div className="prompt-dialog-body">
          {message && <p id="prompt-dialog-message">{message}</p>}
          
          <div className="prompt-dialog-input-group">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading}
              className={error ? 'input-error' : ''}
              aria-invalid={!!error}
              aria-describedby={error ? 'prompt-dialog-error' : undefined}
            />
            {error && (
              <div id="prompt-dialog-error" className="prompt-dialog-error" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="prompt-dialog-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleConfirm}
            disabled={isLoading || !!error}
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
