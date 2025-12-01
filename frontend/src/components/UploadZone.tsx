/**
 * UploadZone Component
 * Requirements: 1.1, 1.2, 1.3
 * 
 * Drag-and-drop file upload component that:
 * - Opens file picker on click (Requirement 1.1)
 * - Highlights zone with visual feedback on drag-over (Requirement 1.2)
 * - Accepts file on drop (Requirement 1.3)
 * - Connects to upload handlers
 */

import { useState, useRef, useEffect } from 'react'
import { createDragDropHandler } from '../lib/upload/dragDropHandler'
import { UploadError } from './UploadError'

export interface UploadZoneProps {
  onFile: (file: File) => void
  onFiles?: (files: File[]) => void
  loading?: boolean
  currentFile?: File | null
  imageObjUrl?: string
  multiple?: boolean
  disabled?: boolean
  error?: string
  onRetry?: () => void
  onDismissError?: () => void
}

/**
 * UploadZone component for drag-and-drop file upload
 * Requirements: 1.1, 1.2, 1.3
 */
export function UploadZone({ 
  onFile, 
  onFiles,
  loading = false, 
  currentFile = null, 
  imageObjUrl,
  multiple = false,
  disabled = false,
  error,
  onRetry,
  onDismissError
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)

  // Set up drag-and-drop handler - Requirements: 1.2, 1.3
  useEffect(() => {
    if (!zoneRef.current || disabled) return

    const handler = createDragDropHandler(zoneRef.current, {
      onDragOver: () => setIsDragging(true),
      onDragLeave: () => setIsDragging(false),
      onDrop: (files) => {
        setIsDragging(false)
        if (files.length > 0) {
          if (multiple && onFiles) {
            onFiles(files)
          } else {
            onFile(files[0])
          }
        }
      }
    })

    return () => handler.destroy()
  }, [onFile, onFiles, multiple, disabled])

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (multiple && onFiles) {
        onFiles(Array.from(files))
      } else {
        onFile(files[0])
      }
    }
  }

  // Handle click to open file picker - Requirement 1.1
  const handleClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click()
    }
  }

  // Handle keyboard events for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
      e.preventDefault()
      handleClick()
    }
  }

  // Handle remove
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Note: Parent component should handle clearing the image state
  }

  return (
    <div
      ref={zoneRef}
      className={`upload-zone ${isDragging ? 'dragging' : ''} ${currentFile ? 'has-file' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={currentFile ? 'Change uploaded image' : 'Upload image'}
      aria-disabled={disabled || loading}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || loading}
      />

      {/* Loading state */}
      {loading && (
        <div className="upload-loading" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true">⏳</div>
          <div className="loading-text">Processing image...</div>
        </div>
      )}

      {/* Preview state */}
      {currentFile && imageObjUrl && !loading && (
        <div className="upload-preview">
          <img src={imageObjUrl} alt="Uploaded preview" className="preview-image" />
          <button
            className="button button-secondary remove-button"
            onClick={handleRemove}
            aria-label="Remove image"
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Empty state - Requirement 1.1, 1.2 */}
      {!currentFile && !loading && (
        <div className="upload-empty">
          <div className="upload-icon" aria-hidden="true">📁</div>
          <div className="upload-text">
            <strong>Drop an image here</strong> or click to browse
          </div>
          <div className="upload-hint">JPG, PNG, WebP supported (max 10MB)</div>
        </div>
      )}

      {/* Error display - Requirements: 8.1, 8.2, 8.3, 8.4, 8.5 */}
      {error && (
        <UploadError
          error={error}
          filename={currentFile?.name}
          fileSize={currentFile?.size}
          onRetry={onRetry}
          onDismiss={onDismissError}
        />
      )}
    </div>
  )
}
