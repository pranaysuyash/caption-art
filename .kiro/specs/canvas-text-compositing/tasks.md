# Implementation Plan - Canvas Text Compositing Engine

- [x] 1. Set up canvas library structure
- [x] 1.1 Create canvas module directory structure
  - Create `frontend/src/lib/canvas/` directory
  - Create `frontend/src/lib/utils/` directory for helpers
  - _Requirements: All_

- [x] 1.2 Create core interfaces and types
  - Define StylePreset type ('neon' | 'magazine' | 'brush' | 'emboss')
  - Define Transform interface (x, y, scale, rotation)
  - Define TextLayer interface
  - Define CanvasState interface
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Implement TextRenderer
- [x] 2.1 Create textRenderer.ts with style presets
  - Implement getStyle function for each preset
  - Define neon style (white text with cyan glow, multiple shadows)
  - Define magazine style (bold serif with thick white stroke)
  - Define brush style (cursive script with textured appearance)
  - Define emboss style (sans-serif with offset shadow)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.2 Implement renderText function
  - Apply font and fill style
  - Apply stroke style if defined
  - Apply shadow effects
  - Apply multiple shadow layers for neon
  - Render text at specified position
  - _Requirements: 1.1, 2.5_

- [x] 2.3 Write property test for style preset consistency
  - **Property 9: Style preset consistency**
  - **Validates: Requirements 2.5**

- [x] 3. Implement TransformController
- [x] 3.1 Create transformController.ts
  - Implement constructor with initial transform
  - Implement setPosition (normalize to 0-1 range)
  - Implement setScale (clamp to 0.5-3.0)
  - Implement setRotation (normalize to 0-360)
  - Implement getTransform
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.2 Implement applyToContext function
  - Apply translate transformation
  - Apply rotate transformation
  - Apply scale transformation
  - Maintain correct transformation order
  - _Requirements: 3.4_

- [x] 3.3 Write property test for transform preservation
  - **Property 2: Transform preservation**
  - **Validates: Requirements 3.4**

- [x] 3.4 Write property test for resolution independence
  - **Property 3: Resolution independence**
  - **Validates: Requirements 7.4**

- [x] 3.5 Write property test for scale proportionality
  - **Property 12: Scale proportionality**
  - **Validates: Requirements 3.2**

- [x] 4. Implement LayerManager
- [x] 4.1 Create layerManager.ts
  - Define Layer interface
  - Implement addLayer function
  - Implement removeLayer function
  - Implement clear function
  - _Requirements: 4.1, 4.2_

- [x] 4.2 Implement composite function
  - Draw background layer
  - Draw text layer
  - Apply mask layer with destination-out blend mode
  - Composite in correct order
  - _Requirements: 4.2, 4.5_

- [x] 4.3 Write property test for layer compositing order
  - **Property 1: Layer compositing order**
  - **Validates: Requirements 4.2**

- [x] 4.4 Write property test for mask alpha preservation
  - **Property 8: Mask alpha preservation**
  - **Validates: Requirements 4.3**

- [x] 5. Implement Compositor
- [x] 5.1 Create compositor.ts main class
  - Implement constructor with config
  - Store canvas and image references
  - Calculate scale factor for viewport
  - _Requirements: 7.1, 7.2_

- [x] 5.2 Implement render function
  - Clear canvas
  - Scale canvas to fit viewport
  - Create layer manager
  - Add background layer
  - Add text layer with transforms
  - Add mask layer if available
  - Composite all layers
  - _Requirements: 1.1, 4.2, 7.1_

- [x] 5.3 Implement clear function
  - Clear canvas content
  - Reset layer manager
  - _Requirements: All_

- [x] 5.4 Implement getDataURL function
  - Convert canvas to data URL
  - Support PNG and JPEG formats
  - Apply quality parameter for JPEG
  - _Requirements: 5.2_

- [x] 5.5 Implement getScaleFactor function
  - Calculate scale based on maxDimension
  - Return scale factor for coordinate conversion
  - _Requirements: 7.1, 7.4_

- [x] 5.6 Write property test for aspect ratio preservation
  - **Property 4: Aspect ratio preservation**
  - **Validates: Requirements 7.1**

- [x] 5.7 Write property test for render performance
  - **Property 10: Render performance**
  - **Validates: Requirements 8.3**

- [x] 6. Implement Exporter
- [x] 6.1 Create exporter.ts
  - Implement export function with options
  - Implement applyWatermark function
  - Implement generateFilename function
  - _Requirements: 5.1, 5.4, 5.5_

- [x] 6.2 Implement canvas-to-image conversion
  - Use toDataURL for PNG export
  - Use toDataURL with quality for JPEG export
  - Handle conversion errors
  - _Requirements: 5.2_

