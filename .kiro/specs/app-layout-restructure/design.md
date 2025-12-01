# Design Document: App Layout Restructure

## Overview

This design transforms the Caption Art application from a vertical-stacking layout (3,561px tall) to a modern sidebar-based layout where canvas and controls are simultaneously visible. The current implementation forces users to scroll ~13,000px for a single edit session. The new architecture eliminates this by placing controls in a scrollable sidebar adjacent to a fixed canvas area, with a sticky toolbar at the top.

**Key Design Goals:**
- Zero scrolling required to see canvas + controls simultaneously
- Progressive disclosure: show only relevant controls for current workflow state
- Responsive: adapt to desktop (1024px+), tablet (768-1023px), and mobile (<768px)
- Modular: clean component separation with clear interfaces
- Performant: <1s FCP, 60fps animations, smooth transitions

## Architecture

### Component Hierarchy

```
App
├── AppLayout
│   ├── Toolbar (fixed header)
│   │   ├── Title
│   │   ├── ThemeToggle
│   │   ├── Undo/Redo buttons
│   │   └── Export button
│   ├── Sidebar (scrollable)
│   │   ├── SidebarSection: Upload
│   │   │   └── UploadZone
│   │   ├── SidebarSection: Captions (conditional)
│   │   │   └── CaptionGenerator
│   │   ├── SidebarSection: Text (conditional)
│   │   │   ├── Text input
│   │   │   └── Font size slider
│   │   ├── SidebarSection: Style (conditional)
│   │   │   └── StylePresetSelector
│   │   └── SidebarSection: Transform (conditional)
│   │       └── TransformControls
│   └── CanvasArea (scrollable)
│       ├── Canvas element
│       ├── MaskGenerator (hidden)
│       ├── MaskPreview (conditional)
│       ├── OutputPreview (conditional)
│       └── LoadingOverlay (conditional)
└── ToastContainer (portal)
```

### Layout Grid Structure

**Desktop (1024px+):**
```
┌─────────────────────────────────────────────┐
│ Toolbar (fixed, 60px height)               │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │      Canvas Area                 │
│ (320px)  │      (flex: 1)                   │
│          │                                  │
│ scroll↕  │      scroll↕                     │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Tablet (768-1023px):**
```
┌─────────────────────────────────────────────┐
│ Toolbar (fixed, 60px height)               │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │      Canvas Area                 │
│ (280px)  │      (flex: 1)                   │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Mobile (<768px):**
```
┌─────────────────────────────────────────────┐
│ Toolbar (fixed, 60px) + Toggle Button      │
├─────────────────────────────────────────────┤
│ Sidebar (collapsible, max-height: 40vh)    │
│ scroll↕                                     │
├─────────────────────────────────────────────┤
│                                             │
│      Canvas Area                            │
│      (flex: 1)                              │
│                                             │
└─────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AppLayout Component

**Purpose:** Top-level layout container managing the grid structure and responsive behavior.

**Props Interface:**
```typescript
interface AppLayoutProps {
  toolbar: ReactNode
  sidebar: ReactNode
  canvas: ReactNode
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  layoutMode?: 'desktop' | 'tablet' | 'mobile'
}
```

**Responsibilities:**
- Render fixed toolbar at top
- Position sidebar and canvas in grid layout
- Handle responsive breakpoints via CSS Grid
- Manage sidebar collapse state
- Provide keyboard shortcuts (Ctrl+B, F)

**State Management:**
- `sidebarCollapsed: boolean` - controlled by parent (App.tsx)
- `layoutMode` - derived from viewport width via `useMediaQuery` hook

### 2. Sidebar Component

**Purpose:** Scrollable container for control sections with progressive disclosure.

**Props Interface:**
```typescript
interface SidebarSection {
  id: string
  title: string
  content: ReactNode
  visible?: boolean
  loading?: boolean
}

