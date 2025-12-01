# Performance Optimizations Usage Guide

## Quick Start

The performance optimizations are automatically enabled and require no configuration changes. However, you can leverage them for better user experience.

## Basic Usage (Automatic Optimizations)

```typescript
import { MaskGenerator } from './lib/segmentation';

// Create generator (deduplication and workers enabled by default)
const generator = new MaskGenerator({
  replicateApiKey: 'your-api-key',
  maxRetries: 3,
  timeout: 45000,
  cacheEnabled: true
});

// Generate mask (deduplication happens automatically)
const result = await generator.generate(imageDataUrl);
```

## Prefetching for Better UX

Enable prefetching to start mask generation immediately after image upload:

```typescript
// In your image upload handler
async function handleImageUpload(file: File) {
  // Convert to data URL
  const imageDataUrl = await fileToDataURL(file);
  
  // Display image immediately
  setUploadedImage(imageDataUrl);
  
  // Start prefetching mask in background
  maskGenerator.prefetch(imageDataUrl);
  
  // Later, when user enables text-behind effect:
  // The mask will be ready instantly!
}

// When user toggles text-behind effect
async function handleTextBehindToggle(enabled: boolean) {
  if (enabled) {
    // This will return instantly if prefetch completed
    const mask = await maskGenerator.generate(imageDataUrl);
    setMask(mask);
  }
}
```

## Controlling Prefetch Behavior

```typescript
// Disable prefetching (e.g., on slow connections)
maskGenerator.setPrefetchEnabled(false);

// Re-enable prefetching
maskGenerator.setPrefetchEnabled(true);
```

## Request Deduplication (Automatic)

Deduplication happens automatically. Multiple calls with the same image return the same Promise:

```typescript
// These will only make ONE API call
const promise1 = generator.generate(imageDataUrl);
const promise2 = generator.generate(imageDataUrl); // Returns same promise
const promise3 = generator.generate(imageDataUrl); // Returns same promise

// All resolve to the same result
const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);
// result1 === result2 === result3
```

## Web Worker Processing (Automatic)

Workers are used automatically for heavy operations. No code changes needed:

```typescript
// Quality assessment uses worker automatically
const result = await generator.generate(imageDataUrl);
console.log(result.quality); // 'high', 'medium', or 'low'

// Falls back to main thread if workers unavailable
```

## Cache Management

```typescript
// Clear cache to free memory
generator.clearCache();

// Clear processed mask cache
MaskProcessor.clearCache();

// Get cache statistics
const stats = generator.cache.getStats();
console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`);
```

## Complete Example: Optimized Image Upload Flow

```typescript
import { MaskGenerator, MaskProcessor } from './lib/segmentation';

class ImageEditor {
  private maskGenerator: MaskGenerator;
  private currentImage: string | null = null;
  
  constructor(apiKey: string) {
    this.maskGenerator = new MaskGenerator({
      replicateApiKey: apiKey,
      maxRetries: 3,
      timeout: 45000,
      cacheEnabled: true
    });
  }
  
  async handleImageUpload(file: File) {
    // Convert to data URL
    const imageDataUrl = await this.fileToDataURL(file);
    this.currentImage = imageDataUrl;
    
    // Display image immediately
    this.displayImage(imageDataUrl);
    
    // Start prefetching mask in background
    // This won't block the UI
    this.maskGenerator.prefetch(imageDataUrl);
    
    // Show hint to user
    this.showToast('Image uploaded! Preparing mask in background...');
  }
  
  async enableTextBehindEffect() {
    if (!this.currentImage) return;
    
    try {
      // Show loading state
      this.setLoading(true);
      
      // This will be instant if prefetch completed
      const mask = await this.maskGenerator.generate(this.currentImage);
      
      // Apply mask
      this.applyMask(mask);
      
      // Show success
      this.showToast(`Mask ready! Quality: ${mask.quality}`);
    } catch (error) {
      this.showError('Failed to generate mask');
    } finally {
      this.setLoading(false);
    }
  }
  
  async regenerateMask() {
    if (!this.currentImage) return;
    
    try {
      this.setLoading(true);
      
      // Regenerate bypasses cache
      const mask = await this.maskGenerator.regenerate(this.currentImage);
      
      this.applyMask(mask);
      this.showToast('Mask regenerated!');
    } catch (error) {
      this.showError('Failed to regenerate mask');
    } finally {
      this.setLoading(false);
    }
  }
  
  cleanup() {
    // Clear caches to free memory
    this.maskGenerator.clearCache();
    MaskProcessor.clearCache();
  }
  
  private async fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  private displayImage(dataUrl: string) {
    // Implementation
  }
  
  private applyMask(mask: any) {
    // Implementation
  }
  
  private setLoading(loading: boolean) {
    // Implementation
  }
  
  private showToast(message: string) {
    // Implementation
  }
  
  private showError(message: string) {
    // Implementation
  }
}
```

## Performance Tips

### 1. Enable Prefetching for Best UX
```typescript
// Always prefetch after image upload
maskGenerator.prefetch(imageDataUrl);
```

### 2. Monitor Cache Performance
```typescript
// Periodically check cache stats
setInterval(() => {
  const stats = maskGenerator.cache.getStats();
  console.log('Cache hit rate:', stats.hits / (stats.hits + stats.misses));
}, 60000);
```

### 3. Clean Up on Unmount
```typescript
// In React component
useEffect(() => {
  return () => {
    maskGenerator.clearCache();
    MaskProcessor.clearCache();
  };
}, []);
```

### 4. Handle Slow Connections
```typescript
// Disable prefetch on slow connections
if (navigator.connection?.effectiveType === '2g') {
  maskGenerator.setPrefetchEnabled(false);
}
```

### 5. Batch Operations
```typescript
// Process multiple images efficiently
const images = [image1, image2, image3];

// Prefetch all
images.forEach(img => maskGenerator.prefetch(img));

// Generate all (deduplication prevents redundant calls)
const masks = await Promise.all(
  images.map(img => maskGenerator.generate(img))
);
```

## Troubleshooting

### Prefetch Not Working
- Check if cache is enabled: `cacheEnabled: true`
- Verify prefetch is enabled: `maskGenerator.setPrefetchEnabled(true)`
- Check browser console for errors

### Workers Not Being Used
- Workers are automatically used when available
- Check console for "Web Workers not supported" message
- System falls back to main thread automatically

### High Memory Usage
- Clear caches periodically: `maskGenerator.clearCache()`
- Reduce cache size in MaskCache constructor
- Clear processed mask cache: `MaskProcessor.clearCache()`

## Browser Support

- **Request Deduplication**: All browsers
- **Prefetching**: All browsers
- **Web Workers**: All modern browsers (IE11+)
- **Fallback**: Automatic for older browsers
