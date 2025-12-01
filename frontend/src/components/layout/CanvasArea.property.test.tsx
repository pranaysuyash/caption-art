import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { CanvasArea } from './CanvasArea'

/**
 * Feature: app-layout-restructure, Property 8: Canvas Dimension Stability
 * 
 * For any canvas content update (text change, style change, transform change),
 * the canvas dimensions should remain stable without causing layout shift.
 * 
 * Validates: Requirements 6.4
 */
describe('Property 8: Canvas Dimension Stability', () => {
  it('should maintain stable canvas dimensions across content updates', () => {
    fc.assert(
      fc.property(
        fc.record({
          initialWidth: fc.integer({ min: 400, max: 1200 }),
          initialHeight: fc.integer({ min: 300, max: 900 }),
          updates: fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 50 }),
              style: fc.constantFrom('bold', 'italic', 'shadow', 'outline'),
              transform: fc.record({
                x: fc.integer({ min: -100, max: 100 }),
                y: fc.integer({ min: -100, max: 100 }),
                scale: fc.float({ min: 0.5, max: 2.0 }),
              }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        ({ initialWidth, initialHeight, updates }) => {
          // Render initial canvas
          const { container, rerender } = render(
            <CanvasArea
              canvas={
                <canvas
                  data-testid="canvas"
                  width={initialWidth}
                  height={initialHeight}
                />
              }
            />
          )

          const canvasContainer = container.querySelector('.canvas-area__canvas-container')
          expect(canvasContainer).toBeTruthy()

          // Get initial dimensions
          const initialRect = canvasContainer!.getBoundingClientRect()
          const initialContainerWidth = initialRect.width
          const initialContainerHeight = initialRect.height

          // Apply each update and verify dimensions remain stable
          for (const update of updates) {
            // Simulate content update by re-rendering with same canvas dimensions
            // but different content (simulated by data attributes)
            rerender(
              <CanvasArea
                canvas={
                  <canvas
                    data-testid="canvas"
                    width={initialWidth}
                    height={initialHeight}
                    data-text={update.text}
                    data-style={update.style}
                    data-transform={JSON.stringify(update.transform)}
                  />
                }
              />
            )

            // Get updated dimensions
            const updatedRect = canvasContainer!.getBoundingClientRect()
            const updatedContainerWidth = updatedRect.width
            const updatedContainerHeight = updatedRect.height

            // Property: Container dimensions should remain stable
            // Allow for minor rounding differences (< 1px)
            expect(Math.abs(updatedContainerWidth - initialContainerWidth)).toBeLessThan(1)
            expect(Math.abs(updatedContainerHeight - initialContainerHeight)).toBeLessThan(1)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain stable dimensions when toggling before/after slider', () => {
    fc.assert(
      fc.property(
        fc.record({
          canvasWidth: fc.integer({ min: 400, max: 1200 }),
          canvasHeight: fc.integer({ min: 300, max: 900 }),
          showBeforeAfter: fc.boolean(),
        }),
        ({ canvasWidth, canvasHeight, showBeforeAfter }) => {
          // Render without before/after
          const { container, rerender } = render(
            <CanvasArea
              canvas={
                <canvas
                  data-testid="canvas"
                  width={canvasWidth}
                  height={canvasHeight}
                />
              }
              showBeforeAfter={false}
            />
          )

          const canvasContainer = container.querySelector('.canvas-area__canvas-container')
          expect(canvasContainer).toBeTruthy()

          // Get initial canvas container dimensions
          const initialRect = canvasContainer!.getBoundingClientRect()
          const initialWidth = initialRect.width
          const initialHeight = initialRect.height

          // Toggle before/after slider
          rerender(
            <CanvasArea
              canvas={
                <canvas
                  data-testid="canvas"
                  width={canvasWidth}
                  height={canvasHeight}
                />
              }
              beforeAfter={<div data-testid="before-after">Slider</div>}
              showBeforeAfter={showBeforeAfter}
            />
          )

          // Get updated canvas container dimensions
          const updatedRect = canvasContainer!.getBoundingClientRect()
          const updatedWidth = updatedRect.width
          const updatedHeight = updatedRect.height

          // Property: Canvas container dimensions should remain stable
          // The before/after slider should not affect canvas dimensions
          expect(Math.abs(updatedWidth - initialWidth)).toBeLessThan(1)
          expect(Math.abs(updatedHeight - initialHeight)).toBeLessThan(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain stable dimensions when toggling mask preview', () => {
    fc.assert(
      fc.property(
        fc.record({
          canvasWidth: fc.integer({ min: 400, max: 1200 }),
          canvasHeight: fc.integer({ min: 300, max: 900 }),
          showMaskPreview: fc.boolean(),
        }),
        ({ canvasWidth, canvasHeight, showMaskPreview }) => {
          // Render without mask preview
          const { container, rerender } = render(
            <CanvasArea
              canvas={
                <canvas
                  data-testid="canvas"
                  width={canvasWidth}
                  height={canvasHeight}
                />
              }
              showMaskPreview={false}
            />
          )

          const canvasContainer = container.querySelector('.canvas-area__canvas-container')
          expect(canvasContainer).toBeTruthy()

          // Get initial canvas container dimensions
          const initialRect = canvasContainer!.getBoundingClientRect()
          const initialWidth = initialRect.width
          const initialHeight = initialRect.height

          // Toggle mask preview
          rerender(
            <CanvasArea
              canvas={
                <canvas
                  data-testid="canvas"
                  width={canvasWidth}
                  height={canvasHeight}
                />
              }
              maskPreview={<div data-testid="mask-preview">Mask</div>}
              showMaskPreview={showMaskPreview}
            />
          )

          // Get updated canvas container dimensions
          const updatedRect = canvasContainer!.getBoundingClientRect()
          const updatedWidth = updatedRect.width
          const updatedHeight = updatedRect.height

          // Property: Canvas container dimensions should remain stable
          // The mask preview should not affect canvas dimensions
          expect(Math.abs(updatedWidth - initialWidth)).toBeLessThan(1)
          expect(Math.abs(updatedHeight - initialHeight)).toBeLessThan(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain stable dimensions during loading state transitions', () => {
    fc.assert(
      fc.property(
        fc.record({
          canvasWidth: fc.integer({ min: 400, max: 1200 }),
          canvasHeight: fc.integer({ min: 300, max: 900 }),
          loadingMessage: fc.string({ minLength: 5, maxLength: 50 }),
        }),
        ({ canvasWidth, canvasHeight, loadingMessage }) => {
          // Render in normal state
          const { container, rerender } = render(
            <CanvasArea
              canvas={
                <canvas
                  data-testid="canvas"
                  width={canvasWidth}
                  height={canvasHeight}
                />
              }
              loading={false}
            />
          )

          const canvasContainer = container.querySelector('.canvas-area__canvas-container')
          expect(canvasContainer).toBeTruthy()

          // Get initial canvas container dimensions
          const initialRect = canvasContainer!.getBoundingClientRect()
          const initialWidth = initialRect.width
          const initialHeight = initialRect.height

          // Transition to loading state
          rerender(
            <CanvasArea
              canvas={
                <canvas
                  data-testid="canvas"
                  width={canvasWidth}
                  height={canvasHeight}
                />
              }
              loading={true}
              loadingMessage={loadingMessage}
            />
          )

          // Get updated canvas container dimensions
          const updatedRect = canvasContainer!.getBoundingClientRect()
          const updatedWidth = updatedRect.width
          const updatedHeight = updatedRect.height

          // Property: Canvas container dimensions should remain stable during loading
          expect(Math.abs(updatedWidth - initialWidth)).toBeLessThan(1)
          expect(Math.abs(updatedHeight - initialHeight)).toBeLessThan(1)

          // Transition back to normal state
          rerender(
            <CanvasArea
              canvas={
                <canvas
                  data-testid="canvas"
                  width={canvasWidth}
                  height={canvasHeight}
                />
              }
              loading={false}
            />
          )

          // Get final canvas container dimensions
          const finalRect = canvasContainer!.getBoundingClientRect()
          const finalWidth = finalRect.width
          const finalHeight = finalRect.height

          // Property: Canvas container dimensions should return to initial state
          expect(Math.abs(finalWidth - initialWidth)).toBeLessThan(1)
          expect(Math.abs(finalHeight - initialHeight)).toBeLessThan(1)
        }
      ),
      { numRuns: 100 }
    )
  })
})
