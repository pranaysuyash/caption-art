/**
 * BatchPreviewGrid Component
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * Grid layout component for displaying batch images that:
 * - Displays all images in a responsive grid (Requirement 4.1)
 * - Shows larger preview when an image is selected (Requirement 4.2)
 * - Shows image details on hover (Requirement 4.3)
 * - Renders thumbnails for performance (Requirement 4.4)
 * - Allows editing individual images (Requirement 4.5)
 */

import { useState } from 'react'
import { BatchImage } from '../lib/batch/types'

export interface BatchPreviewGridProps {
  images: BatchImage[]
  onSelectImage: (imageId: string) => void
  onRemoveImage: (imageId: string) => void
  selectedImageId?: string | null
}

/**
 * BatchPreviewGrid component for displaying batch images
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function BatchPreviewGrid({
  images,
  onSelectImage,
  onRemoveImage,
  selectedImageId = null,
}: BatchPreviewGridProps) {
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null)

  // Don't render if no images
  if (images.length === 0) {
    return null
  }

  // Get hovered image details for tooltip - Requirement 4.3
  const hoveredImage = images.find(img => img.id === hoveredImageId)

  // Format file size for display - Requirement 4.3
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="batch-preview-container">
      {/* Grid of thumbnails - Requirements: 4.1, 4.4 */}
      <div className="batch-preview-grid">
        {images.map((image) => {
          const isSelected = image.id === selectedImageId
          const isInvalid = image.status === 'invalid'

          return (
            <div
              key={image.id}
              className={`batch-preview-item ${isSelected ? 'selected' : ''} ${isInvalid ? 'invalid' : ''}`}
              onClick={() => !isInvalid && onSelectImage(image.id)}
              onMouseEnter={() => setHoveredImageId(image.id)}
              onMouseLeave={() => setHoveredImageId(null)}
              role="button"
              tabIndex={0}
              aria-label={`${isInvalid ? 'Invalid' : 'Select'} image ${image.file.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  !isInvalid && onSelectImage(image.id)
                }
              }}
            >
              {/* Thumbnail image - Requirement 4.4 */}
              <img
                src={image.thumbnail}
                alt={image.file.name}
                className="batch-preview-thumbnail"
              />

              {/* Status indicator */}
              {isInvalid && (
                <div className="batch-preview-status invalid">
                  <span>❌</span>
                </div>
              )}

              {isSelected && (
                <div className="batch-preview-status selected">
                  <span>✓</span>
                </div>
              )}

              {/* Remove button - Requirement 4.5 */}
              <button
                className="batch-preview-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveImage(image.id)
                }}
                aria-label={`Remove ${image.file.name}`}
                title="Remove image"
              >
                ×
              </button>

              {/* Hover tooltip with image details - Requirement 4.3 */}
              {hoveredImageId === image.id && (
                <div className="batch-preview-tooltip">
                  <div className="tooltip-filename">{image.file.name}</div>
                  <div className="tooltip-details">
                    {formatFileSize(image.file.size)}
                    {image.validationResult?.fileType && (
                      <> • {image.validationResult.fileType}</>
                    )}
                  </div>
                  {isInvalid && image.error && (
                    <div className="tooltip-error">{image.error}</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Larger preview of selected image - Requirement 4.2 */}
      {selectedImageId && (
        <div className="batch-preview-large">
          {(() => {
            const selectedImage = images.find(img => img.id === selectedImageId)
            if (!selectedImage) return null

            return (
              <>
                <div className="batch-preview-large-header">
                  <h3>Selected Image</h3>
                  <button
                    className="button button-secondary"
                    onClick={() => onSelectImage('')}
                    aria-label="Close preview"
                  >
                    Close Preview
                  </button>
                </div>
                <div className="batch-preview-large-content">
                  <img
                    src={selectedImage.thumbnail}
                    alt={selectedImage.file.name}
                    className="batch-preview-large-image"
                  />
                  <div className="batch-preview-large-details">
                    <div className="detail-row">
                      <span className="detail-label">Filename:</span>
                      <span className="detail-value">{selectedImage.file.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Size:</span>
                      <span className="detail-value">{formatFileSize(selectedImage.file.size)}</span>
                    </div>
                    {selectedImage.validationResult?.fileType && (
                      <div className="detail-row">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{selectedImage.validationResult.fileType}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className={`detail-value status-${selectedImage.status}`}>
                        {selectedImage.status}
                      </span>
                    </div>
                    {selectedImage.caption && (
                      <div className="detail-row">
                        <span className="detail-label">Caption:</span>
                        <span className="detail-value">{selectedImage.caption}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
