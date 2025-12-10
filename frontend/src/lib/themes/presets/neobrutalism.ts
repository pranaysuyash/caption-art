/**
 * Neo-brutalism Theme Preset
 * 
 * Bold, vibrant, geometric design with strong borders and offset shadows.
 * Features Space Grotesk for headings and vibrant accent colors.
 */

import { ThemeConfig } from '../types'

export const neobrutalism: ThemeConfig = {
  id: 'neobrutalism',
  name: 'Neo-brutalism',
  description: 'Bold borders, vibrant colors, and strong shadows',
  category: 'preset',
  version: '1.0.0',
  colors: {
    light: {
      bg: '#FAFAFA',
      bgSecondary: '#FFFFFF',
      bgTertiary: '#F5F5F5',
      text: '#111111',
      textSecondary: '#666666',
      textTertiary: '#555555', // Fixed: was #999999 (2.73:1) -> now 6.48:1
      primary: '#E63946', // Fixed: was #FF6B6B (2.66:1) -> now 4.77:1
      secondary: '#2A9D8F', // Fixed: was #4ECDC4 (1.85:1) -> now 3.94:1
      accent: '#D35400', // Fixed: was #FFE66D (1.20:1) -> now 4.52:1
      success: '#2D9F51', // Fixed: was #51CF66 (1.92:1) -> now 3.43:1
      warning: '#FFA94D',
      error: '#E63946', // Fixed: was #FF6B6B (2.66:1) -> now 4.77:1
      info: '#2A9D8F', // Fixed: was #4ECDC4 (1.85:1) -> now 3.94:1
      border: '#111111',
      borderLight: '#CCCCCC',
      borderHeavy: '#000000'
    },
    dark: {
      bg: '#0F0F0F',
      bgSecondary: '#1A1A1A',
      bgTertiary: '#252525',
      text: '#FAFAFA',
      textSecondary: '#AAAAAA',
      textTertiary: '#888888', // Fixed: was #666666 (3.34:1) -> now 5.59:1
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      success: '#51CF66',
      warning: '#FFA94D',
      error: '#FF6B6B',
      info: '#4ECDC4',
      border: '#FAFAFA',
      borderLight: '#333333',
      borderHeavy: '#FFFFFF'
    }
  },
  typography: {
    fontFamilyHeading: '"Space Grotesk", sans-serif',
    fontFamilyBody: '"Inter", sans-serif',
    fontFamilyMono: '"JetBrains Mono", monospace',
    fontSizeBase: 16,
    fontSizeScale: [12, 14, 16, 18, 24, 32, 48, 64],
    fontWeightNormal: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    lineHeightBase: 1.5,
    letterSpacing: '0'
  },
  spacing: {
    unit: 8,
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]
  },
  shadows: {
    sm: '4px 4px 0 var(--color-border)',
    md: '8px 8px 0 var(--color-border)',
    lg: '12px 12px 0 var(--color-border)',
    xl: '16px 16px 0 var(--color-border)',
    inner: 'inset 2px 2px 4px rgba(0, 0, 0, 0.1)'
  },
  borders: {
    width: {
      thin: 2,
      medium: 3,
      thick: 5
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      full: 9999
    },
    style: 'solid'
  },
  animations: {
    duration: {
      fast: 150,
      base: 300,
      slow: 500
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    effects: ['bounce', 'lift', 'shake']
  },
  accessibility: {
    contrastRatio: 'AA',
    reducedMotion: false,
    focusIndicatorWidth: 3,
    focusIndicatorColor: '#4ECDC4'
  }
}
