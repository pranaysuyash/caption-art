# Design Document - Multi-Theme System

## Overview

This design document outlines the technical approach for implementing a comprehensive Multi-Theme System that provides users with multiple visual design themes beyond neo-brutalism. The system supports theme switching, persistence, customization, and ensures all themes maintain accessibility standards while providing unique visual identities.

The theme system architecture:
1. Theme definitions (presets + custom)
2. Theme engine (applies CSS variables)
3. Theme manager (orchestrates switching)
4. Theme storage (persistence)
5. Theme editor (customization)

## Architecture

### Component Structure

```
frontend/src/
├── lib/
│   ├── themes/
│   │   ├── themeManager.ts           # Main theme orchestrator
│   │   ├── themeEngine.ts            # CSS variable application
│   │   ├── themeStorage.ts           # localStorage persistence
│   │   ├── themeValidator.ts         # Theme validation and accessibility checks
│   │   ├── presets/
│   │   │   ├── neobrutalism.ts       # Neo-brutalism theme
│   │   │   ├── glassmorphism.ts      # Glassmorphism theme
│   │   │   ├── minimalist.ts         # Minimalist theme
│   │   │   ├── cyberpunk.ts          # Cyberpunk theme
│   │   │   └── index.ts              # Preset registry
│   │   └── animations/
│   │       ├── neobrutalism.ts       # Neo-brutalism animations
│   │       ├── glassmorphism.ts      # Glassmorphism animations
│   │       ├── minimalist.ts         # Minimalist animations
│   │       └── cyberpunk.ts          # Cyberpunk animations
│   └── utils/
│       ├── colorUtils.ts             # Color manipulation utilities
│       └── contrastChecker.ts        # WCAG contrast validation
└── components/
    ├── ThemeSelector.tsx             # Theme selection UI
    ├── ThemePreview.tsx              # Theme preview cards
    ├── ThemeEditor.tsx               # Custom theme editor
    ├── ThemeToggle.tsx               # Light/dark toggle
    └── ThemeExportImport.tsx         # Theme sharing

frontend/src/styles/
├── themes/
│   ├── neobrutalism.css              # Neo-brutalism styles
│   ├── glassmorphism.css             # Glassmorphism styles
│   ├── minimalist.css                # Minimalist styles
│   ├── cyberpunk.css                 # Cyberpunk styles
│   └── base.css                      # Shared base styles
└── animations/
    ├── neobrutalism-animations.css   # Neo-brutalism animations
    ├── glassmorphism-animations.css  # Glassmorphism animations
    ├── minimalist-animations.css     # Minimalist animations
    └── cyberpunk-animations.css      # Cyberpunk animations
```

### Data Flow

```
User Selection → Theme Manager → Theme Validator → Theme Engine → CSS Variables
                                                                        ↓
                                                                   DOM Update
                                                                        ↓
                                                                  localStorage

System Preference → Theme Manager → Apply Theme
Custom Theme → Theme Editor → Validation → Theme Manager → Apply
```

## Components and Interfaces

### 1. ThemeManager

**Purpose**: Orchestrates theme selection, application, and persistence

**Interface**:
```typescript
interface ThemeConfig {
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

interface ColorScheme {
  light: ColorPalette
  dark: ColorPalette
}

interface ColorPalette {
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

interface Typography {
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

interface Spacing {
  unit: number
  scale: number[]
}

interface Shadows {
  sm: string
  md: string
  lg: string
  xl: string
  inner: string
  glow?: string
}

interface Borders {
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

interface AnimationConfig {
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

interface AccessibilityConfig {
  contrastRatio: 'AA' | 'AAA'
  reducedMotion: boolean
  focusIndicatorWidth: number
  focusIndicatorColor: string
}

interface ThemeState {
  currentTheme: string
  mode: 'light' | 'dark'
  customThemes: ThemeConfig[]
  systemPreference: 'light' | 'dark'
  respectSystemPreference: boolean
}

class ThemeManager {
  constructor()
  
  async setTheme(themeId: string, mode?: 'light' | 'dark'): Promise<void>
  
  getTheme(): ThemeConfig
  
  getAvailableThemes(): ThemeConfig[]
  
  toggleMode(): void
  
  setMode(mode: 'light' | 'dark'): void
  
  createCustomTheme(config: Partial<ThemeConfig>): ThemeConfig
  
  updateCustomTheme(themeId: string, updates: Partial<ThemeConfig>): void
  
  deleteCustomTheme(themeId: string): void
  
  exportTheme(themeId: string): string
  
  importTheme(themeJson: string): ThemeConfig
  
  resetTheme(): void
  
  getState(): ThemeState
  
  subscribeToChanges(callback: (state: ThemeState) => void): () => void
}
```

