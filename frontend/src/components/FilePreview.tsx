/**
 * FilePreview Component
 * Requirements: 4.5
 * 
 * File preview component that:
 * - Displays image thumbnail
 * - Shows file details (name, size, type)
 * - Shows optimization results (original size, optimized size, savings)
 */

export interface FilePreviewProps {
  file: File
  imageUrl: string
  originalSize?: number
  optimizedSize?: number
  dimensions?: { width: number; height: number }
  onRemove?: () => void
}

/**
 * FilePreview component for displaying uploaded file information
 * Requirements: 4.5
 */
export function FilePreview({
  file,
  imageUrl,
  originalSize,
  optimizedSize,
  dimensions,
  onRemove
}: FilePreviewProps) {
  // Format file size in human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Calculate size savings
  const calculateSavings = (): string | null => {
    if (!originalSize || !optimizedSize) return null
    const savings = originalSize - optimizedSize
    const percentage = Math.round((savings / originalSize) * 100)
    return `${percentage}% (${formatFileSize(savings)} saved)`
  }

  const savings = calculateSavings()

  return (
    <div className="file-preview">
      {/* Thumbnail */}
      <div className="file-preview-thumbnail">
        <img src={imageUrl} alt={file.name} />
      </div>

      {/* File Details */}
      <div className="file-preview-details">
        <div className="file-preview-header">
          <h4 className="file-preview-name">{file.name}</h4>
          {onRemove && (
            <button
              className="button button-secondary file-preview-remove"
              onClick={onRemove}
              aria-label="Remove file"
            >
              ✕
            </button>
          )}
        </div>

        <div className="file-preview-info">
          <div className="file-preview-info-item">
            <span className="file-preview-label">Type:</span>
            <span className="file-preview-value">{file.type}</span>
          </div>

          <div className="file-preview-info-item">
            <span className="file-preview-label">Original Size:</span>
            <span className="file-preview-value">
              {formatFileSize(originalSize || file.size)}
            </span>
          </div>

          {optimizedSize && (
            <div className="file-preview-info-item">
              <span className="file-preview-label">Optimized Size:</span>
              <span className="file-preview-value">
                {formatFileSize(optimizedSize)}
              </span>
            </div>
          )}

          {savings && (
            <div className="file-preview-info-item">
              <span className="file-preview-label">Savings:</span>
              <span className="file-preview-value file-preview-savings">
                {savings}
              </span>
            </div>
          )}

          {dimensions && (
            <div className="file-preview-info-item">
              <span className="file-preview-label">Dimensions:</span>
              <span className="file-preview-value">
                {dimensions.width} × {dimensions.height}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
