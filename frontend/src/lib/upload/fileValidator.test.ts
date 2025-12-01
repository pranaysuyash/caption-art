/**
 * Unit and Property-Based Tests for FileValidator
 * 
 * Tests correctness properties using fast-check and specific examples
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FileValidator } from './fileValidator';

describe('FileValidator', () => {
  describe('Property 1: File type validation', () => {
    /**
     * Feature: image-upload-preprocessing, Property 1: File type validation
     * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
     * 
     * For any uploaded file, if the file extension is not JPG, PNG, or WebP,
     * the validation should fail
     */
    it('should reject files that are not JPG, PNG, or WebP', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary file names with unsupported extensions
          fc.record({
            name: fc.oneof(
              // Unsupported image formats
              fc.constant('file.gif'),
              fc.constant('file.bmp'),
              fc.constant('file.tiff'),
              fc.constant('file.svg'),
              fc.constant('file.ico'),
              // Non-image formats
              fc.constant('file.pdf'),
              fc.constant('file.txt'),
              fc.constant('file.doc'),
              fc.constant('file.zip'),
              fc.constant('file.mp4'),
              // No extension
              fc.constant('file'),
              // Random unsupported extensions
              fc.string({ minLength: 1, maxLength: 10 }).map(ext => `file.${ext}`)
            ),
            size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // Within size limit
            type: fc.string()
          }),
          ({ name, size, type }) => {
            // Skip if the name happens to have a supported extension
            const lowerName = name.toLowerCase();
            if (lowerName.endsWith('.jpg') || 
                lowerName.endsWith('.jpeg') || 
                lowerName.endsWith('.png') || 
                lowerName.endsWith('.webp')) {
              return true;
            }

            // Skip if the type is a supported MIME type
            const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (supportedTypes.includes(type)) {
              return true;
            }

            // Create a mock File object
            const file = new File([''], name, { type });
            Object.defineProperty(file, 'size', { value: size });

            const result = FileValidator.validate(file);

            // The validation should fail for unsupported file types
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Unsupported file type');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept files that are JPG, PNG, or WebP', () => {
      fc.assert(
        fc.property(
          fc.record({
            extension: fc.oneof(
              fc.constant('.jpg'),
              fc.constant('.jpeg'),
              fc.constant('.png'),
              fc.constant('.webp'),
              fc.constant('.JPG'),
              fc.constant('.JPEG'),
              fc.constant('.PNG'),
              fc.constant('.WEBP')
            ),
            basename: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('.')),
            size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // Within size limit
            type: fc.oneof(
              fc.constant('image/jpeg'),
              fc.constant('image/png'),
              fc.constant('image/webp')
            )
          }),
          ({ extension, basename, size, type }) => {
            const name = basename + extension;
            const file = new File([''], name, { type });
            Object.defineProperty(file, 'size', { value: size });

            const result = FileValidator.validate(file);

            // The validation should succeed for supported file types
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: File size enforcement', () => {
    /**
     * Feature: image-upload-preprocessing, Property 2: File size enforcement
     * Validates: Requirements 3.1, 3.2
     * 
     * For any uploaded file, if the file size exceeds 10MB,
     * the validation should fail
     */
    it('should reject files larger than 10MB', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.oneof(
              fc.constant('image.jpg'),
              fc.constant('image.png'),
              fc.constant('image.webp')
            ),
            size: fc.integer({ min: 10 * 1024 * 1024 + 1, max: 100 * 1024 * 1024 }), // Over 10MB
            type: fc.oneof(
              fc.constant('image/jpeg'),
              fc.constant('image/png'),
              fc.constant('image/webp')
            )
          }),
          ({ name, size, type }) => {
            const file = new File([''], name, { type });
            Object.defineProperty(file, 'size', { value: size });

            const result = FileValidator.validate(file);

            // The validation should fail for oversized files
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('File too large');
            expect(result.error).toContain('10MB');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept files at or under 10MB', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.oneof(
              fc.constant('image.jpg'),
              fc.constant('image.png'),
              fc.constant('image.webp')
            ),
            size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // At or under 10MB
            type: fc.oneof(
              fc.constant('image/jpeg'),
              fc.constant('image/png'),
              fc.constant('image/webp')
            )
          }),
          ({ name, size, type }) => {
            const file = new File([''], name, { type });
            Object.defineProperty(file, 'size', { value: size });

            const result = FileValidator.validate(file);

            // The validation should succeed for files within size limit
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests - Specific Examples', () => {
    describe('validate()', () => {
      it('should accept a valid JPG file', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB
        
        const result = FileValidator.validate(file);
        
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.fileType).toBe('image/jpeg');
        expect(result.fileSize).toBe(5 * 1024 * 1024);
      });

      it('should accept a valid PNG file', () => {
        const file = new File(['test'], 'test.png', { type: 'image/png' });
        Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 }); // 3MB
        
        const result = FileValidator.validate(file);
        
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept a valid WebP file', () => {
        const file = new File(['test'], 'test.webp', { type: 'image/webp' });
        Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB
        
        const result = FileValidator.validate(file);
        
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject a GIF file', () => {
        const file = new File(['test'], 'test.gif', { type: 'image/gif' });
        Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });
        
        const result = FileValidator.validate(file);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Unsupported file type. Please use JPG, PNG, or WebP.');
      });

      it('should reject a file over 10MB', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB
        
        const result = FileValidator.validate(file);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('File too large. Maximum size is 10MB.');
      });

      it('should accept a file exactly at 10MB limit', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // Exactly 10MB
        
        const result = FileValidator.validate(file);
        
        expect(result.valid).toBe(true);
      });

      it('should reject a PDF file', () => {
        const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });
        
        const result = FileValidator.validate(file);
        
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Unsupported file type');
      });
    });

    describe('isValidImageType()', () => {
      it('should accept JPG with correct MIME type', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        expect(FileValidator.isValidImageType(file)).toBe(true);
      });

      it('should accept JPEG extension variant', () => {
        const file = new File(['test'], 'test.jpeg', { type: 'image/jpeg' });
        expect(FileValidator.isValidImageType(file)).toBe(true);
      });

      it('should accept PNG with correct MIME type', () => {
        const file = new File(['test'], 'test.png', { type: 'image/png' });
        expect(FileValidator.isValidImageType(file)).toBe(true);
      });

      it('should accept WebP with correct MIME type', () => {
        const file = new File(['test'], 'test.webp', { type: 'image/webp' });
        expect(FileValidator.isValidImageType(file)).toBe(true);
      });

      it('should accept file with correct extension but missing MIME type', () => {
        const file = new File(['test'], 'test.jpg', { type: '' });
        expect(FileValidator.isValidImageType(file)).toBe(true);
      });

      it('should accept uppercase extensions', () => {
        const file = new File(['test'], 'test.JPG', { type: '' });
        expect(FileValidator.isValidImageType(file)).toBe(true);
      });

      it('should reject unsupported image formats', () => {
        const file = new File(['test'], 'test.gif', { type: 'image/gif' });
        expect(FileValidator.isValidImageType(file)).toBe(false);
      });

      it('should reject non-image files', () => {
        const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
        expect(FileValidator.isValidImageType(file)).toBe(false);
      });
    });

    describe('isValidSize()', () => {
      it('should accept file under size limit', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 });
        
        expect(FileValidator.isValidSize(file, 10 * 1024 * 1024)).toBe(true);
      });

      it('should accept file exactly at size limit', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });
        
        expect(FileValidator.isValidSize(file, 10 * 1024 * 1024)).toBe(true);
      });

      it('should reject file over size limit', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 + 1 });
        
        expect(FileValidator.isValidSize(file, 10 * 1024 * 1024)).toBe(false);
      });

      it('should accept very small files', () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 1024 }); // 1KB
        
        expect(FileValidator.isValidSize(file, 10 * 1024 * 1024)).toBe(true);
      });
    });

    describe('getSupportedFormats()', () => {
      it('should return array of supported MIME types', () => {
        const formats = FileValidator.getSupportedFormats();
        
        expect(Array.isArray(formats)).toBe(true);
        expect(formats).toContain('image/jpeg');
        expect(formats).toContain('image/png');
        expect(formats).toContain('image/webp');
        expect(formats.length).toBe(3);
      });

      it('should return a new array each time (not mutate original)', () => {
        const formats1 = FileValidator.getSupportedFormats();
        const formats2 = FileValidator.getSupportedFormats();
        
        expect(formats1).not.toBe(formats2);
        expect(formats1).toEqual(formats2);
      });
    });
  });
});
