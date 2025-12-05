/**
 * Palette System Utility Types and Constants
 * 
 * This file contains utility types, constants, and helper functions
 * used throughout the palette system.
 */

import type { PaletteCategory, WCAGLevel } from './types'

/**
 * Storage key for palette data in localStorage
 */
export const PALETTE_STORAGE_KEY = 'color-palette-system'

/**
 * Current version of the palette system
 */
export const PALETTE_SYSTEM_VERSION = '1.0.0'

/**
 * WCAG contrast ratio requirements
 */
export const WCAG_CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
} as const

/**
 * Default transition configuration
 */
export const DEFAULT_TRANSITION_CONFIG = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  respectReducedMotion: true,
} as const

/**
 * Color similarity thresholds
 */
export const COLOR_SIMILARITY_THRESHOLDS = {
  HUE_DIFFERENCE: 30,
  SATURATION_DIFFERENCE: 20,
  LIGHTNESS_DIFFERENCE: 20,
} as const

/**
 * Palette category display names
 */
export const PALETTE_CATEGORY_NAMES: Record<PaletteCategory, string> = {
  vibrant: 'Vibrant',
  pastel: 'Pastel',
  earth: 'Earth Tones',
  monochrome: 'Monochrome',
  neon: 'Neon',
  neutral: 'Neutral',
  custom: 'Custom',
}

/**
 * Palette category descriptions
 */
export const PALETTE_CATEGORY_DESCRIPTIONS: Record<PaletteCategory, string> = {
  vibrant: 'Bold and energetic colors with high saturation',
  pastel: 'Soft and calming colors with high lightness',
  earth: 'Natural and grounded colors inspired by nature',
  monochrome: 'Sophisticated single-hue variations',
  neon: 'Bright and electric colors for high impact',
  neutral: 'Balanced and versatile neutral tones',
  custom: 'User-created custom palettes',
}

/**
 * WCAG level display names
 */
export const WCAG_LEVEL_NAMES: Record<WCAGLevel, string> = {
  AA: 'WCAG AA',
  AAA: 'WCAG AAA',
  fail: 'Does not meet WCAG',
}

/**
 * WCAG level descriptions
 */
export const WCAG_LEVEL_DESCRIPTIONS: Record<WCAGLevel, string> = {
  AA: 'Meets minimum accessibility standards (4.5:1 contrast)',
  AAA: 'Meets enhanced accessibility standards (7:1 contrast)',
  fail: 'Does not meet accessibility standards',
}

/**
 * Minimum number of palettes required per category
 */
export const MIN_PALETTES_PER_CATEGORY: Record<Exclude<PaletteCategory, 'custom'>, number> = {
  vibrant: 8,
  pastel: 8,
  earth: 6,
  monochrome: 6,
  neon: 4,
  neutral: 4,
}

/**
 * Maximum number of colors to extract from an image
 */
export const MAX_EXTRACTED_COLORS = 8

/**
 * Minimum number of colors to extract from an image
 */
export const MIN_EXTRACTED_COLORS = 3

/**
 * Default number of recommendations to return
 */
export const DEFAULT_RECOMMENDATION_LIMIT = 5

/**
 * Validation timeout for real-time validation (ms)
 */
export const VALIDATION_TIMEOUT_MS = 100

/**
 * Type guard to check if a value is a valid PaletteCategory
 */
export function isPaletteCategory(value: unknown): value is PaletteCategory {
  return (
    typeof value === 'string' &&
    ['vibrant', 'pastel', 'earth', 'monochrome', 'neon', 'neutral', 'custom'].includes(value)
  )
}

/**
 * Type guard to check if a value is a valid WCAGLevel
 */
export function isWCAGLevel(value: unknown): value is WCAGLevel {
  return typeof value === 'string' && ['AA', 'AAA', 'fail'].includes(value)
}

/**
 * Generate a unique ID for a palette
 */
export function generatePaletteId(): string {
  return `palette-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get the current timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now()
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Round a number to a specified number of decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}

/**
 * Check if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

/**
 * Normalize a hex color to 6-digit format
 */
export function normalizeHexColor(color: string): string {
  if (!isValidHexColor(color)) {
    throw new Error(`Invalid hex color: ${color}`)
  }
  
  // Convert 3-digit hex to 6-digit
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
  }
  
  return color.toUpperCase()
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Check if two objects are deeply equal
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}
