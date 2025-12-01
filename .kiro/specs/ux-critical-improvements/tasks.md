# Implementation Plan

- [ ] 1. Implement Enhanced Error Handling System
  - [ ] 1.1 Create ErrorManager class
    - Implement error context tracking with operation ID, timestamp, retry count
    - Implement error message generation with specific, actionable descriptions
    - Implement retry eligibility checking
    - Implement recovery action generation based on error type
    - Implement error logging for debugging
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 1.2 Write property test for error message specificity
    - **Property 1: Error messages are specific and actionable**
    - **Validates: Requirements 1.1, 3.1**
  
  - [ ] 1.3 Create ErrorToast component
    - Implement toast UI with title, description, and action buttons
    - Implement auto-dismiss for non-critical errors (10 seconds)
    - Implement persistent display for critical errors
    - Implement action button handlers
    - Position at top-right of viewport
    - _Requirements: 1.1, 1.2, 3.1, 3.3_
  
  - [ ]* 1.4 Write property test for retry functionality
    - **Property 2: Retry functionality for failed operations**
    - **Validates: Requirements 1.2, 3.3**
  
  - [ ] 1.5 Implement error type detection
    - Detect network failures using navigator.onLine
    - Detect API rate limits (429 status codes)
    - Detect timeout errors
    - Detect API-specific errors from response
    - _Requirements: 1.5, 1.6_
  
  - [ ] 1.6 Implement error prioritization
    - Create severity ranking system (critical > error > warning > info)
    - Implement error queue with priority sorting
    - Display errors in priority order
    - _Requirements: 3.5_
  
  - [ ]* 1.7 Write property test for error prioritization
    - **Property 10: Error prioritization in display**
    - **Validates: Requirements 3.5**
  
  - [ ] 1.8 Implement error dismissal with logging
    - Clear error from UI on dismiss
    - Log dismissed errors to console
    - Maintain error history for debugging
    - _Requirements: 3.6_
  
  - [ ]* 1.9 Write property test for error dismissal
    - **Property 11: Error dismissal clears UI**
    - **Validates: Requirements 3.6**

- [ ] 2. Implement Progress Feedback System
  - [ ] 2.1 Create ProgressTracker class
    - Implement progress state management (idle, running, success, error)
    - Implement progress percentage tracking (0-100)
    - Implement time estimation algorithm based on progress rate
    - Implement cancellation support
    - _Requirements: 1.3, 6.1, 6.2, 6.3, 6.4, 6.6_
  
  - [ ]* 2.2 Write property test for progress indicators
    - **Property 3: Progress indicators during operations**
    - **Validates: Requirements 1.3, 6.1**
  
  - [ ] 2.3 Create ProgressIndicator component
    - Display operation name and status
    - Display progress bar with percentage
    - Display estimated time remaining
    - Display cancel button for cancellable operations
    - Implement smooth progress animations
    - _Requirements: 1.3, 1.4, 6.1, 6.3, 6.4, 6.6_
  
  - [ ]* 2.4 Write property test for sequential operation tracking
    - **Property 17: Sequential operation progress tracking**
    - **Validates: Requirements 6.2**
  
  - [ ]* 2.5 Write property test for measurable progress display
    - **Property 18: Measurable progress display**
    - **Validates: Requirements 6.3**
  
  - [ ]* 2.6 Write property test for time estimation
    - **Property 19: Time estimation display**
    - **Validates: Requirements 6.4**
  
  - [ ]* 2.7 Write property test for completion feedback
    - **Property 20: Operation completion feedback**
    - **Validates: Requirements 6.5**
  
  - [ ]* 2.8 Write property test for cancel button presence
    - **Property 21: Cancellable operations have cancel button**
    - **Validates: Requirements 6.6**

- [ ] 3. Enhance Caption Generation with Error Handling
  - [ ] 3.1 Integrate ErrorManager with caption generation
    - Wrap API calls with try-catch and error handling
    - Generate specific error messages for different failure types
    - Implement retry logic with exponential backoff
    - Implement 3-retry limit with alternative actions
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7_
  
  - [ ] 3.2 Integrate ProgressTracker with caption generation
    - Start progress tracking when generation begins
    - Update progress during API call
    - Show estimated time for operations > 5 seconds
    - Complete or fail progress on result
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 3.3 Write property test for recoverable error actions
    - **Property 8: Recoverable errors provide recovery actions**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ]* 3.4 Write property test for non-recoverable error alternatives
    - **Property 9: Non-recoverable errors suggest alternatives**
    - **Validates: Requirements 3.4**