### 2. ThemeEngine

**Purpose**: Applies theme configuration to the DOM via CSS variables

**Interface**:
```typescript
class ThemeEngine {
  applyTheme(theme: ThemeConfig, mode: 'light' | 'dark'): void
  
  applyColors(colors: ColorPalette): void
  
  applyTypography(typography: Typography): void
  
  applySpacing(spacing: Spacing): void
  
  applyShadows(shadows: Shadows): void
  
  applyBorders(borders: Borders): void
  
  applyAnimations(animations: AnimationConfig): void
  
  transitionTheme(fromTheme: ThemeConfig, toTheme: ThemeConfig, duration: number): Promise<void>
  
  private generateCSSVariables(theme: ThemeConfig, mode: 'light' | 'dark'): Record<string, string>
  
  private setCSSVariable(name: string, value: string): void
}
```

**CSS Variable Naming Convention**:
```css
/* Colors */
--color-bg
--color-bg-secondary
--color-text
--color-primary
--color-border

/* Typography */
--font-family-heading
--font-size-base
--font-weight-bold
--line-height-base

/* Spacing */
--spacing-unit
--spacing-xs
--spacing-sm
--spacing-md

/* Shadows */
--shadow-sm
--shadow-md
--shadow-glow

/* Borders */
--border-width-medium
--border-radius-md

/* Animations */
--animation-duration-base
--animation-easing-smooth
```

### 3. Theme Presets

#### Neo-brutalism Theme

**Purpose**: Bold, vibrant, geometric design

**Configuration**:
```typescript
const neobrutalism: ThemeConfig = {
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
      textTertiary: '#999999',
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      success: '#51CF66',
      warning: '#FFA94D',
      error: '#FF6B6B',
      info: '#4ECDC4',
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
      textTertiary: '#666666',
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
```

#### Glassmorphism Theme

**Purpose**: Modern frosted glass aesthetics

**Configuration**:
```typescript
const glassmorphism: ThemeConfig = {
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
```

#### Minimalist Theme

**Purpose**: Clean, focused, distraction-free design

**Configuration**:
```typescript
const minimalist: ThemeConfig = {
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
```

#### Cyberpunk Theme

**Purpose**: Futuristic neon aesthetics

**Configuration**:
```typescript
const cyberpunk: ThemeConfig = {
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
```

### 4. ThemeValidator

**Purpose**: Validates theme configurations and ensures accessibility compliance

**Interface**:
```typescript
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  field: string
  message: string
  severity: 'error'
}

interface ValidationWarning {
  field: string
  message: string
  severity: 'warning'
}

class ThemeValidator {
  validate(theme: ThemeConfig): ValidationResult
  
  validateColors(colors: ColorScheme): ValidationResult
  
  validateContrast(foreground: string, background: string, level: 'AA' | 'AAA'): boolean
  
  validateTypography(typography: Typography): ValidationResult
  
  validateAccessibility(config: AccessibilityConfig): ValidationResult
  
  private checkContrastRatios(colors: ColorPalette): ValidationError[]
  
  private checkColorFormat(color: string): boolean
}
```

**Validation Rules**:
- All colors must be valid CSS color values
- Text/background contrast must meet WCAG AA (4.5:1) or AAA (7:1)
- Font sizes must be between 12px and 72px
- Spacing values must be positive numbers
- Border radius must be non-negative
- Animation durations must be positive
- Focus indicator must have 3:1 contrast ratio

### 5. ThemeStorage

**Purpose**: Persists theme preferences to localStorage

**Interface**:
```typescript
interface StoredThemeData {
  currentThemeId: string
  mode: 'light' | 'dark'
  customThemes: ThemeConfig[]
  respectSystemPreference: boolean
  lastUpdated: number
}

class ThemeStorage {
  save(data: StoredThemeData): void
  
  load(): StoredThemeData | null
  
  saveCustomTheme(theme: ThemeConfig): void
  
  loadCustomThemes(): ThemeConfig[]
  
  deleteCustomTheme(themeId: string): void
  
  clear(): void
}
```

