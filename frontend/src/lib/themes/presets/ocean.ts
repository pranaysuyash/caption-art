/**
 * Ocean Theme Preset
 * 
 * A calming, aquatic theme featuring deep blues, 
 * bright teals, and fluid transitions.
 */

import { ThemeConfig } from '../types'

export const ocean: ThemeConfig = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Calming blues and teals',
  category: 'preset',
  version: '1.0.0',
  colors: {
    light: {
      bg: '#F0F8FF', // Alice Blue
      bgSecondary: '#E0F7FA',
      bgTertiary: '#B2EBF2',
      text: '#01579B',
      textSecondary: '#0277BD',
      textTertiary: '#0288D1',
      primary: '#00BCD4', // Cyan
      secondary: '#009688', // Teal
      accent: '#FF4081', // Pink accent
      success: '#00E676',
      warning: '#FFAB40',
      error: '#FF5252',
      info: '#40C4FF',
      border: '#81D4FA',
      borderLight: '#B3E5FC',
      borderHeavy: '#4FC3F7'
    },
    dark: {
      bg: '#001F3F', // Navy
      bgSecondary: '#003366',
      bgTertiary: '#004080',
      text: '#E0F7FA',
      textSecondary: '#B2EBF2',
      textTertiary: '#80DEEA',
      primary: '#00E5FF', // Bright Cyan
      secondary: '#64FFDA', // Bright Teal
      accent: '#FF80AB', // Light Pink accent
      success: '#69F0AE',
      warning: '#FFD740',
      error: '#FF8A80',
      info: '#80D8FF',
      border: '#006064',
      borderLight: '#004D40',
      borderHeavy: '#00838F'
    }
  },
  typography: {
    fontFamilyHeading: '"Montserrat", sans-serif',
    fontFamilyBody: '"Open Sans", sans-serif',
    fontFamilyMono: '"Fira Code", monospace',
    fontSizeBase: 16,
    fontSizeScale: [12, 14, 16, 18, 20, 24, 30],
    fontWeightNormal: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    lineHeightBase: 1.55,
    letterSpacing: '0.01em'
  },
  spacing: {
    unit: 4,
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 188, 212, 0.1)',
    md: '0 4px 8px rgba(0, 188, 212, 0.15)',
    lg: '0 8px 16px rgba(0, 188, 212, 0.2)',
    xl: '0 12px 24px rgba(0, 188, 212, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    glow: '0 0 10px rgba(0, 229, 255, 0.5)'
  },
  borders: {
    width: {
      thin: 1,
      medium: 2,
      thick: 3
    },
    radius: {
      sm: 8,
      md: 12,
      lg: 16,
      full: 9999
    },
    style: 'solid'
  },
  animations: {
    duration: {
      fast: 150,
      base: 300,
      slow: 600 // Slower, fluid animations
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    },
    effects: ['fade', 'slide']
  },
  accessibility: {
    contrastRatio: 'AA',
    reducedMotion: false,
    focusIndicatorWidth: 3,
    focusIndicatorColor: '#00E5FF'
  }
}