interface SidebarProps {
  sections: SidebarSection[]
  className?: string
}
```

**Responsibilities:**
- Render visible sections only
- Provide section titles with consistent styling
- Handle internal scrolling
- Display loading states per section
- Maintain scroll position during updates

**Progressive Disclosure Logic:**
```typescript
const sections = [
  { id: 'upload', title: 'Upload', visible: true },
  { id: 'captions', title: 'Captions', visible: !!originalImage },
  { id: 'text', title: 'Text', visible: !!originalImage },
  { id: 'style', title: 'Style', visible: !!originalImage && !!text },
  { id: 'transform', title: 'Transform', visible: !!originalImage && !!text },
]
```

### 3. CanvasArea Component

**Purpose:** Container for canvas element and related UI (before/after, mask preview).

**Props Interface:**
```typescript
interface CanvasAreaProps {
  canvas: ReactNode
  beforeAfter?: ReactNode
  maskPreview?: ReactNode
  showBeforeAfter?: boolean
  showMaskPreview?: boolean
  loading?: boolean
  loadingMessage?: string
  className?: string
}
```

**Responsibilities:**
- Render canvas element with proper sizing
- Position before/after slider below canvas
- Show/hide mask preview toggle
- Display loading overlay for operations >2s
- Handle canvas zoom controls (future)
- Show export progress (future)

### 4. useLayoutState Hook

**Purpose:** Centralized state management for layout preferences and responsive behavior.

**Interface:**
```typescript
interface LayoutState {
  sidebarCollapsed: boolean
  layoutMode: 'desktop' | 'tablet' | 'mobile'
  fullscreenMode: boolean
}

interface UseLayoutStateReturn {
  state: LayoutState
  toggleSidebar: () => void
  toggleFullscreen: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

function useLayoutState(): UseLayoutStateReturn
```

**Responsibilities:**
- Manage sidebar collapse state
- Detect viewport width changes
- Persist preferences to localStorage
- Provide keyboard shortcut handlers
- Emit layout change events for analytics

**LocalStorage Keys:**
```typescript
const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'caption-art:sidebar-collapsed',
  FULLSCREEN_MODE: 'caption-art:fullscreen-mode',
}
```

### 5. useMediaQuery Hook

**Purpose:** Detect responsive breakpoints and return current layout mode.

**Interface:**
```typescript
type LayoutMode = 'desktop' | 'tablet' | 'mobile'

function useMediaQuery(): LayoutMode
```

**Breakpoints:**
```typescript
const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
}

