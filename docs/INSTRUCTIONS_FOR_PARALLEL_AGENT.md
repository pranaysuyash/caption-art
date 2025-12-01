# Instructions for Parallel Agent

## Your Mission
Extract the neo-brutalism design system from the feature branch and create a modular CSS system for our React app.

## Step 1: Clone and Setup
```bash
# Clone the repository
git clone https://github.com/pranaysuyash/caption-art.git
cd caption-art

# Fetch all branches
git fetch origin

# Extract the styles from the feature branch
git show origin/claude/improve-frontend-design-01WncsG46Hk9c8WMmd7kY4Ab:styles.css > reference-styles.css
```

## Step 2: Create Design System Files

Create these 4 files in `frontend/src/styles/`:

### 1. `design-system.css` - Design Tokens
Extract and organize:
- CSS custom properties for colors (light + dark themes)
- Typography variables (Space Grotesk, JetBrains Mono)
- Spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px)
- Border widths (3px, 4px, 5px)
- Shadow definitions (4px, 8px, 12px offsets)
- Border radius values
- Transition timing functions

### 2. `components.css` - Component Styles
Extract and adapt:
- Button styles (primary, secondary, with hover lift)
- Card styles (neo-brutalism borders + offset shadows)
- Input/select styles
- Badge styles
- Upload zone styles
- Preview container styles
- Toast notification styles
- Navigation styles

### 3. `animations.css` - Animation Definitions
Extract:
- @keyframes for bounce, lift, fade, slide, shimmer
- Transition definitions
- Hover effects
- Loading animations
- Entry animations

### 4. `themes.css` - Theme System
Create:
- `.theme-light` class with light colors
- `.theme-dark` class with dark colors
- Smooth theme transition styles

## Step 3: Update Main Styles File

Update `frontend/src/styles.css` to import all modules:
```css
@import './styles/design-system.css';
@import './styles/themes.css';
@import './styles/components.css';
@import './styles/animations.css';
```

## Step 4: Add Google Fonts

Update `frontend/index.html` to include:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

## Key Design Principles to Maintain

### Neo-Brutalism Characteristics
- **Bold borders**: 3-5px solid borders
- **Offset shadows**: No blur, just offset (e.g., `8px 8px 0px`)
- **Vibrant colors**: High contrast (coral #FF6B6B, turquoise #4ECDC4, yellow #FFE66D)
- **Geometric shapes**: Sharp or slightly rounded corners
- **Flat design**: No gradients on borders/shadows

### Color Palette
**Light Theme:**
- Background: `#FEFAE0` (warm cream)
- Primary: `#FF6B6B` (coral)
- Secondary: `#4ECDC4` (turquoise)
- Accent: `#FFE66D` (yellow)
- Text: `#1A1A1A` (near black)

**Dark Theme:**
- Background: `#0F0F0F` (deep black)
- Surface: `#1A1A1A` (charcoal)
- Primary: `#FF6B6B` (same coral)
- Secondary: `#4ECDC4` (same turquoise)
- Accent: `#FFE66D` (same yellow)
- Text: `#FAFAFA` (near white)

### Animation Timing
- Fast: `0.15s`
- Base: `0.3s`
- Slow: `0.5s`
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` for smooth
- Easing: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` for bounce

### Hover Effects
- Lift: `translateY(-4px)` + increase shadow offset
- Bounce: Scale slightly with bounce easing
- Color: Brighten or shift hue slightly

## What NOT to Change
- Don't modify any `.tsx` files
- Don't modify any backend code
- Don't modify `package.json`
- Don't change the existing functionality

## Testing Your Work
After creating the CSS files:
```bash
cd frontend
npm run dev
```

The app should load with the new styles applied (though components won't use them fully until React integration).

## Commit and Push
```bash
git checkout -b feature/neo-brutalism-design-system
git add frontend/src/styles/
git add frontend/index.html
git commit -m "Add neo-brutalism design system with modular CSS"
git push origin feature/neo-brutalism-design-system
```

## Questions?
Refer to:
- `BRANCH_COMPARISON.md` for detailed comparison
- `PARALLEL_WORK_PLAN.md` for overall strategy
- `reference-styles.css` (the extracted CSS) for implementation details

## Success Criteria
✅ 4 CSS module files created
✅ All design tokens defined as CSS variables
✅ Both light and dark themes supported
✅ Animations defined and smooth
✅ Google Fonts added to HTML
✅ No TypeScript/React code modified
✅ Branch pushed successfully
