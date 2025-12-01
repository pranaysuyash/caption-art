# Design Document - Compositor Mask Bug Fixes

## Overview

This design addresses three critical bugs in the canvas compositor that are blocking users:

1. **White Mask Silhouettes**: The compositor is showing white silhouettes instead of the original image when masks are applied
2. **Unconditional Mask Application**: Masks are being applied even when the text field is empty
3. **Aspect Ratio and Clipping Issues**: CSS and canvas dimension calculations are causing content to be clipped or distorted

The root causes have been identified through code analysis:

- **Bug #1**: The layerManager.composite() method is not properly preserving the background when applying the mask with destination-out blend mode
- **Bug #2**: The compositor.render() method applies masks regardless of whether text is present
- **Bug #3**: Canvas dimensions are being set without proper aspect ratio preservation, and CSS may be overriding calculated dimensions

## Architecture

The fix involves modifications to three core components:

1. **LayerManager** (`frontend/src/lib/canvas/layerManager.ts`)
   - Fix the compositing order and blend mode application
   - Ensure background is preserved when mask is applied

2. **Compositor** (`frontend/src/lib/canvas/compositor.ts`)
   - Add conditional logic to skip mask application when text is empty
   - Improve aspect ratio calculation and canvas dimension setting
   - Add validation for canvas dimensions

3. **App.tsx** (`frontend/src/App.tsx`)
   - Ensure CSS doesn't override canvas dimensions
   - Add defensive checks for empty text before rendering

## Components and Interfaces

### LayerManager Fixes

The current implementation has a flaw in the composite() method. The issue is that when we apply `destination-out` blend mode for the mask, we're cutting out from the entire canvas (background + text), but the background layer may not be properly drawn first.

**Current problematic flow:**
```typescript
// Step 1: Draw background
ctx.drawImage(backgroundLayer.canvas, 0, 0);

// Step 2: Draw text
ctx.drawImage(textLayer.canvas, 0, 0);

// Step 3: Apply mask with destination-out
ctx.globalCompositeOperation = 'destination-out';
ctx.drawImage(maskLayer.canvas, 0, 0);
```

**The problem**: After step 3, we've cut out the subject area from BOTH the background and text. But we need the background to show through in the cut-out area.

**Solution**: We need to composite in a different order:
1. Draw background to a temporary canvas
2. Draw text on top of background
3. Use the mask to cut out text (destination-out)
4. Draw the original background again in the cut-out areas (using the mask as a guide)

**Better approach**: Use a two-pass rendering strategy:
- Pass 1: Render background + text
- Pass 2: Use mask to cut out text, then composite background back in masked areas

### Compositor Fixes

**Issue #1 - Unconditional Mask Application**:

The current code in `render()` method:
```typescript
if (this.maskImage && this.textBehindEnabled) {
  // Always adds mask layer if mask exists
}
```

**Fix**: Add text presence check:
```typescript
if (this.maskImage && this.textBehindEnabled && textLayer.text.trim()) {
  // Only add mask layer if text is present
}
```

**Issue #2 - Aspect Ratio Preservation**:

The current `calculateScaleFactor()` and `updateCanvasDimensions()` methods need improvement:

```typescript
private calculateScaleFactor(): number {
  const imgWidth = this.backgroundImage.width;
  const imgHeight = this.backgroundImage.height;
  const maxDim = Math.max(imgWidth, imgHeight);

  if (maxDim > this.maxDimension) {
    return this.maxDimension / maxDim;
  }

  return 1;
}

private updateCanvasDimensions(): void {
  this.canvas.width = Math.round(this.backgroundImage.width * this.scaleFactor);
  this.canvas.height = Math.round(this.backgroundImage.height * this.scaleFactor);
}
```

