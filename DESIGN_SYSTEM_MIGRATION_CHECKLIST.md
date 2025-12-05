# Design System Migration Checklist

## Visual Improvements Implementation Plan

### Phase 1: Core Design System (✅ COMPLETED)
- [x] Create design-system.css with CSS variables
- [x] Define consistent color palette
- [x] Establish typography system  
- [x] Set standard spacing units
- [x] Create component styles (buttons, inputs, cards)

### Phase 2: Navigation Improvements (✅ COMPLETED)
- [x] Implement Breadcrumbs component
- [x] Add breadcrumbs to WorkspaceList
- [x] Add breadcrumbs to CampaignList
- [x] Add breadcrumbs to CampaignDetail
- [x] Add breadcrumbs to Settings pages

### Phase 3: Account Settings (✅ COMPLETED)
- [x] Organization Settings page
- [x] User Management with roles
- [x] Billing & Subscription management
- [x] Audit Logs with filtering
- [x] Integrations Settings
- [x] Security Settings
- [x] Brand Kit Settings

### Phase 4: Visual Consistency (🔄 IN PROGRESS)
#### Button Standardization
- [ ] Audit all buttons for consistent sizing (40px height)
- [ ] Ensure primary actions use `btn-primary` class
- [ ] Ensure secondary actions use `btn-secondary` class
- [ ] Place card action buttons consistently (top-right corner)
- [ ] Add hover states to all interactive elements

#### Card Layout Standardization  
- [ ] All cards use consistent padding (1.5rem)
- [ ] All cards use consistent border-radius (12px)
- [ ] Card headers have consistent structure
- [ ] Card actions placed in same location
- [ ] Grid layouts use consistent gaps (1.5rem)

#### Typography Consistency
- [ ] Page titles use `page-title` class (2rem, bold)
- [ ] Section headings use `section-title` class (1.5rem, semibold)
- [ ] Body text uses consistent line-height (1.6)
- [ ] All text uses design system colors

### Phase 5: Responsive Design (⏳ TODO)
#### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px  
- Desktop: > 1024px

#### Tasks
- [ ] Test all pages on mobile viewport
- [ ] Convert tables to stacked lists on mobile
- [ ] Make navigation responsive (hamburger menu)
- [ ] Adjust card grids for smaller screens
- [ ] Test form layouts on mobile
- [ ] Add horizontal scroll indicators for wide tables

### Phase 6: Workflow Improvements (⏳ TODO)
#### Multi-Step Processes
- [ ] Add stepper component for workflows
- [ ] Implement "Save & Continue Later" in campaign creation
- [ ] Add "Back" buttons in multi-step flows
- [ ] Show progress indicators
- [ ] Allow skipping optional steps

#### Error Handling
- [ ] Consistent error message styling
- [ ] Toast notifications for success/error
- [ ] Inline validation messages
- [ ] Loading states for all async operations
- [ ] Empty states with helpful guidance

### Phase 7: Accessibility (⏳ TODO)
- [ ] All interactive elements keyboard accessible
- [ ] Proper ARIA labels on complex components
- [ ] Focus indicators visible and consistent
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader friendly

### Phase 8: Performance (⏳ TODO)
- [ ] Lazy load heavy components
- [ ] Optimize images and assets
- [ ] Add loading skeletons
- [ ] Implement virtual scrolling for long lists
- [ ] Cache API responses appropriately

## Implementation Guidelines

### Button Hierarchy
```tsx
// Primary action (one per page/section)
<button className="btn btn-primary">Create Campaign</button>

// Secondary actions  
<button className="btn btn-secondary">Cancel</button>

// Tertiary actions (minimal styling)
<button className="btn btn-tertiary">View Details</button>

// Danger actions
<button className="btn btn-danger">Delete</button>
```

### Card Structure
```tsx
<div className="card">
  <div className="card-header">
    <div className="card-title">Title</div>
    <div className="card-actions">
      <button className="btn btn-primary">Action</button>
    </div>
  </div>
  <div className="card-body">
    {/* Content */}
  </div>
</div>
```

### Grid Layouts
```tsx
// 3-column grid
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1.5rem'
}}>
  {/* Cards */}
</div>
```

### Spacing Scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

## Testing Checklist

### Visual Testing
- [ ] All pages use consistent fonts
- [ ] All pages use design system colors
- [ ] Buttons have consistent sizes
- [ ] Cards have consistent styling
- [ ] Spacing is uniform throughout

### Functional Testing
- [ ] All forms submit correctly
- [ ] Navigation works on all pages
- [ ] Breadcrumbs update correctly
- [ ] Modals open and close properly
- [ ] Settings can be saved

### Responsive Testing
- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPad (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Test on ultrawide (2560px+ width)
- [ ] No horizontal scroll on mobile

### Accessibility Testing
- [ ] Tab through entire page
- [ ] Test with screen reader
- [ ] Check color contrast ratios
- [ ] Verify all images have alt text
- [ ] Test with keyboard only

## Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Documentation
- [ ] Update README with design system info
- [ ] Document component usage patterns
- [ ] Create style guide page
- [ ] Add code examples
- [ ] Document breakpoints and responsive behavior

## Priority Order
1. **High Priority** (blocking release)
   - Visual consistency (buttons, cards)
   - Breadcrumb navigation
   - Basic responsive design

2. **Medium Priority** (nice to have)
   - Workflow improvements
   - Advanced responsive features
   - Empty states and loading indicators

3. **Low Priority** (future enhancement)
   - Micro-interactions
   - Advanced animations
   - Performance optimizations

## Success Metrics
- Zero visual inconsistencies across pages
- 100% of pages have breadcrumbs
- All pages responsive on mobile/tablet
- No console errors
- All settings features functional
- Loading time < 2s for all pages
