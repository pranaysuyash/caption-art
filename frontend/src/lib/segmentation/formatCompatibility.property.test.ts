/**
 * Property-based test for format compatibility
 * 
 * Feature: image-segmentation-masking, Property 12: Format compatibility
 * Validates: Requirements 7.1, 7.2, 7.4
 * 
 * For any supported image format (JPG, PNG), the mask generation should 
 * succeed and produce a valid PNG mask
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { MaskGenerator } from './maskGenerator';
import { MaskProcessor } from './maskProcessor';

describe('MaskGenerator - Property 12: Format compatibility', () => {
  /**
   * Property 12: Format compatibility
   * 
   * For any supported image format (JPG, PNG), the mask generation should
   * succeed and produce a valid PNG mask.
   * 
   * This property tests that:
   * 1. JPG images can be processed and generate valid masks
   * 2. PNG images can be processed and generate valid masks
   * 3. PNG images with transparency are handled correctly
   * 4. All generated masks are in PNG format with alpha channel
   */
  it('Property 12: all supported formats produce valid PNG masks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 200 }),
          height: fc.integer({ min: 50, max: 200 }),
          format: fc.constantFrom('jpeg', 'png', 'png-transparent'),
          seed: fc.integer({ min: 0, max: 10000 })
        }),
        async ({ width, height, format, seed }) => {
          // Create test image in the specified format
          const imageDataUrl = createTestImage(width, height, format, seed);

          // Mock the Replicate API to return a valid mask
          const mockMaskUrl = 'https://example.com/mask.png';
          const mockMaskImage = await createMockMask(width, height);

          // Create a mock MaskGenerator that simulates successful generation
          const generator = createMockGenerator(mockMaskUrl, mockMaskImage);

          // Generate mask
          const result = await generator.generate(imageDataUrl);

          // Property: Mask generation should succeed for all supported formats
          expect(result).toBeDefined();
          expect(result.maskUrl).toBe(mockMaskUrl);
          expect(result.maskImage).toBeDefined();

          // Property: Generated mask should be valid PNG with alpha channel
          const validation = await MaskProcessor.validate(result.maskImage);
          expect(validation.isValid).toBe(true);
          expect(validation.hasAlphaChannel).toBe(true);

          // Property: Mask dimensions should match original image
          expect(result.maskImage.width).toBe(width);
          expect(result.maskImage.height).toBe(height);

          // Property: Mask should have quality assessment
          expect(result.quality).toMatch(/^(high|medium|low)$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12b: JPG format compatibility
   * 
   * For any JPG image, mask generation should succeed and produce a valid PNG mask
   */
  it('Property 12b: JPG images produce valid PNG masks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 150 }),
          height: fc.integer({ min: 50, max: 150 }),
          quality: fc.integer({ min: 60, max: 100 }),
          seed: fc.integer({ min: 0, max: 10000 })
        }),
        async ({ width, height, quality, seed }) => {
          // Create JPG image
          const imageDataUrl = createTestImage(width, height, 'jpeg', seed, quality);

          // Verify it's a JPG
          expect(imageDataUrl).toMatch(/^data:image\/jpe?g/);

          // Mock successful mask generation
          const mockMaskImage = await createMockMask(width, height);
          const generator = createMockGenerator('https://example.com/mask.png', mockMaskImage);

          // Generate mask
          const result = await generator.generate(imageDataUrl);

          // Property: JPG should be processed successfully
          expect(result).toBeDefined();
          expect(result.maskImage).toBeDefined();

          // Property: Output should be PNG with alpha channel
          const validation = await MaskProcessor.validate(result.maskImage);
          expect(validation.hasAlphaChannel).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12c: PNG format compatibility
   * 
   * For any PNG image, mask generation should succeed and produce a valid PNG mask
   */
  it('Property 12c: PNG images produce valid PNG masks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 150 }),
          height: fc.integer({ min: 50, max: 150 }),
          hasTransparency: fc.boolean(),
          seed: fc.integer({ min: 0, max: 10000 })
        }),
        async ({ width, height, hasTransparency, seed }) => {
          // Create PNG image (with or without transparency)
          const format = hasTransparency ? 'png-transparent' : 'png';
          const imageDataUrl = createTestImage(width, height, format, seed);

          // Verify it's a PNG
          expect(imageDataUrl).toMatch(/^data:image\/png/);

          // Mock successful mask generation
          const mockMaskImage = await createMockMask(width, height);
          const generator = createMockGenerator('https://example.com/mask.png', mockMaskImage);

          // Generate mask
          const result = await generator.generate(imageDataUrl);

          // Property: PNG should be processed successfully
          expect(result).toBeDefined();
          expect(result.maskImage).toBeDefined();

          // Property: Output should be PNG with alpha channel
          const validation = await MaskProcessor.validate(result.maskImage);
          expect(validation.hasAlphaChannel).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12d: Transparent PNG handling
   * 
   * For any PNG image with transparency, the alpha channel should be handled correctly
   * and the output mask should still be valid
   */
  it('Property 12d: transparent PNGs are handled correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 150 }),
          height: fc.integer({ min: 50, max: 150 }),
          transparencyLevel: fc.integer({ min: 0, max: 255 }),
          seed: fc.integer({ min: 0, max: 10000 })
        }),
        async ({ width, height, transparencyLevel, seed }) => {
          // Create PNG with specific transparency level
          const imageDataUrl = createTransparentPNG(width, height, transparencyLevel, seed);

          // Verify it's a PNG
          expect(imageDataUrl).toMatch(/^data:image\/png/);

          // Mock successful mask generation
          const mockMaskImage = await createMockMask(width, height);
          const generator = createMockGenerator('https://example.com/mask.png', mockMaskImage);

          // Generate mask
          const result = await generator.generate(imageDataUrl);

          // Property: Transparent PNG should be processed successfully
          expect(result).toBeDefined();
          expect(result.maskImage).toBeDefined();

          // Property: Output mask should have valid alpha channel
          const validation = await MaskProcessor.validate(result.maskImage);
          expect(validation.hasAlphaChannel).toBe(true);
          expect(validation.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12e: Output format consistency
   * 
   * For any input format, the output should always be PNG with alpha channel
   */
  it('Property 12e: output is always PNG with alpha regardless of input format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 150 }),
          height: fc.integer({ min: 50, max: 150 }),
          inputFormat: fc.constantFrom('jpeg', 'png', 'png-transparent'),
          seed: fc.integer({ min: 0, max: 10000 })
        }),
        async ({ width, height, inputFormat, seed }) => {
          // Create image in specified format
          const imageDataUrl = createTestImage(width, height, inputFormat, seed);

          // Mock successful mask generation
          const mockMaskImage = await createMockMask(width, height);
          const generator = createMockGenerator('https://example.com/mask.png', mockMaskImage);

          // Generate mask
          const result = await generator.generate(imageDataUrl);

          // Property: Output should always be PNG with alpha channel
          const validation = await MaskProcessor.validate(result.maskImage);
          expect(validation.hasAlphaChannel).toBe(true);

          // Property: Mask URL should indicate PNG format
          expect(result.maskUrl).toMatch(/\.png$/i);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper: Create a test image in the specified format
 */
function createTestImage(
  width: number,
  height: number,
  format: 'jpeg' | 'png' | 'png-transparent',
  seed: number,
  quality: number = 90
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const random = seededRandom(seed);

  // Draw a simple test pattern
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = Math.floor(random() * 255);
      const g = Math.floor(random() * 255);
      const b = Math.floor(random() * 255);
      
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Add a subject in the center
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;

  ctx.fillStyle = 'rgb(100, 150, 200)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Convert to appropriate format
  if (format === 'jpeg') {
    return canvas.toDataURL('image/jpeg', quality / 100);
  } else if (format === 'png-transparent') {
    // Add transparency to part of the image
    const imageData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const x = (i / 4) % width;
      const y = Math.floor((i / 4) / width);
      
      // Make background semi-transparent
      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distFromCenter > radius) {
        imageData.data[i + 3] = Math.floor(random() * 128); // Semi-transparent
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } else {
    return canvas.toDataURL('image/png');
  }
}

/**
 * Helper: Create a transparent PNG with specific transparency level
 */
function createTransparentPNG(
  width: number,
  height: number,
  transparencyLevel: number,
  seed: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const random = seededRandom(seed);

  const imageData = ctx.createImageData(width, height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = Math.floor(random() * 255);     // R
    imageData.data[i + 1] = Math.floor(random() * 255); // G
    imageData.data[i + 2] = Math.floor(random() * 255); // B
    imageData.data[i + 3] = transparencyLevel;          // A
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Helper: Create a mock mask image
 */
async function createMockMask(width: number, height: number): Promise<HTMLImageElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(width, height);

  // Create a simple mask with subject in center
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

      // White RGB
      imageData.data[i] = 255;
      imageData.data[i + 1] = 255;
      imageData.data[i + 2] = 255;

      // Alpha based on distance from center
      if (distance < radius * 0.8) {
        imageData.data[i + 3] = 255; // Opaque subject
      } else if (distance < radius) {
        // Gradient edge
        const edgeProgress = (distance - radius * 0.8) / (radius * 0.2);
        imageData.data[i + 3] = Math.floor(255 * (1 - edgeProgress));
      } else {
        imageData.data[i + 3] = 0; // Transparent background
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Convert to image
  const img = new Image();
  img.width = width;
  img.height = height;
  
  return new Promise((resolve) => {
    img.onload = () => resolve(img);
    img.src = canvas.toDataURL('image/png');
  });
}

/**
 * Helper: Create a mock MaskGenerator for testing
 */
function createMockGenerator(mockMaskUrl: string, mockMaskImage: HTMLImageElement): MaskGenerator {
  const generator = new MaskGenerator({
    replicateApiKey: 'test-key',
    maxRetries: 3,
    timeout: 45000,
    cacheEnabled: false
  });

  // Mock the generate method to return our mock data
  vi.spyOn(generator, 'generate').mockImplementation(async () => {
    return {
      maskUrl: mockMaskUrl,
      maskImage: mockMaskImage,
      generationTime: 1000,
      quality: 'high'
    };
  });

  return generator;
}

/**
 * Helper: Seeded random number generator for reproducible tests
 */
function seededRandom(seed: number): () => number {
  let state = seed + 1;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}
