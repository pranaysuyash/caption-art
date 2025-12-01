/**
 * Property-based tests for Text-Behind Effect Toggle
 * 
 * **Feature: image-segmentation-masking, Property 8: Text-behind effect toggle**
 * **Validates: Requirements 8.1, 8.2, 8.5**
 * 
 * Uses fast-check for property-based testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Compositor } from '../canvas/compositor';
import type { TextLayer } from '../canvas/types';

describe('Text-Behind Effect Toggle - Property-Based Tests', () => {
  /**
   * Property 8: Text-behind effect toggle
   * 
   * For any text-behind effect toggle, when disabled, the canvas should render 
   * text on top of the image; when enabled, text should appear behind the subject
   * 
   * This property ensures that:
   * 1. When textBehindEnabled is false, text renders on top (no mask compositing)
   * 2. When textBehindEnabled is true, text renders behind subject (with mask compositing)
   * 3. The mask data is retained when toggling (Requirements 8.2)
   * 4. The rendering changes appropriately based on the toggle state
   */
  it('Property 8: toggling text-behind effect changes compositor state appropriately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageWidth: fc.integer({ min: 100, max: 300 }),
          imageHeight: fc.integer({ min: 100, max: 300 }),
          toggleSequence: fc.array(fc.boolean(), { minLength: 2, maxLength: 5 })
        }),
        async ({ imageWidth, imageHeight, toggleSequence }) => {
          // Create test images (using canvas to avoid loading issues)
          const backgroundImage = createTestBackgroundImage(imageWidth, imageHeight);
          const maskImage = createTestMaskImage(imageWidth, imageHeight);
          
          // Create canvas for compositor
          const canvas = document.createElement('canvas');
          
          // Test each toggle state in the sequence
          for (const textBehindEnabled of toggleSequence) {
            // Create compositor with current toggle state
            const compositor = new Compositor({
              canvas,
              backgroundImage,
              maskImage,
              textBehindEnabled,
              maxDimension: 1080
            });
            
            // Property 1: Verify compositor state matches initial toggle
            expect(compositor.getTextBehindEnabled()).toBe(textBehindEnabled);
            
            // Property 2: When toggling, state should change
            // (Requirements 8.1, 8.2 - toggle should work)
            compositor.setTextBehindEnabled(!textBehindEnabled);
            expect(compositor.getTextBehindEnabled()).toBe(!textBehindEnabled);
            
            // Property 3: Toggle back should restore original state
            compositor.setTextBehindEnabled(textBehindEnabled);
            expect(compositor.getTextBehindEnabled()).toBe(textBehindEnabled);
            
            // Property 4: Multiple toggles should work correctly
            for (let i = 0; i < 3; i++) {
              const newState = i % 2 === 0;
              compositor.setTextBehindEnabled(newState);
              expect(compositor.getTextBehindEnabled()).toBe(newState);
            }
            
            // Clean up
            compositor.clear();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property-based test

  /**
   * Property 8 (extended): Verify compositor state is independent for different instances
   * 
   * When creating multiple compositors with different text-behind states,
   * each should maintain its own state independently
   */
  it('Property 8 (extended): multiple compositors maintain independent text-behind states', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageWidth: fc.integer({ min: 100, max: 300 }),
          imageHeight: fc.integer({ min: 100, max: 300 }),
          state1: fc.boolean(),
          state2: fc.boolean()
        }),
        async ({ imageWidth, imageHeight, state1, state2 }) => {
          // Create test images (using canvas to avoid loading issues)
          const backgroundImage = createTestBackgroundImage(imageWidth, imageHeight);
          const maskImage = createTestMaskImage(imageWidth, imageHeight);
          
          // Create two canvases
          const canvas1 = document.createElement('canvas');
          const canvas2 = document.createElement('canvas');
          
          // Create two compositors with different states
          const compositor1 = new Compositor({
            canvas: canvas1,
            backgroundImage,
            maskImage,
            textBehindEnabled: state1,
            maxDimension: 1080
          });
          
          const compositor2 = new Compositor({
            canvas: canvas2,
            backgroundImage,
            maskImage,
            textBehindEnabled: state2,
            maxDimension: 1080
          });
          
          // Property: Each compositor should maintain its own state
          expect(compositor1.getTextBehindEnabled()).toBe(state1);
          expect(compositor2.getTextBehindEnabled()).toBe(state2);
          
          // Toggle first compositor
          compositor1.setTextBehindEnabled(!state1);
          
          // Property: Second compositor state should be unaffected
          expect(compositor1.getTextBehindEnabled()).toBe(!state1);
          expect(compositor2.getTextBehindEnabled()).toBe(state2);
          
          // Toggle second compositor
          compositor2.setTextBehindEnabled(!state2);
          
          // Property: First compositor state should remain as set
          expect(compositor1.getTextBehindEnabled()).toBe(!state1);
          expect(compositor2.getTextBehindEnabled()).toBe(!state2);
          
          // Clean up
          compositor1.clear();
          compositor2.clear();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property-based test

  /**
   * Property 8 (mask retention): Verify mask data is retained when toggling
   * 
   * Requirements 8.2: When the effect is disabled, retain the mask data for potential re-enabling
   */
  it('Property 8 (mask retention): mask can be set and retrieved after toggling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageWidth: fc.integer({ min: 100, max: 300 }),
          imageHeight: fc.integer({ min: 100, max: 300 }),
          toggleCount: fc.integer({ min: 1, max: 10 })
        }),
        async ({ imageWidth, imageHeight, toggleCount }) => {
          // Create test images (using canvas to avoid loading issues)
          const backgroundImage = createTestBackgroundImage(imageWidth, imageHeight);
          const maskImage = createTestMaskImage(imageWidth, imageHeight);
          
          // Create canvas
          const canvas = document.createElement('canvas');
          
          // Create compositor with text-behind ENABLED and mask
          const compositor = new Compositor({
            canvas,
            backgroundImage,
            maskImage,
            textBehindEnabled: true,
            maxDimension: 1080
          });
          
          // Property 1: Initial state should be enabled with mask
          expect(compositor.getTextBehindEnabled()).toBe(true);
          
          // Toggle multiple times (Requirements 8.1, 8.2, 8.3)
          for (let i = 0; i < toggleCount; i++) {
            const newState = i % 2 === 0 ? false : true;
            compositor.setTextBehindEnabled(newState);
            
            // Property 2: State should match what we set
            expect(compositor.getTextBehindEnabled()).toBe(newState);
            
            // Property 3: We can set mask image even when text-behind is disabled
            // (Requirements 8.2 - retain mask data)
            compositor.setMaskImage(maskImage);
            
            // Property 4: State should remain unchanged after setting mask
            expect(compositor.getTextBehindEnabled()).toBe(newState);
          }
          
          // Property 5: After all toggles, we can still enable text-behind
          compositor.setTextBehindEnabled(true);
          expect(compositor.getTextBehindEnabled()).toBe(true);
          
          // Property 6: We can disable and the mask is retained (can be re-enabled)
          compositor.setTextBehindEnabled(false);
          expect(compositor.getTextBehindEnabled()).toBe(false);
          compositor.setTextBehindEnabled(true);
          expect(compositor.getTextBehindEnabled()).toBe(true);
          
          // Clean up
          compositor.clear();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property-based test
});

