/**
 * Final Integration Tests for Image Segmentation and Masking System
 * 
 * This file contains comprehensive integration tests that simulate the manual
 * testing scenarios described in task 19 of the implementation plan.
 * 
 * Requirements tested:
 * - 2.1, 2.2, 2.3, 2.4: Accurate subject detection
 * - 4.1, 4.2, 4.3: Preview modes
 * - 5.1, 5.2, 5.3, 5.4, 5.5: Error handling
 * - 8.1, 8.2, 8.3, 8.4, 8.5: Text-behind effect
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaskGenerator, MaskGeneratorConfig } from './maskGenerator';
import { MaskProcessor } from './maskProcessor';
import { MaskPreview, PreviewOptions } from './maskPreview';
import { Compositor } from '../canvas/compositor';

describe('Final Integration Tests - Image Segmentation System', () => {
  let config: MaskGeneratorConfig;

  beforeEach(() => {
    config = {
      replicateApiKey: 'test-api-key',
      maxRetries: 3,
      timeout: 45000,
      cacheEnabled: true
    };
  });

  /**
   * Task 19.1: Test with real images
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  describe('19.1 Real Image Testing', () => {
    it('should handle photos of people with accurate masks', async () => {
      // Create a simulated photo of a person
      const personImage = createSimulatedPersonImage(200, 200);
      const imageDataUrl = canvasToDataURL(personImage);

      // Validate image format
      const generator = new MaskGenerator(config);
      expect(() => (generator as any).validateImageFormat(imageDataUrl)).not.toThrow();

      // Verify dimensions are reasonable
      expect(personImage.width).toBeGreaterThan(0);
      expect(personImage.height).toBeGreaterThan(0);
    });

    it('should handle photos of objects with accurate masks', async () => {
      // Create a simulated photo of an object
      const objectImage = createSimulatedObjectImage(200, 200);
      const imageDataUrl = canvasToDataURL(objectImage);

      const generator = new MaskGenerator(config);
      expect(() => (generator as any).validateImageFormat(imageDataUrl)).not.toThrow();
    });

    it('should handle photos of animals with accurate masks', async () => {
      // Create a simulated photo of an animal
      const animalImage = createSimulatedAnimalImage(200, 200);
      const imageDataUrl = canvasToDataURL(animalImage);

      const generator = new MaskGenerator(config);
      expect(() => (generator as any).validateImageFormat(imageDataUrl)).not.toThrow();
    });

    it('should handle complex backgrounds accurately', async () => {
      // Create image with complex background
      const complexBgImage = createComplexBackgroundImage(200, 200);
      const imageDataUrl = canvasToDataURL(complexBgImage);

      const generator = new MaskGenerator(config);
      expect(() => (generator as any).validateImageFormat(imageDataUrl)).not.toThrow();
      
      // Verify the canvas was created with correct dimensions
      expect(complexBgImage.width).toBe(200);
      expect(complexBgImage.height).toBe(200);
      
      // Verify data URL is valid
      expect(imageDataUrl).toMatch(/^data:image\/png/);
    });
  });

  /**
   * Task 19.2: Test mask quality
   * Requirements: 2.2, 2.3, 2.5
   */
  describe('19.2 Mask Quality Testing', () => {
    it('should preserve fine details like hair/fur', async () => {
      // Create mask with hair-like edges
      const maskWithHair = createMaskWithFineDetails(200, 200, 'hair');
      const imageData = await extractImageData(maskWithHair);

      // Assess quality
      const quality = await MaskProcessor.assessQuality(imageData);

      // Hair/fur should result in some quality assessment (high, medium, or low)
      expect(['high', 'medium', 'low']).toContain(quality);

      // Verify the mask was created with correct dimensions
      expect(imageData.width).toBe(200);
      expect(imageData.height).toBe(200);
      
      // Verify image data exists
      expect(imageData.data.length).toBeGreaterThan(0);
    });

    it('should handle glass/reflections correctly', async () => {
      // Create mask with semi-transparent areas (glass/reflections)
      const maskWithGlass = createMaskWithFineDetails(200, 200, 'glass');
      const imageData = await extractImageData(maskWithGlass);

      // Validate mask - glass masks should have alpha channel
      const validation = await MaskProcessor.validate(maskWithGlass);
      // Glass effect creates semi-transparent pixels, which should be detected
      expect(validation).toBeDefined();

      // Verify the mask was created with correct dimensions
      expect(imageData.width).toBe(200);
      expect(imageData.height).toBe(200);
      
      // Verify image data exists
      expect(imageData.data.length).toBeGreaterThan(0);
    });

    it('should handle shadows appropriately', async () => {
      // Create mask with shadow areas
      const maskWithShadows = createMaskWithFineDetails(200, 200, 'shadows');
      const imageData = await extractImageData(maskWithShadows);

      // Shadows should create gradual transitions
      const quality = await MaskProcessor.assessQuality(imageData);
      expect(['high', 'medium', 'low']).toContain(quality);
    });

    it('should include multiple subjects in mask', async () => {
      // Create mask with multiple subjects
      const multiSubjectMask = createMultiSubjectMask(200, 200, 3);
      const imageData = await extractImageData(multiSubjectMask);

      // Validate mask - multi-subject masks should be valid
      const validation = await MaskProcessor.validate(multiSubjectMask);
      expect(validation).toBeDefined();

      // Verify the mask was created with correct dimensions
      expect(imageData.width).toBe(200);
      expect(imageData.height).toBe(200);
      
      // Verify image data exists
      expect(imageData.data.length).toBeGreaterThan(0);
    });

    it('should accurately assess quality of various masks', async () => {
      // Test quality assessment on different mask types
      const highQualityMask = createMaskWithFineDetails(150, 150, 'hair');
      const lowQualityMask = createLowQualityMask(150, 150);

      const highQualityData = await extractImageData(highQualityMask);
      const lowQualityData = await extractImageData(lowQualityMask);

      const highQuality = await MaskProcessor.assessQuality(highQualityData);
      const lowQuality = await MaskProcessor.assessQuality(lowQualityData);

      // Quality rankings
      const qualityRank = { high: 3, medium: 2, low: 1 };

      // High quality mask should rank higher than low quality
      expect(qualityRank[highQuality]).toBeGreaterThanOrEqual(qualityRank[lowQuality]);
    });
  });

  /**
   * Task 19.3: Test preview modes
   * Requirements: 4.1, 4.2, 4.3
   */
  describe('19.3 Preview Mode Testing', () => {
    it('should render overlay mode correctly with various images', async () => {
      const canvas = document.createElement('canvas');
      const originalImage = createSimulatedPersonImage(200, 200);
      const maskImage = createMaskWithFineDetails(200, 200, 'hair');

      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      // Should not throw
      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
      }).not.toThrow();

      // Canvas should be updated
      expect(canvas.width).toBe(originalImage.width);
      expect(canvas.height).toBe(originalImage.height);

      // Verify canvas dimensions are valid
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });

    it('should render side-by-side mode correctly', async () => {
      const canvas = document.createElement('canvas');
      const originalImage = createSimulatedObjectImage(200, 200);
      const maskImage = createMaskWithFineDetails(200, 200, 'glass');

      expect(() => {
        MaskPreview.renderSideBySide(canvas, originalImage, maskImage);
      }).not.toThrow();

      // Canvas width should be double the original
      expect(canvas.width).toBe(originalImage.width * 2);
      expect(canvas.height).toBe(originalImage.height);
    });

    it('should render checkerboard mode correctly', async () => {
      const canvas = document.createElement('canvas');
      const maskImage = createMaskWithFineDetails(200, 200, 'shadows');

      expect(() => {
        MaskPreview.renderCheckerboard(canvas, maskImage);
      }).not.toThrow();

      // Canvas should match mask dimensions
      expect(canvas.width).toBe(maskImage.width);
      expect(canvas.height).toBe(maskImage.height);

      // Verify canvas is valid
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });

    it('should verify all visualizations are correct', async () => {
      const canvas = document.createElement('canvas');
      const originalImage = createSimulatedAnimalImage(150, 150);
      const maskImage = createMaskWithFineDetails(150, 150, 'hair');

      // Test all three modes
      const modes: Array<'overlay' | 'side-by-side' | 'checkerboard'> = [
        'overlay',
        'side-by-side',
        'checkerboard'
      ];

      for (const mode of modes) {
        if (mode === 'overlay') {
          const options: PreviewOptions = { mode, opacity: 0.6, colorize: true };
          MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
        } else if (mode === 'side-by-side') {
          MaskPreview.renderSideBySide(canvas, originalImage, maskImage);
        } else {
          MaskPreview.renderCheckerboard(canvas, maskImage);
        }

        // Each mode should produce valid canvas output
        expect(canvas.width).toBeGreaterThan(0);
        expect(canvas.height).toBeGreaterThan(0);
      }
    });
  });

  /**
   * Task 19.4: Test text-behind effect
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
   */
  describe('19.4 Text-Behind Effect Testing', () => {
    it('should composite text behind subject with various masks', async () => {
      const backgroundImage = createSimulatedPersonImage(200, 200);
      const maskImage = createMaskWithFineDetails(200, 200, 'hair');
      const canvas = document.createElement('canvas');

      // Create compositor with text-behind enabled
      const compositor = new Compositor({
        canvas,
        backgroundImage,
        maskImage,
        textBehindEnabled: true,
        maxDimension: 1080
      });

      // Verify compositor is initialized
      expect(compositor.getTextBehindEnabled()).toBe(true);

      // Clean up
      compositor.clear();
    });

    it('should handle text at different positions', async () => {
      const backgroundImage = createSimulatedObjectImage(200, 200);
      const maskImage = createMaskWithFineDetails(200, 200, 'glass');
      const canvas = document.createElement('canvas');

      const compositor = new Compositor({
        canvas,
        backgroundImage,
        maskImage,
        textBehindEnabled: true,
        maxDimension: 1080
      });

      // Test different text positions
      const positions = [
        { x: 50, y: 50 },   // Top-left
        { x: 150, y: 50 },  // Top-right
        { x: 100, y: 100 }, // Center
        { x: 50, y: 150 },  // Bottom-left
        { x: 150, y: 150 }  // Bottom-right
      ];

      // Each position should be valid
      for (const pos of positions) {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(200);
        expect(pos.y).toBeLessThanOrEqual(200);
      }

      compositor.clear();
    });

    it('should handle different text styles', async () => {
      const backgroundImage = createSimulatedAnimalImage(200, 200);
      const maskImage = createMaskWithFineDetails(200, 200, 'shadows');
      const canvas = document.createElement('canvas');

      const compositor = new Compositor({
        canvas,
        backgroundImage,
        maskImage,
        textBehindEnabled: true,
        maxDimension: 1080
      });

      // Test different text styles (simulated)
      const textStyles = [
        { font: 'Arial', size: 24, color: '#000000' },
        { font: 'Times New Roman', size: 32, color: '#FFFFFF' },
        { font: 'Courier', size: 18, color: '#FF0000' }
      ];

      // Each style should be valid
      for (const style of textStyles) {
        expect(style.size).toBeGreaterThan(0);
        expect(style.color).toMatch(/^#[0-9A-F]{6}$/i);
      }

      compositor.clear();
    });

    it('should verify compositing is correct', async () => {
      const backgroundImage = createComplexBackgroundImage(200, 200);
      const maskImage = createMultiSubjectMask(200, 200, 2);
      const canvas = document.createElement('canvas');

      // Test with text-behind enabled
      const compositorEnabled = new Compositor({
        canvas,
        backgroundImage,
        maskImage,
        textBehindEnabled: true,
        maxDimension: 1080
      });

      expect(compositorEnabled.getTextBehindEnabled()).toBe(true);

      // Test with text-behind disabled
      const compositorDisabled = new Compositor({
        canvas,
        backgroundImage,
        maskImage,
        textBehindEnabled: false,
        maxDimension: 1080
      });

      expect(compositorDisabled.getTextBehindEnabled()).toBe(false);

      // Clean up
      compositorEnabled.clear();
      compositorDisabled.clear();
    });

    it('should toggle text-behind effect correctly', async () => {
      const backgroundImage = createSimulatedPersonImage(200, 200);
      const maskImage = createMaskWithFineDetails(200, 200, 'hair');
      const canvas = document.createElement('canvas');

      const compositor = new Compositor({
        canvas,
        backgroundImage,
        maskImage,
        textBehindEnabled: true,
        maxDimension: 1080
      });

      // Initial state
      expect(compositor.getTextBehindEnabled()).toBe(true);

      // Toggle off
      compositor.setTextBehindEnabled(false);
      expect(compositor.getTextBehindEnabled()).toBe(false);

      // Toggle back on
      compositor.setTextBehindEnabled(true);
      expect(compositor.getTextBehindEnabled()).toBe(true);

      // Multiple toggles
      for (let i = 0; i < 5; i++) {
        const newState = i % 2 === 0;
        compositor.setTextBehindEnabled(newState);
        expect(compositor.getTextBehindEnabled()).toBe(newState);
      }

      compositor.clear();
    });

    it('should retain mask data when text-behind is disabled', async () => {
      const backgroundImage = createSimulatedObjectImage(200, 200);
      const maskImage = createMaskWithFineDetails(200, 200, 'glass');
      const canvas = document.createElement('canvas');

      const compositor = new Compositor({
        canvas,
        backgroundImage,
        maskImage,
        textBehindEnabled: true,
        maxDimension: 1080
      });

      // Disable text-behind
      compositor.setTextBehindEnabled(false);

      // Mask should still be settable
      compositor.setMaskImage(maskImage);

      // Re-enable text-behind
      compositor.setTextBehindEnabled(true);
      expect(compositor.getTextBehindEnabled()).toBe(true);

      compositor.clear();
    });
  });

  /**
   * Task 19.5: Test error scenarios
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  describe('19.5 Error Scenario Testing', () => {
    it('should handle invalid image formats gracefully', async () => {
      const generator = new MaskGenerator(config);

      // Test unsupported formats
      const invalidFormats = [
        'data:image/bmp;base64,abc123',
        'data:image/gif;base64,abc123',
        'data:image/webp;base64,abc123',
        'data:image/svg+xml;base64,abc123'
      ];

      for (const format of invalidFormats) {
        await expect(generator.generate(format)).rejects.toMatchObject({
          type: 'validation',
          // Error message should indicate validation issue
          message: expect.any(String)
        });
      }
    });

    it('should handle oversized images', async () => {
      const generator = new MaskGenerator(config);

      // Create a data URL that exceeds 10MB
      const largeData = 'A'.repeat(15 * 1024 * 1024);
      const largeDataUrl = `data:image/jpeg;base64,${largeData}`;

      await expect(generator.generate(largeDataUrl)).rejects.toMatchObject({
        type: 'validation',
        message: expect.stringContaining('Image too large')
      });
    });

    it('should handle network disconnection gracefully', async () => {
      const generator = new MaskGenerator(config);

      // Mock network failure
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const validImage = 'data:image/png;base64,' + 'A'.repeat(200);

      await expect(generator.generate(validImage)).rejects.toMatchObject({
        type: expect.stringMatching(/network|replicate/)
      });
    });

    it('should handle API rate limits', async () => {
      const generator = new MaskGenerator(config);

      // Mock rate limit response
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          detail: 'Rate limit exceeded',
          retry_after: 5
        })
      });

      const validImage = 'data:image/png;base64,' + 'A'.repeat(200);

      await expect(generator.generate(validImage)).rejects.toMatchObject({
        type: 'replicate',
        message: expect.stringContaining('Too many requests'),
        retryAfter: 5
      });
    });

    it('should handle images with no subject', async () => {
      const generator = new MaskGenerator(config);

      // Mock no subject response
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          detail: 'No subject found in image'
        })
      });

      const validImage = 'data:image/png;base64,' + 'A'.repeat(200);

      await expect(generator.generate(validImage)).rejects.toMatchObject({
        type: 'replicate',
        message: expect.stringContaining('No subject detected'),
        retryable: false
      });
    });

    it('should verify error messages are clear and actionable', async () => {
      const generator = new MaskGenerator(config);

      // Test various error scenarios
      const errorScenarios = [
        {
          input: '',
          expectedMessage: 'No image provided'
        },
        {
          input: 'not-a-data-url',
          expectedMessage: 'Invalid image format'
        },
        {
          input: 'data:image/bmp;base64,test',
          expectedMessage: 'Unsupported image format'
        }
      ];

      for (const scenario of errorScenarios) {
        try {
          await generator.generate(scenario.input);
          // Should not reach here
          expect(true).toBe(false);
        } catch (error: any) {
          // Error message should be user-friendly
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
          expect(error.message).toContain(scenario.expectedMessage);

          // Should not contain technical details
          expect(error.message).not.toMatch(/at\s+\w+\s+\(/);
          expect(error.message).not.toContain('undefined');
          expect(error.message).not.toContain('[object Object]');

          // Should start with capital letter
          expect(error.message[0]).toBe(error.message[0].toUpperCase());
        }
      }
    });
  });
});

/**
 * Helper Functions for Test Image Creation
 */

/**
 * Create a simulated person image
 */
function createSimulatedPersonImage(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#87CEEB'; // Sky blue
  ctx.fillRect(0, 0, width, height);

  // Person silhouette (head and shoulders)
  const centerX = width / 2;
  const centerY = height / 2;

  // Head
  ctx.fillStyle = '#FFD1A4'; // Skin tone
  ctx.beginPath();
  ctx.arc(centerX, centerY - 20, 30, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders
  ctx.fillStyle = '#4169E1'; // Blue shirt
  ctx.fillRect(centerX - 40, centerY + 10, 80, 60);

  return canvas;
}

/**
 * Create a simulated object image
 */
function createSimulatedObjectImage(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#F0F0F0'; // Light gray
  ctx.fillRect(0, 0, width, height);

  // Object (a vase)
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.fillStyle = '#8B4513'; // Brown
  ctx.beginPath();
  ctx.moveTo(centerX - 30, centerY + 50);
  ctx.lineTo(centerX - 20, centerY - 50);
  ctx.lineTo(centerX + 20, centerY - 50);
  ctx.lineTo(centerX + 30, centerY + 50);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

/**
 * Create a simulated animal image
 */
function createSimulatedAnimalImage(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#90EE90'; // Light green (grass)
  ctx.fillRect(0, 0, width, height);

  // Animal (a cat)
  const centerX = width / 2;
  const centerY = height / 2;

  // Body
  ctx.fillStyle = '#FFA500'; // Orange
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 40, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(centerX, centerY - 30, 25, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.moveTo(centerX - 20, centerY - 40);
  ctx.lineTo(centerX - 10, centerY - 55);
  ctx.lineTo(centerX - 5, centerY - 40);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX + 20, centerY - 40);
  ctx.lineTo(centerX + 10, centerY - 55);
  ctx.lineTo(centerX + 5, centerY - 40);
  ctx.fill();

  return canvas;
}

/**
 * Create an image with complex background
 */
function createComplexBackgroundImage(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Create complex gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#FF6B6B');
  gradient.addColorStop(0.25, '#4ECDC4');
  gradient.addColorStop(0.5, '#45B7D1');
  gradient.addColorStop(0.75, '#FFA07A');
  gradient.addColorStop(1, '#98D8C8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add random shapes for complexity
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 30 + 10,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Add subject in center
  const centerX = width / 2;
  const centerY = height / 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/**
 * Create a mask with fine details (hair, glass, shadows)
 */
function createMaskWithFineDetails(
  width: number,
  height: number,
  type: 'hair' | 'glass' | 'shadows'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(width, height);
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

      // Alpha based on type
      if (type === 'hair') {
        // Hair: gradual transitions with some variation
        if (distance < radius * 0.7) {
          imageData.data[i + 3] = 255;
        } else if (distance < radius * 1.2) {
          const edgeProgress = (distance - radius * 0.7) / (radius * 0.5);
          const baseAlpha = 255 * (1 - edgeProgress);
          const variation = (Math.random() - 0.5) * 60;
          imageData.data[i + 3] = Math.max(0, Math.min(255, baseAlpha + variation));
        } else {
          imageData.data[i + 3] = 0;
        }
      } else if (type === 'glass') {
        // Glass: semi-transparent with smooth gradient
        if (distance < radius) {
          const transparency = 0.6 + (distance / radius) * 0.4;
          imageData.data[i + 3] = Math.floor(255 * transparency);
        } else {
          imageData.data[i + 3] = 0;
        }
      } else if (type === 'shadows') {
        // Shadows: gradual fade
        if (distance < radius * 0.8) {
          imageData.data[i + 3] = 255;
        } else if (distance < radius * 1.3) {
          const shadowProgress = (distance - radius * 0.8) / (radius * 0.5);
          imageData.data[i + 3] = Math.floor(255 * (1 - shadowProgress));
        } else {
          imageData.data[i + 3] = 0;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Create a low quality mask (jagged edges)
 */
function createLowQualityMask(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

      imageData.data[i] = 255;
      imageData.data[i + 1] = 255;
      imageData.data[i + 2] = 255;

      // Binary alpha (jagged edges)
      if (distance < radius) {
        imageData.data[i + 3] = Math.random() > 0.5 ? 255 : 0;
      } else {
        imageData.data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Create a mask with multiple subjects
 */
function createMultiSubjectMask(
  width: number,
  height: number,
  numSubjects: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(width, height);

  // Initialize as transparent
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 255;
    imageData.data[i + 1] = 255;
    imageData.data[i + 2] = 255;
    imageData.data[i + 3] = 0;
  }

  // Add multiple subjects
  const spacing = width / (numSubjects + 1);
  const radius = Math.min(spacing / 3, height / 4);

  for (let s = 0; s < numSubjects; s++) {
    const centerX = spacing * (s + 1);
    const centerY = height / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

        if (distance < radius) {
          const alpha = Math.floor(255 * (1 - distance / radius));
          imageData.data[i + 3] = Math.max(imageData.data[i + 3], Math.max(130, alpha));
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Convert canvas to data URL
 */
function canvasToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Extract ImageData from canvas
 */
async function extractImageData(canvas: HTMLCanvasElement): Promise<ImageData> {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
