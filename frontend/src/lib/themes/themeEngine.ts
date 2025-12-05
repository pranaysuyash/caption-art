/**
 * Theme Engine
 * 
 * Applies theme configuration to the DOM via CSS variables.
 * Handles theme transitions and CSS variable generation.
 */

import type { ThemeConfig, ColorPalette, Typography, Spacing, Shadows, Borders, AnimationConfig } from './types'

export class ThemeEngine {
  private root: HTMLElement
  private isInitialLoad: boolean = true

  constructor() {
    this.root = document.documentElement
  }

  /**
   * Apply a complete theme configuration to the DOM
   */
  applyTheme(theme: ThemeConfig, mode: 'light' | 'dark', skipTransition: boolean = false): void {
    const colors = theme.colors[mode]
    
    // Add no-transition class for initial load or when explicitly requested
    if (this.isInitialLoad || skipTransition) {
      this.root.classList.add('no-transition')
    }
    
    // Set theme mode attribute for CSS selectors
    this.root.setAttribute('data-theme-mode', mode)
    
    // Set theme ID for theme-specific overrides
    this.root.setAttribute('data-theme-id', theme.id)
    
    // Also set legacy data-theme attribute for backward compatibility
    this.root.setAttribute('data-theme', mode)
    
    this.applyColors(colors)
    this.applyTypography(theme.typography)
    this.applySpacing(theme.spacing)
    this.applyShadows(theme.shadows)
    this.applyBorders(theme.borders)
    this.applyAnimations(theme.animations)
    
    // Remove no-transition class after a frame to allow CSS to apply
    if (this.isInitialLoad || skipTransition) {
      // Use requestAnimationFrame to ensure CSS has been applied
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.root.classList.remove('no-transition')
          this.isInitialLoad = false
        })
      })
    }
  }

  /**
   * Apply color palette to CSS variables
   */
  applyColors(colors: ColorPalette): void {
    // Background colors
    this.setCSSVariable('--color-bg', colors.bg)
    this.setCSSVariable('--color-background', colors.bg) // Alias for compatibility
    this.setCSSVariable('--color-bg-secondary', colors.bgSecondary)
    this.setCSSVariable('--color-surface', colors.bgSecondary) // Alias for compatibility
    this.setCSSVariable('--color-bg-tertiary', colors.bgTertiary)
    
    // Text colors
    this.setCSSVariable('--color-text', colors.text)
    this.setCSSVariable('--color-text-secondary', colors.textSecondary)
    this.setCSSVariable('--color-text-tertiary', colors.textTertiary)
    
    // Accent colors
    this.setCSSVariable('--color-primary', colors.primary)
    this.setCSSVariable('--color-secondary', colors.secondary)
    this.setCSSVariable('--color-accent', colors.accent)
    
    // Semantic colors
    this.setCSSVariable('--color-success', colors.success)
    this.setCSSVariable('--color-warning', colors.warning)
    this.setCSSVariable('--color-error', colors.error)
    this.setCSSVariable('--color-info', colors.info)

    // Map theme colors to brand variables for backward compatibility
    this.setCSSVariable('--color-brand-primary', colors.primary)
    this.setCSSVariable('--color-brand-secondary', colors.secondary)
    this.setCSSVariable('--color-brand-accent', colors.accent)
    this.setCSSVariable('--color-brand-success', colors.success)
    this.setCSSVariable('--color-brand-warning', colors.warning)
    this.setCSSVariable('--color-brand-error', colors.error)
    
    // Border colors
    this.setCSSVariable('--color-border', colors.border)
    this.setCSSVariable('--color-border-light', colors.borderLight)
    this.setCSSVariable('--color-border-heavy', colors.borderHeavy)
  }

  /**
   * Apply typography settings to CSS variables
   */
  applyTypography(typography: Typography): void {
    // Font families
    this.setCSSVariable('--font-family-heading', typography.fontFamilyHeading)
    this.setCSSVariable('--font-family-body', typography.fontFamilyBody)
    this.setCSSVariable('--font-family-mono', typography.fontFamilyMono)
    
    // Font sizes
    this.setCSSVariable('--font-size-base', `${typography.fontSizeBase}px`)
    typography.fontSizeScale.forEach((size, index) => {
      this.setCSSVariable(`--font-size-${index}`, `${size}px`)
    })
    
    // Font weights
    this.setCSSVariable('--font-weight-normal', typography.fontWeightNormal.toString())
    this.setCSSVariable('--font-weight-medium', typography.fontWeightMedium.toString())
    this.setCSSVariable('--font-weight-bold', typography.fontWeightBold.toString())
    
    // Line height and letter spacing
    this.setCSSVariable('--line-height-base', typography.lineHeightBase.toString())
    this.setCSSVariable('--letter-spacing', typography.letterSpacing)
  }

  /**
   * Apply spacing scale to CSS variables
   */
  applySpacing(spacing: Spacing): void {
    this.setCSSVariable('--spacing-unit', `${spacing.unit}px`)
    
    // Apply spacing scale with semantic names
    const names = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']
    spacing.scale.forEach((value, index) => {
      const name = names[index] || index.toString()
      this.setCSSVariable(`--spacing-${name}`, `${value}px`)
    })
  }

  /**
   * Apply shadow definitions to CSS variables
   */
  applyShadows(shadows: Shadows): void {
    this.setCSSVariable('--shadow-sm', shadows.sm)
    this.setCSSVariable('--shadow-md', shadows.md)
    this.setCSSVariable('--shadow-lg', shadows.lg)
    this.setCSSVariable('--shadow-xl', shadows.xl)
    this.setCSSVariable('--shadow-inner', shadows.inner)
    
    if (shadows.glow) {
      this.setCSSVariable('--shadow-glow', shadows.glow)
    }
  }

  /**
   * Apply border settings to CSS variables
   */
  applyBorders(borders: Borders): void {
    // Border widths
    this.setCSSVariable('--border-width-thin', `${borders.width.thin}px`)
    this.setCSSVariable('--border-width-medium', `${borders.width.medium}px`)
    this.setCSSVariable('--border-width-thick', `${borders.width.thick}px`)
    
    // Border radius
    this.setCSSVariable('--border-radius-sm', `${borders.radius.sm}px`)
    this.setCSSVariable('--border-radius-md', `${borders.radius.md}px`)
    this.setCSSVariable('--border-radius-lg', `${borders.radius.lg}px`)
    this.setCSSVariable('--border-radius-full', `${borders.radius.full}px`)
    
    // Border style
    this.setCSSVariable('--border-style', borders.style)
  }

  /**
   * Apply animation settings to CSS variables
   */
  applyAnimations(animations: AnimationConfig): void {
    // Animation durations
    this.setCSSVariable('--animation-duration-fast', `${animations.duration.fast}ms`)
    this.setCSSVariable('--animation-duration-base', `${animations.duration.base}ms`)
    this.setCSSVariable('--animation-duration-slow', `${animations.duration.slow}ms`)
    
    // Animation easing
    this.setCSSVariable('--animation-easing-smooth', animations.easing.smooth)
    this.setCSSVariable('--animation-easing-bounce', animations.easing.bounce)
    this.setCSSVariable('--animation-easing-sharp', animations.easing.sharp)
  }

  /**
   * Transition smoothly from one theme to another
   */
  async transitionTheme(
    fromTheme: ThemeConfig,
    toTheme: ThemeConfig,
    mode: 'light' | 'dark',
    duration: number = 300
  ): Promise<void> {
    // Check if reduced motion is preferred
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      // Apply theme immediately without transition
      this.applyTheme(toTheme, mode, true)
      return
    }
    
    // Add transition class
    this.root.classList.add('theme-transitioning')
    
    // Set transition duration
    this.setCSSVariable('--theme-transition-duration', `${duration}ms`)
    
    // Apply new theme (don't skip transition since we're explicitly transitioning)
    this.applyTheme(toTheme, mode, false)
    
    // Wait for transition to complete
    await new Promise(resolve => setTimeout(resolve, duration))
    
    // Remove transition class
    this.root.classList.remove('theme-transitioning')
  }

  /**
   * Generate CSS variables object from theme config
   */
  private generateCSSVariables(theme: ThemeConfig, mode: 'light' | 'dark'): Record<string, string> {
    const variables: Record<string, string> = {}
    const colors = theme.colors[mode]
    
    // Colors
    variables['--color-bg'] = colors.bg
    variables['--color-bg-secondary'] = colors.bgSecondary
    variables['--color-bg-tertiary'] = colors.bgTertiary
    variables['--color-text'] = colors.text
    variables['--color-text-secondary'] = colors.textSecondary
    variables['--color-text-tertiary'] = colors.textTertiary
    variables['--color-primary'] = colors.primary
    variables['--color-secondary'] = colors.secondary
    variables['--color-accent'] = colors.accent
    variables['--color-success'] = colors.success
    variables['--color-warning'] = colors.warning
    variables['--color-error'] = colors.error
    variables['--color-info'] = colors.info
    variables['--color-border'] = colors.border
    variables['--color-border-light'] = colors.borderLight
    variables['--color-border-heavy'] = colors.borderHeavy
    
    // Typography
    variables['--font-family-heading'] = theme.typography.fontFamilyHeading
    variables['--font-family-body'] = theme.typography.fontFamilyBody
    variables['--font-family-mono'] = theme.typography.fontFamilyMono
    variables['--font-size-base'] = `${theme.typography.fontSizeBase}px`
    variables['--font-weight-normal'] = theme.typography.fontWeightNormal.toString()
    variables['--font-weight-medium'] = theme.typography.fontWeightMedium.toString()
    variables['--font-weight-bold'] = theme.typography.fontWeightBold.toString()
    variables['--line-height-base'] = theme.typography.lineHeightBase.toString()
    variables['--letter-spacing'] = theme.typography.letterSpacing
    
    // Spacing
    variables['--spacing-unit'] = `${theme.spacing.unit}px`
    
    // Shadows
    variables['--shadow-sm'] = theme.shadows.sm
    variables['--shadow-md'] = theme.shadows.md
    variables['--shadow-lg'] = theme.shadows.lg
    variables['--shadow-xl'] = theme.shadows.xl
    variables['--shadow-inner'] = theme.shadows.inner
    if (theme.shadows.glow) {
      variables['--shadow-glow'] = theme.shadows.glow
    }
    
    // Borders
    variables['--border-width-thin'] = `${theme.borders.width.thin}px`
    variables['--border-width-medium'] = `${theme.borders.width.medium}px`
    variables['--border-width-thick'] = `${theme.borders.width.thick}px`
    variables['--border-radius-sm'] = `${theme.borders.radius.sm}px`
    variables['--border-radius-md'] = `${theme.borders.radius.md}px`
    variables['--border-radius-lg'] = `${theme.borders.radius.lg}px`
    variables['--border-radius-full'] = `${theme.borders.radius.full}px`
    variables['--border-style'] = theme.borders.style
    
    // Animations
    variables['--animation-duration-fast'] = `${theme.animations.duration.fast}ms`
    variables['--animation-duration-base'] = `${theme.animations.duration.base}ms`
    variables['--animation-duration-slow'] = `${theme.animations.duration.slow}ms`
    variables['--animation-easing-smooth'] = theme.animations.easing.smooth
    variables['--animation-easing-bounce'] = theme.animations.easing.bounce
    variables['--animation-easing-sharp'] = theme.animations.easing.sharp
    
    return variables
  }

  /**
   * Set a CSS variable on the root element
   */
  private setCSSVariable(name: string, value: string): void {
    this.root.style.setProperty(name, value)
  }
}

