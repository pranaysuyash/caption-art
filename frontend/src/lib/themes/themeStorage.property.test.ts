/**
 * Property-Based Tests for ThemeStorage
 * 
 * Tests universal properties for theme persistence.
 * 
 * Feature: multi-theme-system, Property 2: Theme persistence round-trip
 * Validates: Requirements 1.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { ThemeStorage } from './themeStorage'
import { StoredThemeData, ThemeConfig } from './types'
import { themePresets } from './presets'

describe('ThemeStorage Property Tests', () => {
  let storage: ThemeStorage

  beforeEach(() => {
    // Clear all localStorage
    localStorage.clear()
    // Create new storage instance
    storage = new ThemeStorage()
  })

  afterEach(() => {
    // Clear all localStorage after each test
    localStorage.clear()
  })

  /**
   * Property 2: Theme persistence round-trip
   * Validates: Requirements 1.5
   * 
   * For any theme selection, after saving and reloading the application,
   * the same theme should be active
   */
  describe('Property 2: Theme persistence round-trip', () => {
    // Generator for valid StoredThemeData
    const storedThemeDataArb = fc.record({
      currentThemeId: fc.constantFrom(...themePresets.map(t => t.id)),
      mode: fc.constantFrom('light' as const, 'dark' as const),
      customThemes: fc.array(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 0, maxLength: 200 }),
          category: fc.constant('custom' as const),
          version: fc.constant('1.0.0'),
          colors: fc.constant(themePresets[0].colors),
          typography: fc.constant(themePresets[0].typography),
          spacing: fc.constant(themePresets[0].spacing),
          shadows: fc.constant(themePresets[0].shadows),
          borders: fc.constant(themePresets[0].borders),
          animations: fc.constant(themePresets[0].animations),
          accessibility: fc.constant(themePresets[0].accessibility)
        }),
        { maxLength: 10 }
      ),
      respectSystemPreference: fc.boolean(),
      lastUpdated: fc.integer({ min: 0, max: Date.now() })
    })

    it('should save and load theme data without loss', () => {
      fc.assert(
        fc.property(storedThemeDataArb, (data) => {
          // Save data
          storage.save(data)

          // Load data
          const loaded = storage.load()

          // Verify data is preserved
          expect(loaded).not.toBeNull()
          expect(loaded!.currentThemeId).toBe(data.currentThemeId)
          expect(loaded!.mode).toBe(data.mode)
          expect(loaded!.respectSystemPreference).toBe(data.respectSystemPreference)
          expect(loaded!.lastUpdated).toBe(data.lastUpdated)
          expect(loaded!.customThemes).toHaveLength(data.customThemes.length)

          // Verify custom themes are preserved
          data.customThemes.forEach((theme, index) => {
            expect(loaded!.customThemes[index].id).toBe(theme.id)
            expect(loaded!.customThemes[index].name).toBe(theme.name)
            expect(loaded!.customThemes[index].category).toBe('custom')
          })
        }),
        { numRuns: 100 }
      )
    })

    it('should handle multiple save/load cycles', () => {
      fc.assert(
        fc.property(
          fc.array(storedThemeDataArb, { minLength: 1, maxLength: 5 }),
          (dataArray) => {
            let lastSaved: StoredThemeData | null = null

            // Perform multiple save/load cycles
            for (const data of dataArray) {
              storage.save(data)
              lastSaved = data
            }

            // Load final data
            const loaded = storage.load()

            // Should match the last saved data
            expect(loaded).not.toBeNull()
            expect(loaded!.currentThemeId).toBe(lastSaved!.currentThemeId)
            expect(loaded!.mode).toBe(lastSaved!.mode)
            expect(loaded!.respectSystemPreference).toBe(lastSaved!.respectSystemPreference)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve theme mode across save/load', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          fc.constantFrom('light' as const, 'dark' as const),
          (themeId, mode) => {
            const data: StoredThemeData = {
              currentThemeId: themeId,
              mode,
              customThemes: [],
              respectSystemPreference: false,
              lastUpdated: Date.now()
            }

            storage.save(data)
            const loaded = storage.load()

            expect(loaded).not.toBeNull()
            expect(loaded!.currentThemeId).toBe(themeId)
            expect(loaded!.mode).toBe(mode)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve system preference setting', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (respectSystemPreference) => {
            const data: StoredThemeData = {
              currentThemeId: 'neobrutalism',
              mode: 'light',
              customThemes: [],
              respectSystemPreference,
              lastUpdated: Date.now()
            }

            storage.save(data)
            const loaded = storage.load()

            expect(loaded).not.toBeNull()
            expect(loaded!.respectSystemPreference).toBe(respectSystemPreference)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return null when no data is stored', () => {
      const loaded = storage.load()
      expect(loaded).toBeNull()
    })

    it('should handle clear and reload', () => {
      fc.assert(
        fc.property(storedThemeDataArb, (data) => {
          // Save data
          storage.save(data)

          // Verify it's saved
          let loaded = storage.load()
          expect(loaded).not.toBeNull()

          // Clear storage
          storage.clear()

          // Load should return null
          loaded = storage.load()
          expect(loaded).toBeNull()
        }),
        { numRuns: 100 }
      )
    })

    it('should preserve timestamp across save/load', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Date.now() }),
          (timestamp) => {
            const data: StoredThemeData = {
              currentThemeId: 'neobrutalism',
              mode: 'light',
              customThemes: [],
              respectSystemPreference: true,
              lastUpdated: timestamp
            }

            storage.save(data)
            const loaded = storage.load()

            expect(loaded).not.toBeNull()
            expect(loaded!.lastUpdated).toBe(timestamp)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle empty custom themes array', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...themePresets.map(t => t.id)),
          (themeId) => {
            const data: StoredThemeData = {
              currentThemeId: themeId,
              mode: 'light',
              customThemes: [],
              respectSystemPreference: true,
              lastUpdated: Date.now()
            }

            storage.save(data)
            const loaded = storage.load()

            expect(loaded).not.toBeNull()
            expect(loaded!.customThemes).toEqual([])
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve all custom theme properties', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 50 }),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 200 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (customThemeData) => {
            const customThemes: ThemeConfig[] = customThemeData.map(ct => ({
              id: ct.id,
              name: ct.name,
              description: ct.description,
              category: 'custom' as const,
              version: '1.0.0',
              colors: themePresets[0].colors,
              typography: themePresets[0].typography,
              spacing: themePresets[0].spacing,
              shadows: themePresets[0].shadows,
              borders: themePresets[0].borders,
              animations: themePresets[0].animations,
              accessibility: themePresets[0].accessibility
            }))

            const data: StoredThemeData = {
              currentThemeId: 'neobrutalism',
              mode: 'light',
              customThemes,
              respectSystemPreference: true,
              lastUpdated: Date.now()
            }

            storage.save(data)
            const loaded = storage.load()

            expect(loaded).not.toBeNull()
            expect(loaded!.customThemes).toHaveLength(customThemes.length)

            customThemes.forEach((theme, index) => {
              expect(loaded!.customThemes[index].id).toBe(theme.id)
              expect(loaded!.customThemes[index].name).toBe(theme.name)
              expect(loaded!.customThemes[index].description).toBe(theme.description)
              expect(loaded!.customThemes[index].category).toBe('custom')
            })
          }
        ),
        { numRuns: 100 }
      )
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
    // Generator for custom themes
    const customThemeArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ minLength: 0, maxLength: 200 }),
      category: fc.constant('custom' as const),
      version: fc.constant('1.0.0'),
      colors: fc.constant(themePresets[0].colors),
      typography: fc.constant(themePresets[0].typography),
      spacing: fc.constant(themePresets[0].spacing),
      shadows: fc.constant(themePresets[0].shadows),
      borders: fc.constant(themePresets[0].borders),
      animations: fc.constant(themePresets[0].animations),
      accessibility: fc.constant(themePresets[0].accessibility)
    })

    it('should save and load custom themes', () => {
      fc.assert(
        fc.property(customThemeArb, (theme) => {
          // Clear localStorage for this iteration
          localStorage.clear()

          // Save custom theme
          storage.saveCustomTheme(theme)

          // Load custom themes
          const loaded = storage.loadCustomThemes()

          // Verify theme is present
          expect(loaded).toHaveLength(1)
          expect(loaded[0].id).toBe(theme.id)
          expect(loaded[0].name).toBe(theme.name)
          expect(loaded[0].description).toBe(theme.description)
          expect(loaded[0].category).toBe('custom')
        }),
        { numRuns: 100 }
      )
    })

    it('should handle multiple custom themes', () => {
      fc.assert(
        fc.property(
          fc.array(customThemeArb, { minLength: 1, maxLength: 10 }),
          (themes) => {
            // Clear localStorage for this iteration
            localStorage.clear()

            // Make IDs unique
            const uniqueThemes = themes.map((theme, index) => ({
              ...theme,
              id: `${theme.id}-${index}`
            }))

            // Save all themes
            uniqueThemes.forEach(theme => storage.saveCustomTheme(theme))

            // Load custom themes
            const loaded = storage.loadCustomThemes()

            // Verify all themes are present
            expect(loaded).toHaveLength(uniqueThemes.length)

            uniqueThemes.forEach(theme => {
              const found = loaded.find(t => t.id === theme.id)
              expect(found).toBeDefined()
              expect(found!.name).toBe(theme.name)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update existing custom theme when saving with same ID', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (id, name1, name2) => {
            // Clear localStorage for this iteration
            localStorage.clear()

            const theme1: ThemeConfig = {
              id,
              name: name1,
              description: 'First version',
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

            const theme2: ThemeConfig = {
              ...theme1,
              name: name2,
              description: 'Second version'
            }

            // Save first version
            storage.saveCustomTheme(theme1)

            // Save second version with same ID
            storage.saveCustomTheme(theme2)

            // Load themes
            const loaded = storage.loadCustomThemes()

            // Should only have one theme with the updated name
            expect(loaded).toHaveLength(1)
            expect(loaded[0].id).toBe(id)
            expect(loaded[0].name).toBe(name2)
            expect(loaded[0].description).toBe('Second version')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist custom themes across storage instances', () => {
      fc.assert(
        fc.property(customThemeArb, (theme) => {
          // Clear localStorage for this iteration
          localStorage.clear()

          // Save with first storage instance
          storage.saveCustomTheme(theme)

          // Create new storage instance
          const newStorage = new ThemeStorage()

          // Load with new instance
          const loaded = newStorage.loadCustomThemes()

          // Verify theme is present
          expect(loaded).toHaveLength(1)
          expect(loaded[0].id).toBe(theme.id)
        }),
        { numRuns: 100 }
      )
    })

    it('should return empty array when no custom themes exist', () => {
      const loaded = storage.loadCustomThemes()
      expect(loaded).toEqual([])
    })

    it('should handle custom theme deletion', () => {
      fc.assert(
        fc.property(
          fc.array(customThemeArb, { minLength: 2, maxLength: 5 }),
          (themes) => {
            // Clear localStorage for this iteration
            localStorage.clear()

            // Make IDs unique
            const uniqueThemes = themes.map((theme, index) => ({
              ...theme,
              id: `${theme.id}-${index}`
            }))

            // Save all themes
            uniqueThemes.forEach(theme => storage.saveCustomTheme(theme))

            // Delete first theme
            storage.deleteCustomTheme(uniqueThemes[0].id)

            // Load themes
            const loaded = storage.loadCustomThemes()

            // Should have one less theme
            expect(loaded).toHaveLength(uniqueThemes.length - 1)

            // First theme should not be present
            const found = loaded.find(t => t.id === uniqueThemes[0].id)
            expect(found).toBeUndefined()

            // Other themes should still be present
            for (let i = 1; i < uniqueThemes.length; i++) {
              const found = loaded.find(t => t.id === uniqueThemes[i].id)
              expect(found).toBeDefined()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle deletion of non-existent theme gracefully', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (nonExistentId) => {
            // Try to delete non-existent theme
            expect(() => storage.deleteCustomTheme(nonExistentId)).not.toThrow()

            // Should still return empty array
            const loaded = storage.loadCustomThemes()
            expect(loaded).toEqual([])
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