**Fix**: Add validation and ensure CSS doesn't override:
```typescript
private updateCanvasDimensions(): void {
  const width = Math.round(this.backgroundImage.width * this.scaleFactor);
  const height = Math.round(this.backgroundImage.height * this.scaleFactor);
  
  // Validate dimensions
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid canvas dimensions: ${width}x${height}`);
  }
  
  // Set canvas dimensions
  this.canvas.width = width;
  this.canvas.height = height;
  
  // Ensure CSS doesn't override (set inline styles)
  this.canvas.style.width = `${width}px`;
  this.canvas.style.height = `${height}px`;
}
```

## Data Models

No new data models are required. The existing interfaces remain unchanged:

- `Layer` interface in layerManager.ts
- `CompositorConfig` interface in compositor.ts
- `TextLayer` interface in types.ts

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Background pixel preservation in masked areas

*For any* background image and mask, when the compositor renders with a mask, the pixels in the masked (subject) area should match the original background image pixels, not be white or any other color.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Mask application is conditional on text presence

*For any* compositor state, when text is empty (after trimming whitespace), the layer manager should not contain a mask layer, regardless of whether a mask image is available.

**Validates: Requirements 2.2**

### Property 3: Aspect ratio preservation across scaling

*For any* image with aspect ratio R, after the compositor scales it to fit maxDimension, the canvas aspect ratio should equal R within a small tolerance (accounting for rounding).

**Validates: Requirements 3.1, 3.2**

### Property 4: Canvas dimensions match scaled image

*For any* background image and scale factor, the canvas width and height should equal the image width and height multiplied by the scale factor (rounded to nearest integer).

**Validates: Requirements 3.3**

### Property 5: Viewport resize maintains aspect ratio

*For any* image, if the compositor is recreated with a different maxDimension, the aspect ratio of the canvas should remain equal to the original image aspect ratio.

**Validates: Requirements 3.5**

### Property 6: Alpha blending correctness

*For any* mask with partial transparency (alpha values between 0 and 255), the output should show smooth transitions between text and background, with no hard edges or artifacts.

**Validates: Requirements 4.1**

### Property 7: Mask scaling to match image

*For any* image and mask with different dimensions, the mask should be scaled to exactly match the canvas dimensions before being applied.

**Validates: Requirements 4.2**

### Property 8: Error state preservation

*For any* valid canvas state, if a rendering operation fails, the canvas should either show the previous valid state or be cleared, but never show a corrupted partial render.

**Validates: Requirements 4.4**

### Property 9: Render purity (no state modification)

*For any* compositor render call, the method should not modify any application state variables (like React state) directly, only canvas pixels.

**Validates: Requirements 5.1**

### Property 10: Layer operation purity

*For any* layer operation in LayerManager, the operation should only modify canvas contexts and not have side effects on external state.

**Validates: Requirements 5.2**

### Property 11: Error propagation without side effects

*For any* error that occurs during rendering, the error should be thrown to the caller without modifying any state (except for logging).

**Validates: Requirements 5.3**

### Property 12: Blend mode restoration

*For any* layer compositing operation that changes globalCompositeOperation, the context should be restored to its previous state after the operation completes.

**Validates: Requirements 5.5**

### Property 13: Clear operation removes artifacts

*For any* canvas state, calling clear() followed by render() should produce the same output as calling render() on a fresh canvas, with no residual artifacts.

**Validates: Requirements 1.5**

## Error Handling

### Canvas Context Loss

The compositor should detect when the canvas context is lost and attempt recovery:

```typescript
private checkContextLost(): boolean {
  return this.canvas.getContext('2d') === null;
}

