/**
 * Property-Based Tests for EXIFProcessor
 * 
 * Tests correctness properties using fast-check
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { correctOrientation } from './exifProcessor';

// Helper function to create a test image with a distinctive pattern
// The pattern allows us to verify orientation by checking pixel positions
function createOrientedCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Create a distinctive pattern:
    // Top-left: Red
    // Top-right: Green
    // Bottom-left: Blue
    // Bottom-right: Yellow
    ctx.fillStyle = '#ff0000'; // Red
    ctx.fillRect(0, 0, width / 2, height / 2);
    
    ctx.fillStyle = '#00ff00'; // Green
    ctx.fillRect(width / 2, 0, width / 2, height / 2);
    
    ctx.fillStyle = '#0000ff'; // Blue
    ctx.fillRect(0, height / 2, width / 2, height / 2);
    
    ctx.fillStyle = '#ffff00'; // Yellow
    ctx.fillRect(width / 2, height / 2, width / 2, height / 2);
  }
  
  return canvas;
}

// Helper function to convert canvas to HTMLImageElement
async function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to get pixel color at a specific position
function getPixelColor(canvas: HTMLCanvasElement, x: number, y: number): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  const imageData = ctx.getImageData(x, y, 1, 1);
  const [r, g, b] = imageData.data;
  
  // Convert to hex color
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper function to identify the dominant color in a region
function getDominantColor(canvas: HTMLCanvasElement, x: number, y: number, sampleSize: number = 5): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#000000';
  
  const colors: { [key: string]: number } = {};
  
  // Ensure we don't sample outside canvas bounds
  const maxX = Math.min(x + sampleSize, canvas.width);
  const maxY = Math.min(y + sampleSize, canvas.height);
  
  for (let px = x; px < maxX; px++) {
    for (let py = y; py < maxY; py++) {
      const color = getPixelColor(canvas, px, py);
      colors[color] = (colors[color] || 0) + 1;
    }
  }
  
  // Return the most common color
  const entries = Object.entries(colors);
  if (entries.length === 0) return '#000000';
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

describe('EXIFProcessor', () => {
  describe('Property 5: EXIF orientation correction', () => {
    /**
     * Feature: image-upload-preprocessing, Property 5: EXIF orientation correction
     * Validates: Requirements 5.1, 5.2, 5.3
     * 
     * For any image with EXIF orientation ≠ 1, after correction, the image should display in the correct orientation
     * 
     * Note: Due to JSDOM limitations, we cannot test actual pixel rendering. Instead, we verify that:
     * 1. Canvas dimensions are correctly transformed based on orientation
     * 2. The canvas context is valid and can be used for drawing
     * 3. The function completes without errors for all valid orientations
     */
    it('should correctly transform canvas dimensions for all EXIF orientations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            width: fc.integer({ min: 100, max: 500 }),
            height: fc.integer({ min: 100, max: 500 }),
            orientation: fc.integer({ min: 1, max: 8 })
          }),
          async ({ width, height, orientation }) => {
            // Create a test canvas with a distinctive pattern
            const originalCanvas = createOrientedCanvas(width, height);
            const image = await canvasToImage(originalCanvas);
            
            // Apply orientation correction
            const correctedCanvas = await correctOrientation(image, orientation);
            
            // Property: Canvas dimensions are correctly transformed based on orientation
            if (orientation >= 5 && orientation <= 8) {
              // Orientations 5-8 swap width and height
              expect(correctedCanvas.width).toBe(height);
              expect(correctedCanvas.height).toBe(width);
            } else {
              // Orientations 1-4 maintain width and height
              expect(correctedCanvas.width).toBe(width);
              expect(correctedCanvas.height).toBe(height);
            }
            
            // Property: Canvas is valid and usable
            expect(correctedCanvas.width).toBeGreaterThan(0);
            expect(correctedCanvas.height).toBeGreaterThan(0);
            
            const ctx = correctedCanvas.getContext('2d');
            expect(ctx).not.toBeNull();
            
            // Property: Canvas has the correct total pixel count
            const expectedPixelCount = correctedCanvas.width * correctedCanvas.height;
            if (ctx) {
              const imageData = ctx.getImageData(0, 0, correctedCanvas.width, correctedCanvas.height);
              const actualPixelCount = imageData.data.length / 4; // 4 values per pixel (RGBA)
              expect(actualPixelCount).toBe(expectedPixelCount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle orientation 1 as identity transformation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            width: fc.integer({ min: 50, max: 500 }),
            height: fc.integer({ min: 50, max: 500 })
          }),
          async ({ width, height }) => {
            // Create a test canvas
            const originalCanvas = createOrientedCanvas(width, height);
            const image = await canvasToImage(originalCanvas);
            
            // Apply orientation 1 (normal - no transformation)
            const correctedCanvas = await correctOrientation(image, 1);
            
            // Dimensions should remain unchanged
            expect(correctedCanvas.width).toBe(width);
            expect(correctedCanvas.height).toBe(height);
            
            // Sample a few pixels to verify content is preserved
            const originalCtx = originalCanvas.getContext('2d');
            const correctedCtx = correctedCanvas.getContext('2d');
            
            if (originalCtx && correctedCtx) {
              const samplePoints = [
                [10, 10],
                [width - 10, 10],
                [10, height - 10],
                [width - 10, height - 10]
              ];
              
              for (const [x, y] of samplePoints) {
                const originalColor = getPixelColor(originalCanvas, x, y);
                const correctedColor = getPixelColor(correctedCanvas, x, y);
                expect(correctedColor).toBe(originalColor);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should swap dimensions for orientations 5-8', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            width: fc.integer({ min: 100, max: 500 }),
            height: fc.integer({ min: 100, max: 500 }),
            orientation: fc.integer({ min: 5, max: 8 })
          }),
          async ({ width, height, orientation }) => {
            // Create a test canvas
            const originalCanvas = createOrientedCanvas(width, height);
            const image = await canvasToImage(originalCanvas);
            
            // Apply orientation correction
            const correctedCanvas = await correctOrientation(image, orientation);
            
            // Dimensions should be swapped for orientations 5-8
            expect(correctedCanvas.width).toBe(height);
            expect(correctedCanvas.height).toBe(width);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain dimensions for orientations 1-4', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            width: fc.integer({ min: 100, max: 500 }),
            height: fc.integer({ min: 100, max: 500 }),
            orientation: fc.integer({ min: 1, max: 4 })
          }),
          async ({ width, height, orientation }) => {
            // Create a test canvas
            const originalCanvas = createOrientedCanvas(width, height);
            const image = await canvasToImage(originalCanvas);
            
            // Apply orientation correction
            const correctedCanvas = await correctOrientation(image, orientation);
            
            // Dimensions should remain the same for orientations 1-4
            expect(correctedCanvas.width).toBe(width);
            expect(correctedCanvas.height).toBe(height);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
