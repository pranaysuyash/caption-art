/**
 * HistoryTooltip Component
 * Shows action that will be undone/redone on hover
 * Requirements: 3.2, 3.3
 */

import { useState, useEffect, useRef } from 'react'

export interface HistoryTooltipProps {
  /** The action text to display */
  action: string
  /** Type of action (undo or redo) */
  type: 'undo' | 'redo'
  /** Whether the tooltip should be visible */
  visible: boolean
  /** Position of the tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Additional CSS class name */
  className?: string
}

/**
 * HistoryTooltip component displays action information on hover.
 * Shows what action will be undone or redone.
 */
export function HistoryTooltip({
  action,
  type,
  visible,
  position = 'bottom',
  className = ''
}: HistoryTooltipProps) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    // Requirement 3.2: Display on hover with slight delay
    if (visible) {
      timeoutRef.current = window.setTimeout(() => {
        setShow(true)
      }, 300) // 300ms delay before showing
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setShow(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [visible])

  if (!show || !action) {
    return null
  }

  // Requirement 3.2, 3.3: Show action that will be undone/redone
  const tooltipText = type === 'undo' 
    ? `Undo: ${action}`
    : `Redo: ${action}`

  return (
    <div 
      className={`history-tooltip history-tooltip--${position} ${className}`}
      role="tooltip"
      aria-live="polite"
    >
      <div className="history-tooltip__content">
        {tooltipText}
      </div>
      <div className="history-tooltip__arrow" />
    </div>
  )
}

/**
 * Hook to manage tooltip visibility on hover
 */
export function useHistoryTooltip() {
  const [isVisible, setIsVisible] = useState(false)
  const [action, setAction] = useState('')
  const [type, setType] = useState<'undo' | 'redo'>('undo')

  const showTooltip = (actionName: string, actionType: 'undo' | 'redo') => {
    setAction(actionName)
    setType(actionType)
    setIsVisible(true)
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  return {
    isVisible,
    action,
    type,
    showTooltip,
    hideTooltip
  }
}
