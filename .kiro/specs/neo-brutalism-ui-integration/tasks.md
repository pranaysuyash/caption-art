# Implementation Plan - Neo-Brutalism UI Integration

- [x] 1. Set up design system foundation
- [x] 1.1 Create CSS modules structure
  - Create `frontend/src/styles/design-system.css` with CSS custom properties
  - Create `frontend/src/styles/components.css` for component styles
  - Create `frontend/src/styles/animations.css` for keyframe definitions
  - Create `frontend/src/styles/themes.css` for light/dark themes
  - Update `frontend/src/styles.css` to import all modules
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.2 Add Google Fonts to index.html
  - Add link tags for Space Grotesk and JetBrains Mono
  - Configure font-display: swap for performance
  - _Requirements: 1.4_

- [x] 1.3 Write property test for font loading
  - **Property 11: Font loading verification**
  - **Validates: Requirements 1.4**

- [x] 2. Implement design tokens and variables
- [x] 2.1 Define color palette variables
  - Define light theme colors (background, text, accents)
  - Define dark theme colors (deep black background, vibrant accents)
  - Define coral (#FF6B6B), turquoise (#4ECDC4), yellow (#FFE66D) accents
  - _Requirements: 1.2, 3.5_

- [x] 2.2 Define typography variables
  - Set Space Grotesk for headings
  - Set JetBrains Mono for monospace
  - Define font size scale
  - _Requirements: 1.4_

- [x] 2.3 Define spacing and layout variables
  - Define spacing scale (4px, 8px, 12px, 16px, 24px, 32px)
  - Define border widths (3px, 4px, 5px)
  - Define shadow offsets (4px, 8px, 12px)
  - _Requirements: 1.1, 1.3_

- [x] 2.4 Define animation timing functions
  - Define cubic-bezier easing functions
  - Define transition durations (0.3s for theme, 0.2s for interactions)
  - _Requirements: 1.5, 3.4_

- [x] 2.5 Write property test for border consistency
  - **Property 2: Border consistency**
  - **Validates: Requirements 1.1**

- [x] 2.6 Write property test for color palette compliance
  - **Property 3: Color palette compliance**
  - **Validates: Requirements 1.2**

- [x] 2.7 Write property test for shadow offset presence
  - **Property 4: Shadow offset presence**
  - **Validates: Requirements 1.3**

- [x] 2.8 Write property test for animation timing consistency
  - **Property 5: Animation timing consistency**
  - **Validates: Requirements 1.5**

- [x] 3. Create component styles
- [x] 3.1 Style buttons with neo-brutalism aesthetic
  - Apply 3-5px borders
  - Apply offset shadows
  - Define hover lift effect (translateY negative, increased shadow)
  - Define click bounce animation
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [x] 3.2 Style cards with neo-brutalism aesthetic
  - Apply 3-5px borders
  - Apply offset shadows (4-12px)
  - Define hover lift effect
  - _Requirements: 1.1, 1.3, 5.1, 5.2_

- [x] 3.3 Style inputs and selects
  - Apply borders and focus states
  - Use vibrant accent colors for focus
  - _Requirements: 1.1, 1.2_

- [x] 3.4 Style badges
  - Apply neo-brutalism styling
  - Use accent colors
  - _Requirements: 1.1, 1.2_

- [x] 3.5 Style toast notifications
  - Apply neo-brutalism card styling
  - Define slide-in animation from right
  - Define stacking behavior
  - _Requirements: 6.1, 6.5_

- [x] 3.6 Write property test for hover lift effect
  - **Property 8: Hover lift effect**
  - **Validates: Requirements 2.1**

- [x] 4. Implement animations
- [x] 4.1 Create keyframe animations
  - Define bounce animation for button clicks
  - Define lift effect for hovers
  - Define fade-in/fade-out animations
  - Define slide-in animation for toasts
  - Define typewriter effect for captions
  - Define staggered entry animations
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 4.2, 4.4, 4.5, 5.3, 5.5, 6.1_

- [x] 4.2 Create loading animations
  - Define rainbow gradient progress bar
  - Define shimmer effect for skeleton loaders
  - _Requirements: 2.3, 5.4_

- [x] 4.3 Create transition utilities
  - Define smooth color transitions for theme changes
  - Define transform transitions for interactions
  - _Requirements: 1.5, 3.4_

- [x] 5. Implement theme system
- [x] 5.1 Create useTheme hook
  - Implement theme state management
  - Implement toggleTheme function
  - Implement localStorage persistence
  - Implement system preference detection
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5.2 Create ThemeToggle component
  - Create button with sun/moon icon
  - Connect to useTheme hook
  - Apply neo-brutalism styling
  - _Requirements: 3.1_

- [x] 5.3 Implement theme application
  - Apply data-theme attribute to document root
  - Ensure CSS variables update on theme change
  - _Requirements: 3.1, 3.5_

- [x] 5.4 Write property test for theme persistence round-trip
  - **Property 1: Theme persistence round-trip**
  - **Validates: Requirements 3.2, 3.3**

- [x] 5.5 Write property test for theme transition smoothness
  - **Property 12: Theme transition smoothness**
  - **Validates: Requirements 3.4**

- [x] 6. Create Toast notification system
- [x] 6.1 Create Toast component
  - Implement toast display with neo-brutalism styling
  - Implement slide-in animation from right
  - Implement auto-dismiss after 3 seconds
  - Implement manual dismiss on click
  - _Requirements: 6.1, 6.4_

- [x] 6.2 Create ToastContainer component
  - Implement vertical stacking with proper spacing
  - Implement toast queue management
  - _Requirements: 6.5_

- [x] 6.3 Create useToast hook
  - Implement addToast function
  - Implement removeToast function
  - Implement toast state management
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6.4 Write property test for toast auto-dismiss timing
  - **Property 6: Toast auto-dismiss timing**
  - **Validates: Requirements 6.4**

- [x] 6.5 Write property test for toast stacking order
  - **Property 7: Toast stacking order**
  - **Validates: Requirements 6.5**

- [x] 7. Create UploadZone component
- [ ] 7.1 Implement drag-and-drop functionality
  - Handle dragover event with highlight
  - Handle drop event with file processing
  - Apply neo-brutalism styling
  - _Requirements: 4.1, 4.2_

- [ ] 7.2 Implement upload states
  - Show loading indicator during processing
  - Show preview with zoom-in animation after upload
  - Show remove button with fade-out animation
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 7.3 Integrate with existing upload logic
  - Connect to existing onFile handler
  - Maintain AWS S3 upload functionality
  - _Requirements: 7.1_

- [x] 8. Create CaptionGrid component
- [x] 8.1 Implement grid layout
  - Create responsive grid with neo-brutalism cards
  - Apply hover lift effects to cards
  - Apply click bounce animation
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8.2 Implement loading states
  - Create skeleton loaders with shimmer effects
  - Apply staggered entry animations when captions appear
  - _Requirements: 5.4, 5.5_

- [x] 8.3 Integrate with existing caption logic
  - Connect to existing caption state
  - Connect to existing onSelect handler
  - Maintain caption generation functionality
  - _Requirements: 7.2_

- [x] 9. Update App.tsx with new components
- [x] 9.1 Integrate ThemeToggle
  - Add ThemeToggle to header
  - Ensure theme persists across sessions
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 9.2 Integrate Toast system
  - Add ToastContainer to app root
  - Add toast notifications for user actions (copy, export, errors)
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 9.3 Replace upload input with UploadZone
  - Replace file input with UploadZone component
  - Maintain existing upload functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9.4 Replace caption display with CaptionGrid
  - Replace caption buttons with CaptionGrid component
  - Maintain existing caption selection functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9.5 Write property test for existing functionality preservation
  - **Property 13: Existing functionality preservation**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 10. Implement responsive design
- [x] 10.1 Add mobile breakpoints
  - Define 768px breakpoint for mobile/desktop
  - Apply mobile-optimized layouts below 768px
  - _Requirements: 8.1_

- [x] 10.2 Ensure touch target sizes
  - Ensure all interactive elements are at least 44px on mobile
  - _Requirements: 8.2_

- [x] 10.3 Implement responsive layouts
  - Use flexbox and grid for fluid layouts
  - Stack cards vertically on mobile
  - Display multi-column layouts on desktop
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 10.4 Write property test for mobile touch target size
  - **Property 9: Mobile touch target size**
  - **Validates: Requirements 8.2**

- [x] 10.5 Write property test for responsive layout transformation
  - **Property 10: Responsive layout transformation**
  - **Validates: Requirements 8.4**

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Polish and accessibility
- [x] 12.1 Add prefers-reduced-motion support
  - Disable animations for users who prefer reduced motion
  - Provide instant transitions as fallback
  - _Requirements: 1.5_

- [x] 12.2 Ensure keyboard navigation
  - Test all interactive elements with keyboard
  - Ensure focus states are visible
  - _Requirements: All interactive elements_

- [x] 12.3 Verify color contrast
  - Ensure WCAG AA compliance (4.5:1 for text)
  - Test in both light and dark themes
  - _Requirements: 1.2, 3.5_

- [x] 12.4 Add ARIA labels where needed
  - Add labels for icon-only buttons
  - Add labels for loading states
  - _Requirements: All interactive elements_

- [x] 13. Refactor components to use CSS classes
- [x] 13.1 Update Toast component to use CSS classes
  - Remove inline styles from Toast.tsx
  - Apply .toast, .toast-success, .toast-error, .toast-info classes
  - Use .toast-container for positioning
  - _Requirements: 9.1, 9.5_

- [x] 13.2 Update App.tsx to use CSS classes
  - Replace inline styles with .button, .input, .badge classes
  - Apply .container and .row layout classes
  - Use design system spacing variables
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 13.3 Update all component files to use CSS classes
  - Review CaptionGenerator, MaskGenerator, Toolbar, etc.
  - Replace inline styles with design system classes
  - Ensure consistent neo-brutalism styling
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 13.4 Add missing button variants
  - Ensure all buttons use .button-primary, .button-secondary, or .button-accent
  - Apply hover and active states consistently
  - _Requirements: 9.2_

- [x] 14. Final testing and cleanup
- [x] 14.1 Test in multiple browsers
  - Test in Chrome, Firefox, Safari
  - Verify animations work consistently
  - Verify fonts load correctly
  - _Requirements: All_

- [x] 14.2 Test responsive behavior
  - Test at mobile (375px), tablet (768px), desktop (1440px)
  - Verify layouts adapt correctly
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 14.3 Performance optimization
  - Verify First Contentful Paint < 1.5s
  - Verify Time to Interactive < 3s
  - Verify 60fps animations
  - _Requirements: All_

- [x] 14.4 Remove old styles
  - Remove unused CSS from old implementation
  - Clean up commented code
  - _Requirements: All_

- [ ] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
