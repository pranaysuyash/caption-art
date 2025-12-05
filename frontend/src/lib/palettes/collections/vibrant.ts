/**
 * Vibrant Color Palettes
 * 
 * Collection of vibrant, energetic color palettes with high saturation values.
 * All palettes meet WCAG AA standards and feature complementary accent colors.
 */

import type { ColorPalette } from '../types'
import { validatePalette } from '../paletteValidator'
import { validateAndUpdatePalettes } from './validateAndUpdate'

/**
 * Sunset - Warm vibrant palette with oranges and purples
 */
export const sunset: ColorPalette = {
  id: 'vibrant-sunset',
  name: 'Sunset',
  description: 'Warm and energetic palette inspired by golden hour sunsets',
  category: 'vibrant',
  colors: {
    primary: '#E65100',      // Vibrant deep orange (sat: 100%)
    secondary: '#FF6F00',    // Bright amber (sat: 100%)
    tertiary: '#FF8F00',     // Light amber (sat: 100%)
    accent: '#0277BD',       // Complementary blue (sat: 98%)
    background: '#FFF3E0',   // Light orange (allows better contrast)
    backgroundSecondary: '#FFE0B2', // Deeper orange
    text: '#1A1A1A',         // Near black
    textSecondary: '#4A4A4A', // Dark gray
    success: '#1B5E20',      // Dark green
    warning: '#E65100',      // Dark orange
    error: '#B71C1C',        // Dark red
    info: '#01579B',         // Dark blue
  },
  metadata: {
    author: 'Color Palette System',
    tags: ['warm', 'energetic', 'sunset', 'vibrant'],
    createdAt: Date.now(),
    accessibility: {
      wcagLevel: 'AA',
      contrastRatios: {},
    },
  },
}

/**
 * Ocean - Cool vibrant palette with blues and teals
 */
export const ocean: ColorPalette = {
  id: 'vibrant-ocean',
  name: 'Ocean',
  description: 'Deep and vibrant palette inspired by tropical ocean waters',
  category: 'vibrant',
  colors: {
    primary: '#0277BD',      // Vibrant ocean blue (sat: 98%)
    secondary: '#0288D1',    // Bright blue (sat: 98%)
    tertiary: '#039BE5',     // Light blue (sat: 97%)
    accent: '#FF6F00',       // Complementary orange (sat: 100%)
    background: '#F0F8FF',   // Alice blue (allows better contrast)
    backgroundSecondary: '#E3F2FD', // Light blue
    text: '#1A1A1A',         // Near black
    textSecondary: '#4A4A4A', // Dark gray
    success: '#1B5E20',      // Dark green
    warning: '#E65100',      // Dark orange
    error: '#B71C1C',        // Dark red
    info: '#01579B',         // Dark blue
  },
  metadata: {
    author: 'Color Palette System',
    tags: ['cool', 'ocean', 'blue', 'vibrant'],
    createdAt: Date.now(),
    accessibility: {
      wcagLevel: 'AA',
      contrastRatios: {},
    },
  },
}

/**
 * Forest - Natural vibrant palette with greens
 */
export const forest: ColorPalette = {
  id: 'vibrant-forest',
  name: 'Forest',
  description: 'Lush and vibrant palette inspired by dense forests',
  category: 'vibrant',
  colors: {
    primary: '#2E7D32',      // Vibrant forest green (sat: 72%)
    secondary: '#388E3C',    // Bright green (sat: 72%)
    tertiary: '#43A047',     // Light green (sat: 72%)
    accent: '#D32F2F',       // Complementary red (sat: 77%)
    background: '#F1F8F4',   // Mint cream (allows better contrast)
    backgroundSecondary: '#E8F5E9', // Light green
    text: '#1A1A1A',         // Near black
    textSecondary: '#4A4A4A', // Dark gray
    success: '#1B5E20',      // Dark green
    warning: '#E65100',      // Dark orange
    error: '#B71C1C',        // Dark red
    info: '#01579B',         // Dark blue
  },
  metadata: {
    author: 'Color Palette System',
    tags: ['nature', 'green', 'forest', 'vibrant'],
    createdAt: Date.now(),
    accessibility: {
      wcagLevel: 'AA',
      contrastRatios: {},
    },
  },
}

/**
 * Berry - Rich vibrant palette with purples and magentas
 */
export const berry: ColorPalette = {
  id: 'vibrant-berry',
  name: 'Berry',
  description: 'Rich and vibrant palette inspired by fresh berries',
  category: 'vibrant',
  colors: {
    primary: '#7B1FA2',      // Vibrant purple (sat: 83%)
    secondary: '#8E24AA',    // Bright purple (sat: 83%)
    tertiary: '#9C27B0',     // Light purple (sat: 83%)
    accent: '#689F38',       // Complementary yellow-green (sat: 78%)
    background: '#F9F5FB',   // Lavender cream (allows better contrast)
    backgroundSecondary: '#F3E5F5', // Light purple
    text: '#1A1A1A',         // Near black
    textSecondary: '#4A4A4A', // Dark gray
    success: '#1B5E20',      // Dark green
    warning: '#E65100',      // Dark orange
    error: '#B71C1C',        // Dark red
    info: '#01579B',         // Dark blue
  },
  metadata: {
    author: 'Color Palette System',
    tags: ['purple', 'berry', 'rich', 'vibrant'],
    createdAt: Date.now(),
    accessibility: {
      wcagLevel: 'AA',
      contrastRatios: {},
    },
  },
}

/**
 * Citrus - Bright vibrant palette with yellows and greens
 */
