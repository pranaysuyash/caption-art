/**
 * ThemeSelector Component
 * 
 * Displays all available themes (presets + custom) and allows users to select one.
 * Shows theme previews and handles theme selection.
 * 
 * Requirements: 1.1, 13.1
 */

import { useState, useEffect } from 'react'
import { getThemeManager } from '../lib/themes/themeManager'
import { ThemeConfig } from '../lib/themes/types'
import { ThemePreview } from './ThemePreview'
import './ThemeSelector.css'

export function ThemeSelector() {
  const [themes, setThemes] = useState<ThemeConfig[]>([])
  const [currentThemeId, setCurrentThemeId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const manager = getThemeManager()
    
    // Load initial themes
    setThemes(manager.getAvailableThemes())
    setCurrentThemeId(manager.getState().currentTheme)

    // Subscribe to theme changes
    const unsubscribe = manager.subscribeToChanges((state) => {
      setThemes(manager.getAvailableThemes())
      setCurrentThemeId(state.currentTheme)
    })

    return unsubscribe
  }, [])

  const handleThemeSelect = async (themeId: string) => {
    try {
      const manager = getThemeManager()
      await manager.setTheme(themeId)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to apply theme:', error)
    }
  }

  const currentTheme = themes.find(t => t.id === currentThemeId)

  return (
    <div className="theme-selector">
      <button
        className="theme-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
        aria-expanded={isOpen}
      >
        <span className="theme-selector-label">Theme:</span>
        <span className="theme-selector-current">{currentTheme?.name || 'Select Theme'}</span>
        <span className="theme-selector-icon" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="theme-selector-dropdown">
          <div className="theme-selector-header">
            <h3>Choose a Theme</h3>
            <button
              className="theme-selector-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close theme selector"
            >
              ✕
            </button>
          </div>

          <div className="theme-selector-presets">
            <h4>Preset Themes</h4>
            <div className="theme-selector-grid">
              {themes
                .filter(theme => theme.category === 'preset')
                .map(theme => (
                  <ThemePreview
                    key={theme.id}
                    theme={theme}
                    isActive={theme.id === currentThemeId}
                    onSelect={() => handleThemeSelect(theme.id)}
                  />
                ))}
            </div>
          </div>

          {themes.some(t => t.category === 'custom') && (
            <div className="theme-selector-custom">
              <h4>Custom Themes</h4>
              <div className="theme-selector-grid">
                {themes
                  .filter(theme => theme.category === 'custom')
                  .map(theme => (
                    <ThemePreview
                      key={theme.id}
                      theme={theme}
                      isActive={theme.id === currentThemeId}
                      onSelect={() => handleThemeSelect(theme.id)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
