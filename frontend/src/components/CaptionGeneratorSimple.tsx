/**
 * CaptionGenerator Component (Backend Version)
 * Uses backend API instead of direct API calls
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2
 */

import { useState, useEffect } from 'react'
import { captionClient } from '../lib/api/captionClient'
import { CaptionGrid } from './CaptionGrid'
import { RegenerateButton } from './RegenerateButton'

export interface CaptionGeneratorProps {
  imageDataUrl: string | null
  onCaptionSelect: (caption: string) => void
  onLoadingChange?: (loading: boolean) => void // Requirements: 10.3
  onErrorChange?: (error: string | undefined) => void // Requirements: 10.5
}

export function CaptionGenerator({
  imageDataUrl,
  onCaptionSelect,
  onLoadingChange,
  onErrorChange
}: CaptionGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [baseCaption, setBaseCaption] = useState<string>('')
  const [variants, setVariants] = useState<string[]>([])
  const [generationTime, setGenerationTime] = useState<number>(0)
  const [progress, setProgress] = useState(0)
  const [showAll, setShowAll] = useState(false)

  // Generate captions when image changes
  useEffect(() => {
    if (!imageDataUrl) {
      setBaseCaption('')
      setVariants([])
      setError(null)
      setProgress(0)
      setShowAll(false)
      return
    }

    const generateCaptions = async () => {
      setLoading(true)
      onLoadingChange?.(true) // Requirements: 10.3
      setError(null)
      onErrorChange?.(undefined) // Requirements: 10.5
      setProgress(0)
      setShowAll(false) // Reset showAll when generating new captions

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90))
        }, 500)

        const result = await captionClient.generate(imageDataUrl)
        
        clearInterval(progressInterval)
        setProgress(100)
        setBaseCaption(result.baseCaption)
        setVariants(result.variants)
        setGenerationTime(result.generationTime)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Caption generation failed'
        setError(errorMsg)
        onErrorChange?.(errorMsg) // Requirements: 10.5
      } finally {
        setLoading(false)
        onLoadingChange?.(false) // Requirements: 10.3
        setTimeout(() => setProgress(0), 500)
      }
    }

    generateCaptions()
  }, [imageDataUrl])

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!imageDataUrl) return

    setLoading(true)
    onLoadingChange?.(true) // Requirements: 10.3
    setError(null)
    onErrorChange?.(undefined) // Requirements: 10.5
    setProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const result = await captionClient.generate(imageDataUrl)
      
      clearInterval(progressInterval)
      setProgress(100)
      setBaseCaption(result.baseCaption)
      setVariants(result.variants)
      setGenerationTime(result.generationTime)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Caption regeneration failed'
      setError(errorMsg)
      onErrorChange?.(errorMsg) // Requirements: 10.5
    } finally {
      setLoading(false)
      onLoadingChange?.(false) // Requirements: 10.3
      setTimeout(() => setProgress(0), 500)
    }
  }

  // Don't render if no image
  if (!imageDataUrl) {
    return null
  }

  return (
    <div className="caption-generator">
      {/* Error state */}
      {error && (
        <div className="caption-error" role="alert" aria-live="assertive">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {/* Caption results with loading state - Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2 */}
      {(loading || baseCaption) && (
        <div className="caption-results">
          <div className="caption-header">
            <h3>Generated Captions</h3>
            {!loading && (
              <RegenerateButton 
                onRegenerate={handleRegenerate}
                disabled={loading}
              />
            )}
          </div>

          <CaptionGrid
            captions={baseCaption ? (() => {
              const allCaptions = [
                { text: baseCaption, style: 'base' as const, label: 'Original Description' },
                ...variants.map((variant, index) => ({
                  text: variant,
                  style: 'creative' as const,
                  label: `Variant ${index + 1}`
                }))
              ]
              // Limit to 3 captions in sidebar unless "Show More" is clicked
              return showAll ? allCaptions : allCaptions.slice(0, 3)
            })() : []}
            onSelect={onCaptionSelect}
            loading={loading}
          />

          {/* Show More button - Requirements: 2.4, 2.5 */}
          {!loading && baseCaption && variants.length > 2 && !showAll && (
            <button 
              className="button button-secondary"
              onClick={() => setShowAll(true)}
              style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}
              aria-label={`Show ${variants.length - 2} more caption variants`}
            >
              Show More ({variants.length - 2} more)
            </button>
          )}

          {/* Show Less button */}
          {!loading && showAll && (
            <button 
              className="button button-secondary"
              onClick={() => setShowAll(false)}
              style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}
              aria-label="Show fewer caption variants"
            >
              Show Less
            </button>
          )}

          {!loading && generationTime > 0 && (
            <div className="generation-time">
              Generated in {(generationTime / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      )}
    </div>
  )
}
