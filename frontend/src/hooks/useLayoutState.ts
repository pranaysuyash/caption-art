import { useState, useEffect, useCallback } from 'react'
import { useMediaQuery, type LayoutMode } from './useMediaQuery'

const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'caption-art:sidebar-collapsed',
  FULLSCREEN_MODE: 'caption-art:fullscreen-mode',
}

export interface LayoutState {
  sidebarCollapsed: boolean
  layoutMode: LayoutMode
  fullscreenMode: boolean
}

export interface UseLayoutStateReturn {
  state: LayoutState
  toggleSidebar: () => void
  toggleFullscreen: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

/**
 * Centralized state management for layout preferences and responsive behavior
 * Manages sidebar collapse state, detects viewport width changes, and persists preferences to localStorage
 */
export function useLayoutState(): UseLayoutStateReturn {
  const layoutMode = useMediaQuery()
  
  // Load initial state from localStorage
  const loadFromStorage = (key: string, defaultValue: boolean): boolean => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, false)
  )
  
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.FULLSCREEN_MODE, false)
  )

  // Store previous sidebar state when entering fullscreen
  const [previousSidebarState, setPreviousSidebarState] = useState<boolean>(false)

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SIDEBAR_COLLAPSED,
        JSON.stringify(sidebarCollapsed)
      )
    } catch (error) {
      console.warn('Failed to persist sidebar state to localStorage:', error)
    }
  }, [sidebarCollapsed])

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.FULLSCREEN_MODE,
        JSON.stringify(fullscreenMode)
      )
    } catch (error) {
      console.warn('Failed to persist fullscreen state to localStorage:', error)
    }
  }, [fullscreenMode])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => !prev)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setFullscreenMode((prev) => {
      if (!prev) {
        // Entering fullscreen - save current sidebar state
        setPreviousSidebarState(sidebarCollapsed)
      } else {
        // Exiting fullscreen - restore previous sidebar state
        setSidebarCollapsedState(previousSidebarState)
      }
      return !prev
    })
  }, [sidebarCollapsed, previousSidebarState])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if event was already handled
      if (event.defaultPrevented) return

      // Ctrl+B (Cmd+B on Mac) to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        toggleSidebar()
      }

      // F key to toggle fullscreen
      if (event.key === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Only if not in an input field
        const target = event.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          toggleFullscreen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar, toggleFullscreen])

  return {
    state: {
      sidebarCollapsed,
      layoutMode,
      fullscreenMode,
    },
    toggleSidebar,
    toggleFullscreen,
    setSidebarCollapsed,
  }
}
