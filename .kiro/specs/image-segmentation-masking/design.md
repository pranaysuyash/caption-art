# Design Document - Image Segmentation and Masking System

## Overview

This design document outlines the technical approach for the Image Segmentation and Masking System, which uses the rembg (remove background) model via Replicate API to generate subject masks for the "text behind subject" effect. The system identifies foreground subjects, generates alpha channel masks, and provides them to the Canvas Compositing Engine.

The segmentation pipeline:
1. Image upload → Base64 encoding
2. Rembg model inference via Replicate API
3. Alpha mask generation
4. Mask download and validation
5. Mask delivery to compositor

## Architecture

### Component Structure

```
frontend/src/
├── lib/
│   ├── segmentation/
│   │   ├── maskGenerator.ts       # Main mask generation orchestrator
│   │   ├── rembgClient.ts         # Replicate rembg API client
│   │   ├── maskProcessor.ts       # Mask validation and processing
│   │   ├── maskCache.ts           # Caching layer for masks
│   │   └── maskPreview.ts         # Mask visualization utilities
│   └── utils/
│       ├── imageLoader.ts         # Image loading utilities
│       └── alphaChannel.ts        # Alpha channel manipulation
└── components/
    ├── MaskGenerator.tsx          # Main mask UI
    ├── MaskPreview.tsx            # Mask visualization toggle
    └── RegenerateMaskButton.tsx   # Regeneration control
```

### Data Flow

```
Image File → Base64 Encoder → Replicate rembg API → Alpha Mask URL
                                                          ↓
                                                    Mask Downloader → Validation
                                                          ↓
                                                    Mask Cache → Canvas Compositor
```

### API Integration Architecture

```
Frontend (Browser)
    ↓
Replicate API (rembg Model)
    - Model: cjwbw/rembg
    - Input: Base64 image data
    - Output: PNG with alpha channel (mask URL)
    ↓
Mask Downloader
    - Fetch mask image from URL
    - Validate alpha channel
    - Convert to ImageData
    ↓
Canvas Compositor
    - Use mask for text-behind effect
```

## Components and Interfaces

### 1. MaskGenerator

**Purpose**: Orchestrates the mask generation pipeline

**Interface**:
```typescript
interface MaskGeneratorConfig {
  replicateApiKey: string
  maxRetries: number
  timeout: number
  cacheEnabled: boolean
}

interface MaskResult {
  maskUrl: string
  maskImage: HTMLImageElement
  generationTime: number
  quality: 'high' | 'medium' | 'low'
}

class MaskGenerator {
  constructor(config: MaskGeneratorConfig)
  
  async generate(imageDataUrl: string): Promise<MaskResult>
  async regenerate(imageDataUrl: string): Promise<MaskResult>
  abort(): void
  clearCache(): void
}
```

**Behavior**:
- Validates image format before processing
- Calls Replicate API for mask generation
- Polls for rembg model completion
- Downloads and validates mask image
- Caches mask for reuse
- Handles errors and timeouts gracefully

### 2. RembgClient

**Purpose**: Manages communication with Replicate rembg API

**Interface**:
```typescript
interface RembgPrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed'
  output?: string // URL to mask PNG
  error?: string
  metrics?: {
    predict_time: number
  }
}

class RembgClient {
  constructor(apiKey: string)
  
  async createPrediction(imageDataUrl: string): Promise<RembgPrediction>
  async getPrediction(predictionId: string): Promise<RembgPrediction>
  async waitForCompletion(predictionId: string, timeout: number): Promise<string>
  cancelPrediction(predictionId: string): Promise<void>
}
```

**Rembg Model Configuration**:
- Model version: `cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003`
- Input: Base64 data URL or public URL
- Output: PNG with alpha channel (transparent background)
- Polling interval: 1000ms
- Max polling attempts: 45 (45 seconds)

**Behavior**:
- Creates prediction with image input
- Polls status until completion or timeout
- Extracts mask URL from output
- Handles API errors and rate limits
- Implements exponential backoff on retries

