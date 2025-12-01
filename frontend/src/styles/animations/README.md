# Theme-Specific Animations

This directory contains theme-specific animation CSS files for the multi-theme system.

## Files

### Core Animation Files

- **neobrutalism.css** - Bold, energetic animations with bounce and lift effects
  - Bounce animations for button presses
  - Lift effects for hover states
  - Shake effects for errors
  - Pop-in and slide-bounce entry animations

- **glassmorphism.css** - Smooth, elegant animations with fade, scale, and blur effects
  - Fade in/out animations
  - Scale up/down effects
  - Blur transitions
  - Float and glow effects

- **minimalist.css** - Subtle, understated animations focused on fade effects
  - Minimal fade in/out
  - Subtle slide animations
  - Very short durations for quick, clean transitions

- **cyberpunk.css** - Futuristic animations with glitch, flicker, and scan line effects
  - Glitch effects with clip-path distortion
  - Neon flicker animations
  - Scan line overlays
  - RGB split effects
  - Hologram shimmer

### Integration Files

- **theme-animations.css** - Central import file that:
  - Imports all theme-specific animation files
  - Implements reduced motion override (Requirements: 14.5)
  - Provides theme-animations-loading utility class

- **theme-animations.test.ts** - Test suite verifying:
  - All animation classes are available
  - Theme-specific animations work correctly
  - Reduced motion support is implemented
  - Interactive animations apply correctly

## Usage

### Applying Theme Animations

Animations are automatically applied based on the `data-theme` attribute on the root element:

```html
<html data-theme="neobrutalism">
  <!-- Neo-brutalism animations will be active -->
</html>
```

### Animation Classes

Each theme provides utility classes for manual animation application:

**Neo-brutalism:**
- `.neobrutalism-animate-bounce`
- `.neobrutalism-animate-lift`
- `.neobrutalism-animate-shake`
- `.neobrutalism-animate-pop-in`
- `.neobrutalism-animate-slide-bounce`

**Glassmorphism:**
- `.glassmorphism-animate-fade-in`
- `.glassmorphism-animate-fade-out`
- `.glassmorphism-animate-scale-up`
- `.glassmorphism-animate-scale-down`
- `.glassmorphism-animate-blur-in`
- `.glassmorphism-animate-blur-out`
- `.glassmorphism-animate-float`
- `.glassmorphism-animate-glow`

**Minimalist:**
- `.minimalist-animate-fade-in`
- `.minimalist-animate-fade-out`
- `.minimalist-animate-slide-in`
- `.minimalist-animate-slide-out`

**Cyberpunk:**
- `.cyberpunk-animate-glitch`
- `.cyberpunk-animate-flicker`
- `.cyberpunk-animate-scan-line`
- `.cyberpunk-animate-neon-pulse`
- `.cyberpunk-animate-digital-fade-in`
- `.cyberpunk-animate-rgb-split`
- `.cyberpunk-animate-hologram`

### Automatic Interactive Animations

Buttons and cards automatically receive theme-appropriate animations on hover and active states:

```css
[data-theme="neobrutalism"] .button:hover {
  /* Automatically applies lift animation */
}

[data-theme="glassmorphism"] .card:hover {
  /* Automatically applies scale-up animation */
}
```

### Entry Animations

Use `.theme-enter` class for elements that should animate when they appear:

```html
<div class="theme-enter">
  <!-- Will animate based on active theme -->
</div>
```

### Reduced Motion Support

All animations are automatically disabled when the user has `prefers-reduced-motion: reduce` set:

```css
@media (prefers-reduced-motion: reduce) {
  /* All theme animations are disabled */
}
```

### Loading State

Prevent animations during initial page load:

```html
<html class="theme-animations-loading">
  <!-- Animations are disabled -->
</html>
```

Remove the class after the theme is loaded to enable animations.

## Requirements Validation

- ✅ **14.1** - Neo-brutalism animations (bounce, lift, shake)
- ✅ **14.2** - Glassmorphism animations (fade, scale, blur)
- ✅ **14.3** - Minimalist animations (subtle fade)
- ✅ **14.4** - Cyberpunk animations (glitch, flicker, scan lines)
- ✅ **14.5** - Reduced motion override for accessibility

## Testing

Run the test suite:

```bash
npm test styles/animations/theme-animations.test.ts
```

All 18 tests should pass, verifying:
- Animation classes are available
- Theme-specific selectors work
- Reduced motion support is implemented
- Interactive animations apply correctly