**Storage Keys**:
- `caption-art-theme`: Current theme and mode
- `caption-art-custom-themes`: User-created themes

## Data Models

### ThemeState

```typescript
interface ThemeState {
  currentTheme: ThemeConfig
  mode: 'light' | 'dark'
  availableThemes: ThemeConfig[]
  customThemes: ThemeConfig[]
  systemPreference: 'light' | 'dark'
  respectSystemPreference: boolean
  isTransitioning: boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all properties, I'll identify redundancies:

- Properties 1.2, 1.3, and 11.1-11.5 all test theme application - can be combined
- Properties 1.4 and 10.1-10.3 all test transition behavior - can be combined
- Properties 6.3 and 6.4 both test contrast ratios - can be combined with 12.1-12.3
- Properties 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.5 test theme-specific styles - can be one property per theme
- Properties 9.1 and 9.5 both test export - can be combined
- Properties 9.2, 9.3, 9.4 test import - can be combined

### Correctness Properties

Property 1: Theme application
*For any* theme selection, the system should immediately apply all theme properties (colors, typography, spacing, shadows, borders) to CSS variables without page reload
**Validates: Requirements 1.2, 1.3, 11.1, 11.2, 11.3, 11.4, 11.5**

Property 2: Theme persistence round-trip
*For any* theme selection, after saving and reloading the application, the same theme should be active
**Validates: Requirements 1.5**

Property 3: Theme transition smoothness
*For any* theme change, the transition should occur over 0.3 seconds with cubic-bezier easing and no layout shifts
**Validates: Requirements 1.4, 10.1, 10.2, 10.3**

Property 4: Neo-brutalism theme characteristics
*For any* component when neo-brutalism theme is active, it should have bold borders (3-5px), vibrant accent colors, offset shadows (4-12px), and Space Grotesk font for headings
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 5: Glassmorphism theme characteristics
*For any* component when glassmorphism theme is active, it should have backdrop-filter blur, semi-transparent backgrounds (10-20% opacity), subtle 1px borders, and rounded corners (12-24px)
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

Property 6: Minimalist theme characteristics
*For any* component when minimalist theme is active, it should have neutral low-saturation colors, subtle or no borders, minimal shadows, and increased whitespace
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

Property 7: Cyberpunk theme characteristics
*For any* component when cyberpunk theme is active, it should have neon colors (cyan, magenta, electric blue), glowing shadows, dark backgrounds, and monospace fonts
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

Property 8: Light and dark mode support
*For any* theme, both light and dark color schemes should be available and switching between them should preserve the theme's visual identity (typography, spacing, shadows, borders)
**Validates: Requirements 6.1, 6.2, 6.5**

Property 9: Accessibility contrast ratios
*For any* theme in any mode, text/background contrast should meet WCAG AA (4.5:1), interactive elements should have sufficient contrast, and focus indicators should have 3:1 contrast ratio
**Validates: Requirements 6.3, 6.4, 12.1, 12.2, 12.3**

Property 10: System preference detection
*For any* first-time load, the system should detect and apply the operating system's light or dark mode preference
**Validates: Requirements 7.1, 7.4**

Property 11: System preference synchronization
*For any* system theme change, if respecting system preferences is enabled, the application theme mode should update automatically
**Validates: Requirements 7.2, 7.5**

Property 12: Manual override precedence
*For any* manual theme selection, the system should override system preferences and persist the manual choice
**Validates: Requirements 7.3**

Property 13: Custom theme persistence
*For any* custom theme created and saved, it should be stored in localStorage and appear in the theme selector after reload
**Validates: Requirements 8.3, 8.4**

Property 14: Custom theme deletion
*For any* custom theme deletion, it should be removed from localStorage and the system should revert to a preset theme
**Validates: Requirements 8.5**

Property 15: Theme export completeness
*For any* theme export, the generated JSON should contain all theme properties (name, colors, typography, spacing, shadows, borders, animations, accessibility)
**Validates: Requirements 9.1, 9.5**

Property 16: Theme import round-trip
*For any* valid theme, exporting then importing should produce an equivalent theme configuration
**Validates: Requirements 9.1, 9.2, 9.3, 9.5**

Property 17: Invalid theme import rejection
*For any* invalid theme JSON, the import should fail with an appropriate error message and not modify the current theme
**Validates: Requirements 9.2, 9.4**

Property 18: Reduced motion accessibility
*For any* theme change when reduced motion is enabled, all transition animations should be disabled
**Validates: Requirements 10.4**

Property 19: Initial load without transition
*For any* page load, the saved theme should be applied immediately without visible transition animation
**Validates: Requirements 10.5**

Property 20: High contrast mode
*For any* theme when high contrast mode is enabled, all contrast ratios should meet WCAG AAA standards (7:1)
**Validates: Requirements 12.4**

Property 21: Color blind mode
*For any* theme when color blind mode is enabled, the color palette should use color blind friendly combinations
**Validates: Requirements 12.5**

Property 22: Theme API getTheme
*For any* active theme, calling getTheme() should return the complete current theme configuration
**Validates: Requirements 15.1**

Property 23: Theme API setTheme
*For any* valid theme ID, calling setTheme(id) should apply that theme
**Validates: Requirements 15.2**

Property 24: Theme API getAvailableThemes
*For any* state, calling getAvailableThemes() should return all preset and custom themes
**Validates: Requirements 15.3**

Property 25: Theme API createCustomTheme
*For any* valid theme configuration, calling createCustomTheme(config) should validate and register the theme
**Validates: Requirements 15.4**

Property 26: Theme API resetTheme
*For any* state, calling resetTheme() should revert to the default theme (neo-brutalism light)
**Validates: Requirements 15.5**

## Error Handling

### Theme Validation Errors

**Invalid Color Format**:
- Display: "Invalid color format in theme. Please use valid CSS colors."
- Highlight problematic color field
- Prevent theme application

**Insufficient Contrast**:
- Display: "Theme does not meet accessibility standards. Text contrast is too low."
- Show contrast ratio and required ratio
- Allow override with warning

**Missing Required Fields**:
- Display: "Theme configuration is incomplete. Missing: [field names]"
- List missing fields
- Prevent theme save

**Invalid Font Family**:
- Display: "Font family not available. Falling back to system font."
- Use fallback font
- Log warning

### Theme Import Errors

**Invalid JSON**:
- Display: "Invalid theme file. Please check the file format."
- Show JSON parse error
- Do not modify current theme

**Incompatible Version**:
- Display: "Theme was created with a newer version. Some features may not work."
- Allow import with warning
- Log compatibility issues

**Corrupted Theme Data**:
- Display: "Theme file is corrupted or incomplete."
- List missing/invalid fields
- Do not import

### localStorage Errors

**Storage Unavailable**:
- Display: "Theme preferences cannot be saved. Using default theme."
- Use in-memory storage
- Theme will not persist

**Storage Full**:
- Clear old custom themes
- Retry save
- If still fails, display: "Storage full. Please delete some custom themes."

**Corrupted Data**:
- Clear corrupted entry
- Display: "Theme data corrupted. Resetting to default theme."
- Log error for debugging

### System Preference Errors

**Detection Unavailable**:
- Fall back to light mode
- Log warning
- Allow manual theme selection

**Preference Change Listener Failed**:
- Disable automatic synchronization
- Display: "Automatic theme switching disabled."
- Allow manual mode toggle

## Testing Strategy

### Unit Tests

**ThemeManager**:
- Test theme selection
- Test mode toggling
- Test custom theme creation
- Test theme deletion
- Test export/import
- Test state management

**ThemeEngine**:
- Test CSS variable application
- Test color application
- Test typography application
- Test transition animation
- Test variable generation

**ThemeValidator**:
- Test color validation
- Test contrast checking
- Test typography validation
- Test accessibility validation
- Test complete theme validation

**ThemeStorage**:
- Test save/load cycle
- Test custom theme storage
- Test deletion
- Test corrupted data handling

**Theme Presets**:
- Test each preset has required fields
- Test each preset has light and dark modes
- Test each preset meets accessibility standards

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

**Property 1: Theme application**
- Generate random theme selections
- Apply theme
- Verify all CSS variables updated
- Verify no page reload

**Property 2: Theme persistence round-trip**
- Generate random themes
- Save to localStorage
- Reload application
- Verify same theme active

**Property 3: Theme transition smoothness**
- Generate random theme pairs
- Switch between them
- Verify 0.3s duration
- Verify cubic-bezier easing
- Verify no layout shifts

**Property 4-7: Theme characteristics**
- For each theme (neo-brutalism, glassmorphism, minimalist, cyberpunk)
- Apply theme
- Verify specific visual properties
- Check borders, colors, shadows, fonts

**Property 8: Light and dark mode support**
- Generate random themes
- Verify both modes exist
- Switch between modes
- Verify non-color properties unchanged

**Property 9: Accessibility contrast ratios**
- For all themes and modes
- Check text/background contrast
- Verify meets WCAG AA (4.5:1)
- Check interactive elements
- Check focus indicators (3:1)

**Property 10: System preference detection**
- Mock system preferences
- Load application
- Verify correct mode applied

**Property 11: System preference synchronization**
- Enable system preference respect
- Change system preference
- Verify theme mode updates

**Property 12: Manual override precedence**
- Set system preference
- Manually select theme
- Verify manual choice persists

**Property 13: Custom theme persistence**
- Create random custom themes
- Save them
- Reload application
- Verify themes available

**Property 14: Custom theme deletion**
- Create and save custom theme
- Delete it
- Verify removed from storage
- Verify fallback to preset

**Property 15: Theme export completeness**
- Export random themes
- Parse JSON
- Verify all required fields present

**Property 16: Theme import round-trip**
- Generate random themes
- Export to JSON
- Import from JSON
- Verify equivalent configuration

**Property 17: Invalid theme import rejection**
- Generate invalid theme JSON
- Attempt import
- Verify rejection
- Verify error message
- Verify current theme unchanged

**Property 18: Reduced motion accessibility**
- Enable reduced motion
- Change theme
- Verify no transitions

**Property 19: Initial load without transition**
- Save theme
- Reload page
- Verify no transition animation

**Property 20: High contrast mode**
- Enable high contrast
- Check all themes
- Verify WCAG AAA (7:1)

**Property 21: Color blind mode**
- Enable color blind mode
- Check color palettes
- Verify color blind friendly

**Property 22-26: Theme API**
- Test each API method
- Verify correct behavior
- Check return values
- Verify state changes

### Integration Tests

**Full Theme Switching Flow**:
- Open theme selector
- Select different theme
- Verify transition
- Verify persistence
- Reload page
- Verify theme maintained

**Custom Theme Creation Flow**:
- Open theme editor
- Modify colors, fonts, spacing
- Preview changes
- Save custom theme
- Verify appears in selector
- Select custom theme
- Verify applied correctly

**Theme Export/Import Flow**:
- Create custom theme
- Export to JSON
- Delete custom theme
- Import from JSON
- Verify theme restored

**System Preference Integration**:
- Enable system preference respect
- Change system theme
- Verify app updates
- Manually select theme
- Change system theme again
- Verify manual choice maintained

**Accessibility Mode Integration**:
- Enable high contrast mode
- Switch themes
- Verify all meet AAA
- Enable reduced motion
- Switch themes
- Verify no animations

## Implementation Notes

### CSS Variable Application

```typescript
function applyCSSVariables(theme: ThemeConfig, mode: 'light' | 'dark'): void {
  const colors = theme.colors[mode]
  const root = document.documentElement
  
  // Apply colors
  root.style.setProperty('--color-bg', colors.bg)
  root.style.setProperty('--color-bg-secondary', colors.bgSecondary)
  root.style.setProperty('--color-text', colors.text)
  root.style.setProperty('--color-primary', colors.primary)
  // ... more colors
  
  // Apply typography
  root.style.setProperty('--font-family-heading', theme.typography.fontFamilyHeading)
  root.style.setProperty('--font-size-base', `${theme.typography.fontSizeBase}px`)
  // ... more typography
  
  // Apply spacing
  theme.spacing.scale.forEach((value, index) => {
    root.style.setProperty(`--spacing-${index}`, `${value}px`)
  })
  
  // Apply shadows
  root.style.setProperty('--shadow-sm', theme.shadows.sm)
  root.style.setProperty('--shadow-md', theme.shadows.md)
  // ... more shadows
  
  // Apply borders
  root.style.setProperty('--border-width-medium', `${theme.borders.width.medium}px`)
  root.style.setProperty('--border-radius-md', `${theme.borders.radius.md}px`)
  // ... more borders
  
  // Apply animations
  root.style.setProperty('--animation-duration-base', `${theme.animations.duration.base}ms`)
  root.style.setProperty('--animation-easing-smooth', theme.animations.easing.smooth)
  // ... more animations
}
```

### Theme Transition Animation

```typescript
async function transitionTheme(
  fromTheme: ThemeConfig,
  toTheme: ThemeConfig,
  duration: number = 300
): Promise<void> {
  // Add transition class
  document.documentElement.classList.add('theme-transitioning')
  
  // Set transition duration
  document.documentElement.style.setProperty('--theme-transition-duration', `${duration}ms`)
  
  // Apply new theme
  applyCSSVariables(toTheme, currentMode)
  
  // Wait for transition to complete
  await new Promise(resolve => setTimeout(resolve, duration))
  
  // Remove transition class
  document.documentElement.classList.remove('theme-transitioning')
}
```

### Contrast Checking

```typescript
function checkContrast(foreground: string, background: string): number {
  const fgLuminance = getRelativeLuminance(foreground)
  const bgLuminance = getRelativeLuminance(background)
  
  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)
  
  return (lighter + 0.05) / (darker + 0.05)
}

