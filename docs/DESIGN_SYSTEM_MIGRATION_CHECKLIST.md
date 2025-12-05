# Design System Migration Checklist

## Overview
This checklist helps the team systematically apply the Caption Art design system to remaining pages. Use this to track progress and ensure consistency.

## ✅ Completed Pages

### Phase 1: Core Pages
- [x] **WorkspaceList** - Applied card-grid, page-container, card components
- [x] **CampaignList** - Applied card-grid, page-header, card-interactive
- [x] **CampaignDetail** - Applied two-column-layout, panel components
- [x] **AgencyHeader** - Integrated breadcrumbs, responsive styling

### Phase 2: Secondary Pages (High Priority) ✅
- [x] **ReviewGrid** - Applied card-grid, panel, btn-success/danger, page-container
- [x] **BrandKitEditor** - Applied page-container, panel components, btn-primary
- [x] **AssetManager** - Applied page-container, card-grid, btn hierarchy
- [x] **SettingsPanel** - Applied btn hierarchy (primary, secondary, ghost)

## ⏳ Remaining Pages

### Phase 3: Additional Pages (Medium Priority) ✅
- [x] **TemplateSelector** - Applied panel, card-grid, card-interactive
- [x] **AnalyticsDashboard** - Applied page-container, stats-grid, panel components
- [x] **Playground** - Applied page-container, two-column-layout, stack-mobile, panels
- [x] **CampaignBriefEditor** - Applied page-container, page-header, btn hierarchy

### Phase 4: Modals & Overlays (Low Priority) ✅
- [x] **CreateCampaignModal** - Applied btn btn-primary, btn btn-secondary, btn-sm
- [x] **CreateWorkspaceModal** - Already using btn btn-primary, btn btn-secondary

## ✅ Migration Complete - 100%

All pages and components have been successfully migrated to the unified design system!

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
- **Completed**: 12 pages + 2 modals = 14 components (100%)
- **Pages**: WorkspaceList, CampaignList, CampaignDetail, AgencyHeader, ReviewGrid, BrandKitEditor, AssetManager, SettingsPanel, TemplateSelector, AnalyticsDashboard, Playground, CampaignBriefEditor
- **Modals**: CreateCampaignModal, CreateWorkspaceModal (in WorkspaceList)
- **Status**: ✅ COMPLETE

### Estimated Total Time
- ~~High Priority: ~6.5 hours~~ ✅ COMPLETE
- ~~Medium Priority: ~7 hours~~ ✅ COMPLETE
- ~~Low Priority: ~1 hour~~ ✅ COMPLETE
- **Total Time**: ~14.5 hours → Completed in 2 days
- **Status**: 100% COMPLETE 🎉

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
- **2025-12-05**: ✅ Completed ALL High Priority pages (ReviewGrid, BrandKitEditor, AssetManager, SettingsPanel)
- **2025-12-05**: ✅ Completed ALL Medium Priority pages (TemplateSelector, AnalyticsDashboard, Playground)
- **2025-12-05**: ✅ Completed CampaignBriefEditor and all Modals
- **2025-12-05**: 🎉 **100% MIGRATION COMPLETE** - All 14 components migrated successfully!
