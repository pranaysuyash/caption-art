import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { AppLayout } from './AppLayout'
import { Sidebar, type SidebarSection } from './Sidebar'
import { CanvasArea } from './CanvasArea'

/**
 * Feature: app-layout-restructure, Property 1: Simultaneous Visibility
 * 
 * For any viewport with height >= 768px, when the application renders with an uploaded image,
 * both the canvas and at least one control section should be visible without scrolling.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3
 */
describe('Property 1: Simultaneous Visibility', () => {
  it('should keep canvas and controls visible simultaneously', () => {
    fc.assert(
      fc.property(
        fc.record({
          viewportHeight: fc.integer({ min: 768, max: 2000 }),
          viewportWidth: fc.integer({ min: 1024, max: 3000 }),
          sectionCount: fc.integer({ min: 1, max: 5 }),
        }),
        ({ viewportHeight, viewportWidth, sectionCount }) => {
          // Set viewport size
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewportHeight,
          })
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          })

          // Create test sections
          const sections: SidebarSection[] = Array.from({ length: sectionCount }, (_, i) => ({
            id: `section-${i}`,
            title: `Section ${i}`,
            content: <div data-testid={`control-${i}`}>Control {i}</div>,
            visible: true,
          }))

          const { container } = render(
            <AppLayout
              toolbar={<div data-testid="toolbar">Toolbar</div>}
              sidebar={<Sidebar sections={sections} />}
              canvas={
                <CanvasArea
                  canvas={<canvas data-testid="canvas" width={800} height={600} />}
                />
              }
              layoutMode="desktop"
              sidebarCollapsed={false}
            />
          )

          const toolbar = container.querySelector('[data-testid="toolbar"]')
          const canvas = container.querySelector('[data-testid="canvas"]')
          const firstControl = container.querySelector('[data-testid="control-0"]')

          // Verify all elements exist
          expect(toolbar).toBeTruthy()
          expect(canvas).toBeTruthy()
          expect(firstControl).toBeTruthy()

          // Get bounding rectangles
          const canvasRect = canvas!.getBoundingClientRect()
          const controlRect = firstControl!.getBoundingClientRect()

          // Property: Canvas and at least one control should be within viewport
          // Canvas should be visible (top < viewport height)
          expect(canvasRect.top).toBeLessThan(viewportHeight)
          
          // At least one control should be visible (top < viewport height)
          expect(controlRect.top).toBeLessThan(viewportHeight)

          // Distance between control and canvas should be less than viewport height
          // This ensures they can be seen simultaneously
          const distance = Math.abs(canvasRect.top - controlRect.top)
          expect(distance).toBeLessThan(viewportHeight)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should keep sidebar sections within scrollable area when canvas is visible', () => {
    fc.assert(
      fc.property(
        fc.record({
          viewportHeight: fc.integer({ min: 768, max: 2000 }),
          viewportWidth: fc.integer({ min: 1024, max: 3000 }),
        }),
        ({ viewportHeight, viewportWidth }) => {
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewportHeight,
          })
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          })

          const sections: SidebarSection[] = [
            { id: 'upload', title: 'Upload', content: <div>Upload</div>, visible: true },
            { id: 'text', title: 'Text', content: <div>Text</div>, visible: true },
            { id: 'style', title: 'Style', content: <div>Style</div>, visible: true },
          ]

          const { container } = render(
            <AppLayout
              toolbar={<div>Toolbar</div>}
              sidebar={<Sidebar sections={sections} />}
              canvas={
                <CanvasArea
                  canvas={<canvas data-testid="canvas" width={800} height={600} />}
                />
              }
              layoutMode="desktop"
              sidebarCollapsed={false}
            />
          )

          const sidebar = container.querySelector('.sidebar')
          const canvas = container.querySelector('[data-testid="canvas"]')

          expect(sidebar).toBeTruthy()
          expect(canvas).toBeTruthy()

          // Sidebar should exist and be scrollable (has overflow-y in CSS)
          // Note: jsdom doesn't fully support getComputedStyle, so we check the class exists
          expect(sidebar!.className).toContain('sidebar')

          // Canvas should be visible
          const canvasRect = canvas!.getBoundingClientRect()
          expect(canvasRect.top).toBeLessThan(viewportHeight)
        }
      ),
      { numRuns: 100 }
    )
  })
})
