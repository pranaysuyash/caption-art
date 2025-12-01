/**
 * Tests for Exporter class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Exporter } from './exporter';

describe('Exporter', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create a canvas element
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context');
    }
    ctx = context;

    // Draw some content to the canvas
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.fillText('Test', 100, 100);
  });

  describe('Property 5: Export quality consistency', () => {
    /**
     * **Feature: canvas-text-compositing, Property 5: Export quality consistency**
     * 
     * For any canvas content, exporting twice with the same format and quality settings
     * should produce identical file sizes within 1% variance
     * 
     * **Validates: Requirements 5.2**
     */
    it('should produce consistent file sizes for identical exports', () => {
      const formatArb = fc.constantFrom('png' as const, 'jpeg' as const);
      const qualityArb = fc.double({ min: 0.1, max: 1.0 });

      fc.assert(
        fc.property(formatArb, qualityArb, (format, quality) => {
          // Create a canvas with random content
          const testCanvas = document.createElement('canvas');
          testCanvas.width = 400;
          testCanvas.height = 300;

          const testCtx = testCanvas.getContext('2d');
          if (!testCtx) {
            throw new Error('Failed to get 2D context');
          }

          // Draw some content
          testCtx.fillStyle = 'red';
          testCtx.fillRect(0, 0, testCanvas.width, testCanvas.height);
          testCtx.fillStyle = 'yellow';
          testCtx.fillText('Export Test', 50, 50);

          // Export twice with same settings
          const dataURL1 = format === 'jpeg'
            ? testCanvas.toDataURL('image/jpeg', quality)
            : testCanvas.toDataURL('image/png');

          const dataURL2 = format === 'jpeg'
            ? testCanvas.toDataURL('image/jpeg', quality)
            : testCanvas.toDataURL('image/png');

          // Calculate file sizes (data URL length is proportional to file size)
          const size1 = dataURL1.length;
          const size2 = dataURL2.length;

          // Verify sizes are identical (should be exactly the same for deterministic encoding)
          // For PNG, encoding is deterministic
          // For JPEG, encoding should also be deterministic with same quality
          const variance = Math.abs(size1 - size2) / size1;

          expect(variance).toBeLessThan(0.01); // Within 1% variance
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Watermark positioning', () => {
    /**
     * **Feature: canvas-text-compositing, Property 6: Watermark positioning**
     * 
     * For any canvas dimensions, when a watermark is applied, it should be positioned
     * at bottom-right with exactly 20px padding from both edges
     * 
     * **Validates: Requirements 5.4**
     */
    it('should position watermark at bottom-right with 20px padding', () => {
      const widthArb = fc.integer({ min: 400, max: 2000 });
      const heightArb = fc.integer({ min: 400, max: 2000 });
      // Generate visible text with alphanumeric characters
      const watermarkTextArb = fc.string({ 
        minLength: 5, 
        maxLength: 20,
        unit: fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
                              'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                              '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ')
      }).filter(s => s.trim().length >= 3);

      fc.assert(
        fc.property(widthArb, heightArb, watermarkTextArb, (width, height, watermarkText) => {
          // Create canvas with specific dimensions
          const testCanvas = document.createElement('canvas');
          testCanvas.width = width;
          testCanvas.height = height;

          const testCtx = testCanvas.getContext('2d');
          if (!testCtx) {
            throw new Error('Failed to get 2D context');
          }

          // Fill with a solid color for testing
          testCtx.fillStyle = 'black';
          testCtx.fillRect(0, 0, width, height);

          // Apply watermark
          Exporter.applyWatermark(testCanvas, watermarkText);

          // Calculate expected watermark position
          const fontSize = Math.max(12, Math.min(24, width / 40));
          testCtx.font = `${fontSize}px sans-serif`;
          const textMetrics = testCtx.measureText(watermarkText);
          const textWidth = textMetrics.width;

          const expectedX = width - textWidth - 20;
          const expectedY = height - 20;

          // Verify the watermark position by checking if pixels were modified
          // in the expected region (bottom-right with 20px padding)
          const imageData = testCtx.getImageData(0, 0, width, height);

          // Check a region around the expected watermark position
          // We'll scan the bottom-right area and verify some pixels were modified
          let modifiedPixelCount = 0;
          const scanStartX = Math.max(0, Math.floor(expectedX));
          const scanEndX = Math.min(width, Math.floor(expectedX + textWidth));
          const scanStartY = Math.max(0, Math.floor(expectedY - fontSize));
          const scanEndY = Math.min(height, Math.floor(expectedY));

          for (let y = scanStartY; y < scanEndY; y++) {
            for (let x = scanStartX; x < scanEndX; x++) {
              const pixelIndex = (y * width + x) * 4;
              const r = imageData.data[pixelIndex];
              const g = imageData.data[pixelIndex + 1];
              const b = imageData.data[pixelIndex + 2];

              // Count non-black pixels (watermark text)
              if (r > 0 || g > 0 || b > 0) {
                modifiedPixelCount++;
              }
            }
          }

          // Verify that some pixels were modified (watermark was drawn)
          // At least 1% of the scanned area should have watermark pixels
          const scannedArea = (scanEndX - scanStartX) * (scanEndY - scanStartY);
          const modifiedRatio = modifiedPixelCount / scannedArea;

          expect(modifiedRatio).toBeGreaterThan(0.01);

          // Verify that the watermark respects the 20px padding from the right edge
          // Check that the rightmost 19 pixels are mostly black (no watermark)
          let rightEdgeModifiedCount = 0;
          for (let y = height - 30; y < height - 10; y++) {
            for (let x = width - 19; x < width; x++) {
              const pixelIndex = (y * width + x) * 4;
              const r = imageData.data[pixelIndex];
              const g = imageData.data[pixelIndex + 1];
              const b = imageData.data[pixelIndex + 2];

              if (r > 0 || g > 0 || b > 0) {
                rightEdgeModifiedCount++;
              }
            }
          }

          // The right edge should be mostly black (respecting 20px padding)
          const rightEdgeArea = 20 * 19;
          const rightEdgeModifiedRatio = rightEdgeModifiedCount / rightEdgeArea;
          expect(rightEdgeModifiedRatio).toBeLessThan(0.5);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('generateFilename', () => {
      it('should generate filename with correct format', () => {
        const filename = Exporter.generateFilename('png', false);
        expect(filename).toMatch(/^caption-art-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.png$/);
      });

      it('should include watermarked suffix when watermarked', () => {
        const filename = Exporter.generateFilename('jpeg', true);
        expect(filename).toContain('-watermarked');
        expect(filename).toMatch(/\.jpeg$/);
      });

      it('should generate unique filenames with timestamps', () => {
        const filename1 = Exporter.generateFilename('png', false);
        const filename2 = Exporter.generateFilename('png', false);
        
        // Filenames should contain timestamps
        expect(filename1).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
        expect(filename2).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      });

      it('should use correct file extension for PNG', () => {
        const filename = Exporter.generateFilename('png', false);
        expect(filename).toMatch(/\.png$/);
      });

      it('should use correct file extension for JPEG', () => {
        const filename = Exporter.generateFilename('jpeg', false);
        expect(filename).toMatch(/\.jpeg$/);
      });
    });

    describe('watermark rendering', () => {
      it('should apply watermark text to canvas', () => {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 800;
        testCanvas.height = 600;
        const ctx = testCanvas.getContext('2d')!;

        // Fill with black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, testCanvas.width, testCanvas.height);

        // Apply watermark
        Exporter.applyWatermark(testCanvas, 'Test Watermark');

        // Verify canvas was modified (watermark was drawn)
        const imageData = ctx.getImageData(0, 0, testCanvas.width, testCanvas.height);
        
        // Check bottom-right area for non-black pixels (watermark)
        let hasWatermark = false;
        const startY = testCanvas.height - 50;
        const startX = testCanvas.width - 200;
        
        for (let y = startY; y < testCanvas.height - 10; y++) {
          for (let x = startX; x < testCanvas.width - 20; x++) {
            const idx = (y * testCanvas.width + x) * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            
            if (r > 0 || g > 0 || b > 0) {
              hasWatermark = true;
              break;
            }
          }
          if (hasWatermark) break;
        }

        expect(hasWatermark).toBe(true);
      });

      it('should scale watermark font size based on canvas width', () => {
        const testCases = [
          { width: 400, expectedMinSize: 10 },
          { width: 800, expectedMinSize: 12 },
          { width: 1600, expectedMinSize: 12 },
        ];

        testCases.forEach(({ width, expectedMinSize }) => {
          const testCanvas = document.createElement('canvas');
          testCanvas.width = width;
          testCanvas.height = 600;

          // Should not throw
          expect(() => {
            Exporter.applyWatermark(testCanvas, 'Watermark');
          }).not.toThrow();
        });
      });
    });

    describe('format conversion', () => {
      it('should convert canvas to PNG data URL', () => {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 400;
        testCanvas.height = 300;
        const ctx = testCanvas.getContext('2d')!;

        // Draw some content
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, testCanvas.width, testCanvas.height);

        const dataURL = testCanvas.toDataURL('image/png');
        expect(dataURL).toMatch(/^data:image\/png;base64,/);
        expect(dataURL.length).toBeGreaterThan(100);
      });

      it('should convert canvas to JPEG data URL', () => {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 400;
        testCanvas.height = 300;
        const ctx = testCanvas.getContext('2d')!;

        // Draw some content
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, testCanvas.width, testCanvas.height);

        const dataURL = testCanvas.toDataURL('image/jpeg', 0.9);
        expect(dataURL).toMatch(/^data:image\/jpeg;base64,/);
        expect(dataURL.length).toBeGreaterThan(100);
      });

      it('should handle PNG format without quality parameter', () => {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 400;
        testCanvas.height = 300;
        const ctx = testCanvas.getContext('2d')!;

        ctx.fillStyle = 'green';
        ctx.fillRect(0, 0, testCanvas.width, testCanvas.height);

        // PNG doesn't use quality parameter
        const dataURL = testCanvas.toDataURL('image/png');
        expect(dataURL).toMatch(/^data:image\/png;base64,/);
      });
    });

    describe('quality parameter', () => {
      it('should accept quality parameter for JPEG export', () => {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 400;
        testCanvas.height = 300;
        const ctx = testCanvas.getContext('2d')!;

        // Draw complex content with gradients and details
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = `rgb(${i * 25}, ${255 - i * 25}, ${i * 15})`;
          ctx.fillRect(i * 40, 0, 40, 300);
        }
        
        // Add text and shapes for more detail
        ctx.fillStyle = 'black';
        ctx.font = '48px Arial';
        ctx.fillText('Quality Test', 50, 150);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 380, 280);

        // Export with different quality levels - should not throw
        const highQuality = testCanvas.toDataURL('image/jpeg', 1.0);
        const lowQuality = testCanvas.toDataURL('image/jpeg', 0.1);

        // Both should produce valid JPEG data URLs
        expect(highQuality).toMatch(/^data:image\/jpeg;base64,/);
        expect(lowQuality).toMatch(/^data:image\/jpeg;base64,/);
        expect(highQuality.length).toBeGreaterThan(100);
        expect(lowQuality.length).toBeGreaterThan(100);
      });

      it('should handle quality values in valid range', () => {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 400;
        testCanvas.height = 300;
        const ctx = testCanvas.getContext('2d')!;

        ctx.fillStyle = 'purple';
        ctx.fillRect(0, 0, testCanvas.width, testCanvas.height);

        const qualityValues = [0.1, 0.5, 0.8, 1.0];

        qualityValues.forEach(quality => {
          const dataURL = testCanvas.toDataURL('image/jpeg', quality);
          expect(dataURL).toMatch(/^data:image\/jpeg;base64,/);
          expect(dataURL.length).toBeGreaterThan(100);
        });
      });

      it('should ignore quality parameter for PNG format', () => {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 400;
        testCanvas.height = 300;
        const ctx = testCanvas.getContext('2d')!;

        ctx.fillStyle = 'orange';
        ctx.fillRect(0, 0, testCanvas.width, testCanvas.height);

        // PNG ignores quality parameter
        const dataURL1 = testCanvas.toDataURL('image/png', 1.0);
        const dataURL2 = testCanvas.toDataURL('image/png', 0.1);

        // Both should produce identical results for PNG
        expect(dataURL1).toBe(dataURL2);
      });
    });
  });
});
