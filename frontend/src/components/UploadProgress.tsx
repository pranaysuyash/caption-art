/**
 * UploadProgress Component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Progress indicator for file upload that:
 * - Displays a progress indicator (Requirement 6.1)
 * - Updates progress percentage (Requirement 6.2)
 * - Shows "Validating..." status (Requirement 6.3)
 * - Shows "Optimizing..." status (Requirement 6.4)
 * - Shows "Complete" status and hides indicator (Requirement 6.5)
 */

export interface UploadProgressProps {
  visible: boolean
  progress: number
  status: 'validating' | 'processing' | 'optimizing' | 'complete' | 'error'
  filename?: string
  error?: string
}

/**
 * UploadProgress component for displaying upload progress
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function UploadProgress({
  visible,
  progress,
  status,
  filename,
  error
}: UploadProgressProps) {
  // Hide when not visible or complete - Requirement 6.5
  if (!visible || status === 'complete') {
    return null
  }

  // Get status message - Requirements: 6.3, 6.4
  const getStatusMessage = () => {
    switch (status) {
      case 'validating':
        return 'Validating...'
      case 'processing':
        return 'Processing...'
      case 'optimizing':
        return 'Optimizing...'
      case 'error':
        return error || 'Error occurred'
      default:
        return 'Processing...'
    }
  }

  return (
    <div className="upload-progress-container">
      {/* Progress Header - Requirement 6.2 */}
      <div className="upload-progress-header">
        <span className="upload-progress-status">{getStatusMessage()}</span>
        <span className="upload-progress-percentage">{progress}%</span>
      </div>

      {/* Progress Bar - Requirement 6.1 */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Upload progress: ${progress}%`}
        />
      </div>

      {/* Filename */}
      {filename && (
        <div className="upload-progress-filename">
          {filename}
        </div>
      )}

      {/* Error message */}
      {status === 'error' && error && (
        <div className="upload-progress-error">
          {error}
        </div>
      )}
    </div>
  )
}
