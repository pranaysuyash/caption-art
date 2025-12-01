# Design Document - Neo-Brutalism UI Integration

## Overview

This design document outlines the technical approach for integrating neo-brutalism design principles into the existing React-based Caption Art application. The integration will transform the current minimal dark UI into a vibrant, bold interface while maintaining all existing functionality and AWS backend integration.

The neo-brutalism design system emphasizes:
- Bold 3-5px borders on interactive elements
- Vibrant color palette (coral, turquoise, yellow accents)
- Offset shadows (4-12px) for depth
- Custom typography (Space Grotesk, JetBrains Mono)
- Smooth animations with cubic-bezier easing
- Light/dark theme support

## Architecture

### Component Structure

```
frontend/
├── src/
│   ├── App.tsx                          # Main application (updated)
│   ├── main.tsx                         # Entry point
│   ├── components/
│   │   ├── ThemeToggle.tsx             # Theme switcher component (new)
│   │   ├── Toast.tsx                   # Toast notification system (new)
│   │   ├── UploadZone.tsx              # Drag-and-drop upload (new)
│   │   └── CaptionGrid.tsx             # Caption cards display (new)
│   ├── styles/
│   │   ├── design-system.css           # Core design tokens (new)
│   │   ├── components.css              # Component styles (new)
│   │   ├── animations.css              # Animation definitions (new)
│   │   ├── themes.css                  # Light/dark themes (new)
│   │   └── styles.css                  # Main stylesheet (updated)
│   └── hooks/
│       └── useTheme.ts                 # Theme management hook (new)
└── index.html                           # HTML entry (updated for fonts)
```

### Design System Layers

1. **Design Tokens Layer** (`design-system.css`)
   - CSS custom properties for colors, spacing, typography
   - Shared across all components
   - Theme-aware variables

2. **Component Layer** (`components.css`)
   - Reusable component styles
   - Neo-brutalism aesthetic applied
   - Responsive breakpoints

3. **Animation Layer** (`animations.css`)
   - Keyframe definitions
   - Transition utilities
   - Micro-interaction effects

4. **Theme Layer** (`themes.css`)
   - Light/dark color schemes
   - Theme transition animations
   - System preference detection

## Components and Interfaces

### 1. ThemeToggle Component

**Purpose**: Provides a button to switch between light and dark themes

**Interface**:
```typescript
interface ThemeToggleProps {
  // No props needed - uses context/hook
}

export function ThemeToggle(): JSX.Element
```

**Behavior**:
- Reads current theme from localStorage on mount
- Toggles between 'light' and 'dark' themes
- Persists preference to localStorage
- Updates document root class for CSS theme switching
- Displays sun/moon icon based on current theme

### 2. Toast Component

**Purpose**: Displays temporary notification messages

**Interface**:
```typescript
interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

interface ToastProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastProps): JSX.Element
```

**Behavior**:
- Slides in from right side of screen
- Auto-dismisses after 3 seconds (configurable)
- Stacks vertically with proper spacing
- Click to dismiss manually
- Animated exit on dismiss

### 3. UploadZone Component

**Purpose**: Drag-and-drop file upload with visual feedback

**Interface**:
```typescript
interface UploadZoneProps {
  onFile: (file: File) => void
  loading: boolean
  currentFile: File | null
}

export function UploadZone({ onFile, loading, currentFile }: UploadZoneProps): JSX.Element
```

**Behavior**:
- Highlights on drag-over
- Accepts JPG/PNG files
- Shows preview after upload
- Displays loading state during processing
- Remove button to clear current image

### 4. CaptionGrid Component

**Purpose**: Displays caption suggestions in a grid layout

**Interface**:
```typescript
interface CaptionGridProps {
  captions: string[]
  onSelect: (caption: string) => void
  loading: boolean
}

export function CaptionGrid({ captions, onSelect, loading }: CaptionGridProps): JSX.Element
```

**Behavior**:
- Grid layout with neo-brutalism cards
- Skeleton loaders while loading
- Hover lift effect on cards
- Bounce animation on click
- Staggered entry animations

