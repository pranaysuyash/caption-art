# Caption Art Agency UI Design System

This document describes the unified design system for the Caption Art agency-facing interface. It addresses usability issues related to visual consistency, branding, and visual hierarchy.

## Overview

The Caption Art design system focuses on **efficiency and clarity** for enterprise/agency users. It provides a consistent, professional interface that helps users complete tasks quickly and confidently.

## Core Principles

1. **Consistency**: Use the same colors, fonts, spacing, and components across all screens
2. **Clear Hierarchy**: Primary actions stand out; secondary actions are visible but subdued
3. **Professional Branding**: Consistent use of Caption Art brand elements throughout
4. **Efficiency**: Interface optimized for frequent use, not visual novelty

## Design Tokens

All design tokens are defined in `src/styles/design-system.css` and should be used via CSS variables.

### Colors

#### Brand Colors (Primary Palette)

- `--color-brand-primary`: #2563eb (Blue) - Primary actions, brand identity
- `--color-brand-secondary`: #4ECDC4 (Teal) - Secondary elements
- `--color-brand-accent`: #FFE66D (Yellow) - Highlights and accents
- `--color-brand-success`: #16a34a (Green) - Success states, approvals
- `--color-brand-warning`: #f97316 (Orange) - Warnings, review needed
- `--color-brand-error`: #dc2626 (Red) - Errors, destructive actions

#### Semantic Colors (Theme-aware)

- `--color-background`: Page background
- `--color-surface`: Card and panel backgrounds
- `--color-text`: Primary text color
- `--color-text-secondary`: Secondary text, labels
- `--color-border`: Borders and dividers

**Usage**: Always use brand colors for consistent UI. Theme colors adapt to light/dark modes.

### Typography

#### Font Families

- `--font-heading`: Inter, Space Grotesk, sans-serif (Headings, buttons, emphasis)
- `--font-body`: Inter, sans-serif (Body text, labels, inputs)
- `--font-mono`: JetBrains Mono, Fira Code (Code, technical content)

#### Font Sizes

- `--font-size-xs`: 0.75rem (12px) - Fine print, labels
- `--font-size-sm`: 0.875rem (14px) - Secondary text
- `--font-size-base`: 1rem (16px) - Body text
- `--font-size-lg`: 1.125rem (18px) - Large buttons, subheadings
- `--font-size-xl`: 1.25rem (20px) - Card titles
- `--font-size-2xl`: 1.5rem (24px) - Section headings
- `--font-size-3xl`: 2rem (32px) - Page titles

#### Font Weights

- `--font-weight-normal`: 400 - Body text
- `--font-weight-medium`: 500 - Labels, emphasized text
- `--font-weight-semibold`: 600 - Buttons, card titles
- `--font-weight-bold`: 700 - Page titles, primary actions

### Spacing

Use the spacing scale for consistent margins, padding, and gaps:

- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 12px
- `--space-lg`: 16px
- `--space-xl`: 24px
- `--space-2xl`: 32px
- `--space-3xl`: 48px

### Border Radius

- `--radius-sm`: 6px - Small elements, inputs
- `--radius-md`: 8px - Buttons, standard UI
- `--radius-lg`: 12px - Cards, panels
- `--radius-xl`: 16px - Large containers

### Shadows

- `--shadow-sm`: Subtle elevation
- `--shadow-md`: Standard cards
- `--shadow-lg`: Hover states
- `--shadow-xl`: Modals, overlays

## Components

### Button Hierarchy

**Purpose**: Establish clear visual priority for user actions.

#### `.btn-primary` - Primary Call-to-Action

- **Use for**: Main action on a page (e.g., "Generate Caption", "Create Workspace", "Save")
- **Style**: Large, bold, blue background with shadow
- **Limit**: Typically 1 per screen/section
- **Example**: "Generate Caption", "Approve", "Create Campaign"

```tsx
<button className='btn btn-primary'>Generate Caption</button>
```

