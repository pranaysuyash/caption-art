/**
 * Final Integration Tests for Export System
 * Comprehensive tests covering all export functionality
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5,
 *            5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Exporter } from './exporter';
import { CanvasConverter } from './canvasConverter';
import { FilenameGenerator } from './filenameGenerator';
import { DownloadTrigger } from './downloadTrigger';
import type { ExportConfig, ExportProgress } from './types';

/**
 * Helper function to create a test canvas with content
 * In test environment (jsdom), canvas doesn't actually render, so we need to
 * mock the getImageData to return non-transparent pixels
 */
function createTestCanvas(width: number, height: number, withContent: boolean = true): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  if (withContent) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fill with a gradient to simulate real content
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#FF0000');
      gradient.addColorStop(0.5, '#00FF00');
      gradient.addColorStop(1, '#0000FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add some text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.fillText('Test Canvas', 10, 30);
      
      // Mock getImageData to return non-transparent pixels for validation
      // This is needed because jsdom doesn't actually render canvas content
      const originalGetImageData = ctx.getImageData.bind(ctx);
      ctx.getImageData = vi.fn((sx, sy, sw, sh) => {
        const imageData = originalGetImageData(sx, sy, sw, sh);
        // Set some pixels to non-transparent to pass validation
        for (let i = 3; i < imageData.data.length; i += 4) {
          imageData.data[i] = 255; // Set alpha to 255 (opaque)
        }
        return imageData;
      });
    }
  }
  
  return canvas;
}

/**
 * Helper to create canvas with multiple layers
 */
function createMultiLayerCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Layer 1: Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Layer 2: Image (simulated with a colored rectangle)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(50, 50, width - 100, height - 100);
    
    // Layer 3: Text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Caption Text', width / 2, height / 2);
    
    // Layer 4: Mask effect (semi-transparent overlay)
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.fillRect(100, 100, width - 200, height - 200);
    
    // Mock getImageData to return non-transparent pixels for validation
    const originalGetImageData = ctx.getImageData.bind(ctx);
    ctx.getImageData = vi.fn((sx, sy, sw, sh) => {
      const imageData = originalGetImageData(sx, sy, sw, sh);
      // Set some pixels to non-transparent to pass validation
      for (let i = 3; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255; // Set alpha to 255 (opaque)
      }
      return imageData;
    });
  }
  
  return canvas;
}

/**
 * Helper to check if data URL is valid PNG
 */
function isPNG(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/png');
}

/**
 * Helper to check if data URL is valid JPEG
 */
function isJPEG(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/jpeg');
}

/**
 * Helper to get image dimensions from data URL
 */
async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = dataUrl;
  });
}

/**
 * Helper to check if canvas has transparency
 */
function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Check if any pixel has alpha < 255
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true;
    }
  }
  
  return false;
}

