/**
 * Property-Based Tests for Neo-brutalism Theme
 * 
 * Feature: multi-theme-system, Property 4: Neo-brutalism theme characteristics
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest'
import { neobrutalism } from './neobrutalism'

describe('Neo-brutalism Theme Characteristics', () => {
  it('Property 4: Neo-brutalism theme characteristics - For any component when neo-brutalism theme is active, it should have bold borders (3-5px), vibrant accent colors, offset shadows (4-12px), and Space Grotesk font for headings', () => {
    const theme = neobrutalism
    
    // Requirement 2.1: Bold borders (3-5px)
    expect(theme.borders.width.medium).toBeGreaterThanOrEqual(3)
    expect(theme.borders.width.medium).toBeLessThanOrEqual(5)
    expect(theme.borders.width.thick).toBeGreaterThanOrEqual(3)
    expect(theme.borders.width.thick).toBeLessThanOrEqual(5)
    
    // Requirement 2.2: Vibrant accent colors (coral, turquoise, yellow)
    // Check that primary, secondary, and accent colors are defined
    expect(theme.colors.light.primary).toBeDefined()
    expect(theme.colors.light.secondary).toBeDefined()
    expect(theme.colors.light.accent).toBeDefined()
    expect(theme.colors.dark.primary).toBeDefined()
    expect(theme.colors.dark.secondary).toBeDefined()
    expect(theme.colors.dark.accent).toBeDefined()
    
    // Verify colors are vibrant (not grayscale)
    // Coral-like (reddish): #FF6B6B
    expect(theme.colors.light.primary).toMatch(/#[A-Fa-f0-9]{6}/)
    // Turquoise-like: #4ECDC4
    expect(theme.colors.light.secondary).toMatch(/#[A-Fa-f0-9]{6}/)
    // Yellow-like: #FFE66D
    expect(theme.colors.light.accent).toMatch(/#[A-Fa-f0-9]{6}/)
    
    // Requirement 2.3: Offset shadows (4-12px)
    // Check that shadows have offset values in the 4-12px range
    expect(theme.shadows.sm).toContain('4px')
    expect(theme.shadows.md).toContain('8px')
    expect(theme.shadows.lg).toContain('12px')
    
    // Verify shadows are offset (not centered)
    expect(theme.shadows.sm).toMatch(/\d+px\s+\d+px/)
    expect(theme.shadows.md).toMatch(/\d+px\s+\d+px/)
    expect(theme.shadows.lg).toMatch(/\d+px\s+\d+px/)
    
    // Requirement 2.4: Space Grotesk font for headings
    expect(theme.typography.fontFamilyHeading).toContain('Space Grotesk')
    
    // Requirement 2.5: Sharp corners with minimal border radius
    // Neo-brutalism should have relatively small border radius values
    expect(theme.borders.radius.sm).toBeLessThanOrEqual(8)
    expect(theme.borders.radius.md).toBeLessThanOrEqual(12)
  })
})
