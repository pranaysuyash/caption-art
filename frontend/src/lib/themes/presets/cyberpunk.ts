/**
 * Cyberpunk Theme Preset
 * 
 * Futuristic design with neon colors, glitch effects, and high contrast.
 * Features Orbitron for headings and glowing shadows for a technical aesthetic.
 */

import { ThemeConfig } from '../types'

export const cyberpunk: ThemeConfig = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  description: 'Futuristic design with neon colors and glitch effects',
  category: 'preset',
  version: '1.0.0',
  colors: {
    light: {
      bg: '#0A0E27',
      bgSecondary: '#1A1F3A',
      bgTertiary: '#252B4A',
      text: '#00FFFF',
      textSecondary: '#FF00FF',
      textTertiary: '#FFFF00',
      primary: '#00FFFF',
      secondary: '#FF00FF',
      accent: '#FFFF00',
      success: '#00FF00',
      warning: '#FFA500',
      error: '#FF0055',
      info: '#00FFFF',
      border: '#00FFFF',
      borderLight: '#FF00FF',
      borderHeavy: '#FFFF00'
    },
    dark: {
      bg: '#000000',
      bgSecondary: '#0A0E27',
      bgTertiary: '#1A1F3A',
      text: '#00FFFF',
      textSecondary: '#FF00FF',
      textTertiary: '#FFFF00',
      primary: '#00FFFF',
      secondary: '#FF00FF',
      accent: '#FFFF00',
      success: '#00FF00',
      warning: '#FFA500',
      error: '#FF0055',
      info: '#00FFFF',
      border: '#00FFFF',
      borderLight: '#FF00FF',
      borderHeavy: '#FFFF00'
    }
  },
  typography: {
    fontFamilyHeading: '"Orbitron", sans-serif',
    fontFamilyBody: '"Rajdhani", sans-serif',
    fontFamilyMono: '"Share Tech Mono", monospace',
    fontSizeBase: 16,
    fontSizeScale: [12, 14, 16, 18, 24, 32, 48, 64],
    fontWeightNormal: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    lineHeightBase: 1.4,
    letterSpacing: '0.05em'
  },
  spacing: {
    unit: 8,
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]
  },
  shadows: {
    sm: '0 0 10px rgba(0, 255, 255, 0.5)',
    md: '0 0 20px rgba(0, 255, 255, 0.6)',
    lg: '0 0 30px rgba(0, 255, 255, 0.7)',
    xl: '0 0 40px rgba(0, 255, 255, 0.8)',
    inner: 'inset 0 0 10px rgba(0, 255, 255, 0.3)',
    glow: '0 0 20px currentColor'
  },
  borders: {
    width: {
      thin: 1,
      medium: 2,
      thick: 3
    },
    radius: {
      sm: 0,
      md: 2,
      lg: 4,
      full: 0
    },
    style: 'solid'
  },
  animations: {
    duration: {
      fast: 100,
      base: 200,
      slow: 400
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      sharp: 'linear'
    },
    effects: ['glitch', 'flicker', 'scan']
  },
  accessibility: {
    contrastRatio: 'AA',
    reducedMotion: false,
    focusIndicatorWidth: 2,
    focusIndicatorColor: '#00FFFF'
  }
}
