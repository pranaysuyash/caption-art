/**
 * PaletteManager
 * 
 * Central orchestrator for palette operations.
 * Manages palette selection, validation, storage, and integration with the theme system.
 */

import type {
  ColorPalette,
  PaletteCategory,
  PaletteChangeCallback,
  PaletteValidationResult,
  PaletteRecommendation,
  PaletteExportData,
} from './types'
import { PaletteValidator } from './paletteValidator'
import { PaletteStorage } from './paletteStorage'
import { RecommendationEngine } from './recommendationEngine'
import { vibrantPalettes } from './collections/vibrant'
import { getThemeManager } from '../themes/themeManager'
import { areColorsSimilar } from './colorHarmony'

/**
 * PaletteManager class
 * 
 * Orchestrates all palette operations including selection, validation,
 * storage, and integration with the theme system.
 */
export class PaletteManager {
  private validator: PaletteValidator
  private storage: PaletteStorage
  private recommendationEngine: RecommendationEngine
  private currentPalette: ColorPalette | null = null
  private subscribers: Set<PaletteChangeCallback> = new Set()
  private presetPalettes: ColorPalette[] = []

  constructor() {
    this.validator = new PaletteValidator()
    this.storage = new PaletteStorage()
    this.recommendationEngine = new RecommendationEngine()
    
    // Load preset palettes
    this.presetPalettes = [...vibrantPalettes]
    
    // Load current palette from storage
    const currentPaletteId = this.storage.getCurrentPaletteId()
    if (currentPaletteId) {
      const palette = this.findPaletteById(currentPaletteId)
      if (palette) {
        this.currentPalette = palette
      }
    }
  }

  /**
   * Get the currently active palette
   * 
   * @returns The current palette or null if none is active
   */
  getPalette(): ColorPalette | null {
    return this.currentPalette ? { ...this.currentPalette } : null
  }

  /**
   * Set the active palette
   * 
   * Validates the palette, applies it to the theme, and persists the selection.
   * 
   * @param paletteId - ID of the palette to set as active
   * @throws Error if palette not found or validation fails
   */
  async setPalette(paletteId: string): Promise<void> {
    // Find the palette
    const palette = this.findPaletteById(paletteId)
    if (!palette) {
      throw new Error(`Palette not found: ${paletteId}`)
    }

    // Validate the palette
    const validation = this.validator.validate(palette)
    if (!validation.valid) {
      throw new Error(
        `Invalid palette: ${validation.errors.map((e) => e.message).join(', ')}`
      )
    }

    // Update current palette
    this.currentPalette = palette

    // Apply to theme system
    await this.applyPaletteToTheme(palette)

    // Persist selection
    this.storage.setCurrentPaletteId(paletteId)

    // Notify subscribers
    this.notifySubscribers()
  }

  /**
   * Get all available palettes (presets + custom)
   * 
   * @returns Array of all available palettes
   */
  getAvailablePalettes(): ColorPalette[] {
    const customPalettes = this.storage.loadAllPalettes()
    return [...this.presetPalettes, ...customPalettes]
  }

  /**
   * Create a new custom palette
   * 
   * Validates the palette configuration and saves it to storage.
   * 
   * @param config - Partial palette configuration
   * @returns The created palette
   * @throws Error if validation fails
   */
  createCustomPalette(config: Partial<ColorPalette>): ColorPalette {
    // Generate ID if not provided
    const id = config.id || `custom-${Date.now()}`

    // Create full palette with defaults
    const palette: ColorPalette = {
      id,
      name: config.name || 'Custom Palette',
      description: config.description || 'A custom color palette',
      category: 'custom',
      colors: config.colors || this.getDefaultColors(),
      metadata: {
        author: config.metadata?.author,
        tags: config.metadata?.tags || [],
        createdAt: Date.now(),
        accessibility: {
          wcagLevel: 'fail',
          contrastRatios: {},
        },
      },
    }

    // Validate the palette
    const validation = this.validator.validate(palette)
    if (!validation.valid) {
      throw new Error(
        `Invalid palette: ${validation.errors.map((e) => e.message).join(', ')}`
      )
    }

    // Update metadata with validation results
    palette.metadata.accessibility = {
      wcagLevel: validation.wcagLevel,
      contrastRatios: validation.contrastRatios,
    }

    // Save to storage
    this.storage.savePalette(palette)

    // Notify subscribers
    this.notifySubscribers()

    return palette
  }