function getRelativeLuminance(color: string): number {
  const rgb = parseColor(color)
  const [r, g, b] = rgb.map(channel => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  })
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function meetsWCAG(contrast: number, level: 'AA' | 'AAA'): boolean {
  const required = level === 'AA' ? 4.5 : 7.0
  return contrast >= required
}
```

### System Preference Detection

```typescript
function detectSystemPreference(): 'light' | 'dark' {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function watchSystemPreference(callback: (mode: 'light' | 'dark') => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light')
  }
  
  mediaQuery.addEventListener('change', handler)
  
  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', handler)
}
```

### Theme Export/Import

```typescript
function exportTheme(theme: ThemeConfig): string {
  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    theme: theme
  }
  
  return JSON.stringify(exportData, null, 2)
}

function importTheme(json: string): ThemeConfig {
  const data = JSON.parse(json)
  
  // Validate structure
  if (!data.theme || !data.version) {
    throw new Error('Invalid theme file structure')
  }
  
  // Validate theme
  const validator = new ThemeValidator()
  const result = validator.validate(data.theme)
  
  if (!result.valid) {
    throw new Error(`Invalid theme: ${result.errors.map(e => e.message).join(', ')}`)
  }
  
  return data.theme
}
```

### localStorage Schema

```typescript
interface StoredThemeData {
  currentThemeId: string
  mode: 'light' | 'dark'
  customThemes: ThemeConfig[]
  respectSystemPreference: boolean
  lastUpdated: number
}

