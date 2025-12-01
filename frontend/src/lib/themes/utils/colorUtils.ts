/**
 * Color Utilities
 * 
 * Provides utilities for color parsing, manipulation, and validation.
 */

export interface RGB {
  r: number
  g: number
  b: number
}

/**
 * Parse a CSS color string to RGB values
 * Supports hex (#RGB, #RRGGBB), rgb(), rgba(), and named colors
 */
export function parseColor(color: string): RGB {
  // Create a temporary element to leverage browser's color parsing
  const temp = document.createElement('div')
  temp.style.color = color
  document.body.appendChild(temp)
  
  const computed = window.getComputedStyle(temp).color
  document.body.removeChild(temp)
  
  // Parse rgb/rgba format
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    }
  }
  
  // Fallback to black if parsing fails
  return { r: 0, g: 0, b: 0 }
}

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * Calculate relative luminance according to WCAG formula
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getRelativeLuminance(color: string): number {
  const rgb = parseColor(color)
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(channel => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  })
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Check if a color string is valid CSS color
 */
export function isValidColor(color: string): boolean {
  const temp = document.createElement('div')
  temp.style.color = color
  return temp.style.color !== ''
}

/**
 * Lighten a color by a percentage (0-100)
 */
export function lightenColor(color: string, percent: number): string {
  const rgb = parseColor(color)
  const amount = percent / 100
  
  return rgbToHex({
    r: Math.min(255, rgb.r + (255 - rgb.r) * amount),
    g: Math.min(255, rgb.g + (255 - rgb.g) * amount),
    b: Math.min(255, rgb.b + (255 - rgb.b) * amount)
  })
}

/**
 * Darken a color by a percentage (0-100)
 */
export function darkenColor(color: string, percent: number): string {
  const rgb = parseColor(color)
  const amount = percent / 100
  
  return rgbToHex({
    r: Math.max(0, rgb.r * (1 - amount)),
    g: Math.max(0, rgb.g * (1 - amount)),
    b: Math.max(0, rgb.b * (1 - amount))
  })
}
