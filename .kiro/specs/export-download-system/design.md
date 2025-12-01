# Design Document - Export and Download System

## Overview

This design document outlines the technical approach for the Export and Download System, which converts HTML5 Canvas compositions to downloadable image files with appropriate format, quality, resolution, and watermark settings. The system handles PNG and JPEG exports, applies watermarks for free tier users, and triggers browser downloads.

The export pipeline:
1. Canvas content validation
2. Watermark application (if free tier)
3. Canvas-to-image conversion
4. Quality/format optimization
5. Filename generation
6. Browser download trigger

## Architecture

### Component Structure

```
frontend/src/
├── lib/
│   ├── export/
│   │   ├── exporter.ts            # Main export orchestrator
│   │   ├── canvasConverter.ts     # Canvas-to-image conversion
│   │   ├── formatOptimizer.ts     # Format-specific optimization
│   │   ├── filenameGenerator.ts   # Filename creation
│   │   └── downloadTrigger.ts     # Browser download initiation
│   └── utils/
│       ├── blobUtils.ts           # Blob manipulation
│       └── imageUtils.ts          # Image processing utilities
└── components/
    ├── ExportButton.tsx           # Main export button
    ├── FormatSelector.tsx         # PNG/JPG selection
    └── ExportProgress.tsx         # Progress indicator
```

### Data Flow

```
Canvas Content → Watermark (if needed) → Format Conversion → Quality Optimization
                                                                      ↓
                                                              Filename Generation
                                                                      ↓
                                                              Download Trigger
```

## Components and Interfaces

### 1. Exporter

**Purpose**: Orchestrates the entire export pipeline

**Interface**:
```typescript
interface ExportConfig {
  format: 'png' | 'jpeg'
  quality: number // 0-1 for JPEG
  maxDimension: number // 1080px default
  watermark: boolean
  watermarkText: string
}

interface ExportResult {
  success: boolean
  filename: string
  fileSize: number
  format: string
  error: string | null
}

interface ExportProgress {
  stage: 'preparing' | 'watermarking' | 'converting' | 'downloading' | 'complete'
  progress: number // 0-100
  message: string
}

class Exporter {
  constructor()
  
  async export(
    canvas: HTMLCanvasElement,
    config: ExportConfig,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult>
  
  abort(): void
}
```

**Behavior**:
- Validates canvas has content
- Applies watermark if needed
- Converts to specified format
- Optimizes quality/size
- Generates filename
- Triggers download
- Reports progress throughout

### 2. CanvasConverter

**Purpose**: Converts canvas to image data in various formats

**Interface**:
```typescript
interface ConversionOptions {
  format: 'png' | 'jpeg'
  quality?: number // 0-1 for JPEG
  maxDimension?: number
}

class CanvasConverter {
  static toDataURL(
    canvas: HTMLCanvasElement,
    options: ConversionOptions
  ): string
  
  static toBlob(
    canvas: HTMLCanvasElement,
    options: ConversionOptions
  ): Promise<Blob>
  
  static scaleCanvas(
    canvas: HTMLCanvasElement,
    maxDimension: number
  ): HTMLCanvasElement
}
```

**Conversion Methods**:

**PNG Conversion**:
- Use `canvas.toDataURL('image/png')`
- Lossless compression
- Supports transparency
- Larger file size

**JPEG Conversion**:
- Use `canvas.toDataURL('image/jpeg', quality)`
- Lossy compression
- No transparency support
- Smaller file size
- Quality: 0.92 (92%) default

**Scaling**:
- Check if canvas exceeds maxDimension
- Scale down proportionally if needed
- Use bicubic interpolation
- Maintain aspect ratio

### 3. FormatOptimizer

**Purpose**: Optimizes image data for specific formats

**Interface**:
```typescript
interface OptimizationResult {
  dataUrl: string
  fileSize: number
  dimensions: { width: number; height: number }
  actualQuality: number
}

class FormatOptimizer {
  static optimizePNG(dataUrl: string): OptimizationResult
  static optimizeJPEG(dataUrl: string, quality: number): OptimizationResult
  static estimateFileSize(dataUrl: string): number
  static compareQuality(original: string, compressed: string): number
}
```

**PNG Optimization**:
- No additional optimization (browser handles it)
- Estimate file size from data URL length
- Return original data URL

**JPEG Optimization**:
- Apply specified quality level
- Ensure quality is between 0.5 and 1.0
- Default to 0.92 for good balance
- Estimate file size from data URL length

**File Size Estimation**:
```typescript
function estimateFileSize(dataUrl: string): number {
  // Remove data URL prefix
  const base64 = dataUrl.split(',')[1]
  // Base64 is ~33% larger than binary
  return Math.ceil(base64.length * 0.75)
}
```

