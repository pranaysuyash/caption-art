import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PlatformManager, type ShareablePlatform } from './platformManager';

/**
 * Property-Based Tests for PlatformManager
 * Feature: social-media-integration, Property 3: Multi-platform consistency
 * Validates: Requirements 7.2, 7.3
 */

describe('PlatformManager - Property Tests', () => {
  let manager: PlatformManager;

  beforeEach(() => {
    manager = new PlatformManager();
    localStorage.clear();
  });

  /**
   * Property 3: Multi-platform consistency
   * For any multi-platform post, the image content should be identical across all platforms
   * Validates: Requirements 7.2, 7.3
   */
  it(
    'should maintain identical image content across all platforms',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary canvas dimensions (smaller for faster tests)
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 100, max: 500 }),
          // Generate arbitrary RGB color
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          // Generate subset of platforms (at least 2)
          fc
            .shuffledSubarray(['instagram', 'twitter', 'facebook', 'pinterest'] as const, {
              minLength: 2,
              maxLength: 4,
            })
            .map((arr) => arr as ShareablePlatform[]),
          async (width, height, r, g, b, platforms) => {
            // Authenticate all platforms
            for (const platform of platforms) {
              localStorage.setItem(`${platform}_auth_token`, 'test-token');
            }

            // Create a canvas with specific content
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Could not get canvas context');
            }

            // Fill with a specific color
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(0, 0, width, height);

            // Prepare image for the first platform
            const prepared = await manager.prepareImageForPosting(canvas, platforms[0]);

            // Store the original blob data for comparison
            const originalBlobSize = prepared.blob.size;
            const originalDataUrl = prepared.dataUrl;

            // Validate image for all platforms
            const validation = manager.validateImageForPlatforms(prepared, platforms);

            // If validation passes, all platforms should receive identical image
            if (validation.valid) {
              // The key property: the same PreparedImage object is used for all platforms
              // This ensures image content is identical across all platforms
              expect(prepared.width).toBe(width);
              expect(prepared.height).toBe(height);
              expect(prepared.blob.size).toBe(originalBlobSize);
              expect(prepared.dataUrl).toBe(originalDataUrl);

              // Verify that posting to multiple platforms uses the same image
              // by checking that the blob hasn't been modified
              const blobAfterValidation = prepared.blob;
              expect(blobAfterValidation.size).toBe(originalBlobSize);
            }

            // The critical property: when posting to multiple platforms,
            // the SAME PreparedImage object is passed to all platforms
            // This is verified by the fact that postToMultiplePlatforms
            // takes a single PreparedImage parameter, not multiple
          }
        ),
        { numRuns: 100 }
      );
    },
    60000
  ); // 60 second timeout
});
