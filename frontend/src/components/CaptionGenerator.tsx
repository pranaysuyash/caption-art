/**
 * CaptionGenerator Component
 * Requirements: 1.5, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 3.1, 3.2, 3.3
 * 
 * Main UI component for caption generation that:
 * - Renders caption generation UI
 * - Shows loading state during generation
 * - Displays error messages
 * - Prefetches captions in background after upload (Requirements: 3.1, 3.2, 3.3)
 */

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { CaptionGenerator as Generator } from '../lib/caption/captionGenerator'
import { GenerationResult, CaptionStyle } from '../lib/caption/types'
import { CaptionGrid } from './CaptionGrid'
import { RegenerateButton } from './RegenerateButton'

export interface CaptionGeneratorProps {
  imageDataUrl: string | null
  onCaptionSelect: (caption: string) => void
  replicateApiKey: string
  openaiApiKey: string
}

export interface CaptionGeneratorHandle {
  prefetch: (imageDataUrl: string) => Promise<void>
}

/**
 * CaptionGenerator component for displaying AI-generated captions
 * Requirements: 1.5, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 3.1, 3.2, 3.3
 * 
 * Note: Automatic generation on image upload serves as prefetching (Requirements: 3.1, 3.2, 3.3)
 */
export const CaptionGenerator = forwardRef<CaptionGeneratorHandle, CaptionGeneratorProps>(({
  imageDataUrl,
  onCaptionSelect,
  replicateApiKey,
  openaiApiKey
}, ref) => {
  const [generator] = useState(() => new Generator({
    replicateApiKey,
    openaiApiKey
  }))
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Expose prefetch method via ref - Requirements: 3.1, 3.2, 3.3
  useImperativeHandle(ref, () => ({
    prefetch: async (dataUrl: string) => {
      await generator.prefetch(dataUrl)
    }
  }))

  // Monitor online/offline status - Requirements: 4.5
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Prefetch and generate captions when image changes
  useEffect(() => {
    if (!imageDataUrl) {
      setResult(null)
      setError(null)
      setProgress(0)
      return
    }

    const generateCaptions = async () => {
      // Check online status before generating - Requirements: 4.5
      if (!isOnline) {
        setError('No internet connection. Please check your network.')
        return
      }

      setLoading(true)
      setError(null)
      setProgress(0)

      try {
        // Check rate limit wait time - Requirements: 4.3
        const waitTime = generator.getWaitTime()
        if (waitTime > 0) {
          setError(`Service busy. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
          setLoading(false)
          return
        }

        // Check if already ready from prefetch - Requirements: 3.1, 3.2, 3.3
        const isReady = await generator.isReady(imageDataUrl)
        if (isReady) {
          // Instant display from cache
          const generationResult = await generator.generate(imageDataUrl)
          setProgress(100)
          setResult(generationResult)
          setLoading(false)
          return
        }

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90))
        }, 500)

        const generationResult = await generator.generate(imageDataUrl)
        
        clearInterval(progressInterval)
        setProgress(100)
        setResult(generationResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Caption generation failed. Please try again.')
      } finally {
        setLoading(false)
        setProgress(0)
      }
    }

    generateCaptions()
  }, [imageDataUrl, generator, isOnline])

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!imageDataUrl) return

    // Check online status before regenerating - Requirements: 4.5
    if (!isOnline) {
      setError('No internet connection. Please check your network.')
      return
    }

    // Check rate limit wait time - Requirements: 4.3
    const waitTime = generator.getWaitTime()
    if (waitTime > 0) {
      setError(`Service busy. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
      return
    }

    setLoading(true)
    setError(null)
    setProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const generationResult = await generator.regenerate(imageDataUrl)
      
      clearInterval(progressInterval)
      setProgress(100)
      setResult(generationResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Caption regeneration failed. Please try again.')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  // Don't render if no image
  if (!imageDataUrl) {
    return null
  }

  return (
    <div className="caption-generator">
      {/* Loading state - Requirements: 3.4, 5.4, 5.5 */}
      {loading && (
        <>
          <div className="caption-loading" role="status" aria-live="polite">
            <div className="loading-spinner" aria-hidden="true">⏳</div>
            <div className="loading-text">
              {progress < 50 ? 'Analyzing image...' : 'Generating caption variations...'}
            </div>
            {progress > 0 && (
              <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Caption generation progress">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          
          {/* Show skeleton loaders - Requirements: 5.4, 5.5 */}
          <CaptionGrid
            captions={[]}
            onSelect={() => {}}
            loading={true}
          />
        </>
      )}

      {/* Error state - Requirements: 4.1, 4.2, 4.3, 4.4, 4.5 */}
      {error && (
        <div className="caption-error" role="alert" aria-live="assertive">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {/* Caption results - Requirements: 1.5, 5.1, 5.2, 5.3, 5.4, 5.5, 7.2 */}
      {result && !loading && (
        <div className="caption-results">
          <div className="caption-header">
            <h3>Generated Captions</h3>
            <RegenerateButton 
              onRegenerate={handleRegenerate}
              disabled={loading || !isOnline}
            />
          </div>

          {/* Use CaptionGrid component - Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2 */}
          <CaptionGrid
            captions={[
              {
                text: result.baseCaption,
                style: 'base' as const,
                label: 'Original Description'
              },
              ...result.variants.map(variant => ({
                text: variant.text,
                style: variant.style,
                label: variant.style.charAt(0).toUpperCase() + variant.style.slice(1)
              }))
            ]}
            onSelect={onCaptionSelect}
            loading={false}
          />

          <div className="generation-time">
            Generated in {(result.generationTime / 1000).toFixed(1)}s
          </div>
        </div>
      )}
    </div>
  )
})

CaptionGenerator.displayName = 'CaptionGenerator'