#### `.btn-secondary` - Important Secondary Actions

- **Use for**: Important but not primary actions (e.g., "Cancel", "Edit")
- **Style**: White background with blue border, medium weight
- **Example**: "Edit Brief", "View Details"

```tsx
<button className='btn btn-secondary'>Edit Brief</button>
```

#### `.btn-ghost` - Tertiary/Subtle Actions

- **Use for**: Less important actions, navigation (e.g., "Archive", "Playground link")
- **Style**: Transparent, gray text, no border
- **Example**: "Archive Campaign", "Reset"

```tsx
<button className='btn btn-ghost'>Archive</button>
```

#### `.btn-success` - Positive Approval Actions

- **Use for**: Approval, acceptance actions
- **Style**: Green background
- **Example**: "Approve Creative", "Accept"

```tsx
<button className='btn btn-success'>Approve</button>
```

#### `.btn-danger` - Destructive Actions

- **Use for**: Delete, remove actions requiring caution
- **Style**: Red background
- **Example**: "Delete Workspace"

```tsx
<button className='btn btn-danger'>Delete</button>
```

### Cards

All workspace and campaign cards should use consistent styling:

```tsx
<div className='card card-interactive'>
  <div className='card-header'>
    <div>
      <h3 className='card-title'>Card Title</h3>
      <p className='card-subtitle'>Subtitle or category</p>
    </div>
    <div className='card-icon'>🏢</div>
  </div>
  <div className='card-meta'>
    <span>Meta information</span>
    <span>Date</span>
  </div>
</div>
```

### Page Layout

```tsx
<div style={{ padding: 'var(--space-2xl)' }}>
  <div className='page-header'>
    <div>
      <h1 className='page-title'>Page Title</h1>
      <p className='page-subtitle'>Brief description of page purpose</p>
    </div>
    <button className='btn btn-primary'>+ Primary Action</button>
  </div>
  {/* Page content */}
</div>
```

## Branding

### Logo

The Caption Art logo appears consistently in the header with:

- Sparkles icon (✨)
- "Caption Art" text in bold heading font
- Blue gradient background
- Located in top-left of header

### Colors

Brand colors are applied consistently:

- Primary actions: Blue (`--color-brand-primary`)
- Success states: Green (`--color-brand-success`)
- Warnings: Orange (`--color-brand-warning`)
- Errors: Red (`--color-brand-error`)

## Migration Guide

### Replacing Inline Styles

**Before** (inconsistent inline styles):

```tsx
<button
  style={{
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
  }}
>
  Save
</button>
```

**After** (using design system):

```tsx
<button className='btn btn-primary'>Save</button>
```

### Using Design Tokens

**Before** (hard-coded values):

```tsx
<div style={{ padding: '24px', marginBottom: '16px' }}>
```

**After** (using tokens):

```tsx
<div style={{
  padding: 'var(--space-xl)',
  marginBottom: 'var(--space-lg)'
}}>
```

## Quality Checklist

Use this checklist when implementing or reviewing UI:

- [ ] All buttons use appropriate class (`.btn-primary`, `.btn-secondary`, `.btn-ghost`)
- [ ] Primary action is clearly the most prominent button on screen
- [ ] Colors use design tokens (`--color-*`) not hard-coded hex values
- [ ] Typography uses font size and weight variables
- [ ] Spacing uses spacing scale variables
- [ ] Cards follow consistent structure with `.card` classes
- [ ] Logo appears consistently in header
- [ ] Brand colors applied to key UI elements
- [ ] Hover states are consistent and smooth
- [ ] No arbitrary color or font variations

## Resources

- Design tokens: `src/styles/design-system.css`
- Component styles: `src/styles/components.css`
- Tailwind config: `tailwind.config.js`
- Header component: `src/components/layout/AgencyHeader.tsx`

## Support

For questions about the design system, refer to this documentation or consult the Caption Art design team.
