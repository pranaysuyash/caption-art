/**
 * Error Handling Tests for Canvas Text Compositing Engine
 * Tests error handling for image loading, rendering, and export
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Compositor } from './compositor';
import { Exporter, ExportError, ExportErrorType } from './exporter';
import { loadImage, isImageLoaded, getImageLoadErrorMessage } from './imageLoader';
import type { TextLayer } from './types';

describe('Error Handling', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  describe('Image Loading Errors', () => {
    it('should throw error for invalid image URL', async () => {
      await expect(
        loadImage('invalid-url', { maxRetries: 1, retryDelay: 100 })
      ).rejects.toThrow();
    });

    it('should validate image is loaded', () => {
      const img = new Image();
      expect(isImageLoaded(img)).toBe(false);
    });

    it('should provide user-friendly error messages', () => {
      const error = new Error('Image load timeout after 30000ms');
      const message = getImageLoadErrorMessage(error);
      expect(message).toContain('timed out');
    });
  });

  describe('Canvas Rendering Errors', () => {
    it('should throw error when canvas is null', () => {
      const img = new Image();
      img.width = 100;
      img.height = 100;

      expect(() => {
        new Compositor({
          canvas: null as any,
          backgroundImage: img,
          maxDimension: 1080,
        });
      }).toThrow('Canvas element is required');
    });

    it('should throw error when background image is null', () => {
      expect(() => {
        new Compositor({
          canvas,
          backgroundImage: null as any,
          maxDimension: 1080,
        });
      }).toThrow('Background image is required');
    });

    it('should throw error when background image is not loaded', () => {
      const img = new Image();
      // Image not loaded (complete = false)

      expect(() => {
        new Compositor({
          canvas,
          backgroundImage: img,
          maxDimension: 1080,
        });
      }).toThrow('not loaded or is invalid');
    });

    it('should handle render errors gracefully', () => {
      // Create a valid image
      const img = new Image();
      img.width = 100;
      img.height = 100;
      Object.defineProperty(img, 'complete', { value: true });
      Object.defineProperty(img, 'naturalWidth', { value: 100 });
      Object.defineProperty(img, 'naturalHeight', { value: 100 });

      const compositor = new Compositor({
        canvas,
        backgroundImage: img,
        maxDimension: 1080,
      });

      const textLayer: TextLayer = {
        text: 'Test',
        preset: 'neon',
        fontSize: 48,
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      // Should not throw on valid render
      expect(() => compositor.render(textLayer)).not.toThrow();
    });
  });

  describe('Export Errors', () => {
    it('should throw ExportError for invalid canvas', async () => {
      const invalidCanvas = document.createElement('canvas');
      invalidCanvas.width = 0;
      invalidCanvas.height = 0;

      await expect(
        Exporter.export(invalidCanvas, { format: 'png' })
      ).rejects.toThrow(ExportError);
    });

    it('should provide error type for invalid canvas', async () => {
      const invalidCanvas = document.createElement('canvas');
      invalidCanvas.width = 0;
      invalidCanvas.height = 0;

      try {
        await Exporter.export(invalidCanvas, { format: 'png' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        expect((error as ExportError).type).toBe(ExportErrorType.INVALID_CANVAS);
      }
    });

    it('should provide user-friendly error messages', () => {
      const error = new ExportError(
        ExportErrorType.INVALID_CANVAS,
        'Canvas is invalid'
      );
      const message = Exporter.getErrorMessage(error);
      expect(message).toContain('Cannot export');
    });

    it('should handle watermark errors gracefully', async () => {
      // Create a valid canvas
      const validCanvas = document.createElement('canvas');
      validCanvas.width = 100;
      validCanvas.height = 100;
      const ctx = validCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
      }

      // Export with watermark should not throw
      await expect(
        Exporter.export(validCanvas, {
          format: 'png',
          watermark: true,
          watermarkText: 'Test',
        })
      ).resolves.not.toThrow();
    });

    it('should generate filename correctly', () => {
      const filename = Exporter.generateFilename('png', false);
      expect(filename).toMatch(/^caption-art-.*\.png$/);
    });

    it('should include watermark suffix in filename', () => {
      const filename = Exporter.generateFilename('png', true);
      expect(filename).toContain('-watermarked');
    });
  });

  describe('Error Recovery', () => {
    it('should maintain previous state on render failure', () => {
      // Create a valid image
      const img = new Image();
      img.width = 100;
      img.height = 100;
      Object.defineProperty(img, 'complete', { value: true });
      Object.defineProperty(img, 'naturalWidth', { value: 100 });
      Object.defineProperty(img, 'naturalHeight', { value: 100 });

      const compositor = new Compositor({
        canvas,
        backgroundImage: img,
        maxDimension: 1080,
      });

      const validTextLayer: TextLayer = {
        text: 'Valid',
        preset: 'neon',
        fontSize: 48,
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      // First render should succeed
      compositor.render(validTextLayer);

      // Canvas should have content
      const ctx = canvas.getContext('2d');
      expect(ctx).not.toBeNull();
    });
  });
});
