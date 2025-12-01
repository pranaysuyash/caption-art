/**
 * ThemeStorage
 * 
 * Handles persistence of theme preferences to localStorage.
 * Manages saving/loading theme state and custom themes.
 */

import { ThemeConfig, StoredThemeData } from './types'

const STORAGE_KEY = 'caption-art-theme'
const CUSTOM_THEMES_KEY = 'caption-art-custom-themes'

export class ThemeStorage {
  /**
   * Save theme data to localStorage
   */
  save(data: StoredThemeData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        // Storage full - try to clear old data and retry
        this.clearOldCustomThemes(data)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch (retryError) {
          throw new Error('Storage full. Please delete some custom themes.')
        }
      } else if (this.isStorageUnavailable(error)) {
        throw new Error('Theme preferences cannot be saved. Storage unavailable.')
      } else {
        throw error
      }
    }
  }

  /**
   * Load theme data from localStorage
   */
  load(): StoredThemeData | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return null
      }

      const data = JSON.parse(stored)

      // Validate data structure
      if (!this.isValidStoredData(data)) {
        console.warn('Corrupted theme data detected, clearing...')
        this.clear()
        return null
      }

      return data
    } catch (error) {
      console.warn('Failed to load theme data:', error)
      // Clear corrupted data
      this.clear()
      return null
    }
  }

  /**
   * Save a custom theme to localStorage
   */
  saveCustomTheme(theme: ThemeConfig): void {
    try {
      const customThemes = this.loadCustomThemes()
      
      // Check if theme already exists
      const existingIndex = customThemes.findIndex(t => t.id === theme.id)
      
      if (existingIndex >= 0) {
        // Update existing theme
        customThemes[existingIndex] = theme
      } else {
        // Add new theme
        customThemes.push(theme)
      }

      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes))
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        throw new Error('Storage full. Cannot save custom theme.')
      } else if (this.isStorageUnavailable(error)) {
        throw new Error('Storage unavailable. Cannot save custom theme.')
      } else {
        throw error
      }
    }
  }

  /**
   * Load all custom themes from localStorage
   */
  loadCustomThemes(): ThemeConfig[] {
    try {
      const stored = localStorage.getItem(CUSTOM_THEMES_KEY)
      if (!stored) {
        return []
      }

      const themes = JSON.parse(stored)

      // Validate that it's an array
      if (!Array.isArray(themes)) {
        console.warn('Invalid custom themes data, clearing...')
        localStorage.removeItem(CUSTOM_THEMES_KEY)
        return []
      }

      // Filter out invalid themes
      return themes.filter(theme => this.isValidTheme(theme))
    } catch (error) {
      console.warn('Failed to load custom themes:', error)
      localStorage.removeItem(CUSTOM_THEMES_KEY)
      return []
    }
  }

  /**
   * Delete a custom theme from localStorage
   */
  deleteCustomTheme(themeId: string): void {
    try {
      const customThemes = this.loadCustomThemes()
      const filtered = customThemes.filter(t => t.id !== themeId)
      
      if (filtered.length === customThemes.length) {
        // Theme not found
        return
      }

      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.warn('Failed to delete custom theme:', error)
      throw error
    }
  }

  /**
   * Clear all theme data from localStorage
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CUSTOM_THEMES_KEY)
    } catch (error) {
      console.warn('Failed to clear theme data:', error)
    }
  }

  /**
   * Check if error is a quota exceeded error
   */
  private isQuotaExceededError(error: unknown): boolean {
    return (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    )
  }

  /**
   * Check if storage is unavailable
   */
  private isStorageUnavailable(error: unknown): boolean {
    return (
      error instanceof DOMException &&
      (error.name === 'SecurityError' ||
        error.name === 'InvalidAccessError')
    )
  }

  /**
   * Validate stored data structure
   */
  private isValidStoredData(data: any): data is StoredThemeData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.currentThemeId === 'string' &&
      (data.mode === 'light' || data.mode === 'dark') &&
      Array.isArray(data.customThemes) &&
      typeof data.respectSystemPreference === 'boolean' &&
      typeof data.lastUpdated === 'number'
    )
  }

  /**
   * Validate theme structure
   */
  private isValidTheme(theme: any): theme is ThemeConfig {
    return (
      theme &&
      typeof theme === 'object' &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      typeof theme.description === 'string' &&
      (theme.category === 'preset' || theme.category === 'custom') &&
      typeof theme.version === 'string' &&
      theme.colors &&
      theme.typography &&
      theme.spacing &&
      theme.shadows &&
      theme.borders &&
      theme.animations &&
      theme.accessibility
    )
  }

  /**
   * Clear old custom themes to free up space
   */
  private clearOldCustomThemes(data: StoredThemeData): void {
    // Keep only the most recent 5 custom themes
    if (data.customThemes.length > 5) {
      data.customThemes = data.customThemes.slice(-5)
    }
  }
}