// Returns:
// 'mobile' when width < 768px
// 'tablet' when width >= 768px && width < 1024px
// 'desktop' when width >= 1024px
```

**Implementation:**
- Use `window.matchMedia()` for efficient media query matching
- Debounce resize events (300ms) to prevent jank
- Clean up listeners on unmount

## Data Models

### Layout State

```typescript
interface LayoutState {
  sidebarCollapsed: boolean
  layoutMode: 'desktop' | 'tablet' | 'mobile'
  fullscreenMode: boolean
  sidebarWidth: number // 320px desktop, 280px tablet
}
```

### Sidebar Section

```typescript
interface SidebarSection {
  id: string // Unique identifier
  title: string // Display title
  content: ReactNode // Section content
  visible?: boolean // Progressive disclosure flag
  loading?: boolean // Loading state
  error?: string // Error message
}
```

### Canvas Dimensions

```typescript
interface CanvasDimensions {
  width: number
  height: number
  aspectRatio: number
  scale: number // For zoom functionality
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Simultaneous Visibility

*For any* viewport with height >= 768px, when the application renders with an uploaded image, both the canvas and at least one control section should be visible without scrolling.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Sidebar Independence

*For any* scroll position within the Sidebar, the Canvas Area scroll position should remain unchanged, and vice versa.

**Validates: Requirements 2.5**

### Property 3: Toolbar Persistence

*For any* scroll position in Sidebar or Canvas Area, the Toolbar should remain fixed at the top of the viewport.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Progressive Disclosure Consistency

*For any* application state, if no image is uploaded, then only the Upload section should be visible in the Sidebar.

**Validates: Requirements 4.1**

### Property 5: Progressive Disclosure Expansion

*For any* application state, if an image is uploaded but no text is entered, then Upload, Captions, and Text sections should be visible, but Style and Transform sections should be hidden.

**Validates: Requirements 4.2**

### Property 6: Responsive Layout Adaptation

*For any* viewport width change that crosses a breakpoint (768px or 1024px), the layout mode should update and the grid structure should adapt accordingly.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Sidebar Collapse State Persistence

*For any* sidebar toggle action, the new collapsed state should be persisted to localStorage and restored on next page load.

**Validates: Requirements 9.5**

### Property 8: Canvas Dimension Stability

*For any* canvas content update (text change, style change, transform change), the canvas dimensions should remain stable without causing layout shift.

**Validates: Requirements 6.4**

### Property 9: Keyboard Shortcut Consistency

*For any* keyboard event matching Ctrl+B (or Cmd+B), the sidebar collapsed state should toggle.

**Validates: Requirements 3.6**

### Property 10: Before/After Proximity

*For any* application state where a styled result exists, the before/after slider should be positioned within 200px of the canvas element.

**Validates: Requirements 7.1**

## Error Handling

### Layout Rendering Errors

**Scenario:** Component fails to render due to invalid props or state.

**Handling:**
- Wrap layout components in Error Boundaries
- Display fallback UI with error message
- Log error to console and analytics
- Provide "Reset Layout" button to restore defaults

### Responsive Breakpoint Detection Failures

**Scenario:** `matchMedia` not supported or fails.

**Handling:**
- Fall back to default desktop layout
- Use viewport width from `window.innerWidth`
- Log warning to console
- Gracefully degrade without breaking functionality

### LocalStorage Persistence Failures

**Scenario:** localStorage unavailable or quota exceeded.

**Handling:**
- Continue with in-memory state only
- Log warning to console
- Don't block user interaction
- Show toast notification: "Layout preferences won't be saved"

### Keyboard Shortcut Conflicts

**Scenario:** Browser or OS shortcuts conflict with app shortcuts.

**Handling:**
- Check `event.defaultPrevented` before handling
- Allow user to disable shortcuts in settings (future)
- Document shortcuts in help modal
- Use `event.preventDefault()` only when handling

## Testing Strategy

### Unit Tests

**AppLayout Component:**
- Renders toolbar, sidebar, and canvas in correct positions
- Applies correct grid structure based on layoutMode prop
- Handles sidebar collapse/expand correctly
- Calls onToggleSidebar when Ctrl+B pressed

**Sidebar Component:**
- Renders only visible sections
- Applies correct section titles
- Handles empty sections array
- Displays loading states correctly

**CanvasArea Component:**
- Renders canvas element
- Shows/hides before/after slider based on prop
- Displays loading overlay when loading=true
- Positions elements correctly

**useLayoutState Hook:**
- Returns correct initial state
- Toggles sidebar collapsed state
- Persists state to localStorage
- Restores state from localStorage on mount

**useMediaQuery Hook:**
- Returns 'mobile' when width < 768px
- Returns 'tablet' when width 768-1023px
- Returns 'desktop' when width >= 1024px
- Updates on window resize
- Debounces resize events

### Integration Tests

**Layout Restructure Integration:**
- Upload image → sidebar sections appear progressively
- Enter text → style and transform sections appear
- Toggle sidebar → canvas area resizes smoothly
- Resize viewport → layout adapts to correct mode
- Refresh page → sidebar state persists

**Keyboard Shortcuts:**
- Press Ctrl+B → sidebar toggles
- Press F → fullscreen mode toggles
- In fullscreen → toolbar still accessible

**Responsive Behavior:**
- Resize from desktop → tablet → mobile
- Verify grid structure changes at breakpoints
- Verify sidebar collapses on mobile
- Verify canvas area adapts width

### Property-Based Tests

Property-based tests will use `fast-check` library with minimum 100 iterations per property.

**Property 1: Simultaneous Visibility**
```typescript
// Generate: viewport dimensions >= 768px, random image state
// Test: canvas and controls both visible without scrolling
```

**Property 2: Sidebar Independence**
```typescript
// Generate: random scroll positions for sidebar and canvas
// Test: scrolling one doesn't affect the other
```

**Property 7: Sidebar Collapse State Persistence**
```typescript
// Generate: random sequence of toggle actions
// Test: final state matches localStorage value
```

### Visual Regression Tests

- Screenshot comparison at 1920x1080 (desktop)
- Screenshot comparison at 768x1024 (tablet)
- Screenshot comparison at 375x667 (mobile)
- Before/after layout restructure comparison

### Performance Tests

- Measure FCP with layout components
- Measure sidebar toggle animation duration
- Measure layout shift (CLS) during progressive disclosure
- Measure resize event handling performance

## Implementation Notes

### CSS Grid vs Flexbox

**Decision:** Use CSS Grid for AppLayout, Flexbox for internal component layout.

**Rationale:**
- Grid provides clean 2D layout for sidebar + canvas
- Grid handles responsive breakpoints elegantly
- Flexbox better for 1D layouts within components
- Avoid media query duplication by using grid-template-areas

### Animation Performance

**Sidebar Toggle Animation:**
```css
.app-layout__sidebar {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}
```

**Why `transform` instead of `width`:**
- `transform` uses GPU acceleration
- Doesn't trigger layout recalculation
- Maintains 60fps on low-end devices
- Prevents canvas area jank

### Progressive Disclosure Implementation

**Approach:** Conditional rendering based on state flags.

```typescript
const showTextControls = !!originalImage
const showStyleControls = !!originalImage && !!text
const showTransformControls = !!originalImage && !!text
const showBeforeAfter = !!originalImage && !!text && canvasRef.current
```

**Why not CSS `display: none`:**
- Reduces DOM nodes when hidden
- Prevents unnecessary re-renders
- Improves performance
- Cleaner component tree in DevTools

### Accessibility Considerations

**ARIA Labels:**
```tsx
<div className="app-layout" role="application" aria-label="Caption Art Editor">
  <header role="banner" aria-label="Toolbar">...</header>
  <aside role="complementary" aria-label="Control Panel">...</aside>
  <main role="main" aria-label="Canvas Area">...</main>
</div>
```

**Keyboard Navigation:**
- Tab order: Toolbar → Sidebar → Canvas
- Skip links for screen readers
- Focus management when sidebar collapses
- Announce layout changes via aria-live regions

**Focus Trap in Fullscreen:**
- When fullscreen active, trap focus within canvas area
- Escape key exits fullscreen
- Toolbar remains accessible via Tab

### LocalStorage Schema

```typescript
interface StoredLayoutPreferences {
  version: number // Schema version for migrations
  sidebarCollapsed: boolean
  fullscreenMode: boolean
  timestamp: number // Last updated
}

const STORAGE_KEY = 'caption-art:layout-preferences'
const SCHEMA_VERSION = 1
```

### Migration Strategy

**Phase 1: Create New Components (No Breaking Changes)**
- Create AppLayout, Sidebar, CanvasArea components
- Create useLayoutState, useMediaQuery hooks
- Add unit tests for new components
- No changes to App.tsx yet

**Phase 2: Refactor App.tsx (Breaking Changes)**
- Replace vertical stack with AppLayout
- Move components into Sidebar sections
- Update state management to use useLayoutState
- Add progressive disclosure logic
- Update integration tests

**Phase 3: Polish & Optimization**
- Add keyboard shortcuts
- Implement fullscreen mode
- Add loading states
- Performance optimization
- Accessibility audit

## Dependencies

**New Dependencies:** None required.

**Existing Dependencies Used:**
- React 18+ (hooks, concurrent features)
- TypeScript (type safety)
- CSS Grid (layout)
- localStorage API (persistence)
- matchMedia API (responsive detection)

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1s | Lighthouse |
| Sidebar Toggle Animation | < 300ms | Performance API |
| Layout Shift (CLS) | < 0.1 | Web Vitals |
| Resize Event Handling | Debounced 300ms | Custom timing |
| Canvas Update Frame Rate | 60fps | requestAnimationFrame |

## Rollout Plan

### Phase 1: Core Layout (Priority: P0)
- Create AppLayout component
- Create Sidebar component
- Create CanvasArea component
- Create useLayoutState hook
- Create useMediaQuery hook
- Add CSS for grid layout
- Unit tests for all components

**Estimated Time:** 8 hours

### Phase 2: App.tsx Refactor (Priority: P0)
- Refactor App.tsx to use AppLayout
- Implement progressive disclosure
- Move components into Sidebar sections
- Update state management
- Integration tests

**Estimated Time:** 4 hours

### Phase 3: Keyboard & Accessibility (Priority: P1)
- Implement Ctrl+B shortcut
- Implement F fullscreen mode
- Add ARIA labels
- Add focus management
- Accessibility tests

**Estimated Time:** 3 hours

### Phase 4: Polish & Optimization (Priority: P2)
- Add loading states
- Optimize animations
- Performance testing
- Visual regression tests
- Documentation

**Estimated Time:** 3 hours

**Total Estimated Time:** 18 hours

## Future Enhancements

### Canvas Zoom Controls (Requirement 6.8)
- Add zoom in/out buttons
- Implement pinch-to-zoom on touch devices
- Show zoom percentage indicator
- Reset zoom button

### Layer Indicators (Requirement 6.9)
- Display text layer count
- Show active layer highlight
- Layer reordering UI
- Layer visibility toggles

### Export Progress (Requirement 6.10)
- Progress bar during export
- Estimated time remaining
- Cancel export button
- Export history

### Sidebar Resize
- Draggable sidebar edge
- Min/max width constraints
- Persist width to localStorage
- Smooth resize animation

### Layout Presets
- Save custom layouts
- Quick layout switcher
- Import/export layouts
- Reset to default button