### 3. MaskProcessor

**Purpose**: Validates and processes mask images

**Interface**:
```typescript
interface MaskValidation {
  isValid: boolean
  hasAlphaChannel: boolean
  dimensions: { width: number; height: number }
  quality: 'high' | 'medium' | 'low'
  errors: string[]
}

class MaskProcessor {
  static async validate(maskImage: HTMLImageElement): Promise<MaskValidation>
  static async extractAlphaChannel(maskImage: HTMLImageElement): Promise<ImageData>
  static async assessQuality(maskImage: HTMLImageElement): Promise<'high' | 'medium' | 'low'>
  static async refine(maskImage: HTMLImageElement): Promise<HTMLImageElement>
}
```

**Validation Checks**:
- Verify PNG format with alpha channel
- Check dimensions match original image
- Validate alpha values are not all 0 or 255
- Detect edge quality (smooth vs jagged)
- Check for artifacts or noise

**Quality Assessment**:
- **High**: Clean edges, smooth gradients, minimal noise
- **Medium**: Some edge roughness, acceptable gradients
- **Low**: Jagged edges, artifacts, poor separation

**Refinement Operations**:
- Gaussian blur for edge smoothing (optional)
- Morphological operations (dilate/erode) for cleanup
- Threshold adjustment for better separation

### 4. MaskCache

**Purpose**: Caches generated masks to avoid redundant API calls

**Interface**:
```typescript
interface MaskCacheEntry {
  imageHash: string
  maskResult: MaskResult
  timestamp: number
}

class MaskCache {
  constructor(maxSize: number, ttl: number)
  
  set(imageHash: string, result: MaskResult): void
  get(imageHash: string): MaskResult | null
  has(imageHash: string): boolean
  clear(): void
  prune(): void
  getStats(): { hits: number; misses: number; size: number }
}
```

**Caching Strategy**:
- Hash images using SHA-256 of first 10KB
- Cache up to 30 entries (masks are large)
- TTL: 2 hours
- LRU eviction policy
- Store mask URL and ImageData
- Clear on page refresh

### 5. MaskPreview

**Purpose**: Provides visualization utilities for mask preview

**Interface**:
```typescript
interface PreviewOptions {
  mode: 'overlay' | 'side-by-side' | 'checkerboard'
  opacity: number
  colorize: boolean
}

class MaskPreview {
  static renderOverlay(
    canvas: HTMLCanvasElement,
    originalImage: HTMLImageElement,
    maskImage: HTMLImageElement,
    options: PreviewOptions
  ): void
  
  static renderSideBySide(
    canvas: HTMLCanvasElement,
    originalImage: HTMLImageElement,
    maskImage: HTMLImageElement
  ): void
  
  static renderCheckerboard(
    canvas: HTMLCanvasElement,
    maskImage: HTMLImageElement
  ): void
}
```

**Preview Modes**:
- **Overlay**: Show mask as colored overlay on original
- **Side-by-side**: Original on left, mask on right
- **Checkerboard**: Mask on transparent checkerboard background

## Data Models

### MaskState

```typescript
interface MaskState {
  status: 'idle' | 'generating' | 'complete' | 'error'
  maskUrl: string | null
  maskImage: HTMLImageElement | null
  quality: 'high' | 'medium' | 'low' | null
  error: string | null
  progress: number // 0-100
  previewEnabled: boolean
  textBehindEnabled: boolean
}
```

### SegmentationError

