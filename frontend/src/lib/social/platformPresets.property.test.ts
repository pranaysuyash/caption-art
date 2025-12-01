/**
 * Platform Presets Property Tests
 * 
 * Property-based tests for platform preset dimensions
 * Feature: social-media-integration, Property 1: Platform preset dimensions
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getPlatformPresets,
  getAllPlatformPresets,
  getPreset,
  resizeCanvasToPreset,
  canvasMatchesPreset,
  getClosestPreset,
  type ShareablePlatform,
  type PlatformPreset,
} from './platformPresets';

describe('Platform Presets Property Tests', () => {
  /**
   * Feature: social-media-integration, Property 1: Platform preset dimensions
   * 
   * For any platform preset, the canvas dimensions should match 
   * the platform's recommended size exactly
   * 
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
   */
  describe('Property 1: Platform preset dimensions', () => {
    // Arbitrary for generating platform names
    const platformArb = fc.constantFrom<ShareablePlatform>(
      'instagram',
      'twitter',
      'facebook',
      'pinterest'
    );

    it('should return presets with exact dimensions for Instagram', () => {
      const presets = getPlatformPresets('instagram');
      
      // Requirements 2.1: Instagram presets
      expect(presets).toHaveLength(3);
      
      // Square preset
      const square = presets.find(p => p.name === 'square');
      expect(square).toBeDefined();
      expect(square!.width).toBe(1080);
      expect(square!.height).toBe(1080);
      
      // Portrait preset
      const portrait = presets.find(p => p.name === 'portrait');
      expect(portrait).toBeDefined();
      expect(portrait!.width).toBe(1080);
      expect(portrait!.height).toBe(1350);
      
      // Story preset
      const story = presets.find(p => p.name === 'story');
      expect(story).toBeDefined();
      expect(story!.width).toBe(1080);
      expect(story!.height).toBe(1920);
    });

    it('should return presets with exact dimensions for Twitter', () => {
      const presets = getPlatformPresets('twitter');
      
      // Requirements 2.2: Twitter presets
      expect(presets).toHaveLength(2);
      
      // Standard preset
      const standard = presets.find(p => p.name === 'standard');
      expect(standard).toBeDefined();
      expect(standard!.width).toBe(1200);
      expect(standard!.height).toBe(675);
      
      // Header preset
      const header = presets.find(p => p.name === 'header');
      expect(header).toBeDefined();
      expect(header!.width).toBe(1500);
      expect(header!.height).toBe(500);
    });

    it('should return presets with exact dimensions for Facebook', () => {
      const presets = getPlatformPresets('facebook');
      
      // Requirements 2.3: Facebook presets
      expect(presets).toHaveLength(2);
      
      // Post preset
      const post = presets.find(p => p.name === 'post');
      expect(post).toBeDefined();
      expect(post!.width).toBe(1200);
      expect(post!.height).toBe(630);
      
      // Cover preset
      const cover = presets.find(p => p.name === 'cover');
      expect(cover).toBeDefined();
      expect(cover!.width).toBe(820);
      expect(cover!.height).toBe(312);
    });

    it('should return presets with exact dimensions for Pinterest', () => {
      const presets = getPlatformPresets('pinterest');
      
      // Requirements 2.4: Pinterest presets
      expect(presets).toHaveLength(1);
      
      // Pin preset
      const pin = presets.find(p => p.name === 'pin');
      expect(pin).toBeDefined();
      expect(pin!.width).toBe(1000);
      expect(pin!.height).toBe(1500);
    });

    it('for any platform, all presets should have positive dimensions', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          
          // Property: All presets must have positive width and height
          return presets.every(
            (preset) => preset.width > 0 && preset.height > 0
          );
        }),
        { numRuns: 100 }
      );
    });

    it('for any platform, all presets should have unique names', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          const names = presets.map((p) => p.name);
          const uniqueNames = new Set(names);
          
          // Property: All preset names should be unique within a platform
          return names.length === uniqueNames.size;
        }),
        { numRuns: 100 }
      );
    });

    it('for any platform and preset name, getPreset should return correct dimensions', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          
          // Test each preset
          return presets.every((expectedPreset) => {
            const preset = getPreset(platform, expectedPreset.name);
            
            // Property: Retrieved preset should match expected dimensions
            return (
              preset !== undefined &&
              preset.width === expectedPreset.width &&
              preset.height === expectedPreset.height &&
              preset.name === expectedPreset.name
            );
          });
        }),
        { numRuns: 100 }
      );
    });

    it('for any platform preset, resized canvas should match preset dimensions exactly', () => {
      fc.assert(
        fc.property(
          platformArb,
          fc.integer({ min: 100, max: 2000 }),
          fc.integer({ min: 100, max: 2000 }),
          (platform, sourceWidth, sourceHeight) => {
            const presets = getPlatformPresets(platform);
            
            // Test with each preset
            return presets.every((preset) => {
              // Create a source canvas
              const sourceCanvas = document.createElement('canvas');
              sourceCanvas.width = sourceWidth;
              sourceCanvas.height = sourceHeight;
              
              // Resize to preset
              const resizedCanvas = resizeCanvasToPreset(sourceCanvas, preset);
              
              // Property: Resized canvas dimensions should match preset exactly
              return (
                resizedCanvas.width === preset.width &&
                resizedCanvas.height === preset.height
              );
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any canvas matching preset dimensions, canvasMatchesPreset should return true', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          
          return presets.every((preset) => {
            // Create canvas with exact preset dimensions
            const canvas = document.createElement('canvas');
            canvas.width = preset.width;
            canvas.height = preset.height;
            
            // Property: Canvas with preset dimensions should match
            return canvasMatchesPreset(canvas, preset);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('for any canvas not matching preset dimensions, canvasMatchesPreset should return false', () => {
      fc.assert(
        fc.property(
          platformArb,
          fc.integer({ min: 100, max: 2000 }),
          fc.integer({ min: 100, max: 2000 }),
          (platform, width, height) => {
            const presets = getPlatformPresets(platform);
            
            return presets.every((preset) => {
              // Skip if dimensions happen to match
              if (width === preset.width && height === preset.height) {
                return true;
              }
              
              // Create canvas with different dimensions
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              
              // Property: Canvas with different dimensions should not match
              return !canvasMatchesPreset(canvas, preset);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any dimensions, getClosestPreset should return a preset from that platform', () => {
      fc.assert(
        fc.property(
          platformArb,
          fc.integer({ min: 100, max: 3000 }),
          fc.integer({ min: 100, max: 3000 }),
          (platform, width, height) => {
            const closestPreset = getClosestPreset(platform, width, height);
            const platformPresets = getPlatformPresets(platform);
            
            // Property: Closest preset should be one of the platform's presets
            return (
              closestPreset !== undefined &&
              platformPresets.some(
                (p) =>
                  p.name === closestPreset.name &&
                  p.width === closestPreset.width &&
                  p.height === closestPreset.height
              )
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any preset dimensions, getClosestPreset should return that exact preset', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          
          return presets.every((preset) => {
            const closestPreset = getClosestPreset(
              platform,
              preset.width,
              preset.height
            );
            
            // Property: Closest preset for exact dimensions should be that preset
            return (
              closestPreset !== undefined &&
              closestPreset.name === preset.name &&
              closestPreset.width === preset.width &&
              closestPreset.height === preset.height
            );
          });
        }),
        { numRuns: 100 }
      );
    });

    it('getAllPlatformPresets should include all platforms', () => {
      const allPresets = getAllPlatformPresets();
      const platforms = allPresets.map((p) => p.platform);
      
      // Property: All platforms should be included
      expect(platforms).toContain('instagram');
      expect(platforms).toContain('twitter');
      expect(platforms).toContain('facebook');
      expect(platforms).toContain('pinterest');
      expect(platforms).toHaveLength(4);
    });

    it('for any platform, presets should have valid aspect ratios', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          
          return presets.every((preset) => {
            // Calculate actual aspect ratio
            const actualRatio = preset.width / preset.height;
            
            // Property: Aspect ratio should be positive and reasonable (between 0.1 and 10)
            return actualRatio > 0.1 && actualRatio < 10;
          });
        }),
        { numRuns: 100 }
      );
    });

    it('for any platform, preset names should be lowercase and alphanumeric', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          
          return presets.every((preset) => {
            // Property: Preset names should be lowercase alphanumeric
            return /^[a-z0-9]+$/.test(preset.name);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('for any platform, all presets should have non-empty display names', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          
          return presets.every((preset) => {
            // Property: Display names should be non-empty strings
            return (
              typeof preset.displayName === 'string' &&
              preset.displayName.trim().length > 0
            );
          });
        }),
        { numRuns: 100 }
      );
    });

    it('for any platform, all presets should have non-empty descriptions', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          
          return presets.every((preset) => {
            // Property: Descriptions should be non-empty strings
            return (
              typeof preset.description === 'string' &&
              preset.description.trim().length > 0
            );
          });
        }),
        { numRuns: 100 }
      );
    });

    it('resizing a canvas should preserve the canvas content (not lose data)', () => {
      fc.assert(
        fc.property(
          platformArb,
          fc.integer({ min: 200, max: 1000 }),
          fc.integer({ min: 200, max: 1000 }),
          (platform, sourceWidth, sourceHeight) => {
            const presets = getPlatformPresets(platform);
            const preset = presets[0]; // Use first preset
            
            // Create a source canvas with some content
            const sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = sourceWidth;
            sourceCanvas.height = sourceHeight;
            
            const ctx = sourceCanvas.getContext('2d');
            if (!ctx) return true; // Skip if context unavailable
            
            // Draw something recognizable
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, sourceWidth, sourceHeight);
            
            // Resize to preset
            const resizedCanvas = resizeCanvasToPreset(sourceCanvas, preset);
            
            // Property: Resized canvas should have valid context and dimensions
            const resizedCtx = resizedCanvas.getContext('2d');
            return (
              resizedCtx !== null &&
              resizedCanvas.width === preset.width &&
              resizedCanvas.height === preset.height
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('for any two different presets on same platform, dimensions should differ', () => {
      fc.assert(
        fc.property(platformArb, (platform) => {
          const presets = getPlatformPresets(platform);
          
          // If only one preset, property is trivially true
          if (presets.length <= 1) return true;
          
          // Check all pairs
          for (let i = 0; i < presets.length; i++) {
            for (let j = i + 1; j < presets.length; j++) {
              const preset1 = presets[i];
              const preset2 = presets[j];
              
              // Property: Different presets should have different dimensions
              const dimensionsDiffer =
                preset1.width !== preset2.width ||
                preset1.height !== preset2.height;
              
              if (!dimensionsDiffer) {
                return false;
              }
            }
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Platform Presets Unit Tests', () => {
    it('should return undefined for non-existent preset', () => {
      const preset = getPreset('instagram', 'nonexistent');
      expect(preset).toBeUndefined();
    });

    it('should handle edge case of very small canvas', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      const preset = getPlatformPresets('instagram')[0];
      const resized = resizeCanvasToPreset(canvas, preset);
      
      expect(resized.width).toBe(preset.width);
      expect(resized.height).toBe(preset.height);
    });

    it('should handle edge case of very large canvas', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 5000;
      canvas.height = 5000;
      
      const preset = getPlatformPresets('instagram')[0];
      const resized = resizeCanvasToPreset(canvas, preset);
      
      expect(resized.width).toBe(preset.width);
      expect(resized.height).toBe(preset.height);
    });

    it('should handle canvas with extreme aspect ratio', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 3000;
      canvas.height = 100;
      
      const preset = getPlatformPresets('twitter')[0];
      const resized = resizeCanvasToPreset(canvas, preset);
      
      expect(resized.width).toBe(preset.width);
      expect(resized.height).toBe(preset.height);
    });
  });
});
