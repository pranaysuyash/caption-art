/**
 * Color Palette System
 * 
 * Main entry point for the color palette system.
 * Exports all types, utilities, and core functionality.
 */

// Export all types
export type {
  ColorPalette,
  PaletteCategory,
  PaletteColors,
  PaletteMetadata,
  AccessibilityMetadata,
  PaletteValidationResult,
  ValidationError,
  ValidationWarning,
  PaletteRecommendation,
  PaletteChangeCallback,
  StoredPaletteData,
  RGB,
  HSL,
  ColorHarmonyType,
  ImageData,
  PaletteGenerationOptions,
  ColorAdjustmentOptions,
  PaletteSearchOptions,
  PaletteExportData,
  PaletteImportResult,
  PaletteTransitionConfig,
  ThemeCompatibility,
  WCAGLevel,
} from './types'

// Export utility functions and constants
export {
  PALETTE_STORAGE_KEY,
  PALETTE_SYSTEM_VERSION,
  WCAG_CONTRAST_RATIOS,
  DEFAULT_TRANSITION_CONFIG,
  COLOR_SIMILARITY_THRESHOLDS,
  PALETTE_CATEGORY_NAMES,
  PALETTE_CATEGORY_DESCRIPTIONS,
  WCAG_LEVEL_NAMES,
  WCAG_LEVEL_DESCRIPTIONS,
  MIN_PALETTES_PER_CATEGORY,
  MAX_EXTRACTED_COLORS,
  MIN_EXTRACTED_COLORS,
  DEFAULT_RECOMMENDATION_LIMIT,
  VALIDATION_TIMEOUT_MS,
  isPaletteCategory,
  isWCAGLevel,
  generatePaletteId,
  getCurrentTimestamp,
  isLocalStorageAvailable,
  clamp,
  roundTo,
  isValidHexColor,
  normalizeHexColor,
  deepClone,
  deepEqual,
} from './utils'
