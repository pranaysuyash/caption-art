# Implementation Plan - Image Segmentation and Masking System

- [x] 1. Set up segmentation library structure
- [x] 1.1 Create segmentation module directory structure
  - Create `frontend/src/lib/segmentation/` directory
  - Create subdirectories for clients and utilities
  - _Requirements: All_

- [x] 1.2 Create core interfaces and types
  - Define MaskResult interface
  - Define MaskState interface
  - Define MaskValidation interface
  - Define SegmentationError interface
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement RembgClient
- [x] 2.1 Create rembgClient.ts
  - Define RembgPrediction interface
  - Implement constructor with API key
  - Implement createPrediction function
  - Implement getPrediction function
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Implement polling logic
  - Implement waitForCompletion function
  - Poll every 1 second
  - Max 45 attempts (45 seconds timeout)
  - Handle succeeded/failed statuses
  - Extract mask URL from output
  - _Requirements: 1.3, 3.1, 3.2_

- [x] 2.3 Implement error handling
  - Handle connection failures with retry
  - Handle rate limiting
  - Handle model failures
  - Parse error responses
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2.4 Implement cancelPrediction function
  - Cancel pending prediction
  - Clean up resources
  - _Requirements: 6.1, 6.2_

- [x] 3. Implement MaskProcessor
- [x] 3.1 Create maskProcessor.ts
  - Define MaskValidation interface
  - Implement validate function
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.2 Implement validation checks
  - Verify PNG format with alpha channel
  - Check dimensions match original image
  - Validate alpha values are not all 0 or 255
  - Detect edge quality (smooth vs jagged)
  - Check for artifacts or noise
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.3 Implement extractAlphaChannel function
  - Draw mask to canvas
  - Get ImageData
  - Extract alpha channel
  - Return ImageData
  - _Requirements: 1.5_

- [x] 3.4 Implement assessQuality function
  - Sample edge pixels (alpha 10-245)
  - Check for smooth gradients
  - Calculate smooth ratio
  - Return quality rating (high/medium/low)
  - _Requirements: 2.2, 2.5_

- [x] 3.5 Implement refine function (optional)
  - Apply Gaussian blur for smoothing
  - Apply morphological operations
  - Adjust threshold
  - Return refined mask
  - _Requirements: 2.2_

- [x] 4. Implement MaskCache
- [x] 4.1 Create maskCache.ts
  - Define MaskCacheEntry interface
  - Implement constructor with maxSize and TTL
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4.2 Implement cache operations
  - Implement set function (add entry)
  - Implement get function (retrieve entry)
  - Implement has function (check existence)
  - Implement clear function (clear all)
  - Implement prune function (remove expired)
  - Implement getStats function
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4.3 Implement LRU eviction
  - Track access times
  - Evict least recently used when full
  - Set max size to 30 entries
  - _Requirements: 6.1_

- [x] 4.4 Implement TTL expiration
  - Check timestamp on get
  - Remove expired entries
  - Set TTL to 2 hours
  - _Requirements: 6.1_

- [x] 4.5 Write property test for cache hit consistency
  - **Property 5: Cache hit consistency**
  - **Validates: Requirements 6.3**

- [x] 5. Implement MaskPreview
- [x] 5.1 Create maskPreview.ts
  - Define PreviewOptions interface
  - Implement renderOverlay function
  - Implement renderSideBySide function
  - Implement renderCheckerboard function
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5.2 Implement overlay rendering
  - Draw original image
  - Extract alpha from mask
  - Colorize mask (red for subject)
  - Draw with opacity
  - _Requirements: 4.2_

- [x] 5.3 Implement side-by-side rendering
  - Draw original on left half
  - Draw mask on right half
  - _Requirements: 4.3_

- [x] 5.4 Implement checkerboard rendering
  - Create checkerboard pattern
  - Draw mask with transparency
  - _Requirements: 4.3_

- [x] 6. Implement MaskGenerator
- [x] 6.1 Create maskGenerator.ts main class
  - Implement constructor with config
  - Initialize Rembg client
  - Initialize cache
  - _Requirements: All_

- [x] 6.2 Implement generate function
  - Validate image format
  - Check cache for existing mask
  - Call Replicate rembg API
  - Wait for mask URL
  - Download mask image
  - Validate mask
  - Assess quality
  - Cache result
  - Return MaskResult
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6.3 Implement mask download
  - Fetch mask URL
  - Create blob
  - Load as HTMLImageElement
  - Validate alpha channel
  - _Requirements: 1.3, 1.4_

- [x] 6.4 Implement regenerate function
  - Bypass cache
  - Call generate with fresh API call
  - Return new mask
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 6.5 Implement abort function
  - Cancel pending Replicate prediction
  - Clean up resources
  - _Requirements: 6.1, 6.2_

- [x] 6.6 Implement clearCache function
  - Clear all cached masks
  - _Requirements: 6.1_

- [x] 6.7 Write property test for alpha channel presence
  - **Property 1: Alpha channel presence**
  - **Validates: Requirements 1.4**

- [x] 6.8 Write property test for dimension matching
  - **Property 2: Dimension matching**
  - **Validates: Requirements 2.4**

- [x] 6.9 Write property test for mask URL validity
  - **Property 3: Mask URL validity**
  - **Validates: Requirements 1.2, 1.3**

- [x] 6.10 Write property test for timeout enforcement
  - **Property 4: Timeout enforcement**
  - **Validates: Requirements 3.1, 3.3**

- [x] 6.11 Write property test for regeneration independence
  - **Property 6: Regeneration independence**
  - **Validates: Requirements 6.1, 6.2**

