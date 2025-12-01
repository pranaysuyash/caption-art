/**
 * BatchProgressBar Component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Progress bar for batch operations that:
 * - Displays a progress bar (Requirement 6.1)
 * - Updates progress percentage (Requirement 6.2)
 * - Shows which image is currently being processed (Requirement 6.3)
 * - Estimates time remaining (Requirement 6.4)
 * - Displays completion summary (Requirement 6.5)
 */

import { ProgressState, ProgressTracker } from '../lib/batch/progressTracker'

export interface BatchProgressBarProps {
  progressState: ProgressState | null
  visible: boolean
}

/**
 * BatchProgressBar component for displaying batch processing progress
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function BatchProgressBar({
  progressState,
  visible,
}: BatchProgressBarProps) {
  if (!visible || !progressState) {
    return null
  }

  const {
    currentIndex,
    total,
    successful,
    failed,
    currentFilename,
    percentage,
    estimatedTimeRemaining,
    isComplete,
  } = progressState

  return (
    <div className="batch-progress">
      {/* Progress Header - Requirement 6.2 */}
      <div className="batch-progress-header">
        <h3>
          {isComplete ? '✅ Batch Complete' : '⏳ Processing Batch'}
        </h3>
        <span className="batch-progress-percentage">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar - Requirement 6.1 */}
      <div className="batch-progress-bar-container">
        <div
          className="batch-progress-bar-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Processing progress: ${percentage}%`}
        />
      </div>

      {/* Current Status - Requirement 6.3 */}
      {!isComplete && currentFilename && (
        <div className="batch-progress-current">
          <span className="batch-progress-label">Processing:</span>
          <span className="batch-progress-filename">{currentFilename}</span>
        </div>
      )}

      {/* Progress Details */}
      <div className="batch-progress-details">
        <div className="batch-progress-detail">
          <span className="batch-progress-label">Progress:</span>
          <span className="batch-progress-value">
            {currentIndex} / {total} images
          </span>
        </div>

        {/* Time Remaining - Requirement 6.4 */}
        {!isComplete && estimatedTimeRemaining > 0 && (
          <div className="batch-progress-detail">
            <span className="batch-progress-label">Time remaining:</span>
            <span className="batch-progress-value">
              {ProgressTracker.formatTime(estimatedTimeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Completion Summary - Requirement 6.5 */}
      {isComplete && (
        <div className="batch-progress-summary">
          <div className="batch-progress-summary-item success">
            <span className="batch-progress-summary-icon" aria-hidden="true">✓</span>
            <span className="batch-progress-summary-text">
              {successful} successful
            </span>
          </div>
          {failed > 0 && (
            <div className="batch-progress-summary-item error">
              <span className="batch-progress-summary-icon" aria-hidden="true">✗</span>
              <span className="batch-progress-summary-text">
                {failed} failed
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
