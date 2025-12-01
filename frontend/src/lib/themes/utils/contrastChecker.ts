/**
 * Contrast Checker
 * 
 * Provides utilities for checking color contrast ratios according to WCAG standards.
 */

import { getRelativeLuminance } from './colorUtils'

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fgLuminance = getRelativeLuminance(foreground)
  const bgLuminance = getRelativeLuminance(background)
  
  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standard (4.5:1 for normal text)
 */
export function meetsWCAG_AA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 4.5
}

/**
 * Check if contrast ratio meets WCAG AAA standard (7:1 for normal text)
 */
export function meetsWCAG_AAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 7.0
}

/**
 * Check if contrast ratio meets WCAG AA standard for large text (3:1)
 */
export function meetsWCAG_AA_Large(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 3.0
}

/**
 * Check if contrast ratio meets WCAG AAA standard for large text (4.5:1)
 */
export function meetsWCAG_AAA_Large(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 4.5
}

/**
 * Check if contrast ratio meets specified WCAG level
 */
export function meetsWCAG(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA',
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  
  if (level === 'AA') {
    return largeText ? ratio >= 3.0 : ratio >= 4.5
  } else {
    return largeText ? ratio >= 4.5 : ratio >= 7.0
  }
}

/**
 * Get a human-readable description of the contrast ratio
 */
export function getContrastDescription(ratio: number): string {
  if (ratio >= 7.0) {
    return 'Excellent (AAA)'
  } else if (ratio >= 4.5) {
    return 'Good (AA)'
  } else if (ratio >= 3.0) {
    return 'Fair (AA Large)'
  } else {
    return 'Poor (Fails WCAG)'
  }
}