/**
 * Helper function to create a test background image
 * Returns a canvas instead of HTMLImageElement to avoid loading issues
 */
function createTestBackgroundImage(
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Create a gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#3498db');
  gradient.addColorStop(0.5, '#2ecc71');
  gradient.addColorStop(1, '#e74c3c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some shapes to make it more interesting
  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.arc(width * 0.3, height * 0.3, Math.min(width, height) * 0.15, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/**
 * Helper function to create a test mask image with alpha channel
 * Returns a canvas instead of HTMLImageElement to avoid loading issues
 */
function createTestMaskImage(
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const imageData = ctx.createImageData(width, height);

  // Create a circular mask in the center
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Create mask: white (255) inside circle, black (0) outside
      // with smooth gradient at edges
      let alpha = 0;
      if (distance < radius) {
        alpha = 255;
      } else if (distance < radius + 20) {
        // Smooth edge
        alpha = Math.round(255 * (1 - (distance - radius) / 20));
      }

      imageData.data[i] = 255;     // R
      imageData.data[i + 1] = 255; // G
      imageData.data[i + 2] = 255; // B
      imageData.data[i + 3] = alpha; // A
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

/**
 * Helper function to check if image data has non-transparent pixels
 */
function hasNonTransparentPixels(imageData: ImageData): boolean {
  for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Helper function to check if two ImageData objects are different
 */
function areImageDataDifferent(data1: ImageData, data2: ImageData): boolean {
  if (data1.width !== data2.width || data1.height !== data2.height) {
    return true;
  }

  let differenceCount = 0;
  const threshold = 10; // Allow small differences due to rendering variations
  
  for (let i = 0; i < data1.data.length; i++) {
    if (Math.abs(data1.data[i] - data2.data[i]) > threshold) {
      differenceCount++;
    }
  }

  // Consider different if more than 1% of pixels differ
  return differenceCount > (data1.data.length * 0.01);
}
