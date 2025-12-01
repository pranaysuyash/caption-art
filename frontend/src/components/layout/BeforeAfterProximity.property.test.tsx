/**
 * Property-Based Test: Before/After Proximity
 * 
 * **Feature: app-layout-restructure, Property 10: Before/After Proximity**
 * **Validates: Requirements 7.1**
 * 
 * Property: For any application state where a styled result exists,
 * the before/after slider should be positioned within 200px of the canvas element.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { CanvasArea } from './CanvasArea'
import * as fc from 'fast-check'

describe('Property 10: Before/After Proximity', () => {
  beforeEach(() => {
    // Clean up before each test
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('should position before/after slider within 200px of canvas element', () => {
    fc.assert(
      fc.property(
        // Generate random canvas dimensions
        fc.record({
          canvasWidth: fc.integer({ min: 400, max: 2000 }),
          canvasHeight: fc.integer({ min: 300, max: 1500 }),
          hasOutput: fc.constant(true), // Always true for this test
        }),
        (config) => {
          // Render CanvasArea with before/after slider (using a simple div as mock)
          const { container } = render(
            <CanvasArea
              canvas={<canvas width={config.canvasWidth} height={config.canvasHeight} />}
              beforeAfter={
                <div data-testid="before-after-mock">Before/After Slider</div>
              }
              showBeforeAfter={config.hasOutput}
            />
          )

          // Find canvas container and before/after container
          const canvasContainer = container.querySelector('.canvas-area__canvas-container')
          const beforeAfterContainer = container.querySelector('.canvas-area__before-after')

          // Both should exist when showBeforeAfter is true
          expect(canvasContainer).toBeTruthy()
          expect(beforeAfterContainer).toBeTruthy()

          if (canvasContainer && beforeAfterContainer) {
            // Get bounding rectangles
            const canvasRect = canvasContainer.getBoundingClientRect()
            const beforeAfterRect = beforeAfterContainer.getBoundingClientRect()

            // Calculate vertical distance between canvas bottom and before/after top
            const distance = beforeAfterRect.top - canvasRect.bottom

            // Property: Distance should be within 200px
            // Note: In the current layout, they're in the same flex column with gap,
            // so distance should be the gap value (1.5rem = 24px by default)
            expect(distance).toBeLessThanOrEqual(200)
            expect(distance).toBeGreaterThanOrEqual(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not render before/after slider when showBeforeAfter is false', () => {
    fc.assert(
      fc.property(
        fc.record({
          canvasWidth: fc.integer({ min: 400, max: 2000 }),
          canvasHeight: fc.integer({ min: 300, max: 1500 }),
        }),
        (config) => {
          const { container } = render(
            <CanvasArea
              canvas={<canvas width={config.canvasWidth} height={config.canvasHeight} />}
              beforeAfter={
                <div data-testid="before-after-mock">Before/After Slider</div>
              }
              showBeforeAfter={false}
            />
          )

          const beforeAfterContainer = container.querySelector('.canvas-area__before-after')
          
          // Property: Before/after should not be rendered when showBeforeAfter is false
          expect(beforeAfterContainer).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain proximity across different viewport widths', () => {
    fc.assert(
      fc.property(
        fc.record({
          viewportWidth: fc.integer({ min: 320, max: 2560 }),
          canvasWidth: fc.integer({ min: 400, max: 2000 }),
          canvasHeight: fc.integer({ min: 300, max: 1500 }),
        }),
        (config) => {
          const { container } = render(
            <div style={{ width: `${config.viewportWidth}px` }}>
              <CanvasArea
                canvas={<canvas width={config.canvasWidth} height={config.canvasHeight} />}
                beforeAfter={
                  <div data-testid="before-after-mock">Before/After Slider</div>
                }
                showBeforeAfter={true}
              />
            </div>
          )

          const canvasContainer = container.querySelector('.canvas-area__canvas-container')
          const beforeAfterContainer = container.querySelector('.canvas-area__before-after')

          if (canvasContainer && beforeAfterContainer) {
            const canvasRect = canvasContainer.getBoundingClientRect()
            const beforeAfterRect = beforeAfterContainer.getBoundingClientRect()
            const distance = beforeAfterRect.top - canvasRect.bottom

            // Property: Distance should remain within 200px regardless of viewport width
            expect(distance).toBeLessThanOrEqual(200)
            expect(distance).toBeGreaterThanOrEqual(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should ensure canvas remains visible when before/after slider is present', () => {
    fc.assert(
      fc.property(
        fc.record({
          canvasWidth: fc.integer({ min: 400, max: 2000 }),
          canvasHeight: fc.integer({ min: 300, max: 1500 }),
        }),
        (config) => {
          const { container } = render(
            <CanvasArea
              canvas={<canvas width={config.canvasWidth} height={config.canvasHeight} />}
              beforeAfter={
                <div data-testid="before-after-mock">Before/After Slider</div>
              }
              showBeforeAfter={true}
            />
          )

          const canvasContainer = container.querySelector('.canvas-area__canvas-container')
          const beforeAfterContainer = container.querySelector('.canvas-area__before-after')

          // Property: Both canvas and before/after should be visible (not hidden)
          expect(canvasContainer).toBeTruthy()
          expect(beforeAfterContainer).toBeTruthy()

          if (canvasContainer && beforeAfterContainer) {
            const canvasStyle = window.getComputedStyle(canvasContainer)
            const beforeAfterStyle = window.getComputedStyle(beforeAfterContainer)

            // Neither should be display: none or visibility: hidden
            expect(canvasStyle.display).not.toBe('none')
            expect(canvasStyle.visibility).not.toBe('hidden')
            expect(beforeAfterStyle.display).not.toBe('none')
            expect(beforeAfterStyle.visibility).not.toBe('hidden')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
