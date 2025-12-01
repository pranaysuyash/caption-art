/**
 * Theme Presets Registry
 * 
 * Exports all available theme presets for the multi-theme system.
 */

import { neobrutalism } from './neobrutalism'
import { glassmorphism } from './glassmorphism'
import { minimalist } from './minimalist'
import { cyberpunk } from './cyberpunk'
import { ThemeConfig } from '../types'

/**
 * All available theme presets
 */
export const themePresets: ThemeConfig[] = [
  neobrutalism,
  glassmorphism,
  minimalist,
  cyberpunk
]

/**
 * Get a theme preset by ID
 */
export function getThemePreset(id: string): ThemeConfig | undefined {
  return themePresets.find(theme => theme.id === id)
}

/**
 * Get all theme preset IDs
 */
export function getThemePresetIds(): string[] {
  return themePresets.map(theme => theme.id)
}

// Export individual presets
export { neobrutalism, glassmorphism, minimalist, cyberpunk }
