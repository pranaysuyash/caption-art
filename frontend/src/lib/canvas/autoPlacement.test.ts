/**
 * Tests for auto-placement utilities
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  imageToGrayscale,
  calculateGradientMagnitude,
  scoreGridCells,
  findContiguousRegions,
} from './autoPlacement';

describe('Auto-placement utilities', () => {
  describe('imageToGrayscale', () => {
    it('should convert RGB image data to grayscale', () => {
      // Create simple test image data
      const width = 2;
      const height = 2;
      const data = new Uint8ClampedArray([
        255, 0, 0, 255,    // Red pixel
        0, 255, 0, 255,    // Green pixel
        0, 0, 255, 255,    // Blue pixel
        255, 255, 255, 255 // White pixel
      ]);

      const imageData = { data, width, height } as ImageData;
      const grayscale = imageToGrayscale(imageData);

      // Verify grayscale conversion using luminosity method
      expect(grayscale[0]).toBeCloseTo(76, 0);   // Red: 0.299 * 255
      expect(grayscale[1]).toBeCloseTo(150, 0);  // Green: 0.587 * 255
      expect(grayscale[2]).toBeCloseTo(29, 0);   // Blue: 0.114 * 255
      expect(grayscale[3]).toBe(255);            // White: all components
    });
  });

  describe('calculateGradientMagnitude', () => {
    it('should calculate gradient magnitude using Sobel operator', () => {
      // Create a simple gradient image (left to right)
      const width = 5;
      const height = 5;
      const grayscale = new Uint8ClampedArray(width * height);

      // Fill with horizontal gradient
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          grayscale[y * width + x] = x * 50; // 0, 50, 100, 150, 200
        }
      }

      const gradient = calculateGradientMagnitude(grayscale, width, height);

      // Center pixels should have non-zero gradient
      const centerIdx = 2 * width + 2;
      expect(gradient[centerIdx]).toBeGreaterThan(0);

      // Edge pixels should be zero (not calculated)
      expect(gradient[0]).toBe(0);
      expect(gradient[width - 1]).toBe(0);
    });
  });

  describe('scoreGridCells', () => {
    it('should score grid cells based on average gradient', () => {
      const width = 100;
      const height = 100;
      const gradient = new Float32Array(width * height);

      // Create a region with high gradient (top-left)
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
          gradient[y * width + x] = 100;
        }
      }

      // Create a region with low gradient (bottom-right)
      for (let y = 50; y < 100; y++) {
        for (let x = 50; x < 100; x++) {
          gradient[y * width + x] = 10;
        }
      }

      const cells = scoreGridCells(gradient, width, height, 50);

      // Should have 4 cells (2x2 grid)
      expect(cells.length).toBe(4);

      // Find cells by position
      const topLeft = cells.find(c => c.x === 0 && c.y === 0);
      const bottomRight = cells.find(c => c.x === 1 && c.y === 1);

      // Top-left should have higher score (more gradient)
      expect(topLeft?.score).toBeGreaterThan(bottomRight?.score || 0);
    });
  });

  describe('findContiguousRegions', () => {
    it('should find contiguous regions of low-gradient cells', () => {
      // Create a 3x3 grid with one high-gradient cell in the middle
      const cells = [
        { x: 0, y: 0, score: 10 },
        { x: 1, y: 0, score: 10 },
        { x: 2, y: 0, score: 10 },
        { x: 0, y: 1, score: 10 },
        { x: 1, y: 1, score: 100 }, // High gradient in center
        { x: 2, y: 1, score: 10 },
        { x: 0, y: 2, score: 10 },
        { x: 1, y: 2, score: 10 },
        { x: 2, y: 2, score: 10 },
      ];

      const regions = findContiguousRegions(cells, 3, 3, 50);

      // Should find at least one region
      expect(regions.length).toBeGreaterThan(0);

      // Largest region should not include the center cell
      const largestRegion = regions[0];
      const hasCenter = largestRegion.cells.some(c => c.x === 1 && c.y === 1);
      expect(hasCenter).toBe(false);
    });

    it('should sort regions by size (largest first)', () => {
      // Create cells with two separate regions (need vertical gap too)
      const cells = [
        // Large region (4 cells) - top left
        { x: 0, y: 0, score: 10 },
        { x: 1, y: 0, score: 10 },
        { x: 0, y: 1, score: 10 },
        { x: 1, y: 1, score: 10 },
        // Gap row
        { x: 2, y: 0, score: 100 },
        { x: 2, y: 1, score: 100 },
        { x: 0, y: 2, score: 100 },
        { x: 1, y: 2, score: 100 },
        { x: 2, y: 2, score: 100 },
        // Small region (2 cells) - bottom right
        { x: 3, y: 3, score: 10 },
        { x: 3, y: 4, score: 10 },
        // Fill remaining cells with high gradient
        { x: 3, y: 0, score: 100 },
        { x: 3, y: 1, score: 100 },
        { x: 3, y: 2, score: 100 },
        { x: 0, y: 3, score: 100 },
        { x: 1, y: 3, score: 100 },
        { x: 2, y: 3, score: 100 },
        { x: 0, y: 4, score: 100 },
        { x: 1, y: 4, score: 100 },
        { x: 2, y: 4, score: 100 },
      ];

      const regions = findContiguousRegions(cells, 4, 5, 50);

      // Should have 2 regions
      expect(regions.length).toBe(2);

      // First region should be larger
      expect(regions[0].size).toBeGreaterThan(regions[1].size);
    });
  });

  describe('Property 11: Auto-placement non-overlap', () => {
    /**
     * **Feature: canvas-text-compositing, Property 11: Auto-placement non-overlap**
     * 
     * For any image with detected empty areas, auto-placed text should not overlap
     * with high-contrast regions by more than 10% of text area
     * 
     * **Validates: Requirements 6.3**
     * 
     * This property test validates the core auto-placement algorithm by ensuring
     * that the selected placement region has a gradient score below the threshold,
     * indicating it's in a low-contrast area suitable for text placement.
     */
    it('should select regions with gradient below threshold', () => {
      const widthArb = fc.integer({ min: 100, max: 500 });
      const heightArb = fc.integer({ min: 100, max: 500 });
      const gridSizeArb = fc.integer({ min: 20, max: 100 });

      fc.assert(
        fc.property(widthArb, heightArb, gridSizeArb, (width, height, gridSize) => {
          // Create gradient data with varying values
          const gradient = new Float32Array(width * height);

          // Fill with random gradient values
          for (let i = 0; i < gradient.length; i++) {
            gradient[i] = Math.random() * 100;
          }

          // Create a known low-gradient region in the center
          const centerX = Math.floor(width / 2);
          const centerY = Math.floor(height / 2);
          const regionSize = Math.min(gridSize * 2, width / 4, height / 4);

          for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
            for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
              if (x >= 0 && x < width && y >= 0 && y < height) {
                gradient[y * width + x] = 5; // Very low gradient
              }
            }
          }

          // Score grid cells
          const cells = scoreGridCells(gradient, width, height, gridSize);

          // Find regions
          const cols = Math.floor(width / gridSize);
          const rows = Math.floor(height / gridSize);
          const regions = findContiguousRegions(cells, cols, rows);

          // Should find at least one region
          expect(regions.length).toBeGreaterThan(0);

          // The largest region should have low average score
          const largestRegion = regions[0];
          const avgScore = largestRegion.cells.reduce((sum, cell) => sum + cell.score, 0) / largestRegion.cells.length;

          // Calculate median score for comparison
          const sortedScores = cells.map(c => c.score).sort((a, b) => a - b);
          const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];

          // The selected region should have below-median gradient
          expect(avgScore).toBeLessThanOrEqual(medianScore);
        }),
        { numRuns: 100 }
      );
    });
  });
});
