# Implementation Plan

## Overview

This plan restructures the app from a vertical-stacking layout (3,561px tall) to a sidebar-based layout where canvas and controls are simultaneously visible, eliminating the scrolling disaster.

**Estimated Time:**
- Sequential: ~18 hours
- Parallelized (Tasks 1-3): ~12 hours

**Key Decisions:**
- **MaskGenerator Positioning:** Hidden component in CanvasArea (Task 4.2)
- **ThemeToggle Location:** Separate from Toolbar in AppLayout header (Task 5)
- **CaptionGenerator Height:** Limit to 3 visible captions with "Show More" button (Task 3.3)

**Parallelization Opportunity:**
Tasks 1, 2, and 3 have no dependencies and can be done simultaneously to save ~6 hours.

- [x] 1. Create core layout components and hooks
  - **Can be done in parallel with Tasks 2 and 3**
  - Create AppLayout component with grid structure for toolbar, sidebar, and canvas positioning
  - Create Sidebar component with section rendering and progressive disclosure
  - Create CanvasArea component for canvas and related UI elements
  - Create useLayoutState hook for sidebar collapse and layout mode management
  - Create useMediaQuery hook for responsive breakpoint detection
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 8.1, 8.2, 8.3, 9.1, 9.2_

- [x] 1.1 Write property test for simultaneous visibility
  - **Property 1: Simultaneous Visibility**
  - **Test:** Given any control in sidebar, assert canvas is within viewport
  - **Test:** Given canvas visible, assert all sidebar sections within scrollable area
  - **Test:** Measure distance between control and canvas (must be < viewport height)
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 1.2 Write property test for sidebar independence
  - **Property 2: Sidebar Independence**
  - **Validates: Requirements 2.5**

- [x] 1.3 Write property test for responsive layout adaptation
  - **Property 6: Responsive Layout Adaptation**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 2. Create CSS for layout grid and responsive behavior
  - **Can be done in parallel with Tasks 1 and 3**
  - Create AppLayout.css with grid structure for desktop, tablet, and mobile layouts
  - Create Sidebar.css with scrolling behavior and section styling
  - Create CanvasArea.css with canvas sizing and positioning
  - Implement responsive breakpoints at 768px and 1024px using CSS Grid
  - Add smooth transitions for sidebar toggle and layout changes
  - _Requirements: 5.1, 5.2, 5.3, 8.5, 12.2, 12.3_

- [x] 2.1 Write property test for canvas dimension stability
  - **Property 8: Canvas Dimension Stability**
  - **Validates: Requirements 6.4**

- [x] 3. Implement progressive disclosure logic
  - **Can be done in parallel with Tasks 1 and 2**
  - Add visibility flags for sidebar sections based on application state
  - Hide Upload section controls when image is uploaded
  - Show Captions and Text sections only when image exists
  - Show Style and Transform sections only when image and text exist
  - Show before/after slider only when styled result exists
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.3 Optimize CaptionGenerator for sidebar
  - Limit visible captions to 3 by default in sidebar
  - Add "Show More" button to reveal all 5 captions
  - Ensure CaptionGenerator doesn't break sidebar scrolling
  - Test with max-height constraints
  - _Requirements: 2.4, 2.5_

- [x] 3.1 Write property test for progressive disclosure consistency
  - **Property 4: Progressive Disclosure Consistency**
  - **Validates: Requirements 4.1**

- [x] 3.2 Write property test for progressive disclosure expansion
  - **Property 5: Progressive Disclosure Expansion**
  - **Validates: Requirements 4.2**

- [x] 4. Refactor App.tsx to use new layout components
  - **Requires Tasks 1, 2, and 3 to be complete**
  - Replace vertical stack structure with AppLayout component
  - Move existing components into Sidebar sections with proper visibility logic
  - Update state management to use useLayoutState hook
  - Position canvas and OutputPreview in CanvasArea component
  - Remove old container div and vertical stack CSS
  - Update/remove marginTop inline styles (no longer needed)
  - Ensure all existing functionality continues to work
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 6.1, 6.6_

- [x] 4.1 Write integration test for layout restructure
  - Test upload image → sidebar sections appear progressively
  - Test enter text → style and transform sections appear
  - Test toggle sidebar → canvas area resizes smoothly
  - Test resize viewport → layout adapts to correct mode
  - Test MaskGenerator remains functional but hidden
  - Test mask generation still triggers on image upload
  - _Requirements: 1.1, 2.1, 4.1, 4.2, 5.1, 5.2, 5.3_

