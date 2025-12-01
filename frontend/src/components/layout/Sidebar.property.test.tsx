import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import * as fc from 'fast-check'
import { AppLayout } from './AppLayout'
import { Sidebar, type SidebarSection } from './Sidebar'
import { CanvasArea } from './CanvasArea'

/**
 * Feature: app-layout-restructure, Property 2: Sidebar Independence
 * 
 * For any scroll position within the Sidebar, the Canvas Area scroll position should remain unchanged,
 * and vice versa.
 * 
 * Validates: Requirements 2.5
 */
describe('Property 2: Sidebar Independence', () => {
  it('should not affect canvas scroll when sidebar scrolls', () => {
    fc.assert(
      fc.property(
        fc.record({
          sidebarScrollTop: fc.integer({ min: 0, max: 500 }),
          canvasScrollTop: fc.integer({ min: 0, max: 500 }),
        }),
        ({ sidebarScrollTop, canvasScrollTop }) => {
          const sections: SidebarSection[] = Array.from({ length: 10 }, (_, i) => ({
            id: `section-${i}`,
            title: `Section ${i}`,
            content: <div style={{ height: '200px' }}>Content {i}</div>,
            visible: true,
          }))

          const { container } = render(
            <AppLayout
              toolbar={<div>Toolbar</div>}
              sidebar={<Sidebar sections={sections} />}
              canvas={
                <CanvasArea
                  canvas={
                    <div style={{ height: '2000px' }} data-testid="canvas-content">
                      Large Canvas Content
                    </div>
                  }
                />
              }
              layoutMode="desktop"
              sidebarCollapsed={false}
            />
          )

          const sidebar = container.querySelector('.sidebar') as HTMLElement
          const canvasArea = container.querySelector('.canvas-area') as HTMLElement

          expect(sidebar).toBeTruthy()
          expect(canvasArea).toBeTruthy()

          // Set initial scroll positions
          Object.defineProperty(sidebar, 'scrollTop', {
            writable: true,
            configurable: true,
            value: 0,
          })
          Object.defineProperty(canvasArea, 'scrollTop', {
            writable: true,
            configurable: true,
            value: canvasScrollTop,
          })

          const initialCanvasScroll = canvasArea.scrollTop

          // Scroll the sidebar
          Object.defineProperty(sidebar, 'scrollTop', {
            writable: true,
            configurable: true,
            value: sidebarScrollTop,
          })
          fireEvent.scroll(sidebar)

          // Property: Canvas scroll position should remain unchanged
          expect(canvasArea.scrollTop).toBe(initialCanvasScroll)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not affect sidebar scroll when canvas scrolls', () => {
    fc.assert(
      fc.property(
        fc.record({
          sidebarScrollTop: fc.integer({ min: 0, max: 500 }),
          canvasScrollTop: fc.integer({ min: 0, max: 500 }),
        }),
        ({ sidebarScrollTop, canvasScrollTop }) => {
          const sections: SidebarSection[] = Array.from({ length: 10 }, (_, i) => ({
            id: `section-${i}`,
            title: `Section ${i}`,
            content: <div style={{ height: '200px' }}>Content {i}</div>,
            visible: true,
          }))

          const { container } = render(
            <AppLayout
              toolbar={<div>Toolbar</div>}
              sidebar={<Sidebar sections={sections} />}
              canvas={
                <CanvasArea
                  canvas={
                    <div style={{ height: '2000px' }} data-testid="canvas-content">
                      Large Canvas Content
                    </div>
                  }
                />
              }
              layoutMode="desktop"
              sidebarCollapsed={false}
            />
          )

          const sidebar = container.querySelector('.sidebar') as HTMLElement
          const canvasArea = container.querySelector('.canvas-area') as HTMLElement

          expect(sidebar).toBeTruthy()
          expect(canvasArea).toBeTruthy()

          // Set initial scroll positions
          Object.defineProperty(sidebar, 'scrollTop', {
            writable: true,
            configurable: true,
            value: sidebarScrollTop,
          })
          Object.defineProperty(canvasArea, 'scrollTop', {
            writable: true,
            configurable: true,
            value: 0,
          })

          const initialSidebarScroll = sidebar.scrollTop

          // Scroll the canvas area
          Object.defineProperty(canvasArea, 'scrollTop', {
            writable: true,
            configurable: true,
            value: canvasScrollTop,
          })
          fireEvent.scroll(canvasArea)

          // Property: Sidebar scroll position should remain unchanged
          expect(sidebar.scrollTop).toBe(initialSidebarScroll)
        }
      ),
      { numRuns: 100 }
    )
  })
})
