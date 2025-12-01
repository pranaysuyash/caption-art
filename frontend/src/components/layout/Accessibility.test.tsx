/**
 * Accessibility Tests for Layout Components
 * Tests keyboard accessibility, tab order, ARIA labels, and focus management
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppLayout } from './AppLayout'
import { Sidebar } from './Sidebar'
import { CanvasArea } from './CanvasArea'

describe('Accessibility Tests', () => {
  describe('ARIA Labels - Requirements 11.1, 11.4', () => {
    it('should have ARIA labels on all layout regions', () => {
      const { container } = render(
        <AppLayout
          toolbar={<div>Toolbar</div>}
          sidebar={<div>Sidebar</div>}
          canvas={<CanvasArea canvas={<div>Canvas</div>} />}
        />
      )

      // Check application role and label
      const app = container.querySelector('[role="application"]')
      expect(app).toBeTruthy()
      expect(app?.getAttribute('aria-label')).toBe('Caption Art Editor')

      // Check toolbar region
      const toolbar = screen.getByRole('banner')
      expect(toolbar.getAttribute('aria-label')).toBe('Toolbar')

      // Check main canvas area
      const main = screen.getByRole('main')
      expect(main.getAttribute('aria-label')).toBe('Canvas Area')
    })

    it('should have ARIA label on sidebar', () => {
      render(
        <Sidebar
          sections={[
            { id: 'test', title: 'Test Section', content: <div>Content</div>, visible: true }
          ]}
        />
      )

      const sidebar = screen.getByRole('complementary')
      expect(sidebar.getAttribute('aria-label')).toBe('Control Panel')
    })

    it('should have aria-expanded on sidebar toggle button', () => {
      const onToggle = vi.fn()
      render(
        <AppLayout
          toolbar={<div>Toolbar</div>}
          sidebar={<div>Sidebar</div>}
          canvas={<div>Canvas</div>}
          layoutMode="mobile"
          sidebarCollapsed={false}
          onToggleSidebar={onToggle}
        />
      )

      const toggleButton = screen.getByLabelText('Hide sidebar')
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true')
    })

    it('should update aria-expanded when sidebar is collapsed', () => {
      const onToggle = vi.fn()
      render(
        <AppLayout
          toolbar={<div>Toolbar</div>}
          sidebar={<div>Sidebar</div>}
          canvas={<div>Canvas</div>}
          layoutMode="mobile"
          sidebarCollapsed={true}
          onToggleSidebar={onToggle}
        />
      )

      const toggleButton = screen.getByLabelText('Show sidebar')
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false')
    })
  })

  describe('Keyboard Accessibility - Requirements 11.1, 11.2', () => {
    it('should make all interactive elements keyboard accessible', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()

      render(
        <AppLayout
          toolbar={
            <div>
              <button>Button 1</button>
              <button>Button 2</button>
            </div>
          }
          sidebar={
            <div>
              <button>Sidebar Button</button>
            </div>
          }
          canvas={
            <div>
              <button>Canvas Button</button>
            </div>
          }
          layoutMode="mobile"
          onToggleSidebar={onToggle}
        />
      )

      // Tab through all interactive elements
      await user.tab()
      expect(document.activeElement?.textContent).toContain('Button 1')

      await user.tab()
      expect(document.activeElement?.textContent).toContain('Button 2')

      await user.tab()
      // Should reach sidebar toggle button
      expect(document.activeElement?.getAttribute('aria-label')).toMatch(/sidebar/)

      await user.tab()
      expect(document.activeElement?.textContent).toContain('Sidebar Button')

      await user.tab()
      expect(document.activeElement?.textContent).toContain('Canvas Button')
    })

    it('should allow keyboard activation of sidebar toggle', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()

      render(
        <AppLayout
          toolbar={<div>Toolbar</div>}
          sidebar={<div>Sidebar</div>}
          canvas={<div>Canvas</div>}
          layoutMode="mobile"
          onToggleSidebar={onToggle}
        />
      )

      const toggleButton = screen.getByLabelText(/sidebar/)
      toggleButton.focus()
      
      await user.keyboard('{Enter}')
      expect(onToggle).toHaveBeenCalledTimes(1)

      await user.keyboard(' ')
      expect(onToggle).toHaveBeenCalledTimes(2)
    })
  })

  describe('Tab Order - Requirements 11.2', () => {
    it('should follow logical tab order: Toolbar → Sidebar → Canvas', async () => {
      const user = userEvent.setup()

      render(
        <AppLayout
          toolbar={
            <div>
              <button data-testid="toolbar-btn">Toolbar Button</button>
            </div>
          }
          sidebar={
            <Sidebar
              sections={[
                {
                  id: 'test',
                  title: 'Test',
                  content: <button data-testid="sidebar-btn">Sidebar Button</button>,
                  visible: true
                }
              ]}
            />
          }
          canvas={
            <CanvasArea
              canvas={<button data-testid="canvas-btn">Canvas Button</button>}
            />
          }
        />
      )

      // Start tabbing from the beginning
      await user.tab()
      expect(screen.getByTestId('toolbar-btn')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('sidebar-btn')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('canvas-btn')).toHaveFocus()
    })

    it('should skip sidebar in tab order when collapsed on mobile', async () => {
      const user = userEvent.setup()

      const { container } = render(
        <AppLayout
          toolbar={
            <div>
              <button data-testid="toolbar-btn">Toolbar Button</button>
            </div>
          }
          sidebar={
            <Sidebar
              sections={[
                {
                  id: 'test',
                  title: 'Test',
                  content: <button data-testid="sidebar-btn">Sidebar Button</button>,
                  visible: true
                }
              ]}
            />
          }
          canvas={
            <CanvasArea
              canvas={<button data-testid="canvas-btn">Canvas Button</button>}
            />
          }
          layoutMode="mobile"
          sidebarCollapsed={true}
        />
      )

      // Sidebar should not be rendered when collapsed on mobile
      const sidebar = container.querySelector('.app-layout__sidebar')
      expect(sidebar).toBeNull()
      
      // Sidebar button should not be in document
      expect(screen.queryByTestId('sidebar-btn')).not.toBeInTheDocument()

      await user.tab()
      expect(screen.getByTestId('toolbar-btn')).toHaveFocus()

      await user.tab()
      // On mobile, there's a sidebar toggle button
      expect(screen.getByLabelText('Show sidebar')).toHaveFocus()

      await user.tab()
      // Should skip to canvas, bypassing hidden sidebar content
      expect(screen.getByTestId('canvas-btn')).toHaveFocus()
    })
  })

  describe('Focus Management - Requirements 11.3', () => {
    it('should handle focus when sidebar collapses', () => {
      const { rerender } = render(
        <AppLayout
          toolbar={
            <div>
              <button data-testid="toolbar-btn">Toolbar Button</button>
            </div>
          }
          sidebar={
            <Sidebar
              sections={[
                {
                  id: 'test',
                  title: 'Test',
                  content: <button data-testid="sidebar-btn">Sidebar Button</button>,
                  visible: true
                }
              ]}
            />
          }
          canvas={
            <CanvasArea
              canvas={<button data-testid="canvas-btn">Canvas Button</button>}
            />
          }
          sidebarCollapsed={false}
        />
      )

      // Focus on sidebar button
      const sidebarBtn = screen.getByTestId('sidebar-btn')
      sidebarBtn.focus()
      expect(sidebarBtn).toHaveFocus()

      // Collapse sidebar
      rerender(
        <AppLayout
          toolbar={
            <div>
              <button data-testid="toolbar-btn">Toolbar Button</button>
            </div>
          }
          sidebar={
            <Sidebar
              sections={[
                {
                  id: 'test',
                  title: 'Test',
                  content: <button data-testid="sidebar-btn">Sidebar Button</button>,
                  visible: true
                }
              ]}
            />
          }
          canvas={
            <CanvasArea
              canvas={<button data-testid="canvas-btn">Canvas Button</button>}
            />
          }
          sidebarCollapsed={true}
        />
      )

      // Sidebar button is still in document but hidden
      const collapsedSidebarBtn = screen.queryByTestId('sidebar-btn')
      expect(collapsedSidebarBtn).toBeInTheDocument()
      
      // Focus should have moved to canvas button
      expect(screen.getByTestId('canvas-btn')).toHaveFocus()
    })

    it('should maintain focus on canvas when sidebar toggles', () => {
      const { rerender } = render(
        <AppLayout
          toolbar={<div>Toolbar</div>}
          sidebar={<div>Sidebar</div>}
          canvas={
            <CanvasArea
              canvas={<button data-testid="canvas-btn">Canvas Button</button>}
            />
          }
          sidebarCollapsed={false}
        />
      )

      const canvasBtn = screen.getByTestId('canvas-btn')
      canvasBtn.focus()
      expect(canvasBtn).toHaveFocus()

      // Toggle sidebar
      rerender(
        <AppLayout
          toolbar={<div>Toolbar</div>}
          sidebar={<div>Sidebar</div>}
          canvas={
            <CanvasArea
              canvas={<button data-testid="canvas-btn">Canvas Button</button>}
            />
          }
          sidebarCollapsed={true}
        />
      )

      // Canvas button should still have focus
      expect(canvasBtn).toHaveFocus()
    })
  })

  describe('ARIA Live Regions - Requirements 11.5', () => {
    it('should have aria-live on loading states', () => {
      render(
        <Sidebar
          sections={[
            {
              id: 'test',
              title: 'Test',
              content: <div>Content</div>,
              visible: true,
              loading: true
            }
          ]}
        />
      )

      const loadingElement = screen.getByText('Loading...')
      expect(loadingElement.getAttribute('aria-live')).toBe('polite')
    })

    it('should have role="alert" on error messages', () => {
      render(
        <Sidebar
          sections={[
            {
              id: 'test',
              title: 'Test',
              content: <div>Content</div>,
              visible: true,
              error: 'Something went wrong'
            }
          ]}
        />
      )

      const errorElement = screen.getByText('Something went wrong')
      expect(errorElement.getAttribute('role')).toBe('alert')
    })

    it('should have aria-live on canvas loading overlay', () => {
      render(
        <CanvasArea
          canvas={<div>Canvas</div>}
          loading={true}
          loadingMessage="Processing image..."
        />
      )

      const loadingOverlay = screen.getByText('Processing image...').parentElement
      expect(loadingOverlay?.getAttribute('aria-live')).toBe('polite')
    })
  })

  describe('Semantic HTML - Requirements 11.1', () => {
    it('should use semantic HTML elements', () => {
      const { container } = render(
        <AppLayout
          toolbar={<div>Toolbar</div>}
          sidebar={<div>Sidebar</div>}
          canvas={<div>Canvas</div>}
        />
      )

      // Should have header element
      expect(container.querySelector('header')).toBeTruthy()

      // Should have aside element (from Sidebar)
      render(
        <Sidebar
          sections={[
            { id: 'test', title: 'Test', content: <div>Content</div>, visible: true }
          ]}
        />
      )
      expect(screen.getByRole('complementary').tagName).toBe('ASIDE')

      // Should have main element (from CanvasArea)
      render(<CanvasArea canvas={<div>Canvas</div>} />)
      expect(screen.getByRole('main').tagName).toBe('MAIN')
    })

    it('should use section elements in sidebar', () => {
      const { container } = render(
        <Sidebar
          sections={[
            { id: 'test1', title: 'Test 1', content: <div>Content 1</div>, visible: true },
            { id: 'test2', title: 'Test 2', content: <div>Content 2</div>, visible: true }
          ]}
        />
      )

      const sections = container.querySelectorAll('section')
      expect(sections.length).toBe(2)
    })

    it('should use heading elements for section titles', () => {
      render(
        <Sidebar
          sections={[
            { id: 'test', title: 'Test Section', content: <div>Content</div>, visible: true }
          ]}
        />
      )

      const heading = screen.getByRole('heading', { name: 'Test Section' })
      expect(heading.tagName).toBe('H2')
    })
  })
})