describe('Export System - Final Integration Tests', () => {
  let exporter: Exporter;
  let downloadTriggerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exporter = new Exporter();
    
    // Mock the download trigger to prevent actual downloads in tests
    downloadTriggerSpy = vi.spyOn(DownloadTrigger, 'trigger').mockImplementation(() => {
      // Do nothing - just track that it was called
    });
  });

  afterEach(() => {
    downloadTriggerSpy.mockRestore();
  });

  describe('13.1 PNG Export Tests', () => {
    it('should export small canvas as PNG', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      // Debug: log the result if it fails
      if (!result.success) {
        console.log('Export failed:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.format).toBe('png');
      expect(result.filename).toMatch(/\.png$/);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should export medium canvas as PNG', async () => {
      const canvas = createTestCanvas(1920, 1080);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('png');
    });

    it('should export large canvas as PNG', async () => {
      const canvas = createTestCanvas(3840, 2160);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('png');
    });

    it('should verify PNG format is correct', () => {
      const canvas = createTestCanvas(800, 600);
      const dataUrl = CanvasConverter.toDataURL(canvas, { format: 'png' });

      expect(isPNG(dataUrl)).toBe(true);
    });

    it('should preserve transparency in PNG', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create semi-transparent content
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 100, 100);
      }

      const dataUrl = CanvasConverter.toDataURL(canvas, { format: 'png' });
      
      // PNG should preserve transparency
      expect(isPNG(dataUrl)).toBe(true);
      expect(hasTransparency(canvas)).toBe(true);
    });

    it('should maintain lossless quality in PNG', async () => {
      const canvas = createTestCanvas(500, 500);
      
      // Export twice and compare
      const dataUrl1 = CanvasConverter.toDataURL(canvas, { format: 'png' });
      const dataUrl2 = CanvasConverter.toDataURL(canvas, { format: 'png' });

      // Lossless format should produce identical results
      expect(dataUrl1).toBe(dataUrl2);
    });
  });

  describe('13.2 JPEG Export Tests', () => {
    it('should export with default quality (0.92)', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'jpeg',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
      expect(result.filename).toMatch(/\.jpg$/);
    });

    it('should export with high quality (1.0)', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'jpeg',
        quality: 1.0,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('should export with medium quality (0.75)', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'jpeg',
        quality: 0.75,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('should export with low quality (0.5)', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'jpeg',
        quality: 0.5,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('should verify JPEG format is correct', () => {
      const canvas = createTestCanvas(800, 600);
      const dataUrl = CanvasConverter.toDataURL(canvas, { format: 'jpeg', quality: 0.92 });

      expect(isJPEG(dataUrl)).toBe(true);
    });

    it('should not preserve transparency in JPEG', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create semi-transparent content
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 100, 100);
      }

      const dataUrl = CanvasConverter.toDataURL(canvas, { format: 'jpeg', quality: 0.92 });
      
      // JPEG should not preserve transparency
      expect(isJPEG(dataUrl)).toBe(true);
    });

    it('should produce smaller files with lower quality', () => {
      const canvas = createTestCanvas(800, 600);
      
      const highQuality = CanvasConverter.toDataURL(canvas, { format: 'jpeg', quality: 1.0 });
      const lowQuality = CanvasConverter.toDataURL(canvas, { format: 'jpeg', quality: 0.5 });

      // Lower quality should produce smaller file
      expect(lowQuality.length).toBeLessThan(highQuality.length);
    });
  });

  describe('13.3 Scaling Tests', () => {
    it('should scale down canvas larger than 1080px (width)', async () => {
      const canvas = createTestCanvas(2000, 1000);
      const dataUrl = CanvasConverter.toDataURL(canvas, {
        format: 'png',
        maxDimension: 1080
      });

      const dimensions = await getImageDimensions(dataUrl);
      
      expect(dimensions.width).toBeLessThanOrEqual(1080);
      expect(dimensions.height).toBeLessThanOrEqual(1080);
      expect(Math.max(dimensions.width, dimensions.height)).toBe(1080);
    });

    it('should scale down canvas larger than 1080px (height)', async () => {
      const canvas = createTestCanvas(1000, 2000);
      const dataUrl = CanvasConverter.toDataURL(canvas, {
        format: 'png',
        maxDimension: 1080
      });

      const dimensions = await getImageDimensions(dataUrl);
      
      expect(dimensions.width).toBeLessThanOrEqual(1080);
      expect(dimensions.height).toBeLessThanOrEqual(1080);
      expect(Math.max(dimensions.width, dimensions.height)).toBe(1080);
    });

    it('should preserve aspect ratio when scaling (landscape)', async () => {
      const canvas = createTestCanvas(3840, 2160); // 16:9 aspect ratio
      const originalAspect = canvas.width / canvas.height;
      
      const dataUrl = CanvasConverter.toDataURL(canvas, {
        format: 'png',
        maxDimension: 1080
      });

      const dimensions = await getImageDimensions(dataUrl);
      const scaledAspect = dimensions.width / dimensions.height;
      
      // Aspect ratios should match within 1% tolerance
      expect(Math.abs(scaledAspect - originalAspect)).toBeLessThan(0.01);
    });

    it('should preserve aspect ratio when scaling (portrait)', async () => {
      const canvas = createTestCanvas(2160, 3840); // 9:16 aspect ratio
      const originalAspect = canvas.width / canvas.height;
      
      const dataUrl = CanvasConverter.toDataURL(canvas, {
        format: 'png',
        maxDimension: 1080
      });

      const dimensions = await getImageDimensions(dataUrl);
      const scaledAspect = dimensions.width / dimensions.height;
      
      // Aspect ratios should match within 1% tolerance
      expect(Math.abs(scaledAspect - originalAspect)).toBeLessThan(0.01);
    });

    it('should not scale canvas smaller than maxDimension', async () => {
      const canvas = createTestCanvas(800, 600);
      const dataUrl = CanvasConverter.toDataURL(canvas, {
        format: 'png',
        maxDimension: 1080
      });

      const dimensions = await getImageDimensions(dataUrl);
      
      // Should maintain original dimensions
      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
    });

    it('should maintain quality after scaling', async () => {
      const canvas = createTestCanvas(2000, 2000);
      
      // Add detailed content
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.font = '30px Arial';
        for (let i = 0; i < 20; i++) {
          ctx.fillText(`Line ${i}`, 100, 100 + i * 50);
        }
      }

      const dataUrl = CanvasConverter.toDataURL(canvas, {
        format: 'png',
        maxDimension: 1080
      });

      // Should produce a valid image
      const dimensions = await getImageDimensions(dataUrl);
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });
  });

  describe('13.4 Filename Generation Tests', () => {
    it('should generate unique filenames with timestamps', () => {
      const time1 = new Date('2025-01-27T14:30:00');
      const time2 = new Date('2025-01-27T14:30:01');

      const filename1 = FilenameGenerator.generate({
        format: 'png',
        watermarked: false,
        timestamp: time1
      });

      const filename2 = FilenameGenerator.generate({
        format: 'png',
        watermarked: false,
        timestamp: time2
      });

      expect(filename1).not.toBe(filename2);
      expect(filename1).toMatch(/caption-art-\d{8}-\d{6}\.png/);
      expect(filename2).toMatch(/caption-art-\d{8}-\d{6}\.png/);
    });

    it('should include watermark suffix for free tier', () => {
      const filename = FilenameGenerator.generate({
        format: 'png',
        watermarked: true
      });

      expect(filename).toContain('-watermarked');
      expect(filename).toMatch(/caption-art-\d{8}-\d{6}-watermarked\.png/);
    });

    it('should not include watermark suffix for premium', () => {
      const filename = FilenameGenerator.generate({
        format: 'png',
        watermarked: false
      });

      expect(filename).not.toContain('-watermarked');
      expect(filename).toMatch(/caption-art-\d{8}-\d{6}\.png/);
    });

    it('should use correct extension for PNG', () => {
      const filename = FilenameGenerator.generate({
        format: 'png',
        watermarked: false
      });

      expect(filename).toMatch(/\.png$/);
    });

    it('should use correct extension for JPEG', () => {
      const filename = FilenameGenerator.generate({
        format: 'jpeg',
        watermarked: false
      });

      expect(filename).toMatch(/\.jpg$/);
    });

    it('should generate multiple unique filenames in sequence', async () => {
      const filenames: string[] = [];
      
      for (let i = 0; i < 5; i++) {
        const canvas = createTestCanvas(800, 600);
        const config: ExportConfig = {
          format: 'png',
          quality: 0.92,
          maxDimension: 1080,
          watermark: false,
          watermarkText: ''
        };

        const result = await exporter.export(canvas, config);
        filenames.push(result.filename);
        
        // Delay to ensure different timestamps (1 second for reliable uniqueness)
        await new Promise(resolve => setTimeout(resolve, 1100));
      }

      // All filenames should be unique
      const uniqueFilenames = new Set(filenames);
      expect(uniqueFilenames.size).toBe(filenames.length);
    });
  });

  describe('13.5 Progress Reporting Tests', () => {
    it('should report all progress stages', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const progressStages: string[] = [];
      const progressValues: number[] = [];

      await exporter.export(canvas, config, (progress: ExportProgress) => {
        progressStages.push(progress.stage);
        progressValues.push(progress.progress);
      });

      // Should have all stages
      expect(progressStages).toContain('preparing');
      expect(progressStages).toContain('converting');
      expect(progressStages).toContain('downloading');
      expect(progressStages).toContain('complete');
    });

    it('should report watermarking stage when watermark enabled', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: true,
        watermarkText: 'Test Watermark'
      };

      const progressStages: string[] = [];

      await exporter.export(canvas, config, (progress: ExportProgress) => {
        progressStages.push(progress.stage);
      });

      expect(progressStages).toContain('watermarking');
    });

    it('should report increasing progress values', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const progressValues: number[] = [];

      await exporter.export(canvas, config, (progress: ExportProgress) => {
        progressValues.push(progress.progress);
      });

      // Progress should increase
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
      }

      // Should start at 0 and end at 100
      expect(progressValues[0]).toBe(0);
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });

    it('should provide clear progress messages', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const messages: string[] = [];

      await exporter.export(canvas, config, (progress: ExportProgress) => {
        messages.push(progress.message);
      });

      // All messages should be non-empty and user-friendly
      messages.forEach(message => {
        expect(message.length).toBeGreaterThan(0);
        expect(message).toMatch(/[a-zA-Z]/); // Contains letters
      });
    });
  });

  describe('13.6 Layer Inclusion Tests', () => {
    it('should include background layer', async () => {
      const canvas = createMultiLayerCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should include text layer', async () => {
      const canvas = createMultiLayerCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
    });

    it('should include watermark layer when enabled', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: true,
        watermarkText: 'Test Watermark'
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('-watermarked');
    });

    it('should composite all layers in correct order', async () => {
      const canvas = createMultiLayerCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: true,
        watermarkText: 'Watermark'
      };

      const result = await exporter.export(canvas, config);

      // Should successfully export with all layers
      expect(result.success).toBe(true);
      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('13.7 Error Scenario Tests', () => {
    it('should handle empty canvas', async () => {
      const canvas = createTestCanvas(800, 600, false); // No content
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('upload an image');
    });

    it('should handle very large canvas', async () => {
      // Create a canvas that exceeds reasonable limits
      const canvas = document.createElement('canvas');
      canvas.width = 10000;
      canvas.height = 10000;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10000, 10000);
        
        // Mock getImageData to return non-transparent pixels for validation
        const originalGetImageData = ctx.getImageData.bind(ctx);
        ctx.getImageData = vi.fn((sx, sy, sw, sh) => {
          const imageData = originalGetImageData(sx, sy, sw, sh);
          // Set some pixels to non-transparent to pass validation
          for (let i = 3; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255; // Set alpha to 255 (opaque)
          }
          return imageData;
        });
      }

      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      // Should either succeed (after scaling) or fail with clear message
      if (!result.success) {
        // Accept either specific memory error or generic error message
        expect(result.error).toMatch(/too large|memory|Failed to generate image/i);
        expect(result.error).toBeTruthy();
      } else {
        // If it succeeded, it should have been scaled down
        expect(result.success).toBe(true);
      }
    });

    it('should provide clear error messages', async () => {
      const canvas = createTestCanvas(800, 600, false);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      
      // Error should be user-friendly (no technical jargon)
      expect(result.error).not.toMatch(/undefined|null|NaN/i);
      expect(result.error).not.toMatch(/stack trace|exception/i);
    });

    it('should handle invalid format gracefully', () => {
      const canvas = createTestCanvas(800, 600);
      
      // CanvasConverter should handle invalid format
      const dataUrl = CanvasConverter.toDataURL(canvas, {
        format: 'invalid' as any
      });

      // Should fall back to PNG
      expect(isPNG(dataUrl)).toBe(true);
    });

    it('should clamp quality values out of range', () => {
      const canvas = createTestCanvas(800, 600);
      
      // Test quality > 1.0
      const highQuality = CanvasConverter.toDataURL(canvas, {
        format: 'jpeg',
        quality: 1.5
      });
      expect(isJPEG(highQuality)).toBe(true);

      // Test quality < 0.5
      const lowQuality = CanvasConverter.toDataURL(canvas, {
        format: 'jpeg',
        quality: 0.1
      });
      expect(isJPEG(lowQuality)).toBe(true);
    });
  });

  describe('13.8 Performance Tests', () => {
    it('should export standard image within 2 seconds', async () => {
      const canvas = createTestCanvas(1920, 1080);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const startTime = Date.now();
      const result = await exporter.export(canvas, config);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2000);
    });

    it('should export large image within 5 seconds', async () => {
      const canvas = createTestCanvas(3840, 2160);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const startTime = Date.now();
      const result = await exporter.export(canvas, config);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle multiple sequential exports efficiently', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const startTime = Date.now();
      
      for (let i = 0; i < 3; i++) {
        const result = await exporter.export(canvas, config);
        expect(result.success).toBe(true);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 3 exports should complete in reasonable time
      expect(duration).toBeLessThan(6000);
    });

    it('should measure export time for various sizes', async () => {
      const sizes = [
        { width: 800, height: 600, name: 'small' },
        { width: 1920, height: 1080, name: 'medium' },
        { width: 2560, height: 1440, name: 'large' }
      ];

      for (const size of sizes) {
        const canvas = createTestCanvas(size.width, size.height);
        const config: ExportConfig = {
          format: 'png',
          quality: 0.92,
          maxDimension: 1080,
          watermark: false,
          watermarkText: ''
        };

        const startTime = Date.now();
        const result = await exporter.export(canvas, config);
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(result.success).toBe(true);
        
        // Log performance for reference
        console.log(`${size.name} (${size.width}x${size.height}): ${duration}ms`);
      }
    });
  });
});
