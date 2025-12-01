/**
 * Property-based tests for MaskPreview
 * 
 * Uses fast-check for property-based testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { MaskPreview, PreviewOptions } from './maskPreview';

describe('MaskPreview - Property-Based Tests', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
  });

  /**
   * Property 7: Preview mode preservation
   * Feature: image-segmentation-masking, Property 7: Preview mode preservation
   * Validates: Requirements 4.4
   * 
   * For any preview mode toggle, the underlying mask data should remain unchanged 
   * (only visualization changes)
   * 
   * This property ensures that when we render masks in different preview modes,
   * the original mask image data is never modified. Only the canvas visualization changes.
   */
  it('Property 7: toggling preview modes preserves underlying mask data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 150 }),
          height: fc.integer({ min: 50, max: 150 }),
          previewModes: fc.array(
            fc.constantFrom('overlay', 'side-by-side', 'checkerboard'),
            { minLength: 2, maxLength: 5 }
          ),
          opacity: fc.double({ min: 0.1, max: 1.0 }),
          colorize: fc.boolean()
        }),
        async ({ width, height, previewModes, opacity, colorize }) => {
          // Create original and mask images
          const originalImage = await createTestImage(width, height, 'original');
          const maskImage = await createTestMaskImage(width, height);

          // Capture the original mask data before any preview operations
          const originalMaskData = await captureImageData(maskImage);

          // Toggle through various preview modes
          for (const mode of previewModes) {
            const options: PreviewOptions = {
              mode: mode as 'overlay' | 'side-by-side' | 'checkerboard',
              opacity,
              colorize
            };

            // Render preview based on mode
            if (mode === 'overlay') {
              MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
            } else if (mode === 'side-by-side') {
              MaskPreview.renderSideBySide(canvas, originalImage, maskImage);
            } else if (mode === 'checkerboard') {
              MaskPreview.renderCheckerboard(canvas, maskImage);
            }
          }

          // Capture mask data after all preview operations
          const finalMaskData = await captureImageData(maskImage);

          // Property: The mask image data should be identical before and after preview operations
          expect(finalMaskData.width).toBe(originalMaskData.width);
          expect(finalMaskData.height).toBe(originalMaskData.height);
          expect(finalMaskData.data.length).toBe(originalMaskData.data.length);

          // Compare pixel data - every pixel should be identical
          for (let i = 0; i < originalMaskData.data.length; i++) {
            expect(finalMaskData.data[i]).toBe(originalMaskData.data[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property-based test

  /**
   * Additional test: Verify that original image is also preserved
   */
  it('Property 7 (extended): preview modes preserve both mask and original image data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 150 }),
          height: fc.integer({ min: 50, max: 150 }),
          mode: fc.constantFrom('overlay', 'side-by-side', 'checkerboard'),
          opacity: fc.double({ min: 0.1, max: 1.0 }),
          colorize: fc.boolean()
        }),
        async ({ width, height, mode, opacity, colorize }) => {
          // Create original and mask images
          const originalImage = await createTestImage(width, height, 'original');
          const maskImage = await createTestMaskImage(width, height);

          // Capture original data before preview
          const originalImageDataBefore = await captureImageData(originalImage);
          const maskImageDataBefore = await captureImageData(maskImage);

          const options: PreviewOptions = {
            mode: mode as 'overlay' | 'side-by-side' | 'checkerboard',
            opacity,
            colorize
          };

          // Render preview
          if (mode === 'overlay') {
            MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
          } else if (mode === 'side-by-side') {
            MaskPreview.renderSideBySide(canvas, originalImage, maskImage);
          } else if (mode === 'checkerboard') {
            MaskPreview.renderCheckerboard(canvas, maskImage);
          }

          // Capture data after preview
          const originalImageDataAfter = await captureImageData(originalImage);
          const maskImageDataAfter = await captureImageData(maskImage);

          // Property: Both original and mask images should be unchanged
          expect(originalImageDataAfter.data.length).toBe(originalImageDataBefore.data.length);
          expect(maskImageDataAfter.data.length).toBe(maskImageDataBefore.data.length);

          // Verify pixel-by-pixel equality for original image
          for (let i = 0; i < originalImageDataBefore.data.length; i++) {
            expect(originalImageDataAfter.data[i]).toBe(originalImageDataBefore.data[i]);
          }

          // Verify pixel-by-pixel equality for mask image
          for (let i = 0; i < maskImageDataBefore.data.length; i++) {
            expect(maskImageDataAfter.data[i]).toBe(maskImageDataBefore.data[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property-based test
});

/**
 * Helper function to create a test image with specific dimensions
 */
async function createTestImage(
  width: number,
  height: number,
  type: 'original' | 'mask'
): Promise<HTMLImageElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Fill with a gradient pattern for original images
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(0.5, '#00ff00');
  gradient.addColorStop(1, '#0000ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${err}`));
    img.src = canvas.toDataURL('image/png');
  });
}

/**
 * Helper function to create a test mask image with alpha channel
 */
async function createTestMaskImage(
  width: number,
  height: number
): Promise<HTMLImageElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const imageData = ctx.createImageData(width, height);

  // Create a mask with varying alpha values
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Create a circular mask pattern
      const centerX = width / 2;
      const centerY = height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      const alpha = Math.max(0, Math.min(255, 255 - (distance / maxDistance) * 255));

      imageData.data[i] = 255;     // R
      imageData.data[i + 1] = 255; // G
      imageData.data[i + 2] = 255; // B
      imageData.data[i + 3] = alpha; // A
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load mask image: ${err}`));
    img.src = canvas.toDataURL('image/png');
  });
}

/**
 * Helper function to capture image data from an HTMLImageElement
 */
async function captureImageData(img: HTMLImageElement): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
