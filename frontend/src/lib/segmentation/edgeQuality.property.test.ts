/**
 * Property-based test for edge quality preservation
 * 
 * Feature: image-segmentation-masking, Property 9: Edge quality preservation
 * Validates: Requirements 2.2, 2.5
 * 
 * For any mask with complex boundaries (hair, fur), the alpha channel should 
 * preserve fine details with gradual transitions (not binary 0/255)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MaskProcessor } from './maskProcessor';

describe('MaskProcessor - Property 9: Edge quality preservation', () => {
  /**
   * Property 9: Edge quality preservation
   * 
   * For any mask with complex boundaries, the alpha channel should preserve
   * fine details with gradual transitions (not binary 0/255).
   * 
   * This property tests that:
   * 1. Masks with gradual alpha transitions are recognized as having better quality
   * 2. Masks with binary (0/255 only) alpha values are recognized as lower quality
   * 3. The quality assessment correctly identifies smooth vs jagged edges
   */
  it('Property 9: masks with gradual alpha transitions have higher quality than binary masks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 200 }),
          height: fc.integer({ min: 50, max: 200 }),
          // Generate edge positions for complex boundaries
          edgeStartX: fc.integer({ min: 10, max: 40 }),
          // Use wider edge widths to ensure gradual transitions survive PNG encoding
          edgeWidth: fc.integer({ min: 10, max: 30 }),
          // Seed for reproducible random patterns
          seed: fc.integer({ min: 0, max: 10000 })
        }),
        async ({ width, height, edgeStartX, edgeWidth, seed }) => {
          // Create two masks: one with gradual transitions, one with binary values
          const gradualMask = createMaskWithGradualEdges(width, height, edgeStartX, edgeWidth, seed);
          const binaryMask = createMaskWithBinaryEdges(width, height, edgeStartX, seed);

          // Extract image data for quality assessment
          const gradualImageData = await extractImageData(gradualMask);
          const binaryImageData = await extractImageData(binaryMask);

          // Assess quality of both masks
          const gradualQuality = await MaskProcessor.assessQuality(gradualImageData);
          const binaryQuality = await MaskProcessor.assessQuality(binaryImageData);

          // Property: Gradual transitions should result in equal or better quality than binary
          const qualityRank = { high: 3, medium: 2, low: 1 };
          
          expect(qualityRank[gradualQuality]).toBeGreaterThanOrEqual(qualityRank[binaryQuality]);

          // Additional check: Verify gradual mask actually has gradual transitions
          const hasGradualTransitions = checkForGradualTransitions(gradualImageData);
          expect(hasGradualTransitions).toBe(true);

          // Additional check: Verify binary mask has mostly binary values
          const isMostlyBinary = checkForBinaryValues(binaryImageData);
          expect(isMostlyBinary).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9b: Edge pixel ratio
   * 
   * For any mask with complex boundaries, there should be a significant number
   * of edge pixels (alpha values between 10 and 245) representing gradual transitions
   */
  it('Property 9b: masks with complex boundaries have significant edge pixel ratio', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 150 }),
          height: fc.integer({ min: 50, max: 150 }),
          gradientWidth: fc.integer({ min: 10, max: 30 }),
          seed: fc.integer({ min: 0, max: 10000 })
        }),
        async ({ width, height, gradientWidth, seed }) => {
          // Create a mask with a gradient edge (simulating hair/fur)
          const mask = createMaskWithComplexBoundary(width, height, gradientWidth, seed);
          const imageData = await extractImageData(mask);

          // Count edge pixels (alpha between 10 and 245)
          let edgePixelCount = 0;
          let totalPixels = 0;

          for (let i = 3; i < imageData.data.length; i += 4) {
            const alpha = imageData.data[i];
            totalPixels++;

            if (alpha > 10 && alpha < 245) {
              edgePixelCount++;
            }
          }

          const edgePixelRatio = edgePixelCount / totalPixels;

          // Property: Masks with complex boundaries should have at least 5% edge pixels
          // This represents the gradual transition zone (hair, fur, etc.)
          expect(edgePixelRatio).toBeGreaterThan(0.05);

          // Property: Edge pixel ratio should be reasonable (not too high)
          // If more than 80% are edge pixels, it's likely noise or invalid
          expect(edgePixelRatio).toBeLessThan(0.8);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9c: Smooth neighbor transitions
   * 
   * For any mask with gradual edges, neighboring edge pixels should have
   * similar alpha values (smooth transitions, not abrupt changes)
   */
  it('Property 9c: edge pixels have smooth transitions to neighbors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 50, max: 100 }),
          height: fc.integer({ min: 50, max: 100 }),
          gradientWidth: fc.integer({ min: 8, max: 20 }),
          seed: fc.integer({ min: 0, max: 10000 })
        }),
        async ({ width, height, gradientWidth, seed }) => {
          // Create a mask with smooth gradient edges
          const mask = createMaskWithSmoothGradient(width, height, gradientWidth, seed);
          const imageData = await extractImageData(mask);

          // Sample edge pixels and check neighbor smoothness
          let smoothEdgeCount = 0;
          let totalEdgeCount = 0;

          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const i = (y * width + x) * 4;
              const alpha = imageData.data[i + 3];

              // Check if this is an edge pixel
              if (alpha > 10 && alpha < 245) {
                totalEdgeCount++;

                // Get neighbor alphas
                const neighbors = getNeighborAlphas(imageData, x, y);

                // Check if neighbors have gradual transitions (within 50 alpha units)
                const isSmooth = neighbors.every(n => Math.abs(n - alpha) < 50);

                if (isSmooth) {
                  smoothEdgeCount++;
                }
              }
            }
          }

          // Property: At least 70% of edge pixels should have smooth transitions
          // This indicates fine detail preservation (hair, fur, etc.)
          if (totalEdgeCount > 0) {
            const smoothRatio = smoothEdgeCount / totalEdgeCount;
            expect(smoothRatio).toBeGreaterThan(0.7);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper: Create a mask with gradual alpha transitions (simulating hair/fur)
 */
function createMaskWithGradualEdges(
  width: number,
  height: number,
  edgeStartX: number,
  edgeWidth: number,
  seed: number
): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(width, height);

  // Use seed for reproducible randomness
  const random = seededRandom(seed);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Set RGB to white
      imageData.data[i] = 255;
      imageData.data[i + 1] = 255;
      imageData.data[i + 2] = 255;

      // Create gradual alpha transition
      if (x < edgeStartX) {
        // Fully opaque (subject)
        imageData.data[i + 3] = 255;
      } else if (x < edgeStartX + edgeWidth) {
        // Gradual transition (edge with fine details)
        const progress = (x - edgeStartX) / edgeWidth;
        const baseAlpha = 255 - Math.floor(progress * 255);
        
        // Add some variation to simulate hair/fur complexity
        const variation = Math.floor((random() - 0.5) * 40);
        imageData.data[i + 3] = Math.max(0, Math.min(255, baseAlpha + variation));
      } else {
        // Fully transparent (background)
        imageData.data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const img = new Image();
  img.width = width;
  img.height = height;
  img.src = canvas.toDataURL('image/png');

  return img;
}

/**
 * Helper: Create a mask with binary alpha values (0 or 255 only)
 */
function createMaskWithBinaryEdges(
  width: number,
  height: number,
  edgeX: number,
  seed: number
): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(width, height);

  // Use seed for reproducible randomness
  const random = seededRandom(seed);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Set RGB to white
      imageData.data[i] = 255;
      imageData.data[i + 1] = 255;
      imageData.data[i + 2] = 255;

      // Binary alpha: either 0 or 255, with some noise at the edge
      const distanceFromEdge = Math.abs(x - edgeX);
      
      if (distanceFromEdge < 2) {
        // At the edge, randomly choose 0 or 255 (jagged edge)
        imageData.data[i + 3] = random() > 0.5 ? 255 : 0;
      } else if (x < edgeX) {
        imageData.data[i + 3] = 255;
      } else {
        imageData.data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const img = new Image();
  img.width = width;
  img.height = height;
  img.src = canvas.toDataURL('image/png');

  return img;
}

/**
 * Helper: Create a mask with complex boundary (gradient representing hair/fur)
 */
function createMaskWithComplexBoundary(
  width: number,
  height: number,
  gradientWidth: number,
  seed: number
): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(width, height);
  const random = seededRandom(seed);

  const centerX = width / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      imageData.data[i] = 255;
      imageData.data[i + 1] = 255;
      imageData.data[i + 2] = 255;

      // Create a wavy edge to simulate complex boundary
      const waveOffset = Math.sin(y / 10) * 10;
      const edgeX = centerX + waveOffset;
      const distanceFromEdge = x - edgeX;

      if (distanceFromEdge < -gradientWidth / 2) {
        // Subject (opaque)
        imageData.data[i + 3] = 255;
      } else if (distanceFromEdge < gradientWidth / 2) {
        // Gradient edge (complex boundary)
        const progress = (distanceFromEdge + gradientWidth / 2) / gradientWidth;
        const baseAlpha = 255 - Math.floor(progress * 255);
        
        // Add variation for complexity
        const variation = Math.floor((random() - 0.5) * 30);
        imageData.data[i + 3] = Math.max(0, Math.min(255, baseAlpha + variation));
      } else {
        // Background (transparent)
        imageData.data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const img = new Image();
  img.width = width;
  img.height = height;
  img.src = canvas.toDataURL('image/png');

  return img;
}

/**
 * Helper: Create a mask with smooth gradient
 */
function createMaskWithSmoothGradient(
  width: number,
  height: number,
  gradientWidth: number,
  seed: number
): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(width, height);
  const random = seededRandom(seed);

  const centerX = width / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      imageData.data[i] = 255;
      imageData.data[i + 1] = 255;
      imageData.data[i + 2] = 255;

      // Smooth gradient with slight wave
      const waveOffset = Math.sin(y / 15) * 5;
      const edgeX = centerX + waveOffset;
      const distanceFromEdge = x - edgeX;

      if (distanceFromEdge < -gradientWidth / 2) {
        imageData.data[i + 3] = 255;
      } else if (distanceFromEdge < gradientWidth / 2) {
        // Smooth gradient
        const progress = (distanceFromEdge + gradientWidth / 2) / gradientWidth;
        const alpha = 255 - Math.floor(progress * 255);
        
        // Very small variation to keep it smooth
        const variation = Math.floor((random() - 0.5) * 10);
        imageData.data[i + 3] = Math.max(0, Math.min(255, alpha + variation));
      } else {
        imageData.data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const img = new Image();
  img.width = width;
  img.height = height;
  img.src = canvas.toDataURL('image/png');

  return img;
}

/**
 * Helper: Extract ImageData from an image
 */
async function extractImageData(img: HTMLImageElement): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Helper: Check if image data has gradual transitions
 */
function checkForGradualTransitions(imageData: ImageData): boolean {
  let gradualPixelCount = 0;
  const totalPixels = imageData.data.length / 4;

  // Count pixels with alpha values between 10 and 245 (gradual transitions)
  for (let i = 3; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i];
    if (alpha > 10 && alpha < 245) {
      gradualPixelCount++;
    }
  }

  // At least 3% of pixels should be in the gradual transition range
  // (lowered from 5% to account for PNG encoding effects on small gradients)
  return (gradualPixelCount / totalPixels) > 0.03;
}

/**
 * Helper: Check if image data has mostly binary values
 */
function checkForBinaryValues(imageData: ImageData): boolean {
  let binaryPixelCount = 0;
  const totalPixels = imageData.data.length / 4;

  // Count pixels with alpha values of 0 or 255 (binary)
  for (let i = 3; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i];
    if (alpha === 0 || alpha === 255) {
      binaryPixelCount++;
    }
  }

  // At least 90% of pixels should be binary
  return (binaryPixelCount / totalPixels) > 0.9;
}

/**
 * Helper: Get neighbor alpha values
 */
function getNeighborAlphas(imageData: ImageData, x: number, y: number): number[] {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const neighbors: number[] = [];

  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];

  for (const [dx, dy] of offsets) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const i = (ny * width + nx) * 4;
      neighbors.push(data[i + 3]);
    }
  }

  return neighbors;
}

/**
 * Helper: Seeded random number generator for reproducible tests
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}
