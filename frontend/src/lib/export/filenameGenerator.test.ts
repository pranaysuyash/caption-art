/**
 * Unit tests for FilenameGenerator
 * Tests filename format, timestamp inclusion, watermark suffix, sanitization, and uniqueness
 */

import { describe, it, expect } from 'vitest';
import { FilenameGenerator } from './filenameGenerator';
import type { FilenameOptions } from './filenameGenerator';

describe('FilenameGenerator', () => {
  describe('Filename Format', () => {
    it('should generate filename with correct base format', () => {
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toMatch(/^caption-art-\d{8}-\d{6}\.png$/);
    });

    it('should use PNG extension for PNG format', () => {
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toEndWith('.png');
    });

    it('should use JPG extension for JPEG format', () => {
      const options: FilenameOptions = {
        format: 'jpeg',
        watermarked: false
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toEndWith('.jpg');
    });

    it('should include caption-art prefix', () => {
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toStartWith('caption-art-');
    });
  });

  describe('Timestamp Inclusion', () => {
    it('should include timestamp in YYYYMMDD-HHMMSS format', () => {
      const timestamp = new Date('2025-01-27T14:30:22');
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false,
        timestamp
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toContain('20250127-143022');
    });

    it('should pad single-digit months with zero', () => {
      const timestamp = new Date('2025-03-15T10:20:30');
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false,
        timestamp
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toContain('20250315-102030');
    });

    it('should pad single-digit days with zero', () => {
      const timestamp = new Date('2025-12-05T08:15:45');
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false,
        timestamp
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toContain('20251205-081545');
    });

    it('should pad single-digit hours with zero', () => {
      const timestamp = new Date('2025-06-20T09:30:00');
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false,
        timestamp
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toContain('20250620-093000');
    });

    it('should use current time when timestamp not provided', () => {
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false
      };

      const filename = FilenameGenerator.generate(options);

      // Should have timestamp format
      expect(filename).toMatch(/\d{8}-\d{6}/);
    });

    it('should generate different filenames for different timestamps', () => {
      const timestamp1 = new Date('2025-01-27T14:30:22');
      const timestamp2 = new Date('2025-01-27T14:30:23');

      const filename1 = FilenameGenerator.generate({
        format: 'png',
        watermarked: false,
        timestamp: timestamp1
      });

      const filename2 = FilenameGenerator.generate({
        format: 'png',
        watermarked: false,
        timestamp: timestamp2
      });

      expect(filename1).not.toBe(filename2);
    });
  });

  describe('Watermark Suffix', () => {
    it('should include -watermarked suffix when watermarked is true', () => {
      const options: FilenameOptions = {
        format: 'png',
        watermarked: true
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toContain('-watermarked');
    });

    it('should not include -watermarked suffix when watermarked is false', () => {
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).not.toContain('-watermarked');
    });

    it('should place watermark suffix before extension', () => {
      const timestamp = new Date('2025-01-27T14:30:22');
      const options: FilenameOptions = {
        format: 'png',
        watermarked: true,
        timestamp
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toBe('caption-art-20250127-143022-watermarked.png');
    });

    it('should work with JPEG format and watermark', () => {
      const timestamp = new Date('2025-01-27T14:30:22');
      const options: FilenameOptions = {
        format: 'jpeg',
        watermarked: true,
        timestamp
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toBe('caption-art-20250127-143022-watermarked.jpg');
    });
  });

  describe('Sanitization', () => {
    it('should replace spaces with hyphens', () => {
      const result = FilenameGenerator.sanitize('my file name');

      expect(result).toBe('my-file-name');
    });

    it('should remove special characters', () => {
      const result = FilenameGenerator.sanitize('file@name#with$special%chars');

      expect(result).toBe('filenamewithspecialchars');
    });

    it('should keep alphanumeric characters', () => {
      const result = FilenameGenerator.sanitize('file123name456');

      expect(result).toBe('file123name456');
    });

    it('should keep hyphens and underscores', () => {
      const result = FilenameGenerator.sanitize('my-file_name');

      expect(result).toBe('my-file_name');
    });

    it('should remove multiple consecutive hyphens', () => {
      const result = FilenameGenerator.sanitize('my---file---name');

      expect(result).toBe('my-file-name');
    });

    it('should remove leading hyphens', () => {
      const result = FilenameGenerator.sanitize('---filename');

      expect(result).toBe('filename');
    });

    it('should remove trailing hyphens', () => {
      const result = FilenameGenerator.sanitize('filename---');

      expect(result).toBe('filename');
    });

    it('should limit length to 200 characters', () => {
      const longString = 'a'.repeat(300);
      const result = FilenameGenerator.sanitize(longString);

      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should handle empty string', () => {
      const result = FilenameGenerator.sanitize('');

      expect(result).toBe('');
    });

    it('should handle string with only special characters', () => {
      const result = FilenameGenerator.sanitize('@#$%^&*()');

      expect(result).toBe('');
    });

    it('should handle mixed case', () => {
      const result = FilenameGenerator.sanitize('MyFileName');

      expect(result).toBe('MyFileName');
    });
  });

  describe('Custom Text', () => {
    it('should include custom text in filename', () => {
      const timestamp = new Date('2025-01-27T14:30:22');
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false,
        timestamp,
        customText: 'vacation'
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toContain('vacation');
      expect(filename).toBe('caption-art-vacation-20250127-143022.png');
    });

    it('should sanitize custom text', () => {
      const timestamp = new Date('2025-01-27T14:30:22');
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false,
        timestamp,
        customText: 'my vacation photos!'
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toContain('my-vacation-photos');
    });

    it('should work with custom text and watermark', () => {
      const timestamp = new Date('2025-01-27T14:30:22');
      const options: FilenameOptions = {
        format: 'png',
        watermarked: true,
        timestamp,
        customText: 'test'
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toBe('caption-art-test-20250127-143022-watermarked.png');
    });
  });

  describe('Uniqueness', () => {
    it('should return original filename if not in existing list', () => {
      const filename = 'caption-art-20250127-143022.png';
      const existing: string[] = [];

      const result = FilenameGenerator.ensureUnique(filename, existing);

      expect(result).toBe(filename);
    });

    it('should append -1 if filename exists', () => {
      const filename = 'caption-art-20250127-143022.png';
      const existing = [filename];

      const result = FilenameGenerator.ensureUnique(filename, existing);

      expect(result).toBe('caption-art-20250127-143022-1.png');
    });

    it('should append -2 if filename and -1 exist', () => {
      const filename = 'caption-art-20250127-143022.png';
      const existing = [
        filename,
        'caption-art-20250127-143022-1.png'
      ];

      const result = FilenameGenerator.ensureUnique(filename, existing);

      expect(result).toBe('caption-art-20250127-143022-2.png');
    });

    it('should increment counter until unique filename found', () => {
      const filename = 'caption-art-20250127-143022.png';
      const existing = [
        filename,
        'caption-art-20250127-143022-1.png',
        'caption-art-20250127-143022-2.png',
        'caption-art-20250127-143022-3.png'
      ];

      const result = FilenameGenerator.ensureUnique(filename, existing);

      expect(result).toBe('caption-art-20250127-143022-4.png');
    });

    it('should preserve extension when making unique', () => {
      const filename = 'test.jpg';
      const existing = ['test.jpg'];

      const result = FilenameGenerator.ensureUnique(filename, existing);

      expect(result).toEndWith('.jpg');
    });

    it('should handle filenames without extension', () => {
      const filename = 'test';
      const existing = ['test'];

      const result = FilenameGenerator.ensureUnique(filename, existing);

      expect(result).toBe('test-1');
    });

    it('should handle empty existing list', () => {
      const filename = 'test.png';

      const result = FilenameGenerator.ensureUnique(filename);

      expect(result).toBe(filename);
    });
  });

  describe('Integration', () => {
    it('should generate complete filename with all options', () => {
      const timestamp = new Date('2025-01-27T14:30:22');
      const options: FilenameOptions = {
        format: 'jpeg',
        watermarked: true,
        timestamp,
        customText: 'my photo'
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toBe('caption-art-my-photo-20250127-143022-watermarked.jpg');
    });

    it('should generate filesystem-safe filenames', () => {
      const options: FilenameOptions = {
        format: 'png',
        watermarked: false,
        customText: 'file/with\\invalid:chars*?'
      };

      const filename = FilenameGenerator.generate(options);

      // Should not contain invalid filesystem characters
      expect(filename).not.toMatch(/[/\\:*?"<>|]/);
    });

    it('should handle all edge cases together', () => {
      const timestamp = new Date('2025-12-31T23:59:59');
      const options: FilenameOptions = {
        format: 'jpeg',
        watermarked: true,
        timestamp,
        customText: '   special@#$chars   '
      };

      const filename = FilenameGenerator.generate(options);

      expect(filename).toMatch(/^caption-art-specialchars-\d{8}-\d{6}-watermarked\.jpg$/);
    });
  });
});