  /**
   * Update an existing custom palette
   * 
   * @param paletteId - ID of the palette to update
   * @param updates - Partial palette configuration with updates
   * @throws Error if palette not found or validation fails
   */
  updateCustomPalette(paletteId: string, updates: Partial<ColorPalette>): void {
    // Load the existing palette
    const existingPalette = this.storage.loadPalette(paletteId)
    if (!existingPalette) {
      throw new Error(`Custom palette not found: ${paletteId}`)
    }

    // Ensure it's a custom palette
    if (existingPalette.category !== 'custom') {
      throw new Error(`Cannot update preset palette: ${paletteId}`)
    }

    // Merge updates
    const updatedPalette: ColorPalette = {
      ...existingPalette,
      ...updates,
      id: paletteId, // Preserve ID
      category: 'custom', // Preserve category
      metadata: {
        ...existingPalette.metadata,
        ...updates.metadata,
        accessibility: existingPalette.metadata.accessibility, // Will be updated by validation
      },
    }

    // Validate the updated palette
    const validation = this.validator.validate(updatedPalette)
    if (!validation.valid) {
      throw new Error(
        `Invalid palette: ${validation.errors.map((e) => e.message).join(', ')}`
      )
    }

    // Update metadata with validation results
    updatedPalette.metadata.accessibility = {
      wcagLevel: validation.wcagLevel,
      contrastRatios: validation.contrastRatios,
    }

    // Save to storage
    this.storage.savePalette(updatedPalette)

    // If this is the current palette, update it
    if (this.currentPalette?.id === paletteId) {
      this.currentPalette = updatedPalette
      this.applyPaletteToTheme(updatedPalette)
    }

    // Notify subscribers
    this.notifySubscribers()
  }

  /**
   * Delete a custom palette
   * 
   * @param paletteId - ID of the palette to delete
   * @throws Error if palette not found or is a preset
   */
  deleteCustomPalette(paletteId: string): void {
    // Load the palette to check if it's custom
    const palette = this.storage.loadPalette(paletteId)
    if (!palette) {
      throw new Error(`Custom palette not found: ${paletteId}`)
    }

    // Ensure it's a custom palette
    if (palette.category !== 'custom') {
      throw new Error(`Cannot delete preset palette: ${paletteId}`)
    }

    // Delete from storage
    const deleted = this.storage.deletePalette(paletteId)
    if (!deleted) {
      throw new Error(`Failed to delete palette: ${paletteId}`)
    }

    // If this was the current palette, clear it
    if (this.currentPalette?.id === paletteId) {
      this.currentPalette = null
    }

    // Notify subscribers
    this.notifySubscribers()
  }

  /**
   * Validate a palette
   * 
   * @param palette - Palette to validate
   * @returns Validation result
   */
  validatePalette(palette: ColorPalette): PaletteValidationResult {
    return this.validator.validate(palette)
  }

  /**
   * Get palette recommendations for the current theme
   * 
   * @param limit - Maximum number of recommendations (default: 10)
   * @returns Array of recommended palettes with scores and reasons
   */
  getRecommendations(limit: number = 10): PaletteRecommendation[] {
    try {
      const themeManager = getThemeManager()
      const currentTheme = themeManager.getTheme()
      return this.recommendationEngine.getRecommendations(currentTheme.id, limit)
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      return []
    }
  }

  /**
   * Search palettes by name or category
   * 
   * Performs case-insensitive search on palette name and category.
   * 
   * @param query - Search query string
   * @returns Array of matching palettes
   */
  searchPalettes(query: string): ColorPalette[] {
    if (!query || query.trim() === '') {
      return this.getAvailablePalettes()
    }

    const normalizedQuery = query.toLowerCase().trim()
    const allPalettes = this.getAvailablePalettes()

    return allPalettes.filter((palette) => {
      const nameMatch = palette.name.toLowerCase().includes(normalizedQuery)
      const categoryMatch = palette.category.toLowerCase().includes(normalizedQuery)
      const descriptionMatch = palette.description.toLowerCase().includes(normalizedQuery)
      const tagMatch = palette.metadata.tags.some((tag) =>
        tag.toLowerCase().includes(normalizedQuery)
      )

      return nameMatch || categoryMatch || descriptionMatch || tagMatch
    })
  }

