/**
 * Color Palette System Type Definitions
 * 
 * This file contains all type definitions and interfaces for the color palette system.
 * It defines the structure of color palettes, validation results, and related types.
 */

/**
 * Category of color palette based on mood or style
 */
export type PaletteCategory = 
  | 'vibrant' 
  | 'pastel' 
  | 'earth' 
  | 'monochrome' 
  | 'neon' 
  | 'neutral' 
  | 'custom'

/**
 * WCAG accessibility compliance level
 */
export type WCAGLevel = 'AA' | 'AAA' | 'fail'

/**
 * Complete color palette configuration
 */
export interface ColorPalette {
  id: string
  name: string
  description: string
  category: PaletteCategory
  colors: PaletteColors
  metadata: PaletteMetadata
}

/**
 * All colors in a palette
 */
export interface PaletteColors {
  primary: string
  secondary: string
  tertiary: string
  accent: string
  background: string
  backgroundSecondary: string
  text: string
  textSecondary: string
  success: string
  warning: string
  error: string
  info: string
}

/**
 * Metadata about a palette
 */
export interface PaletteMetadata {
  author?: string
  tags: string[]
  createdAt: number
  accessibility: AccessibilityMetadata
}

/**
 * Accessibility information for a palette
 */
export interface AccessibilityMetadata {
  wcagLevel: WCAGLevel
  contrastRatios: Record<string, number>
}

/**
 * Result of palette validation
 */
export interface PaletteValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  contrastRatios: Record<string, number>
  wcagLevel: WCAGLevel
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string
  message: string
  severity: 'error'
  contrastRatio?: number
  requiredRatio?: number
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string
  message: string
  severity: 'warning'
  contrastRatio?: number
  suggestedColor?: string
}

/**
 * Palette recommendation with score and reason
 */
export interface PaletteRecommendation {
  palette: ColorPalette
  score: number
  reason: string
}

/**
 * Callback function for palette changes
 */
export type PaletteChangeCallback = (palette: ColorPalette | null) => void

/**
 * Storage format for palette data
 */
export interface StoredPaletteData {
  currentPaletteId: string | null
  customPalettes: ColorPalette[]
  lastUpdated: number
  version: string
}

/**
 * RGB color representation
 */
export interface RGB {
  r: number
  g: number
  b: number
}

/**
 * HSL color representation
 */
export interface HSL {
  h: number
  s: number
  l: number
}

/**
 * Color harmony type
 */
export type ColorHarmonyType = 
  | 'complementary' 
  | 'analogous' 
  | 'triadic' 
  | 'split-complementary'
  | 'tetradic'

/**
 * Image data for color extraction
 */
export interface ImageData {
  data: Uint8ClampedArray
  width: number
  height: number
}

/**
 * Options for palette generation
 */
export interface PaletteGenerationOptions {
  harmonyType?: ColorHarmonyType
  adjustForAccessibility?: boolean
  targetWCAGLevel?: 'AA' | 'AAA'
  preserveHarmony?: boolean
}

/**
 * Options for color adjustment
 */
export interface ColorAdjustmentOptions {
  targetRatio?: number
  preserveHue?: boolean
  maxIterations?: number
}

/**
 * Search and filter options
 */
export interface PaletteSearchOptions {
  query?: string
  category?: PaletteCategory
  accessibilityLevel?: 'AA' | 'AAA'
  colorSimilarity?: string
  tags?: string[]
}

/**
 * Export format for palettes
 */
export interface PaletteExportData {
  version: string
  palette: ColorPalette
  exportedAt: number
}

/**
 * Import result
 */
export interface PaletteImportResult {
  success: boolean
  palette?: ColorPalette
  errors?: string[]
}

/**
 * Palette transition configuration
 */
export interface PaletteTransitionConfig {
  duration: number
  easing: string
  respectReducedMotion: boolean
}

/**
 * Theme compatibility information
 */
export interface ThemeCompatibility {
  themeId: string
  compatible: boolean
  reason?: string
}
