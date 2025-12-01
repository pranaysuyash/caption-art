# Design Document - Canvas Text Compositing Engine

## Overview

This design document outlines the technical approach for the Canvas Text Compositing Engine, which renders styled text overlays on images with a "text behind subject" effect using HTML5 Canvas API. The engine handles layer compositing, text styling, transform controls, and export functionality.

The system uses a three-layer compositing approach:
1. Background image layer
2. Text layer with style presets
3. Subject mask layer (optional, for text-behind effect)

## Architecture

### Component Structure

```
frontend/src/
├── lib/
│   ├── canvas/
│   │   ├── compositor.ts          # Main compositing engine
│   │   ├── textRenderer.ts        # Text styling and rendering
│   │   ├── layerManager.ts        # Layer management
│   │   ├── transformController.ts # Position/scale/rotation
│   │   └── exporter.ts            # Canvas-to-image export
│   └── utils/
│       ├── imageLoader.ts         # Image loading utilities
│       └── canvasUtils.ts         # Canvas helper functions
└── components/
    ├── CanvasEditor.tsx           # Main canvas component
    ├── TransformControls.tsx      # UI for transforms
    └── StylePresetSelector.tsx    # Preset selection UI
```

### Data Flow

```
User Input → Transform Controller → Text Renderer → Layer Manager → Compositor → Canvas Display
                                                                                      ↓
                                                                                  Exporter → Download
```

## Components and Interfaces

### 1. Compositor

**Purpose**: Orchestrates the rendering of all layers onto the canvas

**Interface**:
```typescript
interface CompositorConfig {
  canvas: HTMLCanvasElement
  backgroundImage: HTMLImageElement
  maskImage?: HTMLImageElement
  maxDimension: number // 1080px default
}

class Compositor {
  constructor(config: CompositorConfig)
  
  render(textLayer: TextLayer): void
  clear(): void
  getDataURL(format: 'png' | 'jpeg', quality?: number): string
  getScaleFactor(): number
}
```

**Behavior**:
- Scales canvas to fit viewport while maintaining aspect ratio
- Composites layers in correct order
- Applies blend modes for text-behind effect
- Debounces re-renders for performance

### 2. TextRenderer

**Purpose**: Renders text with applied style presets

**Interface**:
```typescript
type StylePreset = 'neon' | 'magazine' | 'brush' | 'emboss'

interface TextStyle {
  font: string
  fillStyle: string
  strokeStyle?: string
  lineWidth?: number
  shadows?: Array<{ blur: number; color: string }>
  shadow?: { x: number; y: number; blur: number; color: string }
}

class TextRenderer {
  static getStyle(preset: StylePreset, fontSize: number): TextStyle
  
  renderText(
    ctx: CanvasRenderingContext2D,
    text: string,
    style: TextStyle,
    transform: Transform
  ): void
}
```

**Style Presets**:
- **Neon**: White text with cyan glow (multiple shadow layers)
- **Magazine**: Bold serif with thick white stroke
- **Brush**: Cursive script with textured appearance
- **Emboss**: Sans-serif with offset shadow for 3D effect

### 3. LayerManager

**Purpose**: Manages the compositing of multiple canvas layers

**Interface**:
```typescript
interface Layer {
  type: 'background' | 'text' | 'mask'
  canvas: HTMLCanvasElement
  blendMode?: GlobalCompositeOperation
}

class LayerManager {
  addLayer(layer: Layer): void
  removeLayer(type: Layer['type']): void
  composite(targetCanvas: HTMLCanvasElement): void
  clear(): void
}
```

**Compositing Algorithm**:
1. Draw background image to base canvas
2. Draw text layer on top
3. If mask exists:
   - Create temporary canvas with mask
   - Use 'destination-out' blend mode to cut out subject
   - Draw result back to main canvas

### 4. TransformController

**Purpose**: Manages text position, scale, and rotation

**Interface**:
```typescript
interface Transform {
  x: number        // Position X (0-1 normalized)
  y: number        // Position Y (0-1 normalized)
  scale: number    // Scale factor (0.5-3.0)
  rotation: number // Rotation in degrees (0-360)
}

class TransformController {
  constructor(initialTransform: Transform)
  
  setPosition(x: number, y: number): void
  setScale(scale: number): void
  setRotation(degrees: number): void
  getTransform(): Transform
  applyToContext(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void
}
```

