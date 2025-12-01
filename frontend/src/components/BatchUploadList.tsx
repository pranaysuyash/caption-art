/**
 * BatchUploadList Component
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * Batch upload list component that:
 * - Displays list of uploaded files (Requirement 7.1, 7.2)
 * - Shows status for each file (Requirement 7.2)
 * - Shows success/failure summary (Requirement 7.4)
 * - Continues processing even if one file fails (Requirement 7.3)
 */

import type { BatchFileResult } from '../lib/upload/batchUploader'

export interface BatchUploadListProps {
  results: BatchFileResult[]
  successCount: number
  failureCount: number
  totalProcessed: number
  isProcessing?: boolean
}

/**
 * BatchUploadList component for displaying batch upload results
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function BatchUploadList({
  results,
  successCount,
  failureCount,
  totalProcessed,
  isProcessing = false
}: BatchUploadListProps) {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Get status icon
  const getStatusIcon = (success: boolean): string => {
    return success ? '✓' : '✗'
  }

  // Get status class
  const getStatusClass = (success: boolean): string => {
    return success ? 'success' : 'error'
  }

  return (
    <div className="batch-upload-list">
      {/* Summary Header - Requirement 7.4 */}
      <div className="batch-upload-summary">
        <h3>Upload Results</h3>
        <div className="batch-upload-summary-stats">
          <div className="batch-upload-summary-stat success">
            <span className="batch-upload-summary-icon" aria-hidden="true">✓</span>
            <span className="batch-upload-summary-text">
              {successCount} successful
            </span>
          </div>
          {failureCount > 0 && (
            <div className="batch-upload-summary-stat error">
              <span className="batch-upload-summary-icon" aria-hidden="true">✗</span>
              <span className="batch-upload-summary-text">
                {failureCount} failed
              </span>
            </div>
          )}
          <div className="batch-upload-summary-stat">
            <span className="batch-upload-summary-text">
              {totalProcessed} total
            </span>
          </div>
        </div>
      </div>

      {/* File List - Requirements: 7.1, 7.2 */}
      <div className="batch-upload-items">
        {results.map((result, index) => (
          <div
            key={index}
            className={`batch-upload-item ${getStatusClass(result.success)}`}
          >
            {/* Status Icon */}
            <div className={`batch-upload-item-status ${getStatusClass(result.success)}`}>
              {getStatusIcon(result.success)}
            </div>

            {/* File Info */}
            <div className="batch-upload-item-info">
              <div className="batch-upload-item-name">{result.file.name}</div>
              <div className="batch-upload-item-details">
                <span className="batch-upload-item-size">
                  {formatFileSize(result.file.size)}
                </span>
                {result.optimizationResult && (
                  <>
                    <span className="batch-upload-item-separator">→</span>
                    <span className="batch-upload-item-optimized">
                      {formatFileSize(result.optimizationResult.optimizedSize)}
                    </span>
                  </>
                )}
              </div>
              {/* Error Message - Requirement 7.3 */}
              {!result.success && result.error && (
                <div className="batch-upload-item-error">
                  {result.error}
                </div>
              )}
            </div>

            {/* Dimensions */}
            {result.optimizationResult && (
              <div className="batch-upload-item-dimensions">
                {result.optimizationResult.dimensions.width} ×{' '}
                {result.optimizationResult.dimensions.height}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="batch-upload-processing" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true">⏳</div>
          <span>Processing files...</span>
        </div>
      )}
    </div>
  )
}