- [x] 4.2 Position MaskGenerator component
  - Keep MaskGenerator as hidden component in CanvasArea
  - Ensure autoGenerate still triggers on imageDataUrl change
  - Verify onMaskGenerated callback still fires
  - Add display: none CSS to prevent layout shift
  - _Requirements: 1.1, 6.1_

- [x] 5. Implement fixed toolbar with global actions
  - Position Toolbar component at top of AppLayout with fixed positioning
  - Ensure toolbar remains visible during sidebar and canvas scrolling
  - DECISION: Keep ThemeToggle separate from Toolbar (recommended approach)
  - Position ThemeToggle in AppLayout header area alongside title
  - Include undo/redo and export buttons in Toolbar component
  - Adapt toolbar layout for mobile viewport (< 768px)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.1 Write property test for toolbar persistence
  - **Property 3: Toolbar Persistence**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 6. Add keyboard shortcuts for layout control
  - Implement Ctrl+B (Cmd+B on Mac) to toggle sidebar visibility
  - Implement F key to toggle fullscreen mode for canvas
  - Ensure toolbar remains accessible in fullscreen mode
  - Restore previous sidebar state when exiting fullscreen
  - _Requirements: 3.6, 3.7, 3.8, 3.9_

- [x] 6.1 Write property test for keyboard shortcut consistency
  - **Property 9: Keyboard Shortcut Consistency**
  - **Validates: Requirements 3.6**

- [x] 7. Implement state persistence to localStorage
  - Save sidebar collapsed state to localStorage on toggle
  - Save fullscreen mode state to localStorage
  - Restore layout preferences on page load
  - Handle localStorage unavailable gracefully
  - _Requirements: 9.5_

- [x] 7.1 Write property test for sidebar collapse state persistence
  - **Property 7: Sidebar Collapse State Persistence**
  - **Validates: Requirements 9.5**

- [x] 8. Position before/after slider near canvas
  - Move OutputPreview component into CanvasArea
  - Position slider within 200px of canvas element
  - Place slider in right panel on desktop (1024px+)
  - Place slider below canvas on tablet and mobile
  - Ensure canvas remains visible when interacting with slider
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.1 Write property test for before/after proximity
  - **Property 10: Before/After Proximity**
  - **Validates: Requirements 7.1**

- [x] 9. Add loading states and error handling
  - Display loading skeleton in CanvasArea during image upload
  - Show progress indicator in Sidebar during mask generation
  - Display spinner with status text during caption generation
  - Add smooth transitions when operations complete
  - Show error messages near relevant controls
  - Handle specific error cases:
    - Image upload fails → Show error in Upload section
    - Mask generation fails → Show error in Canvas area
    - Caption generation fails → Show error in Captions section
    - API timeout → Show retry button with error message
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 9.1 Write unit tests for loading states
  - Test loading skeleton appears during upload
  - Test progress indicator shows during mask generation
  - Test spinner displays during caption generation
  - Test error messages appear near controls
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 10. Implement accessibility features
  - Add ARIA labels for all layout regions (toolbar, sidebar, canvas)
  - Ensure logical tab order: Toolbar → Sidebar → Canvas
  - Move focus to next control when sidebar collapses
  - Add aria-live regions to announce layout changes
  - Test with screen readers
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 10.1 Write accessibility tests
  - Test all interactive elements are keyboard accessible
  - Test tab order follows logical flow
  - Test ARIA labels are present on all regions
  - Test focus management when sidebar collapses
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 11. Optimize performance and animations
  - Ensure First Contentful Paint < 1 second
  - Optimize sidebar toggle animation to complete in < 300ms
  - Maintain 60fps during canvas updates and transitions
  - Debounce resize events with 300ms delay
  - Implement lazy loading for large canvas images
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 11.1 Write performance tests
  - Measure FCP with layout components
  - Measure sidebar toggle animation duration
  - Measure layout shift (CLS) during progressive disclosure
  - Measure resize event handling performance
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 11.2 Add visual regression tests
  - Capture screenshots of layout at 320px, 768px, 1024px, 1920px widths
  - Test sidebar collapsed/expanded states
  - Test with/without image, with/without text
  - Compare against baseline screenshots
  - Use Playwright for visual diffing
  - _Requirements: 5.1, 5.2, 5.3, 6.1_

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
