import React, { useEffect, useRef } from 'react'
import './AppLayout.css'

export interface AppLayoutProps {
  toolbar: React.ReactNode
  sidebar: React.ReactNode
  canvas: React.ReactNode
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  layoutMode?: 'desktop' | 'tablet' | 'mobile'
  fullscreenMode?: boolean
}

/**
 * Top-level layout container managing the grid structure and responsive behavior
 * Handles fixed toolbar, sidebar positioning, and canvas area layout
 */
export function AppLayout({
  toolbar,
  sidebar,
  canvas,
  sidebarCollapsed = false,
  onToggleSidebar,
  layoutMode = 'desktop',
  fullscreenMode = false,
}: AppLayoutProps) {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const previousSidebarCollapsed = useRef(sidebarCollapsed)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  const classNames = [
    'app-layout',
    `app-layout--${layoutMode}`,
    sidebarCollapsed && 'app-layout--sidebar-collapsed',
    fullscreenMode && 'app-layout--fullscreen',
  ]
    .filter(Boolean)
    .join(' ')

  // Focus management when sidebar collapses
  useEffect(() => {
    // Only handle focus if sidebar state actually changed
    if (previousSidebarCollapsed.current === sidebarCollapsed) {
      return
    }

    previousSidebarCollapsed.current = sidebarCollapsed

    // If sidebar was collapsed and an element inside it had focus
    if (sidebarCollapsed && sidebarRef.current) {
      const activeElement = document.activeElement as HTMLElement
      
      // Check if the focused element is inside the sidebar
      if (sidebarRef.current.contains(activeElement)) {
        // Move focus to the first focusable element in canvas area
        const canvasArea = canvasRef.current
        if (canvasArea) {
          const focusableElements = canvasArea.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (focusableElements.length > 0) {
            focusableElements[0].focus()
          }
        }
      }
    }
  }, [sidebarCollapsed])

  // Announce layout changes to screen readers
  useEffect(() => {
    if (liveRegionRef.current) {
      if (sidebarCollapsed) {
        liveRegionRef.current.textContent = 'Sidebar collapsed'
      } else {
        liveRegionRef.current.textContent = 'Sidebar expanded'
      }
    }
  }, [sidebarCollapsed])

  useEffect(() => {
    if (liveRegionRef.current) {
      if (fullscreenMode) {
        liveRegionRef.current.textContent = 'Entered fullscreen mode'
      } else {
        liveRegionRef.current.textContent = 'Exited fullscreen mode'
      }
    }
  }, [fullscreenMode])

  return (
    <div
      className={classNames}
      role="application"
      aria-label="Caption Art Editor"
    >
      {/* Screen reader announcements for layout changes */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      <header className="app-layout__toolbar" role="banner" aria-label="Toolbar">
        {toolbar}
        {layoutMode === 'mobile' && (
          <button
            className="app-layout__sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            aria-expanded={!sidebarCollapsed}
            aria-controls="app-sidebar"
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
        )}
      </header>

      <div className="app-layout__content">
        {!fullscreenMode && !(layoutMode === 'mobile' && sidebarCollapsed) && (
          <div
            ref={sidebarRef}
            id="app-sidebar"
            className="app-layout__sidebar"
            aria-hidden={sidebarCollapsed}
          >
            {sidebar}
          </div>
        )}

        <div ref={canvasRef} className="app-layout__canvas">
          {canvas}
        </div>
      </div>
    </div>
  )
}
