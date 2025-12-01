import React from 'react'
import './CanvasArea.css'

export interface CanvasAreaProps {
  canvas: React.ReactNode
  beforeAfter?: React.ReactNode
  maskPreview?: React.ReactNode
  socialPreview?: React.ReactNode
  showBeforeAfter?: boolean
  showMaskPreview?: boolean
  loading?: boolean
  loadingMessage?: string
  className?: string
}

/**
 * Container for canvas element and related UI (before/after, mask preview)
 * Handles canvas sizing, loading states, and positioning of related elements
 */
export function CanvasArea({
  canvas,
  beforeAfter,
  maskPreview,
  socialPreview,
  showBeforeAfter = false,
  showMaskPreview = false,
  loading = false,
  loadingMessage,
  className = '',
}: CanvasAreaProps) {
  // Check if canvas has content by looking for a canvas element with actual dimensions
  const hasCanvasContent = React.useMemo(() => {
    if (!canvas) return false
    // This is a simple check - in real usage, the canvas will be rendered with content
    return true // We'll rely on the parent to not render canvas if there's no image
  }, [canvas])

  return (
    <main
      className={`canvas-area ${className}`}
      role="main"
      aria-label="Canvas Area"
    >
      {loading && (
        <div className="canvas-area__loading-overlay" aria-live="polite">
          <div className="canvas-area__spinner" />
          {loadingMessage && (
            <p className="canvas-area__loading-message">{loadingMessage}</p>
          )}
        </div>
      )}

      {showMaskPreview && maskPreview && (
        <div className="canvas-area__mask-preview">
          {maskPreview}
        </div>
      )}

      {/* Wrapper for canvas and before/after to enable side-by-side layout on desktop */}
      <div className="canvas-area__content-wrapper">
        <div className="canvas-area__canvas-container">
          {canvas}
          {socialPreview}
        </div>

        {showBeforeAfter && beforeAfter && (
          <div className="canvas-area__before-after">
            {beforeAfter}
          </div>
        )}
      </div>
    </main>
  )
}
