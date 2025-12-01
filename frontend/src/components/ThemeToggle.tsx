/**
 * ThemeToggle Component
 * 
 * Provides a button to toggle between light and dark mode.
 * Shows current mode and animates mode changes.
 * 
 * Requirements: 6.1, 6.5
 */

import { useState, useEffect } from 'react'
import { getThemeManager } from '../lib/themes/themeManager'
import './ThemeToggle.css'

export function ThemeToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const manager = getThemeManager()
    
    // Get initial mode
    setMode(manager.getState().mode)

    // Subscribe to mode changes
    const unsubscribe = manager.subscribeToChanges((state) => {
      setMode(state.mode)
    })

    return unsubscribe
  }, [])

  const handleToggle = () => {
    const manager = getThemeManager()
    
    // Trigger animation
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    // Toggle mode
    manager.toggleMode()
  }

  return (
    <button
      className={`theme-toggle ${isAnimating ? 'theme-toggle--animating' : ''}`}
      onClick={handleToggle}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="theme-toggle-icon theme-toggle-icon--sun" aria-hidden="true">
        ☀️
      </span>
      <span className="theme-toggle-icon theme-toggle-icon--moon" aria-hidden="true">
        🌙
      </span>
      <span className="theme-toggle-label">
        {mode === 'light' ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}
