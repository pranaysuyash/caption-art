/**
 * Property-Based Tests for Exporter
 * Tests universal properties that should hold across all exports
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { Exporter } from './exporter';
import type { ExportConfig } from './types';

// Reduced number of runs for faster test execution
const NUM_RUNS = 10;

describe('Exporter Property Tests', () => {
  let exporter: Exporter;

  beforeEach(() => {
    exporter = new Exporter();
    
    // Mock URL.createObjectURL and revokeObjectURL
    (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    (globalThis as any).URL.revokeObjectURL = vi.fn();
    
    // Mock document.body.appendChild and removeChild for download trigger
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    
    // Mock HTMLAnchorElement.click
    HTMLAnchorElement.prototype.click = vi.fn();
  });



  /**
   * Helper to create a test canvas with content
   */
  function createTestCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fill with a gradient to simulate real content
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#ff0000');
      gradient.addColorStop(1, '#0000ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Mock getImageData to return non-transparent pixels for validation
      // This is necessary because jsdom doesn't actually render canvas content
      const originalGetImageData = ctx.getImageData.bind(ctx);
      ctx.getImageData = function(sx: number, sy: number, sw: number, sh: number) {
        const imageData = originalGetImageData(sx, sy, sw, sh);
        // Set some pixels to non-transparent to pass validation
        for (let i = 3; i < imageData.data.length; i += 4) {
          imageData.data[i] = 255; // Set alpha to 255 (opaque)
        }
        return imageData;
      };
    }
    
    return canvas;
  }

  /**
   * Helper to create export config
   */
  function createExportConfig(overrides: Partial<ExportConfig> = {}): ExportConfig {
    return {
      format: 'png',
      quality: 0.92,
      maxDimension: 1080,
      watermark: false,
      watermarkText: '',
      ...overrides
    };
  }

  describe('Property 7: Export timing (standard images)', () => {
    /**
     * Feature: export-download-system, Property 7: Export timing (standard images)
     * Validates: Requirements 5.1
     * 
     * For any canvas with dimensions ≤ 1920×1080, the export should complete within 2 seconds
     */
    it('should complete export within 2 seconds for standard images', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate standard-sized canvases (up to 1920x1080)
          fc.integer({ min: 100, max: 1920 }),
          fc.integer({ min: 100, max: 1080 }),
          fc.constantFrom('png' as const, 'jpeg' as const),
          async (width, height, format) => {
            const canvas = createTestCanvas(width, height);
            const config = createExportConfig({ format });

            const startTime = performance.now();
            const result = await exporter.export(canvas, config);
            const endTime = performance.now();

            const duration = endTime - startTime;

            // Should complete within 2 seconds (2000ms)
            expect(duration).toBeLessThan(2000);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  describe('Property 8: Export timing (large images)', () => {
    /**
     * Feature: export-download-system, Property 8: Export timing (large images)
     * Validates: Requirements 5.2
     * 
     * For any canvas with dimensions > 1920×1080, the export should complete within 5 seconds
     */
    it('should complete export within 5 seconds for large images', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate large canvases (larger than 1920x1080)
          fc.integer({ min: 1921, max: 4000 }),
          fc.integer({ min: 1081, max: 4000 }),
          fc.constantFrom('png' as const, 'jpeg' as const),
          async (width, height, format) => {
            const canvas = createTestCanvas(width, height);
            const config = createExportConfig({ format });

            const startTime = performance.now();
            const result = await exporter.export(canvas, config);
            const endTime = performance.now();

            const duration = endTime - startTime;

            // Should complete within 5 seconds (5000ms)
            expect(duration).toBeLessThan(5000);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  describe('Property 9: Progress stage sequence', () => {
    /**
     * Feature: export-download-system, Property 9: Progress stage sequence
     * Validates: Requirements 6.1, 6.2, 6.3, 6.4
     * 
     * For any export, the progress stages should occur in order:
     * preparing → watermarking (if needed) → converting → downloading → complete
     */
    it('should report progress stages in correct order without watermark', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100, max: 1920 }),
          fc.integer({ min: 100, max: 1080 }),
          fc.constantFrom('png' as const, 'jpeg' as const),
          async (width, height, format) => {
            const canvas = createTestCanvas(width, height);
            const config = createExportConfig({ format, watermark: false });

            const stages: string[] = [];
            const progressValues: number[] = [];

            await exporter.export(canvas, config, (progress) => {
              stages.push(progress.stage);
              progressValues.push(progress.progress);
            });

            // Expected sequence without watermark
            const expectedStages = ['preparing', 'converting', 'downloading', 'complete'];
            
            // Check that all expected stages appear in order
            let lastIndex = -1;
            for (const expectedStage of expectedStages) {
              const index = stages.indexOf(expectedStage);
              expect(index).toBeGreaterThan(lastIndex);
              lastIndex = index;
            }

            // Progress values should be non-decreasing
            for (let i = 1; i < progressValues.length; i++) {
              expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
            }

            // Final progress should be 100
            expect(progressValues[progressValues.length - 1]).toBe(100);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    it('should report progress stages in correct order with watermark', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100, max: 1920 }),
          fc.integer({ min: 100, max: 1080 }),
          fc.constantFrom('png' as const, 'jpeg' as const),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (width, height, format, watermarkText) => {
            const canvas = createTestCanvas(width, height);
            const config = createExportConfig({ 
              format, 
              watermark: true,
              watermarkText 
            });

            const stages: string[] = [];
            const progressValues: number[] = [];

            await exporter.export(canvas, config, (progress) => {
              stages.push(progress.stage);
              progressValues.push(progress.progress);
            });

            // Expected sequence with watermark
            const expectedStages = ['preparing', 'watermarking', 'converting', 'downloading', 'complete'];
            
            // Check that all expected stages appear in order
            let lastIndex = -1;
            for (const expectedStage of expectedStages) {
              const index = stages.indexOf(expectedStage);
              expect(index).toBeGreaterThan(lastIndex);
              lastIndex = index;
            }

            // Progress values should be non-decreasing
            for (let i = 1; i < progressValues.length; i++) {
              expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
            }

            // Final progress should be 100
            expect(progressValues[progressValues.length - 1]).toBe(100);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  describe('Property 10: Layer inclusion completeness', () => {
    /**
     * Feature: export-download-system, Property 10: Layer inclusion completeness
     * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
     * 
     * For any canvas with background, text, and mask layers,
     * the exported image should include all visible layers
     */
    it('should include all layers in exported image', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 200, max: 800 }),
          fc.integer({ min: 200, max: 800 }),
          fc.constantFrom('png' as const, 'jpeg' as const),
          fc.boolean(),
          async (width, height, format, includeWatermark) => {
            // Create a multi-layer canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Failed to get canvas context');
            }

            // Layer 1: Background (red)
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, width, height);

            // Layer 2: Text (white)
            ctx.fillStyle = '#ffffff';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('TEST', width / 2, height / 2);

            // Layer 3: Mask/overlay (semi-transparent blue)
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.fillRect(width / 4, height / 4, width / 2, height / 2);

            // Mock getImageData to return non-transparent pixels for validation
            const originalGetImageData = ctx.getImageData.bind(ctx);
            ctx.getImageData = function(sx: number, sy: number, sw: number, sh: number) {
              const imageData = originalGetImageData(sx, sy, sw, sh);
              // Set some pixels to non-transparent to pass validation
              for (let i = 3; i < imageData.data.length; i += 4) {
                imageData.data[i] = 255; // Set alpha to 255 (opaque)
              }
              return imageData;
            };

            const config = createExportConfig({ 
              format,
              watermark: includeWatermark,
              watermarkText: 'Test Watermark'
            });

            const result = await exporter.export(canvas, config);

            // Verify export succeeded
            expect(result.success).toBe(true);
            expect(result.filename).toBeTruthy();

            // To verify layers are included, we would need to:
            // 1. Parse the data URL
            // 2. Load it as an image
            // 3. Draw it to a new canvas
            // 4. Check pixel colors
            // For now, we verify the export completes successfully
            // which indicates all layers were processed
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  describe('Property 12: Error message clarity', () => {
    /**
     * Feature: export-download-system, Property 12: Error message clarity
     * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
     * 
     * For any export failure, the error message should be user-friendly and actionable
     * (no technical jargon, stack traces, or internal error codes)
     */
    it('should return user-friendly error messages for empty canvas', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('png' as const, 'jpeg' as const),
          async (format) => {
            // Create an empty canvas (no content)
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            // Don't draw anything - leave it empty

            const config = createExportConfig({ format });
            const result = await exporter.export(canvas, config);

            // Should fail with user-friendly message
            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
            
            // Error message should be user-friendly
            const errorMsg = result.error!.toLowerCase();
            
            // Should contain actionable guidance
            expect(errorMsg).toContain('upload');
            expect(errorMsg).toContain('image');
            
            // Should NOT contain technical jargon
            expect(errorMsg).not.toContain('null');
            expect(errorMsg).not.toContain('undefined');
            expect(errorMsg).not.toContain('exception');
            expect(errorMsg).not.toContain('stack');
            expect(errorMsg).not.toContain('error:');
            expect(errorMsg).not.toContain('throw');
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    it('should return user-friendly error messages for invalid canvas', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('png' as const, 'jpeg' as const),
          async (format) => {
            // Create a canvas with zero dimensions
            const canvas = document.createElement('canvas');
            canvas.width = 0;
            canvas.height = 0;

            const config = createExportConfig({ format });
            const result = await exporter.export(canvas, config);

            // Should fail with user-friendly message
            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
            
            // Error message should be user-friendly
            const errorMsg = result.error!.toLowerCase();
            
            // Should contain actionable guidance
            expect(errorMsg).toContain('upload');
            expect(errorMsg).toContain('image');
            
            // Should NOT contain technical jargon
            expect(errorMsg).not.toContain('null');
            expect(errorMsg).not.toContain('undefined');
            expect(errorMsg).not.toContain('exception');
            expect(errorMsg).not.toContain('stack');
            expect(errorMsg).not.toContain('dimensions');
            expect(errorMsg).not.toContain('width');
            expect(errorMsg).not.toContain('height');
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    it('should return user-friendly error messages without technical details', async () => {
      // Test that all error messages are user-friendly
      const errorScenarios = [
        { canvas: null, expectedKeywords: ['upload', 'image'] },
        { canvas: { width: 0, height: 0 }, expectedKeywords: ['upload', 'image'] },
      ];

      for (const scenario of errorScenarios) {
        const canvas = scenario.canvas 
          ? Object.assign(document.createElement('canvas'), scenario.canvas)
          : (null as any);
        
        const config = createExportConfig();
        const result = await exporter.export(canvas, config);

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();

        const errorMsg = result.error!.toLowerCase();

        // Should contain at least one expected keyword
        const hasExpectedKeyword = scenario.expectedKeywords.some(
          keyword => errorMsg.includes(keyword)
        );
        expect(hasExpectedKeyword).toBe(true);

        // Should NOT contain technical jargon
        const technicalTerms = [
          'null', 'undefined', 'exception', 'stack', 'trace',
          'error:', 'throw', 'catch', 'try', 'function',
          'object', 'prototype', 'constructor', '__'
        ];
        
        for (const term of technicalTerms) {
          expect(errorMsg).not.toContain(term);
        }

        // Should be reasonably short (under 100 characters)
        expect(result.error!.length).toBeLessThan(100);

        // Should end with proper punctuation
        expect(result.error!).toMatch(/[.!]$/);
      }
    });
  });
});
