/**
 * Color Space Converter Utility
 * 
 * Provides functions for converting colors between different color spaces:
 * - RGB (Red, Green, Blue)
 * - HSL (Hue, Saturation, Lightness)
 * - Hex (Hexadecimal color codes)
 */

import type { RGB, HSL } from './types'
import { clamp, roundTo, isValidHexColor, normalizeHexColor } from './utils'

/**
 * Convert RGB to HSL
 * 
 * @param rgb - RGB color object with r, g, b values (0-255)
 * @returns HSL color object with h (0-360), s (0-100), l (0-100)
 */
export function rgbToHsl(rgb: RGB): HSL {
  // Normalize RGB values to 0-1 range
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    // Calculate saturation
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    // Calculate hue
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / delta + 2) / 6
        break
      case b:
        h = ((r - g) / delta + 4) / 6
        break
    }
  }

  return {
    h: roundTo(h * 360, 2),
    s: roundTo(s * 100, 2),
    l: roundTo(l * 100, 2),
  }
}

/**
 * Convert HSL to RGB
 * 
 * @param hsl - HSL color object with h (0-360), s (0-100), l (0-100)
 * @returns RGB color object with r, g, b values (0-255)
 */
export function hslToRgb(hsl: HSL): RGB {
  // Normalize HSL values
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  let r: number, g: number, b: number

  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(clamp(r * 255, 0, 255)),
    g: Math.round(clamp(g * 255, 0, 255)),
    b: Math.round(clamp(b * 255, 0, 255)),
  }
}

/**
 * Convert hex color to RGB
 * 
 * @param hex - Hex color string (e.g., "#FF5733" or "#F57")
 * @returns RGB color object with r, g, b values (0-255)
 * @throws Error if hex color is invalid
 */
export function hexToRgb(hex: string): RGB {
  if (!isValidHexColor(hex)) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  const normalized = normalizeHexColor(hex)
  
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)

  return { r, g, b }
}

/**
 * Convert RGB to hex color
 * 
 * @param rgb - RGB color object with r, g, b values (0-255)
 * @returns Hex color string (e.g., "#FF5733")
 */
export function rgbToHex(rgb: RGB): string {
  const r = clamp(Math.round(rgb.r), 0, 255)
  const g = clamp(Math.round(rgb.g), 0, 255)
  const b = clamp(Math.round(rgb.b), 0, 255)

  const toHex = (n: number): string => {
    const hex = n.toString(16).toUpperCase()
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert hex color to HSL
 * 
 * @param hex - Hex color string (e.g., "#FF5733")
 * @returns HSL color object with h (0-360), s (0-100), l (0-100)
 */
export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex))
}

/**
 * Convert HSL to hex color
 * 
 * @param hsl - HSL color object with h (0-360), s (0-100), l (0-100)
 * @returns Hex color string (e.g., "#FF5733")
 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

/**
 * ColorSpaceConverter class providing all color space conversion methods
 */
export class ColorSpaceConverter {
  /**
   * Convert RGB to HSL
   */
  static rgbToHsl = rgbToHsl

  /**
   * Convert HSL to RGB
   */
  static hslToRgb = hslToRgb

  /**
   * Convert hex to RGB
   */
  static hexToRgb = hexToRgb

  /**
   * Convert RGB to hex
   */
  static rgbToHex = rgbToHex

  /**
   * Convert hex to HSL
   */
  static hexToHsl = hexToHsl

  /**
   * Convert HSL to hex
   */
  static hslToHex = hslToHex
}
