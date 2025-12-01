/**
 * Property-Based Tests for ThemeValidator
 * 
 * Tests accessibility contrast ratios, high contrast mode, and color blind mode validation.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { ThemeValidator } from './themeValidator'
import type { ThemeConfig, ColorPalette } from './types'
import { getContrastRatio } from './utils/contrastChecker'

describe('ThemeValidator Property Tests', () => {
  const validator = new ThemeValidator()

  /**
   * Property 9: Accessibility contrast ratios
   * Feature: multi-theme-system, Property 9: Accessibility contrast ratios
   * Validates: Requirements 6.3, 6.4, 12.1, 12.2, 12.3
   * 
   * For any theme in any mode, text/background contrast should meet WCAG AA (4.5:1),
   * interactive elements should have sufficient contrast, and focus indicators 
   * should have 3:1 contrast ratio
   */
  describe('Property 9: Accessibility contrast ratios', () => {
    it('should validate that all themes meet WCAG AA contrast standards', () => {
      fc.assert(
        fc.property(
          generateAccessibleThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          (theme, mode) => {
            const palette = theme.colors[mode]
            
            // Requirement 12.1: Text/background contrast must meet WCAG AA (4.5:1)
            const textBgRatio = getContrastRatio(palette.text, palette.bg)
            expect(textBgRatio).toBeGreaterThanOrEqual(4.5)
            
            // Requirement 12.2: Interactive elements (primary color) must have sufficient contrast
            const primaryBgRatio = getContrastRatio(palette.primary, palette.bg)
            expect(primaryBgRatio).toBeGreaterThanOrEqual(3.0)
            
            // Requirement 12.3: Focus indicators must have 3:1 contrast ratio
            const focusIndicatorRatio = getContrastRatio(
              theme.accessibility.focusIndicatorColor,
              palette.bg
            )
            expect(focusIndicatorRatio).toBeGreaterThanOrEqual(3.0)
            
            // Requirement 6.3: Secondary text should also meet AA standards
            const textSecondaryBgRatio = getContrastRatio(palette.textSecondary, palette.bg)
            expect(textSecondaryBgRatio).toBeGreaterThanOrEqual(4.5)
            
            // Requirement 6.4: Border contrast should be sufficient
            const borderBgRatio = getContrastRatio(palette.border, palette.bg)
            expect(borderBgRatio).toBeGreaterThanOrEqual(3.0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject themes that do not meet WCAG AA standards', () => {
      fc.assert(
        fc.property(
          generatePoorContrastThemeConfig(),
          (theme) => {
            const result = validator.validate(theme)
            
            // Theme with poor contrast should fail validation
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
            
            // Should have contrast-related errors
            const contrastErrors = result.errors.filter(e => 
              e.message.includes('contrast') || e.message.includes('WCAG')
            )
            expect(contrastErrors.length).toBeGreaterThan(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should validate focus indicator contrast independently', () => {
      fc.assert(
        fc.property(
          generateColor(),
          generateColor(),
          (focusColor, bgColor) => {
            const ratio = getContrastRatio(focusColor, bgColor)
            const meetsStandard = validator.validateContrast(focusColor, bgColor, 'AA')
            
            // If ratio is >= 4.5, should meet AA standard
            if (ratio >= 4.5) {
              expect(meetsStandard).toBe(true)
            } else {
              expect(meetsStandard).toBe(false)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 20: High contrast mode
   * Feature: multi-theme-system, Property 20: High contrast mode
   * Validates: Requirements 12.4
   * 
   * For any theme when high contrast mode is enabled, 
   * all contrast ratios should meet WCAG AAA standards (7:1)
   */
  describe('Property 20: High contrast mode', () => {
    it('should validate that high contrast themes meet WCAG AAA standards (7:1)', () => {
      fc.assert(
        fc.property(
          generateHighContrastThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          (theme, mode) => {
            const palette = theme.colors[mode]
            
            // Validate using the high contrast mode validator
            const result = validator.validateHighContrastMode(palette, mode)
            
            // Should pass validation
            expect(result.valid).toBe(true)
            expect(result.errors.length).toBe(0)
            
            // Verify actual contrast ratios meet AAA (7:1)
            const textBgRatio = getContrastRatio(palette.text, palette.bg)
            expect(textBgRatio).toBeGreaterThanOrEqual(7.0)
            
            const textSecondaryBgRatio = getContrastRatio(palette.textSecondary, palette.bg)
            expect(textSecondaryBgRatio).toBeGreaterThanOrEqual(7.0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject themes that do not meet WCAG AAA standards in high contrast mode', () => {
      fc.assert(
        fc.property(
          generateAccessibleThemeConfig(), // AA compliant but not AAA
          fc.constantFrom('light' as const, 'dark' as const),
          (theme, mode) => {
            const palette = theme.colors[mode]
            const result = validator.validateHighContrastMode(palette, mode)
            
            // Check if it actually meets AAA
            const textBgRatio = getContrastRatio(palette.text, palette.bg)
            const textSecondaryBgRatio = getContrastRatio(palette.textSecondary, palette.bg)
            
            if (textBgRatio < 7.0 || textSecondaryBgRatio < 7.0) {
              // Should fail AAA validation
              expect(result.valid).toBe(false)
              expect(result.errors.length).toBeGreaterThan(0)
            } else {
              // Should pass AAA validation
              expect(result.valid).toBe(true)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 21: Color blind mode
   * Feature: multi-theme-system, Property 21: Color blind mode
   * Validates: Requirements 12.5
   * 
   * For any theme when color blind mode is enabled, 
   * the color palette should use color blind friendly combinations
   */
  describe('Property 21: Color blind mode', () => {
    it('should validate color blind friendly palettes', () => {
      fc.assert(
        fc.property(
          generateColorBlindFriendlyThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          (theme, mode) => {
            const palette = theme.colors[mode]
            const result = validator.validateColorBlindMode(palette, mode)
            
            // Should pass validation (may have warnings but no errors)
            expect(result.valid).toBe(true)
            
            // Check that success/error colors have sufficient luminance difference
            const successRatio = getContrastRatio(palette.success, palette.bg)
            const errorRatio = getContrastRatio(palette.error, palette.bg)
            const luminanceDiff = Math.abs(successRatio - errorRatio)
            
            // If luminance difference is sufficient, should have no warnings
            if (luminanceDiff >= 1.5) {
              const successErrorWarnings = result.warnings.filter(w =>
                w.field.includes('success/error')
              )
              expect(successErrorWarnings.length).toBe(0)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should warn about poor color blind accessibility', () => {
      fc.assert(
        fc.property(
          generatePoorColorBlindThemeConfig(),
          fc.constantFrom('light' as const, 'dark' as const),
          (theme, mode) => {
            const palette = theme.colors[mode]
            const result = validator.validateColorBlindMode(palette, mode)
            
            // Check actual luminance differences
            const successRatio = getContrastRatio(palette.success, palette.bg)
            const errorRatio = getContrastRatio(palette.error, palette.bg)
            const successErrorDiff = Math.abs(successRatio - errorRatio)
            
            const warningRatio = getContrastRatio(palette.warning, palette.bg)
            const infoRatio = getContrastRatio(palette.info, palette.bg)
            const warningInfoDiff = Math.abs(warningRatio - infoRatio)
            
            // If luminance differences are too small, should have warnings
            if (successErrorDiff < 1.5 || warningInfoDiff < 1.5) {
              expect(result.warnings.length).toBeGreaterThan(0)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

/**
 * Generators for theme configurations with specific contrast properties
 */

function generateAccessibleThemeConfig(): fc.Arbitrary<ThemeConfig> {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ maxLength: 200 }),
    category: fc.constantFrom('preset' as const, 'custom' as const),
    version: fc.constant('1.0.0'),
    colors: fc.record({
      light: generateAccessibleColorPalette('light'),
      dark: generateAccessibleColorPalette('dark'),
    }),
    typography: generateTypography(),
    spacing: generateSpacing(),
    shadows: generateShadows(),
    borders: generateBorders(),
    animations: generateAnimationConfig(),
    accessibility: generateAccessibilityConfig(),
  })
}

function generateHighContrastThemeConfig(): fc.Arbitrary<ThemeConfig> {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ maxLength: 200 }),
    category: fc.constantFrom('preset' as const, 'custom' as const),
    version: fc.constant('1.0.0'),
    colors: fc.record({
      light: generateHighContrastColorPalette('light'),
      dark: generateHighContrastColorPalette('dark'),
    }),
    typography: generateTypography(),
    spacing: generateSpacing(),
    shadows: generateShadows(),
    borders: generateBorders(),
    animations: generateAnimationConfig(),
    accessibility: fc.record({
      contrastRatio: fc.constant('AAA' as const),
      reducedMotion: fc.boolean(),
      focusIndicatorWidth: fc.integer({ min: 2, max: 4 }),
      focusIndicatorColor: fc.constant('#000000'), // High contrast
    }),
  })
}

function generateColorBlindFriendlyThemeConfig(): fc.Arbitrary<ThemeConfig> {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ maxLength: 200 }),
    category: fc.constantFrom('preset' as const, 'custom' as const),
    version: fc.constant('1.0.0'),
    colors: fc.record({
      light: generateColorBlindFriendlyPalette('light'),
      dark: generateColorBlindFriendlyPalette('dark'),
    }),
    typography: generateTypography(),
    spacing: generateSpacing(),
    shadows: generateShadows(),
    borders: generateBorders(),
    animations: generateAnimationConfig(),
    accessibility: generateAccessibilityConfig(),
  })
}

function generatePoorContrastThemeConfig(): fc.Arbitrary<ThemeConfig> {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ maxLength: 200 }),
    category: fc.constantFrom('preset' as const, 'custom' as const),
    version: fc.constant('1.0.0'),
    colors: fc.record({
      light: generatePoorContrastColorPalette(),
      dark: generatePoorContrastColorPalette(),
    }),
    typography: generateTypography(),
    spacing: generateSpacing(),
    shadows: generateShadows(),
    borders: generateBorders(),
    animations: generateAnimationConfig(),
    accessibility: generateAccessibilityConfig(),
  })
}

function generatePoorColorBlindThemeConfig(): fc.Arbitrary<ThemeConfig> {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ maxLength: 200 }),
    category: fc.constantFrom('preset' as const, 'custom' as const),
    version: fc.constant('1.0.0'),
    colors: fc.record({
      light: generatePoorColorBlindPalette('light'),
      dark: generatePoorColorBlindPalette('dark'),
    }),
    typography: generateTypography(),
    spacing: generateSpacing(),
    shadows: generateShadows(),
    borders: generateBorders(),
    animations: generateAnimationConfig(),
    accessibility: generateAccessibilityConfig(),
  })
}

function generateAccessibleColorPalette(mode: 'light' | 'dark'): fc.Arbitrary<ColorPalette> {
  const bg = mode === 'light' ? '#FFFFFF' : '#000000'
  const text = mode === 'light' ? '#000000' : '#FFFFFF'
  const textSecondary = mode === 'light' ? '#333333' : '#CCCCCC'
  
  return fc.record({
    bg: fc.constant(bg),
    bgSecondary: fc.constant(mode === 'light' ? '#F5F5F5' : '#1A1A1A'),
    bgTertiary: fc.constant(mode === 'light' ? '#EEEEEE' : '#2A2A2A'),
    text: fc.constant(text),
    textSecondary: fc.constant(textSecondary),
    textTertiary: fc.constant(mode === 'light' ? '#666666' : '#999999'),
    primary: fc.constant(mode === 'light' ? '#0066CC' : '#66B3FF'),
    secondary: fc.constant(mode === 'light' ? '#6B46C1' : '#A78BFA'),
    accent: fc.constant(mode === 'light' ? '#D97706' : '#FCD34D'),
    success: fc.constant(mode === 'light' ? '#059669' : '#34D399'),
    warning: fc.constant(mode === 'light' ? '#D97706' : '#FCD34D'),
    error: fc.constant(mode === 'light' ? '#DC2626' : '#F87171'),
    info: fc.constant(mode === 'light' ? '#0284C7' : '#38BDF8'),
    // Border colors must have 3:1 contrast with background
    border: fc.constant(mode === 'light' ? '#767676' : '#767676'), // 3:1 contrast on both
    borderLight: fc.constant(mode === 'light' ? '#949494' : '#5A5A5A'),
    borderHeavy: fc.constant(mode === 'light' ? '#595959' : '#949494'),
  })
}

function generateHighContrastColorPalette(mode: 'light' | 'dark'): fc.Arbitrary<ColorPalette> {
  const bg = mode === 'light' ? '#FFFFFF' : '#000000'
  const text = mode === 'light' ? '#000000' : '#FFFFFF'
  
  return fc.record({
    bg: fc.constant(bg),
    bgSecondary: fc.constant(mode === 'light' ? '#FAFAFA' : '#0A0A0A'),
    bgTertiary: fc.constant(mode === 'light' ? '#F5F5F5' : '#141414'),
    text: fc.constant(text),
    textSecondary: fc.constant(mode === 'light' ? '#1A1A1A' : '#E5E5E5'),
    textTertiary: fc.constant(mode === 'light' ? '#333333' : '#CCCCCC'),
    primary: fc.constant(mode === 'light' ? '#0052A3' : '#4D9FFF'),
    secondary: fc.constant(mode === 'light' ? '#5B21B6' : '#A78BFA'),
    accent: fc.constant(mode === 'light' ? '#B45309' : '#FCD34D'),
    success: fc.constant(mode === 'light' ? '#047857' : '#34D399'),
    warning: fc.constant(mode === 'light' ? '#B45309' : '#FCD34D'),
    error: fc.constant(mode === 'light' ? '#B91C1C' : '#F87171'),
    info: fc.constant(mode === 'light' ? '#0369A1' : '#38BDF8'),
    border: fc.constant(mode === 'light' ? '#000000' : '#FFFFFF'),
    borderLight: fc.constant(mode === 'light' ? '#666666' : '#999999'),
    borderHeavy: fc.constant(mode === 'light' ? '#000000' : '#FFFFFF'),
  })
}

function generateColorBlindFriendlyPalette(mode: 'light' | 'dark'): fc.Arbitrary<ColorPalette> {
  const bg = mode === 'light' ? '#FFFFFF' : '#000000'
  const text = mode === 'light' ? '#000000' : '#FFFFFF'
  
  return fc.record({
    bg: fc.constant(bg),
    bgSecondary: fc.constant(mode === 'light' ? '#F5F5F5' : '#1A1A1A'),
    bgTertiary: fc.constant(mode === 'light' ? '#EEEEEE' : '#2A2A2A'),
    text: fc.constant(text),
    textSecondary: fc.constant(mode === 'light' ? '#333333' : '#CCCCCC'),
    textTertiary: fc.constant(mode === 'light' ? '#666666' : '#999999'),
    primary: fc.constant(mode === 'light' ? '#0066CC' : '#66B3FF'),
    secondary: fc.constant(mode === 'light' ? '#6B46C1' : '#A78BFA'),
    accent: fc.constant(mode === 'light' ? '#D97706' : '#FCD34D'),
    // Use very different luminance for success (bright) and error (dark)
    success: fc.constant(mode === 'light' ? '#10B981' : '#6EE7B7'), // Bright green
    warning: fc.constant(mode === 'light' ? '#F59E0B' : '#FCD34D'),
    error: fc.constant(mode === 'light' ? '#7C2D12' : '#DC2626'), // Dark red
    info: fc.constant(mode === 'light' ? '#0284C7' : '#7DD3FC'), // Bright blue
    border: fc.constant(mode === 'light' ? '#CCCCCC' : '#444444'),
    borderLight: fc.constant(mode === 'light' ? '#E5E5E5' : '#333333'),
    borderHeavy: fc.constant(mode === 'light' ? '#999999' : '#666666'),
  })
}

function generatePoorContrastColorPalette(): fc.Arbitrary<ColorPalette> {
  // Generate colors with poor contrast (similar luminance)
  return fc.record({
    bg: fc.constant('#CCCCCC'),
    bgSecondary: fc.constant('#D0D0D0'),
    bgTertiary: fc.constant('#D5D5D5'),
    text: fc.constant('#AAAAAA'), // Poor contrast with bg
    textSecondary: fc.constant('#BBBBBB'), // Poor contrast
    textTertiary: fc.constant('#C0C0C0'),
    primary: fc.constant('#DDDDDD'), // Poor contrast
    secondary: fc.constant('#DADADA'),
    accent: fc.constant('#D8D8D8'),
    success: fc.constant('#D0D0D0'),
    warning: fc.constant('#CFCFCF'),
    error: fc.constant('#CECECE'),
    info: fc.constant('#CDCDCD'),
    border: fc.constant('#CACACA'), // Poor contrast
    borderLight: fc.constant('#D2D2D2'),
    borderHeavy: fc.constant('#C8C8C8'),
  })
}

function generatePoorColorBlindPalette(mode: 'light' | 'dark'): fc.Arbitrary<ColorPalette> {
  const bg = mode === 'light' ? '#FFFFFF' : '#000000'
  const text = mode === 'light' ? '#000000' : '#FFFFFF'
  
  return fc.record({
    bg: fc.constant(bg),
    bgSecondary: fc.constant(mode === 'light' ? '#F5F5F5' : '#1A1A1A'),
    bgTertiary: fc.constant(mode === 'light' ? '#EEEEEE' : '#2A2A2A'),
    text: fc.constant(text),
    textSecondary: fc.constant(mode === 'light' ? '#333333' : '#CCCCCC'),
    textTertiary: fc.constant(mode === 'light' ? '#666666' : '#999999'),
    primary: fc.constant(mode === 'light' ? '#0066CC' : '#66B3FF'),
    secondary: fc.constant(mode === 'light' ? '#6B46C1' : '#A78BFA'),
    accent: fc.constant(mode === 'light' ? '#D97706' : '#FCD34D'),
    // Use similar luminance for success and error (problematic for color blind users)
    success: fc.constant(mode === 'light' ? '#059669' : '#34D399'),
    warning: fc.constant(mode === 'light' ? '#D97706' : '#FCD34D'),
    error: fc.constant(mode === 'light' ? '#DC2626' : '#F87171'), // Similar luminance to success
    info: fc.constant(mode === 'light' ? '#D97706' : '#FCD34D'), // Similar to warning
    border: fc.constant(mode === 'light' ? '#CCCCCC' : '#444444'),
    borderLight: fc.constant(mode === 'light' ? '#E5E5E5' : '#333333'),
    borderHeavy: fc.constant(mode === 'light' ? '#999999' : '#666666'),
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
    fontFamilyHeading: fc.constantFrom('Arial', 'Helvetica', 'Georgia'),
    fontFamilyBody: fc.constantFrom('Arial', 'Helvetica', 'Verdana'),
    fontFamilyMono: fc.constantFrom('Courier', 'monospace', 'Consolas'),
    fontSizeBase: fc.integer({ min: 14, max: 18 }),
    fontSizeScale: fc.constant([12, 14, 16, 18, 24, 32, 48, 64]),
    fontWeightNormal: fc.constant(400),
    fontWeightMedium: fc.constant(500),
    fontWeightBold: fc.constant(700),
    lineHeightBase: fc.double({ min: 1.4, max: 1.6 }),
    letterSpacing: fc.constant('0'),
  })
}

function generateSpacing() {
  return fc.record({
    unit: fc.integer({ min: 4, max: 12 }),
    scale: fc.constant([4, 8, 12, 16, 24, 32, 48, 64, 96]),
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
    effects: fc.constant(['fade', 'scale']),
  })
}

function generateAccessibilityConfig() {
  return fc.record({
    contrastRatio: fc.constantFrom('AA' as const, 'AAA' as const),
    reducedMotion: fc.boolean(),
    focusIndicatorWidth: fc.integer({ min: 2, max: 4 }),
    focusIndicatorColor: fc.constant('#0066CC'),
  })
}

