/**
 * Theme System Type Definitions
 * 
 * This file contains all type definitions and interfaces for the multi-theme system.
 * It defines the structure of themes, color schemes, typography, spacing, and other
 * visual properties that can be customized.
 */

export interface ThemeConfig {
  id: string
  name: string
  description: string
  category: 'preset' | 'custom'
  author?: string
  version: string
  colors: ColorScheme
  typography: Typography
  spacing: Spacing
  shadows: Shadows
  borders: Borders
  animations: AnimationConfig
  accessibility: AccessibilityConfig
}

export interface ColorScheme {
  light: ColorPalette
  dark: ColorPalette
}

export interface ColorPalette {
  // Background colors
  bg: string
  bgSecondary: string
  bgTertiary: string
  
  // Text colors
  text: string
  textSecondary: string
  textTertiary: string
  
  // Accent colors
  primary: string
  secondary: string
  accent: string
  
  // Semantic colors
  success: string
  warning: string
  error: string
  info: string
  
  // Border colors
  border: string
  borderLight: string
  borderHeavy: string
}

export interface Typography {
  fontFamilyHeading: string
  fontFamilyBody: string
  fontFamilyMono: string
  fontSizeBase: number
  fontSizeScale: number[]
  fontWeightNormal: number
  fontWeightMedium: number
  fontWeightBold: number
  lineHeightBase: number
  letterSpacing: string
}

export interface Spacing {
  unit: number
  scale: number[]
}

export interface Shadows {
  sm: string
  md: string
  lg: string
  xl: string
  inner: string
  glow?: string
}

export interface Borders {
  width: {
    thin: number
    medium: number
    thick: number
  }
  radius: {
    sm: number
    md: number
    lg: number
    full: number
  }
  style: 'solid' | 'dashed' | 'dotted'
}

export interface AnimationConfig {
  duration: {
    fast: number
    base: number
    slow: number
  }
  easing: {
    smooth: string
    bounce: string
    sharp: string
  }
  effects: string[]
}

export interface AccessibilityConfig {
  contrastRatio: 'AA' | 'AAA'
  reducedMotion: boolean
  focusIndicatorWidth: number
  focusIndicatorColor: string
}

export interface ThemeState {
  currentTheme: string
  mode: 'light' | 'dark'
  customThemes: ThemeConfig[]
  systemPreference: 'light' | 'dark'
  respectSystemPreference: boolean
}

export interface StoredThemeData {
  currentThemeId: string
  mode: 'light' | 'dark'
  customThemes: ThemeConfig[]
  respectSystemPreference: boolean
  lastUpdated: number
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error'
}

export interface ValidationWarning {
  field: string
  message: string
  severity: 'warning'
}
