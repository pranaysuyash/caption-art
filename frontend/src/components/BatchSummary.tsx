/**
 * BatchSummary Component
 * Requirements: 1.5, 6.5, 8.3
 * 
 * Summary display for batch operations that:
 * - Displays summary of successful and failed uploads (Requirement 1.5)
 * - Displays completion summary (Requirement 6.5)
 * - Shows which images were completed when cancelled (Requirement 8.3)
 */

import { BatchSummary as BatchSummaryType } from '../lib/batch/types'

export interface BatchSummaryProps {
  summary: BatchSummaryType | null
  visible: boolean
  onClose?: () => void
  title?: string
}

/**
 * BatchSummary component for displaying batch operation results
 * Requirements: 1.5, 6.5, 8.3
 */
export function BatchSummary({
  summary,
  visible,
  onClose,
  title = 'Batch Summary',
}: BatchSummaryProps) {
  if (!visible || !summary) {
    return null
  }

  const { total, successful, failed, failedImages } = summary
  const hasFailures = failed > 0

  return (
    <div className="batch-summary">
      <div className="batch-summary-header">
        <h3>{title}</h3>
        {onClose && (
          <button
            className="button button-secondary"
            onClick={onClose}
            aria-label="Close summary"
          >
            ×
          </button>
        )}
      </div>

      {/* Summary Stats - Requirements: 1.5, 6.5 */}
      <div className="batch-summary-stats">
        <div className="batch-summary-stat">
          <span className="batch-summary-stat-label">Total:</span>
          <span className="batch-summary-stat-value">{total}</span>
        </div>
        <div className="batch-summary-stat success">
          <span className="batch-summary-stat-label">Successful:</span>
          <span className="batch-summary-stat-value">{successful}</span>
        </div>
        {hasFailures && (
          <div className="batch-summary-stat error">
            <span className="batch-summary-stat-label">Failed:</span>
            <span className="batch-summary-stat-value">{failed}</span>
          </div>
        )}
      </div>

      {/* Failed Images List - Requirements: 1.5, 8.3 */}
      {hasFailures && failedImages.length > 0 && (
        <div className="batch-summary-failures">
          <h4>Failed Images:</h4>
          <ul className="batch-summary-failure-list">
            {failedImages.map((failedImage, index) => (
              <li key={index} className="batch-summary-failure-item">
                <span className="batch-summary-failure-filename">
                  {failedImage.filename}
                </span>
                <span className="batch-summary-failure-error">
                  {failedImage.error}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {!hasFailures && (
        <div className="batch-summary-success">
          <span className="batch-summary-success-icon" aria-hidden="true">🎉</span>
          <span className="batch-summary-success-text">
            All images processed successfully!
          </span>
        </div>
      )}
    </div>
  )
}
