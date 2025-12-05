/**
 * Pastel Theme Preset (Default)
 * 
 * The default Caption Art theme featuring soft, approachable colors
 * and a clean, professional aesthetic.
 */

import { ThemeConfig } from '../types'

export const pastel: ThemeConfig = {
  id: 'pastel',
  name: 'Pastel (Default)',
  description: 'Soft, approachable colors with a professional aesthetic',
  category: 'preset',
  version: '1.0.0',
  colors: {
    light: {
      bg: '#f8fafc',
      bgSecondary: '#FFFFFF',
      bgTertiary: '#f1f5f9',
      text: '#0f172a',
      textSecondary: '#64748b',
      textTertiary: '#94a3b8',
      primary: '#2563eb',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      success: '#16a34a',
      warning: '#f97316',
      error: '#dc2626',
      info: '#3b82f6',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      borderHeavy: '#cbd5e1'
    },
    dark: {
      bg: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      textTertiary: '#64748b',
      primary: '#3b82f6',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      success: '#22c55e',
      warning: '#fb923c',
      error: '#ef4444',
      info: '#60a5fa',
      border: '#334155',
      borderLight: '#1e293b',
      borderHeavy: '#475569'
    }
  },
  typography: {
    fontFamilyHeading: '"Inter", "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
    fontFamilyBody: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    fontFamilyMono: '"JetBrains Mono", "Fira Code", monospace',
    fontSizeBase: 16,
    fontSizeScale: [12, 14, 16, 18, 20, 24, 32],
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    lineHeightBase: 1.5,
    letterSpacing: 'normal'
  },
  spacing: {
    unit: 4,
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },
  borders: {
    width: {
      thin: 1,
      medium: 2,
      thick: 4
    },
    radius: {
      sm: 6,
      md: 8,
      lg: 12,
      full: 9999
    },
    style: 'solid'
  },
  animations: {
    duration: {
      fast: 150,
      base: 200,
      slow: 300
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    effects: ['fade', 'slide']
  },
  accessibility: {
    contrastRatio: 'AA',
    reducedMotion: false,
    focusIndicatorWidth: 2,
    focusIndicatorColor: '#2563eb'
  }
}
