/**
 * Nature Theme Preset
 * 
 * An earthy, organic theme featuring greens, browns, 
 * and natural textures.
 */

import { ThemeConfig } from '../types'

export const nature: ThemeConfig = {
  id: 'nature',
  name: 'Nature',
  description: 'Earthy greens and organic tones',
  category: 'preset',
  version: '1.0.0',
  colors: {
    light: {
      bg: '#F1F8E9', // Light Green
      bgSecondary: '#DCEDC8',
      bgTertiary: '#C5E1A5',
      text: '#33691E',
      textSecondary: '#558B2F',
      textTertiary: '#689F38',
      primary: '#7CB342', // Light Green
      secondary: '#8D6E63', // Brown
      accent: '#FF7043', // Deep Orange
      success: '#558B2F',
      warning: '#FBC02D',
      error: '#D32F2F',
      info: '#0288D1',
      border: '#AED581',
      borderLight: '#DCEDC8',
      borderHeavy: '#8BC34A'
    },
    dark: {
      bg: '#1B5E20', // Dark Green
      bgSecondary: '#2E7D32',
      bgTertiary: '#388E3C',
      text: '#F1F8E9',
      textSecondary: '#DCEDC8',
      textTertiary: '#C5E1A5',
      primary: '#AED581', // Light Green
      secondary: '#BCAAA4', // Light Brown
      accent: '#FFAB91', // Light Deep Orange
      success: '#C5E1A5',
      warning: '#FFF59D',
      error: '#EF9A9A',
      info: '#81D4FA',
      border: '#33691E',
      borderLight: '#2E7D32',
      borderHeavy: '#1B5E20'
    }
  },
  typography: {
    fontFamilyHeading: '"Nunito", sans-serif',
    fontFamilyBody: '"Nunito Sans", sans-serif',
    fontFamilyMono: '"Fira Code", monospace',
    fontSizeBase: 16,
    fontSizeScale: [12, 14, 16, 18, 20, 24, 32],
    fontWeightNormal: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    lineHeightBase: 1.6,
    letterSpacing: '0.01em'
  },
  spacing: {
    unit: 4,
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]
  },
  shadows: {
    sm: '0 1px 3px rgba(51, 105, 30, 0.1)',
    md: '0 4px 6px rgba(51, 105, 30, 0.1)',
    lg: '0 10px 15px rgba(51, 105, 30, 0.1)',
    xl: '0 20px 25px rgba(51, 105, 30, 0.1)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  borders: {
    width: {
      thin: 1,
      medium: 2,
      thick: 3
    },
    radius: {
      sm: 8,
      md: 16,
      lg: 24,
      full: 9999
    },
    style: 'solid'
  },
  animations: {
    duration: {
      fast: 150,
      base: 250,
      slow: 400
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    effects: ['fade']
  },
  accessibility: {
    contrastRatio: 'AA',
    reducedMotion: false,
    focusIndicatorWidth: 2,
    focusIndicatorColor: '#7CB342'
  }
}
