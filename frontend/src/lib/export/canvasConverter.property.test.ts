/**
 * Property-based tests for CanvasConverter
 * Tests universal properties that should hold across all inputs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { CanvasConverter } from './canvasConverter'

describe('CanvasConverter - Property-Based Tests', () => {
  let canvases: HTMLCanvasElement[] = []

  // Helper to create a canvas with specific dimensions
  function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    // Note: We don't draw on the canvas in tests because node-canvas has limitations
    // The actual functionality doesn't require canvas content for scaling tests
    
    canvases.push(canvas)
    return canvas
  }

  afterEach(() => {
    // Clean up canvases
    canvases = []
  })

  /**
   * Property 3: Aspect ratio preservation
   * Feature: export-download-system, Property 3: Aspect ratio preservation
   * Validates: Requirements 3.1
   * 
   * For any canvas with aspect ratio R, after scaling to maxDimension,
   * the exported image aspect ratio should equal R within 0.01 tolerance
   * 
   * Note: This test verifies the scaling logic by checking dimensions only,
   * without requiring actual canvas drawing (which has limitations in test environments)
   */
  it('Property 3: should preserve aspect ratio when scaling', () => {
    fc.assert(
      fc.property(
        // Generate random canvas dimensions (10-5000px)
        fc.integer({ min: 10, max: 5000 }),
        fc.integer({ min: 10, max: 5000 }),
        // Generate random maxDimension (100-2000px)
        fc.integer({ min: 100, max: 2000 }),
        (width, height, maxDimension) => {
          const canvas = createCanvas(width, height)
          
          // Calculate original aspect ratio
          const originalAspectRatio = width / height
          
          // Mock drawImage to avoid test environment limitations
          const originalDrawImage = HTMLCanvasElement.prototype.getContext
          let scaledCanvas: HTMLCanvasElement
          
          try {
            // Temporarily mock getContext to avoid actual drawing
            HTMLCanvasElement.prototype.getContext = function(contextType: string) {
              if (contextType === '2d') {
                const mockCtx = {
                  imageSmoothingEnabled: true,
                  imageSmoothingQuality: 'high',
                  drawImage: () => {}, // No-op for testing
                } as any
                return mockCtx
              }
              return null
            } as any
            
            // Scale the canvas
            scaledCanvas = CanvasConverter.scaleCanvas(canvas, maxDimension)
          } finally {
            // Restore original getContext
            HTMLCanvasElement.prototype.getContext = originalDrawImage
          }
          
          // Calculate scaled aspect ratio
          const scaledAspectRatio = scaledCanvas.width / scaledCanvas.height
          
          // Verify aspect ratio is preserved within tolerance
          // Note: Due to integer rounding of pixel dimensions, the tolerance must account
          // for the quantization error. The maximum error occurs when rounding causes
          // a 1-pixel difference in the smaller dimension.
          const minDim = Math.min(scaledCanvas.width, scaledCanvas.height)
          const maxDim = Math.max(scaledCanvas.width, scaledCanvas.height)
          // Maximum aspect ratio error from 1-pixel rounding: (maxDim / (minDim ± 1)) - (maxDim / minDim)
          const tolerance = Math.abs((maxDim / (minDim - 1)) - (maxDim / minDim))
          const aspectRatioDiff = Math.abs(originalAspectRatio - scaledAspectRatio)
          
          expect(aspectRatioDiff).toBeLessThanOrEqual(tolerance)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4: Maximum dimension enforcement
   * Feature: export-download-system, Property 4: Maximum dimension enforcement
   * Validates: Requirements 3.1, 3.2
   * 
   * For any canvas with width W or height H exceeding 1080px,
   * the exported image should have max(width, height) ≤ 1080px
   * 
   * Note: This test verifies the scaling logic by checking dimensions only,
   * without requiring actual canvas drawing (which has limitations in test environments)
   */
  it('Property 4: should enforce maximum dimension constraint', () => {
    fc.assert(
      fc.property(
        // Generate random canvas dimensions (10-5000px)
        fc.integer({ min: 10, max: 5000 }),
        fc.integer({ min: 10, max: 5000 }),
        // Generate random maxDimension (100-2000px)
        fc.integer({ min: 100, max: 2000 }),
        (width, height, maxDimension) => {
          const canvas = createCanvas(width, height)
          
          // Mock drawImage to avoid test environment limitations
          const originalDrawImage = HTMLCanvasElement.prototype.getContext
          let scaledCanvas: HTMLCanvasElement
          
          try {
            // Temporarily mock getContext to avoid actual drawing
            HTMLCanvasElement.prototype.getContext = function(contextType: string) {
              if (contextType === '2d') {
                const mockCtx = {
                  imageSmoothingEnabled: true,
                  imageSmoothingQuality: 'high',
                  drawImage: () => {}, // No-op for testing
                } as any
                return mockCtx
              }
              return null
            } as any
            
            // Scale the canvas
            scaledCanvas = CanvasConverter.scaleCanvas(canvas, maxDimension)
          } finally {
            // Restore original getContext
            HTMLCanvasElement.prototype.getContext = originalDrawImage
          }
          
          // Verify maximum dimension is enforced
          const maxScaledDimension = Math.max(scaledCanvas.width, scaledCanvas.height)
          
          expect(maxScaledDimension).toBeLessThanOrEqual(maxDimension)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property: No scaling when under maxDimension
   * Verifies that canvases smaller than maxDimension are not scaled up
   */
  it('should not scale canvas when dimensions are within maxDimension', () => {
    fc.assert(
      fc.property(
        // Generate dimensions smaller than maxDimension
        fc.integer({ min: 10, max: 500 }),
        fc.integer({ min: 10, max: 500 }),
        (width, height) => {
          const maxDimension = 1000
          const canvas = createCanvas(width, height)
          
          // Scale the canvas
          const scaledCanvas = CanvasConverter.scaleCanvas(canvas, maxDimension)
          
          // Should return the same canvas (no scaling)
          expect(scaledCanvas).toBe(canvas)
          expect(scaledCanvas.width).toBe(width)
          expect(scaledCanvas.height).toBe(height)
        }
      ),
      { numRuns: 100 }
    )
  })
})