// Save
localStorage.setItem('caption-art-theme', JSON.stringify(themeData))

// Load
const stored = localStorage.getItem('caption-art-theme')
const themeData = stored ? JSON.parse(stored) : getDefaultThemeData()
```

### Performance Optimization

- Debounce theme editor changes (300ms)
- Use CSS transitions instead of JavaScript animations
- Lazy load theme presets
- Cache contrast calculations
- Use requestAnimationFrame for smooth transitions
- Minimize DOM reflows during theme application
- Preload fonts for all themes

### Browser Compatibility

- Use CSS custom properties (widely supported)
- Polyfill `matchMedia` for older browsers
- Handle localStorage unavailability
- Test in Chrome, Firefox, Safari, Edge
- Test on mobile browsers
- Ensure backdrop-filter fallback for glassmorphism

### Accessibility

- Announce theme changes to screen readers
- Provide keyboard shortcuts for theme switching
- Ensure focus indicators work in all themes
- Respect prefers-reduced-motion
- Maintain WCAG AA minimum for all themes
- Provide high contrast mode option
- Support color blind modes

### User Experience

- Show theme preview before applying
- Animate theme transitions smoothly
- Persist theme choice across sessions
- Respect system preferences by default
- Make theme selector easily accessible
- Provide theme reset option
- Show theme name in UI
- Indicate current theme clearly
- Allow quick light/dark toggle
- Provide theme recommendations based on time of day
