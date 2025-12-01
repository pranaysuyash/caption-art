/**
 * Unit Tests for EXIFProcessor
 */

import { describe, it, expect } from 'vitest';
import { correctOrientation, readEXIF, stripEXIF } from './exifProcessor';

// Helper to create a test canvas
function createTestCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, width, height);
  }
  return canvas;
}

// Helper to convert canvas to image
async function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const dataUrl = canvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

describe('EXIFProcessor', () => {
  describe('correctOrientation', () => {
    it('should handle orientation 1 (normal)', async () => {
      const canvas = createTestCanvas(100, 100);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 1);
      
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      
      // Check that the canvas context is valid
      const ctx = result.getContext('2d');
      expect(ctx).not.toBeNull();
    });

    it('should handle orientation 2 (flip horizontal)', async () => {
      const canvas = createTestCanvas(100, 100);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 2);
      
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should handle orientation 3 (rotate 180°)', async () => {
      const canvas = createTestCanvas(150, 100);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 3);
      
      // Dimensions should remain the same
      expect(result.width).toBe(150);
      expect(result.height).toBe(100);
    });

    it('should handle orientation 4 (flip vertical)', async () => {
      const canvas = createTestCanvas(100, 100);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 4);
      
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should handle orientation 5 (rotate 90° CCW and flip)', async () => {
      const canvas = createTestCanvas(200, 100);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 5);
      
      // Dimensions should be swapped
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
    });

    it('should handle orientation 6 (rotate 90° CW)', async () => {
      const canvas = createTestCanvas(200, 100);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 6);
      
      // Dimensions should be swapped
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
    });

    it('should handle orientation 7 (rotate 90° CW and flip)', async () => {
      const canvas = createTestCanvas(200, 100);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 7);
      
      // Dimensions should be swapped
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
    });

    it('should handle orientation 8 (rotate 90° CCW)', async () => {
      const canvas = createTestCanvas(200, 100);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 8);
      
      // Dimensions should be swapped
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
    });

    it('should handle unknown orientation values', async () => {
      const canvas = createTestCanvas(100, 100);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 99);
      
      // Should default to normal orientation
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should handle rectangular images', async () => {
      const canvas = createTestCanvas(300, 200);
      const image = await canvasToImage(canvas);
      
      const result = await correctOrientation(image, 1);
      
      expect(result.width).toBe(300);
      expect(result.height).toBe(200);
    });

    it('should use naturalWidth and naturalHeight when available', async () => {
      const canvas = createTestCanvas(100, 100);
      const image = await canvasToImage(canvas);
      
      // Ensure naturalWidth/naturalHeight are set
      expect(image.naturalWidth).toBeGreaterThan(0);
      expect(image.naturalHeight).toBeGreaterThan(0);
      
      const result = await correctOrientation(image, 1);
      
      expect(result.width).toBe(image.naturalWidth);
      expect(result.height).toBe(image.naturalHeight);
    });
  });

  describe('readEXIF', () => {
    it('should return null for non-JPEG files', async () => {
      const canvas = createTestCanvas(100, 100);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(), 'image/png');
      });
      const file = new File([blob], 'test.png', { type: 'image/png' });
      
      const result = await readEXIF(file);
      expect(result).toBeNull();
    });

    it('should return null for files without EXIF data', async () => {
      // Create a minimal JPEG without EXIF
      const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG signature + APP0
      const blob = new Blob([jpegHeader], { type: 'image/jpeg' });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await readEXIF(file);
      // Should return null since there's no valid EXIF data
      expect(result).toBeNull();
    });

    it('should handle corrupted JPEG files gracefully', async () => {
      const corruptedData = new Uint8Array([0xFF, 0xD8, 0x00, 0x00]); // Invalid JPEG
      const blob = new Blob([corruptedData], { type: 'image/jpeg' });
      const file = new File([blob], 'corrupted.jpg', { type: 'image/jpeg' });
      
      const result = await readEXIF(file);
      expect(result).toBeNull();
    });

    it('should handle empty files', async () => {
      const blob = new Blob([], { type: 'image/jpeg' });
      const file = new File([blob], 'empty.jpg', { type: 'image/jpeg' });
      
      const result = await readEXIF(file);
      expect(result).toBeNull();
    });

    it('should handle files with invalid JPEG signature', async () => {
      const invalidData = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const blob = new Blob([invalidData], { type: 'image/jpeg' });
      const file = new File([blob], 'invalid.jpg', { type: 'image/jpeg' });
      
      const result = await readEXIF(file);
      expect(result).toBeNull();
    });
  });

  describe('stripEXIF', () => {
    it('should return blob unchanged for non-JPEG files', async () => {
      const canvas = createTestCanvas(100, 100);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(), 'image/png');
      });
      
      const result = await stripEXIF(blob);
      expect(result.size).toBeGreaterThan(0);
      expect(result.type).toBe('image/png');
    });

    it('should preserve JPEG signature', async () => {
      const jpegData = new Uint8Array([
        0xFF, 0xD8, // JPEG signature
        0xFF, 0xE1, // APP1 marker (EXIF)
        0x00, 0x10, // Segment length
        ...new Array(14).fill(0x00), // Dummy EXIF data
        0xFF, 0xD9 // End of image
      ]);
      const blob = new Blob([jpegData], { type: 'image/jpeg' });
      
      const result = await stripEXIF(blob);
      
      // Check that result is a valid blob
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/jpeg');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should handle empty blobs', async () => {
      const blob = new Blob([], { type: 'image/jpeg' });
      
      const result = await stripEXIF(blob);
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle blobs with invalid JPEG signature', async () => {
      const invalidData = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const blob = new Blob([invalidData], { type: 'image/jpeg' });
      
      const result = await stripEXIF(blob);
      // Should return original blob if not a valid JPEG
      expect(result).toBeInstanceOf(Blob);
    });

    it('should preserve image data after stripping EXIF', async () => {
      const canvas = createTestCanvas(100, 100);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(), 'image/jpeg');
      });
      
      const result = await stripEXIF(blob);
      
      // Result should still be a valid blob
      expect(result.size).toBeGreaterThan(0);
      expect(result.type).toBe('image/jpeg');
    });
  });
});