- [ ] 4. Implement Click-to-Apply Caption Workflow
  - [ ] 4.1 Create CaptionSelector component
    - Display captions as clickable cards
    - Implement click handler to apply caption
    - Highlight currently applied caption
    - Implement hover preview indicator
    - _Requirements: 2.1, 2.2, 2.5, 2.6_
  
  - [ ]* 4.2 Write property test for click-to-apply
    - **Property 4: Click-to-apply caption workflow**
    - **Validates: Requirements 2.1, 2.3**
  
  - [ ]* 4.3 Write property test for selection visual feedback
    - **Property 5: Caption selection visual feedback**
    - **Validates: Requirements 2.2, 2.5**
  
  - [ ] 4.4 Implement caption application logic
    - Update text state on caption click
    - Trigger canvas re-render with new text
    - Save action to history with description
    - Show success toast
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [ ]* 4.5 Write property test for history integration
    - **Property 6: Caption application saves to history**
    - **Validates: Requirements 2.4**
  
  - [ ] 4.6 Implement hover preview
    - Show preview indicator on hover
    - Do not change text state on hover
    - Clear preview on mouse leave
    - _Requirements: 2.6_
  
  - [ ]* 4.7 Write property test for hover preview
    - **Property 7: Caption hover preview without application**
    - **Validates: Requirements 2.6**

- [ ] 5. Implement Onboarding System
  - [ ] 5.1 Create OnboardingController class
    - Define onboarding steps with content and targets
    - Implement step navigation (next, previous, skip)
    - Implement first-visit detection using localStorage
    - Implement completion tracking
    - Implement restart functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7_
  
  - [ ]* 5.2 Write property test for step navigation
    - **Property 12: Onboarding step navigation**
    - **Validates: Requirements 4.7**
  
  - [ ]* 5.3 Write property test for completion persistence
    - **Property 13: Onboarding completion persistence**
    - **Validates: Requirements 4.5**
  
  - [ ] 5.4 Create OnboardingOverlay component
    - Display semi-transparent overlay with spotlight
    - Display tooltip with step content
    - Highlight target UI elements
    - Display navigation buttons (Previous, Next, Skip)
    - Display progress indicator (e.g., "Step 2 of 5")
    - _Requirements: 4.1, 4.2, 4.3, 4.7_
  
  - [ ] 5.5 Create onboarding content
    - Write welcome message explaining app purpose
    - Create tooltips for key UI elements
    - Add sample images demonstrating text-behind-subject
    - _Requirements: 4.2, 4.4_
  
  - [ ] 5.6 Integrate onboarding with App component
    - Show onboarding on first visit
    - Provide restart option in settings
    - _Requirements: 4.1, 4.6_

