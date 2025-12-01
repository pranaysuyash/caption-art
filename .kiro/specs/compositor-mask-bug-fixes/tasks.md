# Implementation Plan - Compositor Mask Bug Fixes

- [ ] 1. Fix LayerManager compositing to preserve background
- [ ] 1.1 Update composite() method to use correct blend mode strategy
  - Modify the compositing algorithm to preserve background in masked areas
  - Implement two-pass rendering: (1) background+text, (2) apply mask to text only
  - Use destination-in blend mode to mask text, then composite over background
  - Ensure globalCompositeOperation is restored after each operation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.5_

- [ ]* 1.2 Write property test for background pixel preservation
  - **Property 1: Background pixel preservation in masked areas**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ]* 1.3 Write property test for blend mode restoration
  - **Property 12: Blend mode restoration**
  - **Validates: Requirements 5.5**

- [ ]* 1.4 Write unit tests for LayerManager
  - Test compositing with only background layer
  - Test compositing with background + text (no mask)
  - Test compositing with background + text + mask
  - Test clear() removes all layers
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Add conditional mask application in Compositor
- [ ] 2.1 Update render() method to check text presence before applying mask
  - Add condition: `if (this.maskImage && this.textBehindEnabled && textLayer.text.trim())`
  - Skip mask layer creation when text is empty
  - Ensure mask is applied when text is present
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.2 Update renderAdvanced() method with same conditional logic
  - Apply same text presence check for advanced rendering
  - Maintain consistency between render() and renderAdvanced()
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.3 Write property test for conditional mask application
  - **Property 2: Mask application is conditional on text presence**
  - **Validates: Requirements 2.2**

- [ ]* 2.4 Write unit tests for text presence scenarios
  - Test render with empty text (no mask applied)
  - Test render with whitespace-only text (no mask applied)
  - Test render with valid text (mask applied)
  - Test transition from empty to valid text
  - Test transition from valid to empty text
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Fix aspect ratio and canvas dimension handling
- [ ] 3.1 Update updateCanvasDimensions() to set CSS inline styles
  - Add validation for calculated dimensions (must be > 0)
  - Set canvas.width and canvas.height attributes
  - Set canvas.style.width and canvas.style.height inline styles
  - Throw error if dimensions are invalid
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.2 Add aspect ratio validation in calculateScaleFactor()
  - Calculate and store original aspect ratio
  - Verify scaled dimensions maintain aspect ratio
  - Add tolerance for rounding errors
  - _Requirements: 3.1, 3.2, 3.5_

- [ ]* 3.3 Write property test for aspect ratio preservation
  - **Property 3: Aspect ratio preservation across scaling**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 3.4 Write property test for canvas dimensions
  - **Property 4: Canvas dimensions match scaled image**
  - **Validates: Requirements 3.3**

- [ ]* 3.5 Write property test for viewport resize
  - **Property 5: Viewport resize maintains aspect ratio**
  - **Validates: Requirements 3.5**

- [ ]* 3.6 Write unit tests for dimension calculations
  - Test calculateScaleFactor with various image sizes
  - Test updateCanvasDimensions sets correct values
  - Test CSS inline styles are applied
  - Test validation throws errors for invalid dimensions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Improve error handling and state preservation
- [ ] 4.1 Add canvas context loss detection
  - Implement checkContextLost() method
  - Implement attemptContextRestore() method
  - Call context check before critical operations
  - _Requirements: 4.3_

- [ ] 4.2 Enhance error recovery in render() method
  - Ensure saveCanvasState() is called before rendering
  - Wrap all rendering operations in try-catch
  - Restore previous state on error using restoreCanvasState()
  - Log errors with context information
  - Re-throw errors for caller to handle
  - _Requirements: 4.4, 5.3_

- [ ] 4.3 Add parameter validation in constructor
  - Validate canvas is not null
  - Validate backgroundImage is not null
  - Check if image is loaded (complete property for HTMLImageElement)
  - Check dimensions are valid (> 0)
  - Validate maskImage if provided
  - Throw descriptive errors for invalid parameters
  - _Requirements: 5.4_

- [ ]* 4.4 Write property test for error state preservation
  - **Property 8: Error state preservation**
  - **Validates: Requirements 4.4**

- [ ]* 4.5 Write property test for error propagation
  - **Property 11: Error propagation without side effects**
  - **Validates: Requirements 5.3**

- [ ]* 4.6 Write unit tests for error handling
  - Test constructor with invalid parameters
  - Test render with context loss
  - Test render with invalid image data
  - Test state restoration after error
  - _Requirements: 4.3, 4.4, 5.3, 5.4_

