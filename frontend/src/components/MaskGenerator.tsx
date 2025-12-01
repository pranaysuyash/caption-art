/**
 * MaskGenerator Component
 * Requirements: 1.5, 3.3, 5.1, 5.2, 5.3, 5.4
 * 
 * Main UI component for mask generation that:
 * - Renders mask generation UI
 * - Shows loading state during generation
 * - Displays error messages
 * - Shows quality indicator
 */

import { useState, useEffect } from 'react'
import { backendClient } from '../lib/api/backendClient'
import { MaskResult } from '../lib/segmentation/types'
import { MaskPreview } from './MaskPreview'

export interface MaskGeneratorProps {
  imageDataUrl: string | null
  onMaskGenerated: (result: MaskResult | null) => void
  autoGenerate?: boolean
  onLoadingChange?: (loading: boolean) => void // Requirements: 10.2
  onErrorChange?: (error: string | undefined) => void // Requirements: 10.5
}

/**
 * MaskGenerator component for displaying mask generation UI
 * Requirements: 1.5, 3.3, 5.1, 5.2, 5.3, 5.4
 */
export function MaskGenerator({
  imageDataUrl,
  onMaskGenerated,
  autoGenerate = true,
  onLoadingChange,
  onErrorChange
}: MaskGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MaskResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [previewEnabled, setPreviewEnabled] = useState(false)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)

  // Load original image when imageDataUrl changes
  useEffect(() => {
    if (!imageDataUrl) {
      setOriginalImage(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setOriginalImage(img)
    img.src = imageDataUrl
  }, [imageDataUrl])

  // Generate mask when image changes
  useEffect(() => {
    if (!imageDataUrl || !autoGenerate) {
      setResult(null)
      setError(null)
      setProgress(0)
      onMaskGenerated(null)
      return
    }

    const generateMask = async () => {
      setLoading(true)
      onLoadingChange?.(true) // Requirements: 10.2
      setError(null)
      onErrorChange?.(undefined) // Requirements: 10.5
      setProgress(0)

      try {
        // Simulate progress updates - Requirements: 3.3
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 90))
        }, 1000)

        // Call backend API instead of Replicate directly
        const response = await backendClient.generateMask(imageDataUrl)
        
        // Create mask image element
        const maskImage = new Image()
        maskImage.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          maskImage.onload = resolve
          maskImage.onerror = reject
          maskImage.src = response.maskUrl
        })
        
        const maskResult: MaskResult = {
          maskUrl: response.maskUrl,
          maskImage,
          generationTime: 0, // Backend doesn't return this yet
          quality: 'high' // Default quality
        }
        
        clearInterval(progressInterval)
        setProgress(100)
        setResult(maskResult)
        onMaskGenerated(maskResult)
      } catch (err) {
        // User-friendly error messages - Requirements: 5.1, 5.2, 5.3, 5.4
        let errorMessage = 'Mask generation failed. Please try again.'
        
        if (err instanceof Error) {
          const message = err.message.toLowerCase()
          
          if (message.includes('network') || message.includes('connection')) {
            errorMessage = 'Unable to connect to mask service. Please check your connection.'
          } else if (message.includes('timeout')) {
            errorMessage = 'Mask generation timed out. Please try again.'
          } else if (message.includes('rate limit')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.'
          } else if (message.includes('no subject')) {
            errorMessage = 'No subject detected. Text will appear on top of image.'
          } else if (message.includes('invalid')) {
            errorMessage = 'Invalid image format. Please use JPG or PNG.'
          } else {
            errorMessage = err.message
          }
        }
        
        setError(errorMessage)
        onErrorChange?.(errorMessage) // Requirements: 10.5
        onMaskGenerated(null)
      } finally {
        setLoading(false)
        onLoadingChange?.(false) // Requirements: 10.2
        setTimeout(() => setProgress(0), 500)
      }
    }

    generateMask()
  }, [imageDataUrl, onMaskGenerated, autoGenerate, onLoadingChange, onErrorChange])

  // Don't render if no image
  if (!imageDataUrl) {
    return null
  }

  return (
    <div className="mask-generator">
      {/* Loading state - Requirements: 3.3 */}
      {loading && (
        <div className="mask-loading" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true">🎭</div>
          <div className="loading-text">
            {progress < 30 ? 'Analyzing image...' : 
             progress < 60 ? 'Detecting subject...' : 
             'Generating mask...'}
          </div>
          {progress > 0 && (
            <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Mask generation progress: ${progress}%`}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Error state - Requirements: 5.1, 5.2, 5.3, 5.4 */}
      {error && (
        <div className="mask-error" role="alert" aria-live="assertive">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {/* Success state with quality indicator - Requirements: 1.5 */}
      {result && !loading && (
        <div className="mask-success">
          <div className="mask-status">
            <span className="success-icon" aria-hidden="true">✓</span>
            <span className="success-message">Mask generated successfully</span>
          </div>
          
          {/* Quality indicator - Requirements: 1.5 */}
          <div className="mask-quality">
            <span className="quality-label">Quality:</span>
            <span className={`quality-badge quality-${result.quality}`}>
              {result.quality.toUpperCase()}
            </span>
          </div>
          
          <div className="generation-time">
            Generated in {(result.generationTime / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      {/* Before/After Slider Preview - Requirements: 4.1, 4.2, 4.3, 4.4 */}
      <MaskPreview
        originalImage={originalImage}
        maskImage={result?.maskImage || null}
        enabled={previewEnabled}
        onToggle={setPreviewEnabled}
      />
    </div>
  )
}