  /**
   * Filter palettes by category
   * 
   * @param category - Palette category to filter by
   * @returns Array of palettes in the specified category
   */
  filterByCategory(category: PaletteCategory): ColorPalette[] {
    const allPalettes = this.getAvailablePalettes()
    return allPalettes.filter((palette) => palette.category === category)
  }

  /**
   * Filter palettes by accessibility level
   * 
   * Returns only palettes that meet or exceed the specified WCAG level.
   * 
   * @param level - Minimum WCAG level ('AA' or 'AAA')
   * @returns Array of palettes meeting the accessibility standard
   */
  filterByAccessibility(level: 'AA' | 'AAA'): ColorPalette[] {
    const allPalettes = this.getAvailablePalettes()

    return allPalettes.filter((palette) => {
      const paletteLevel = palette.metadata.accessibility.wcagLevel

      // If palette fails, exclude it
      if (paletteLevel === 'fail') {
        return false
      }

      // If requesting AA, accept both AA and AAA
      if (level === 'AA') {
        return paletteLevel === 'AA' || paletteLevel === 'AAA'
      }

      // If requesting AAA, only accept AAA
      return paletteLevel === 'AAA'
    })
  }

  /**
   * Search palettes by color similarity
   * 
   * Finds palettes containing colors similar to the specified color.
   * Uses HSL color space to determine similarity based on hue, saturation, and lightness.
   * 
   * @param color - Hex color to search for
   * @returns Array of palettes containing similar colors
   */
  searchByColor(color: string): ColorPalette[] {
    const allPalettes = this.getAvailablePalettes()

    return allPalettes.filter((palette) => {
      // Check if any color in the palette is similar to the search color
      const paletteColors = Object.values(palette.colors)
      return paletteColors.some((paletteColor) =>
        areColorsSimilar(color, paletteColor)
      )
    })
  }