```typescript
interface SegmentationError {
  type: 'replicate' | 'download' | 'validation' | 'network' | 'timeout'
  message: string
  retryable: boolean
  retryAfter?: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Alpha channel presence
*For any* successfully generated mask, the image should have an alpha channel with at least one pixel having alpha value between 1 and 254 (not fully opaque or transparent everywhere)
**Validates: Requirements 1.4**

### Property 2: Dimension matching
*For any* original image with dimensions W×H, the generated mask should have dimensions W×H (exact match)
**Validates: Requirements 2.4**

### Property 3: Mask URL validity
*For any* successful mask generation, the returned mask URL should be a valid HTTP(S) URL that returns a PNG image when fetched
**Validates: Requirements 1.2, 1.3**

### Property 4: Timeout enforcement
*For any* mask generation request, if the response time exceeds 60 seconds, an error should be thrown within 1 second of timeout
**Validates: Requirements 3.1, 3.3**

### Property 5: Cache hit consistency
*For any* image that has been processed before, if the cache contains a valid entry, the returned mask should be identical to the cached mask
**Validates: Requirements 6.3**

### Property 6: Regeneration independence
*For any* image, regenerating the mask should bypass the cache and call the API again
**Validates: Requirements 6.1, 6.2**

### Property 7: Preview mode preservation
*For any* preview mode toggle, the underlying mask data should remain unchanged (only visualization changes)
**Validates: Requirements 4.4**

### Property 8: Text-behind effect toggle
*For any* text-behind effect toggle, when disabled, the canvas should render text on top of the image; when enabled, text should appear behind the subject
**Validates: Requirements 8.1, 8.2, 8.5**

### Property 9: Edge quality preservation
*For any* mask with complex boundaries (hair, fur), the alpha channel should preserve fine details with gradual transitions (not binary 0/255)
**Validates: Requirements 2.2, 2.5**

### Property 10: Multi-subject inclusion
*For any* image with multiple foreground subjects, all subjects should be included in the mask (alpha > 128 for all subject pixels)
**Validates: Requirements 2.3**

### Property 11: Error message clarity
*For any* error condition, the error message should be user-friendly and actionable (no raw API errors)
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 12: Format compatibility
*For any* supported image format (JPG, PNG), the mask generation should succeed and produce a valid PNG mask
**Validates: Requirements 7.1, 7.2, 7.4**

## Error Handling

### Replicate API Errors

**Connection Failures**:
- Retry up to 3 times with exponential backoff
- Display: "Unable to connect to mask service. Retrying..."
- After max retries: "Mask generation unavailable. Please try again later."

**Rate Limiting**:
- Parse `Retry-After` header
- Display: "Too many requests. Please wait {seconds} seconds."
- Disable regenerate button until retry time passes

**Model Failures**:
- Log error details to console
- Display: "Mask generation failed. Text will appear on top of image."
- Offer regenerate option
- Allow continuing without mask

**Timeout**:
- Cancel pending request
- Display: "Mask generation timed out. Please try again."
- Offer regenerate option

**No Subject Detected**:
- Display: "No subject detected. Text will appear on top of image."
- Disable text-behind effect
- Allow continuing without mask

### Mask Download Errors

**Network Failures**:
- Retry download up to 2 times
- Display: "Downloading mask..."
- After failures: "Unable to download mask. Please try again."

**CORS Errors**:
- Log to console for debugging
- Display: "Unable to load mask. Please try again."
- Offer regenerate option

**Invalid Image**:
- Validate downloaded data is valid PNG
- Display: "Invalid mask received. Please regenerate."
- Offer regenerate option

### Validation Errors

**Missing Alpha Channel**:
- Display: "Mask is invalid (no transparency). Please regenerate."
- Offer regenerate option

**Dimension Mismatch**:
- Display: "Mask dimensions don't match image. Please regenerate."
- Offer regenerate option

**All Transparent**:
- Display: "No subject detected in mask. Text will appear on top."
- Disable text-behind effect

**All Opaque**:
- Display: "Mask is invalid (no transparency). Please regenerate."
- Offer regenerate option

### Input Validation Errors

**Invalid Image Format**:
- Check file type before processing
- Display: "Unsupported image format. Please use JPG or PNG."

**Image Too Large**:
- Check file size (max 10MB)
- Display: "Image too large. Please use an image under 10MB."

**Corrupted Image**:
- Validate image loads correctly
- Display: "Invalid image file. Please try another."

## Testing Strategy

### Unit Tests

**MaskGenerator**:
- Test successful generation flow
- Test error handling
- Test timeout behavior
- Test abort functionality
- Test cache integration

**RembgClient**:
- Test prediction creation
- Test polling logic
- Test completion detection
- Test error parsing
- Test cancellation

**MaskProcessor**:
- Test alpha channel validation
- Test dimension checking
- Test quality assessment
- Test refinement operations

**MaskCache**:
- Test cache hit/miss
- Test LRU eviction
- Test TTL expiration
- Test cache clearing
- Test stats tracking

**MaskPreview**:
- Test overlay rendering
- Test side-by-side rendering
- Test checkerboard rendering
- Test opacity control

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

**Property 1: Alpha channel presence**
- Generate random images
- Generate masks
- Extract alpha channel
- Verify at least one pixel has 1 ≤ alpha ≤ 254

**Property 2: Dimension matching**
- Generate random image dimensions
- Generate masks
- Compare dimensions
- Verify exact match

**Property 3: Mask URL validity**
- Generate random images
- Generate masks
- Fetch mask URL
- Verify valid PNG returned

**Property 4: Timeout enforcement**
- Mock API with random delays
- Set various timeout values
- Verify error thrown within 1s of timeout

**Property 5: Cache hit consistency**
- Generate random images
- Generate masks (cache miss)
- Generate again (cache hit)
- Verify masks are identical

**Property 6: Regeneration independence**
- Generate random images
- Generate masks
- Regenerate masks
- Verify API called again (not cached)

**Property 7: Preview mode preservation**
- Generate random masks
- Toggle preview modes
- Verify mask data unchanged

**Property 8: Text-behind effect toggle**
- Generate random masks
- Toggle effect on/off
- Verify canvas rendering changes appropriately

**Property 9: Edge quality preservation**
- Generate images with complex edges
- Generate masks
- Sample edge pixels
- Verify gradual alpha transitions (not binary)

**Property 10: Multi-subject inclusion**
- Generate images with multiple subjects
- Generate masks
- Verify all subjects have alpha > 128

**Property 11: Error message clarity**
- Generate random error conditions
- Capture error messages
- Verify no stack traces or raw API errors

**Property 12: Format compatibility**
- Generate random JPG and PNG images
- Generate masks for each
- Verify all succeed with valid PNG masks

### Integration Tests

**Full Generation Pipeline**:
- Upload real image
- Generate mask
- Validate mask quality
- Apply to canvas
- Verify text-behind effect works

**API Integration**:
- Test with real Replicate API
- Verify responses are valid
- Verify error handling works
- Test with various image types

**Cache Integration**:
- Generate mask for image
- Clear UI but keep cache
- Generate again
- Verify instant return from cache

**Preview Integration**:
- Generate mask
- Toggle preview modes
- Verify visualizations are correct
- Verify canvas updates properly

**Error Recovery**:
- Simulate network failures
- Verify retry logic works
- Verify user sees appropriate messages
- Verify system recovers gracefully

## Implementation Notes

### Rembg Model Details

**Model Capabilities**:
- Removes background from images
- Generates alpha channel mask
- Handles complex edges (hair, fur, glass)
- Works with various subjects (people, objects, animals)
- Processes images up to 4K resolution

**Model Limitations**:
- May struggle with very similar foreground/background colors
- Can have issues with reflections and shadows
- May not detect very small or distant subjects
- Processing time increases with image size

### Polling Strategy

**Rembg Polling**:
```typescript
async function pollForCompletion(predictionId: string): Promise<string> {
  const maxAttempts = 45
  const pollInterval = 1000 // 1 second
  
  for (let i = 0; i < maxAttempts; i++) {
    const prediction = await getPrediction(predictionId)
    
    if (prediction.status === 'succeeded') {
      return prediction.output // Mask URL
    }
    
    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Mask generation failed')
    }
    
    await sleep(pollInterval)
  }
  
  throw new Error('Timeout waiting for mask generation')
}
```

### Mask Download and Validation

```typescript
async function downloadAndValidateMask(maskUrl: string): Promise<HTMLImageElement> {
  // Download mask
  const response = await fetch(maskUrl)
  if (!response.ok) {
    throw new Error('Failed to download mask')
  }
  
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  
  // Load as image
  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = objectUrl
  })
  
  // Validate alpha channel
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const hasAlpha = validateAlphaChannel(imageData)
  
  if (!hasAlpha) {
    throw new Error('Mask has no alpha channel')
  }
  
  return img
}

