/**
 * Color Harmony Utility
 * 
 * Provides functions for calculating color harmonies based on color theory:
 * - Complementary colors (opposite on color wheel)
 * - Analogous colors (adjacent on color wheel)
 * - Triadic colors (evenly spaced on color wheel)
 * - Color similarity detection
 */

import type { HSL } from './types'
import { hexToHsl, hslToHex } from './colorSpaceConverter'
import { COLOR_SIMILARITY_THRESHOLDS } from './utils'

/**
 * Normalize hue to 0-360 range
 */
function normalizeHue(hue: number): number {
  while (hue < 0) hue += 360
  while (hue >= 360) hue -= 360
  return hue
}

/**
 * Calculate complementary color (180° opposite on color wheel)
 * 
 * @param hex - Base hex color
 * @returns Complementary hex color
 */
export function getComplementaryColor(hex: string): string {
  const hsl = hexToHsl(hex)
  const complementaryHsl: HSL = {
    h: normalizeHue(hsl.h + 180),
    s: hsl.s,
    l: hsl.l,
  }
  return hslToHex(complementaryHsl)
}

/**
 * Calculate analogous colors (adjacent colors on color wheel)
 * 
 * @param hex - Base hex color
 * @param angle - Angle offset for analogous colors (default: 30°)
 * @returns Array of two analogous hex colors [left, right]
 */
export function getAnalogousColors(hex: string, angle: number = 30): string[] {
  const hsl = hexToHsl(hex)
  
  const leftHsl: HSL = {
    h: normalizeHue(hsl.h - angle),
    s: hsl.s,
    l: hsl.l,
  }
  
  const rightHsl: HSL = {
    h: normalizeHue(hsl.h + angle),
    s: hsl.s,
    l: hsl.l,
  }
  
  return [hslToHex(leftHsl), hslToHex(rightHsl)]
}

/**
 * Calculate triadic colors (evenly spaced 120° apart on color wheel)
 * 
 * @param hex - Base hex color
 * @returns Array of two triadic hex colors
 */
export function getTriadicColors(hex: string): string[] {
  const hsl = hexToHsl(hex)
  
  const triadic1Hsl: HSL = {
    h: normalizeHue(hsl.h + 120),
    s: hsl.s,
    l: hsl.l,
  }
  
  const triadic2Hsl: HSL = {
    h: normalizeHue(hsl.h + 240),
    s: hsl.s,
    l: hsl.l,
  }
  
  return [hslToHex(triadic1Hsl), hslToHex(triadic2Hsl)]
}

/**
 * Calculate split-complementary colors
 * 
 * @param hex - Base hex color
 * @param angle - Angle offset from complementary (default: 30°)
 * @returns Array of two split-complementary hex colors
 */
export function getSplitComplementaryColors(hex: string, angle: number = 30): string[] {
  const hsl = hexToHsl(hex)
  const complementaryHue = normalizeHue(hsl.h + 180)
  
  const split1Hsl: HSL = {
    h: normalizeHue(complementaryHue - angle),
    s: hsl.s,
    l: hsl.l,
  }
  
  const split2Hsl: HSL = {
    h: normalizeHue(complementaryHue + angle),
    s: hsl.s,
    l: hsl.l,
  }
  
  return [hslToHex(split1Hsl), hslToHex(split2Hsl)]
}

/**
 * Calculate tetradic (square) colors (90° apart on color wheel)
 * 
 * @param hex - Base hex color
 * @returns Array of three tetradic hex colors
 */
export function getTetradicColors(hex: string): string[] {
  const hsl = hexToHsl(hex)
  
  const colors: string[] = []
  for (let i = 1; i <= 3; i++) {
    const tetradicHsl: HSL = {
      h: normalizeHue(hsl.h + (i * 90)),
      s: hsl.s,
      l: hsl.l,
    }
    colors.push(hslToHex(tetradicHsl))
  }
  
  return colors
}

/**
 * Check if two colors are similar based on HSL values
 * 
 * @param hex1 - First hex color
 * @param hex2 - Second hex color
 * @param thresholds - Optional custom thresholds for similarity
 * @returns True if colors are similar
 */
export function areColorsSimilar(
  hex1: string,
  hex2: string,
  thresholds = COLOR_SIMILARITY_THRESHOLDS
): boolean {
  const hsl1 = hexToHsl(hex1)
  const hsl2 = hexToHsl(hex2)
  
  // Calculate hue difference (accounting for circular nature of hue)
  let hueDiff = Math.abs(hsl1.h - hsl2.h)
  if (hueDiff > 180) {
    hueDiff = 360 - hueDiff
  }
  
  const saturationDiff = Math.abs(hsl1.s - hsl2.s)
  const lightnessDiff = Math.abs(hsl1.l - hsl2.l)
  
  return (
    hueDiff <= thresholds.HUE_DIFFERENCE &&
    saturationDiff <= thresholds.SATURATION_DIFFERENCE &&
    lightnessDiff <= thresholds.LIGHTNESS_DIFFERENCE
  )
}

/**
 * Calculate the hue difference between two colors
 * 
 * @param hex1 - First hex color
 * @param hex2 - Second hex color
 * @returns Hue difference in degrees (0-180)
 */
export function getHueDifference(hex1: string, hex2: string): number {
  const hsl1 = hexToHsl(hex1)
  const hsl2 = hexToHsl(hex2)
  
  let diff = Math.abs(hsl1.h - hsl2.h)
  if (diff > 180) {
    diff = 360 - diff
  }
  
  return diff
}

/**
 * Check if a color is complementary to another (within tolerance)
 * 
 * @param hex1 - First hex color
 * @param hex2 - Second hex color
 * @param tolerance - Hue tolerance in degrees (default: 15°)
 * @returns True if colors are complementary
 */
export function areColorsComplementary(
  hex1: string,
  hex2: string,
  tolerance: number = 15
): boolean {
  const hueDiff = getHueDifference(hex1, hex2)
  return Math.abs(hueDiff - 180) <= tolerance
}

/**
 * ColorHarmony class providing all color harmony methods
 */
export class ColorHarmony {
  /**
   * Get complementary color
   */
  static getComplementaryColor = getComplementaryColor

  /**
   * Get analogous colors
   */
  static getAnalogousColors = getAnalogousColors

  /**
   * Get triadic colors
   */
  static getTriadicColors = getTriadicColors

  /**
   * Get split-complementary colors
   */
  static getSplitComplementaryColors = getSplitComplementaryColors

  /**
   * Get tetradic colors
   */
  static getTetradicColors = getTetradicColors

  /**
   * Check if colors are similar
   */
  static areColorsSimilar = areColorsSimilar

  /**
   * Get hue difference
   */
  static getHueDifference = getHueDifference

  /**
   * Check if colors are complementary
   */
  static areColorsComplementary = areColorsComplementary
}
