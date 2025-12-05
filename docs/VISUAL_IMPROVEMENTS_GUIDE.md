# Agency UI Visual Improvements - Quick Reference

## Button Hierarchy Changes

### Before (No Clear Hierarchy)

All buttons looked similar - hard to know which action is primary:

```tsx
// All buttons with similar styling
<button className="btn">Generate Caption</button>
<button className="btn">Cancel</button>
<button className="btn">Archive</button>
```

### After (Clear Visual Hierarchy)

Primary action stands out, secondary and tertiary actions are appropriately subdued:

```tsx
// Primary action - Large, bold, blue with shadow
<button className="btn btn-primary">Generate Caption</button>

// Secondary action - Outlined, medium weight
<button className="btn btn-secondary">Cancel</button>

// Tertiary action - Subtle, gray text
<button className="btn btn-ghost">Archive</button>
```

**Visual Hierarchy Rules**:

1. Use ONE primary button per screen section
2. Primary buttons are 18px font, bold weight, with shadow
3. Secondary buttons are 16px font, outlined style
4. Ghost buttons are 14px font, transparent background

## Color Consistency

### Before (Inconsistent Colors)

```css
/* Workspace cards */
backgroundColor: #2563eb

/* Campaign headers */
backgroundColor: #FF6B6B

/* Action buttons */
backgroundColor: var(--color-primary)

/* Brand elements */
color: #7c8cff
```

### After (Unified Brand Colors)

```css
/* All primary actions and brand elements */
--color-brand-primary: #2563eb (Blue)

/* All success/approval actions */
--color-brand-success: #16a34a (Green)

/* All warnings */
--color-brand-warning: #f97316 (Orange)

/* All errors/destructive actions */
--color-brand-error: #dc2626 (Red)
```

## Typography Consistency

### Before (Mixed Fonts)

```css
/* Headers used different fonts */
font-family: 'Space Grotesk', sans-serif
font-family: 'JetBrains Mono', monospace
font-family: var(--font-heading)
font-family: sans-serif
```

### After (Consistent Typography)

```css
/* Headings, buttons, emphasis */
font-family: var(--font-heading) /* Inter, Space Grotesk */

/* Body text, labels, inputs */
font-family: var(--font-body) /* Inter */

/* Code, technical content */
font-family: var(--font-mono) /* JetBrains Mono */
```

## Branding

### Before (Inconsistent Branding)

```tsx
// Just text, no visual identity
<Link to='/agency/workspaces'>Caption Art</Link>
```

### After (Consistent Branded Logo)

```tsx
// Logo component with icon and gradient
<div
  style={{
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-xs) var(--space-md)',
  }}
>
  <Sparkles size={20} color='white' />
  <span
    style={{
      fontFamily: 'var(--font-heading)',
      fontSize: 'var(--font-size-xl)',
      fontWeight: 'var(--font-weight-bold)',
      color: 'white',
    }}
  >
    Caption Art
  </span>
</div>
```

## Card Components

### Before (Inconsistent Styling)

```tsx
<div
  style={{
    backgroundColor: 'var(--color-bg-secondary, white)',
    border: '1px solid var(--color-border, #e5e7eb)',
    borderRadius: '12px',
    padding: '1.5rem',
  }}
>
  {/* Card content */}
</div>
```

### After (Standardized Card Classes)

```tsx
<div className='card card-interactive'>
  <div className='card-header'>
    <div>
      <h3 className='card-title'>Workspace Name</h3>
      <p className='card-subtitle'>Industry</p>
    </div>
    <div className='card-icon'>🏢</div>
  </div>
  <div className='card-meta'>
    <span>5 campaigns</span>
    <span>Created Jan 1, 2024</span>
  </div>
</div>
```

## Page Headers

### Before (Inconsistent Headers)

```tsx
<div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '2rem',
  }}
>
  <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Workspaces</h1>
  <button>+ New Workspace</button>
</div>
```

### After (Standardized Page Headers)

```tsx
<div className='page-header'>
  <div>
    <h1 className='page-title'>Workspaces</h1>
    <p className='page-subtitle'>Manage your client workspaces and campaigns</p>
  </div>
  <button className='btn btn-primary'>+ New Workspace</button>
</div>
```

## Spacing

### Before (Arbitrary Values)

```css
padding: 24px;
margin: 16px;
gap: 12px;
padding: 1.5rem;
margin-bottom: 2rem;
```

### After (Consistent Spacing Scale)

```css
padding: var(--space-xl); /* 24px */
margin: var(--space-lg); /* 16px */
gap: var(--space-md); /* 12px */
padding: var(--space-xl); /* 24px */
margin-bottom: var(--space-2xl); /* 32px */
```

