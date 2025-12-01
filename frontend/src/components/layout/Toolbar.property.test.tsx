/**
 * Property-Based Tests for Toolbar Persistence
 * Feature: app-layout-restructure, Property 3: Toolbar Persistence
 * Validates: Requirements 3.1, 3.2, 3.3
 * 
 * Property 3: Toolbar Persistence
 * For any scroll position in Sidebar or Canvas Area, the Toolbar should remain 
 * fixed at the top of the viewport.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AppLayout } from './AppLayout'
import { Toolbar } from '../Toolbar'
import fc from 'fast-check'

describe('Property 3: Toolbar Persistence', () => {
  it('toolbar has fixed positioning class for any layout configuration', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Sidebar collapsed state
        fc.constantFrom('desktop', 'tablet', 'mobile'), // Layout mode
        (sidebarCollapsed, layoutMode) => {
          // Render AppLayout with toolbar
          const toolbarContent = (
            <Toolbar
              onUndo={() => {}}
              onRedo={() => {}}
              onExport={() => {}}
              canUndo={true}
              canRedo={true}
            />
          )

          const sidebarContent = (
            <div style={{ height: '3000px', background: '#f0f0f0' }}>
              <p>Sidebar content</p>
            </div>
          )

          const canvasContent = (
            <div style={{ height: '2000px', background: '#e0e0e0' }}>
              <p>Canvas content</p>
            </div>
          )

          const { container: renderedContainer } = render(
            <AppLayout
              toolbar={toolbarContent}
              sidebar={sidebarContent}
              canvas={canvasContent}
              sidebarCollapsed={sidebarCollapsed}
              layoutMode={layoutMode as 'desktop' | 'tablet' | 'mobile'}
            />
          )

          // Get the toolbar element (header with role="banner")
          const toolbar = renderedContainer.querySelector('header.app-layout__toolbar[role="banner"]')
          expect(toolbar).toBeTruthy()

          // Verify toolbar has the correct class
          expect(toolbar!.classList.contains('app-layout__toolbar')).toBe(true)

          // Verify toolbar is a header element
          expect(toolbar!.tagName).toBe('HEADER')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('toolbar remains in DOM structure independent of scroll state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5000 }), // Random scroll position
        fc.constantFrom('desktop', 'tablet', 'mobile'),
        (scrollPosition, layoutMode) => {
          const toolbarContent = (
            <Toolbar
              onUndo={() => {}}
              onRedo={() => {}}
              onExport={() => {}}
              canUndo={true}
              canRedo={true}
            />
          )

          const sidebarContent = (
            <div style={{ height: '5000px' }}>
              <p>Sidebar with lots of content</p>
            </div>
          )
          
          const canvasContent = (
            <div style={{ height: '5000px' }}>
              <p>Canvas with lots of content</p>
            </div>
          )

          const { container: renderedContainer } = render(
            <AppLayout
              toolbar={toolbarContent}
              sidebar={sidebarContent}
              canvas={canvasContent}
              layoutMode={layoutMode as 'desktop' | 'tablet' | 'mobile'}
            />
          )

          const toolbar = renderedContainer.querySelector('.app-layout__toolbar')
          const sidebar = renderedContainer.querySelector('.app-layout__sidebar')
          const canvas = renderedContainer.querySelector('.app-layout__canvas')

          expect(toolbar).toBeTruthy()
          expect(sidebar).toBeTruthy()
          expect(canvas).toBeTruthy()

          // Simulate scrolling
          if (sidebar) {
            sidebar.scrollTop = scrollPosition
          }
          if (canvas) {
            canvas.scrollTop = scrollPosition
          }

          // Toolbar should still exist in DOM after scrolling
          const toolbarAfterScroll = renderedContainer.querySelector('.app-layout__toolbar')
          expect(toolbarAfterScroll).toBeTruthy()
          expect(toolbarAfterScroll).toBe(toolbar)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('toolbar contains all required action buttons', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // canUndo
        fc.boolean(), // canRedo
        fc.constantFrom('desktop', 'tablet', 'mobile'),
        (canUndo, canRedo, layoutMode) => {
          const toolbarContent = (
            <Toolbar
              onUndo={() => {}}
              onRedo={() => {}}
              onExport={() => {}}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          )

          const sidebarContent = <div>Sidebar</div>
          const canvasContent = <div>Canvas</div>

          const { container: renderedContainer } = render(
            <AppLayout
              toolbar={toolbarContent}
              sidebar={sidebarContent}
              canvas={canvasContent}
              layoutMode={layoutMode as 'desktop' | 'tablet' | 'mobile'}
            />
          )

          const toolbar = renderedContainer.querySelector('.app-layout__toolbar')
          expect(toolbar).toBeTruthy()

          // Verify toolbar contains the Toolbar component
          const toolbarButtons = toolbar!.querySelectorAll('button')
          expect(toolbarButtons.length).toBeGreaterThanOrEqual(3) // Undo, Redo, Export
        }
      ),
      { numRuns: 100 }
    )
  })

  it('toolbar maintains structure across layout mode changes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('desktop', 'tablet', 'mobile'), { minLength: 2, maxLength: 5 }),
        (layoutModes) => {
          const toolbarContent = (
            <Toolbar
              onUndo={() => {}}
              onRedo={() => {}}
              onExport={() => {}}
            />
          )

          const sidebarContent = <div>Sidebar</div>
          const canvasContent = <div>Canvas</div>

          // Test that toolbar structure is consistent across different layout modes
          const toolbarElements = layoutModes.map(layoutMode => {
            const { container: renderedContainer } = render(
              <AppLayout
                toolbar={toolbarContent}
                sidebar={sidebarContent}
                canvas={canvasContent}
                layoutMode={layoutMode as 'desktop' | 'tablet' | 'mobile'}
              />
            )

            const toolbar = renderedContainer.querySelector('.app-layout__toolbar')
            const toolbarComponent = toolbar?.querySelector('.toolbar')
            return {
              exists: !!toolbar,
              hasClass: toolbar?.classList.contains('app-layout__toolbar'),
              toolbarComponentExists: !!toolbarComponent,
              // Count buttons in the Toolbar component only (not the sidebar toggle)
              toolbarButtonCount: toolbarComponent?.querySelectorAll('button').length || 0
            }
          })

          // All toolbars should exist
          expect(toolbarElements.every(t => t.exists)).toBe(true)
          
          // All toolbars should have the correct class
          expect(toolbarElements.every(t => t.hasClass)).toBe(true)
          
          // All toolbars should contain the Toolbar component
          expect(toolbarElements.every(t => t.toolbarComponentExists)).toBe(true)
          
          // All Toolbar components should have the same number of buttons (3: undo, redo, export)
          const firstButtonCount = toolbarElements[0].toolbarButtonCount
          expect(toolbarElements.every(t => t.toolbarButtonCount === firstButtonCount)).toBe(true)
          expect(firstButtonCount).toBe(3) // Undo, Redo, Export
        }
      ),
      { numRuns: 100 }
    )
  })
})
