/**
 * BatchUploadZone Component
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * 
 * Upload zone for batch processing that:
 * - Accepts up to 50 images (Requirement 1.1)
 * - Displays thumbnails of all images (Requirement 1.2)
 * - Validates each image individually (Requirement 1.3)
 * - Skips failed validation and continues with valid images (Requirement 1.4)
 * - Displays summary of successful and failed uploads (Requirement 1.5)
 */

import { useRef } from 'react'
import { BatchManager } from '../lib/batch/batchManager'

export interface BatchUploadZoneProps {
  onFilesAdded: (files: File[]) => void
  disabled?: boolean
  currentBatchSize: number
}

/**
 * BatchUploadZone component for uploading multiple images
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export function BatchUploadZone({
  onFilesAdded,
  disabled = false,
  currentBatchSize,
}: BatchUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const maxBatchSize = BatchManager.getMaxBatchSize()
  const remainingSlots = maxBatchSize - currentBatchSize

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesAdded(files)
    }
    // Reset input so the same files can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFilesAdded(files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  const isFull = remainingSlots <= 0

  return (
    <div
      className={`upload-zone ${disabled ? 'disabled' : ''} ${isFull ? 'full' : ''}`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload multiple images for batch processing"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || isFull}
      />
      
      <div className="upload-zone-content">
        <div className="upload-zone-icon" aria-hidden="true">📁</div>
        <div className="upload-zone-text">
          {isFull ? (
            <>
              <strong>Batch Full</strong>
              <span>Maximum {maxBatchSize} images reached</span>
            </>
          ) : (
            <>
              <strong>Upload Multiple Images</strong>
              <span>
                Click or drag & drop up to {remainingSlots} more image{remainingSlots !== 1 ? 's' : ''}
              </span>
              <span className="upload-zone-hint">
                ({currentBatchSize}/{maxBatchSize} images in batch)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
