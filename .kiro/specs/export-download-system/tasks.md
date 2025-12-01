# Implementation Plan - Export and Download System

- [x] 1. Set up export library structure
- [x] 1.1 Create export module directory structure
  - Create `frontend/src/lib/export/` directory
  - Create subdirectories for utilities
  - _Requirements: All_

- [x] 1.2 Create core interfaces and types
  - Define ExportConfig interface
  - Define ExportResult interface
  - Define ExportProgress interface
  - Define ExportState interface
  - Define FormatSettings interface
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Implement CanvasConverter
- [x] 2.1 Create canvasConverter.ts
  - Define ConversionOptions interface
  - Implement toDataURL function
  - Implement toBlob function
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

- [x] 2.2 Implement PNG conversion
  - Use canvas.toDataURL('image/png')
  - Return data URL
  - _Requirements: 2.1, 2.3_

- [x] 2.3 Implement JPEG conversion
  - Use canvas.toDataURL('image/jpeg', quality)
  - Default quality to 0.92
  - Return data URL
  - _Requirements: 2.2, 2.4_

- [x] 2.4 Implement scaleCanvas function
  - Check if scaling needed (maxDimension)
  - Calculate scale factor
  - Create scaled canvas
  - Use high quality image smoothing
  - Draw scaled image
  - Return scaled canvas
  - _Requirements: 3.1, 3.2_

- [x] 2.5 Write property test for aspect ratio preservation
  - **Property 3: Aspect ratio preservation**
  - **Validates: Requirements 3.1**

- [x] 2.6 Write property test for maximum dimension enforcement
  - **Property 4: Maximum dimension enforcement**
  - **Validates: Requirements 3.1, 3.2**

- [x] 3. Implement FormatOptimizer
- [x] 3.1 Create formatOptimizer.ts
  - Define OptimizationResult interface
  - Implement optimizePNG function
  - Implement optimizeJPEG function
  - _Requirements: 2.1, 2.2, 2.4, 3.4_

- [x] 3.2 Implement estimateFileSize function
  - Remove data URL prefix
  - Calculate binary size from base64
  - Return size in bytes
  - _Requirements: 6.5_

- [x] 3.3 Implement compareQuality function (optional)
  - Compare original and compressed
  - Calculate quality metric
  - Return comparison score
  - _Requirements: 3.4_

- [x] 3.4 Write property test for quality parameter application
  - **Property 2: Quality parameter application**
  - **Validates: Requirements 2.4, 3.4**

- [x] 4. Implement FilenameGenerator
- [x] 4.1 Create filenameGenerator.ts
  - Define FilenameOptions interface
  - Implement generate function
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.2 Implement filename generation
  - Format: caption-art-YYYYMMDD-HHMMSS
  - Add -watermarked suffix if needed
  - Add .png or .jpg extension
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.3 Implement sanitize function
  - Remove special characters
  - Replace spaces with hyphens
  - Limit length to 255 characters
  - Ensure filesystem compatibility
  - _Requirements: 4.4_

- [x] 4.4 Implement ensureUnique function
  - Check if filename exists
  - Append counter if needed (-1, -2, etc.)
  - _Requirements: 4.5_

- [x] 4.5 Write property test for format extension matching
  - **Property 1: Format extension matching**
  - **Validates: Requirements 2.5**

- [x] 4.6 Write property test for filename timestamp uniqueness
  - **Property 5: Filename timestamp uniqueness**
  - **Validates: Requirements 4.5**

- [x] 4.7 Write property test for watermark suffix presence
  - **Property 6: Watermark suffix presence**
  - **Validates: Requirements 4.3**

- [x] 5. Implement DownloadTrigger
- [x] 5.1 Create downloadTrigger.ts
  - Define DownloadOptions interface
  - Implement trigger function
  - _Requirements: 1.4, 1.5_

- [x] 5.2 Implement download link creation
  - Create anchor element
  - Set href to data URL or blob URL
  - Set download attribute to filename
  - Append to body
  - Click link
  - Remove from body
  - _Requirements: 1.4_

- [x] 5.3 Implement fallback methods
  - If download blocked, open in new tab
  - Provide manual save instructions
  - Log error for debugging
  - _Requirements: 7.2_

- [x] 5.4 Implement revokeObjectURL function
  - Revoke blob URLs after use
  - Clean up resources
  - _Requirements: 1.5_

- [x] 5.5 Write property test for download trigger success
  - **Property 11: Download trigger success**
  - **Validates: Requirements 1.4**

- [x] 6. Implement Exporter
- [x] 6.1 Create exporter.ts main class
  - Implement constructor
  - _Requirements: All_

- [x] 6.2 Implement export function
  - Validate canvas has content
  - Apply watermark if needed
  - Scale canvas if needed
  - Convert to specified format
  - Generate filename
  - Trigger download
  - Report progress throughout
  - Return ExportResult
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6.3 Implement progress reporting
  - Report "preparing" stage (0%)
  - Report "watermarking" stage (25%)
  - Report "converting" stage (50%)
  - Report "downloading" stage (75%)
  - Report "complete" stage (100%)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6.4 Implement abort function
  - Cancel pending operations
  - Clean up resources
  - _Requirements: 5.5_

- [x] 6.5 Write property test for export timing (standard images)
  - **Property 7: Export timing (standard images)**
  - **Validates: Requirements 5.1**

- [x] 6.6 Write property test for export timing (large images)
  - **Property 8: Export timing (large images)**
  - **Validates: Requirements 5.2**

- [x] 6.7 Write property test for progress stage sequence
  - **Property 9: Progress stage sequence**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 6.8 Write property test for layer inclusion completeness
  - **Property 10: Layer inclusion completeness**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 7. Create React components
