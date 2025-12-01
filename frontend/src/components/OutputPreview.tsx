/**
 * OutputPreview Component
 * 
 * Before/after slider showing:
 * - Before: Original image without text
 * - After: Final composited output with text behind subject
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export interface OutputPreviewProps {
  originalImage: HTMLImageElement | null
  outputCanvas: HTMLCanvasElement | null
}

export function OutputPreview({
  originalImage,
  outputCanvas
}: OutputPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null)
  const afterCanvasRef = useRef<HTMLCanvasElement>(null)
  const [sliderPosition, setSliderPosition] = useState<number>(50)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  // Render canvases when images change
  useEffect(() => {
    if (!beforeCanvasRef.current || !afterCanvasRef.current || !originalImage || !outputCanvas) {
      return
    }

    const maxWidth = 800
    const scale = Math.min(1, maxWidth / originalImage.width)
    const width = originalImage.width * scale
    const height = originalImage.height * scale

    // Render original image (before)
    const beforeCanvas = beforeCanvasRef.current
    beforeCanvas.width = width
    beforeCanvas.height = height
    const beforeCtx = beforeCanvas.getContext('2d')!
    beforeCtx.drawImage(originalImage, 0, 0, width, height)

    // Render composited output (after)
    const afterCanvas = afterCanvasRef.current
    afterCanvas.width = width
    afterCanvas.height = height
    const afterCtx = afterCanvas.getContext('2d')!
    afterCtx.drawImage(outputCanvas, 0, 0, width, height)
  }, [originalImage, outputCanvas])

  // Handle slider drag
  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [isDragging])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [isDragging])

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove])

  // Don't render if no output
  if (!outputCanvas || !originalImage) {
    return null
  }

  return (
    <div className="output-preview-container" style={{ marginTop: '24px' }}>
      {/* Title */}
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: '700',
        color: '#FAFAFA',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        Before / After
      </h3>

      {/* Before/After Slider */}
        <div
          ref={containerRef}
          className="before-after-slider"
          style={{
            position: 'relative',
            border: '3px solid #4ECDC4',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#1a1a1a',
            boxShadow: '0 4px 8px rgba(78, 205, 196, 0.2)',
            cursor: 'ew-resize',
            userSelect: 'none'
          }}
        >
          {/* After Image (Output) - Full width */}
          <canvas
            ref={afterCanvasRef}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto'
            }}
          />

          {/* Before Image (Original) - Clipped by slider */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${sliderPosition}%`,
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <canvas
              ref={beforeCanvasRef}
              style={{
                display: 'block',
                width: containerRef.current ? `${(containerRef.current.offsetWidth / sliderPosition) * 100}%` : '100%',
                height: 'auto'
              }}
            />
          </div>

          {/* Slider Handle */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            style={{
              position: 'absolute',
              top: 0,
              left: `${sliderPosition}%`,
              width: '4px',
              height: '100%',
              background: '#4ECDC4',
              cursor: 'ew-resize',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 10px rgba(78, 205, 196, 0.5)',
              zIndex: 10
            }}
          >
            {/* Handle Circle */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '40px',
                height: '40px',
                background: '#4ECDC4',
                border: '3px solid #111',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              ⟷
            </div>
          </div>

          {/* Labels */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#4ECDC4',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Before
          </div>
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#FF6B6B',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            After
          </div>
        </div>
    </div>
  )
}