- [ ] 5. Add mask scaling and alpha blending improvements
- [ ] 5.1 Verify mask scaling in createMaskLayer()
  - Ensure mask is drawn at canvas dimensions (already implemented)
  - Add validation that mask dimensions match canvas after scaling
  - _Requirements: 4.2_

- [ ] 5.2 Test alpha blending with partial transparency
  - Verify smooth transitions in masked areas
  - Ensure no hard edges or artifacts
  - _Requirements: 4.1_

- [ ]* 5.3 Write property test for mask scaling
  - **Property 7: Mask scaling to match image**
  - **Validates: Requirements 4.2**

- [ ]* 5.4 Write property test for alpha blending
  - **Property 6: Alpha blending correctness**
  - **Validates: Requirements 4.1**

- [ ] 6. Ensure render purity and separation of concerns
- [ ] 6.1 Audit render() method for state modifications
  - Verify no direct state modifications (no setState calls)
  - Ensure only canvas pixels are modified
  - Confirm errors are propagated, not swallowed
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6.2 Audit layer operations for side effects
  - Review LayerManager methods for purity
  - Ensure operations only affect canvas contexts
  - Verify no external state is modified
  - _Requirements: 5.2_

- [ ]* 6.3 Write property test for render purity
  - **Property 9: Render purity (no state modification)**
  - **Validates: Requirements 5.1**

- [ ]* 6.4 Write property test for layer operation purity
  - **Property 10: Layer operation purity**
  - **Validates: Requirements 5.2**

- [ ] 7. Add clear operation artifact prevention
- [ ] 7.1 Enhance clear() method to prevent artifacts
  - Call clearRect with full canvas dimensions
  - Clear layer manager
  - Clear all cached layers
  - Reset render token to cancel in-progress renders
  - _Requirements: 1.5_

- [ ]* 7.2 Write property test for clear operation
  - **Property 13: Clear operation removes artifacts**
  - **Validates: Requirements 1.5**

- [ ]* 7.3 Write unit tests for clear operation
  - Test clear removes all visible content
  - Test clear resets layer manager
  - Test clear invalidates caches
  - Test render after clear produces clean output
  - _Requirements: 1.5_

- [ ] 8. Update App.tsx to prevent CSS dimension overrides
- [ ] 8.1 Review CSS rules for canvas elements
  - Identify any CSS rules that set fixed dimensions on canvas
  - Remove or modify rules to use positioning instead of sizing
  - Ensure canvas sizing is controlled by JavaScript only
  - _Requirements: 3.4_

- [ ] 8.2 Add defensive checks for empty text before rendering
  - Check text.trim() before calling compositor.render()
  - Skip render calls when text is empty
  - Ensure UI updates reflect empty text state
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 8.3 Write integration tests for App.tsx
  - Test full workflow: upload → caption → add text → render
  - Test empty text doesn't apply mask
  - Test text removal clears mask
  - Test aspect ratio is preserved in UI
  - _Requirements: All_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests (100 iterations each)
  - Run integration tests
  - Verify no regressions in existing functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Manual testing and validation
- [ ] 10.1 Test with various image sizes and aspect ratios
  - Test with square images (1:1)
  - Test with landscape images (16:9, 4:3)
  - Test with portrait images (9:16, 3:4)
  - Test with very wide images (21:9)
  - Test with very tall images (9:21)
  - Verify no white silhouettes appear
  - Verify aspect ratios are preserved
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.5_

- [ ] 10.2 Test text presence scenarios
  - Test with no text (mask should not apply)
  - Test with whitespace-only text (mask should not apply)
  - Test with valid text (mask should apply)
  - Test adding text after upload (mask should apply)
  - Test removing text (mask should disappear)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 10.3 Test mask quality and edge cases
  - Test with high-quality masks (smooth edges)
  - Test with low-quality masks (rough edges)
  - Test with masks that have partial transparency
  - Test with masks that don't match image dimensions
  - Verify smooth alpha blending
  - Verify mask scaling works correctly
  - _Requirements: 4.1, 4.2_

- [ ] 10.4 Test error scenarios
  - Test with corrupted images
  - Test with very large images (> 10MB)
  - Test with unsupported formats
  - Verify graceful error handling
  - Verify previous state is preserved on error
  - _Requirements: 4.3, 4.4, 5.3_

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify all property tests pass (100 iterations)
  - Verify all unit tests pass
  - Verify all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.