- [ ] 6. Implement Progressive Disclosure Improvements
  - [ ] 6.1 Create view toggle system
    - Implement compact/expanded view state
    - Persist view preference in localStorage
    - Apply view state to UI layout
    - _Requirements: 5.1, 5.3_
  
  - [ ]* 6.2 Write property test for view preference persistence
    - **Property 15: View preference persistence**
    - **Validates: Requirements 5.3**
  
  - [ ] 6.3 Add visual indicators for hidden features
    - Add expand/collapse icons
    - Add badge counts for hidden items
    - Add tooltips explaining hidden features
    - _Requirements: 5.2_
  
  - [ ]* 6.4 Write property test for hidden feature indicators
    - **Property 14: Hidden feature indicators**
    - **Validates: Requirements 5.2**
  
  - [ ] 6.5 Implement feature search/help
    - Add keyboard shortcut hints to UI
    - Add quick access tooltips
    - _Requirements: 5.6_
  
  - [ ]* 6.6 Write property test for feature search hints
    - **Property 16: Feature search provides hints**
    - **Validates: Requirements 5.6**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Advanced Masking Modes
  - [ ] 8.1 Create MaskingEngine class
    - Implement mode selection and configuration
    - Implement preview generation for each mode
    - _Requirements: 7.1, 7.7_
  
  - [ ] 8.2 Implement full-behind masking algorithm
    - For each text pixel, if mask alpha > 0, set text alpha = 0
    - _Requirements: 7.2_
  
  - [ ]* 8.3 Write property test for full-behind masking
    - **Property 22: Full behind masking algorithm**
    - **Validates: Requirements 7.2**
  
  - [ ] 8.4 Implement weave-through masking algorithm
    - Divide text into horizontal bands
    - Alternate bands between behind and in front
    - _Requirements: 7.3_
  
  - [ ]* 8.5 Write property test for weave-through masking
    - **Property 23: Weave through masking algorithm**
    - **Validates: Requirements 7.3**
  
  - [ ] 8.6 Implement horizontal-split masking algorithm
    - Apply masking only to pixels below threshold
    - _Requirements: 7.4_
  
  - [ ]* 8.7 Write property test for horizontal-split masking
    - **Property 24: Horizontal split masking algorithm**
    - **Validates: Requirements 7.4**
  
  - [ ] 8.8 Implement vertical-split masking algorithm
    - Apply masking only to pixels to one side of threshold
    - _Requirements: 7.5_
  
  - [ ]* 8.9 Write property test for vertical-split masking
    - **Property 25: Vertical split masking algorithm**
    - **Validates: Requirements 7.5**
  
  - [ ] 8.10 Implement character-by-character masking algorithm
    - Render each character to temporary canvas
    - Apply masking to each character independently
    - Composite characters to main canvas
    - _Requirements: 7.6_
  
  - [ ]* 8.11 Write property test for character-by-character masking
    - **Property 26: Character-by-character masking algorithm**
    - **Validates: Requirements 7.6**
  
  - [ ] 8.12 Create MaskingModeSelector component
    - Display all 6 masking modes
    - Show preview thumbnail on hover
    - Apply mode on selection
    - _Requirements: 7.1, 7.7, 7.8_
  
  - [ ]* 8.13 Write property test for mode preview
    - **Property 27: Masking mode preview on hover**
    - **Validates: Requirements 7.7**
  
  - [ ]* 8.14 Write property test for mode change re-render
    - **Property 28: Masking mode change triggers re-render**
    - **Validates: Requirements 7.8**

- [ ] 9. Implement Professional Text Editor
  - [ ] 9.1 Create TextStyleConfig interface and state
    - Define all text style properties
    - Initialize state with default values
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 9.2 Create AdvancedTextEditor component
    - Add controls for font family, size, color, weight, style
    - Add controls for letter spacing and line height
    - Add controls for shadow, outline, gradient
    - Add rotation control with degree precision
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 9.3 Implement AdvancedTextRenderer class
    - Implement gradient rendering
    - Implement outline rendering
    - Implement shadow rendering
    - Implement rotation transforms
    - Implement text measurement
    - _Requirements: 8.5_
  
  - [ ]* 9.4 Write property test for real-time updates
    - **Property 29: Real-time text property updates**
    - **Validates: Requirements 8.5**
  
  - [ ] 9.5 Implement font pairing suggestions
    - Create font pairing database
    - Display suggestions when font is selected
    - _Requirements: 8.6_
  
  - [ ]* 9.6 Write property test for font pairing
    - **Property 30: Font pairing suggestions**
    - **Validates: Requirements 8.6**
  
  - [ ] 9.7 Create text style presets
    - Define professionally designed preset combinations
    - Implement preset application
    - _Requirements: 8.7_
  
  - [ ]* 9.8 Write property test for preset application
    - **Property 31: Preset application**
    - **Validates: Requirements 8.7**
  
  - [ ] 9.9 Implement custom preset saving
    - Allow users to save current style as preset
    - Persist custom presets in localStorage
    - Display custom presets alongside built-in presets
    - _Requirements: 8.8_
  
  - [ ]* 9.10 Write property test for custom preset saving
    - **Property 32: Custom preset saving**
    - **Validates: Requirements 8.8**