## Data Models

### Theme State

```typescript
type Theme = 'light' | 'dark'

interface ThemeContext {
  theme: Theme
  toggleTheme: () => void
}
```

### Toast State

```typescript
interface ToastState {
  toasts: Toast[]
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: string) => void
}
```

### Application State (existing, maintained)

```typescript
interface AppState {
  file: File | null
  imageObjUrl: string
  loading: boolean
  maskUrl: string
  captions: string[]
  text: string
  preset: StylePreset
  fontSize: number
  licenseOk: boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme persistence round-trip
*For any* theme selection (light or dark), when a user toggles the theme, closes the browser, and reopens the application, the theme should be the same as what was selected
**Validates: Requirements 3.2, 3.3**

### Property 2: Border consistency
*For any* interactive element (button, card, input), the rendered border width should be between 3px and 5px inclusive
**Validates: Requirements 1.1**

### Property 3: Color palette compliance
*For any* rendered component, all accent colors used should be from the defined palette (coral #FF6B6B, turquoise #4ECDC4, yellow #FFE66D, or their theme variants)
**Validates: Requirements 1.2**

### Property 4: Shadow offset presence
*For any* card or button element, the computed box-shadow should include an offset of at least 4px in x or y direction
**Validates: Requirements 1.3**

### Property 5: Animation timing consistency
*For any* CSS transition, the timing function should use cubic-bezier easing (not linear or default ease)
**Validates: Requirements 1.5**

### Property 6: Toast auto-dismiss timing
*For any* toast notification, if not manually dismissed, it should automatically disappear after 3 seconds (±100ms tolerance)
**Validates: Requirements 6.4**

### Property 7: Toast stacking order
*For any* sequence of toast notifications, they should be displayed in chronological order from top to bottom with consistent spacing
**Validates: Requirements 6.5**

### Property 8: Hover lift effect
*For any* button or card element, when hovered, the translateY value should be negative (element moves up) and shadow should increase
**Validates: Requirements 2.1**

### Property 9: Mobile touch target size
*For any* interactive element on mobile viewport (width < 768px), the minimum clickable area should be at least 44px × 44px
**Validates: Requirements 8.2**

### Property 10: Responsive layout transformation
*For any* viewport width below 768px, multi-column layouts should transform to single-column stacked layouts
**Validates: Requirements 8.4**

### Property 11: Font loading verification
*For any* page load, the document should include link tags for Space Grotesk and JetBrains Mono fonts from Google Fonts
**Validates: Requirements 1.4**

### Property 12: Theme transition smoothness
*For any* theme toggle, all color transitions should complete within 300ms (±50ms tolerance)
**Validates: Requirements 3.4**

### Property 13: Existing functionality preservation
*For any* user action that worked in the original application (upload, caption generation, mask generation, export), the same action should produce equivalent results after the UI integration
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

## Error Handling

### Theme Loading Errors
- If localStorage is unavailable, default to light theme
- If saved theme value is invalid, default to light theme
- Log errors to console for debugging

### Animation Performance
- Use `will-change` CSS property sparingly to avoid memory issues
- Disable animations on low-performance devices using `prefers-reduced-motion`
- Fallback to instant transitions if animations cause jank

### Font Loading Failures
- Define fallback font stacks for all custom fonts
- Use `font-display: swap` to prevent invisible text
- Gracefully degrade to system fonts if Google Fonts unavailable

### Component Rendering Errors
- Wrap components in error boundaries
- Display fallback UI if component fails to render
- Log errors to console with component name

## Testing Strategy

### Unit Tests

**Theme Management**:
- Test theme toggle function switches between light/dark
- Test localStorage persistence on theme change
- Test default theme when no preference saved
- Test invalid theme value handling

**Toast System**:
- Test toast addition to queue
- Test toast removal by ID
- Test auto-dismiss timer
- Test manual dismiss

**Component Rendering**:
- Test ThemeToggle renders correct icon
- Test UploadZone shows/hides based on file state
- Test CaptionGrid renders correct number of cards
- Test skeleton loaders display during loading

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

**Property 1: Theme persistence round-trip**
- Generate random theme selections
- Simulate localStorage save/load cycle
- Verify theme matches original selection

**Property 2: Border consistency**
- Generate random component types
- Query computed border-width
- Verify value is between 3-5px

**Property 3: Color palette compliance**
- Generate random component instances
- Extract all color values from computed styles
- Verify all accent colors match palette

**Property 4: Shadow offset presence**
- Generate random card/button elements
- Parse box-shadow computed style
- Verify offset ≥ 4px in x or y

**Property 5: Animation timing consistency**
- Generate random animated elements
- Extract transition-timing-function
- Verify it uses cubic-bezier (not linear/ease)

**Property 6: Toast auto-dismiss timing**
- Generate random toast messages
- Measure time from display to auto-dismiss
- Verify timing is 3000ms ± 100ms

**Property 7: Toast stacking order**
- Generate random sequences of toasts
- Verify display order matches creation order
- Verify consistent spacing between toasts

**Property 8: Hover lift effect**
- Generate random hoverable elements
- Simulate hover state
- Verify translateY is negative and shadow increases

**Property 9: Mobile touch target size**
- Generate random interactive elements
- Set viewport to mobile width
- Verify computed dimensions ≥ 44px × 44px

**Property 10: Responsive layout transformation**
- Generate random layout components
- Test at viewport widths above and below 768px
- Verify column count changes appropriately

**Property 11: Font loading verification**
- Parse document head
- Verify Google Fonts link tags exist
- Verify font families include Space Grotesk and JetBrains Mono

**Property 12: Theme transition smoothness**
- Generate random theme toggles
- Measure transition duration
- Verify duration is 300ms ± 50ms

**Property 13: Existing functionality preservation**
- Generate random user actions (upload, caption, export)
- Execute in both old and new UI
- Verify outputs are equivalent

### Integration Tests

**Full User Flow**:
- Upload image → verify preview displays
- Generate captions → verify cards appear
- Select caption → verify text input updates
- Toggle theme → verify colors change
- Export image → verify download triggers

**Cross-Browser Testing**:
- Test in Chrome, Firefox, Safari
- Verify animations work consistently
- Verify fonts load correctly
- Verify theme persistence works

**Responsive Testing**:
- Test at mobile (375px), tablet (768px), desktop (1440px)
- Verify layouts adapt correctly
- Verify touch targets are adequate
- Verify text remains readable

## Implementation Notes

### CSS Custom Properties Strategy

Use CSS custom properties for all theme-dependent values:

```css
:root {
  --color-bg: #FAFAFA;
  --color-text: #0F0F0F;
  --color-accent-coral: #FF6B6B;
  --color-accent-turquoise: #4ECDC4;
  --color-accent-yellow: #FFE66D;
  --border-width: 4px;
  --shadow-offset: 8px;
  --transition-timing: cubic-bezier(0.34, 1.56, 0.64, 1);
}

[data-theme="dark"] {
  --color-bg: #0F0F0F;
  --color-text: #FAFAFA;
}
```

### Animation Performance Optimization

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (causes reflow)
- Use `will-change` only during active animations
- Remove `will-change` after animation completes

### Accessibility Considerations

- Maintain keyboard navigation for all interactive elements
- Ensure color contrast meets WCAG AA standards (4.5:1 for text)
- Provide `prefers-reduced-motion` support
- Use semantic HTML elements
- Include ARIA labels where needed

### Migration Strategy

1. Create new CSS modules without modifying existing styles
2. Import new modules in `styles.css`
3. Update `index.html` to include Google Fonts
4. Create new components (ThemeToggle, Toast, etc.)
5. Gradually update `App.tsx` to use new components
6. Test each component integration individually
7. Remove old styles once new system is fully integrated

### Browser Compatibility

- Target modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Use PostCSS autoprefixer for vendor prefixes
- Provide fallbacks for CSS custom properties (not needed for target browsers)
- Test on iOS Safari and Chrome Android

### Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1
- Animation frame rate: 60fps
- Bundle size increase: < 50KB (gzipped)
