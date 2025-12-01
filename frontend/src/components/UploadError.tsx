/**
 * UploadError Component
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * Displays clear error messages for upload failures:
 * - Invalid file types (Requirement 8.1)
 * - Oversized files (Requirement 8.2)
 * - Corrupted images (Requirement 8.3)
 * - Too many files (Requirement 8.4)
 * - Unknown errors with retry option (Requirement 8.5)
 */

export interface UploadErrorProps {
  error: string
  filename?: string
  fileSize?: number
  onRetry?: () => void
  onDismiss?: () => void
}

/**
 * UploadError component for displaying upload error messages
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export function UploadError({ 
  error, 
  filename, 
  fileSize,
  onRetry, 
  onDismiss 
}: UploadErrorProps) {
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Determine error type and provide additional context
  const getErrorDetails = (): string | null => {
    // Requirement 8.2: Show file size for oversized files
    if (error.includes('too large') && fileSize) {
      return `File size: ${formatFileSize(fileSize)} (Maximum: 10MB)`
    }
    
    // Requirement 8.1: Show filename for invalid types
    if (error.includes('Unsupported file type') && filename) {
      return `File: ${filename}`
    }
    
    // Requirement 8.4: Show count for too many files
    if (error.includes('Too many files')) {
      return 'Please select 10 or fewer files'
    }
    
    return null
  }

  const errorDetails = getErrorDetails()

  return (
    <div className="upload-error" role="alert" aria-live="assertive">
      <div className="upload-error-icon" aria-hidden="true">
        ⚠️
      </div>
      <div className="upload-error-content">
        <div className="upload-error-title">Upload Failed</div>
        <div className="upload-error-message">{error}</div>
        {errorDetails && (
          <div className="upload-error-details">{errorDetails}</div>
        )}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
          {/* Requirement 8.5: Provide retry option for unknown errors */}
          {onRetry && (
            <button
              className="button button-secondary"
              onClick={onRetry}
              aria-label="Retry upload"
              style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              className="button"
              onClick={onDismiss}
              aria-label="Dismiss error message"
              style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
