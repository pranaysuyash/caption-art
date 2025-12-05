/**
 * Utility to validate and update palette metadata
 * 
 * This script validates all palettes and updates their metadata
 * with actual contrast ratios and WCAG levels.
 */

import type { ColorPalette } from '../types'
import { validatePalette } from '../paletteValidator'

/**
 * Validate and update a palette's metadata
 * 
 * @param palette - Palette to validate and update
 * @returns Updated palette with validation metadata
 */
export function validateAndUpdatePalette(palette: ColorPalette): ColorPalette {
  const result = validatePalette(palette)
  
  return {
    ...palette,
    metadata: {
      ...palette.metadata,
      accessibility: {
        wcagLevel: result.wcagLevel,
        contrastRatios: result.contrastRatios,
      },
    },
  }
}

/**
 * Validate and update multiple palettes
 * 
 * @param palettes - Array of palettes to validate
 * @returns Array of updated palettes
 */
export function validateAndUpdatePalettes(palettes: ColorPalette[]): ColorPalette[] {
  return palettes.map(validateAndUpdatePalette)
}