### 4. FilenameGenerator

**Purpose**: Generates descriptive filenames for exports

**Interface**:
```typescript
interface FilenameOptions {
  format: 'png' | 'jpeg'
  watermarked: boolean
  timestamp?: Date
  customText?: string
}

class FilenameGenerator {
  static generate(options: FilenameOptions): string
  static sanitize(filename: string): string
  static ensureUnique(filename: string): string
}
```

**Filename Format**:
- Base: `caption-art`
- Timestamp: `YYYYMMDD-HHMMSS`
- Watermark suffix: `-watermarked` (if applicable)
- Extension: `.png` or `.jpg`
- Example: `caption-art-20250127-143022-watermarked.png`

**Sanitization**:
- Remove special characters
- Replace spaces with hyphens
- Limit length to 255 characters
- Ensure filesystem compatibility

### 5. DownloadTrigger

**Purpose**: Initiates browser download of generated image

**Interface**:
```typescript
interface DownloadOptions {
  filename: string
  dataUrl?: string
  blob?: Blob
  mimeType: string
}

class DownloadTrigger {
  static trigger(options: DownloadOptions): void
  static createDownloadLink(dataUrl: string, filename: string): HTMLAnchorElement
  static revokeObjectURL(url: string): void
}
```

**Download Methods**:

**Method 1: Data URL (Simple)**:
```typescript
const a = document.createElement('a')
a.href = dataUrl
a.download = filename
a.click()
```

**Method 2: Blob (Better for large files)**:
```typescript
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = filename
a.click()
URL.revokeObjectURL(url)
```

**Fallback**:
- If download blocked, open in new tab
- Provide manual save instructions
- Log error for debugging

## Data Models

### ExportState

```typescript
interface ExportState {
  isExporting: boolean
  progress: ExportProgress | null
  lastExport: ExportResult | null
  error: string | null
}
```

### FormatSettings

