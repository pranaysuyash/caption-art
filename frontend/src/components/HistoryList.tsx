/**
 * HistoryList Component
 * Displays a list of recent actions with the ability to jump to any state
 * Requirements: 3.1, 3.3, 3.4, 3.5
 */

import { HistoryEntry } from '../lib/history/types'

export interface HistoryListProps {
  /** Array of history entries to display */
  history: HistoryEntry[]
  /** ID of the current state */
  currentStateId?: string
  /** Callback when a history entry is clicked */
  onJumpTo: (entryId: string) => void
  /** Maximum number of entries to display */
  maxEntries?: number
  /** Additional CSS class name */
  className?: string
}

/**
 * HistoryList component displays a list of recent actions.
 * The current state is highlighted, and clicking an entry jumps to that state.
 */
export function HistoryList({
  history,
  currentStateId,
  onJumpTo,
  maxEntries = 20,
  className = ''
}: HistoryListProps) {
  // Requirement 3.1: Display list of recent actions
  // Show most recent entries first
  const displayedHistory = [...history].reverse().slice(0, maxEntries)

  // Format timestamp for display
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  if (displayedHistory.length === 0) {
    return (
      <div className={`history-list ${className}`}>
        <div className="history-list__empty">No history yet</div>
      </div>
    )
  }

  return (
    <div className={`history-list ${className}`}>
      <div className="history-list__header">History</div>
      <ul className="history-list__items">
        {displayedHistory.map((entry) => {
          // Requirement 3.4: Highlight current state
          const isCurrent = entry.id === currentStateId
          const itemClass = isCurrent
            ? 'history-list__item history-list__item--current'
            : 'history-list__item'

          return (
            <li key={entry.id} className={itemClass}>
              {/* Requirement 3.5: Allow clicking to jump to state */}
              <button
                className="history-list__button"
                onClick={() => onJumpTo(entry.id)}
                disabled={isCurrent}
                aria-label={`Jump to ${entry.action}`}
              >
                <span className="history-list__action">{entry.action}</span>
                <span className="history-list__time">{formatTime(entry.timestamp)}</span>
                {isCurrent && (
                  <span className="history-list__current-badge">Current</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
