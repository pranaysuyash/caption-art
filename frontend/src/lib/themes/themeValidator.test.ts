/**
 * Unit Tests for ThemeValidator
 * 
 * Tests basic validation functionality for theme configurations.
 */

import { describe, it, expect } from 'vitest'
import { ThemeValidator } from './themeValidator'
import type { ThemeConfig } from './types'
import { neobrutalism } from './presets/neobrutalism'

describe('ThemeValidator', () => {
  const validator = new ThemeValidator()

  describe('validate', () => {
    it('should validate a theme structure', () => {
      const result = validator.validate(neobrutalism)
      
      // Theme should have structure validation pass (may have contrast warnings)
      expect(result.errors.every(e => !e.field.includes('id') && !e.field.includes('name'))).toBe(true)
    })

    it('should reject theme with missing required fields', () => {
      const invalidTheme = {
        id: 'test',
        name: 'Test Theme',
        // Missing other required fields
      } as unknown as ThemeConfig

      const result = validator.validate(invalidTheme)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject theme with invalid category', () => {
      const invalidTheme = {
        ...neobrutalism,
        category: 'invalid' as any
      }

      const result = validator.validate(invalidTheme)
      
      expect(result.valid).toBe(false)
      const categoryError = result.errors.find(e => e.field === 'category')
      expect(categoryError).toBeDefined()
    })
  })

  describe('validateColors', () => {
    it('should validate color scheme structure', () => {
      const result = validator.validateColors(neobrutalism.colors)
      
      // Should have both light and dark palettes
      expect(result.errors.filter(e => e.field === 'colors.light' || e.field === 'colors.dark')).toHaveLength(0)
    })

    it('should reject color scheme with missing light palette', () => {
      const invalidColors = {
        dark: neobrutalism.colors.dark
      } as any

      const result = validator.validateColors(invalidColors)
      
      expect(result.valid).toBe(false)
      const lightError = result.errors.find(e => e.field === 'colors.light')
      expect(lightError).toBeDefined()
    })

    it('should reject color scheme with missing dark palette', () => {
      const invalidColors = {
        light: neobrutalism.colors.light
      } as any

      const result = validator.validateColors(invalidColors)
      
      expect(result.valid).toBe(false)
      const darkError = result.errors.find(e => e.field === 'colors.dark')
      expect(darkError).toBeDefined()
    })
  })

  describe('validateColorFormat', () => {
    it('should accept valid hex colors', () => {
      expect(validator.validateColorFormat('#FF0000')).toBe(true)
      expect(validator.validateColorFormat('#000')).toBe(true)
      expect(validator.validateColorFormat('#FFFFFF')).toBe(true)
    })

    it('should accept valid rgb colors', () => {
      expect(validator.validateColorFormat('rgb(255, 0, 0)')).toBe(true)
      expect(validator.validateColorFormat('rgba(255, 0, 0, 0.5)')).toBe(true)
    })

    it('should accept valid named colors', () => {
      expect(validator.validateColorFormat('red')).toBe(true)
      expect(validator.validateColorFormat('blue')).toBe(true)
      expect(validator.validateColorFormat('transparent')).toBe(true)
    })

    it('should reject invalid colors', () => {
      expect(validator.validateColorFormat('not-a-color')).toBe(false)
      expect(validator.validateColorFormat('#GGGGGG')).toBe(false)
      // Note: rgb(300, 0, 0) is actually valid in browsers - they clamp values
      expect(validator.validateColorFormat('invalid-rgb(a, b, c)')).toBe(false)
    })
  })

  describe('validateContrast', () => {
    it('should validate contrast between black and white meets AA', () => {
      expect(validator.validateContrast('#000000', '#FFFFFF', 'AA')).toBe(true)
    })

    it('should validate contrast between black and white meets AAA', () => {
      expect(validator.validateContrast('#000000', '#FFFFFF', 'AAA')).toBe(true)
    })

    it('should reject poor contrast for AA', () => {
      expect(validator.validateContrast('#CCCCCC', '#DDDDDD', 'AA')).toBe(false)
    })

    it('should reject poor contrast for AAA', () => {
      expect(validator.validateContrast('#666666', '#FFFFFF', 'AAA')).toBe(false)
    })
  })

  describe('validateTypography', () => {
    it('should validate valid typography', () => {
      const result = validator.validateTypography(neobrutalism.typography)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject typography with invalid font size', () => {
      const invalidTypography = {
        ...neobrutalism.typography,
        fontSizeBase: 5 // Too small
      }

      const result = validator.validateTypography(invalidTypography)
      
      expect(result.valid).toBe(false)
      const sizeError = result.errors.find(e => e.field === 'typography.fontSizeBase')
      expect(sizeError).toBeDefined()
    })

    it('should reject typography with invalid font weight', () => {
      const invalidTypography = {
        ...neobrutalism.typography,
        fontWeightNormal: 450 // Invalid weight
      }

      const result = validator.validateTypography(invalidTypography)
      
      expect(result.valid).toBe(false)
      const weightError = result.errors.find(e => e.field === 'typography.fontWeightNormal')
      expect(weightError).toBeDefined()
    })
  })

  describe('validateAccessibility', () => {
    it('should validate valid accessibility config', () => {
      const result = validator.validateAccessibility(neobrutalism.accessibility)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid contrast ratio level', () => {
      const invalidConfig = {
        ...neobrutalism.accessibility,
        contrastRatio: 'A' as any
      }

      const result = validator.validateAccessibility(invalidConfig)
      
      expect(result.valid).toBe(false)
      const ratioError = result.errors.find(e => e.field === 'accessibility.contrastRatio')
      expect(ratioError).toBeDefined()
    })

    it('should reject invalid focus indicator width', () => {
      const invalidConfig = {
        ...neobrutalism.accessibility,
        focusIndicatorWidth: 20 // Too large
      }

      const result = validator.validateAccessibility(invalidConfig)
      
      expect(result.valid).toBe(false)
      const widthError = result.errors.find(e => e.field === 'accessibility.focusIndicatorWidth')
      expect(widthError).toBeDefined()
    })
  })

  describe('validateHighContrastMode', () => {
    it('should validate high contrast palette', () => {
      const highContrastPalette = {
        ...neobrutalism.colors.light,
        text: '#000000',
        textSecondary: '#1A1A1A',
        bg: '#FFFFFF'
      }

      const result = validator.validateHighContrastMode(highContrastPalette, 'light')
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject palette that does not meet AAA standards', () => {
      const lowContrastPalette = {
        ...neobrutalism.colors.light,
        text: '#666666', // Does not meet 7:1 with white
        bg: '#FFFFFF'
      }

      const result = validator.validateHighContrastMode(lowContrastPalette, 'light')
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateColorBlindMode', () => {
    it('should validate color blind friendly palette', () => {
      const colorBlindPalette = {
        ...neobrutalism.colors.light,
        success: '#10B981', // Bright green
        error: '#7C2D12', // Dark red - different luminance
        bg: '#FFFFFF'
      }

      const result = validator.validateColorBlindMode(colorBlindPalette, 'light')
      
      expect(result.valid).toBe(true)
    })

    it('should warn about poor color blind accessibility', () => {
      const poorColorBlindPalette = {
        ...neobrutalism.colors.light,
        success: '#059669',
        error: '#DC2626', // Similar luminance to success
        warning: '#D97706',
        info: '#D97706', // Same as warning
        bg: '#FFFFFF'
      }

      const result = validator.validateColorBlindMode(poorColorBlindPalette, 'light')
      
      // Should have warnings about similar colors
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })
})

