# Caption Art Visual Style Guide

Quick reference for maintaining consistent visual design across the application.

## Color Palette

### Brand Colors
```css
Primary Blue:   #3b82f6  /* Main brand color, primary actions */
Secondary:      #6366f1  /* Indigo for secondary elements */
```

### Semantic Colors
```css
Success:        #10b981  /* Green - success states, confirmations */
Warning:        #f59e0b  /* Amber - warnings, cautions */
Danger:         #ef4444  /* Red - errors, destructive actions */
Info:           #3b82f6  /* Blue - informational messages */
```

### Neutral Colors
```css
Text Primary:   #111827  /* Dark gray - main text */
Text Secondary: #6b7280  /* Medium gray - secondary text */
Text Tertiary:  #9ca3af  /* Light gray - disabled/muted */

Background:     #ffffff  /* White - main background */
Background Alt: #f9fafb  /* Off-white - secondary background */
Background Dim: #f3f4f6  /* Light gray - tertiary background */

Border:         #e5e7eb  /* Light gray - borders, dividers */
Border Focus:   #3b82f6  /* Blue - focused inputs */
```

### Usage Guidelines

**Primary Actions:**
- Use Primary Blue (#3b82f6)
- Large, prominent buttons
- Examples: "Save", "Create", "Submit"

**Secondary Actions:**
- Use Secondary (#6366f1) or outlined styles
- Medium-sized buttons
- Examples: "Cancel", "Go Back"

**Destructive Actions:**
- Use Danger Red (#ef4444)
- Requires confirmation dialog
- Examples: "Delete", "Remove", "Cancel Subscription"

**Success Feedback:**
- Use Success Green (#10b981)
- Confirmation messages, checkmarks
- Examples: "Saved successfully", approval indicators

## Typography

### Font Families
```css
Headings:  'Inter', system-ui, sans-serif
Body:      'Inter', system-ui, sans-serif
Code:      'Fira Code', 'Courier New', monospace
```

### Font Sizes

| Use Case             | Size    | Weight     | Line Height |
|---------------------|---------|------------|-------------|
| Page Title          | 32px    | Bold (700) | 1.2         |
| Section Heading     | 24px    | Semibold   | 1.3         |
| Card Title          | 18px    | Semibold   | 1.4         |
| Body Text           | 16px    | Regular    | 1.5         |
| Small Text          | 14px    | Regular    | 1.5         |
| Tiny Text (meta)    | 12px    | Regular    | 1.4         |

### Typography Hierarchy

**Page Title:**
```css
font-size: 32px;
font-weight: 700;
color: var(--color-text-primary);
margin-bottom: 8px;
```

**Section Heading:**
```css
font-size: 24px;
font-weight: 600;
color: var(--color-text-primary);
margin-bottom: 16px;
```

**Card Title:**
```css
font-size: 18px;
font-weight: 600;
color: var(--color-text-primary);
```

**Body Text:**
```css
font-size: 16px;
font-weight: 400;
color: var(--color-text-primary);
line-height: 1.5;
```

**Secondary Text:**
```css
font-size: 14px;
color: var(--color-text-secondary);
```

## Spacing System

Based on 4px unit:

| Token      | Value  | Common Uses                          |
|-----------|--------|--------------------------------------|
| --space-xs | 4px   | Icon padding, tight spacing          |
| --space-sm | 8px   | Input padding, small gaps            |
| --space-md | 12px  | Button padding, form field spacing   |
| --space-lg | 16px  | Card padding, list item spacing      |
| --space-xl | 24px  | Section spacing, card gaps           |
| --space-2xl| 32px  | Page margins, large section gaps     |
| --space-3xl| 48px  | Hero sections, major divisions       |

### Spacing Guidelines

**Card Padding:**
```css
padding: 24px; /* --space-xl */
```

**Section Margin:**
```css
margin-bottom: 32px; /* --space-2xl */
```

**Grid Gap:**
```css
gap: 24px; /* --space-xl */
```

**Button Padding:**
```css
padding: 12px 24px; /* --space-md --space-xl */
```

## Buttons

### Primary Button
```css
background: var(--color-brand-primary);
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
font-size: 16px;
border: none;
cursor: pointer;
transition: all 0.2s;
```

**Hover:**
```css
background: #2563eb; /* Darker blue */
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
```

### Secondary Button
```css
background: transparent;
color: var(--color-brand-primary);
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
font-size: 16px;
border: 2px solid var(--color-brand-primary);
cursor: pointer;
transition: all 0.2s;
```

**Hover:**
```css
background: rgba(59, 130, 246, 0.1);
```

### Ghost Button
```css
background: transparent;
color: var(--color-text-secondary);
padding: 8px 12px;
border-radius: 6px;
border: none;
cursor: pointer;
transition: all 0.2s;
```

**Hover:**
```css
background: var(--color-bg-dim);
color: var(--color-text-primary);
```

### Button Sizes

**Small:**
```css
padding: 8px 16px;
font-size: 14px;
```

**Default:**
```css
padding: 12px 24px;
font-size: 16px;
```

**Large:**
```css
padding: 16px 32px;
font-size: 18px;
```

## Cards

### Standard Card
```css
background: white;
border: 1px solid var(--color-border);
border-radius: 12px;
padding: 24px;
transition: all 0.2s;
```

**Hover:**
```css
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
border-color: var(--color-brand-primary);
transform: translateY(-2px);
```

### Card Structure

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
    <button class="btn-ghost">⋮</button>
  </div>
  <div class="card-content">
    Content goes here
  </div>
  <div class="card-footer">
    <button class="btn-secondary">Cancel</button>
    <button class="btn-primary">Save</button>
  </div>
</div>
```

## Shadows

| Level    | Use Case               | CSS                                    |
|---------|------------------------|----------------------------------------|
| None    | Flat surfaces          | `box-shadow: none;`                   |
| Small   | Cards, inputs          | `0 1px 3px rgba(0, 0, 0, 0.1)`       |
| Medium  | Dropdowns, tooltips    | `0 4px 16px rgba(0, 0, 0, 0.1)`      |
| Large   | Modals, popovers       | `0 10px 40px rgba(0, 0, 0, 0.15)`    |
| XLarge  | Emphasis, hero         | `0 20px 60px rgba(0, 0, 0, 0.2)`     |

## Border Radius

| Token         | Value | Common Uses                    |
|--------------|-------|--------------------------------|
| --radius-sm  | 4px   | Tags, badges                   |
| --radius-md  | 8px   | Buttons, inputs                |
| --radius-lg  | 12px  | Cards, panels                  |
| --radius-xl  | 16px  | Large containers               |
| --radius-full| 9999px| Avatars, pills                 |

## Icons

### Size Guidelines

| Context          | Size   | Lucide React       |
|-----------------|--------|-------------------|
| Button (small)   | 16px   | `size={16}`       |
| Button (default) | 18px   | `size={18}`       |
| Button (large)   | 20px   | `size={20}`       |
| Section heading  | 24px   | `size={24}`       |
| Page hero        | 48px   | `size={48}`       |
| Empty state      | 64px   | `size={64}`       |

### Icon Usage

**With Text:**
```tsx
<button>
  <Save size={18} />
  <span>Save Changes</span>
</button>
```

**Icon Only:**
```tsx
<button title="Settings">
  <Settings size={18} />
</button>
```

## Forms

### Input Fields
```css
input, textarea, select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input.error {
  border-color: var(--color-danger);
}
```

### Labels
```css
label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}
```

### Error Messages
```css
.error-message {
  color: var(--color-danger);
  font-size: 14px;
  margin-top: 4px;
}
```

### Helper Text
```css
.helper-text {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-top: 4px;
}
```

## Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1200px) {
  /* Desktop styles */
}
```

### Common Patterns

**3-Column Grid:**
```css
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Hide on Mobile:**
```css
.hide-mobile {
  display: none;
}

@media (min-width: 768px) {
  .hide-mobile {
    display: block;
  }
}
```

## States

### Loading
```css
.loading {
  opacity: 0.6;
  cursor: wait;
  pointer-events: none;
}
```

### Disabled
```css
.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Hover
```css
.interactive:hover {
  background: var(--color-bg-dim);
  cursor: pointer;
}
```

### Active
```css
.active {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-brand-primary);
  font-weight: 600;
}
```

### Focus
```css
.focusable:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

## Animations

### Transitions
```css
/* Standard transition */
transition: all 0.2s ease-in-out;

/* Multiple properties */
transition: 
  transform 0.2s ease-in-out,
  box-shadow 0.2s ease-in-out;
```

### Common Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
```

**Slide Up:**
```css
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}
```

**Spin (Loading):**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}
```

## Accessibility

### Color Contrast
- Text on white: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- All colors in this guide meet WCAG AA standards

### Focus Indicators
Always show focus states:
```css
:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}
```

### Touch Targets
Minimum size: 44x44px
```css
button, a {
  min-width: 44px;
  min-height: 44px;
}
```

## Common Components

### Tag/Badge
```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: var(--color-bg-dim);
  color: var(--color-text-secondary);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.tag.success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.tag.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}
```

### Avatar
```css
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-brand-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}
```

### Tooltip
```css
.tooltip {
  position: absolute;
  background: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

## Do's and Don'ts

### ✅ Do
- Use consistent spacing (multiples of 4px)
- Maintain clear visual hierarchy
- Provide hover states on interactive elements
- Use semantic colors (success = green, danger = red)
- Ensure sufficient color contrast
- Make touch targets 44x44px minimum
- Use loading states for async operations
- Provide clear error messages

### ❌ Don't
- Use random spacing values
- Mix multiple font families
- Skip hover states on clickable elements
- Use red for positive actions
- Place text on low-contrast backgrounds
- Make buttons too small on mobile
- Leave users waiting without feedback
- Show cryptic error codes

---

**This guide should be referenced when creating new components or modifying existing ones to maintain visual consistency across the Caption Art platform.**
