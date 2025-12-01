/**
 * Unit Tests for ThemeStorage
 * 
 * Tests error handling and edge cases for theme storage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ThemeStorage } from './themeStorage'
import { StoredThemeData, ThemeConfig } from './types'
import { themePresets } from './presets'

describe('ThemeStorage Unit Tests', () => {
  let storage: ThemeStorage

  beforeEach(() => {
    localStorage.clear()
    storage = new ThemeStorage()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('Error Handling', () => {
    it('should handle storage unavailable error', () => {
      // Mock localStorage.setItem to throw SecurityError
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        const error = new DOMException('Security error', 'SecurityError')
        throw error
      })

      const data: StoredThemeData = {
        currentThemeId: 'neobrutalism',
        mode: 'light',
        customThemes: [],
        respectSystemPreference: true,
        lastUpdated: Date.now()
      }

      // Should throw error about storage unavailable
      expect(() => storage.save(data)).toThrow('Theme preferences cannot be saved. Storage unavailable.')
    })

    it('should handle storage full error with retry', () => {
      let callCount = 0
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      
      setItemSpy.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call throws QuotaExceededError
          const error = new DOMException('Quota exceeded', 'QuotaExceededError')
          throw error
        }
        // Second call succeeds (after clearing old themes)
        return undefined
      })

      const data: StoredThemeData = {
        currentThemeId: 'neobrutalism',
        mode: 'light',
        customThemes: Array(10).fill(null).map((_, i) => ({
          id: `theme-${i}`,
          name: `Theme ${i}`,
          description: 'Test theme',
          category: 'custom' as const,
          version: '1.0.0',
          colors: themePresets[0].colors,
          typography: themePresets[0].typography,
          spacing: themePresets[0].spacing,
          shadows: themePresets[0].shadows,
          borders: themePresets[0].borders,
          animations: themePresets[0].animations,
          accessibility: themePresets[0].accessibility
        })),
        respectSystemPreference: true,
        lastUpdated: Date.now()
      }

      // Should succeed after retry (clearing old themes)
      expect(() => storage.save(data)).not.toThrow()
      expect(callCount).toBe(2)
    })

    it('should throw error when storage full and retry fails', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      
      setItemSpy.mockImplementation(() => {
        // Always throw QuotaExceededError
        const error = new DOMException('Quota exceeded', 'QuotaExceededError')
        throw error
      })

      const data: StoredThemeData = {
        currentThemeId: 'neobrutalism',
        mode: 'light',
        customThemes: [],
        respectSystemPreference: true,
        lastUpdated: Date.now()
      }

      // Should throw error about storage full
      expect(() => storage.save(data)).toThrow('Storage full. Please delete some custom themes.')
    })

    it('should handle corrupted data gracefully', () => {
      // Save corrupted data directly to localStorage
      localStorage.setItem('caption-art-theme', 'invalid json {')

      // Should return null and clear corrupted data
      const loaded = storage.load()
      expect(loaded).toBeNull()

      // Corrupted data should be cleared
      const stored = localStorage.getItem('caption-art-theme')
      expect(stored).toBeNull()
    })

    it('should handle invalid data structure', () => {
      // Save invalid data structure
      localStorage.setItem('caption-art-theme', JSON.stringify({
        currentThemeId: 'test',
        // Missing required fields
      }))

      // Should return null and clear invalid data
      const loaded = storage.load()
      expect(loaded).toBeNull()
    })

    it('should handle corrupted custom themes data', () => {
      // Save corrupted custom themes data
      localStorage.setItem('caption-art-custom-themes', 'invalid json {')

      // Should return empty array and clear corrupted data
      const loaded = storage.loadCustomThemes()
      expect(loaded).toEqual([])

      // Corrupted data should be cleared
      const stored = localStorage.getItem('caption-art-custom-themes')
      expect(stored).toBeNull()
    })

    it('should filter out invalid custom themes', () => {
      // Save mix of valid and invalid themes
      const themes = [
        {
          id: 'valid-theme',
          name: 'Valid Theme',
          description: 'A valid theme',
          category: 'custom',
          version: '1.0.0',
          colors: themePresets[0].colors,
          typography: themePresets[0].typography,
          spacing: themePresets[0].spacing,
          shadows: themePresets[0].shadows,
          borders: themePresets[0].borders,
          animations: themePresets[0].animations,
          accessibility: themePresets[0].accessibility
        },
        {
          id: 'invalid-theme',
          // Missing required fields
        },
        {
          id: 'another-valid',
          name: 'Another Valid',
          description: 'Another valid theme',
          category: 'custom',
          version: '1.0.0',
          colors: themePresets[0].colors,
          typography: themePresets[0].typography,
          spacing: themePresets[0].spacing,
          shadows: themePresets[0].shadows,
          borders: themePresets[0].borders,
          animations: themePresets[0].animations,
          accessibility: themePresets[0].accessibility
        }
      ]

      localStorage.setItem('caption-art-custom-themes', JSON.stringify(themes))

      // Should only load valid themes
      const loaded = storage.loadCustomThemes()
      expect(loaded).toHaveLength(2)
      expect(loaded[0].id).toBe('valid-theme')
      expect(loaded[1].id).toBe('another-valid')
    })

    it('should handle non-array custom themes data', () => {
      // Save non-array data
      localStorage.setItem('caption-art-custom-themes', JSON.stringify({ not: 'an array' }))

      // Should return empty array and clear invalid data
      const loaded = storage.loadCustomThemes()
      expect(loaded).toEqual([])

      // Invalid data should be cleared
      const stored = localStorage.getItem('caption-art-custom-themes')
      expect(stored).toBeNull()
    })

    it('should handle storage full when saving custom theme', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      
      setItemSpy.mockImplementation(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError')
        throw error
      })

      const theme: ThemeConfig = {
        id: 'test-theme',
        name: 'Test Theme',
        description: 'A test theme',
        category: 'custom',
        version: '1.0.0',
        colors: themePresets[0].colors,
        typography: themePresets[0].typography,
        spacing: themePresets[0].spacing,
        shadows: themePresets[0].shadows,
        borders: themePresets[0].borders,
        animations: themePresets[0].animations,
        accessibility: themePresets[0].accessibility
      }

      // Should throw error about storage full
      expect(() => storage.saveCustomTheme(theme)).toThrow('Storage full. Cannot save custom theme.')
    })

    it('should handle storage unavailable when saving custom theme', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      
      setItemSpy.mockImplementation(() => {
        const error = new DOMException('Security error', 'SecurityError')
        throw error
      })

      const theme: ThemeConfig = {
        id: 'test-theme',
        name: 'Test Theme',
        description: 'A test theme',
        category: 'custom',
        version: '1.0.0',
        colors: themePresets[0].colors,
        typography: themePresets[0].typography,
        spacing: themePresets[0].spacing,
        shadows: themePresets[0].shadows,
        borders: themePresets[0].borders,
        animations: themePresets[0].animations,
        accessibility: themePresets[0].accessibility
      }

      // Should throw error about storage unavailable
      expect(() => storage.saveCustomTheme(theme)).toThrow('Storage unavailable. Cannot save custom theme.')
    })

    it('should handle deletion errors gracefully', () => {
      // Mock removeItem to throw error
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
      removeItemSpy.mockImplementation(() => {
        throw new Error('Delete failed')
      })

      // Should not throw when clearing
      expect(() => storage.clear()).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty theme ID in deletion', () => {
      // Should not throw
      expect(() => storage.deleteCustomTheme('')).not.toThrow()
    })

    it('should handle deletion of non-existent theme', () => {
      // Should not throw
      expect(() => storage.deleteCustomTheme('non-existent')).not.toThrow()
    })

    it('should handle loading when no data exists', () => {
      const loaded = storage.load()
      expect(loaded).toBeNull()
    })

    it('should handle loading custom themes when none exist', () => {
      const loaded = storage.loadCustomThemes()
      expect(loaded).toEqual([])
    })

    it('should clear old custom themes when storage is full', () => {
      let callCount = 0
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      
      setItemSpy.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          const error = new DOMException('Quota exceeded', 'QuotaExceededError')
          throw error
        }
        return undefined
      })

      // Create data with many custom themes
      const data: StoredThemeData = {
        currentThemeId: 'neobrutalism',
        mode: 'light',
        customThemes: Array(10).fill(null).map((_, i) => ({
          id: `theme-${i}`,
          name: `Theme ${i}`,
          description: 'Test theme',
          category: 'custom' as const,
          version: '1.0.0',
          colors: themePresets[0].colors,
          typography: themePresets[0].typography,
          spacing: themePresets[0].spacing,
          shadows: themePresets[0].shadows,
          borders: themePresets[0].borders,
          animations: themePresets[0].animations,
          accessibility: themePresets[0].accessibility
        })),
        respectSystemPreference: true,
        lastUpdated: Date.now()
      }

      // Should succeed after clearing old themes
      storage.save(data)

      // Verify it was called twice (first failed, second succeeded)
      expect(callCount).toBe(2)
    })
  })
})
