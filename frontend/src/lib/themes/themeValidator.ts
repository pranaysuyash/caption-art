/**
 * Theme Validator
 * 
 * Validates theme configurations and ensures accessibility compliance.
 * Checks color formats, contrast ratios, typography, and accessibility standards.
 */

import type {
  ThemeConfig,
  ColorScheme,
  ColorPalette,
  Typography,
  AccessibilityConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './types'
import { isValidColor } from './utils/colorUtils'
import { getContrastRatio, meetsWCAG } from './utils/contrastChecker'

export class ThemeValidator {
  /**
   * Validate a complete theme configuration
   */
  validate(theme: ThemeConfig): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate required fields
    if (!theme.id || typeof theme.id !== 'string') {
      errors.push({
        field: 'id',
        message: 'Theme ID is required and must be a string',
        severity: 'error'
      })
    }

    if (!theme.name || typeof theme.name !== 'string') {
      errors.push({
        field: 'name',
        message: 'Theme name is required and must be a string',
        severity: 'error'
      })
    }

    if (!theme.version || typeof theme.version !== 'string') {
      errors.push({
        field: 'version',
        message: 'Theme version is required and must be a string',
        severity: 'error'
      })
    }

    if (!theme.category || (['preset', 'custom'].indexOf(theme.category) === -1)) {
      errors.push({
        field: 'category',
        message: 'Theme category must be either "preset" or "custom"',
        severity: 'error'
      })
    }

    // Validate colors
    if (theme.colors) {
      const colorResult = this.validateColors(theme.colors)
      errors.push(...colorResult.errors)
      warnings.push(...colorResult.warnings)
    } else {
      errors.push({
        field: 'colors',
        message: 'Theme colors are required',
        severity: 'error'
      })
    }

    // Validate typography
    if (theme.typography) {
      const typographyResult = this.validateTypography(theme.typography)
      errors.push(...typographyResult.errors)
      warnings.push(...typographyResult.warnings)
    } else {
      errors.push({
        field: 'typography',
        message: 'Theme typography is required',
        severity: 'error'
      })
    }

    // Validate accessibility
    if (theme.accessibility) {
      const accessibilityResult = this.validateAccessibility(theme.accessibility)
      errors.push(...accessibilityResult.errors)
      warnings.push(...accessibilityResult.warnings)
    } else {
      errors.push({
        field: 'accessibility',
        message: 'Theme accessibility configuration is required',
        severity: 'error'
      })
    }

    // Validate spacing
    if (theme.spacing) {
      const spacingErrors = this.validateSpacing(theme.spacing)
      errors.push(...spacingErrors)
    }

    // Validate borders
    if (theme.borders) {
      const borderErrors = this.validateBorders(theme.borders)
      errors.push(...borderErrors)
    }

    // Validate animations
    if (theme.animations) {
      const animationErrors = this.validateAnimations(theme.animations)
      errors.push(...animationErrors)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate color scheme (light and dark modes)
   */
  validateColors(colors: ColorScheme): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!colors.light) {
      errors.push({
        field: 'colors.light',
        message: 'Light color palette is required',
        severity: 'error'
      })
    } else {
      const lightResult = this.validateColorPalette(colors.light, 'light')
      errors.push(...lightResult.errors)
      warnings.push(...lightResult.warnings)
    }

    if (!colors.dark) {
      errors.push({
        field: 'colors.dark',
        message: 'Dark color palette is required',
        severity: 'error'
      })
    } else {
      const darkResult = this.validateColorPalette(colors.dark, 'dark')
      errors.push(...darkResult.errors)
      warnings.push(...darkResult.warnings)
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate a single color palette
   */
  private validateColorPalette(palette: ColorPalette, mode: 'light' | 'dark'): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Required color fields
    const requiredColors: (keyof ColorPalette)[] = [
      'bg', 'bgSecondary', 'bgTertiary',
      'text', 'textSecondary', 'textTertiary',
      'primary', 'secondary', 'accent',
      'success', 'warning', 'error', 'info',
      'border', 'borderLight', 'borderHeavy'
    ]

    // Validate each color exists and is valid
    for (const colorKey of requiredColors) {
      const color = palette[colorKey]
      
      if (!color) {
        errors.push({
          field: `colors.${mode}.${colorKey}`,
          message: `Color ${colorKey} is required`,
          severity: 'error'
        })
      } else if (!this.validateColorFormat(color)) {
        errors.push({
          field: `colors.${mode}.${colorKey}`,
          message: `Invalid color format for ${colorKey}: ${color}`,
          severity: 'error'
        })
      }
    }

    // Check contrast ratios if all required colors are present
    if (errors.length === 0) {
      const contrastErrors = this.checkContrastRatios(palette, mode)
      errors.push(...contrastErrors)
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate color format
   */
  validateColorFormat(color: string): boolean {
    // Allow CSS gradients (linear-gradient, radial-gradient, etc.)
    if (color.includes('gradient(')) {
      return true
    }
    return isValidColor(color)
  }

  /**
   * Check contrast ratios for accessibility
   */
  private checkContrastRatios(palette: ColorPalette, mode: 'light' | 'dark'): ValidationError[] {
    const errors: ValidationError[] = []

    // Check text/background contrast (WCAG AA: 4.5:1)
    const textBgRatio = getContrastRatio(palette.text, palette.bg)
    if (textBgRatio < 4.5) {
      errors.push({
        field: `colors.${mode}.text`,
        message: `Text/background contrast ratio ${textBgRatio.toFixed(2)}:1 does not meet WCAG AA standard (4.5:1)`,
        severity: 'error'
      })
    }

    // Check secondary text/background contrast
    const textSecondaryBgRatio = getContrastRatio(palette.textSecondary, palette.bg)
    if (textSecondaryBgRatio < 4.5) {
      errors.push({
        field: `colors.${mode}.textSecondary`,
        message: `Secondary text/background contrast ratio ${textSecondaryBgRatio.toFixed(2)}:1 does not meet WCAG AA standard (4.5:1)`,
        severity: 'error'
      })
    }

    // Check primary color contrast on background (relaxed for decorative elements)
    // Skip if background is a gradient (can't calculate contrast)
    if (!palette.bg.includes('gradient(')) {
      const primaryBgRatio = getContrastRatio(palette.primary, palette.bg)
      if (primaryBgRatio < 2.5) {
        errors.push({
          field: `colors.${mode}.primary`,
          message: `Primary color/background contrast ratio ${primaryBgRatio.toFixed(2)}:1 is too low (minimum 2.5:1)`,
          severity: 'error'
        })
      }
    }

    // Check border contrast (relaxed - borders are decorative, not text)
    // Skip if background is a gradient (can't calculate contrast)
    if (!palette.bg.includes('gradient(')) {
      const borderBgRatio = getContrastRatio(palette.border, palette.bg)
      if (borderBgRatio < 1.2) {
        errors.push({
          field: `colors.${mode}.border`,
          message: `Border/background contrast ratio ${borderBgRatio.toFixed(2)}:1 is too low (minimum 1.2:1)`,
          severity: 'error'
        })
      }
    }

    return errors
  }

  /**
   * Validate contrast between two colors
   */
  validateContrast(foreground: string, background: string, level: 'AA' | 'AAA'): boolean {
    if (!this.validateColorFormat(foreground) || !this.validateColorFormat(background)) {
      return false
    }
    return meetsWCAG(foreground, background, level)
  }

  /**
   * Validate typography configuration
   */
  validateTypography(typography: Typography): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate font families
    if (!typography.fontFamilyHeading || typeof typography.fontFamilyHeading !== 'string') {
      errors.push({
        field: 'typography.fontFamilyHeading',
        message: 'Heading font family is required',
        severity: 'error'
      })
    }

    if (!typography.fontFamilyBody || typeof typography.fontFamilyBody !== 'string') {
      errors.push({
        field: 'typography.fontFamilyBody',
        message: 'Body font family is required',
        severity: 'error'
      })
    }

    if (!typography.fontFamilyMono || typeof typography.fontFamilyMono !== 'string') {
      errors.push({
        field: 'typography.fontFamilyMono',
        message: 'Monospace font family is required',
        severity: 'error'
      })
    }

    // Validate font size base (12-72px)
    if (typeof typography.fontSizeBase !== 'number') {
      errors.push({
        field: 'typography.fontSizeBase',
        message: 'Base font size must be a number',
        severity: 'error'
      })
    } else if (typography.fontSizeBase < 12 || typography.fontSizeBase > 72) {
      errors.push({
        field: 'typography.fontSizeBase',
        message: 'Base font size must be between 12px and 72px',
        severity: 'error'
      })
    }

    // Validate font size scale
    if (!Array.isArray(typography.fontSizeScale)) {
      errors.push({
        field: 'typography.fontSizeScale',
        message: 'Font size scale must be an array',
        severity: 'error'
      })
    } else {
      typography.fontSizeScale.forEach((size, index) => {
        if (typeof size !== 'number' || size < 12 || size > 72) {
          errors.push({
            field: `typography.fontSizeScale[${index}]`,
            message: `Font size ${size} must be between 12px and 72px`,
            severity: 'error'
          })
        }
      })
    }

    // Validate font weights
    const validWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900]
    if (validWeights.indexOf(typography.fontWeightNormal) === -1) {
      errors.push({
        field: 'typography.fontWeightNormal',
        message: 'Normal font weight must be a valid CSS font weight (100-900)',
        severity: 'error'
      })
    }

    if (validWeights.indexOf(typography.fontWeightMedium) === -1) {
      errors.push({
        field: 'typography.fontWeightMedium',
        message: 'Medium font weight must be a valid CSS font weight (100-900)',
        severity: 'error'
      })
    }

    if (validWeights.indexOf(typography.fontWeightBold) === -1) {
      errors.push({
        field: 'typography.fontWeightBold',
        message: 'Bold font weight must be a valid CSS font weight (100-900)',
        severity: 'error'
      })
    }

    // Validate line height
    if (typeof typography.lineHeightBase !== 'number' || typography.lineHeightBase < 1 || typography.lineHeightBase > 3) {
      errors.push({
        field: 'typography.lineHeightBase',
        message: 'Base line height must be a number between 1 and 3',
        severity: 'error'
      })
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate accessibility configuration
   */
  validateAccessibility(config: AccessibilityConfig): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate contrast ratio level
    if (!config.contrastRatio || (['AA', 'AAA'].indexOf(config.contrastRatio) === -1)) {
      errors.push({
        field: 'accessibility.contrastRatio',
        message: 'Contrast ratio level must be either "AA" or "AAA"',
        severity: 'error'
      })
    }

    // Validate reduced motion flag
    if (typeof config.reducedMotion !== 'boolean') {
      errors.push({
        field: 'accessibility.reducedMotion',
        message: 'Reduced motion must be a boolean',
        severity: 'error'
      })
    }

    // Validate focus indicator width
    if (typeof config.focusIndicatorWidth !== 'number' || config.focusIndicatorWidth < 1 || config.focusIndicatorWidth > 10) {
      errors.push({
        field: 'accessibility.focusIndicatorWidth',
        message: 'Focus indicator width must be between 1 and 10 pixels',
        severity: 'error'
      })
    }

    // Validate focus indicator color
    if (!config.focusIndicatorColor || !this.validateColorFormat(config.focusIndicatorColor)) {
      errors.push({
        field: 'accessibility.focusIndicatorColor',
        message: 'Focus indicator color must be a valid CSS color',
        severity: 'error'
      })
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate spacing configuration
   */
  private validateSpacing(spacing: { unit: number; scale: number[] }): ValidationError[] {
    const errors: ValidationError[] = []

    if (typeof spacing.unit !== 'number' || spacing.unit <= 0) {
      errors.push({
        field: 'spacing.unit',
        message: 'Spacing unit must be a positive number',
        severity: 'error'
      })
    }

    if (!Array.isArray(spacing.scale)) {
      errors.push({
        field: 'spacing.scale',
        message: 'Spacing scale must be an array',
        severity: 'error'
      })
    } else {
      spacing.scale.forEach((value, index) => {
        if (typeof value !== 'number' || value < 0) {
          errors.push({
            field: `spacing.scale[${index}]`,
            message: `Spacing value ${value} must be a non-negative number`,
            severity: 'error'
          })
        }
      })
    }

    return errors
  }

  /**
   * Validate borders configuration
   */
  private validateBorders(borders: { width: any; radius: any; style: string }): ValidationError[] {
    const errors: ValidationError[] = []

    // Validate border widths
    if (!borders.width) {
      errors.push({
        field: 'borders.width',
        message: 'Border width configuration is required',
        severity: 'error'
      })
    } else {
      ['thin', 'medium', 'thick'].forEach(key => {
        const value = borders.width[key]
        if (typeof value !== 'number' || value < 0) {
          errors.push({
            field: `borders.width.${key}`,
            message: `Border width ${key} must be a non-negative number`,
            severity: 'error'
          })
        }
      })
    }

    // Validate border radius
    if (!borders.radius) {
      errors.push({
        field: 'borders.radius',
        message: 'Border radius configuration is required',
        severity: 'error'
      })
    } else {
      ['sm', 'md', 'lg', 'full'].forEach(key => {
        const value = borders.radius[key]
        if (typeof value !== 'number' || value < 0) {
          errors.push({
            field: `borders.radius.${key}`,
            message: `Border radius ${key} must be a non-negative number`,
            severity: 'error'
          })
        }
      })
    }

    // Validate border style
    if (['solid', 'dashed', 'dotted'].indexOf(borders.style) === -1) {
      errors.push({
        field: 'borders.style',
        message: 'Border style must be "solid", "dashed", or "dotted"',
        severity: 'error'
      })
    }

    return errors
  }

  /**
   * Validate animations configuration
   */
  private validateAnimations(animations: { duration: any; easing: any; effects: string[] }): ValidationError[] {
    const errors: ValidationError[] = []

    // Validate durations
    if (!animations.duration) {
      errors.push({
        field: 'animations.duration',
        message: 'Animation duration configuration is required',
        severity: 'error'
      })
    } else {
      ['fast', 'base', 'slow'].forEach(key => {
        const value = animations.duration[key]
        if (typeof value !== 'number' || value <= 0) {
          errors.push({
            field: `animations.duration.${key}`,
            message: `Animation duration ${key} must be a positive number`,
            severity: 'error'
          })
        }
      })
    }

    // Validate easing
    if (!animations.easing) {
      errors.push({
        field: 'animations.easing',
        message: 'Animation easing configuration is required',
        severity: 'error'
      })
    } else {
      ['smooth', 'bounce', 'sharp'].forEach(key => {
        const value = animations.easing[key]
        if (typeof value !== 'string' || !value) {
          errors.push({
            field: `animations.easing.${key}`,
            message: `Animation easing ${key} must be a non-empty string`,
            severity: 'error'
          })
        }
      })
    }

    // Validate effects
    if (!Array.isArray(animations.effects)) {
      errors.push({
        field: 'animations.effects',
        message: 'Animation effects must be an array',
        severity: 'error'
      })
    }

    return errors
  }

  /**
   * Validate high contrast mode (AAA standards - 7:1)
   */
  validateHighContrastMode(palette: ColorPalette, mode: 'light' | 'dark'): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check text/background contrast (WCAG AAA: 7:1)
    const textBgRatio = getContrastRatio(palette.text, palette.bg)
    if (textBgRatio < 7.0) {
      errors.push({
        field: `colors.${mode}.text`,
        message: `Text/background contrast ratio ${textBgRatio.toFixed(2)}:1 does not meet WCAG AAA standard (7:1)`,
        severity: 'error'
      })
    }

    // Check secondary text/background contrast
    const textSecondaryBgRatio = getContrastRatio(palette.textSecondary, palette.bg)
    if (textSecondaryBgRatio < 7.0) {
      errors.push({
        field: `colors.${mode}.textSecondary`,
        message: `Secondary text/background contrast ratio ${textSecondaryBgRatio.toFixed(2)}:1 does not meet WCAG AAA standard (7:1)`,
        severity: 'error'
      })
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate color blind friendly palette
   */
  validateColorBlindMode(palette: ColorPalette, mode: 'light' | 'dark'): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check that colors are distinguishable by luminance difference
    // This is a simplified check - real color blind validation is more complex
    
    // Check success/error distinction (common issue for red-green color blindness)
    const successLuminance = getContrastRatio(palette.success, palette.bg)
    const errorLuminance = getContrastRatio(palette.error, palette.bg)
    
    if (Math.abs(successLuminance - errorLuminance) < 1.5) {
      warnings.push({
        field: `colors.${mode}.success/error`,
        message: 'Success and error colors may not be distinguishable for color blind users. Consider using different luminance levels.',
        severity: 'warning'
      })
    }

    // Check warning/info distinction
    const warningLuminance = getContrastRatio(palette.warning, palette.bg)
    const infoLuminance = getContrastRatio(palette.info, palette.bg)
    
    if (Math.abs(warningLuminance - infoLuminance) < 1.5) {
      warnings.push({
        field: `colors.${mode}.warning/info`,
        message: 'Warning and info colors may not be distinguishable for color blind users. Consider using different luminance levels.',
        severity: 'warning'
      })
    }

    return { valid: errors.length === 0, errors, warnings }
  }
}

