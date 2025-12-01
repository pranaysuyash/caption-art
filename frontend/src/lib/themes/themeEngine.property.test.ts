/**
 * Property-Based Tests for ThemeEngine
 * 
 * Tests theme transition smoothness and reduced motion support.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'
import { ThemeEngine } from './themeEngine'
import type { ThemeConfig } from './types'

describe('ThemeEngine Property Tests', () => {
  let engine: ThemeEngine
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    // Create a fresh DOM for each test
    document.documentElement.removeAttribute('style')
    document.documentElement.className = ''
    
    engine = new ThemeEngine()
    
    // Mock matchMedia
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    // Restore matchMedia
    window.matchMedia = originalMatchMedia
  })

  /**
   * Property 3: Theme transition smoothness
   * Feature: multi-theme-system, Property 3: Theme transition smoothness
   * Validates: Requirements 1.4, 10.1, 10.2, 10.3
   * 
   * For any theme change, the transition should occur over 0.3 seconds 
   * with cubic-bezier easing and no layout shifts
   */
  describe('Property 3: Theme transition smoothness', () => {
    it('should transition themes with correct duration and easing', async () => {
      // Mock matchMedia to return false for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      await fc.assert(
        fc.asyncProperty(
          generateThemeConfig(),
          generateThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          async (fromTheme, toTheme, mode) => {
            // Skip if themes are identical
            if (fromTheme.id === toTheme.id) {
              return true
            }

            // Apply initial theme
            engine.applyTheme(fromTheme, mode)
            
            // Start transition
            const startTime = Date.now()
            const transitionPromise = engine.transitionTheme(fromTheme, toTheme, mode, 300)
            
            // Check that transition class is added
            expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true)
            
            // Check that transition duration is set
            const duration = document.documentElement.style.getPropertyValue('--theme-transition-duration')
            expect(duration).toBe('300ms')
            
            // Wait for transition to complete
            await transitionPromise
            
            // Check that transition took approximately 300ms (with some tolerance)
            const elapsed = Date.now() - startTime
            expect(elapsed).toBeGreaterThanOrEqual(280)
            expect(elapsed).toBeLessThan(400)
            
            // Check that transition class is removed
            expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false)
            
            // Verify theme was applied (check a few key variables)
            const appliedBg = document.documentElement.style.getPropertyValue('--color-bg')
            expect(appliedBg).toBe(toTheme.colors[mode].bg)
            
            return true
          }
        ),
        { numRuns: 10 } // Reduced runs for async tests
      )
    })

    it('should only transition color properties, not layout properties', async () => {
      // Mock matchMedia to return false for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      await fc.assert(
        fc.asyncProperty(
          generateThemeConfig(),
          generateThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          async (fromTheme, toTheme, mode) => {
            // Apply initial theme
            engine.applyTheme(fromTheme, mode)
            
            // Get initial layout properties
            const initialSpacing = document.documentElement.style.getPropertyValue('--spacing-unit')
            const initialBorderWidth = document.documentElement.style.getPropertyValue('--border-width-medium')
            
            // Transition to new theme
            await engine.transitionTheme(fromTheme, toTheme, mode, 100)
            
            // Layout properties should change immediately (no transition)
            // We verify this by checking that spacing and border values are updated
            const newSpacing = document.documentElement.style.getPropertyValue('--spacing-unit')
            const newBorderWidth = document.documentElement.style.getPropertyValue('--border-width-medium')
            
            // If themes have different spacing/borders, they should be different now
            if (fromTheme.spacing.unit !== toTheme.spacing.unit) {
              expect(newSpacing).not.toBe(initialSpacing)
              expect(newSpacing).toBe(`${toTheme.spacing.unit}px`)
            }
            
            if (fromTheme.borders.width.medium !== toTheme.borders.width.medium) {
              expect(newBorderWidth).not.toBe(initialBorderWidth)
              expect(newBorderWidth).toBe(`${toTheme.borders.width.medium}px`)
            }
            
            return true
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  /**
   * Property 18: Reduced motion accessibility
   * Feature: multi-theme-system, Property 18: Reduced motion accessibility
   * Validates: Requirements 10.4
   * 
   * For any theme change when reduced motion is enabled, 
   * all transition animations should be disabled
   */
  describe('Property 18: Reduced motion accessibility', () => {
    it('should disable transitions when prefers-reduced-motion is enabled', async () => {
      // Mock matchMedia to return true for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      await fc.assert(
        fc.asyncProperty(
          generateThemeConfig(),
          generateThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          async (fromTheme, toTheme, mode) => {
            // Apply initial theme
            engine.applyTheme(fromTheme, mode)
            
            // Start transition
            const startTime = Date.now()
            await engine.transitionTheme(fromTheme, toTheme, mode, 300)
            const elapsed = Date.now() - startTime
            
            // Transition should complete immediately (< 50ms)
            expect(elapsed).toBeLessThan(50)
            
            // Transition class should never be added
            expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false)
            
            // Theme should still be applied correctly
            const appliedBg = document.documentElement.style.getPropertyValue('--color-bg')
            expect(appliedBg).toBe(toTheme.colors[mode].bg)
            
            return true
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  /**
   * Property 19: Initial load without transition
   * Feature: multi-theme-system, Property 19: Initial load without transition
   * Validates: Requirements 10.5
   * 
   * For any page load, the saved theme should be applied immediately 
   * without visible transition animation
   */
  describe('Property 19: Initial load without transition', () => {
    it('should apply theme without transition on initial load', () => {
      fc.assert(
        fc.property(
          generateThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          (theme, mode) => {
            // Create a fresh engine to simulate initial load
            const freshEngine = new ThemeEngine()
            
            // Apply theme (this is the initial load)
            freshEngine.applyTheme(theme, mode)
            
            // Check that no-transition class was added
            expect(document.documentElement.classList.contains('no-transition')).toBe(true)
            
            // Theme should be applied correctly
            const appliedBg = document.documentElement.style.getPropertyValue('--color-bg')
            expect(appliedBg).toBe(theme.colors[mode].bg)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should remove no-transition class after initial load', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          async (theme, mode) => {
            // Create a fresh engine to simulate initial load
            const freshEngine = new ThemeEngine()
            
            // Apply theme (this is the initial load)
            freshEngine.applyTheme(theme, mode)
            
            // Wait for requestAnimationFrame callbacks to complete
            await new Promise(resolve => requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTimeout(resolve, 10)
              })
            }))
            
            // no-transition class should be removed
            expect(document.documentElement.classList.contains('no-transition')).toBe(false)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should allow transitions on subsequent theme changes', async () => {
      // Mock matchMedia to return false for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      await fc.assert(
        fc.asyncProperty(
          generateThemeConfig(),
          generateThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          async (firstTheme, secondTheme, mode) => {
            // Skip if themes are identical
            if (firstTheme.id === secondTheme.id) {
              return true
            }

            // Create a fresh engine and apply initial theme
            const freshEngine = new ThemeEngine()
            freshEngine.applyTheme(firstTheme, mode)
            
            // Wait for no-transition class to be removed
            await new Promise(resolve => requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTimeout(resolve, 10)
              })
            }))
            
            // Now apply second theme with transition
            await freshEngine.transitionTheme(firstTheme, secondTheme, mode, 100)
            
            // Verify transition occurred (theme-transitioning class was used)
            // We can't check this directly since it's removed after transition,
            // but we can verify the theme was applied
            const appliedBg = document.documentElement.style.getPropertyValue('--color-bg')
            expect(appliedBg).toBe(secondTheme.colors[mode].bg)
            
            return true
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})

/**
 * Generator for theme configurations
 */
function generateThemeConfig(): fc.Arbitrary<ThemeConfig> {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ maxLength: 200 }),
    category: fc.constantFrom('preset' as const, 'custom' as const),
    version: fc.constant('1.0.0'),
    colors: fc.record({
      light: generateColorPalette(),
      dark: generateColorPalette(),
    }),
    typography: generateTypography(),
    spacing: generateSpacing(),
    shadows: generateShadows(),
    borders: generateBorders(),
    animations: generateAnimationConfig(),
    accessibility: generateAccessibilityConfig(),
  })
}

function generateColorPalette() {
  return fc.record({
    bg: generateColor(),
    bgSecondary: generateColor(),
    bgTertiary: generateColor(),
    text: generateColor(),
    textSecondary: generateColor(),
    textTertiary: generateColor(),
    primary: generateColor(),
    secondary: generateColor(),
    accent: generateColor(),
    success: generateColor(),
    warning: generateColor(),
    error: generateColor(),
    info: generateColor(),
    border: generateColor(),
    borderLight: generateColor(),
    borderHeavy: generateColor(),
  })
}

function generateColor(): fc.Arbitrary<string> {
  return fc.tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  ).map(([r, g, b]) => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  })
}

function generateTypography() {
  return fc.record({
    fontFamilyHeading: fc.constantFrom('Arial', 'Helvetica', 'Georgia', 'Times New Roman'),
    fontFamilyBody: fc.constantFrom('Arial', 'Helvetica', 'Verdana', 'sans-serif'),
    fontFamilyMono: fc.constantFrom('Courier', 'monospace', 'Consolas'),
    fontSizeBase: fc.integer({ min: 14, max: 18 }),
    fontSizeScale: fc.constant([12, 14, 16, 18, 24, 32, 48, 64] as number[]),
    fontWeightNormal: fc.constant(400),
    fontWeightMedium: fc.integer({ min: 500, max: 600 }),
    fontWeightBold: fc.integer({ min: 700, max: 800 }),
    lineHeightBase: fc.double({ min: 1.2, max: 1.8 }),
    letterSpacing: fc.constantFrom('0', '0.01em', '0.05em'),
  })
}

function generateSpacing() {
  return fc.record({
    unit: fc.integer({ min: 4, max: 12 }),
    scale: fc.constant([4, 8, 12, 16, 24, 32, 48, 64, 96] as number[]),
  })
}

function generateShadows() {
  return fc.record({
    sm: fc.constant('0 1px 2px rgba(0, 0, 0, 0.05)'),
    md: fc.constant('0 4px 6px rgba(0, 0, 0, 0.1)'),
    lg: fc.constant('0 10px 15px rgba(0, 0, 0, 0.1)'),
    xl: fc.constant('0 20px 25px rgba(0, 0, 0, 0.15)'),
    inner: fc.constant('inset 0 2px 4px rgba(0, 0, 0, 0.06)'),
  })
}

function generateBorders() {
  return fc.record({
    width: fc.record({
      thin: fc.integer({ min: 1, max: 2 }),
      medium: fc.integer({ min: 2, max: 4 }),
      thick: fc.integer({ min: 4, max: 6 }),
    }),
    radius: fc.record({
      sm: fc.integer({ min: 2, max: 6 }),
      md: fc.integer({ min: 6, max: 12 }),
      lg: fc.integer({ min: 12, max: 24 }),
      full: fc.constant(9999),
    }),
    style: fc.constantFrom('solid' as const, 'dashed' as const, 'dotted' as const),
  })
}

function generateAnimationConfig() {
  return fc.record({
    duration: fc.record({
      fast: fc.integer({ min: 100, max: 200 }),
      base: fc.integer({ min: 250, max: 400 }),
      slow: fc.integer({ min: 400, max: 600 }),
    }),
    easing: fc.record({
      smooth: fc.constant('cubic-bezier(0.4, 0, 0.2, 1)'),
      bounce: fc.constant('cubic-bezier(0.68, -0.55, 0.265, 1.55)'),
      sharp: fc.constant('cubic-bezier(0.4, 0, 0.6, 1)'),
    }),
    effects: fc.constant(['fade', 'scale'] as string[]),
  })
}

function generateAccessibilityConfig() {
  return fc.record({
    contrastRatio: fc.constantFrom('AA' as const, 'AAA' as const),
    reducedMotion: fc.boolean(),
    focusIndicatorWidth: fc.integer({ min: 2, max: 4 }),
    focusIndicatorColor: generateColor(),
  })
}

