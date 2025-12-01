import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as fc from 'fast-check'
import { useMediaQuery, type LayoutMode } from './useMediaQuery'

/**
 * Feature: app-layout-restructure, Property 6: Responsive Layout Adaptation
 * 
 * For any viewport width change that crosses a breakpoint (768px or 1024px),
 * the layout mode should update and the grid structure should adapt accordingly.
 * 
 * Validates: Requirements 5.1, 5.2, 5.3
 */
describe('Property 6: Responsive Layout Adaptation', () => {
  let originalInnerWidth: number

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  it('should return mobile mode for widths below 768px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }),
        (width) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          })

          const { result } = renderHook(() => useMediaQuery())

          expect(result.current).toBe('mobile')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return tablet mode for widths between 768px and 1023px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 768, max: 1023 }),
        (width) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          })

          const { result } = renderHook(() => useMediaQuery())

          expect(result.current).toBe('tablet')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return desktop mode for widths 1024px and above', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1024, max: 3840 }),
        (width) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          })

          const { result } = renderHook(() => useMediaQuery())

          expect(result.current).toBe('desktop')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should update layout mode when crossing breakpoints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialWidth: fc.integer({ min: 320, max: 3840 }),
          finalWidth: fc.integer({ min: 320, max: 3840 }),
        }),
        async ({ initialWidth, finalWidth }) => {
          // Set initial width
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: initialWidth,
          })

          const { result, rerender } = renderHook(() => useMediaQuery())

          const getExpectedMode = (width: number): LayoutMode => {
            if (width < 768) return 'mobile'
            if (width < 1024) return 'tablet'
            return 'desktop'
          }

          const initialMode = getExpectedMode(initialWidth)
          expect(result.current).toBe(initialMode)

          // Change width
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: finalWidth,
          })

          // Trigger resize event
          act(() => {
            window.dispatchEvent(new Event('resize'))
          })

          // Wait for debounce (300ms)
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              rerender()
              const finalMode = getExpectedMode(finalWidth)
              expect(result.current).toBe(finalMode)
              resolve()
            }, 350)
          })
        }
      ),
      { numRuns: 50 } // Reduced runs due to async nature
    )
  })

  it('should correctly identify breakpoint crossings', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { from: 500, to: 900 }, // mobile -> tablet
          { from: 900, to: 1200 }, // tablet -> desktop
          { from: 1200, to: 600 }, // desktop -> mobile
          { from: 600, to: 1100 }, // mobile -> tablet -> desktop (crosses both)
        ),
        async ({ from, to }) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: from,
          })

          const { result } = renderHook(() => useMediaQuery())

          const getExpectedMode = (width: number): LayoutMode => {
            if (width < 768) return 'mobile'
            if (width < 1024) return 'tablet'
            return 'desktop'
          }

          const initialMode = getExpectedMode(from)
          expect(result.current).toBe(initialMode)

          // Change width
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: to,
          })

          act(() => {
            window.dispatchEvent(new Event('resize'))
          })

          // Wait for debounce
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              const finalMode = getExpectedMode(to)
              expect(result.current).toBe(finalMode)
              resolve()
            }, 350)
          })
        }
      ),
      { numRuns: 20, timeout: 60000 } // Reduced runs and increased timeout
    )
  })
})
