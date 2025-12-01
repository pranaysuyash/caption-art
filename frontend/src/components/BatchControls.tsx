/**
 * BatchControls Component
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 5.1, 8.1, 8.2
 * 
 * Control panel for batch operations that:
 * - Applies same caption to all images (Requirements 2.1, 2.2)
 * - Applies same style to all images (Requirements 3.1, 3.2, 3.3)
 * - Exports all images (Requirement 5.1)
 * - Cancels batch processing (Requirements 8.1, 8.2)
 */

import { StylePreset } from '../lib/canvas/types'

export interface BatchControlsProps {
  onApplyCaption: (caption: string) => void
  onApplyStyle: (preset: StylePreset, fontSize: number) => void
  onExportAll: () => void
  onCancel: () => void
  isProcessing: boolean
  batchSize: number
  currentCaption: string
  currentPreset: StylePreset
  currentFontSize: number
}

/**
 * BatchControls component for batch operations
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 5.1, 8.1, 8.2
 */
export function BatchControls({
  onApplyCaption,
  onApplyStyle,
  onExportAll,
  onCancel,
  isProcessing,
  batchSize,
  currentCaption,
  currentPreset,
  currentFontSize,
}: BatchControlsProps) {
  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Requirement 2.2: Update all images immediately when caption changes
    onApplyCaption(e.target.value)
  }

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value)
    // Requirement 3.2: Update all images with new font size
    onApplyStyle(currentPreset, newSize)
  }

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPreset = e.target.value as StylePreset
    // Requirement 3.1: Apply style preset to all images
    onApplyStyle(newPreset, currentFontSize)
  }

  return (
    <div className="batch-controls">
      <div className="batch-controls-header">
        <h3>Batch Controls</h3>
        <span className="badge badge-turquoise">{batchSize} images</span>
      </div>

      {/* Caption Control - Requirements: 2.1, 2.2 */}
      <div className="batch-control-group">
        <label htmlFor="batch-caption">
          Caption (applies to all images)
        </label>
        <input
          id="batch-caption"
          type="text"
          className="input"
          placeholder="Enter caption for all images"
          value={currentCaption}
          onChange={handleCaptionChange}
          disabled={isProcessing}
        />
      </div>

      {/* Style Controls - Requirements: 3.1, 3.2, 3.3 */}
      <div className="batch-control-group">
        <label htmlFor="batch-preset">Style Preset</label>
        <select
          id="batch-preset"
          className="input"
          value={currentPreset}
          onChange={handlePresetChange}
          disabled={isProcessing}
        >
          <option value="neon">Neon</option>
          <option value="retro">Retro</option>
          <option value="minimal">Minimal</option>
          <option value="bold">Bold</option>
          <option value="elegant">Elegant</option>
        </select>
      </div>

      <div className="batch-control-group">
        <label htmlFor="batch-font-size">
          Font Size: {currentFontSize}px
        </label>
        <input
          id="batch-font-size"
          type="range"
          className="input"
          min={24}
          max={160}
          value={currentFontSize}
          onChange={handleFontSizeChange}
          disabled={isProcessing}
        />
      </div>

      {/* Action Buttons */}
      <div className="batch-control-actions">
        {/* Export Button - Requirement 5.1 */}
        <button
          className="button button-primary"
          onClick={onExportAll}
          disabled={isProcessing || batchSize === 0}
          aria-label={isProcessing ? 'Processing batch export' : `Export all ${batchSize} images`}
          aria-busy={isProcessing}
        >
          {isProcessing ? '⏳ Processing...' : '📦 Export All'}
        </button>

        {/* Cancel Button - Requirements: 8.1, 8.2 */}
        {isProcessing && (
          <button
            className="button button-secondary"
            onClick={onCancel}
            aria-label="Cancel batch processing"
          >
            ❌ Cancel
          </button>
        )}
      </div>
    </div>
  )
}