- [ ] 10. Fix Canvas Compositor Issues
  - [ ] 10.1 Implement white silhouette removal
    - Convert mask to pure alpha channel
    - Apply slight blur to mask edges (1-2px)
    - Use destination-out blend mode
    - Ensure mask and image dimensions match
    - _Requirements: 9.1_
  
  - [ ]* 10.2 Write property test for silhouette removal
    - **Property 33: No white silhouettes in compositing**
    - **Validates: Requirements 9.1**
  
  - [ ] 10.3 Implement conditional masking
    - Check if text is empty before applying mask
    - Skip masking operations when no text present
    - _Requirements: 9.2_
  
  - [ ]* 10.4 Write property test for conditional masking
    - **Property 34: Masking only applies with text**
    - **Validates: Requirements 9.2**
  
  - [ ] 10.5 Fix aspect ratio handling
    - Calculate target dimensions maintaining aspect ratio
    - Render to canvas at exact pixel dimensions
    - Center image within canvas if needed
    - Avoid CSS transforms for composition
    - _Requirements: 9.3_
  
  - [ ]* 10.6 Write property test for aspect ratio preservation
    - **Property 35: Aspect ratio preservation**
    - **Validates: Requirements 9.3**
  
  - [ ] 10.7 Implement correct alpha blending
    - Use mathematically correct blend operations
    - Validate alpha channel operations
    - _Requirements: 9.4_
  
  - [ ]* 10.8 Write property test for alpha blending
    - **Property 36: Correct alpha blending**
    - **Validates: Requirements 9.4**
  
  - [ ] 10.9 Ensure mask quality consistency
    - Validate mask edge quality matches setting
    - Apply appropriate edge processing based on quality
    - _Requirements: 9.5_
  
  - [ ]* 10.10 Write property test for mask quality
    - **Property 37: Mask quality consistency**
    - **Validates: Requirements 9.5**
  
  - [ ] 10.11 Ensure export matches preview
    - Use same rendering pipeline for export and preview
    - Validate exported image matches canvas
    - _Requirements: 9.6_
  
  - [ ]* 10.12 Write property test for export consistency
    - **Property 38: Export matches preview**
    - **Validates: Requirements 9.6**

- [ ] 11. Implement Visual Feedback and Micro-interactions
  - [ ] 11.1 Create MicroInteractionManager class
    - Register hover effects for interactive elements
    - Register click animations for buttons
    - Implement keyboard shortcuts overlay
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [ ]* 11.2 Write property test for hover states
    - **Property 39: Hover state visual changes**
    - **Validates: Requirements 10.1**
  
  - [ ]* 11.3 Write property test for click animations
    - **Property 40: Click animation feedback**
    - **Validates: Requirements 10.2**
  
  - [ ] 11.4 Implement smooth slider interaction
    - Optimize slider rendering for 60fps
    - Use requestAnimationFrame for updates
    - Debounce expensive operations
    - _Requirements: 10.3_
  
  - [ ]* 11.5 Write property test for slider smoothness
    - **Property 41: Smooth slider interaction**
    - **Validates: Requirements 10.3**
  
  - [ ] 11.6 Add draggable element visual cues
    - Add cursor change on hover
    - Add drag handle icons
    - Add visual feedback during drag
    - _Requirements: 10.4_
  
  - [ ]* 11.7 Write property test for drag cues
    - **Property 42: Draggable element visual cues**
    - **Validates: Requirements 10.4**
  
  - [ ] 11.8 Implement keyboard shortcuts overlay
    - Display overlay when "?" key is pressed
    - List all available shortcuts
    - Dismiss on any key press or click
    - _Requirements: 10.5_
  
  - [ ] 11.9 Implement immediate action feedback
    - Ensure all actions provide feedback within 100ms
    - Use optimistic UI updates where appropriate
    - Show loading states for delayed operations
    - _Requirements: 10.6_
  
  - [ ]* 11.10 Write property test for immediate feedback
    - **Property 43: Immediate action feedback**
    - **Validates: Requirements 10.6**

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Integration Testing
  - [ ]* 13.1 Test end-to-end caption workflow with errors
    - Upload image → Trigger API failure → Retry → Generate captions → Click caption → Verify canvas
    - _Requirements: 1.1, 1.2, 2.1, 2.3_
  
  - [ ]* 13.2 Test complete onboarding flow
    - First visit → Complete all steps → Verify persistence → Restart from settings
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7_
  
  - [ ]* 13.3 Test all masking modes
    - Apply each of the 6 masking modes → Verify visual output → Test mode switching
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8_
  
  - [ ]* 13.4 Test text editing workflow
    - Change all text properties → Verify real-time updates → Apply preset → Save custom preset
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8_
  
  - [ ]* 13.5 Test compositor fixes
    - Test with various aspect ratios → Verify no white silhouettes → Test export consistency
    - _Requirements: 9.1, 9.3, 9.6_