```typescript
interface FormatSettings {
  png: {
    supported: boolean
    maxSize: number
    compression: 'default'
  }
  jpeg: {
    supported: boolean
    maxSize: number
    quality: number
    minQuality: number
    maxQuality: number
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Format extension matching
*For any* export with format F, the generated filename should end with the correct extension (.png for PNG, .jpg for JPEG)
**Validates: Requirements 2.5**

### Property 2: Quality parameter application
*For any* JPEG export with quality Q, the canvas.toDataURL call should receive quality parameter Q
**Validates: Requirements 2.4, 3.4**

### Property 3: Aspect ratio preservation
*For any* canvas with aspect ratio R, after scaling to maxDimension, the exported image aspect ratio should equal R within 0.01 tolerance
**Validates: Requirements 3.1**

### Property 4: Maximum dimension enforcement
*For any* canvas with width W or height H exceeding 1080px, the exported image should have max(width, height) ≤ 1080px
**Validates: Requirements 3.1, 3.2**

### Property 5: Filename timestamp uniqueness
*For any* two exports performed at different times, the generated filenames should be different (due to timestamp)
**Validates: Requirements 4.5**

### Property 6: Watermark suffix presence
*For any* free tier export, the filename should contain "-watermarked" before the extension
**Validates: Requirements 4.3**

### Property 7: Export timing (standard images)
*For any* canvas with dimensions ≤ 1920×1080, the export should complete within 2 seconds
**Validates: Requirements 5.1**

### Property 8: Export timing (large images)
*For any* canvas with dimensions > 1920×1080, the export should complete within 5 seconds
**Validates: Requirements 5.2**

### Property 9: Progress stage sequence
*For any* export, the progress stages should occur in order: preparing → watermarking (if needed) → converting → downloading → complete
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 10: Layer inclusion completeness
*For any* canvas with background, text, and mask layers, the exported image should include all visible layers
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 11: Download trigger success
*For any* successful export, a browser download should be initiated (or fallback to new tab if blocked)
**Validates: Requirements 1.4**

### Property 12: Error message clarity
*For any* export failure, the error message should be user-friendly and actionable (no technical jargon)
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

## Error Handling

### Canvas Validation Errors

**No Canvas Content**:
- Check if canvas is empty
- Display: "Please upload an image before exporting."
- Disable export button until image loaded

**Invalid Canvas State**:
- Check if canvas context is available
- Display: "Canvas error. Please refresh and try again."
- Log error to console

### Conversion Errors

**toDataURL Failure**:
- Catch exceptions from canvas.toDataURL()
- Display: "Failed to generate image. Please try again."
- Possible causes: memory limit, security restriction
- Offer retry option

**toBlob Failure**:
- Catch exceptions from canvas.toBlob()
- Fall back to toDataURL method
- Display: "Using alternative export method..."

**Memory Limit Exceeded**:
- Detect if canvas is too large
- Display: "Image too large to export. Try reducing size."
- Suggest scaling down

### Download Errors

**Download Blocked**:
- Detect if download was blocked by browser
- Display: "Download blocked. Please check browser settings."
- Offer alternative: open in new tab

**Filesystem Error**:
- Catch download failures
- Display: "Unable to save file. Please try again."
- Check available disk space (if possible)

**Filename Conflict**:
- Ensure unique filenames with timestamp
- If conflict, append counter: `-1`, `-2`, etc.

### Format Errors

**Unsupported Format**:
- Validate format is 'png' or 'jpeg'
- Display: "Unsupported format. Using PNG."
- Fall back to PNG

**Quality Out of Range**:
- Clamp quality to 0.5-1.0 range
- Display warning if clamped
- Proceed with clamped value

## Testing Strategy

### Unit Tests

**Exporter**:
- Test full export pipeline
- Test progress reporting
- Test abort functionality
- Test error handling

**CanvasConverter**:
- Test PNG conversion
- Test JPEG conversion with various qualities
- Test canvas scaling
- Test aspect ratio preservation

**FormatOptimizer**:
- Test PNG optimization
- Test JPEG optimization
- Test file size estimation
- Test quality comparison

**FilenameGenerator**:
- Test filename format
- Test timestamp inclusion
- Test watermark suffix
- Test sanitization
- Test uniqueness

**DownloadTrigger**:
- Test download link creation
- Test download trigger
- Test object URL cleanup
- Test fallback methods

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

**Property 1: Format extension matching**
- Generate random formats (png/jpeg)
- Generate filenames
- Verify extension matches format

**Property 2: Quality parameter application**
- Generate random quality values (0.5-1.0)
- Mock canvas.toDataURL
- Verify quality parameter passed correctly

**Property 3: Aspect ratio preservation**
- Generate random canvas dimensions
- Scale to maxDimension
- Calculate aspect ratios
- Verify match within tolerance

**Property 4: Maximum dimension enforcement**
- Generate random large canvas dimensions
- Export with maxDimension=1080
- Verify max(width, height) ≤ 1080

**Property 5: Filename timestamp uniqueness**
- Generate exports at different times
- Collect filenames
- Verify all unique

**Property 6: Watermark suffix presence**
- Generate random exports with watermark=true
- Check filenames
- Verify "-watermarked" present

**Property 7: Export timing (standard images)**
- Generate random standard-sized canvases
- Measure export time
- Verify < 2 seconds

**Property 8: Export timing (large images)**
- Generate random large canvases
- Measure export time
- Verify < 5 seconds

**Property 9: Progress stage sequence**
- Generate random exports
- Track progress stages
- Verify correct order

**Property 10: Layer inclusion completeness**
- Generate random multi-layer canvases
- Export and analyze pixels
- Verify all layers present

**Property 11: Download trigger success**
- Generate random exports
- Mock download trigger
- Verify called with correct parameters

**Property 12: Error message clarity**
- Generate random error conditions
- Capture error messages
- Verify user-friendly (no stack traces)

### Integration Tests

**Full Export Flow (PNG)**:
- Create canvas with content
- Export as PNG
- Verify file downloads
- Verify format is PNG
- Verify content matches canvas

**Full Export Flow (JPEG)**:
- Create canvas with content
- Export as JPEG with quality 0.92
- Verify file downloads
- Verify format is JPEG
- Verify quality applied

**Watermark Integration**:
- Create canvas with content
- Export with watermark=true
- Verify watermark present in image
- Verify filename has "-watermarked"

**Scaling Integration**:
- Create large canvas (2000×2000)
- Export with maxDimension=1080
- Verify scaled down
- Verify aspect ratio preserved

**Progress Reporting**:
- Create canvas with content
- Export with progress callback
- Verify all stages reported
- Verify progress values increase

**Error Recovery**:
- Simulate various errors
- Verify error messages displayed
- Verify system recovers gracefully
- Verify retry works

## Implementation Notes

### Canvas to Data URL

**PNG Export**:
```typescript
function exportPNG(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}
```

**JPEG Export**:
```typescript
function exportJPEG(canvas: HTMLCanvasElement, quality: number = 0.92): string {
  return canvas.toDataURL('image/jpeg', quality)
}
```

### Canvas Scaling

```typescript
function scaleCanvas(
  canvas: HTMLCanvasElement,
  maxDimension: number
): HTMLCanvasElement {
  const { width, height } = canvas
  
  // Check if scaling needed
  if (width <= maxDimension && height <= maxDimension) {
    return canvas
  }
  
  // Calculate scale factor
  const scale = maxDimension / Math.max(width, height)
  const newWidth = Math.round(width * scale)
  const newHeight = Math.round(height * scale)
  
  // Create scaled canvas
  const scaledCanvas = document.createElement('canvas')
  scaledCanvas.width = newWidth
  scaledCanvas.height = newHeight
  
  const ctx = scaledCanvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // Draw scaled image
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight)
  
  return scaledCanvas
}
```

### Filename Generation

```typescript
function generateFilename(
  format: 'png' | 'jpeg',
  watermarked: boolean
): string {
  const now = new Date()
  
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`
  const watermarkSuffix = watermarked ? '-watermarked' : ''
  const extension = format === 'png' ? 'png' : 'jpg'
  
  return `caption-art-${timestamp}${watermarkSuffix}.${extension}`
}
```

### Download Trigger

```typescript
function triggerDownload(dataUrl: string, filename: string): void {
  try {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    
    // Append to body (required for Firefox)
    document.body.appendChild(a)
    
    // Trigger download
    a.click()
    
    // Cleanup
    document.body.removeChild(a)
  } catch (error) {
    console.error('Download failed:', error)
    
    // Fallback: open in new tab
    window.open(dataUrl, '_blank')
  }
}
```

### Progress Reporting

```typescript
async function exportWithProgress(
  canvas: HTMLCanvasElement,
  config: ExportConfig,
  onProgress: (progress: ExportProgress) => void
): Promise<ExportResult> {
  // Stage 1: Preparing
  onProgress({
    stage: 'preparing',
    progress: 0,
    message: 'Preparing image...'
  })
  
  await sleep(100) // Allow UI update
  
  // Stage 2: Watermarking (if needed)
  if (config.watermark) {
    onProgress({
      stage: 'watermarking',
      progress: 25,
      message: 'Applying watermark...'
    })
    
    applyWatermark(canvas, config.watermarkText)
    await sleep(100)
  }
  
  // Stage 3: Converting
  onProgress({
    stage: 'converting',
    progress: 50,
    message: 'Converting to image...'
  })
  
  const dataUrl = canvas.toDataURL(
    config.format === 'png' ? 'image/png' : 'image/jpeg',
    config.quality
  )
  await sleep(100)
  
  // Stage 4: Downloading
  onProgress({
    stage: 'downloading',
    progress: 75,
    message: 'Starting download...'
  })
  
  const filename = generateFilename(config.format, config.watermark)
  triggerDownload(dataUrl, filename)
  await sleep(100)
  
  // Stage 5: Complete
  onProgress({
    stage: 'complete',
    progress: 100,
    message: 'Export complete!'
  })
  
  return {
    success: true,
    filename,
    fileSize: estimateFileSize(dataUrl),
    format: config.format,
    error: null
  }
}
```

### File Size Estimation

```typescript
function estimateFileSize(dataUrl: string): number {
  // Remove data URL prefix (e.g., "data:image/png;base64,")
  const base64 = dataUrl.split(',')[1]
  
  // Base64 encoding increases size by ~33%
  // So actual binary size is ~75% of base64 length
  const binarySize = Math.ceil(base64.length * 0.75)
  
  return binarySize
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

### Performance Optimization

- Use `requestAnimationFrame` for smooth progress updates
- Debounce rapid export requests
- Use Web Workers for large image processing (if needed)
- Cache scaled canvases temporarily
- Clean up object URLs promptly
- Limit concurrent exports to 1

### Browser Compatibility

- Use standard Canvas API (widely supported)
- Test `toDataURL` and `toBlob` support
- Provide fallbacks for older browsers
- Test download trigger in all browsers
- Handle browser-specific quirks (Firefox, Safari)

### Accessibility

- Announce export progress to screen readers
- Provide loading indicators
- Use semantic HTML for export button
- Ensure keyboard navigation works
- Provide clear success/error messages

### User Experience

- Show progress during export
- Disable export button while exporting
- Provide cancel option for long exports
- Show file size estimate before export
- Confirm successful download
- Provide retry option on failure

### Memory Management

- Clean up temporary canvases
- Revoke object URLs after use
- Limit canvas size to prevent memory issues
- Monitor memory usage in dev tools
- Provide warnings for very large exports

### Security Considerations

- Validate canvas content before export
- Sanitize filenames to prevent injection
- Handle CORS properly for images
- Don't expose sensitive data in filenames
- Respect browser security restrictions