function validateAlphaChannel(imageData: ImageData): boolean {
  const data = imageData.data
  let hasPartialAlpha = false
  
  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i]
    if (alpha > 0 && alpha < 255) {
      hasPartialAlpha = true
      break
    }
  }
  
  return hasPartialAlpha
}
```

### Quality Assessment Algorithm

```typescript
function assessMaskQuality(imageData: ImageData): 'high' | 'medium' | 'low' {
  const data = imageData.data
  let edgePixels = 0
  let smoothEdges = 0
  
  // Sample edge pixels (alpha between 10 and 245)
  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i]
    if (alpha > 10 && alpha < 245) {
      edgePixels++
      
      // Check if neighboring pixels have gradual transition
      const neighbors = getNeighborAlphas(imageData, i / 4)
      const isSmooth = neighbors.every(n => Math.abs(n - alpha) < 50)
      if (isSmooth) smoothEdges++
    }
  }
  
  if (edgePixels === 0) return 'low'
  
  const smoothRatio = smoothEdges / edgePixels
  
  if (smoothRatio > 0.8) return 'high'
  if (smoothRatio > 0.5) return 'medium'
  return 'low'
}
```

### Preview Rendering

**Overlay Mode**:
```typescript
function renderOverlay(
  canvas: HTMLCanvasElement,
  original: HTMLImageElement,
  mask: HTMLImageElement,
  opacity: number
) {
  const ctx = canvas.getContext('2d')!
  
  // Draw original
  ctx.drawImage(original, 0, 0, canvas.width, canvas.height)
  
  // Draw mask as colored overlay
  ctx.globalAlpha = opacity
  ctx.globalCompositeOperation = 'source-over'
  
  // Extract alpha and colorize
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const tempCtx = tempCanvas.getContext('2d')!
  
  tempCtx.drawImage(mask, 0, 0, canvas.width, canvas.height)
  const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
  
  // Colorize: red for subject, transparent for background
  for (let i = 0; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i + 3]
    imageData.data[i] = 255     // R
    imageData.data[i + 1] = 0   // G
    imageData.data[i + 2] = 0   // B
    imageData.data[i + 3] = alpha
  }
  
  tempCtx.putImageData(imageData, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0)
  
  ctx.globalAlpha = 1
}
```

### Performance Optimization

- Use `AbortController` for cancellable requests
- Implement request deduplication
- Cache masks aggressively (they're expensive to generate)
- Lazy load mask generation (only when text-behind effect is enabled)
- Prefetch masks in background after image upload
- Use Web Workers for mask processing (if needed)

### Browser Compatibility

- Use `fetch` API (widely supported)
- Polyfill `AbortController` for older browsers
- Handle CORS properly for mask downloads
- Test in Chrome, Firefox, Safari
- Test on mobile browsers

### Accessibility

- Announce mask generation status to screen readers
- Provide loading indicators
- Use semantic HTML for preview controls
- Ensure keyboard navigation works
- Provide skip option for slow connections

### Cost Optimization

- Cache aggressively to reduce API calls
- Only generate mask when text-behind effect is needed
- Provide option to disable mask generation
- Monitor API usage and set budgets
- Consider batch processing for multiple images

### Memory Management

- Revoke object URLs after use
- Clear canvas references when unmounting
- Limit cache size (masks are large)
- Monitor memory usage in dev tools
- Clean up temporary canvases