export const citrus: ColorPalette = {
  id: 'vibrant-citrus',
  name: 'Citrus',
  description: 'Bright and zesty palette inspired by citrus fruits',
  category: 'vibrant',
  colors: {
    primary: '#F9A825',      // Vibrant golden yellow (sat: 85%)
    secondary: '#FBC02D',    // Bright yellow (sat: 82%)
    tertiary: '#FDD835',     // Light yellow (sat: 79%)
    accent: '#5E35B1',       // Complementary purple (sat: 70%)
    background: '#FFFEF0',   // Cream (allows better contrast)
    backgroundSecondary: '#FFF9C4', // Light yellow
    text: '#1A1A1A',         // Near black
    textSecondary: '#4A4A4A', // Dark gray
    success: '#1B5E20',      // Dark green
    warning: '#E65100',      // Dark orange
    error: '#B71C1C',        // Dark red
    info: '#01579B',         // Dark blue
  },
  metadata: {
    author: 'Color Palette System',
    tags: ['yellow', 'bright', 'citrus', 'vibrant'],
    createdAt: Date.now(),
    accessibility: {
      wcagLevel: 'AA',
      contrastRatios: {},
    },
  },
}

/**
 * Tropical - Exotic vibrant palette with teals and corals
 */
export const tropical: ColorPalette = {
  id: 'vibrant-tropical',
  name: 'Tropical',
  description: 'Exotic and vibrant palette inspired by tropical paradise',
  category: 'vibrant',
  colors: {
    primary: '#00796B',      // Vibrant teal (sat: 100%)
    secondary: '#00897B',    // Bright teal (sat: 100%)
    tertiary: '#009688',     // Light teal (sat: 100%)
    accent: '#E53935',       // Complementary coral red (sat: 76%)
    background: '#F0FFF4',   // Honeydew (allows better contrast)
    backgroundSecondary: '#E0F2F1', // Light teal
    text: '#1A1A1A',         // Near black
    textSecondary: '#4A4A4A', // Dark gray
    success: '#1B5E20',      // Dark green
    warning: '#E65100',      // Dark orange
    error: '#B71C1C',        // Dark red
    info: '#01579B',         // Dark blue
  },
  metadata: {
    author: 'Color Palette System',
    tags: ['teal', 'tropical', 'exotic', 'vibrant'],
    createdAt: Date.now(),
    accessibility: {
      wcagLevel: 'AA',
      contrastRatios: {},
    },
  },
}

/**
 * Fire - Hot vibrant palette with reds and oranges
 */
export const fire: ColorPalette = {
  id: 'vibrant-fire',
  name: 'Fire',
  description: 'Hot and intense palette inspired by flames',
  category: 'vibrant',
  colors: {
    primary: '#C62828',      // Vibrant red (sat: 84%)
    secondary: '#D32F2F',    // Bright red (sat: 77%)
    tertiary: '#E53935',     // Light red (sat: 76%)
    accent: '#1976D2',       // Complementary blue (sat: 85%)
    background: '#FFF5F5',   // Rose cream (allows better contrast)
    backgroundSecondary: '#FFEBEE', // Light red
    text: '#1A1A1A',         // Near black
    textSecondary: '#4A4A4A', // Dark gray
    success: '#1B5E20',      // Dark green
    warning: '#E65100',      // Dark orange
    error: '#B71C1C',        // Dark red
    info: '#01579B',         // Dark blue
  },
  metadata: {
    author: 'Color Palette System',
    tags: ['red', 'fire', 'hot', 'vibrant'],
    createdAt: Date.now(),
    accessibility: {
      wcagLevel: 'AA',
      contrastRatios: {},
    },
  },
}

/**
 * Electric - Bold vibrant palette with electric blues and magentas
 */
export const electric: ColorPalette = {
  id: 'vibrant-electric',
  name: 'Electric',
  description: 'Bold and energetic palette with electric colors',
  category: 'vibrant',
  colors: {
    primary: '#1565C0',      // Vibrant electric blue (sat: 88%)
    secondary: '#1976D2',    // Bright blue (sat: 85%)
    tertiary: '#1E88E5',     // Light blue (sat: 83%)
    accent: '#FF6F00',       // Complementary orange (sat: 100%)
    background: '#F0F7FF',   // Light blue cream (allows better contrast)
    backgroundSecondary: '#E3F2FD', // Light blue
    text: '#1A1A1A',         // Near black
    textSecondary: '#4A4A4A', // Dark gray
    success: '#1B5E20',      // Dark green
    warning: '#E65100',      // Dark orange
    error: '#B71C1C',        // Dark red
    info: '#01579B',         // Dark blue
  },
  metadata: {
    author: 'Color Palette System',
    tags: ['blue', 'electric', 'bold', 'vibrant'],
    createdAt: Date.now(),
    accessibility: {
      wcagLevel: 'AA',
      contrastRatios: {},
    },
  },
}

/**
 * All vibrant palettes (raw definitions)
 */
const rawVibrantPalettes: ColorPalette[] = [
  sunset,
  ocean,
  forest,
  berry,
  citrus,
  tropical,
  fire,
  electric,
]

/**
 * All vibrant palettes with validated metadata
 */
export const vibrantPalettes: ColorPalette[] = validateAndUpdatePalettes(rawVibrantPalettes)

// Validate all palettes on module load (development only)
if (import.meta.env.DEV) {
  vibrantPalettes.forEach((palette) => {
    const result = validatePalette(palette)
    if (!result.valid) {
      console.warn(`Vibrant palette "${palette.name}" has validation issues:`, result.errors)
    }
  })
}
