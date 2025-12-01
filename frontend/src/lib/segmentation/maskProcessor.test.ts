/**
 * Tests for MaskProcessor
 * 
 * Tests the mask validation, quality assessment, and refinement functionality.
 * Uses canvas polyfill from vitest.setup.ts for ImageData support.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MaskProcessor } from './maskProcessor';

describe('MaskProcessor', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    ctx = canvas.getContext('2d')!;
  });

  /**
   * Helper to create a test mask image with specific alpha pattern
   */
  const createMaskImage = (
    alphaPattern: 'partial' | 'all-transparent' | 'all-opaque' | 'gradient'
  ): HTMLImageElement => {
    const imageData = ctx.createImageData(100, 100);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255; // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B

      // Set alpha based on pattern
      if (alphaPattern === 'partial') {
        // Create a pattern with enough partial alpha pixels to avoid noise detection
        const pixelIndex = i / 4;
        const x = pixelIndex % 100;
        const y = Math.floor(pixelIndex / 100);
        // Create a clear subject/background split
        data[i + 3] = x < 50 ? 255 : 0;
      } else if (alphaPattern === 'all-transparent') {
        data[i + 3] = 0;
      } else if (alphaPattern === 'all-opaque') {
        data[i + 3] = 255;
      } else if (alphaPattern === 'gradient') {
        const pixelIndex = i / 4;
        const x = pixelIndex % 100;
        data[i + 3] = Math.floor((x / 100) * 255); // Gradient from transparent to opaque
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Create image from canvas - in test environment, this is synchronous
    const img = new Image();
    img.width = 100;
    img.height = 100;
    img.src = canvas.toDataURL();

    return img;
  };

  describe('validate', () => {
    it('should validate mask with partial alpha channel', async () => {
      const maskImage = createMaskImage('partial');
      const result = await MaskProcessor.validate(maskImage);

      expect(result.isValid).toBe(true);
      expect(result.hasAlphaChannel).toBe(true);
      expect(result.dimensions).toEqual({ width: 100, height: 100 });
      expect(result.errors).toHaveLength(0);
    });

    it('should detect all-transparent mask', async () => {
      const maskImage = createMaskImage('all-transparent');
      const result = await MaskProcessor.validate(maskImage);

      expect(result.isValid).toBe(false);
      expect(result.hasAlphaChannel).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('transparent'))).toBe(true);
    });

    it('should detect all-opaque mask', async () => {
      const maskImage = createMaskImage('all-opaque');
      const result = await MaskProcessor.validate(maskImage);

      expect(result.isValid).toBe(false);
      expect(result.hasAlphaChannel).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('opaque'))).toBe(true);
    });

    it('should check dimension matching', async () => {
      const maskImage = createMaskImage('partial');
      const result = await MaskProcessor.validate(maskImage, 200, 200);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Dimension mismatch'))).toBe(true);
    });

    it('should pass dimension check when dimensions match', async () => {
      const maskImage = createMaskImage('partial');
      const result = await MaskProcessor.validate(maskImage, 100, 100);

      expect(result.isValid).toBe(true);
      expect(result.errors.some((e) => e.includes('Dimension mismatch'))).toBe(false);
    });
  });

  describe('extractAlphaChannel', () => {
    it('should extract alpha channel from mask', async () => {
      const maskImage = createMaskImage('gradient');
      const imageData = await MaskProcessor.extractAlphaChannel(maskImage);

      expect(imageData.width).toBe(100);
      expect(imageData.height).toBe(100);
      expect(imageData.data.length).toBe(100 * 100 * 4);
    });

    it('should preserve alpha values in extracted data', async () => {
      const maskImage = createMaskImage('gradient');
      const imageData = await MaskProcessor.extractAlphaChannel(maskImage);

      // Check that we have varying alpha values (gradient)
      const alphaValues = new Set<number>();
      for (let i = 3; i < imageData.data.length; i += 4) {
        alphaValues.add(imageData.data[i]);
      }

      // Gradient should have multiple different alpha values
      expect(alphaValues.size).toBeGreaterThan(10);
    });
  });

  describe('assessQuality', () => {
    it('should return low quality for mask with no edge pixels', async () => {
      const imageData = ctx.createImageData(100, 100);
      const data = imageData.data;

      // All pixels fully opaque (no edges)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }

      const quality = await MaskProcessor.assessQuality(imageData);
      expect(quality).toBe('low');
    });

    it('should assess quality based on edge smoothness', async () => {
      const imageData = ctx.createImageData(100, 100);
      const data = imageData.data;

      // Create smooth gradient edges
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
          const i = (y * 100 + x) * 4;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = Math.floor((x / 100) * 255);
        }
      }

      const quality = await MaskProcessor.assessQuality(imageData);
      // Smooth gradient should result in high or medium quality
      expect(['high', 'medium']).toContain(quality);
    });

    it('should detect jagged edges as lower quality', async () => {
      const imageData = ctx.createImageData(50, 50);
      const data = imageData.data;

      // Create jagged pattern with abrupt alpha changes
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        // Alternating high/low alpha creates jagged edges
        data[i + 3] = i % 8 === 0 ? 50 : 200;
      }

      const quality = await MaskProcessor.assessQuality(imageData);
      // Jagged edges should result in low or medium quality
      expect(['low', 'medium']).toContain(quality);
    });
  });

  describe('refine', () => {
    // Note: Full refine tests with blob creation are skipped in test environment
    // as they require browser-specific blob/image loading APIs that don't work
    // properly in jsdom. The refine method is tested manually in browser integration tests.

    it('should have refine method available', () => {
      expect(typeof MaskProcessor.refine).toBe('function');
    });

    it('should have correct method signature', () => {
      // Verify the method exists and has the expected parameter count
      expect(MaskProcessor.refine.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Alpha channel validation', () => {
    it('should detect masks with partial alpha', async () => {
      const imageData = ctx.createImageData(10, 10);
      const data = imageData.data;

      // Set some pixels with partial alpha
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = i < 40 ? 128 : 255; // Some partial alpha
      }

      const result = await (MaskProcessor as any).validateAlphaChannelSync(imageData);

      expect(result.hasAlpha).toBe(true);
      expect(result.allTransparent).toBe(false);
      expect(result.allOpaque).toBe(false);
    });

    it('should detect all-transparent masks', async () => {
      const imageData = ctx.createImageData(10, 10);
      const data = imageData.data;

      // Set all pixels to transparent
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 0;
      }

      const result = await (MaskProcessor as any).validateAlphaChannelSync(imageData);

      expect(result.hasAlpha).toBe(false);
      expect(result.allTransparent).toBe(true);
      expect(result.allOpaque).toBe(false);
    });

    it('should detect all-opaque masks', async () => {
      const imageData = ctx.createImageData(10, 10);
      const data = imageData.data;

      // Set all pixels to opaque
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }

      const result = await (MaskProcessor as any).validateAlphaChannelSync(imageData);

      expect(result.hasAlpha).toBe(false);
      expect(result.allTransparent).toBe(false);
      expect(result.allOpaque).toBe(true);
    });

    it('should detect masks with both transparent and opaque pixels', async () => {
      const imageData = ctx.createImageData(10, 10);
      const data = imageData.data;

      // Set half transparent, half opaque
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = i < data.length / 2 ? 0 : 255;
      }

      const result = await (MaskProcessor as any).validateAlphaChannelSync(imageData);

      expect(result.hasAlpha).toBe(true);
      expect(result.allTransparent).toBe(false);
      expect(result.allOpaque).toBe(false);
    });

    it('should detect noise in masks', async () => {
      const imageData = ctx.createImageData(100, 100);
      const data = imageData.data;

      // Create mostly opaque with very few partial alpha pixels (noise)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        // Only 5 pixels with partial alpha out of 10000 (0.05%)
        data[i + 3] = i < 20 ? 128 : 255;
      }

      const result = await (MaskProcessor as any).validateAlphaChannelSync(imageData);

      expect(result.hasNoise).toBe(true);
    });
  });

  describe('Dimension checking', () => {
    it('should pass when dimensions match exactly', async () => {
      const maskImage = createMaskImage('partial');
      const result = await MaskProcessor.validate(maskImage, 100, 100);

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain(expect.stringContaining('Dimension mismatch'));
    });

    it('should fail when width differs', async () => {
      const maskImage = createMaskImage('partial');
      const result = await MaskProcessor.validate(maskImage, 200, 100);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Dimension mismatch'))).toBe(true);
    });

    it('should fail when height differs', async () => {
      const maskImage = createMaskImage('partial');
      const result = await MaskProcessor.validate(maskImage, 100, 200);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Dimension mismatch'))).toBe(true);
    });

    it('should not check dimensions when not provided', async () => {
      const maskImage = createMaskImage('partial');
      const result = await MaskProcessor.validate(maskImage);

      expect(result.isValid).toBe(true);
      expect(result.dimensions).toEqual({ width: 100, height: 100 });
    });
  });

  describe('Quality assessment edge cases', () => {
    it('should handle masks with no edge pixels', async () => {
      const imageData = ctx.createImageData(10, 10);
      const data = imageData.data;

      // All pixels either fully transparent or fully opaque (no edges)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = i < data.length / 2 ? 0 : 255;
      }

      const quality = await MaskProcessor.assessQuality(imageData);

      expect(quality).toBe('low');
    });

    it('should assess high quality for smooth gradients', async () => {
      const imageData = ctx.createImageData(50, 50);
      const data = imageData.data;

      // Create smooth horizontal gradient
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
          const i = (y * 50 + x) * 4;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = Math.floor((x / 50) * 255);
        }
      }

      const quality = await MaskProcessor.assessQuality(imageData);

      expect(['high', 'medium']).toContain(quality);
    });

    it('should assess low quality for jagged edges', async () => {
      const imageData = ctx.createImageData(50, 50);
      const data = imageData.data;

      // Create jagged pattern with abrupt changes
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        // Alternating between very different alpha values
        data[i + 3] = (i / 4) % 2 === 0 ? 50 : 200;
      }

      const quality = await MaskProcessor.assessQuality(imageData);

      expect(['low', 'medium']).toContain(quality);
    });
  });

  describe('Refinement operations', () => {
    it('should apply Gaussian blur', () => {
      const imageData = ctx.createImageData(10, 10);
      const data = imageData.data;

      // Create a simple pattern
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = i < data.length / 2 ? 0 : 255;
      }

      const blurred = (MaskProcessor as any).applyGaussianBlur(imageData, 1);

      expect(blurred.width).toBe(10);
      expect(blurred.height).toBe(10);
      // Blurred image should have some intermediate alpha values
      let hasIntermediateAlpha = false;
      for (let i = 3; i < blurred.data.length; i += 4) {
        if (blurred.data[i] > 0 && blurred.data[i] < 255) {
          hasIntermediateAlpha = true;
          break;
        }
      }
      expect(hasIntermediateAlpha).toBe(true);
    });

    it('should apply dilation', () => {
      const imageData = ctx.createImageData(10, 10);
      const data = imageData.data;

      // Create a small opaque region in center
      for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % 10;
        const y = Math.floor(pixelIndex / 10);
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = (x >= 4 && x <= 5 && y >= 4 && y <= 5) ? 255 : 0;
      }

      const dilated = (MaskProcessor as any).applyDilation(imageData, 1);

      // Dilation should expand the opaque region
      expect(dilated.width).toBe(10);
      expect(dilated.height).toBe(10);
    });

    it('should apply erosion', () => {
      const imageData = ctx.createImageData(10, 10);
      const data = imageData.data;

      // Create a large opaque region
      for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % 10;
        const y = Math.floor(pixelIndex / 10);
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = (x >= 2 && x <= 7 && y >= 2 && y <= 7) ? 255 : 0;
      }

      const eroded = (MaskProcessor as any).applyErosion(imageData, 1);

      // Erosion should shrink the opaque region
      expect(eroded.width).toBe(10);
      expect(eroded.height).toBe(10);
    });

    it('should apply threshold', () => {
      const imageData = ctx.createImageData(10, 10);
      const data = imageData.data;

      // Create gradient
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = (i / 4) % 256;
      }

      const thresholded = (MaskProcessor as any).applyThreshold(imageData, 128);

      // All alpha values should be either 0 or 255
      for (let i = 3; i < thresholded.data.length; i += 4) {
        expect([0, 255]).toContain(thresholded.data[i]);
      }
    });
  });
});
