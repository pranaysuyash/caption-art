/**
 * Premium Theme Preset
 * 
 * A luxurious, high-contrast theme featuring deep blacks, 
 * rich golds, and sophisticated typography.
 */

import { ThemeConfig } from '../types'

export const premium: ThemeConfig = {
  id: 'premium',
  name: 'Premium',
  description: 'Luxurious gold and black aesthetic',
  category: 'preset',
  version: '1.0.0',
  colors: {
    light: {
      bg: '#FFFFFF',
      bgSecondary: '#FAFAFA',
      bgTertiary: '#F5F5F5',
      text: '#1A1A1A',
      textSecondary: '#4A4A4A',
      textTertiary: '#7A7A7A',
      primary: '#D4AF37', // Gold
      secondary: '#1A1A1A', // Black
      accent: '#C5A028', // Darker Gold
      success: '#2E7D32',
      warning: '#ED6C02',
      error: '#D32F2F',
      info: '#0288D1',
      border: '#E0E0E0',
      borderLight: '#F5F5F5',
      borderHeavy: '#9E9E9E'
    },
    dark: {
      bg: '#0A0A0A',
      bgSecondary: '#141414',
      bgTertiary: '#1F1F1F',
      text: '#F0F0F0',
      textSecondary: '#B0B0B0',
      textTertiary: '#707070',
      primary: '#FFD700', // Bright Gold
      secondary: '#FFFFFF', // White
      accent: '#FDB931', // Warm Gold
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#29B6F6',
      border: '#333333',
      borderLight: '#1F1F1F',
      borderHeavy: '#555555'
    }
  },
  typography: {
    fontFamilyHeading: '"Playfair Display", serif',
    fontFamilyBody: '"Lato", sans-serif',
    fontFamilyMono: '"JetBrains Mono", monospace',
    fontSizeBase: 16,
    fontSizeScale: [12, 14, 16, 18, 22, 26, 36],
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    lineHeightBase: 1.6,
    letterSpacing: '0.02em'
  },
  spacing: {
    unit: 4,
    scale: [4, 8, 16, 24, 32, 48, 64, 96, 128]
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 8px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.1)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.12)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
    glow: '0 0 15px rgba(212, 175, 55, 0.3)'
  },
  borders: {
    width: {
      thin: 1,
      medium: 1,
      thick: 2
    },
    radius: {
      sm: 2,
      md: 4,
      lg: 8,
      full: 9999
    },
    style: 'solid'
  },
  animations: {
    duration: {
      fast: 200,
      base: 300,
      slow: 500
    },
    easing: {
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      bounce: 'cubic-bezier(0.25, 0.1, 0.25, 1)', // Less bounce for premium
      sharp: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
    },
    effects: ['fade']
  },
  accessibility: {
    contrastRatio: 'AAA',
    reducedMotion: false,
    focusIndicatorWidth: 2,
    focusIndicatorColor: '#D4AF37'
  }
}
