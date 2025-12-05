/**
 * Color Adjuster Utility
 * 
 * Provides functions for adjusting colors:
 * - Lightness adjustment
 * - Saturation adjustment
 * - Hue rotation
 * - Accessible color suggestion algorithm
 */

import type { HSL, ColorAdjustmentOptions } from './types'
import { hexToHsl, hslToHex } from './colorSpaceConverter'
import { getContrastRatio } from '../themes/utils/contrastChecker'
import { clamp, roundTo, WCAG_CONTRAST_RATIOS } from './utils'

/**
 * Adjust the lightness of a color
 * 
 * @param hex - Hex color to adjust
 * @param amount - Amount to adjust lightness by (-100 to 100)
 * @returns Adjusted hex color
 */
export function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  const adjustedHsl: HSL = {
    h: hsl.h,
    s: hsl.s,
    l: clamp(hsl.l + amount, 0, 100),
  }
  return hslToHex(adjustedHsl)
}

/**
 * Adjust the saturation of a color
 * 
 * @param hex - Hex color to adjust
 * @param amount - Amount to adjust saturation by (-100 to 100)
 * @returns Adjusted hex color
 */
export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  const adjustedHsl: HSL = {
    h: hsl.h,
    s: clamp(hsl.s + amount, 0, 100),
    l: hsl.l,
  }
  return hslToHex(adjustedHsl)
}

/**
 * Rotate the hue of a color
 * 
 * @param hex - Hex color to rotate
 * @param degrees - Degrees to rotate hue by (-360 to 360)
 * @returns Rotated hex color
 */
export function rotateHue(hex: string, degrees: number): string {
  const hsl = hexToHsl(hex)
  let newHue = hsl.h + degrees
  
  // Normalize to 0-360 range
  while (newHue < 0) newHue += 360
  while (newHue >= 360) newHue -= 360
  
  const adjustedHsl: HSL = {
    h: newHue,
    s: hsl.s,
    l: hsl.l,
  }
  return hslToHex(adjustedHsl)
}

/**
 * Lighten a color by a percentage
 * 
 * @param hex - Hex color to lighten
 * @param percent - Percentage to lighten (0-100)
 * @returns Lightened hex color
 */
export function lighten(hex: string, percent: number): string {
  const hsl = hexToHsl(hex)
  const amount = (100 - hsl.l) * (percent / 100)
  return adjustLightness(hex, amount)
}

/**
 * Darken a color by a percentage
 * 
 * @param hex - Hex color to darken
 * @param percent - Percentage to darken (0-100)
 * @returns Darkened hex color
 */
export function darken(hex: string, percent: number): string {
  const hsl = hexToHsl(hex)
  const amount = -hsl.l * (percent / 100)
  return adjustLightness(hex, amount)
}

/**
 * Saturate a color by a percentage
 * 
 * @param hex - Hex color to saturate
 * @param percent - Percentage to saturate (0-100)
 * @returns Saturated hex color
 */
export function saturate(hex: string, percent: number): string {
  const hsl = hexToHsl(hex)
  const amount = (100 - hsl.s) * (percent / 100)
  return adjustSaturation(hex, amount)
}

/**
 * Desaturate a color by a percentage
 * 
 * @param hex - Hex color to desaturate
 * @param percent - Percentage to desaturate (0-100)
 * @returns Desaturated hex color
 */
export function desaturate(hex: string, percent: number): string {
  const hsl = hexToHsl(hex)
  const amount = -hsl.s * (percent / 100)
  return adjustSaturation(hex, amount)
}

