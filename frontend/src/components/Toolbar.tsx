/**
 * Toolbar Component
 * Main toolbar with undo/redo and other actions
 */

import { useEffect, useState } from 'react'
import './Toolbar.css'

export interface ToolbarProps {
  onUndo?: () => void
  onRedo?: () => void
  onClearHistory?: () => void
  onExport?: () => void
  canUndo?: boolean
  canRedo?: boolean
  disabled?: boolean
  onRecord?: () => void
  isRecording?: boolean
  recordingTime?: number
}

export function Toolbar({
  onUndo,
  onRedo,
  onClearHistory,
  onExport,
  canUndo = false,
  canRedo = false,
  disabled = false,
  onRecord,
  isRecording = false,
  recordingTime = 0
}: ToolbarProps) {
  const [isMac, setIsMac] = useState(false)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Undo: Ctrl/Cmd + Z
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo && onUndo) {
          onUndo()
        }
      }

      // Redo: Ctrl/Cmd + Y (Windows) or Cmd + Shift + Z (Mac)
      if (modifier && ((e.key === 'y' && !isMac) || (e.key === 'z' && e.shiftKey && isMac))) {
        e.preventDefault()
        if (canRedo && onRedo) {
          onRedo()
        }
      }

      // Export: Ctrl/Cmd + E
      if (modifier && e.key === 'e') {
        e.preventDefault()
        if (onExport) {
          onExport()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, onUndo, onRedo, onExport, isMac])

  const handleClearClick = () => {
    setShowClearConfirmation(true)
  }

  const handleConfirmClear = () => {
    if (onClearHistory) {
      onClearHistory()
    }
    setShowClearConfirmation(false)
  }

  const handleCancelClear = () => {
    setShowClearConfirmation(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <div className="toolbar">
        <button
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className={canUndo && !disabled ? 'button button-secondary' : 'button'}
          title={`Undo (${isMac ? 'Cmd' : 'Ctrl'}+Z)`}
          aria-label={`Undo (${isMac ? 'Cmd' : 'Ctrl'}+Z)`}
        >
          <span>↶</span>
          <span className="toolbar__button-text">Undo</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo || disabled}
          className={canRedo && !disabled ? 'button button-secondary' : 'button'}
          title={`Redo (${isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y'})`}
          aria-label={`Redo (${isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y'})`}
        >
          <span>↷</span>
          <span className="toolbar__button-text">Redo</span>
        </button>

        {onClearHistory && (
          <button
            onClick={handleClearClick}
            disabled={(!canUndo && !canRedo) || disabled}
            className="button button-secondary"
            title="Clear history"
            aria-label="Clear history"
          >
            <span>🗑️</span>
            <span className="toolbar__button-text">Clear</span>
          </button>
        )}

        <div className="toolbar__divider" />

        <button
          onClick={onExport}
          disabled={disabled}
          className={!disabled ? 'button button-primary' : 'button'}
          title={`Export (${isMac ? 'Cmd' : 'Ctrl'}+E)`}
          aria-label={`Export image (${isMac ? 'Cmd' : 'Ctrl'}+E)`}
        >
          <span>⬇</span>
          <span className="toolbar__button-text">Export</span>
        </button>

        {onRecord && (
          <>
            <div className="toolbar__divider" />
            <button
              onClick={onRecord}
              disabled={disabled && !isRecording}
              className={`button ${isRecording ? 'button-danger' : 'button-secondary'}`}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              style={{ minWidth: isRecording ? '100px' : 'auto' }}
            >
              <span style={{ 
                color: isRecording ? 'white' : '#ef4444',
                fontSize: '1.2em',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none'
              }}>
                {isRecording ? '⏹' : '●'}
              </span>
              <span className="toolbar__button-text">
                {isRecording ? formatTime(recordingTime) : 'Record'}
              </span>
            </button>
          </>
        )}

        <div className="toolbar__shortcuts">
          Press <kbd className="badge" style={{ padding: '2px 6px' }}>?</kbd> for shortcuts
        </div>
      </div>

      {showClearConfirmation && (
        <div className="history-confirmation-overlay" onClick={handleCancelClear}>
          <div className="history-confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Clear History?</h3>
            <p>This will remove all undo/redo history. Your current state will be kept. This action cannot be undone.</p>
            <div className="history-confirmation-buttons">
              <button
                onClick={handleConfirmClear}
                className="button button-primary"
                aria-label="Confirm clear history"
              >
                Clear History
              </button>
              <button
                onClick={handleCancelClear}
                className="button button-secondary"
                aria-label="Cancel clear history"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
