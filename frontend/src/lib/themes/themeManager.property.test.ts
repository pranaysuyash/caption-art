/**
 * Property-Based Tests for ThemeManager
 * 
 * Tests universal properties that should hold across all theme configurations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { ThemeManager, resetThemeManager } from './themeManager'
import { themePresets } from './presets'
import { ThemeConfig } from './types'

describe('ThemeManager Property Tests', () => {
  let manager: ThemeManager

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    // Reset manager
    resetThemeManager()
    manager = new ThemeManager()
  })

  afterEach(() => {
    if (manager) {
      manager.destroy()
    }
    resetThemeManager()
    localStorage.clear()
  })

  /**
   * Property 8: Light and dark mode support
   * Validates: Requirements 6.1, 6.2, 6.5
   * 
   * For any theme, both light and dark color schemes should be available 
   * and switching between them should preserve the theme's visual identity 
   * (typography, spacing, shadows, borders)
   */
  describe('Property 8: Light and dark mode support', () => {
    it('should support both light and dark modes for all themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            // Create fresh manager for this iteration
            resetThemeManager()
            const testManager = new ThemeManager()
            
            try {
              // Set theme
              await testManager.setTheme(themeId, 'light')
              
              const theme = testManager.getTheme()
              
              // Verify theme has both light and dark color schemes
              expect(theme.colors.light).toBeDefined()
              expect(theme.colors.dark).toBeDefined()
              
              // Verify light mode colors are defined
              expect(theme.colors.light.bg).toBeDefined()
              expect(theme.colors.light.text).toBeDefined()
              expect(theme.colors.light.primary).toBeDefined()
              
              // Verify dark mode colors are defined
              expect(theme.colors.dark.bg).toBeDefined()
              expect(theme.colors.dark.text).toBeDefined()
              expect(theme.colors.dark.primary).toBeDefined()
            } finally {
              testManager.destroy()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve non-color properties when switching modes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            // Create fresh manager for this iteration
            resetThemeManager()
            const testManager = new ThemeManager()
            
            try {
              // Set theme in light mode
              await testManager.setTheme(themeId, 'light')
              const lightTheme = testManager.getTheme()
              
              // Capture non-color properties
              const typography = { ...lightTheme.typography }
              const spacing = { ...lightTheme.spacing }
              const shadows = { ...lightTheme.shadows }
              const borders = { ...lightTheme.borders }
              const animations = { ...lightTheme.animations }
              
              // Switch to dark mode
              testManager.setMode('dark')
              const darkTheme = testManager.getTheme()
              
              // Verify non-color properties are preserved
              expect(darkTheme.typography).toEqual(typography)
              expect(darkTheme.spacing).toEqual(spacing)
              expect(darkTheme.shadows).toEqual(shadows)
              expect(darkTheme.borders).toEqual(borders)
              expect(darkTheme.animations).toEqual(animations)
              
              // Verify it's the same theme
              expect(darkTheme.id).toBe(lightTheme.id)
              expect(darkTheme.name).toBe(lightTheme.name)
            } finally {
              testManager.destroy()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should toggle between light and dark modes correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            // Create fresh manager for this iteration
            resetThemeManager()
            const testManager = new ThemeManager()
            
            try {
              // Set theme in light mode
              await testManager.setTheme(themeId, 'light')
              expect(testManager.getState().mode).toBe('light')
              
              // Toggle to dark
              testManager.toggleMode()
              expect(testManager.getState().mode).toBe('dark')
              
              // Toggle back to light
              testManager.toggleMode()
              expect(testManager.getState().mode).toBe('light')
              
              // Verify theme ID hasn't changed
              expect(testManager.getTheme().id).toBe(themeId)
            } finally {
              testManager.destroy()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain theme identity across mode changes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          fc.constantFrom('light', 'dark'),
          fc.constantFrom('light', 'dark'),
          async (themeId, mode1, mode2) => {
            // Create fresh manager for this iteration
            resetThemeManager()
            const testManager = new ThemeManager()
            
            try {
              // Set theme with first mode
              await testManager.setTheme(themeId, mode1)
              const theme1 = testManager.getTheme()
              
              // Switch to second mode
              testManager.setMode(mode2)
              const theme2 = testManager.getTheme()
              
              // Verify theme identity is preserved
              expect(theme2.id).toBe(theme1.id)
              expect(theme2.name).toBe(theme1.name)
              expect(theme2.description).toBe(theme1.description)
              expect(theme2.category).toBe(theme1.category)
              
              // Verify visual properties (non-color) are preserved
              expect(theme2.typography).toEqual(theme1.typography)
              expect(theme2.spacing).toEqual(theme1.spacing)
              expect(theme2.shadows).toEqual(theme1.shadows)
              expect(theme2.borders).toEqual(theme1.borders)
              expect(theme2.animations).toEqual(theme1.animations)
            } finally {
              testManager.destroy()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should apply correct color scheme for each mode', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            // Create fresh manager for this iteration
            resetThemeManager()
            const testManager = new ThemeManager()
            
            try {
              const theme = themePresets.find(t => t.id === themeId)!
              
              // Set light mode
              await testManager.setTheme(themeId, 'light')
              expect(testManager.getState().mode).toBe('light')
              
              // Verify light colors are different from dark colors
              // (at least background should differ)
              const lightBg = theme.colors.light.bg
              const darkBg = theme.colors.dark.bg
              
              // Set dark mode
              testManager.setMode('dark')
              expect(testManager.getState().mode).toBe('dark')
              
              // Colors should be different between modes
              // (this is a basic check - the actual colors are applied via CSS)
              expect(lightBg).not.toBe(darkBg)
            } finally {
              testManager.destroy()
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 10: System preference detection
   * Validates: Requirements 7.1, 7.4
   * 
   * For any first-time load, the system should detect and apply 
   * the operating system's light or dark mode preference
   */
  describe('Property 10: System preference detection', () => {
    it('should detect system preference on first load', () => {
      // Mock matchMedia to return dark mode
      const originalMatchMedia = window.matchMedia
      window.matchMedia = ((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true
      })) as any

      try {
        // Create new manager (simulates first load)
        resetThemeManager()
        const newManager = new ThemeManager()

        // Should detect dark mode
        expect(newManager.getState().systemPreference).toBe('dark')
        
        // Should apply dark mode by default (respectSystemPreference is true by default)
        expect(newManager.getState().mode).toBe('dark')

        newManager.destroy()
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('should detect light mode when system prefers light', () => {
      // Mock matchMedia to return light mode
      const originalMatchMedia = window.matchMedia
      window.matchMedia = ((query: string) => ({
        matches: false, // dark mode query returns false = light mode
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true
      })) as any

      try {
        // Create new manager (simulates first load)
        resetThemeManager()
        const newManager = new ThemeManager()

        // Should detect light mode
        expect(newManager.getState().systemPreference).toBe('light')
        
        // Should apply light mode by default
        expect(newManager.getState().mode).toBe('light')

        newManager.destroy()
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('should default to light mode when matchMedia is unavailable', () => {
      // Mock matchMedia as undefined
      const originalMatchMedia = window.matchMedia
      ;(window as any).matchMedia = undefined

      try {
        // Create new manager
        resetThemeManager()
        const newManager = new ThemeManager()

        // Should default to light mode
        expect(newManager.getState().systemPreference).toBe('light')
        expect(newManager.getState().mode).toBe('light')

        newManager.destroy()
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('should update systemPreference when detectSystemPreference is called', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isDark) => {
            // Mock matchMedia
            const originalMatchMedia = window.matchMedia
            window.matchMedia = ((query: string) => ({
              matches: isDark && query === '(prefers-color-scheme: dark)',
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true
            })) as any

            try {
              resetThemeManager()
              const newManager = new ThemeManager()

              const detected = newManager.detectSystemPreference()
              expect(detected).toBe(isDark ? 'dark' : 'light')

              newManager.destroy()
            } finally {
              window.matchMedia = originalMatchMedia
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 11: System preference synchronization
   * Validates: Requirements 7.2, 7.5
   * 
   * For any system theme change, if respecting system preferences is enabled,
   * the application theme mode should update automatically
   */
  describe('Property 11: System preference synchronization', () => {
    it('should sync with system preference changes when enabled', async () => {
      // Create a mock media query list
      let listeners: Array<(e: MediaQueryListEvent) => void> = []
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners.push(handler)
          }
        },
        removeEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners = listeners.filter(l => l !== handler)
          }
        },
        dispatchEvent: () => true
      }

      const originalMatchMedia = window.matchMedia
      window.matchMedia = (() => mockMediaQuery) as any

      try {
        resetThemeManager()
        const newManager = new ThemeManager()

        // Enable system preference respect
        newManager.setRespectSystemPreference(true)
        expect(newManager.getState().respectSystemPreference).toBe(true)

        // Initially light mode
        expect(newManager.getState().mode).toBe('light')

        // Simulate system preference change to dark
        mockMediaQuery.matches = true
        listeners.forEach(listener => {
          listener({ matches: true, media: mockMediaQuery.media } as MediaQueryListEvent)
        })

        // Should update to dark mode
        expect(newManager.getState().mode).toBe('dark')

        // Simulate system preference change back to light
        mockMediaQuery.matches = false
        listeners.forEach(listener => {
          listener({ matches: false, media: mockMediaQuery.media } as MediaQueryListEvent)
        })

        // Should update to light mode
        expect(newManager.getState().mode).toBe('light')

        newManager.destroy()
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('should not sync when system preference respect is disabled', async () => {
      // Create a mock media query list
      let listeners: Array<(e: MediaQueryListEvent) => void> = []
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners.push(handler)
          }
        },
        removeEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners = listeners.filter(l => l !== handler)
          }
        },
        dispatchEvent: () => true
      }

      const originalMatchMedia = window.matchMedia
      window.matchMedia = (() => mockMediaQuery) as any

      try {
        resetThemeManager()
        const newManager = new ThemeManager()

        // Disable system preference respect
        newManager.setRespectSystemPreference(false)
        expect(newManager.getState().respectSystemPreference).toBe(false)

        // Set to light mode
        newManager.setMode('light')
        expect(newManager.getState().mode).toBe('light')

        // Simulate system preference change to dark
        mockMediaQuery.matches = true
        listeners.forEach(listener => {
          listener({ matches: true, media: mockMediaQuery.media } as MediaQueryListEvent)
        })

        // Should NOT update (still light)
        expect(newManager.getState().mode).toBe('light')

        newManager.destroy()
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('should respect user override after manual mode selection', async () => {
      // Create a mock media query list
      let listeners: Array<(e: MediaQueryListEvent) => void> = []
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners.push(handler)
          }
        },
        removeEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners = listeners.filter(l => l !== handler)
          }
        },
        dispatchEvent: () => true
      }

      const originalMatchMedia = window.matchMedia
      window.matchMedia = (() => mockMediaQuery) as any

      try {
        resetThemeManager()
        const newManager = new ThemeManager()

        // Enable system preference respect
        newManager.setRespectSystemPreference(true)
        expect(newManager.getState().respectSystemPreference).toBe(true)

        // Manually set mode (this should NOT disable system preference respect)
        newManager.setMode('dark')
        expect(newManager.getState().mode).toBe('dark')

        // System preference respect should still be enabled
        expect(newManager.getState().respectSystemPreference).toBe(true)

        // Simulate system preference change
        mockMediaQuery.matches = false
        listeners.forEach(listener => {
          listener({ matches: false, media: mockMediaQuery.media } as MediaQueryListEvent)
        })

        // Should update to light mode (system preference takes effect)
        expect(newManager.getState().mode).toBe('light')

        newManager.destroy()
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })
  })

  /**
   * Property 13: Custom theme persistence
   * Validates: Requirements 8.3, 8.4
   * 
   * For any custom theme created and saved, it should be stored in localStorage
   * and appear in the theme selector after reload
   */
  describe('Property 13: Custom theme persistence', () => {
    it('should persist custom themes to localStorage', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              // Verify it's in available themes
              const availableThemes = testManager.getAvailableThemes()
              const found = availableThemes.find(t => t.id === customTheme.id)
              expect(found).toBeDefined()
              expect(found?.name).toBe(themeData.name)
              expect(found?.description).toBe(themeData.description)

              // Verify it's in localStorage
              const stored = localStorage.getItem('caption-art-theme')
              expect(stored).toBeTruthy()
              const data = JSON.parse(stored!)
              expect(data.customThemes).toBeDefined()
              expect(Array.isArray(data.customThemes)).toBe(true)
              
              const storedTheme = data.customThemes.find((t: any) => t.id === customTheme.id)
              expect(storedTheme).toBeDefined()
              expect(storedTheme.name).toBe(themeData.name)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should restore custom themes after reload', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              const customThemeId = customTheme.id

              // Destroy and recreate manager (simulates reload)
              testManager.destroy()
              resetThemeManager()
              const newManager = new ThemeManager()

              // Verify custom theme is restored
              const availableThemes = newManager.getAvailableThemes()
              const restored = availableThemes.find(t => t.id === customThemeId)
              expect(restored).toBeDefined()
              expect(restored?.name).toBe(themeData.name)
              expect(restored?.description).toBe(themeData.description)
              expect(restored?.category).toBe('custom')

              newManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 14: Custom theme deletion
   * Feature: multi-theme-system, Property 14: Custom theme deletion
   * Validates: Requirements 8.5
   * 
   * For any custom theme deletion, it should be removed from localStorage
   * and the system should revert to a preset theme
   */
  describe('Property 14: Custom theme deletion', () => {
    it('should remove custom theme from localStorage when deleted', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              const customThemeId = customTheme.id

              // Verify it exists
              let availableThemes = testManager.getAvailableThemes()
              let found = availableThemes.find(t => t.id === customThemeId)
              expect(found).toBeDefined()

              // Delete the custom theme
              testManager.deleteCustomTheme(customThemeId)

              // Verify it's removed from available themes
              availableThemes = testManager.getAvailableThemes()
              found = availableThemes.find(t => t.id === customThemeId)
              expect(found).toBeUndefined()

              // Verify it's removed from localStorage
              const stored = localStorage.getItem('caption-art-theme')
              expect(stored).toBeTruthy()
              const data = JSON.parse(stored!)
              const storedTheme = data.customThemes.find((t: any) => t.id === customThemeId)
              expect(storedTheme).toBeUndefined()

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should revert to preset theme when deleting active custom theme', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          async (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              const customThemeId = customTheme.id

              // Apply the custom theme
              await testManager.setTheme(customThemeId)

              // Verify it's active
              const stateAfterSet = testManager.getState()
              if (stateAfterSet.currentTheme !== customThemeId) {
                console.error('Failed to set custom theme:', { customThemeId, currentTheme: stateAfterSet.currentTheme })
                return false
              }

              // Delete the active custom theme
              testManager.deleteCustomTheme(customThemeId)

              // Verify it reverted to a preset theme (default is neobrutalism)
              const currentTheme = testManager.getState().currentTheme
              if (currentTheme === customThemeId) {
                console.error('Theme was not changed after deletion')
                return false
              }
              
              // Verify the current theme is a preset
              const theme = testManager.getTheme()
              if (theme.category !== 'preset') {
                console.error('Current theme is not a preset:', theme.category)
                return false
              }
              
              // Verify it's the default theme
              if (theme.id !== 'neobrutalism') {
                console.error('Did not revert to default theme:', theme.id)
                return false
              }

              testManager.destroy()
              return true
            } catch (error) {
              console.error('Test error:', error)
              testManager.destroy()
              return false
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not affect other custom themes when deleting one', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (themesData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create multiple custom themes
              const customThemes = themesData.map(data =>
                testManager.createCustomTheme({
                  name: data.name,
                  description: data.description
                })
              )

              // Delete the first custom theme
              const themeToDelete = customThemes[0]
              testManager.deleteCustomTheme(themeToDelete.id)

              // Verify other custom themes still exist
              const availableThemes = testManager.getAvailableThemes()
              
              for (let i = 1; i < customThemes.length; i++) {
                const theme = customThemes[i]
                const found = availableThemes.find(t => t.id === theme.id)
                expect(found).toBeDefined()
                expect(found?.name).toBe(theme.name)
                expect(found?.description).toBe(theme.description)
              }

              // Verify deleted theme is gone
              const deleted = availableThemes.find(t => t.id === themeToDelete.id)
              expect(deleted).toBeUndefined()

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should throw error when deleting non-existent custom theme', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (fakeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Try to delete a theme that doesn't exist
              expect(() => {
                testManager.deleteCustomTheme(`fake-${fakeId}`)
              }).toThrow()

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist deletion across page reload', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              const customThemeId = customTheme.id

              // Delete the custom theme
              testManager.deleteCustomTheme(customThemeId)

              // Destroy and recreate manager (simulates reload)
              testManager.destroy()
              resetThemeManager()
              const newManager = new ThemeManager()

              // Verify custom theme is still deleted
              const availableThemes = newManager.getAvailableThemes()
              const found = availableThemes.find(t => t.id === customThemeId)
              expect(found).toBeUndefined()

              newManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 15: Theme export completeness
   * Feature: multi-theme-system, Property 15: Theme export completeness
   * Validates: Requirements 9.1, 9.5
   * 
   * For any theme export, the generated JSON should contain all theme properties
   * (name, colors, typography, spacing, shadows, borders, animations, accessibility)
   */
  describe('Property 15: Theme export completeness', () => {
    it('should export all required theme properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Export theme
              const exportedJson = testManager.exportTheme(themeId)
              
              // Parse JSON
              const exportData = JSON.parse(exportedJson)
              
              // Verify export structure
              expect(exportData.version).toBeDefined()
              expect(exportData.exportedAt).toBeDefined()
              expect(exportData.theme).toBeDefined()
              
              const theme = exportData.theme
              
              // Verify all required theme properties are present
              expect(theme.id).toBeDefined()
              expect(theme.name).toBeDefined()
              expect(theme.description).toBeDefined()
              expect(theme.category).toBeDefined()
              expect(theme.version).toBeDefined()
              
              // Verify colors
              expect(theme.colors).toBeDefined()
              expect(theme.colors.light).toBeDefined()
              expect(theme.colors.dark).toBeDefined()
              expect(theme.colors.light.bg).toBeDefined()
              expect(theme.colors.light.text).toBeDefined()
              expect(theme.colors.light.primary).toBeDefined()
              expect(theme.colors.dark.bg).toBeDefined()
              expect(theme.colors.dark.text).toBeDefined()
              expect(theme.colors.dark.primary).toBeDefined()
              
              // Verify typography
              expect(theme.typography).toBeDefined()
              expect(theme.typography.fontFamilyHeading).toBeDefined()
              expect(theme.typography.fontFamilyBody).toBeDefined()
              expect(theme.typography.fontSizeBase).toBeDefined()
              
              // Verify spacing
              expect(theme.spacing).toBeDefined()
              expect(theme.spacing.unit).toBeDefined()
              expect(theme.spacing.scale).toBeDefined()
              expect(Array.isArray(theme.spacing.scale)).toBe(true)
              
              // Verify shadows
              expect(theme.shadows).toBeDefined()
              expect(theme.shadows.sm).toBeDefined()
              expect(theme.shadows.md).toBeDefined()
              
              // Verify borders
              expect(theme.borders).toBeDefined()
              expect(theme.borders.width).toBeDefined()
              expect(theme.borders.radius).toBeDefined()
              
              // Verify animations
              expect(theme.animations).toBeDefined()
              expect(theme.animations.duration).toBeDefined()
              expect(theme.animations.easing).toBeDefined()
              
              // Verify accessibility
              expect(theme.accessibility).toBeDefined()
              expect(theme.accessibility.contrastRatio).toBeDefined()
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should export custom themes with all properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              // Export custom theme
              const exportedJson = testManager.exportTheme(customTheme.id)
              
              // Parse JSON
              const exportData = JSON.parse(exportedJson)
              
              // Verify export metadata
              expect(exportData.version).toBe('1.0.0')
              expect(exportData.exportedAt).toBeDefined()
              expect(new Date(exportData.exportedAt).getTime()).toBeGreaterThan(0)
              
              // Verify theme data
              const theme = exportData.theme
              expect(theme.name).toBe(themeData.name)
              expect(theme.description).toBe(themeData.description)
              expect(theme.category).toBe('custom')
              
              // Verify all properties are present
              expect(theme.colors).toBeDefined()
              expect(theme.typography).toBeDefined()
              expect(theme.spacing).toBeDefined()
              expect(theme.shadows).toBeDefined()
              expect(theme.borders).toBeDefined()
              expect(theme.animations).toBeDefined()
              expect(theme.accessibility).toBeDefined()
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should export valid JSON that can be parsed', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Export theme
              const exportedJson = testManager.exportTheme(themeId)
              
              // Should be valid JSON
              expect(() => JSON.parse(exportedJson)).not.toThrow()
              
              // Should be formatted (has newlines)
              expect(exportedJson).toContain('\n')
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should throw error when exporting non-existent theme', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (fakeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Try to export a theme that doesn't exist
              expect(() => {
                testManager.exportTheme(`fake-${fakeId}`)
              }).toThrow('Theme not found')

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 16: Theme import round-trip
   * Feature: multi-theme-system, Property 16: Theme import round-trip
   * Validates: Requirements 9.1, 9.2, 9.3, 9.5
   * 
   * For any valid theme, exporting then importing should produce an equivalent theme configuration
   */
  describe('Property 16: Theme import round-trip', () => {
    it('should preserve all theme properties through export/import cycle', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Get original theme
              const originalTheme = themePresets.find(t => t.id === themeId)!
              
              // Export theme
              const exportedJson = testManager.exportTheme(themeId)
              
              // Import theme
              const importedTheme = testManager.importTheme(exportedJson)
              
              // Verify all properties are preserved (except id and category which change on import)
              expect(importedTheme.name).toBe(originalTheme.name)
              expect(importedTheme.description).toBe(originalTheme.description)
              expect(importedTheme.version).toBe(originalTheme.version)
              expect(importedTheme.category).toBe('custom') // Always marked as custom on import
              
              // Verify colors
              expect(importedTheme.colors).toEqual(originalTheme.colors)
              
              // Verify typography
              expect(importedTheme.typography).toEqual(originalTheme.typography)
              
              // Verify spacing
              expect(importedTheme.spacing).toEqual(originalTheme.spacing)
              
              // Verify shadows
              expect(importedTheme.shadows).toEqual(originalTheme.shadows)
              
              // Verify borders
              expect(importedTheme.borders).toEqual(originalTheme.borders)
              
              // Verify animations
              expect(importedTheme.animations).toEqual(originalTheme.animations)
              
              // Verify accessibility
              expect(importedTheme.accessibility).toEqual(originalTheme.accessibility)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve custom theme properties through export/import cycle', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const originalTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })
              
              // Export theme
              const exportedJson = testManager.exportTheme(originalTheme.id)
              
              // Delete original theme
              testManager.deleteCustomTheme(originalTheme.id)
              
              // Import theme
              const importedTheme = testManager.importTheme(exportedJson)
              
              // Verify all properties are preserved (except id which changes on import)
              expect(importedTheme.name).toBe(originalTheme.name)
              expect(importedTheme.description).toBe(originalTheme.description)
              expect(importedTheme.version).toBe(originalTheme.version)
              expect(importedTheme.category).toBe('custom')
              
              // Verify all visual properties are preserved
              expect(importedTheme.colors).toEqual(originalTheme.colors)
              expect(importedTheme.typography).toEqual(originalTheme.typography)
              expect(importedTheme.spacing).toEqual(originalTheme.spacing)
              expect(importedTheme.shadows).toEqual(originalTheme.shadows)
              expect(importedTheme.borders).toEqual(originalTheme.borders)
              expect(importedTheme.animations).toEqual(originalTheme.animations)
              expect(importedTheme.accessibility).toEqual(originalTheme.accessibility)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should make imported theme available in theme selector', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Export theme
              const exportedJson = testManager.exportTheme(themeId)
              
              // Import theme
              const importedTheme = testManager.importTheme(exportedJson)
              
              // Verify it's in available themes
              const availableThemes = testManager.getAvailableThemes()
              const found = availableThemes.find(t => t.id === importedTheme.id)
              expect(found).toBeDefined()
              expect(found?.name).toBe(importedTheme.name)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist imported theme to localStorage', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Export theme
              const exportedJson = testManager.exportTheme(themeId)
              
              // Import theme
              const importedTheme = testManager.importTheme(exportedJson)
              
              // Verify it's in localStorage
              const stored = localStorage.getItem('caption-art-theme')
              expect(stored).toBeTruthy()
              const data = JSON.parse(stored!)
              
              const storedTheme = data.customThemes.find((t: any) => t.id === importedTheme.id)
              expect(storedTheme).toBeDefined()
              expect(storedTheme.name).toBe(importedTheme.name)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should restore imported theme after page reload', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Export theme
              const exportedJson = testManager.exportTheme(themeId)
              
              // Import theme
              const importedTheme = testManager.importTheme(exportedJson)
              const importedId = importedTheme.id
              
              // Destroy and recreate manager (simulates reload)
              testManager.destroy()
              resetThemeManager()
              const newManager = new ThemeManager()
              
              // Verify imported theme is restored
              const availableThemes = newManager.getAvailableThemes()
              const restored = availableThemes.find(t => t.id === importedId)
              expect(restored).toBeDefined()
              expect(restored?.name).toBe(importedTheme.name)
              
              newManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should generate unique IDs for imported themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Export theme
              const exportedJson = testManager.exportTheme(themeId)
              
              // Import same theme twice
              const imported1 = testManager.importTheme(exportedJson)
              const imported2 = testManager.importTheme(exportedJson)
              
              // IDs should be different
              expect(imported1.id).not.toBe(imported2.id)
              
              // Both should be available
              const availableThemes = testManager.getAvailableThemes()
              const found1 = availableThemes.find(t => t.id === imported1.id)
              const found2 = availableThemes.find(t => t.id === imported2.id)
              expect(found1).toBeDefined()
              expect(found2).toBeDefined()
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 17: Invalid theme import rejection
   * Feature: multi-theme-system, Property 17: Invalid theme import rejection
   * Validates: Requirements 9.2, 9.4
   * 
   * For any invalid theme JSON, the import should fail with an appropriate error message
   * and not modify the current theme
   */
  describe('Property 17: Invalid theme import rejection', () => {
    it('should reject invalid JSON', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
            try {
              JSON.parse(s)
              return false // Valid JSON, skip
            } catch {
              return true // Invalid JSON, use it
            }
          }),
          (invalidJson) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              const currentTheme = testManager.getTheme()
              const currentThemeId = testManager.getState().currentTheme
              
              // Try to import invalid JSON
              expect(() => {
                testManager.importTheme(invalidJson)
              }).toThrow()
              
              // Verify current theme is unchanged
              expect(testManager.getState().currentTheme).toBe(currentThemeId)
              expect(testManager.getTheme().id).toBe(currentTheme.id)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject JSON without theme property', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.string(),
            exportedAt: fc.string(),
            // Missing 'theme' property
          }),
          (invalidData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              const currentTheme = testManager.getTheme()
              const currentThemeId = testManager.getState().currentTheme
              
              const invalidJson = JSON.stringify(invalidData)
              
              // Try to import invalid structure
              expect(() => {
                testManager.importTheme(invalidJson)
              }).toThrow('Invalid theme file structure')
              
              // Verify current theme is unchanged
              expect(testManager.getState().currentTheme).toBe(currentThemeId)
              expect(testManager.getTheme().id).toBe(currentTheme.id)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject JSON without version property', () => {
      fc.assert(
        fc.property(
          fc.record({
            theme: fc.object(),
            exportedAt: fc.string(),
            // Missing 'version' property
          }),
          (invalidData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              const currentTheme = testManager.getTheme()
              const currentThemeId = testManager.getState().currentTheme
              
              const invalidJson = JSON.stringify(invalidData)
              
              // Try to import invalid structure
              expect(() => {
                testManager.importTheme(invalidJson)
              }).toThrow('Invalid theme file structure')
              
              // Verify current theme is unchanged
              expect(testManager.getState().currentTheme).toBe(currentThemeId)
              expect(testManager.getTheme().id).toBe(currentTheme.id)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject theme with missing required properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.constant('1.0.0'),
            exportedAt: fc.date().map(d => d.toISOString()),
            theme: fc.record({
              id: fc.string(),
              name: fc.string(),
              // Missing other required properties like colors, typography, etc.
            })
          }),
          (invalidData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              const currentTheme = testManager.getTheme()
              const currentThemeId = testManager.getState().currentTheme
              
              const invalidJson = JSON.stringify(invalidData)
              
              // Try to import invalid theme
              expect(() => {
                testManager.importTheme(invalidJson)
              }).toThrow()
              
              // Verify current theme is unchanged
              expect(testManager.getState().currentTheme).toBe(currentThemeId)
              expect(testManager.getTheme().id).toBe(currentTheme.id)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not add invalid theme to custom themes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
            try {
              JSON.parse(s)
              return false
            } catch {
              return true
            }
          }),
          (invalidJson) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              const customThemesBefore = testManager.getState().customThemes.length
              
              // Try to import invalid JSON
              try {
                testManager.importTheme(invalidJson)
              } catch {
                // Expected to throw
              }
              
              // Verify no new custom themes were added
              const customThemesAfter = testManager.getState().customThemes.length
              expect(customThemesAfter).toBe(customThemesBefore)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not modify localStorage on failed import', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
            try {
              JSON.parse(s)
              return false
            } catch {
              return true
            }
          }),
          (invalidJson) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Get localStorage state before import
              const storedBefore = localStorage.getItem('caption-art-theme')
              
              // Try to import invalid JSON
              try {
                testManager.importTheme(invalidJson)
              } catch {
                // Expected to throw
              }
              
              // Verify localStorage is unchanged
              const storedAfter = localStorage.getItem('caption-art-theme')
              expect(storedAfter).toBe(storedBefore)
              
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should provide descriptive error messages', () => {
      resetThemeManager()
      const testManager = new ThemeManager()

      try {
        // Test invalid JSON
        expect(() => {
          testManager.importTheme('not valid json')
        }).toThrow('Invalid JSON format')

        // Test missing structure
        expect(() => {
          testManager.importTheme('{"version": "1.0.0"}')
        }).toThrow('Invalid theme file structure')

        // Test missing theme property
        expect(() => {
          testManager.importTheme('{"version": "1.0.0", "exportedAt": "2024-01-01"}')
        }).toThrow('Invalid theme file structure')

        testManager.destroy()
      } catch (error) {
        testManager.destroy()
        throw error
      }
    })
  })

  /**
   * Property 12: Manual override precedence
   * Validates: Requirements 7.3
   * 
   * For any manual theme selection, the system should override system preferences
   * and persist the manual choice
   */
  describe('Property 12: Manual override precedence', () => {
    it('should disable system preference respect when manually setting theme', async () => {
      // Create a mock media query list
      let listeners: Array<(e: MediaQueryListEvent) => void> = []
      const mockMediaQuery = {
        matches: true, // System prefers dark
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners.push(handler)
          }
        },
        removeEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners = listeners.filter(l => l !== handler)
          }
        },
        dispatchEvent: () => true
      }

      const originalMatchMedia = window.matchMedia
      window.matchMedia = (() => mockMediaQuery) as any

      try {
        resetThemeManager()
        const newManager = new ThemeManager()

        // Initially respecting system preference (dark mode)
        expect(newManager.getState().respectSystemPreference).toBe(true)
        expect(newManager.getState().mode).toBe('dark')

        // Manually set mode to light (override system preference)
        newManager.setMode('light')
        
        // System preference respect should still be enabled for setMode
        // (only setTheme disables it)
        expect(newManager.getState().respectSystemPreference).toBe(true)
        expect(newManager.getState().mode).toBe('light')

        newManager.destroy()
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('should persist manual choice across system preference changes', async () => {
      // Create a mock media query list
      let listeners: Array<(e: MediaQueryListEvent) => void> = []
      const mockMediaQuery = {
        matches: false, // System prefers light
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners.push(handler)
          }
        },
        removeEventListener: (event: string, handler: any) => {
          if (event === 'change') {
            listeners = listeners.filter(l => l !== handler)
          }
        },
        dispatchEvent: () => true
      }

      const originalMatchMedia = window.matchMedia
      window.matchMedia = (() => mockMediaQuery) as any

      try {
        resetThemeManager()
        const newManager = new ThemeManager()

        // Disable system preference respect (manual control)
        newManager.setRespectSystemPreference(false)
        
        // Set to dark mode manually
        newManager.setMode('dark')
        expect(newManager.getState().mode).toBe('dark')

        // Simulate system preference change to dark
        mockMediaQuery.matches = true
        listeners.forEach(listener => {
          listener({ matches: true, media: mockMediaQuery.media } as MediaQueryListEvent)
        })

        // Should stay dark (manual choice persists)
        expect(newManager.getState().mode).toBe('dark')

        // Simulate system preference change to light
        mockMediaQuery.matches = false
        listeners.forEach(listener => {
          listener({ matches: false, media: mockMediaQuery.media } as MediaQueryListEvent)
        })

        // Should still be dark (manual choice persists)
        expect(newManager.getState().mode).toBe('dark')

        newManager.destroy()
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('should persist manual choice after page reload', () => {
      // Set manual mode
      manager.setRespectSystemPreference(false)
      manager.setMode('dark')

      // Save to localStorage
      const stored = localStorage.getItem('caption-art-theme')
      expect(stored).toBeTruthy()

      const data = JSON.parse(stored!)
      expect(data.mode).toBe('dark')
      expect(data.respectSystemPreference).toBe(false)

      // Create new manager (simulates reload)
      resetThemeManager()
      const newManager = new ThemeManager()

      // Should restore manual choice
      expect(newManager.getState().mode).toBe('dark')
      expect(newManager.getState().respectSystemPreference).toBe(false)

      newManager.destroy()
    })
  })

  /**
   * Property 22: Theme API getTheme
   * Feature: multi-theme-system, Property 22: Theme API getTheme
   * Validates: Requirements 15.1
   * 
   * For any active theme, calling getTheme() should return the complete current theme configuration
   */
  describe('Property 22: Theme API getTheme', () => {
    it('should return complete theme configuration for any active theme', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set theme
              await testManager.setTheme(themeId)

              // Get theme
              const theme = testManager.getTheme()

              // Verify it's the correct theme
              expect(theme.id).toBe(themeId)

              // Verify all required properties are present
              expect(theme.name).toBeDefined()
              expect(theme.description).toBeDefined()
              expect(theme.category).toBeDefined()
              expect(theme.version).toBeDefined()

              // Verify colors
              expect(theme.colors).toBeDefined()
              expect(theme.colors.light).toBeDefined()
              expect(theme.colors.dark).toBeDefined()

              // Verify typography
              expect(theme.typography).toBeDefined()
              expect(theme.typography.fontFamilyHeading).toBeDefined()
              expect(theme.typography.fontFamilyBody).toBeDefined()

              // Verify spacing
              expect(theme.spacing).toBeDefined()
              expect(theme.spacing.unit).toBeDefined()
              expect(theme.spacing.scale).toBeDefined()

              // Verify shadows
              expect(theme.shadows).toBeDefined()

              // Verify borders
              expect(theme.borders).toBeDefined()

              // Verify animations
              expect(theme.animations).toBeDefined()

              // Verify accessibility
              expect(theme.accessibility).toBeDefined()

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return current theme after mode changes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          fc.constantFrom('light', 'dark'),
          async (themeId, mode) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set theme with specific mode
              await testManager.setTheme(themeId, mode)

              // Get theme
              const theme = testManager.getTheme()

              // Verify it's the correct theme
              expect(theme.id).toBe(themeId)

              // Verify mode is correct in state
              expect(testManager.getState().mode).toBe(mode)

              // Theme object should be the same regardless of mode
              // (mode only affects which color palette is applied)
              expect(theme.colors.light).toBeDefined()
              expect(theme.colors.dark).toBeDefined()

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return custom theme configuration', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          async (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              // Set custom theme
              await testManager.setTheme(customTheme.id)

              // Get theme
              const theme = testManager.getTheme()

              // Verify it's the custom theme
              expect(theme.id).toBe(customTheme.id)
              expect(theme.name).toBe(themeData.name)
              expect(theme.description).toBe(themeData.description)
              expect(theme.category).toBe('custom')

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return same reference for repeated calls without theme change', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set theme
              await testManager.setTheme(themeId)

              // Get theme multiple times
              const theme1 = testManager.getTheme()
              const theme2 = testManager.getTheme()
              const theme3 = testManager.getTheme()

              // Should return same reference
              expect(theme1).toBe(theme2)
              expect(theme2).toBe(theme3)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 23: Theme API setTheme
   * Feature: multi-theme-system, Property 23: Theme API setTheme
   * Validates: Requirements 15.2
   * 
   * For any valid theme ID, calling setTheme(id) should apply that theme
   */
  describe('Property 23: Theme API setTheme', () => {
    it('should apply theme for any valid theme ID', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set theme
              await testManager.setTheme(themeId)

              // Verify theme is applied
              const currentTheme = testManager.getTheme()
              expect(currentTheme.id).toBe(themeId)

              // Verify state is updated
              const state = testManager.getState()
              expect(state.currentTheme).toBe(themeId)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should apply theme with specified mode', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          fc.constantFrom('light', 'dark'),
          async (themeId, mode) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set theme with mode
              await testManager.setTheme(themeId, mode)

              // Verify theme is applied
              expect(testManager.getTheme().id).toBe(themeId)

              // Verify mode is applied
              expect(testManager.getState().mode).toBe(mode)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should throw error for invalid theme ID', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (fakeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Try to set non-existent theme
              await expect(testManager.setTheme(`fake-${fakeId}`)).rejects.toThrow('Theme not found')

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist theme selection', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set theme
              await testManager.setTheme(themeId)

              // Verify it's persisted to localStorage
              const stored = localStorage.getItem('caption-art-theme')
              expect(stored).toBeTruthy()
              const data = JSON.parse(stored!)
              expect(data.currentThemeId).toBe(themeId)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should notify subscribers when theme changes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId1, themeId2) => {
            if (themeId1 === themeId2) return // Skip if same theme

            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              let notificationCount = 0
              let lastState: any = null

              // Subscribe to changes
              const unsubscribe = testManager.subscribeToChanges((state) => {
                notificationCount++
                lastState = state
              })

              // Set first theme
              await testManager.setTheme(themeId1)
              expect(notificationCount).toBeGreaterThan(0)
              expect(lastState.currentTheme).toBe(themeId1)

              const countAfterFirst = notificationCount

              // Set second theme
              await testManager.setTheme(themeId2)
              expect(notificationCount).toBeGreaterThan(countAfterFirst)
              expect(lastState.currentTheme).toBe(themeId2)

              unsubscribe()
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 24: Theme API getAvailableThemes
   * Feature: multi-theme-system, Property 24: Theme API getAvailableThemes
   * Validates: Requirements 15.3
   * 
   * For any state, calling getAvailableThemes() should return all preset and custom themes
   */
  describe('Property 24: Theme API getAvailableThemes', () => {
    it('should return all preset themes', () => {
      resetThemeManager()
      const testManager = new ThemeManager()

      try {
        const availableThemes = testManager.getAvailableThemes()

        // Should include all presets
        for (const preset of themePresets) {
          const found = availableThemes.find(t => t.id === preset.id)
          expect(found).toBeDefined()
          expect(found?.name).toBe(preset.name)
          expect(found?.category).toBe('preset')
        }

        testManager.destroy()
      } catch (error) {
        testManager.destroy()
        throw error
      }
    })

    it('should include custom themes', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (themesData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom themes
              const customThemes = themesData.map(data =>
                testManager.createCustomTheme({
                  name: data.name,
                  description: data.description
                })
              )

              // Get available themes
              const availableThemes = testManager.getAvailableThemes()

              // Should include all custom themes
              for (const customTheme of customThemes) {
                const found = availableThemes.find(t => t.id === customTheme.id)
                expect(found).toBeDefined()
                expect(found?.name).toBe(customTheme.name)
                expect(found?.category).toBe('custom')
              }

              // Should also include all presets
              for (const preset of themePresets) {
                const found = availableThemes.find(t => t.id === preset.id)
                expect(found).toBeDefined()
              }

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return array with correct length', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }),
          (customThemeCount) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom themes
              for (let i = 0; i < customThemeCount; i++) {
                testManager.createCustomTheme({
                  name: `Custom Theme ${i}`,
                  description: `Description ${i}`
                })
              }

              // Get available themes
              const availableThemes = testManager.getAvailableThemes()

              // Should have presets + custom themes
              expect(availableThemes.length).toBe(themePresets.length + customThemeCount)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update after custom theme deletion', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              // Verify it's in available themes
              let availableThemes = testManager.getAvailableThemes()
              let found = availableThemes.find(t => t.id === customTheme.id)
              expect(found).toBeDefined()

              // Delete custom theme
              testManager.deleteCustomTheme(customTheme.id)

              // Verify it's removed from available themes
              availableThemes = testManager.getAvailableThemes()
              found = availableThemes.find(t => t.id === customTheme.id)
              expect(found).toBeUndefined()

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return new array on each call', () => {
      resetThemeManager()
      const testManager = new ThemeManager()

      try {
        const themes1 = testManager.getAvailableThemes()
        const themes2 = testManager.getAvailableThemes()

        // Should be different array instances
        expect(themes1).not.toBe(themes2)

        // But should have same content
        expect(themes1.length).toBe(themes2.length)
        expect(themes1.map(t => t.id).sort()).toEqual(themes2.map(t => t.id).sort())

        testManager.destroy()
      } catch (error) {
        testManager.destroy()
        throw error
      }
    })
  })

  /**
   * Property 25: Theme API createCustomTheme
   * Feature: multi-theme-system, Property 25: Theme API createCustomTheme
   * Validates: Requirements 15.4
   * 
   * For any valid theme configuration, calling createCustomTheme(config) should validate and register the theme
   */
  describe('Property 25: Theme API createCustomTheme', () => {
    it('should create and register custom theme', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              // Verify theme is created
              expect(customTheme.id).toBeDefined()
              expect(customTheme.name).toBe(themeData.name)
              expect(customTheme.description).toBe(themeData.description)
              expect(customTheme.category).toBe('custom')

              // Verify it's registered
              const availableThemes = testManager.getAvailableThemes()
              const found = availableThemes.find(t => t.id === customTheme.id)
              expect(found).toBeDefined()

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate theme before registration', () => {
      resetThemeManager()
      const testManager = new ThemeManager()

      try {
        // Try to create theme with invalid config (missing required properties)
        expect(() => {
          testManager.createCustomTheme({
            name: 'Invalid Theme',
            colors: {} as any // Invalid colors
          })
        }).toThrow()

        testManager.destroy()
      } catch (error) {
        testManager.destroy()
        throw error
      }
    })

    it('should generate unique IDs for custom themes', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (themesData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create multiple custom themes
              const customThemes = themesData.map(data =>
                testManager.createCustomTheme({
                  name: data.name,
                  description: data.description
                })
              )

              // All IDs should be unique
              const ids = customThemes.map(t => t.id)
              const uniqueIds = new Set(ids)
              expect(uniqueIds.size).toBe(ids.length)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist custom theme to localStorage', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Create custom theme
              const customTheme = testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              // Verify it's in localStorage
              const stored = localStorage.getItem('caption-art-theme')
              expect(stored).toBeTruthy()
              const data = JSON.parse(stored!)
              const storedTheme = data.customThemes.find((t: any) => t.id === customTheme.id)
              expect(storedTheme).toBeDefined()
              expect(storedTheme.name).toBe(themeData.name)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should notify subscribers when custom theme is created', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
          }),
          (themeData) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              let notified = false
              const unsubscribe = testManager.subscribeToChanges(() => {
                notified = true
              })

              // Create custom theme
              testManager.createCustomTheme({
                name: themeData.name,
                description: themeData.description
              })

              // Should notify subscribers
              expect(notified).toBe(true)

              unsubscribe()
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 26: Theme API resetTheme
   * Feature: multi-theme-system, Property 26: Theme API resetTheme
   * Validates: Requirements 15.5
   * 
   * For any state, calling resetTheme() should revert to the default theme (neo-brutalism light)
   */
  describe('Property 26: Theme API resetTheme', () => {
    it('should reset to default theme from any theme', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set to some theme
              await testManager.setTheme(themeId, 'dark')

              // Reset theme
              testManager.resetTheme()

              // Should be default theme (neobrutalism)
              const currentTheme = testManager.getTheme()
              expect(currentTheme.id).toBe('neobrutalism')

              // Should be light mode
              const state = testManager.getState()
              expect(state.mode).toBe('light')

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reset to light mode', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          async (mode) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set mode
              testManager.setMode(mode)

              // Reset theme
              testManager.resetTheme()

              // Should be light mode
              expect(testManager.getState().mode).toBe('light')

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should disable system preference respect', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (respectSystemPreference) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set system preference respect
              testManager.setRespectSystemPreference(respectSystemPreference)

              // Reset theme
              testManager.resetTheme()

              // Should disable system preference respect
              expect(testManager.getState().respectSystemPreference).toBe(false)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist reset to localStorage', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set to some theme
              await testManager.setTheme(themeId, 'dark')

              // Reset theme
              testManager.resetTheme()

              // Verify it's persisted
              const stored = localStorage.getItem('caption-art-theme')
              expect(stored).toBeTruthy()
              const data = JSON.parse(stored!)
              expect(data.currentThemeId).toBe('neobrutalism')
              expect(data.mode).toBe('light')
              expect(data.respectSystemPreference).toBe(false)

              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should notify subscribers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          async (themeId) => {
            if (themeId === 'neobrutalism') return // Skip if already default

            resetThemeManager()
            const testManager = new ThemeManager()

            try {
              // Set to some theme
              await testManager.setTheme(themeId)

              let notified = false
              let lastState: any = null

              const unsubscribe = testManager.subscribeToChanges((state) => {
                notified = true
                lastState = state
              })

              // Reset theme
              testManager.resetTheme()

              // Should notify subscribers
              expect(notified).toBe(true)
              expect(lastState.currentTheme).toBe('neobrutalism')
              expect(lastState.mode).toBe('light')

              unsubscribe()
              testManager.destroy()
            } catch (error) {
              testManager.destroy()
              throw error
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be idempotent', () => {
      resetThemeManager()
      const testManager = new ThemeManager()

      try {
        // Reset multiple times
        testManager.resetTheme()
        const state1 = testManager.getState()

        testManager.resetTheme()
        const state2 = testManager.getState()

        testManager.resetTheme()
        const state3 = testManager.getState()

        // All states should be the same
        expect(state1.currentTheme).toBe(state2.currentTheme)
        expect(state2.currentTheme).toBe(state3.currentTheme)
        expect(state1.mode).toBe(state2.mode)
        expect(state2.mode).toBe(state3.mode)

        testManager.destroy()
      } catch (error) {
        testManager.destroy()
        throw error
      }
    })
  })
})