- [x] 7. Create React components
- [x] 7.1 Create MaskGenerator component
  - Render mask generation UI
  - Show loading state during generation
  - Display error messages
  - Show quality indicator
  - _Requirements: 1.5, 3.3, 5.1, 5.2, 5.3, 5.4_

- [x] 7.2 Create MaskPreview component
  - Render preview toggle button
  - Show mask visualization
  - Support overlay/side-by-side/checkerboard modes
  - Apply neo-brutalism styling
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7.3 Create RegenerateMaskButton component
  - Render regenerate button
  - Disable during generation
  - Apply neo-brutalism styling
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 8. Integrate with App.tsx
- [x] 8.1 Replace existing mask generation logic
  - Import MaskGenerator class
  - Initialize generator with API key
  - Call generate on image upload
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 8.2 Update mask state management
  - Store mask URL
  - Store mask image
  - Store quality rating
  - Store preview enabled state
  - Store text-behind enabled state
  - _Requirements: 1.4, 1.5, 4.4, 8.1, 8.2_

- [x] 8.3 Add regenerate functionality
  - Add RegenerateMaskButton to UI
  - Call regenerate on button click
  - Update mask state
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 8.4 Add preview functionality
  - Add MaskPreview component to UI
  - Toggle preview on button click
  - Render preview visualization
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8.5 Add text-behind toggle
  - Add toggle button for text-behind effect
  - Enable/disable mask compositing
  - Retain mask data when disabled
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Integrate with Canvas Compositor
- [x] 9.1 Pass mask to compositor
  - Pass mask image to compositor
  - Pass text-behind enabled state
  - _Requirements: 1.5, 8.1, 8.2, 8.5_

- [x] 9.2 Handle mask absence
  - Render text on top if no mask
  - Render text on top if text-behind disabled
  - _Requirements: 8.1, 8.2, 8.5_

- [x] 10. Implement error handling
- [x] 10.1 Handle Replicate API errors
  - Catch connection failures
  - Handle rate limiting
  - Handle model failures
  - Handle timeouts
  - Handle no subject detected
  - Display user-friendly messages
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10.2 Handle mask download errors
  - Catch network failures
  - Handle CORS errors
  - Handle invalid image
  - Retry download up to 2 times
  - _Requirements: 5.2_

- [x] 10.3 Handle validation errors
  - Handle missing alpha channel
  - Handle dimension mismatch
  - Handle all transparent mask
  - Handle all opaque mask
  - Display appropriate errors
  - _Requirements: 5.1, 5.4_

- [x] 10.4 Handle input validation errors
  - Validate image format
  - Check file size (max 10MB)
  - Validate image loads correctly
  - Display appropriate errors
  - _Requirements: 5.4_

- [x] 10.5 Write property test for error message clarity
  - **Property 11: Error message clarity**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 11. Write property test for preview mode preservation
  - **Property 7: Preview mode preservation**
  - **Validates: Requirements 4.4**

- [x] 12. Write property test for text-behind effect toggle
  - **Property 8: Text-behind effect toggle**
  - **Validates: Requirements 8.1, 8.2, 8.5**

- [x] 13. Write property test for edge quality preservation
  - **Property 9: Edge quality preservation**
  - **Validates: Requirements 2.2, 2.5**

- [x] 14. Write property test for multi-subject inclusion
  - **Property 10: Multi-subject inclusion**
  - **Validates: Requirements 2.3**

- [x] 15. Write property test for format compatibility
  - **Property 12: Format compatibility**
  - **Validates: Requirements 7.1, 7.2, 7.4**

- [-] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Write unit tests
- [x] 17.1 Test MaskGenerator
  - Test successful generation flow
  - Test error handling
  - Test timeout behavior
  - Test abort functionality
  - Test cache integration

- [x] 17.2 Test RembgClient
  - Test prediction creation
  - Test polling logic
  - Test completion detection
  - Test error parsing
  - Test cancellation

- [x] 17.3 Test MaskProcessor
  - Test alpha channel validation
  - Test dimension checking
  - Test quality assessment
  - Test refinement operations

- [x] 17.4 Test MaskCache
  - Test cache hit/miss
  - Test LRU eviction
  - Test TTL expiration
  - Test cache clearing
  - Test stats tracking

- [x] 17.5 Test MaskPreview
  - Test overlay rendering
  - Test side-by-side rendering
  - Test checkerboard rendering
  - Test opacity control

- [x] 18. Optimize performance
- [x] 18.1 Implement request deduplication
  - Detect duplicate image uploads
  - Return cached mask immediately
  - Avoid redundant API calls
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 18.2 Add prefetching
  - Prefetch mask in background after upload
  - Start generation before user requests
  - Cache result for instant display
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 18.3 Optimize mask processing
  - Use Web Workers for heavy processing
  - Cache processed masks
  - Limit canvas operations
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 19. Final testing
- [x] 19.1 Test with real images
  - Test with photos of people
  - Test with photos of objects
  - Test with photos of animals
  - Test with complex backgrounds
  - Verify masks are accurate
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 19.2 Test mask quality
  - Test with images with hair/fur
  - Test with images with glass/reflections
  - Test with images with shadows
  - Test with multiple subjects
  - Verify quality assessment is accurate
  - _Requirements: 2.2, 2.3, 2.5_

- [x] 19.3 Test preview modes
  - Test overlay mode with various images
  - Test side-by-side mode
  - Test checkerboard mode
  - Verify visualizations are correct
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 19.4 Test text-behind effect
  - Test with various masks
  - Test with text at different positions
  - Test with different text styles
  - Verify compositing is correct
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 19.5 Test error scenarios
  - Test with invalid image formats
  - Test with oversized images
  - Test with network disconnected
  - Test with API rate limits
  - Test with images with no subject
  - Verify error messages are clear
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 20. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
