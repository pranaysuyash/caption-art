/**
 * HistoryControls Component
 * Provides undo/redo buttons with tooltips and clear history functionality
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.2, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { useEffect, useState } from 'react'

export interface HistoryControlsProps {
  /** Callback when undo button is clicked */
  onUndo: () => void
  /** Callback when redo button is clicked */
  onRedo: () => void
  /** Callback when clear history is confirmed */
  onClear?: () => void
  /** Whether undo is available */
  canUndo: boolean
  /** Whether redo is available */
  canRedo: boolean
  /** Name of the action that will be undone (for tooltip) */
  undoActionName?: string
  /** Name of the action that will be redone (for tooltip) */
  redoActionName?: string
  /** Additional CSS class name */
  className?: string
}

/**
 * HistoryControls component renders undo, redo, and clear history buttons.
 * Buttons are disabled when unavailable and show tooltips with action names.
 */
export function HistoryControls({
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  undoActionName,
  redoActionName,
  className = ''
}: HistoryControlsProps) {
  const [isMac, setIsMac] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  // Build tooltip text with action names (Requirement 3.2)
  const undoTooltip = undoActionName
    ? `Undo "${undoActionName}" (${isMac ? 'Cmd' : 'Ctrl'}+Z)`
    : `Undo (${isMac ? 'Cmd' : 'Ctrl'}+Z)`

  const redoTooltip = redoActionName
    ? `Redo "${redoActionName}" (${isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y'})`
    : `Redo (${isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y'})`

  // Handle clear history button click - Requirement 6.1
  const handleClearClick = () => {
    setShowConfirmation(true)
  }

  // Handle confirmation - Requirement 6.2
  const handleConfirm = () => {
    if (onClear) {
      onClear()
    }
    setShowConfirmation(false)
  }

  // Handle cancellation - Requirement 6.5
  const handleCancel = () => {
    setShowConfirmation(false)
  }

  return (
    <div className={`history-controls ${className}`}>
      {/* Undo button - Requirements 1.1, 1.2, 1.3, 3.2 */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={canUndo ? 'button button-secondary' : 'button'}
        title={undoTooltip}
        aria-label={undoTooltip}
      >
        <span>↶</span>
        <span className="button-text">Undo</span>
      </button>

      {/* Redo button - Requirements 2.1, 2.2, 2.3, 3.2 */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={canRedo ? 'button button-secondary' : 'button'}
        title={redoTooltip}
        aria-label={redoTooltip}
      >
        <span>↷</span>
        <span className="button-text">Redo</span>
      </button>

      {/* Clear history button - Requirements 6.1, 6.2, 6.3, 6.4, 6.5 */}
      {onClear && (
        <button
          onClick={handleClearClick}
          disabled={!canUndo && !canRedo}
          className="button button-secondary"
          title="Clear history"
          aria-label="Clear history"
        >
          <span>🗑️</span>
          <span className="button-text">Clear</span>
        </button>
      )}

      {/* Confirmation dialog - Requirement 6.1 */}
      {showConfirmation && (
        <div className="history-confirmation-overlay" onClick={handleCancel}>
          <div className="history-confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Clear History?</h3>
            <p>This will remove all undo/redo history. Your current state will be kept. This action cannot be undone.</p>
            <div className="history-confirmation-buttons">
              <button
                onClick={handleConfirm}
                className="button button-primary"
                aria-label="Confirm clear history"
              >
                Clear History
              </button>
              <button
                onClick={handleCancel}
                className="button button-secondary"
                aria-label="Cancel clear history"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
