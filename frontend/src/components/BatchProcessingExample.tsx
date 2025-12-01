/**
 * BatchProcessingExample Component
 * 
 * Example implementation showing how to use all batch processing components together.
 * This demonstrates the complete batch processing workflow:
 * 1. Upload multiple images
 * 2. Preview and manage images
 * 3. Apply batch styling
 * 4. Export with progress tracking
 * 5. View summary
 */

import { useState, useCallback } from 'react'
import { BatchManager } from '../lib/batch/batchManager'
import { BatchStyler } from '../lib/batch/batchStyler'
import { BatchExporter } from '../lib/batch/batchExporter'
import { ProgressTracker, ProgressState } from '../lib/batch/progressTracker'
import { BatchUploadZone } from './BatchUploadZone'
import { BatchPreviewGrid } from './BatchPreviewGrid'
import { BatchControls } from './BatchControls'
import { BatchProgressBar } from './BatchProgressBar'
import { BatchSummary } from './BatchSummary'
import { BatchImage, BatchSummary as BatchSummaryType, BatchStyleSettings } from '../lib/batch/types'
import { StylePreset } from '../lib/canvas/types'

export function BatchProcessingExample() {
  const [batchManager] = useState(() => new BatchManager())
  const [images, setImages] = useState<BatchImage[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressState, setProgressState] = useState<ProgressState | null>(null)
  const [summary, setSummary] = useState<BatchSummaryType | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  
  // Style settings
  const [styleSettings, setStyleSettings] = useState<BatchStyleSettings>({
    sharedCaption: '',
    sharedStyle: {
      preset: 'neon' as StylePreset,
      fontSize: 96,
    },
    allowPerImageCustomization: false,
  })

  // Handle file upload - Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
  const handleFilesAdded = useCallback(async (files: File[]) => {
    const newImages = await batchManager.addFiles(files)
    setImages(batchManager.getImages())
    
    // Show upload summary
    const uploadSummary = batchManager.generateSummary()
    setSummary(uploadSummary)
    setShowSummary(true)
  }, [batchManager])

  // Handle image selection - Requirement 4.2
  const handleSelectImage = useCallback((imageId: string) => {
    setSelectedImageId(imageId === selectedImageId ? null : imageId)
  }, [selectedImageId])

  // Handle image removal - Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
  const handleRemoveImage = useCallback((imageId: string) => {
    batchManager.removeImage(imageId)
    setImages(batchManager.getImages())
    
    // Exit batch mode if all images removed - Requirement 7.4
    if (batchManager.isEmpty()) {
      setSelectedImageId(null)
      setSummary(null)
      setShowSummary(false)
    }
  }, [batchManager])

  // Handle caption change - Requirements: 2.1, 2.2
  const handleApplyCaption = useCallback((caption: string) => {
    setStyleSettings(prev => ({
      ...prev,
      sharedCaption: caption,
    }))
    
    // Apply to all images using BatchStyler
    const styler = new BatchStyler()
    const updatedImages = styler.applyCaption(images, caption)
    setImages(updatedImages)
  }, [images])

  // Handle style change - Requirements: 3.1, 3.2, 3.3
  const handleApplyStyle = useCallback((preset: StylePreset, fontSize: number) => {
    setStyleSettings(prev => ({
      ...prev,
      sharedStyle: { preset, fontSize },
    }))
    
    // Apply to all images using BatchStyler
    const styler = new BatchStyler()
    const updatedImages = styler.applyStyle(images, { preset, fontSize })
    setImages(updatedImages)
  }, [images])

  // Handle export all - Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5
  const handleExportAll = useCallback(async () => {
    setIsProcessing(true)
    setShowSummary(false)
    
    // Create progress tracker
    const tracker = new ProgressTracker({
      total: images.length,
      onProgress: (state) => {
        setProgressState(state)
      },
    })
    
    tracker.start()
    
    try {
      // Mock image processor - in real implementation, this would render the canvas
      const processor = async (image: BatchImage): Promise<HTMLCanvasElement> => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Create a mock canvas
        const canvas = document.createElement('canvas')
        canvas.width = 800
        canvas.height = 600
        return canvas
      }
      
      // Export all images
      const exportResult = await BatchExporter.exportBatch(
        images,
        processor,
        {
          format: 'png',
          quality: 0.92,
        },
        (progress) => {
          tracker.updateCurrent(progress.currentFilename)
          if (progress.currentIndex > tracker.getState().currentIndex) {
            tracker.markSuccess()
          }
        }
      )
      
      tracker.complete()
      
      // Show completion summary - Requirement 6.5
      setSummary(exportResult)
      setShowSummary(true)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [images])

  // Handle cancel - Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
  const handleCancel = useCallback(() => {
    setIsProcessing(false)
    setProgressState(null)
    
    // Show which images were completed - Requirement 8.3
    const cancelSummary = batchManager.generateSummary()
    setSummary(cancelSummary)
    setShowSummary(true)
  }, [batchManager])

  return (
    <div className="batch-processing-example">
      <h2>Batch Processing</h2>
      
      {/* Upload Zone - Requirements: 1.1, 1.2, 1.3, 1.4, 1.5 */}
      <BatchUploadZone
        onFilesAdded={handleFilesAdded}
        disabled={isProcessing}
        currentBatchSize={images.length}
      />
      
      {/* Preview Grid - Requirements: 4.1, 4.2, 4.3, 4.4, 4.5 */}
      {images.length > 0 && (
        <BatchPreviewGrid
          images={images}
          onSelectImage={handleSelectImage}
          onRemoveImage={handleRemoveImage}
          selectedImageId={selectedImageId}
        />
      )}
      
      {/* Batch Controls - Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 5.1, 8.1, 8.2 */}
      {images.length > 0 && (
        <BatchControls
          onApplyCaption={handleApplyCaption}
          onApplyStyle={handleApplyStyle}
          onExportAll={handleExportAll}
          onCancel={handleCancel}
          isProcessing={isProcessing}
          batchSize={images.length}
          currentCaption={styleSettings.sharedCaption || ''}
          currentPreset={styleSettings.sharedStyle?.preset || 'neon'}
          currentFontSize={styleSettings.sharedStyle?.fontSize || 96}
        />
      )}
      
      {/* Progress Bar - Requirements: 6.1, 6.2, 6.3, 6.4, 6.5 */}
      <BatchProgressBar
        progressState={progressState}
        visible={isProcessing}
      />
      
      {/* Summary - Requirements: 1.5, 6.5, 8.3 */}
      <BatchSummary
        summary={summary}
        visible={showSummary}
        onClose={() => setShowSummary(false)}
      />
    </div>
  )
}
