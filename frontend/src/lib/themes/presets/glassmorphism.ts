/**
 * Glassmorphism Theme Preset
 * 
 * Modern frosted glass aesthetics with blur, transparency, and subtle borders.
 * Features Poppins for headings and soft, rounded corners.
 */

import { ThemeConfig } from '../types'

export const glassmorphism: ThemeConfig = {
  id: 'glassmorphism',
  name: 'Glassmorphism',
  description: 'Frosted glass effects with blur and transparency',
  category: 'preset',
  version: '1.0.0',
  colors: {
    light: {
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      bgSecondary: 'rgba(255, 255, 255, 0.15)',
      bgTertiary: 'rgba(255, 255, 255, 0.1)',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      textTertiary: 'rgba(255, 255, 255, 0.6)',
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      border: 'rgba(255, 255, 255, 0.2)',
      borderLight: 'rgba(255, 255, 255, 0.1)',
      borderHeavy: 'rgba(255, 255, 255, 0.3)'
    },
    dark: {
      bg: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)',
      bgSecondary: 'rgba(255, 255, 255, 0.1)',
      bgTertiary: 'rgba(255, 255, 255, 0.05)',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      textTertiary: 'rgba(255, 255, 255, 0.5)',
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      border: 'rgba(255, 255, 255, 0.15)',
      borderLight: 'rgba(255, 255, 255, 0.08)',
      borderHeavy: 'rgba(255, 255, 255, 0.25)'
    }
  },
  typography: {
    fontFamilyHeading: '"Poppins", sans-serif',
    fontFamilyBody: '"Inter", sans-serif',
    fontFamilyMono: '"Fira Code", monospace',
    fontSizeBase: 16,
    fontSizeScale: [12, 14, 16, 18, 24, 32, 48, 64],
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    lineHeightBase: 1.6,
    letterSpacing: '0.01em'
  },
  spacing: {
    unit: 8,
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]
  },
  shadows: {
    sm: '0 4px 6px rgba(0, 0, 0, 0.1)',
    md: '0 10px 15px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 25px rgba(0, 0, 0, 0.15)',
    xl: '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(102, 126, 234, 0.5)'
  },
  borders: {
    width: {
      thin: 1,
      medium: 1,
      thick: 2
    },
    radius: {
      sm: 12,
      md: 16,
      lg: 24,
      full: 9999
    },
    style: 'solid'
  },
  animations: {
    duration: {
      fast: 200,
      base: 400,
      slow: 600
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    effects: ['fade', 'scale', 'blur']
  },
  accessibility: {
    contrastRatio: 'AA',
    reducedMotion: false,
    focusIndicatorWidth: 2,
    focusIndicatorColor: '#f093fb'
  }
}