- [x] 6.3 Implement download trigger
  - Create download link
  - Trigger browser download
  - Clean up object URLs
  - _Requirements: 5.5_

- [x] 6.4 Write property test for export quality consistency
  - **Property 5: Export quality consistency**
  - **Validates: Requirements 5.2**

- [x] 6.5 Write property test for watermark positioning
  - **Property 6: Watermark positioning**
  - **Validates: Requirements 5.4**

- [x] 7. Implement auto-placement algorithm
- [x] 7.1 Create auto-placement utilities
  - Implement image-to-grayscale conversion
  - Implement gradient magnitude calculation (edge detection)
  - Implement grid cell scoring
  - Implement contiguous region finding
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7.2 Integrate auto-placement with compositor
  - Add auto-place function to compositor
  - Calculate optimal text position
  - Update transform controller with new position
  - _Requirements: 6.4_

- [x] 7.3 Write property test for auto-placement non-overlap
  - **Property 11: Auto-placement non-overlap**
  - **Validates: Requirements 6.3**

- [x] 8. Create React components
- [x] 8.1 Create CanvasEditor component
  - Render canvas element
  - Initialize compositor on mount
  - Handle canvas ref
  - Trigger re-render on prop changes
  - _Requirements: All_

- [x] 8.2 Create TransformControls component
  - Create position sliders (x, y)
  - Create scale slider (0.5-3.0)
  - Create rotation slider (0-360)
  - Connect to transform controller
  - Apply neo-brutalism styling
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8.3 Create StylePresetSelector component
  - Create buttons for each preset
  - Highlight selected preset
  - Connect to text renderer
  - Apply neo-brutalism styling
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 9. Integrate with App.tsx
- [x] 9.1 Replace existing canvas logic with Compositor
  - Import Compositor class
  - Initialize compositor with canvas ref
  - Connect to image state
  - Connect to mask state
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 9.2 Connect text input to TextRenderer
  - Pass text to compositor
  - Pass preset to compositor
  - Pass fontSize to compositor
  - Trigger re-render on changes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 9.3 Add TransformControls to UI
  - Add transform controls below canvas
  - Connect to transform state
  - Update compositor on transform changes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 9.4 Connect export button to Exporter
  - Import Exporter class
  - Call export on button click
  - Pass watermark config based on license
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Implement performance optimizations
- [x] 10.1 Add debouncing for re-renders
  - Debounce text input changes
  - Debounce transform slider changes
  - Use requestAnimationFrame for smooth updates
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 10.2 Implement canvas caching
  - Cache background layer
  - Cache text layer when possible
  - Only re-render changed layers
  - _Requirements: 8.3_

- [x] 10.3 Add memory management
  - Clean up canvas references on unmount
  - Revoke object URLs after use
  - Clear cached layers when needed
  - _Requirements: 8.5_

- [x] 11. Write property test for text visibility bounds
  - **Property 7: Text visibility bounds**
  - **Validates: Requirements 1.5**

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Add error handling
- [x] 13.1 Handle image loading errors
  - Catch image load failures
  - Display error message
  - Provide retry mechanism
  - _Requirements: All_

- [x] 13.2 Handle canvas rendering errors
  - Wrap rendering in try-catch
  - Fall back to previous state on error
  - Log errors to console
  - _Requirements: All_

- [x] 13.3 Handle export errors
  - Catch toDataURL failures
  - Handle download trigger failures
  - Provide alternative export methods
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 14. Write unit tests
- [x] 14.1 Test TextRenderer
  - Test each style preset returns correct TextStyle
  - Test font size scaling
  - Test shadow generation for neon
  - Test stroke application for magazine

- [x] 14.2 Test TransformController
  - Test position normalization
  - Test scale clamping
  - Test rotation normalization
  - Test transform matrix application

- [x] 14.3 Test Compositor
  - Test canvas scaling maintains aspect ratio
  - Test layer compositing order
  - Test blend mode application
  - Test clear operation

- [x] 14.4 Test Exporter
  - Test filename generation
  - Test watermark rendering
  - Test format conversion
  - Test quality parameter

- [x] 15. Final testing and polish
- [x] 15.1 Test with various image sizes
  - Test with small images (< 500px)
  - Test with medium images (500-1500px)
  - Test with large images (> 1500px)
  - Verify scaling works correctly
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 15.2 Test all style presets
  - Test neon preset with various text
  - Test magazine preset with various text
  - Test brush preset with various text
  - Test emboss preset with various text
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 15.3 Test transform interactions
  - Test position + scale
  - Test position + rotation
  - Test scale + rotation
  - Test all three combined
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 15.4 Test text-behind effect
  - Test with various mask qualities
  - Test with complex edges (hair, fur)
  - Test with multiple subjects
  - Verify compositing is correct
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
