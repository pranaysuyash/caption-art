# Design System Migration Checklist

## Overview
This checklist helps the team systematically apply the Caption Art design system to remaining pages. Use this to track progress and ensure consistency.

## ✅ Completed Pages

### Phase 1: Core Pages
- [x] **WorkspaceList** - Applied card-grid, page-container, card components
- [x] **CampaignList** - Applied card-grid, page-header, card-interactive
- [x] **CampaignDetail** - Applied two-column-layout, panel components
- [x] **AgencyHeader** - Integrated breadcrumbs, responsive styling

## ⏳ Remaining Pages

### Phase 2: Secondary Pages (High Priority)

#### Brand Kit Editor
- [ ] Apply `.page-container` for consistent padding
- [ ] Use `.panel` components for color picker sections
- [ ] Apply `.panel-section` for logical grouping
- [ ] Use design token colors instead of hard-coded values
- [ ] Test responsive behavior on mobile/tablet

**Estimated Time**: 2 hours
**Files to Update**: 
- `frontend/src/components/BrandKitEditor.tsx`

#### Asset Manager
- [ ] Replace inline grid with `.card-grid`
- [ ] Apply `.card` and `.card-icon` to asset items
- [ ] Use `.card-actions-top-right` for action buttons
- [ ] Add `.responsive-table-wrapper` for asset list view
- [ ] Test upload flow on mobile

**Estimated Time**: 1.5 hours
**Files to Update**:
- `frontend/src/components/AssetManager.tsx`
- `frontend/src/components/AssetUploader.tsx`

#### Review Grid
- [ ] Apply `.card-grid` for caption variations display
- [ ] Use `.panel` for approval summary
- [ ] Apply `.btn-success` for Approve buttons
- [ ] Apply `.btn-danger` for Reject buttons
- [ ] Use `.stats-grid` for review statistics
- [ ] Test on mobile (ensure cards stack properly)

**Estimated Time**: 2 hours
**Files to Update**:
- `frontend/src/components/agency/ReviewGrid.tsx`

#### Settings Pages
- [ ] Use `.panel` for settings sections
- [ ] Apply `.panel-header` and `.panel-title`
- [ ] Use `.two-column-layout` for settings content
- [ ] Apply button hierarchy (primary for Save, secondary for Cancel)
- [ ] Test form inputs on mobile

**Estimated Time**: 1 hour
**Files to Update**:
- `frontend/src/components/Settings.tsx`
- `frontend/src/components/UserSettings.tsx`

### Phase 3: Additional Pages (Medium Priority)

#### Campaign Brief Editor
- [ ] Use `.panel` components for brief sections
- [ ] Apply `WorkflowProgress` component for multi-step flow
- [ ] Use `.two-column-layout` for side-by-side fields
- [ ] Apply proper button hierarchy
- [ ] Add Save & Continue Later functionality

**Estimated Time**: 2.5 hours
**Files to Update**:
- `frontend/src/components/CampaignBriefEditor.tsx`

#### Template Selector
- [ ] Apply `.card-grid` for template display
- [ ] Use `.card-interactive` for template cards
- [ ] Add proper hover states (already in .card class)
- [ ] Use `.btn-primary` for Select Template button

**Estimated Time**: 1 hour
**Files to Update**:
- `frontend/src/components/TemplateSelector.tsx`

#### Analytics Dashboard
- [ ] Use `.stats-grid` for KPI cards
- [ ] Apply `.stat-card`, `.stat-value`, `.stat-change` classes
- [ ] Use `.panel` for chart sections
- [ ] Apply `.three-column-layout` for dashboard widgets
- [ ] Ensure mobile responsiveness (charts should scale)

**Estimated Time**: 2 hours
**Files to Update**:
- `frontend/src/components/AnalyticsDashboard.tsx`

#### Playground
- [ ] Apply `.page-container` wrapper
- [ ] Use `.panel` for playground sections
- [ ] Apply `.two-column-layout` for preview/controls
- [ ] Use `.stack-mobile` for mobile stacking
- [ ] Test all interactive features on mobile

**Estimated Time**: 1.5 hours
**Files to Update**:
- `frontend/src/pages/Playground.tsx`

### Phase 4: Modals & Overlays (Low Priority)

#### Create Campaign Modal
- [ ] Apply `.panel` styling
- [ ] Use proper button hierarchy
- [ ] Add `WorkflowProgress` if multi-step
- [ ] Test keyboard navigation

**Estimated Time**: 30 minutes
**Files to Update**:
- `frontend/src/components/CreateCampaignModal.tsx`

#### Create Workspace Modal
- [ ] Apply consistent form styling
- [ ] Use button hierarchy
- [ ] Test responsive behavior

**Estimated Time**: 30 minutes
**Files to Update**:
- `frontend/src/components/CreateWorkspaceModal.tsx`

## Migration Steps (For Each Page)

### 1. Preparation (5 minutes)
- [ ] Open the page file in your editor
- [ ] Review current inline styles
- [ ] Identify grid/layout patterns
- [ ] Check for custom button styles

### 2. Layout Migration (15-30 minutes)
- [ ] Replace page wrapper padding with `.page-container`
- [ ] Replace page header with `.page-header`, `.page-title`, `.page-subtitle`
- [ ] Replace inline grids with `.card-grid` or `.two-column-layout`
- [ ] Replace panel wrappers with `.panel` and `.panel-header`

### 3. Component Migration (20-40 minutes)
- [ ] Replace card styling with `.card`, `.card-header`, `.card-title`, etc.
- [ ] Replace button classes with proper hierarchy (`.btn-primary`, etc.)
- [ ] Apply `.card-meta` for card metadata
- [ ] Use `.card-actions` for consistent button placement

