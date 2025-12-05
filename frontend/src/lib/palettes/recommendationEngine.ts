/**
 * RecommendationEngine
 * 
 * Recommends color palettes based on the active theme and user preferences.
 * Filters and scores palettes for compatibility with different theme styles.
 */

import type { ColorPalette, PaletteRecommendation } from './types'
import { getThemeManager } from '../themes/themeManager'

/**
 * Theme style to palette category mapping
 * 
 * Maps theme IDs to their preferred palette categories based on aesthetic compatibility.
 */
const THEME_PALETTE_PREFERENCES: Record<string, string[]> = {
  // Neo-brutalism: Bold, vibrant, high-contrast
  neobrutalism: ['vibrant', 'neon', 'custom'],
  
  // Glassmorphism: Soft, translucent, pastel
  glassmorphism: ['pastel', 'neutral', 'custom'],
  
  // Minimalist: Clean, monochrome, neutral
  minimalist: ['monochrome', 'neutral', 'custom'],
  
  // Cyberpunk: Neon, vibrant, high-contrast
  cyberpunk: ['neon', 'vibrant', 'custom'],
  
  // Pastel: Soft, pastel colors
  pastel: ['pastel', 'neutral', 'custom'],
  
  // Premium: Sophisticated, earth tones, monochrome
  premium: ['earth', 'monochrome', 'neutral', 'custom'],
  
  // Ocean: Blues, earth tones
  ocean: ['earth', 'pastel', 'custom'],
  
  // Nature: Earth tones, natural colors
  nature: ['earth', 'pastel', 'custom'],
}

/**
 * Default palette preferences for unknown themes
 */
const DEFAULT_PREFERENCES = ['vibrant', 'pastel', 'earth', 'monochrome', 'custom']

/**
 * RecommendationEngine class
 * 
 * Provides intelligent palette recommendations based on the active theme.
 */
export class RecommendationEngine {
  /**
   * Get palette recommendations for the current theme
   * 
   * @param themeId - ID of the theme to get recommendations for
   * @param limit - Maximum number of recommendations to return (default: 10)
   * @returns Array of palette recommendations sorted by score
   */
  getRecommendations(
    themeId: string,
    limit: number = 10
  ): PaletteRecommendation[] {
    // Get all available palettes
    const allPalettes = this.getAllPalettes()
    
    // Filter palettes by theme style
    const filteredPalettes = this.filterByThemeStyle(allPalettes, themeId)
    
    // Score each palette for compatibility
    const recommendations = filteredPalettes.map((palette) => ({
      palette,
      score: this.scoreCompatibility(palette, themeId),
      reason: this.getRecommendationReason(palette, themeId),
    }))
    
    // Sort by score (highest first) and limit results
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Score a palette's compatibility with a theme
   * 
   * Higher scores indicate better compatibility.
   * 
   * @param palette - Palette to score
   * @param themeId - ID of the theme
   * @returns Compatibility score (0-100)
   */
  scoreCompatibility(palette: ColorPalette, themeId: string): number {
    let score = 50 // Base score
    
    // Get theme preferences
    const preferences = THEME_PALETTE_PREFERENCES[themeId] || DEFAULT_PREFERENCES
    
    // Category match bonus
    const categoryIndex = preferences.indexOf(palette.category)
    if (categoryIndex !== -1) {
      // Higher bonus for earlier preferences
      score += (preferences.length - categoryIndex) * 10
    }
    
    // Accessibility bonus
    if (palette.metadata.accessibility.wcagLevel === 'AAA') {
      score += 15
    } else if (palette.metadata.accessibility.wcagLevel === 'AA') {
      score += 10
    }
    
    // Custom palette bonus (user-created palettes are valuable)
    if (palette.category === 'custom') {
      score += 5
    }
    
    // Tag-based bonuses
    const themeTags = this.getThemeTags(themeId)
    const matchingTags = palette.metadata.tags.filter((tag) =>
      themeTags.includes(tag.toLowerCase())
    )
    score += matchingTags.length * 3
    
    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Filter palettes by theme style
   * 
   * Returns only palettes that match the theme's preferred categories.
   * 
   * @param palettes - Array of palettes to filter
   * @param themeId - ID of the theme
   * @returns Filtered array of palettes
   */
  filterByThemeStyle(palettes: ColorPalette[], themeId: string): ColorPalette[] {
    const preferences = THEME_PALETTE_PREFERENCES[themeId] || DEFAULT_PREFERENCES
    
    // Filter palettes that match any of the preferred categories
    return palettes.filter((palette) =>
      preferences.includes(palette.category)
    )
  }

  /**
   * Get a human-readable reason for the recommendation
   * 
   * @param palette - Recommended palette
   * @param themeId - ID of the theme
   * @returns Reason string
   */
  private getRecommendationReason(palette: ColorPalette, themeId: string): string {
    const preferences = THEME_PALETTE_PREFERENCES[themeId] || DEFAULT_PREFERENCES
    const categoryIndex = preferences.indexOf(palette.category)
    
    // Build reason based on category match
    if (categoryIndex === 0) {
      return `Perfect match for ${themeId} theme style`
    } else if (categoryIndex > 0) {
      return `Complements ${themeId} theme aesthetic`
    }
    
    // Fallback reasons
    if (palette.category === 'custom') {
      return 'Your custom palette'
    }
    
    if (palette.metadata.accessibility.wcagLevel === 'AAA') {
      return 'Excellent accessibility'
    }
    
    return 'Compatible with current theme'
  }

  /**
   * Get relevant tags for a theme
   * 
   * @param themeId - ID of the theme
   * @returns Array of relevant tags
   */
  private getThemeTags(themeId: string): string[] {
    const tagMap: Record<string, string[]> = {
      neobrutalism: ['bold', 'vibrant', 'high-contrast', 'modern'],
      glassmorphism: ['soft', 'translucent', 'pastel', 'elegant'],
      minimalist: ['clean', 'simple', 'monochrome', 'minimal'],
      cyberpunk: ['neon', 'futuristic', 'dark', 'vibrant'],
      pastel: ['soft', 'gentle', 'pastel', 'calm'],
      premium: ['sophisticated', 'elegant', 'professional'],
      ocean: ['blue', 'calm', 'natural', 'water'],
      nature: ['green', 'natural', 'organic', 'earth'],
    }
    
    return tagMap[themeId] || []
  }

  /**
   * Get all available palettes from the palette manager
   * 
   * @returns Array of all palettes
   */
  private getAllPalettes(): ColorPalette[] {
    try {
      // Import dynamically to avoid circular dependencies
      const { getPaletteManager } = require('./paletteManager')
      const paletteManager = getPaletteManager()
      return paletteManager.getAvailablePalettes()
    } catch (error) {
      console.error('Failed to get palettes:', error)
      return []
    }
  }
}

/**
 * Singleton instance
 */
let instance: RecommendationEngine | null = null

/**
 * Get the singleton RecommendationEngine instance
 * 
 * @returns The RecommendationEngine instance
 */
export function getRecommendationEngine(): RecommendationEngine {
  if (!instance) {
    instance = new RecommendationEngine()
  }
  return instance
}

/**
 * Reset the RecommendationEngine instance (useful for testing)
 */
export function resetRecommendationEngine(): void {
  instance = null
}
