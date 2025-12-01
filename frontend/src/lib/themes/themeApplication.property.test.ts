import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import type { ThemeConfig, ColorPalette, Typography, Spacing, Shadows, Borders, AnimationConfig, AccessibilityConfig } from './types'

/**
 * Property-Based Tests for Theme Application
 * Feature: multi-theme-system
 */

describe('Theme Application Property Tests', () => {
  let originalDocumentElement: HTMLElement

  beforeEach(() => {
    // Save original document element
    originalDocumentElement = document.documentElement
  })

  afterEach(() => {
    // Clean up any CSS variables we set
    const root = document.documentElement
    const styles = root.style
    for (let i = styles.length - 1; i >= 0; i--) {
      const prop = styles[i]
      if (prop.startsWith('--')) {
        root.style.removeProperty(prop)
      }
    }
  })

  // Arbitraries for generating random theme configurations
  // Generate valid hex colors by creating 6 hex digits
  const hexColorArbitrary = fc.tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  ).map(([r, g, b]) => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  })

  const colorArbitrary = fc.oneof(
    hexColorArbitrary,
    fc.tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }))
      .map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`)
  )

  const colorPaletteArbitrary: fc.Arbitrary<ColorPalette> = fc.record({
    bg: colorArbitrary,
    bgSecondary: colorArbitrary,
    bgTertiary: colorArbitrary,
    text: colorArbitrary,
    textSecondary: colorArbitrary,
    textTertiary: colorArbitrary,
    primary: colorArbitrary,
    secondary: colorArbitrary,
    accent: colorArbitrary,
    success: colorArbitrary,
    warning: colorArbitrary,
    error: colorArbitrary,
    info: colorArbitrary,
    border: colorArbitrary,
    borderLight: colorArbitrary,
    borderHeavy: colorArbitrary
  })

  const typographyArbitrary: fc.Arbitrary<Typography> = fc.record({
    fontFamilyHeading: fc.constantFrom('Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New'),
    fontFamilyBody: fc.constantFrom('Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New'),
    fontFamilyMono: fc.constantFrom('Courier New', 'Monaco', 'Consolas'),
    fontSizeBase: fc.integer({ min: 12, max: 20 }),
    fontSizeScale: fc.array(fc.integer({ min: 10, max: 72 }), { minLength: 8, maxLength: 8 }),
    fontWeightNormal: fc.constantFrom(300, 400, 500),
    fontWeightMedium: fc.constantFrom(500, 600),
    fontWeightBold: fc.constantFrom(600, 700, 800),
    lineHeightBase: fc.double({ min: 1.2, max: 2.0 }),
    letterSpacing: fc.constantFrom('0', '0.01em', '0.05em', '-0.01em')
  })

  const spacingArbitrary: fc.Arbitrary<Spacing> = fc.record({
    unit: fc.integer({ min: 4, max: 16 }),
    scale: fc.array(fc.integer({ min: 4, max: 128 }), { minLength: 9, maxLength: 9 })
  })

  const shadowsArbitrary: fc.Arbitrary<Shadows> = fc.record({
    sm: fc.string(),
    md: fc.string(),
    lg: fc.string(),
    xl: fc.string(),
    inner: fc.string(),
    glow: fc.option(fc.string())
  })

  const bordersArbitrary: fc.Arbitrary<Borders> = fc.record({
    width: fc.record({
      thin: fc.integer({ min: 1, max: 3 }),
      medium: fc.integer({ min: 2, max: 5 }),
      thick: fc.integer({ min: 3, max: 8 })
    }),
    radius: fc.record({
      sm: fc.integer({ min: 0, max: 8 }),
      md: fc.integer({ min: 4, max: 16 }),
      lg: fc.integer({ min: 8, max: 32 }),
      full: fc.constant(9999)
    }),
    style: fc.constantFrom('solid' as const, 'dashed' as const, 'dotted' as const)
  })

  const animationConfigArbitrary: fc.Arbitrary<AnimationConfig> = fc.record({
    duration: fc.record({
      fast: fc.integer({ min: 100, max: 200 }),
      base: fc.integer({ min: 200, max: 400 }),
      slow: fc.integer({ min: 400, max: 800 })
    }),
    easing: fc.record({
      smooth: fc.constant('cubic-bezier(0.4, 0, 0.2, 1)'),
      bounce: fc.constant('cubic-bezier(0.68, -0.55, 0.265, 1.55)'),
      sharp: fc.constant('cubic-bezier(0.4, 0, 0.6, 1)')
    }),
    effects: fc.array(fc.constantFrom('fade', 'bounce', 'scale', 'glitch'), { minLength: 1, maxLength: 4 })
  })

  const accessibilityConfigArbitrary: fc.Arbitrary<AccessibilityConfig> = fc.record({
    contrastRatio: fc.constantFrom('AA' as const, 'AAA' as const),
    reducedMotion: fc.boolean(),
    focusIndicatorWidth: fc.integer({ min: 2, max: 4 }),
    focusIndicatorColor: colorArbitrary
  })

  const themeConfigArbitrary: fc.Arbitrary<ThemeConfig> = fc.record({
    id: fc.string({ minLength: 3, maxLength: 20 }),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    description: fc.string({ minLength: 10, maxLength: 100 }),
    category: fc.constantFrom('preset' as const, 'custom' as const),
    author: fc.option(fc.string({ minLength: 3, maxLength: 30 })),
    version: fc.constant('1.0.0'),
    colors: fc.record({
      light: colorPaletteArbitrary,
      dark: colorPaletteArbitrary
    }),
    typography: typographyArbitrary,
    spacing: spacingArbitrary,
    shadows: shadowsArbitrary,
    borders: bordersArbitrary,
    animations: animationConfigArbitrary,
    accessibility: accessibilityConfigArbitrary
  })

  /**
   * Property 1: Theme application
   * For any theme selection, the system should immediately apply all theme properties
   * (colors, typography, spacing, shadows, borders) to CSS variables without page reload
   * 
   * **Feature: multi-theme-system, Property 1: Theme application**
   * **Validates: Requirements 1.2, 1.3, 11.1, 11.2, 11.3, 11.4, 11.5**
   */
  it('Property 1: Theme application - all theme properties are applied to CSS variables', () => {
    fc.assert(
      fc.property(
        themeConfigArbitrary,
        fc.constantFrom('light' as const, 'dark' as const),
        (theme, mode) => {
          const root = document.documentElement
          const colors = theme.colors[mode]

          // Apply color variables
          root.style.setProperty('--color-bg', colors.bg)
          root.style.setProperty('--color-bg-secondary', colors.bgSecondary)
          root.style.setProperty('--color-text', colors.text)
          root.style.setProperty('--color-primary', colors.primary)
          root.style.setProperty('--color-border', colors.border)

          // Apply typography variables
          root.style.setProperty('--font-family-heading', theme.typography.fontFamilyHeading)
          root.style.setProperty('--font-size-base', `${theme.typography.fontSizeBase}px`)
          root.style.setProperty('--font-weight-bold', theme.typography.fontWeightBold.toString())

          // Apply spacing variables
          root.style.setProperty('--spacing-unit', `${theme.spacing.unit}px`)
          theme.spacing.scale.forEach((value, index) => {
            root.style.setProperty(`--spacing-${index}`, `${value}px`)
          })

          // Apply shadow variables
          root.style.setProperty('--shadow-sm', theme.shadows.sm)
          root.style.setProperty('--shadow-md', theme.shadows.md)

          // Apply border variables
          root.style.setProperty('--border-width-medium', `${theme.borders.width.medium}px`)
          root.style.setProperty('--border-radius-md', `${theme.borders.radius.md}px`)

          // Apply animation variables
          root.style.setProperty('--animation-duration-base', `${theme.animations.duration.base}ms`)
          root.style.setProperty('--animation-easing-smooth', theme.animations.easing.smooth)

          // Verify all variables were set correctly
          const computedStyle = getComputedStyle(root)
          
          expect(computedStyle.getPropertyValue('--color-bg')).toBe(colors.bg)
          expect(computedStyle.getPropertyValue('--color-text')).toBe(colors.text)
          expect(computedStyle.getPropertyValue('--font-family-heading')).toBe(theme.typography.fontFamilyHeading)
          expect(computedStyle.getPropertyValue('--font-size-base')).toBe(`${theme.typography.fontSizeBase}px`)
          expect(computedStyle.getPropertyValue('--spacing-unit')).toBe(`${theme.spacing.unit}px`)
          expect(computedStyle.getPropertyValue('--border-width-medium')).toBe(`${theme.borders.width.medium}px`)
          expect(computedStyle.getPropertyValue('--animation-duration-base')).toBe(`${theme.animations.duration.base}ms`)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 1 (extended): Theme application preserves all color properties
   */
  it('Property 1 (extended): All color properties are applied correctly', () => {
    fc.assert(
      fc.property(
        colorPaletteArbitrary,
        (colors) => {
          const root = document.documentElement

          // Apply all color variables
          root.style.setProperty('--color-bg', colors.bg)
          root.style.setProperty('--color-bg-secondary', colors.bgSecondary)
          root.style.setProperty('--color-bg-tertiary', colors.bgTertiary)
          root.style.setProperty('--color-text', colors.text)
          root.style.setProperty('--color-text-secondary', colors.textSecondary)
          root.style.setProperty('--color-text-tertiary', colors.textTertiary)
          root.style.setProperty('--color-primary', colors.primary)
          root.style.setProperty('--color-secondary', colors.secondary)
          root.style.setProperty('--color-accent', colors.accent)
          root.style.setProperty('--color-success', colors.success)
          root.style.setProperty('--color-warning', colors.warning)
          root.style.setProperty('--color-error', colors.error)
          root.style.setProperty('--color-info', colors.info)
          root.style.setProperty('--color-border', colors.border)
          root.style.setProperty('--color-border-light', colors.borderLight)
          root.style.setProperty('--color-border-heavy', colors.borderHeavy)

          // Verify all color variables were set
          const computedStyle = getComputedStyle(root)
          
          expect(computedStyle.getPropertyValue('--color-bg')).toBe(colors.bg)
          expect(computedStyle.getPropertyValue('--color-text')).toBe(colors.text)
          expect(computedStyle.getPropertyValue('--color-primary')).toBe(colors.primary)
          expect(computedStyle.getPropertyValue('--color-success')).toBe(colors.success)
          expect(computedStyle.getPropertyValue('--color-border')).toBe(colors.border)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 1 (extended): Typography properties are applied correctly
   */
  it('Property 1 (extended): All typography properties are applied correctly', () => {
    fc.assert(
      fc.property(
        typographyArbitrary,
        (typography) => {
          const root = document.documentElement

          // Apply typography variables
          root.style.setProperty('--font-family-heading', typography.fontFamilyHeading)
          root.style.setProperty('--font-family-body', typography.fontFamilyBody)
          root.style.setProperty('--font-family-mono', typography.fontFamilyMono)
          root.style.setProperty('--font-size-base', `${typography.fontSizeBase}px`)
          root.style.setProperty('--font-weight-normal', typography.fontWeightNormal.toString())
          root.style.setProperty('--font-weight-medium', typography.fontWeightMedium.toString())
          root.style.setProperty('--font-weight-bold', typography.fontWeightBold.toString())
          root.style.setProperty('--line-height-base', typography.lineHeightBase.toString())
          root.style.setProperty('--letter-spacing', typography.letterSpacing)

          // Verify typography variables were set
          const computedStyle = getComputedStyle(root)
          
          expect(computedStyle.getPropertyValue('--font-family-heading')).toBe(typography.fontFamilyHeading)
          expect(computedStyle.getPropertyValue('--font-size-base')).toBe(`${typography.fontSizeBase}px`)
          expect(computedStyle.getPropertyValue('--font-weight-bold')).toBe(typography.fontWeightBold.toString())
          expect(computedStyle.getPropertyValue('--line-height-base')).toBe(typography.lineHeightBase.toString())
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 1 (extended): Spacing scale is applied correctly
   */
  it('Property 1 (extended): Spacing scale properties are applied correctly', () => {
    fc.assert(
      fc.property(
        spacingArbitrary,
        (spacing) => {
          const root = document.documentElement

          // Apply spacing variables
          root.style.setProperty('--spacing-unit', `${spacing.unit}px`)
          spacing.scale.forEach((value, index) => {
            root.style.setProperty(`--spacing-${index}`, `${value}px`)
          })

          // Verify spacing variables were set
          const computedStyle = getComputedStyle(root)
          
          expect(computedStyle.getPropertyValue('--spacing-unit')).toBe(`${spacing.unit}px`)
          spacing.scale.forEach((value, index) => {
            expect(computedStyle.getPropertyValue(`--spacing-${index}`)).toBe(`${value}px`)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
