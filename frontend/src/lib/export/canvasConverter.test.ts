/**
 * Unit tests for CanvasConverter
 * Tests PNG conversion, JPEG conversion with various qualities, canvas scaling, and aspect ratio preservation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasConverter } from './canvasConverter';
import type { ConversionOptions } from './canvasConverter';

describe('CanvasConverter', () => {
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create a mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 1920;
    mockCanvas.height = 1080;
    
    // Mock toDataURL
    vi.spyOn(mockCanvas, 'toDataURL').mockReturnValue('data:image/png;base64,mockBase64Data');
  });

  describe('PNG Conversion', () => {
    it('should convert canvas to PNG data URL', () => {
      const options: ConversionOptions = {
        format: 'png'
      };

      const result = CanvasConverter.toDataURL(mockCanvas, options);

      expect(result).toContain('data:image/png');
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
    });

    it('should use PNG format without quality parameter', () => {
      const options: ConversionOptions = {
        format: 'png',
        quality: 0.8 // Should be ignored for PNG
      };

      CanvasConverter.toDataURL(mockCanvas, options);

      // PNG should not pass quality parameter
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
    });

    it('should preserve transparency in PNG', () => {
      const options: ConversionOptions = {
        format: 'png'
      };

      const result = CanvasConverter.toDataURL(mockCanvas, options);

      // PNG format supports transparency
      expect(result).toContain('image/png');
    });
  });

  describe('JPEG Conversion', () => {
    it('should convert canvas to JPEG data URL', () => {
      const options: ConversionOptions = {
        format: 'jpeg',
        quality: 0.92
      };

      CanvasConverter.toDataURL(mockCanvas, options);

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.92);
    });

    it('should use default quality of 0.92 when not specified', () => {
      const options: ConversionOptions = {
        format: 'jpeg'
      };

      CanvasConverter.toDataURL(mockCanvas, options);

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.92);
    });

    it('should accept various quality values', () => {
      const qualities = [0.5, 0.7, 0.85, 0.92, 1.0];

      qualities.forEach(quality => {
        const options: ConversionOptions = {
          format: 'jpeg',
          quality
        };

        CanvasConverter.toDataURL(mockCanvas, options);

        expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', quality);
      });
    });

    it('should clamp quality below 0.5 to 0.5', () => {
      const options: ConversionOptions = {
        format: 'jpeg',
        quality: 0.3
      };

      CanvasConverter.toDataURL(mockCanvas, options);

      // Quality should be clamped to 0.5
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.5);
    });

    it('should clamp quality above 1.0 to 1.0', () => {
      const options: ConversionOptions = {
        format: 'jpeg',
        quality: 1.5
      };

      CanvasConverter.toDataURL(mockCanvas, options);

      // Quality should be clamped to 1.0
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 1.0);
    });
  });

  describe('Canvas Scaling', () => {
    it('should not scale canvas when dimensions are within maxDimension', () => {
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = 800;
      smallCanvas.height = 600;

      const scaled = CanvasConverter.scaleCanvas(smallCanvas, 1080);

      // Should return the same canvas
      expect(scaled).toBe(smallCanvas);
      expect(scaled.width).toBe(800);
      expect(scaled.height).toBe(600);
    });

    it('should scale down canvas when width exceeds maxDimension', () => {
      const largeCanvas = document.createElement('canvas');
      largeCanvas.width = 2000;
      largeCanvas.height = 1000;

      const scaled = CanvasConverter.scaleCanvas(largeCanvas, 1080);

      // Width should be scaled to 1080
      expect(scaled.width).toBe(1080);
      // Height should be scaled proportionally
      expect(scaled.height).toBe(540);
    });

    it('should scale down canvas when height exceeds maxDimension', () => {
      const largeCanvas = document.createElement('canvas');
      largeCanvas.width = 1000;
      largeCanvas.height = 2000;

      const scaled = CanvasConverter.scaleCanvas(largeCanvas, 1080);

      // Height should be scaled to 1080
      expect(scaled.height).toBe(1080);
      // Width should be scaled proportionally
      expect(scaled.width).toBe(540);
    });

    it('should preserve aspect ratio when scaling', () => {
      const largeCanvas = document.createElement('canvas');
      largeCanvas.width = 1920;
      largeCanvas.height = 1080;

      const originalAspectRatio = largeCanvas.width / largeCanvas.height;

      const scaled = CanvasConverter.scaleCanvas(largeCanvas, 1080);

      const scaledAspectRatio = scaled.width / scaled.height;

      // Aspect ratios should match within floating point tolerance
      expect(Math.abs(scaledAspectRatio - originalAspectRatio)).toBeLessThan(0.01);
    });

    it('should use high quality image smoothing', () => {
      const largeCanvas = document.createElement('canvas');
      largeCanvas.width = 2000;
      largeCanvas.height = 1000;

      const scaled = CanvasConverter.scaleCanvas(largeCanvas, 1080);

      const ctx = scaled.getContext('2d');
      expect(ctx).toBeTruthy();
      
      // Context should have high quality smoothing enabled
      if (ctx) {
        expect(ctx.imageSmoothingEnabled).toBe(true);
        expect(ctx.imageSmoothingQuality).toBe('high');
      }
    });

    it('should handle square canvases correctly', () => {
      const squareCanvas = document.createElement('canvas');
      squareCanvas.width = 2000;
      squareCanvas.height = 2000;

      const scaled = CanvasConverter.scaleCanvas(squareCanvas, 1080);

      // Both dimensions should be scaled to 1080
      expect(scaled.width).toBe(1080);
      expect(scaled.height).toBe(1080);
    });

    it('should handle very wide canvases', () => {
      const wideCanvas = document.createElement('canvas');
      wideCanvas.width = 3000;
      wideCanvas.height = 500;

      const scaled = CanvasConverter.scaleCanvas(wideCanvas, 1080);

      expect(scaled.width).toBe(1080);
      expect(scaled.height).toBe(180);
      
      // Verify aspect ratio
      const originalRatio = wideCanvas.width / wideCanvas.height;
      const scaledRatio = scaled.width / scaled.height;
      expect(Math.abs(scaledRatio - originalRatio)).toBeLessThan(0.01);
    });

    it('should handle very tall canvases', () => {
      const tallCanvas = document.createElement('canvas');
      tallCanvas.width = 500;
      tallCanvas.height = 3000;

      const scaled = CanvasConverter.scaleCanvas(tallCanvas, 1080);

      expect(scaled.width).toBe(180);
      expect(scaled.height).toBe(1080);
      
      // Verify aspect ratio
      const originalRatio = tallCanvas.width / tallCanvas.height;
      const scaledRatio = scaled.width / scaled.height;
      expect(Math.abs(scaledRatio - originalRatio)).toBeLessThan(0.01);
    });
  });

  describe('Aspect Ratio Preservation', () => {
    it('should preserve 16:9 aspect ratio', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;

      const scaled = CanvasConverter.scaleCanvas(canvas, 1080);

      const originalRatio = 1920 / 1080;
      const scaledRatio = scaled.width / scaled.height;

      expect(Math.abs(scaledRatio - originalRatio)).toBeLessThan(0.01);
    });

    it('should preserve 4:3 aspect ratio', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1200;

      const scaled = CanvasConverter.scaleCanvas(canvas, 1080);

      const originalRatio = 1600 / 1200;
      const scaledRatio = scaled.width / scaled.height;

      expect(Math.abs(scaledRatio - originalRatio)).toBeLessThan(0.01);
    });

    it('should preserve 1:1 aspect ratio', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1500;
      canvas.height = 1500;

      const scaled = CanvasConverter.scaleCanvas(canvas, 1080);

      expect(scaled.width).toBe(scaled.height);
    });

    it('should preserve arbitrary aspect ratios', () => {
      const testCases = [
        { width: 2560, height: 1440 }, // 16:9
        { width: 2048, height: 1536 }, // 4:3
        { width: 1920, height: 1200 }, // 16:10
        { width: 1280, height: 720 },  // 16:9
      ];

      testCases.forEach(({ width, height }) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const originalRatio = width / height;
        const scaled = CanvasConverter.scaleCanvas(canvas, 1080);
        const scaledRatio = scaled.width / scaled.height;

        expect(Math.abs(scaledRatio - originalRatio)).toBeLessThan(0.01);
      });
    });
  });

  describe('Format Validation', () => {
    it('should accept valid PNG format', () => {
      const options: ConversionOptions = {
        format: 'png'
      };

      expect(() => {
        CanvasConverter.toDataURL(mockCanvas, options);
      }).not.toThrow();
    });

    it('should accept valid JPEG format', () => {
      const options: ConversionOptions = {
        format: 'jpeg'
      };

      expect(() => {
        CanvasConverter.toDataURL(mockCanvas, options);
      }).not.toThrow();
    });

    it('should fall back to PNG for invalid format', () => {
      const options: ConversionOptions = {
        format: 'invalid' as any
      };

      CanvasConverter.toDataURL(mockCanvas, options);

      // Should fall back to PNG
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
    });
  });

  describe('Blob Conversion', () => {
    it('should convert canvas to blob', async () => {
      const mockBlob = new Blob(['mock'], { type: 'image/png' });
      
      vi.spyOn(mockCanvas, 'toBlob').mockImplementation((callback: any) => {
        callback(mockBlob);
      });

      const options: ConversionOptions = {
        format: 'png'
      };

      const blob = await CanvasConverter.toBlob(mockCanvas, options);

      expect(blob).toBe(mockBlob);
    });

    it('should fall back to dataURL if toBlob fails', async () => {
      vi.spyOn(mockCanvas, 'toBlob').mockImplementation((callback: any) => {
        callback(null); // Simulate failure
      });

      const options: ConversionOptions = {
        format: 'png'
      };

      const blob = await CanvasConverter.toBlob(mockCanvas, options);

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('Error Handling', () => {
    it('should throw user-friendly error for CORS issues', () => {
      vi.spyOn(mockCanvas, 'toDataURL').mockImplementation(() => {
        throw new Error('Tainted canvas');
      });

      const options: ConversionOptions = {
        format: 'png'
      };

      expect(() => {
        CanvasConverter.toDataURL(mockCanvas, options);
      }).toThrow('cross-origin');
    });

    it('should throw user-friendly error for memory issues', () => {
      const hugeCanvas = document.createElement('canvas');
      hugeCanvas.width = 10000;
      hugeCanvas.height = 10000;

      expect(() => {
        CanvasConverter.scaleCanvas(hugeCanvas, 1080);
      }).toThrow('too large');
    });

    it('should handle missing context gracefully', () => {
      const badCanvas = document.createElement('canvas');
      badCanvas.width = 2000;
      badCanvas.height = 1000;
      
      vi.spyOn(badCanvas, 'getContext').mockReturnValue(null);

      expect(() => {
        CanvasConverter.scaleCanvas(badCanvas, 1080);
      }).toThrow('Canvas error');
    });
  });
});