### 4. Responsive Check (10-15 minutes)
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1280px width)
- [ ] Verify no horizontal scrolling on mobile
- [ ] Check touch targets are 44px minimum

### 5. Cleanup (5 minutes)
- [ ] Remove unused inline styles
- [ ] Remove redundant style objects
- [ ] Format code
- [ ] Run linter

### 6. Testing (10 minutes)
- [ ] Test all interactive features
- [ ] Verify navigation works
- [ ] Test keyboard navigation
- [ ] Check accessibility (color contrast, focus states)

## Quick Reference: Class Replacements

### Page Structure
```tsx
// Before
<div style={{ padding: '2rem' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
    <h1 style={{ fontSize: '2rem' }}>Title</h1>
    <button>Action</button>
  </div>
</div>

// After
<div className="page-container">
  <div className="page-header">
    <div>
      <h1 className="page-title">Title</h1>
      <p className="page-subtitle">Description</p>
    </div>
    <button className="btn btn-primary">Action</button>
  </div>
</div>
```

### Grid Layouts
```tsx
// Before
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '1.5rem'
}}>

// After
<div className="card-grid">
```

### Cards
```tsx
// Before
<div style={{
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.5rem'
}}>

// After
<div className="card card-interactive">
  <div className="card-header">
    <div>
      <h3 className="card-title">Title</h3>
      <p className="card-subtitle">Subtitle</p>
    </div>
    <div className="card-icon">🏢</div>
  </div>
  <div className="card-meta">
    <span>Info</span>
    <span>Date</span>
  </div>
</div>
```

### Panels
```tsx
// Before
<div style={{
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '2rem'
}}>
  <h3>Section Title</h3>
  {/* Content */}
</div>

// After
<div className="panel">
  <div className="panel-header">
    <h3 className="panel-title">Section Title</h3>
  </div>
  <div className="panel-section">
    {/* Content */}
  </div>
</div>
```

### Buttons
```tsx
// Before
<button style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 16px' }}>
  Save
</button>

// After
<button className="btn btn-primary">Save</button>
<button className="btn btn-secondary">Cancel</button>
<button className="btn btn-ghost">Reset</button>
<button className="btn btn-success">Approve</button>
<button className="btn btn-danger">Delete</button>
```

## Testing Checklist

### Responsive Testing
- [ ] Mobile portrait (375px)
- [ ] Mobile landscape (667px)
- [ ] Tablet (768px)
- [ ] Desktop (1280px)
- [ ] Large desktop (1920px)

### Functionality Testing
- [ ] All buttons work
- [ ] Forms submit properly
- [ ] Navigation works
- [ ] Modals open/close
- [ ] Data loads correctly

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatible
- [ ] Touch targets are 44px minimum

## Resources

### Documentation
- **Design System Guide**: `frontend/DESIGN_SYSTEM.md`
- **Visual Guide**: `VISUAL_IMPROVEMENTS_GUIDE.md`
- **Layout Guide**: `LAYOUT_RESPONSIVENESS_IMPROVEMENTS.md`

### Component Examples
- **WorkspaceList.tsx**: Grid layout, cards
- **CampaignList.tsx**: Card grid, filters
- **CampaignDetail.tsx**: Two-column layout, panels
- **AgencyHeader.tsx**: Breadcrumbs, responsive header

### Design Tokens
- Colors: `frontend/src/styles/design-system.css`
- Components: `frontend/src/styles/components.css`
- Breakpoints: Defined in design-system.css

## Progress Tracking

### Summary
- **Completed**: 4 pages (WorkspaceList, CampaignList, CampaignDetail, AgencyHeader)
- **High Priority Remaining**: 4 pages (Brand Kit, Assets, Review, Settings)
- **Medium Priority**: 4 pages (Brief, Templates, Analytics, Playground)
- **Low Priority**: 2 modals (Create Campaign, Create Workspace)

### Estimated Total Time
- High Priority: ~6.5 hours
- Medium Priority: ~7 hours
- Low Priority: ~1 hour
- **Total**: ~14.5 hours

### Recommended Schedule
- **Week 1**: High priority pages (2-3 pages)
- **Week 2**: Remaining high priority + start medium priority
- **Week 3**: Complete medium priority + low priority items
- **Week 4**: Testing, polish, and documentation updates

## Support

### Getting Help
1. Check documentation first (DESIGN_SYSTEM.md)
2. Look at completed examples (WorkspaceList.tsx)
3. Review this checklist
4. Ask team for guidance

### Common Issues

**Issue**: Grid not responsive on mobile
**Solution**: Use `.card-grid` class instead of inline grid

**Issue**: Buttons look the same
**Solution**: Apply proper hierarchy (.btn-primary, .btn-secondary, .btn-ghost)

**Issue**: Cards don't align
**Solution**: Ensure all cards use `.card` class and are in `.card-grid`

**Issue**: Too much horizontal scrolling on mobile
**Solution**: Use `.page-container` and remove fixed widths

**Issue**: Content looks cramped
**Solution**: Use `.panel` with `.panel-section` for proper spacing

## Notes

- Always test on real devices, not just browser DevTools
- Use design tokens (CSS variables) instead of hard-coded values
- Keep accessibility in mind (keyboard nav, contrast, focus states)
- Maintain consistency with existing completed pages
- Update this checklist as you complete pages
- Commit changes incrementally (one page at a time)

## Updates

- **2025-12-04**: Initial checklist created
- **2025-12-04**: Completed WorkspaceList, CampaignList, CampaignDetail, AgencyHeader