**Behavior**:
- Normalizes positions to 0-1 range for resolution independence
- Applies transforms in order: translate → rotate → scale
- Maintains transform state across re-renders

### 5. Exporter

**Purpose**: Converts canvas to downloadable image files

**Interface**:
```typescript
interface ExportOptions {
  format: 'png' | 'jpeg'
  quality?: number // 0-1 for JPEG
  watermark?: boolean
  watermarkText?: string
}

class Exporter {
  static export(canvas: HTMLCanvasElement, options: ExportOptions): void
  static applyWatermark(canvas: HTMLCanvasElement, text: string): void
  static generateFilename(format: string, watermarked: boolean): string
}
```

**Export Process**:
1. Get canvas data URL with specified format/quality
2. Apply watermark if needed (free tier)
3. Generate filename with timestamp
4. Trigger browser download

## Data Models

### TextLayer

```typescript
interface TextLayer {
  text: string
  preset: StylePreset
  fontSize: number
  transform: Transform
}
```

### CanvasState

```typescript
interface CanvasState {
  backgroundImage: HTMLImageElement | null
  maskImage: HTMLImageElement | null
  textLayer: TextLayer
  canvasRef: HTMLCanvasElement | null
  loading: boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Layer compositing order
*For any* canvas rendering with background, text, and mask layers, the final pixel at any coordinate should match the result of compositing in the order: background → text → mask cutout
**Validates: Requirements 4.2**

### Property 2: Transform preservation
*For any* transform values (position, scale, rotation), after applying to the canvas context and then reading back the transform matrix, the values should match the original within floating-point precision
**Validates: Requirements 3.4**

### Property 3: Resolution independence
*For any* canvas size and text position specified in normalized coordinates (0-1), the text should appear at the same relative position regardless of canvas dimensions
**Validates: Requirements 7.4**

### Property 4: Aspect ratio preservation
*For any* background image with aspect ratio R, after scaling to fit the canvas, the rendered image aspect ratio should equal R within 0.01 tolerance
**Validates: Requirements 7.1**

### Property 5: Export quality consistency
*For any* canvas content, exporting twice with the same format and quality settings should produce identical file sizes within 1% variance
**Validates: Requirements 5.2**

### Property 6: Watermark positioning
*For any* canvas dimensions, when a watermark is applied, it should be positioned at bottom-right with exactly 20px padding from both edges
**Validates: Requirements 5.4**

### Property 7: Text visibility bounds
*For any* text content and transform, all text pixels should fall within the canvas boundaries (no clipping beyond edges)
**Validates: Requirements 1.5**

### Property 8: Mask alpha preservation
*For any* subject mask with alpha channel, the composited result should preserve the mask's transparency values (no alpha clamping or quantization)
**Validates: Requirements 4.3**

### Property 9: Style preset consistency
*For any* style preset selection, the rendered text should match the preset's defined properties (font, color, shadows, strokes)
**Validates: Requirements 2.5**

### Property 10: Render performance
*For any* text property change (content, style, transform), the canvas should re-render and display the update within 100ms
**Validates: Requirements 8.3**

### Property 11: Auto-placement non-overlap
*For any* image with detected empty areas, auto-placed text should not overlap with high-contrast regions by more than 10% of text area
**Validates: Requirements 6.3**

### Property 12: Scale proportionality
*For any* scale factor S applied to text, the rendered text width and height should both scale by factor S within 2% tolerance
**Validates: Requirements 3.2**

## Error Handling

### Image Loading Errors
- Catch image load failures and display error message
- Provide retry mechanism for failed loads
- Validate image format before loading
- Handle CORS errors for external images

### Canvas Rendering Errors
- Wrap rendering in try-catch blocks
- Fall back to previous valid state on error
- Log rendering errors to console
- Display user-friendly error message

### Export Errors
- Handle toDataURL failures (memory limits, security)
- Validate canvas has content before export
- Catch download trigger failures
- Provide alternative export methods if primary fails

### Transform Validation
- Clamp scale values to valid range (0.5-3.0)
- Normalize rotation to 0-360 degrees
- Validate position coordinates are within 0-1
- Prevent NaN or Infinity values

## Testing Strategy

### Unit Tests

**TextRenderer**:
- Test each style preset returns correct TextStyle object
- Test font size scaling with different values
- Test shadow array generation for neon preset
- Test stroke style application for magazine preset

**TransformController**:
- Test position normalization to 0-1 range
- Test scale clamping to valid range
- Test rotation normalization to 0-360
- Test transform matrix application

**Compositor**:
- Test canvas scaling maintains aspect ratio
- Test layer compositing order
- Test blend mode application
- Test clear operation

**Exporter**:
- Test filename generation with timestamp
- Test watermark text rendering
- Test format conversion (PNG/JPEG)
- Test quality parameter application

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

**Property 1: Layer compositing order**
- Generate random background, text, and mask images
- Composite layers
- Sample random pixels and verify they match expected compositing result

**Property 2: Transform preservation**
- Generate random transform values
- Apply to canvas context
- Read back transform matrix
- Verify values match within epsilon

**Property 3: Resolution independence**
- Generate random canvas sizes and normalized positions
- Render text at each size
- Verify relative position is consistent

**Property 4: Aspect ratio preservation**
- Generate random image dimensions
- Scale to fit canvas
- Calculate rendered aspect ratio
- Verify matches original within tolerance

**Property 5: Export quality consistency**
- Generate random canvas content
- Export twice with same settings
- Compare file sizes
- Verify within 1% variance

**Property 6: Watermark positioning**
- Generate random canvas dimensions
- Apply watermark
- Measure watermark position
- Verify 20px padding from bottom-right

**Property 7: Text visibility bounds**
- Generate random text and transforms
- Render to canvas
- Check all text pixels are within bounds

**Property 8: Mask alpha preservation**
- Generate random mask with varying alpha values
- Composite with text
- Sample alpha values in result
- Verify preservation

**Property 9: Style preset consistency**
- Generate random preset selections
- Render text
- Extract applied styles from canvas
- Verify match preset definitions

**Property 10: Render performance**
- Generate random text property changes
- Measure time from change to render complete
- Verify < 100ms

**Property 11: Auto-placement non-overlap**
- Generate random images with known empty areas
- Auto-place text
- Calculate overlap with high-contrast regions
- Verify < 10% overlap

**Property 12: Scale proportionality**
- Generate random scale factors
- Measure rendered text dimensions
- Verify both dimensions scale by same factor

### Integration Tests

**Full Rendering Pipeline**:
- Load image → render text → apply mask → export
- Verify each step produces expected output
- Test with various image sizes and formats

**Transform Interactions**:
- Apply multiple transforms in sequence
- Verify cumulative effect is correct
- Test edge cases (rotation + scale + position)

**Style Preset Switching**:
- Render text with each preset
- Switch between presets
- Verify styles update correctly

## Implementation Notes

### Canvas Performance Optimization

- Use `requestAnimationFrame` for smooth animations
- Debounce rapid re-renders (e.g., during slider drag)
- Cache rendered layers when possible
- Use offscreen canvas for complex operations
- Limit canvas size to 1080px max dimension

### Memory Management

- Clean up canvas references when unmounting
- Revoke object URLs after use
- Clear canvas before re-rendering
- Limit number of cached layers
- Monitor memory usage in dev tools

### Text Rendering Quality

- Use `imageSmoothingEnabled = true` for better quality
- Set `imageSmoothingQuality = 'high'` when available
- Use appropriate font sizes for canvas resolution
- Apply anti-aliasing for smooth text edges

### Mask Compositing Algorithm

```typescript
// Pseudo-code for text-behind effect
1. Draw background to canvas
2. Draw text layer to canvas
3. Create temporary canvas with mask
4. Use globalCompositeOperation = 'destination-out'
5. Draw mask to cut out subject area
6. Result: text appears behind subject
```

### Auto-Placement Algorithm

```typescript
// Pseudo-code for finding empty areas
1. Convert image to grayscale
2. Calculate gradient magnitude (edge detection)
3. Divide into grid cells
4. Score each cell by average gradient (lower = emptier)
5. Find largest contiguous low-gradient region
6. Position text center in that region
```

### Browser Compatibility

- Use standard Canvas API (widely supported)
- Test in Chrome, Firefox, Safari
- Handle vendor-specific quirks
- Provide fallbacks for older browsers
- Test on mobile browsers (iOS Safari, Chrome Android)

### Accessibility

- Provide text alternatives for canvas content
- Ensure keyboard navigation for controls
- Use ARIA labels for transform sliders
- Announce state changes to screen readers
- Support high contrast mode

### Performance Targets

- Initial render: < 200ms
- Re-render on change: < 100ms
- Export generation: < 2s for standard images
- Memory usage: < 100MB for typical images
- 60fps during animations