private attemptContextRestore(): void {
  const ctx = this.canvas.getContext('2d');
  if (ctx) {
    this.ctx = ctx;
    // Re-render last successful state
    if (this.lastSuccessfulRender.textLayer) {
      this.render(this.lastSuccessfulRender.textLayer);
    }
  }
}
```

### Rendering Failures

All rendering operations should be wrapped in try-catch blocks that:
1. Log the error with context
2. Attempt to restore the previous valid state
3. Propagate the error to the caller for user notification

### Validation Errors

Constructor and method parameters should be validated before use:
- Check for null/undefined required parameters
- Validate image dimensions are positive
- Verify canvas context can be obtained
- Ensure scale factors are valid numbers

## Testing Strategy

### Unit Tests

Unit tests will cover specific scenarios and edge cases:

1. **LayerManager Tests**:
   - Test compositing with only background layer
   - Test compositing with background + text (no mask)
   - Test compositing with background + text + mask
   - Test that blend modes are restored after operations
   - Test clear() removes all layers

2. **Compositor Tests**:
   - Test constructor validation (invalid parameters)
   - Test aspect ratio calculation for various image sizes
   - Test canvas dimension setting
   - Test mask application is skipped when text is empty
   - Test mask application works when text is present
   - Test error recovery (restore previous state)

3. **Integration Tests**:
   - Test full render pipeline with real images
   - Test text addition/removal cycles
   - Test mask regeneration
   - Test export with and without masks

### Property-Based Tests

Property-based tests will verify universal properties across many random inputs using **fast-check** (JavaScript property testing library):

1. **Property 1 Test**: Generate random images and masks, render with text, sample pixels in masked areas, verify they match original image
2. **Property 2 Test**: Generate random states with empty/whitespace text, verify no mask layer exists
3. **Property 3 Test**: Generate random images with various aspect ratios, verify canvas maintains aspect ratio after scaling
4. **Property 4 Test**: Generate random images and scale factors, verify canvas dimensions match calculation
5. **Property 5 Test**: Generate random images and maxDimensions, verify aspect ratio is preserved
6. **Property 6 Test**: Generate masks with gradient alpha, verify smooth transitions in output
7. **Property 7 Test**: Generate images and masks with mismatched dimensions, verify mask is scaled
8. **Property 8 Test**: Force rendering errors, verify previous state is preserved
9. **Property 9 Test**: Monitor state during render calls, verify no external state is modified
10. **Property 10 Test**: Monitor state during layer operations, verify no side effects
11. **Property 11 Test**: Force errors, verify they're thrown without state changes
12. **Property 12 Test**: Check globalCompositeOperation before and after layer operations
13. **Property 13 Test**: Render, clear, render again, verify outputs match

Each property test will run a minimum of 100 iterations with randomly generated inputs.

### Test Tagging

Each property-based test will be tagged with a comment referencing the design document:

```typescript
// **Feature: compositor-mask-bug-fixes, Property 1: Background pixel preservation in masked areas**
test('masked areas preserve background pixels', () => {
  fc.assert(fc.property(
    imageArbitrary,
    maskArbitrary,
    textArbitrary,
    (image, mask, text) => {
      // Test implementation
    }
  ), { numRuns: 100 });
});
```

## Implementation Notes

### Rendering Strategy

The key insight is that we need to composite layers in a way that preserves the background in masked areas. The solution is to use a multi-pass approach:

**Pass 1**: Create a composite of background + text
**Pass 2**: Use the mask to determine where to show background vs. text+background

This can be achieved by:
1. Drawing background to main canvas
2. Drawing text on top
3. Creating a temporary canvas with just the text
4. Using destination-out on the temp canvas with the mask
5. Drawing the masked text back onto the main canvas

Alternatively, we can use destination-in and source-over creatively:
1. Draw background
2. Create temp canvas with text
3. Apply mask to text using destination-in (keeps only text in non-masked areas)
4. Draw masked text over background

### Performance Considerations

- Cache the background layer (already implemented)
- Cache the mask layer (already implemented)
- Only recreate text layer when text properties change (already implemented)
- Use requestAnimationFrame for smooth updates (already implemented in App.tsx)

### CSS Considerations

To prevent CSS from interfering with canvas dimensions:
1. Set canvas width/height attributes (already done)
2. Also set inline style width/height to match
3. Avoid CSS rules that set fixed dimensions on canvas elements
4. Use CSS for positioning and layout, not sizing

## Migration Path

Since this is a bug fix, no migration is needed. The changes are backward compatible:
- Existing API remains unchanged
- Behavior improves (fixes bugs) but doesn't break existing functionality
- No database or state migrations required

## Security Considerations

No security implications. The changes are internal to the rendering pipeline and don't affect:
- User data handling
- API endpoints
- Authentication/authorization
- Data validation (except for improved parameter validation)

## Performance Impact

Expected performance improvements:
- Skipping mask operations when text is empty will improve render performance in that case
- No negative performance impact expected from other changes
- Aspect ratio calculations are simple arithmetic operations

## Accessibility

No accessibility impact. The changes are internal to the rendering engine and don't affect:
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management