  /**
   * Subscribe to palette changes
   * 
   * @param callback - Function to call when palette changes
   * @returns Unsubscribe function
   */
  subscribeToChanges(callback: PaletteChangeCallback): () => void {
    this.subscribers.add(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Export a palette to JSON
   * 
   * Generates a JSON string containing the palette with all required metadata.
   * The exported format includes version information and export timestamp.
   * 
   * @param paletteId - ID of the palette to export
   * @returns JSON string representation of the palette
   * @throws Error if palette not found
   */
  exportPalette(paletteId: string): string {
    // Find the palette
    const palette = this.findPaletteById(paletteId)
    if (!palette) {
      throw new Error(`Palette not found: ${paletteId}`)
    }

    // Create export data structure
    const exportData: PaletteExportData = {
      version: '1.0.0',
      palette: palette,
      exportedAt: Date.now(),
    }

    // Convert to JSON string
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import a palette from JSON
   * 
   * Validates the JSON structure, checks the palette for accessibility,
   * and adds it to the available palettes.
   * 
   * @param paletteJson - JSON string containing the palette data
   * @returns The imported palette
   * @throws Error if JSON is invalid or palette validation fails
   */
  importPalette(paletteJson: string): ColorPalette {
    // Parse JSON
    let exportData: PaletteExportData
    try {
      exportData = JSON.parse(paletteJson)
    } catch (error) {
      throw new Error('Invalid JSON format')
    }

    // Validate structure
    if (!exportData.version) {
      throw new Error('Missing version field in import data')
    }

    if (!exportData.palette) {
      throw new Error('Missing palette field in import data')
    }

    const palette = exportData.palette

    // Validate required fields
    if (!palette.id) {
      throw new Error('Missing required field: id')
    }
    if (!palette.name) {
      throw new Error('Missing required field: name')
    }
    if (!palette.description) {
      throw new Error('Missing required field: description')
    }
    if (!palette.category) {
      throw new Error('Missing required field: category')
    }
    if (!palette.colors) {
      throw new Error('Missing required field: colors')
    }
    if (!palette.metadata) {
      throw new Error('Missing required field: metadata')
    }

    // Validate colors object has all required color fields
    const requiredColors = [
      'primary',
      'secondary',
      'tertiary',
      'accent',
      'background',
      'backgroundSecondary',
      'text',
      'textSecondary',
      'success',
      'warning',
      'error',
      'info',
    ]

    for (const colorKey of requiredColors) {
      if (!palette.colors[colorKey as keyof typeof palette.colors]) {
        throw new Error(`Missing required color: ${colorKey}`)
      }
    }

    // Validate metadata structure
    if (!palette.metadata.tags) {
      throw new Error('Missing required field: metadata.tags')
    }
    if (!palette.metadata.accessibility) {
      throw new Error('Missing required field: metadata.accessibility')
    }

    // Generate a new ID to avoid conflicts
    const importedPalette: ColorPalette = {
      ...palette,
      id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: 'custom', // Imported palettes are always custom
      metadata: {
        ...palette.metadata,
        createdAt: Date.now(),
      },
    }

    // Validate the palette
    const validation = this.validator.validate(importedPalette)
    if (!validation.valid) {
      throw new Error(
        `Invalid palette: ${validation.errors.map((e) => e.message).join(', ')}`
      )
    }

    // Update metadata with validation results
    importedPalette.metadata.accessibility = {
      wcagLevel: validation.wcagLevel,
      contrastRatios: validation.contrastRatios,
    }

    // Save to storage
    this.storage.savePalette(importedPalette)

    // Notify subscribers
    this.notifySubscribers()

    return importedPalette
  }

  /**
   * Find a palette by ID (searches presets and custom palettes)
   * 
   * @param paletteId - ID of the palette to find
   * @returns The palette if found, undefined otherwise
   */
  private findPaletteById(paletteId: string): ColorPalette | undefined {
    return this.getAvailablePalettes().find((p) => p.id === paletteId)
  }

  /**
   * Apply a palette to the theme system
   * 
   * Updates the current theme's colors to match the palette.
   * 
   * @param palette - Palette to apply
   */
  private async applyPaletteToTheme(palette: ColorPalette): Promise<void> {
    try {
      const themeManager = getThemeManager()
      const currentTheme = themeManager.getTheme()

      // Create updated theme with palette colors
      const updatedTheme = {
        ...currentTheme,
        colors: {
          ...currentTheme.colors,
          primary: palette.colors.primary,
          secondary: palette.colors.secondary,
          accent: palette.colors.accent,
          background: palette.colors.background,
          surface: palette.colors.backgroundSecondary,
          text: palette.colors.text,
          textSecondary: palette.colors.textSecondary,
          success: palette.colors.success,
          warning: palette.colors.warning,
          error: palette.colors.error,
          info: palette.colors.info,
        },
      }

      // Update the theme
      await themeManager.setTheme(updatedTheme.id)
    } catch (error) {
      console.error('Failed to apply palette to theme:', error)
      throw new Error(`Failed to apply palette to theme: ${error}`)
    }
  }

  /**
   * Get default colors for a new palette
   * 
   * @returns Default palette colors
   */
  private getDefaultColors() {
    return {
      primary: '#1976D2',
      secondary: '#424242',
      tertiary: '#757575',
      accent: '#FF6F00',
      background: '#FFFFFF',
      backgroundSecondary: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      success: '#388E3C',
      warning: '#F57C00',
      error: '#D32F2F',
      info: '#1976D2',
    }
  }

  /**
   * Notify all subscribers of palette change
   */
  private notifySubscribers(): void {
    const palette = this.getPalette()
    this.subscribers.forEach((callback) => {
      try {
        callback(palette)
      } catch (error) {
        console.error('Error in palette change subscriber:', error)
      }
    })
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.subscribers.clear()
  }
}

/**
 * Singleton instance
 */
let instance: PaletteManager | null = null

/**
 * Get the singleton PaletteManager instance
 * 
 * @returns The PaletteManager instance
 */
export function getPaletteManager(): PaletteManager {
  if (!instance) {
    instance = new PaletteManager()
  }
  return instance
}

/**
 * Reset the PaletteManager instance (useful for testing)
 */
export function resetPaletteManager(): void {
  if (instance) {
    instance.destroy()
    instance = null
  }
}