## Action Button Examples

### Campaign Creation

```tsx
// Primary action - most prominent
<button className="btn btn-primary">Create Campaign</button>

// Cancel - secondary
<button className="btn btn-secondary">Cancel</button>
```

### Creative Review

```tsx
// Approve - success button for positive action
<button className="btn btn-success">Approve Creative</button>

// Request Changes - secondary action
<button className="btn btn-secondary">Request Changes</button>

// Reject - danger button for destructive action
<button className="btn btn-danger">Reject</button>

// View Details - ghost button for navigation
<button className="btn btn-ghost">View Details</button>
```

### Workspace Management

```tsx
// Main action
<button className="btn btn-primary">+ New Workspace</button>

// Less common actions
<button className="btn btn-ghost">Reset</button>
<button className="btn btn-ghost">Archive</button>
```

## Usage Guidelines

### DO ✅

- Use ONE primary button per screen/section
- Use design tokens (CSS variables) for colors, spacing, fonts
- Use standardized button classes (.btn-primary, .btn-secondary, .btn-ghost)
- Apply consistent card structure across all listing screens
- Use page-header component for page titles
- Apply brand logo consistently in headers

### DON'T ❌

- Don't use multiple primary buttons in the same view
- Don't hard-code color values (#2563eb) - use variables
- Don't create custom button styles - use existing classes
- Don't mix different font families arbitrarily
- Don't use arbitrary spacing values - use spacing scale
- Don't omit logo or use different logo styles

## Migration Checklist

When updating a component to use the new design system:

- [ ] Replace hard-coded colors with design tokens
- [ ] Replace custom button styles with .btn-\* classes
- [ ] Update typography to use font size/weight variables
- [ ] Replace arbitrary spacing with spacing scale
- [ ] Apply card classes if component displays list items
- [ ] Ensure logo/branding is consistent
- [ ] Verify visual hierarchy (primary action stands out)
- [ ] Test in both light and dark themes
- [ ] Validate color contrast for accessibility

## Quick Token Reference

### Most Common Tokens

**Colors**

- `--color-brand-primary` - Blue (#2563eb)
- `--color-text` - Current theme text color
- `--color-text-secondary` - Subdued text
- `--color-border` - Borders and dividers
- `--color-surface` - Card backgrounds

**Spacing**

- `--space-sm` - 8px
- `--space-md` - 12px
- `--space-lg` - 16px
- `--space-xl` - 24px
- `--space-2xl` - 32px

**Typography**

- `--font-heading` - For titles and emphasis
- `--font-body` - For body text
- `--font-size-base` - 16px
- `--font-size-lg` - 18px (for buttons)
- `--font-size-xl` - 20px (for card titles)
- `--font-size-3xl` - 32px (for page titles)

**Border Radius**

- `--radius-md` - 8px (buttons)
- `--radius-lg` - 12px (cards)

## Examples in Context

### Workspace List Screen

```tsx
<div style={{ padding: 'var(--space-2xl)' }}>
  {/* Page Header */}
  <div className='page-header'>
    <div>
      <h1 className='page-title'>Workspaces</h1>
      <p className='page-subtitle'>Manage your client workspaces</p>
    </div>
    <button className='btn btn-primary'>+ New Workspace</button>
  </div>

  {/* Workspace Grid */}
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: 'var(--space-xl)',
    }}
  >
    {workspaces.map((workspace) => (
      <div key={workspace.id} className='card card-interactive'>
        <div className='card-header'>
          <div>
            <h3 className='card-title'>{workspace.name}</h3>
            <p className='card-subtitle'>{workspace.industry}</p>
          </div>
          <div className='card-icon'>🏢</div>
        </div>
        <div className='card-meta'>
          <span>{workspace.campaignCount} campaigns</span>
          <button className='btn btn-ghost btn-sm'>Reset</button>
        </div>
      </div>
    ))}
  </div>
</div>
```

### Campaign Review Screen

```tsx
<div
  className='review-actions'
  style={{
    display: 'flex',
    gap: 'var(--space-md)',
  }}
>
  {/* Primary action - Approve */}
  <button className='btn btn-success'>Approve Creative</button>

  {/* Secondary actions */}
  <button className='btn btn-secondary'>Request Changes</button>
  <button className='btn btn-ghost'>Save for Later</button>
</div>
```

## Support

For complete documentation, see:

- `frontend/DESIGN_SYSTEM.md` - Full design system guide
- `AGENCY_UI_IMPROVEMENTS.md` - Implementation summary
- `frontend/src/styles/design-system.css` - All design tokens
- `frontend/src/styles/components.css` - Component styles
