/**
 * CaptionGeneratorWithProgress - Caption generator with progress tracking and error handling
 * 
 * Demonstrates integration of:
 * - Progress tracking system
 * - Error handling system
 * - User feedback
 */

import { useState } from 'react'
import { useProgress } from '../hooks/useProgress'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { ProgressIndicator } from './ProgressIndicator'
import { ErrorToast } from './ErrorToast'

export interface CaptionGeneratorWithProgressProps {
  imageUrl: string
  onCaptionsGenerated: (captions: string[]) => void
}

export function CaptionGeneratorWithProgress({
  imageUrl,
  onCaptionsGenerated,
}: CaptionGeneratorWithProgressProps) {
  const [captions, setCaptions] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Progress tracking
  const progress = useProgress({
    operation: 'Generate Captions',
    steps: [
      'Analyzing image',
      'Generating base caption',
      'Creating variations',
      'Finalizing captions',
    ],
    canCancel: true,
    onComplete: () => {
      setIsGenerating(false)
    },
    onCancel: () => {
      setIsGenerating(false)
    },
  })

  // Error handling
  const errorHandler = useErrorHandler({
    operation: 'generateCaptions',
    onRetry: async () => {
      await handleGenerate()
    },
    maxRetries: 3,
  })

  /**
   * Generate captions with progress tracking and error handling
   */
  const handleGenerate = async () => {
    setIsGenerating(true)
    progress.start()
    errorHandler.clearError()

    try {
      // Step 1: Analyze image
      progress.updateProgress(10, 'Analyzing image content...')
      await simulateApiCall(1000)

      if (progress.isCancelRequested()) {
        return
      }

      progress.completeStep()

      // Step 2: Generate base caption
      progress.updateProgress(40, 'Generating base caption...')
      await simulateApiCall(2000)

      if (progress.isCancelRequested()) {
        return
      }

      progress.completeStep()

      // Step 3: Create variations
      progress.updateProgress(70, 'Creating caption variations...')
      await simulateApiCall(1500)

      if (progress.isCancelRequested()) {
        return
      }

      progress.completeStep()

      // Step 4: Finalize
      progress.updateProgress(90, 'Finalizing captions...')
      await simulateApiCall(500)

      if (progress.isCancelRequested()) {
        return
      }

      progress.completeStep()

      // Success!
      const generatedCaptions = [
        'A beautiful sunset over the ocean',
        'Golden hour magic by the sea',
        'Nature\'s masterpiece at dusk',
        'Peaceful evening vibes',
        'Where sky meets water',
      ]

      setCaptions(generatedCaptions)
      onCaptionsGenerated(generatedCaptions)
      progress.complete('Captions generated successfully!')
    } catch (error) {
      // Handle error with error manager
      const errorInfo = errorHandler.handleError(error, {
        imageUrl,
        step: progress.progressInfo?.currentStep,
      })

      progress.error(new Error(errorInfo.userMessage))
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    progress.cancel()
  }

  /**
   * Handle retry from error toast
   */
  const handleRetry = async () => {
    await errorHandler.retry()
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Caption Generator</h2>

      {/* Generate button */}
      {!isGenerating && captions.length === 0 && (
        <button
          onClick={handleGenerate}
          className="btn btn-primary"
          style={{ marginBottom: '1.5rem' }}
        >
          Generate Captions
        </button>
      )}

      {/* Progress indicator */}
      {progress.progressInfo && progress.isRunning && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ProgressIndicator
            progressInfo={progress.progressInfo}
            operation="Generate Captions"
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Error toast */}
      {errorHandler.currentError && (
        <ErrorToast
          errorInfo={errorHandler.currentError}
          onRetry={handleRetry}
          onDismiss={errorHandler.clearError}
        />
      )}

      {/* Success state */}
      {progress.isComplete && captions.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Generated Captions:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {captions.map((caption, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-bg-secondary, #f3f4f6)',
                  border: '2px solid var(--color-border, #e5e7eb)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => {
                  console.log('Selected caption:', caption)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border, #e5e7eb)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                {caption}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setCaptions([])
              progress.reset()
            }}
            className="btn btn-secondary"
            style={{ marginTop: '1.5rem' }}
          >
            Generate New Captions
          </button>
        </div>
      )}

      {/* Cancelled state */}
      {progress.isCancelled && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-bg-secondary, #f3f4f6)',
            border: '2px solid var(--color-border, #e5e7eb)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 1rem 0' }}>Caption generation was cancelled.</p>
          <button
            onClick={() => {
              progress.reset()
              handleGenerate()
            }}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

// Simulate API call with delay
function simulateApiCall(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Example usage:
 * 
 * <CaptionGeneratorWithProgress
 *   imageUrl="https://example.com/image.jpg"
 *   onCaptionsGenerated={(captions) => {
 *     console.log('Captions:', captions)
 *   }}
 * />
 */
