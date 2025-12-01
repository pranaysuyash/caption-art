/**
 * Minimalist Theme Preset
 * 
 * Clean, focused, distraction-free design with neutral colors and subtle styling.
 * Features system fonts and increased whitespace for optimal readability.
 */

import { ThemeConfig } from '../types'

export const minimalist: ThemeConfig = {
  id: 'minimalist',
  name: 'Minimalist',
  description: 'Clean and subtle design focused on content',
  category: 'preset',
  version: '1.0.0',
  colors: {
    light: {
      bg: '#FFFFFF',
      bgSecondary: '#F9FAFB',
      bgTertiary: '#F3F4F6',
      text: '#111827',
      textSecondary: '#6B7280',
      textTertiary: '#9CA3AF',
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      borderHeavy: '#D1D5DB'
    },
    dark: {
      bg: '#111827',
      bgSecondary: '#1F2937',
      bgTertiary: '#374151',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      textTertiary: '#9CA3AF',
      primary: '#60A5FA',
      secondary: '#A78BFA',
      accent: '#34D399',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
      border: '#374151',
      borderLight: '#1F2937',
      borderHeavy: '#4B5563'
    }
  },
  typography: {
    fontFamilyHeading: 'system-ui, -apple-system, sans-serif',
    fontFamilyBody: 'system-ui, -apple-system, sans-serif',
    fontFamilyMono: '"SF Mono", "Monaco", monospace',
    fontSizeBase: 16,
    fontSizeScale: [12, 14, 16, 18, 20, 24, 30, 36],
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    lineHeightBase: 1.6,
    letterSpacing: '-0.01em'
  },
  spacing: {
    unit: 8,
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
  },
  borders: {
    width: {
      thin: 1,
      medium: 1,
      thick: 2
    },
    radius: {
      sm: 4,
      md: 6,
      lg: 8,
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
    contrastRatio: 'AAA',
    reducedMotion: false,
    focusIndicatorWidth: 2,
    focusIndicatorColor: '#3B82F6'
  }
}