- [x] 7.1 Create ExportButton component
  - Render export button
  - Show loading state during export
  - Disable during export
  - Apply neo-brutalism styling
  - _Requirements: 1.1, 5.3, 5.4_

- [x] 7.2 Create FormatSelector component
  - Render PNG/JPEG radio buttons or dropdown
  - Update format state on change
  - Apply neo-brutalism styling
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 7.3 Create ExportProgress component
  - Display progress bar
  - Show current stage message
  - Show percentage
  - Apply neo-brutalism styling
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Integrate with App.tsx
- [x] 8.1 Replace existing export logic
  - Import Exporter class
  - Initialize exporter
  - _Requirements: All_

- [x] 8.2 Add format selector to UI
  - Add FormatSelector component
  - Store format in state
  - Default to PNG
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 8.3 Update export button
  - Replace with ExportButton component
  - Connect to exporter
  - Pass canvas ref
  - Pass export config (format, watermark, etc.)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8.4 Add progress display
  - Add ExportProgress component
  - Show during export
  - Hide when complete
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8.5 Connect to license system
  - Pass watermark flag based on license
  - Pass watermark text
  - _Requirements: 1.3_

- [x] 9. Implement error handling
- [x] 9.1 Handle canvas validation errors
  - Check if canvas is empty
  - Check if canvas context is available
  - Display appropriate errors
  - _Requirements: 7.1, 7.4_

- [x] 9.2 Handle conversion errors
  - Catch toDataURL failures
  - Catch toBlob failures
  - Fall back to alternative methods
  - Display user-friendly messages
  - _Requirements: 7.1_

- [x] 9.3 Handle memory errors
  - Detect if canvas is too large
  - Suggest scaling down
  - Display memory limit error
  - _Requirements: 7.3_

- [x] 9.4 Handle download errors
  - Detect if download was blocked
  - Catch filesystem errors
  - Provide alternative methods
  - Display appropriate errors
  - _Requirements: 7.2_

- [x] 9.5 Handle format errors
  - Validate format is 'png' or 'jpeg'
  - Fall back to PNG if invalid
  - Clamp quality to 0.5-1.0 range
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 9.6 Write property test for error message clarity
  - **Property 12: Error message clarity**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 10. Implement performance optimizations
- [x] 10.1 Add debouncing for rapid exports
  - Prevent multiple simultaneous exports
  - Queue exports if needed
  - _Requirements: 5.5_

- [x] 10.2 Optimize canvas operations
  - Use requestAnimationFrame for progress updates
  - Cache scaled canvases temporarily
  - Clean up resources promptly
  - _Requirements: 5.1, 5.2_

- [x] 10.3 Add Web Workers (optional)
  - Offload heavy processing to workers
  - Use for large image processing
  - _Requirements: 5.2_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Write unit tests
- [x] 12.1 Test Exporter
  - Test full export pipeline
  - Test progress reporting
  - Test abort functionality
  - Test error handling

- [x] 12.2 Test CanvasConverter
  - Test PNG conversion
  - Test JPEG conversion with various qualities
  - Test canvas scaling
  - Test aspect ratio preservation

- [x] 12.3 Test FormatOptimizer
  - Test PNG optimization
  - Test JPEG optimization
  - Test file size estimation
  - Test quality comparison

- [x] 12.4 Test FilenameGenerator
  - Test filename format
  - Test timestamp inclusion
  - Test watermark suffix
  - Test sanitization
  - Test uniqueness

- [x] 12.5 Test DownloadTrigger
  - Test download link creation
  - Test download trigger
  - Test object URL cleanup
  - Test fallback methods

- [x] 13. Final testing
- [x] 13.1 Test PNG export
  - Export various canvas sizes
  - Verify format is PNG
  - Verify lossless quality
  - Verify transparency preserved
  - _Requirements: 2.1, 2.3_

- [x] 13.2 Test JPEG export
  - Export with various quality settings
  - Verify format is JPEG
  - Verify quality applied
  - Verify no transparency
  - _Requirements: 2.2, 2.4_

- [x] 13.3 Test scaling
  - Export large canvases (> 1080px)
  - Verify scaled down to 1080px
  - Verify aspect ratio preserved
  - Verify quality maintained
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 13.4 Test filename generation
  - Export multiple times
  - Verify timestamps are unique
  - Verify watermark suffix for free tier
  - Verify no suffix for premium
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 13.5 Test progress reporting
  - Export and monitor progress
  - Verify all stages reported
  - Verify progress values increase
  - Verify messages are clear
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13.6 Test layer inclusion
  - Export with background only
  - Export with background + text
  - Export with background + text + mask
  - Export with watermark
  - Verify all layers present in final image
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13.7 Test error scenarios
  - Try exporting empty canvas
  - Try exporting very large canvas
  - Simulate download blocked
  - Simulate memory limit
  - Verify error messages are clear
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 13.8 Test performance
  - Measure export time for standard images
  - Measure export time for large images
  - Verify within target times
  - _Requirements: 5.1, 5.2_

- [x] 14. Browser compatibility testing
- [x] 14.1 Test in Chrome
  - Test all export features
  - Verify downloads work
  - Verify formats work
  - _Requirements: All_

- [x] 14.2 Test in Firefox
  - Test all export features
  - Verify downloads work
  - Verify formats work
  - _Requirements: All_

- [x] 14.3 Test in Safari
  - Test all export features
  - Verify downloads work
  - Verify formats work
  - Handle Safari-specific quirks
  - _Requirements: All_

- [x] 14.4 Test on mobile browsers
  - Test on iOS Safari
  - Test on Chrome Android
  - Verify downloads work on mobile
  - _Requirements: All_

- [x] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
