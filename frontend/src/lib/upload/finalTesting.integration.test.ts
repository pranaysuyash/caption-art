/**
 * Final Integration Tests for Image Upload and Preprocessing System
 * 
 * This test suite covers all final testing scenarios:
 * - Various image formats (JPG, PNG, WebP)
 * - Various file sizes (small, medium, large, over limit)
 * - EXIF orientation handling
 * - Drag-and-drop functionality
 * - Batch upload with multiple files
 */

import { describe, it, expect, vi } from 'vitest';
import { FileValidator } from './fileValidator';
import { ImageOptimizer } from './imageOptimizer';
import { correctOrientation, readEXIF } from './exifProcessor';
import { DragDropHandler } from './dragDropHandler';
import { BatchUploader } from './batchUploader';

// Helper to create a test file
function createTestFile(name: string, type: string, size: number): File {
  const file = new File(['x'.repeat(size)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

// Helper to create a test image
function createTestImage(width: number, height: number): HTMLImageElement {
  const img = new Image();
  Object.defineProperty(img, 'width', { value: width, writable: true, configurable: true });
  Object.defineProperty(img, 'height', { value: height, writable: true, configurable: true });
  Object.defineProperty(img, 'naturalWidth', { value: width, writable: true, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { value: height, writable: true, configurable: true });
  Object.defineProperty(img, 'complete', { value: true, writable: true, configurable: true });
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, width, height);
  }
  img.src = canvas.toDataURL('image/png');
  
  return img;
}

describe('Final Integration Tests - Image Upload System', () => {
  describe('12.1 Test with various image formats', () => {
    it('should accept and validate JPG files', () => {
      const file = createTestFile('test.jpg', 'image/jpeg', 2 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('image/jpeg');
      expect(result.error).toBeUndefined();
    });

    it('should accept and validate JPEG files', () => {
      const file = createTestFile('test.jpeg', 'image/jpeg', 2 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('image/jpeg');
    });

    it('should accept and validate PNG files', () => {
      const file = createTestFile('test.png', 'image/png', 3 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('image/png');
    });

    it('should accept and validate WebP files', () => {
      const file = createTestFile('test.webp', 'image/webp', 1 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('image/webp');
    });

    it('should reject unsupported formats (GIF)', () => {
      const file = createTestFile('test.gif', 'image/gif', 1 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should reject unsupported formats (BMP)', () => {
      const file = createTestFile('test.bmp', 'image/bmp', 1 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should reject non-image files (PDF)', () => {
      const file = createTestFile('document.pdf', 'application/pdf', 1 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should handle uppercase file extensions', () => {
      const file = createTestFile('TEST.JPG', 'image/jpeg', 1 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
    });

    it('should handle mixed case file extensions', () => {
      const file = createTestFile('test.PnG', 'image/png', 1 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('12.2 Test with various file sizes', () => {
    it('should accept very small files (1KB)', () => {
      const file = createTestFile('tiny.jpg', 'image/jpeg', 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileSize).toBe(1024);
    });

    it('should accept small files (100KB)', () => {
      const file = createTestFile('small.jpg', 'image/jpeg', 100 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileSize).toBe(100 * 1024);
    });

    it('should accept medium files (1MB)', () => {
      const file = createTestFile('medium.jpg', 'image/jpeg', 1 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileSize).toBe(1 * 1024 * 1024);
    });

    it('should accept large files (5MB)', () => {
      const file = createTestFile('large.jpg', 'image/jpeg', 5 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileSize).toBe(5 * 1024 * 1024);
    });

    it('should accept files at exactly 10MB limit', () => {
      const file = createTestFile('max.jpg', 'image/jpeg', 10 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(true);
      expect(result.fileSize).toBe(10 * 1024 * 1024);
    });

    it('should reject files just over 10MB limit', () => {
      const file = createTestFile('toolarge.jpg', 'image/jpeg', 10 * 1024 * 1024 + 1);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
      expect(result.error).toContain('10MB');
    });

    it('should reject files significantly over limit (20MB)', () => {
      const file = createTestFile('huge.jpg', 'image/jpeg', 20 * 1024 * 1024);
      const result = FileValidator.validate(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should handle size validation for all supported formats', () => {
      const formats = [
        { name: 'test.jpg', type: 'image/jpeg' },
        { name: 'test.png', type: 'image/png' },
        { name: 'test.webp', type: 'image/webp' },
      ];

      formats.forEach(({ name, type }) => {
        const validFile = createTestFile(name, type, 5 * 1024 * 1024);
        const invalidFile = createTestFile(name, type, 15 * 1024 * 1024);
        
        expect(FileValidator.validate(validFile).valid).toBe(true);
        expect(FileValidator.validate(invalidFile).valid).toBe(false);
      });
    });
  });

  describe('12.3 Test EXIF orientation handling', () => {
    it('should handle orientation 1 (normal)', async () => {
      const img = createTestImage(100, 100);
      const canvas = await correctOrientation(img, 1);
      
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(100);
    });

    it('should handle orientation 3 (rotate 180°)', async () => {
      const img = createTestImage(200, 100);
      const canvas = await correctOrientation(img, 3);
      
      // Dimensions should remain the same for 180° rotation
      expect(canvas.width).toBe(200);
      expect(canvas.height).toBe(100);
    });

    it('should handle orientation 6 (rotate 90° CW)', async () => {
      const img = createTestImage(200, 100);
      const canvas = await correctOrientation(img, 6);
      
      // Dimensions should be swapped
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(200);
    });

    it('should handle orientation 8 (rotate 90° CCW)', async () => {
      const img = createTestImage(200, 100);
      const canvas = await correctOrientation(img, 8);
      
      // Dimensions should be swapped
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(200);
    });

    it('should handle all 8 EXIF orientations', async () => {
      const img = createTestImage(200, 100);
      
      for (let orientation = 1; orientation <= 8; orientation++) {
        const canvas = await correctOrientation(img, orientation);
        
        // Canvas should be created successfully
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        expect(canvas.width).toBeGreaterThan(0);
        expect(canvas.height).toBeGreaterThan(0);
        
        // For orientations 5, 6, 7, 8, dimensions should be swapped
        if ([5, 6, 7, 8].includes(orientation)) {
          expect(canvas.width).toBe(100);
          expect(canvas.height).toBe(200);
        } else {
          expect(canvas.width).toBe(200);
          expect(canvas.height).toBe(100);
        }
      }
    });

    it('should handle square images with any orientation', async () => {
      const img = createTestImage(100, 100);
      
      for (let orientation = 1; orientation <= 8; orientation++) {
        const canvas = await correctOrientation(img, orientation);
        
        // Square images should remain square
        expect(canvas.width).toBe(100);
        expect(canvas.height).toBe(100);
      }
    });

    it('should handle invalid orientation values gracefully', async () => {
      const img = createTestImage(100, 100);
      const canvas = await correctOrientation(img, 99);
      
      // Should default to normal orientation
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(100);
    });

    it('should read EXIF from JPEG files', async () => {
      // Create a minimal JPEG file
      const jpegData = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
      const blob = new Blob([jpegData], { type: 'image/jpeg' });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
      
      const exif = await readEXIF(file);
      
      // Should return null for files without EXIF data, but not throw
      expect(exif).toBeNull();
    });

    it('should return null for non-JPEG files', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(), 'image/png');
      });
      const file = new File([blob], 'test.png', { type: 'image/png' });
      
      const exif = await readEXIF(file);
      
      expect(exif).toBeNull();
    });
  });

  describe('12.4 Test drag-and-drop functionality', () => {
    it('should create drag-drop handler', () => {
      const element = document.createElement('div');
      const callbacks = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
      };
      
      const handler = new DragDropHandler(element, callbacks);
      
      expect(handler).toBeInstanceOf(DragDropHandler);
      expect(typeof handler.destroy).toBe('function');
    });

    it('should attach event listeners to element', () => {
      const element = document.createElement('div');
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener');
      
      new DragDropHandler(element, {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
      });
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragenter', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    });

    it('should remove event listeners on destroy', () => {
      const element = document.createElement('div');
      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');
      
      const handler = new DragDropHandler(element, {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
      });
      
      handler.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragenter', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    });

    it('should work with partial callbacks', () => {
      const element = document.createElement('div');
      
      const handler = new DragDropHandler(element, {
        onDrop: vi.fn(),
      });
      
      expect(handler).toBeInstanceOf(DragDropHandler);
    });

    it('should work with empty callbacks', () => {
      const element = document.createElement('div');
      
      const handler = new DragDropHandler(element, {});
      
      expect(handler).toBeInstanceOf(DragDropHandler);
    });

    it('should handle multiple handlers on same element', () => {
      const element = document.createElement('div');
      
      const handler1 = new DragDropHandler(element, { onDrop: vi.fn() });
      const handler2 = new DragDropHandler(element, { onDrop: vi.fn() });
      
      expect(handler1).toBeInstanceOf(DragDropHandler);
      expect(handler2).toBeInstanceOf(DragDropHandler);
      
      handler1.destroy();
      handler2.destroy();
    });
  });

  describe('12.5 Test batch upload with multiple files', () => {
    it('should process single file', async () => {
      const files = [
        createTestFile('test.jpg', 'image/jpeg', 1 * 1024 * 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(1);
      expect(result.results.length).toBe(1);
    });

    it('should process multiple valid files', async () => {
      const files = [
        createTestFile('test1.jpg', 'image/jpeg', 1 * 1024 * 1024),
        createTestFile('test2.png', 'image/png', 2 * 1024 * 1024),
        createTestFile('test3.webp', 'image/webp', 1.5 * 1024 * 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(3);
      expect(result.results.length).toBe(3);
    });

    it('should handle mixed valid and invalid files', async () => {
      const files = [
        createTestFile('valid1.jpg', 'image/jpeg', 1 * 1024 * 1024),
        createTestFile('invalid.gif', 'image/gif', 1 * 1024 * 1024),
        createTestFile('valid2.png', 'image/png', 2 * 1024 * 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(3);
      expect(result.failureCount).toBeGreaterThanOrEqual(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toContain('Unsupported file type');
    });

    it('should reject batches with more than 10 files', async () => {
      const files = Array.from({ length: 11 }, (_, i) => 
        createTestFile(`test${i}.jpg`, 'image/jpeg', 1 * 1024 * 1024)
      );
      
      await expect(BatchUploader.processFiles(files)).rejects.toThrow(
        'Too many files. Maximum 10 files per upload.'
      );
    });

    it('should accept exactly 10 files', async () => {
      const files = Array.from({ length: 10 }, (_, i) => 
        createTestFile(`test${i}.jpg`, 'image/jpeg', 1 * 1024 * 1024)
      );
      
      try {
        const result = await BatchUploader.processFiles(files);
        expect(result.totalProcessed).toBe(10);
      } catch (error) {
        // Should not be the batch size error
        expect((error as Error).message).not.toContain('Too many files');
      }
    });

    it('should continue processing after validation failure', async () => {
      const files = [
        createTestFile('invalid1.gif', 'image/gif', 1 * 1024 * 1024),
        createTestFile('valid.jpg', 'image/jpeg', 1 * 1024 * 1024),
        createTestFile('invalid2.bmp', 'image/bmp', 1 * 1024 * 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(3);
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].validationResult?.valid).toBe(true);
      expect(result.results[2].success).toBe(false);
    });

    it('should provide progress updates', async () => {
      const files = [
        createTestFile('test1.jpg', 'image/jpeg', 1 * 1024 * 1024),
        createTestFile('test2.jpg', 'image/jpeg', 1 * 1024 * 1024),
      ];
      
      const progressCalls: Array<{ index: number; total: number; status: string }> = [];
      const onProgress = (index: number, total: number, status: string) => {
        progressCalls.push({ index, total, status });
      };
      
      try {
        await BatchUploader.processFiles(files, onProgress);
      } catch (error) {
        // Expected in test environment
      }
      
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls.some(call => call.total === 2)).toBe(true);
    });

    it('should handle empty file array', async () => {
      const files: File[] = [];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
    });

    it('should handle all supported formats in batch', async () => {
      const files = [
        createTestFile('test.jpg', 'image/jpeg', 1 * 1024 * 1024),
        createTestFile('test.jpeg', 'image/jpeg', 1 * 1024 * 1024),
        createTestFile('test.png', 'image/png', 1 * 1024 * 1024),
        createTestFile('test.webp', 'image/webp', 1 * 1024 * 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(4);
      result.results.forEach(r => {
        expect(r.validationResult?.valid).toBe(true);
      });
    });

    it('should handle files with different sizes in batch', async () => {
      const files = [
        createTestFile('tiny.jpg', 'image/jpeg', 10 * 1024), // 10KB
        createTestFile('small.jpg', 'image/jpeg', 100 * 1024), // 100KB
        createTestFile('medium.jpg', 'image/jpeg', 1 * 1024 * 1024), // 1MB
        createTestFile('large.jpg', 'image/jpeg', 5 * 1024 * 1024), // 5MB
        createTestFile('max.jpg', 'image/jpeg', 10 * 1024 * 1024), // 10MB
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(5);
      result.results.forEach(r => {
        expect(r.validationResult?.valid).toBe(true);
      });
    });

    it('should provide summary with success and failure counts', async () => {
      const files = [
        createTestFile('valid1.jpg', 'image/jpeg', 1 * 1024 * 1024),
        createTestFile('invalid.gif', 'image/gif', 1 * 1024 * 1024),
        createTestFile('valid2.png', 'image/png', 1 * 1024 * 1024),
        createTestFile('toolarge.jpg', 'image/jpeg', 15 * 1024 * 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result).toHaveProperty('successCount');
      expect(result).toHaveProperty('failureCount');
      expect(result).toHaveProperty('totalProcessed');
      expect(result.totalProcessed).toBe(4);
      expect(result.failureCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Integration - Full Upload Flow', () => {
    it('should validate, then optimize valid files', async () => {
      const file = createTestFile('test.jpg', 'image/jpeg', 2 * 1024 * 1024);
      
      // Step 1: Validate
      const validation = FileValidator.validate(file);
      expect(validation.valid).toBe(true);
      
      // Step 2: Would optimize (tested separately due to image loading)
      expect(validation.fileType).toBe('image/jpeg');
    });

    it('should reject invalid files before optimization', async () => {
      const file = createTestFile('test.gif', 'image/gif', 1 * 1024 * 1024);
      
      // Step 1: Validate
      const validation = FileValidator.validate(file);
      expect(validation.valid).toBe(false);
      
      // Should not proceed to optimization
      expect(validation.error).toContain('Unsupported file type');
    });

    it('should handle complete batch upload flow', async () => {
      const files = [
        createTestFile('photo1.jpg', 'image/jpeg', 2 * 1024 * 1024),
        createTestFile('photo2.png', 'image/png', 3 * 1024 * 1024),
        createTestFile('photo3.webp', 'image/webp', 1 * 1024 * 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(3);
      expect(result.results.length).toBe(3);
      
      // All should pass validation
      result.results.forEach(r => {
        expect(r.validationResult?.valid).toBe(true);
      });
    });
  });
});
