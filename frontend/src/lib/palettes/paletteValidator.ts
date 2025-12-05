/**
 * Palette Validator
 * 
 * Validates color palettes for accessibility and correctness.
 * Ensures all palettes meet WCAG standards and provides suggestions
 * for accessible color alternatives.
 */

import type {
  ColorPalette,
  PaletteValidationResult,
  ValidationError,
  ValidationWarning,
  WCAGLevel,
} from './types'
import { getContrastRatio } from '../themes/utils/contrastChecker'
import { suggestAccessibleColor } from './colorAdjuster'
import { WCAG_CONTRAST_RATIOS, isValidHexColor } from './utils'

/**
 * PaletteValidator class
 * 
 * Provides methods for validating color palettes against WCAG standards
 * and suggesting accessible color alternatives.
 */
export class PaletteValidator {
  /**
   * Validate a complete color palette
   * 
   * Checks all text/background color combinations for WCAG compliance
   * and returns a detailed validation result.
   * 
   * @param palette - Color palette to validate
   * @returns Validation result with errors, warnings, and contrast ratios
   */
  validate(palette: ColorPalette): PaletteValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const contrastRatios: Record<string, number> = {}

    // Validate color format
    const colorEntries = Object.entries(palette.colors)
    for (const [key, color] of colorEntries) {
      if (!isValidHexColor(color)) {
        errors.push({
          field: key,
          message: `Invalid hex color format: ${color}`,
          severity: 'error',
        })
      }
    }

    // If there are format errors, return early
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
        contrastRatios,
        wcagLevel: 'fail',
      }
    }

    // Define text/background combinations to check
    const combinations = [
      { fg: 'text', bg: 'background', label: 'text/background' },
      { fg: 'text', bg: 'backgroundSecondary', label: 'text/backgroundSecondary' },
      { fg: 'textSecondary', bg: 'background', label: 'textSecondary/background' },
      { fg: 'textSecondary', bg: 'backgroundSecondary', label: 'textSecondary/backgroundSecondary' },
      { fg: 'primary', bg: 'background', label: 'primary/background' },
      { fg: 'secondary', bg: 'background', label: 'secondary/background' },
      { fg: 'tertiary', bg: 'background', label: 'tertiary/background' },
      { fg: 'accent', bg: 'background', label: 'accent/background' },
      { fg: 'success', bg: 'background', label: 'success/background' },
      { fg: 'warning', bg: 'background', label: 'warning/background' },
      { fg: 'error', bg: 'background', label: 'error/background' },
      { fg: 'info', bg: 'background', label: 'info/background' },
      { fg: 'text', bg: 'primary', label: 'text/primary' },
      { fg: 'text', bg: 'secondary', label: 'text/secondary' },
      { fg: 'text', bg: 'accent', label: 'text/accent' },
    ]

    // Check all combinations
    for (const { fg, bg, label } of combinations) {
      const foreground = palette.colors[fg as keyof typeof palette.colors]
      const background = palette.colors[bg as keyof typeof palette.colors]
      
      const ratio = this.validateContrast(foreground, background)
      contrastRatios[label] = ratio

      // Check if meets WCAG AA (4.5:1)
      if (ratio < WCAG_CONTRAST_RATIOS.AA_NORMAL) {
        const suggestedColor = this.suggestAccessibleColor(
          foreground,
          background,
          WCAG_CONTRAST_RATIOS.AA_NORMAL
        )

        errors.push({
          field: label,
          message: `Insufficient contrast ratio: ${ratio.toFixed(2)}:1 (requires 4.5:1 for WCAG AA)`,
          severity: 'error',
          contrastRatio: ratio,
          requiredRatio: WCAG_CONTRAST_RATIOS.AA_NORMAL,
        })

        warnings.push({
          field: label,
          message: `Consider using ${suggestedColor} for better accessibility`,
          severity: 'warning',
          contrastRatio: ratio,
          suggestedColor,
        })
      } else if (ratio < WCAG_CONTRAST_RATIOS.AAA_NORMAL) {
        // Meets AA but not AAA
        const suggestedColor = this.suggestAccessibleColor(
          foreground,
          background,
          WCAG_CONTRAST_RATIOS.AAA_NORMAL
        )

        warnings.push({
          field: label,
          message: `Meets WCAG AA but not AAA. Current ratio: ${ratio.toFixed(2)}:1`,
          severity: 'warning',
          contrastRatio: ratio,
          suggestedColor,
        })
      }
    }

    // Determine WCAG level
    const wcagLevel = this.checkWCAGCompliance(palette)

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      contrastRatios,
      wcagLevel,
    }
  }

  /**
   * Validate contrast ratio between two colors
   * 
   * @param foreground - Foreground hex color
   * @param background - Background hex color
   * @returns Contrast ratio (1-21)
   */
  validateContrast(foreground: string, background: string): number {
    return getContrastRatio(foreground, background)
  }

  /**
   * Check WCAG compliance level for a palette
   * 
   * @param palette - Color palette to check
   * @returns WCAG level: 'AA', 'AAA', or 'fail'
   */
  checkWCAGCompliance(palette: ColorPalette): WCAGLevel {
    // Define critical text/background combinations
    const criticalCombinations = [
      { fg: 'text', bg: 'background' },
      { fg: 'textSecondary', bg: 'background' },
      { fg: 'text', bg: 'backgroundSecondary' },
    ]

    let meetsAA = true
    let meetsAAA = true

    // Check critical combinations
    for (const { fg, bg } of criticalCombinations) {
      const foreground = palette.colors[fg as keyof typeof palette.colors]
      const background = palette.colors[bg as keyof typeof palette.colors]
      const ratio = getContrastRatio(foreground, background)

      if (ratio < WCAG_CONTRAST_RATIOS.AA_NORMAL) {
        meetsAA = false
        meetsAAA = false
        break
      }

      if (ratio < WCAG_CONTRAST_RATIOS.AAA_NORMAL) {
        meetsAAA = false
      }
    }

    if (!meetsAA) {
      return 'fail'
    }

    return meetsAAA ? 'AAA' : 'AA'
  }

  /**
   * Suggest an accessible color alternative
   * 
   * @param foreground - Foreground hex color to adjust
   * @param background - Background hex color to test against
   * @param targetRatio - Target contrast ratio (default: WCAG AA)
   * @returns Accessible hex color that meets the target ratio
   */
  suggestAccessibleColor(
    foreground: string,
    background: string,
    targetRatio: number = WCAG_CONTRAST_RATIOS.AA_NORMAL
  ): string {
    return suggestAccessibleColor(foreground, background, {
      targetRatio,
      preserveHue: true,
    })
  }
}

/**
 * Create a singleton instance for convenience
 */
export const paletteValidator = new PaletteValidator()

/**
 * Convenience function to validate a palette
 */
export function validatePalette(palette: ColorPalette): PaletteValidationResult {
  return paletteValidator.validate(palette)
}

/**
 * Convenience function to validate contrast
 */
export function validateContrast(foreground: string, background: string): number {
  return paletteValidator.validateContrast(foreground, background)
}

/**
 * Convenience function to check WCAG compliance
 */
export function checkWCAGCompliance(palette: ColorPalette): WCAGLevel {
  return paletteValidator.checkWCAGCompliance(palette)
}

/**
 * Convenience function to suggest accessible color
 */
export function suggestAccessibleColorForPalette(
  foreground: string,
  background: string,
  targetRatio?: number
): string {
  return paletteValidator.suggestAccessibleColor(foreground, background, targetRatio)
}