/**
 * Suggest an accessible color that meets the target contrast ratio
 * 
 * This algorithm adjusts the lightness of the foreground color to meet
 * the target contrast ratio against the background color.
 * 
 * @param foreground - Foreground hex color to adjust
 * @param background - Background hex color to test against
 * @param options - Adjustment options
 * @returns Accessible hex color that meets the target ratio
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  options: ColorAdjustmentOptions = {}
): string {
  const {
    targetRatio = WCAG_CONTRAST_RATIOS.AA_NORMAL,
    preserveHue = true,
    maxIterations = 100,
  } = options

  const currentRatio = getContrastRatio(foreground, background)
  
  // If already meets target, return as-is
  if (currentRatio >= targetRatio) {
    return foreground
  }

  const fgHsl = hexToHsl(foreground)
  const bgHsl = hexToHsl(background)

  // Try both lightening and darkening to see which can achieve the target
  const testLight = hslToHex({ h: fgHsl.h, s: fgHsl.s, l: 100 })
  const testDark = hslToHex({ h: fgHsl.h, s: fgHsl.s, l: 0 })
  const lightRatio = getContrastRatio(testLight, background)
  const darkRatio = getContrastRatio(testDark, background)

  // Determine which direction to search
  let minL: number, maxL: number
  if (lightRatio >= targetRatio && darkRatio >= targetRatio) {
    // Both directions work, choose the one closer to original
    const distToLight = Math.abs(100 - fgHsl.l)
    const distToDark = Math.abs(0 - fgHsl.l)
    if (distToLight < distToDark) {
      minL = fgHsl.l
      maxL = 100
    } else {
      minL = 0
      maxL = fgHsl.l
    }
  } else if (lightRatio >= targetRatio) {
    // Only lightening works
    minL = fgHsl.l
    maxL = 100
  } else if (darkRatio >= targetRatio) {
    // Only darkening works
    minL = 0
    maxL = fgHsl.l
  } else {
    // Neither extreme works - this shouldn't happen for valid colors
    // Return the better of the two extremes
    return lightRatio > darkRatio ? testLight : testDark
  }

  let bestColor = foreground
  let bestRatio = currentRatio

  // Binary search for the lightness value closest to original that meets target
  for (let i = 0; i < maxIterations; i++) {
    const testL = (minL + maxL) / 2
    
    const testHsl: HSL = {
      h: preserveHue ? fgHsl.h : fgHsl.h,
      s: preserveHue ? fgHsl.s : fgHsl.s,
      l: testL,
    }
    
    const testColor = hslToHex(testHsl)
    const testRatio = getContrastRatio(testColor, background)

    // Update best color if it meets target
    if (testRatio >= targetRatio) {
      bestColor = testColor
      bestRatio = testRatio
      // Try to get closer to original (search toward original)
      if (testL > fgHsl.l) {
        maxL = testL
      } else {
        minL = testL
      }
    } else {
      // Need more contrast (search away from original)
      if (testL > fgHsl.l) {
        minL = testL
      } else {
        maxL = testL
      }
    }

    // If range is very small, we're done
    if (Math.abs(maxL - minL) < 0.01) {
      break
    }
  }
  
  // Final refinement: ensure we meet the target
  if (bestRatio < targetRatio) {
    // Push slightly further in the direction we were searching
    const finalHsl: HSL = {
      h: preserveHue ? fgHsl.h : fgHsl.h,
      s: preserveHue ? fgHsl.s : fgHsl.s,
      l: minL > fgHsl.l ? maxL : minL,
    }
    const finalColor = hslToHex(finalHsl)
    const finalRatio = getContrastRatio(finalColor, background)
    
    if (finalRatio >= targetRatio) {
      bestColor = finalColor
      bestRatio = finalRatio
    }
  }

  // If we still don't meet the target, try adjusting saturation
  if (bestRatio < targetRatio && !preserveHue) {
    const desaturatedColor = desaturate(bestColor, 20)
    const desaturatedRatio = getContrastRatio(desaturatedColor, background)
    
    if (desaturatedRatio > bestRatio) {
      return desaturatedColor
    }
  }

  return bestColor
}

/**
 * Suggest multiple accessible color alternatives
 * 
 * @param foreground - Foreground hex color
 * @param background - Background hex color
 * @param targetRatio - Target contrast ratio
 * @returns Array of accessible color suggestions
 */
export function suggestAccessibleAlternatives(
  foreground: string,
  background: string,
  targetRatio: number = WCAG_CONTRAST_RATIOS.AA_NORMAL
): string[] {
  const alternatives: string[] = []

  // Suggestion 1: Preserve hue, adjust lightness
  const preserveHue = suggestAccessibleColor(foreground, background, {
    targetRatio,
    preserveHue: true,
  })
  alternatives.push(preserveHue)

  // Suggestion 2: Allow hue/saturation adjustment
  const flexible = suggestAccessibleColor(foreground, background, {
    targetRatio,
    preserveHue: false,
  })
  if (flexible !== preserveHue) {
    alternatives.push(flexible)
  }

  // Suggestion 3: Slightly desaturated version
  const desaturated = desaturate(preserveHue, 15)
  const desaturatedRatio = getContrastRatio(desaturated, background)
  if (desaturatedRatio >= targetRatio && !alternatives.includes(desaturated)) {
    alternatives.push(desaturated)
  }

  return alternatives
}

/**
 * Get the nearest accessible color from a set of colors
 * 
 * @param colors - Array of hex colors to choose from
 * @param background - Background hex color
 * @param targetRatio - Target contrast ratio
 * @returns Nearest accessible color, or null if none meet the target
 */
export function getNearestAccessibleColor(
  colors: string[],
  background: string,
  targetRatio: number = WCAG_CONTRAST_RATIOS.AA_NORMAL
): string | null {
  let bestColor: string | null = null
  let bestRatio = 0

  for (const color of colors) {
    const ratio = getContrastRatio(color, background)
    if (ratio >= targetRatio && ratio > bestRatio) {
      bestColor = color
      bestRatio = ratio
    }
  }

  return bestColor
}

/**
 * ColorAdjuster class providing all color adjustment methods
 */
export class ColorAdjuster {
  /**
   * Adjust lightness
   */
  static adjustLightness = adjustLightness

  /**
   * Adjust saturation
   */
  static adjustSaturation = adjustSaturation

  /**
   * Rotate hue
   */
  static rotateHue = rotateHue

  /**
   * Lighten color
   */
  static lighten = lighten

  /**
   * Darken color
   */
  static darken = darken

  /**
   * Saturate color
   */
  static saturate = saturate

  /**
   * Desaturate color
   */
  static desaturate = desaturate

  /**
   * Suggest accessible color
   */
  static suggestAccessibleColor = suggestAccessibleColor

  /**
   * Suggest accessible alternatives
   */
  static suggestAccessibleAlternatives = suggestAccessibleAlternatives

  /**
   * Get nearest accessible color
   */
  static getNearestAccessibleColor = getNearestAccessibleColor
}
