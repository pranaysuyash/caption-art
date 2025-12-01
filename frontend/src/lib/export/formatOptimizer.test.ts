/**
 * Unit tests for FormatOptimizer
 * Tests PNG optimization, JPEG optimization, file size estimation, and quality comparison
 */

import { describe, it, expect } from 'vitest';
import { FormatOptimizer } from './formatOptimizer';

describe('FormatOptimizer', () => {
  describe('PNG Optimization', () => {
    it('should return original data URL for PNG', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const result = FormatOptimizer.optimizePNG(dataUrl);

      expect(result.dataUrl).toBe(dataUrl);
    });

    it('should estimate file size for PNG', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const result = FormatOptimizer.optimizePNG(dataUrl);

      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should set quality to 1.0 for PNG (lossless)', () => {
      const dataUrl = 'data:image/png;base64,mockData';
      
      const result = FormatOptimizer.optimizePNG(dataUrl);

      expect(result.actualQuality).toBe(1.0);
    });

    it('should handle empty data URL', () => {
      const dataUrl = 'data:image/png;base64,';
      
      const result = FormatOptimizer.optimizePNG(dataUrl);

      expect(result.fileSize).toBe(0);
    });
  });

  describe('JPEG Optimization', () => {
    it('should return data URL with specified quality', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA==';
      const quality = 0.85;
      
      const result = FormatOptimizer.optimizeJPEG(dataUrl, quality);

      expect(result.dataUrl).toBe(dataUrl);
      expect(result.actualQuality).toBe(quality);
    });

    it('should use default quality of 0.92 when not specified', () => {
      const dataUrl = 'data:image/jpeg;base64,mockData';
      
      const result = FormatOptimizer.optimizeJPEG(dataUrl);

      expect(result.actualQuality).toBe(0.92);
    });

    it('should clamp quality below 0.5 to 0.5', () => {
      const dataUrl = 'data:image/jpeg;base64,mockData';
      
      const result = FormatOptimizer.optimizeJPEG(dataUrl, 0.3);

      expect(result.actualQuality).toBe(0.5);
    });

    it('should clamp quality above 1.0 to 1.0', () => {
      const dataUrl = 'data:image/jpeg;base64,mockData';
      
      const result = FormatOptimizer.optimizeJPEG(dataUrl, 1.5);

      expect(result.actualQuality).toBe(1.0);
    });

    it('should accept quality values in valid range', () => {
      const dataUrl = 'data:image/jpeg;base64,mockData';
      const qualities = [0.5, 0.7, 0.85, 0.92, 1.0];

      qualities.forEach(quality => {
        const result = FormatOptimizer.optimizeJPEG(dataUrl, quality);
        expect(result.actualQuality).toBe(quality);
      });
    });

    it('should estimate file size for JPEG', () => {
      const dataUrl = 'data:image/jpeg;base64,mockData';
      
      const result = FormatOptimizer.optimizeJPEG(dataUrl, 0.92);

      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('File Size Estimation', () => {
    it('should estimate file size from data URL', () => {
      // Base64 string of known length
      const base64Data = 'A'.repeat(100); // 100 characters
      const dataUrl = `data:image/png;base64,${base64Data}`;
      
      const fileSize = FormatOptimizer.estimateFileSize(dataUrl);

      // Base64 is ~33% larger than binary, so binary is ~75% of base64
      const expectedSize = Math.ceil(100 * 0.75);
      expect(fileSize).toBe(expectedSize);
    });

    it('should return 0 for empty data URL', () => {
      const dataUrl = 'data:image/png;base64,';
      
      const fileSize = FormatOptimizer.estimateFileSize(dataUrl);

      expect(fileSize).toBe(0);
    });

    it('should handle data URLs without base64 data', () => {
      const dataUrl = 'data:image/png;base64';
      
      const fileSize = FormatOptimizer.estimateFileSize(dataUrl);

      expect(fileSize).toBe(0);
    });

    it('should estimate larger sizes for longer data URLs', () => {
      const shortDataUrl = 'data:image/png;base64,' + 'A'.repeat(100);
      const longDataUrl = 'data:image/png;base64,' + 'A'.repeat(1000);

      const shortSize = FormatOptimizer.estimateFileSize(shortDataUrl);
      const longSize = FormatOptimizer.estimateFileSize(longDataUrl);

      expect(longSize).toBeGreaterThan(shortSize);
    });

    it('should calculate size correctly for realistic data URL', () => {
      // A small 1x1 PNG image
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const fileSize = FormatOptimizer.estimateFileSize(dataUrl);

      // Should be a reasonable size (not 0, not huge)
      expect(fileSize).toBeGreaterThan(0);
      expect(fileSize).toBeLessThan(1000); // Small image should be < 1KB
    });
  });

  describe('Quality Comparison', () => {
    it('should return 1.0 for identical images', () => {
      const dataUrl = 'data:image/png;base64,mockData';
      
      const score = FormatOptimizer.compareQuality(dataUrl, dataUrl);

      expect(score).toBe(1.0);
    });

    it('should return lower score for smaller compressed image', () => {
      const original = 'data:image/png;base64,' + 'A'.repeat(1000);
      const compressed = 'data:image/png;base64,' + 'A'.repeat(500);

      const score = FormatOptimizer.compareQuality(original, compressed);

      expect(score).toBeLessThan(1.0);
      expect(score).toBeGreaterThan(0);
    });

    it('should return 0 for empty original', () => {
      const original = 'data:image/png;base64,';
      const compressed = 'data:image/png;base64,mockData';

      const score = FormatOptimizer.compareQuality(original, compressed);

      expect(score).toBe(0);
    });

    it('should cap score at 1.0 even if compressed is larger', () => {
      const original = 'data:image/png;base64,' + 'A'.repeat(500);
      const compressed = 'data:image/png;base64,' + 'A'.repeat(1000);

      const score = FormatOptimizer.compareQuality(original, compressed);

      expect(score).toBe(1.0);
    });

    it('should calculate proportional scores', () => {
      const original = 'data:image/png;base64,' + 'A'.repeat(1000);
      const compressed50 = 'data:image/png;base64,' + 'A'.repeat(500);
      const compressed75 = 'data:image/png;base64,' + 'A'.repeat(750);

      const score50 = FormatOptimizer.compareQuality(original, compressed50);
      const score75 = FormatOptimizer.compareQuality(original, compressed75);

      expect(score75).toBeGreaterThan(score50);
    });
  });

  describe('Optimization Result Structure', () => {
    it('should return all required fields for PNG', () => {
      const dataUrl = 'data:image/png;base64,mockData';
      
      const result = FormatOptimizer.optimizePNG(dataUrl);

      expect(result).toHaveProperty('dataUrl');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('dimensions');
      expect(result).toHaveProperty('actualQuality');
      expect(result.dimensions).toHaveProperty('width');
      expect(result.dimensions).toHaveProperty('height');
    });

    it('should return all required fields for JPEG', () => {
      const dataUrl = 'data:image/jpeg;base64,mockData';
      
      const result = FormatOptimizer.optimizeJPEG(dataUrl, 0.92);

      expect(result).toHaveProperty('dataUrl');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('dimensions');
      expect(result).toHaveProperty('actualQuality');
      expect(result.dimensions).toHaveProperty('width');
      expect(result.dimensions).toHaveProperty('height');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long data URLs', () => {
      const longDataUrl = 'data:image/png;base64,' + 'A'.repeat(1000000);
      
      const result = FormatOptimizer.optimizePNG(longDataUrl);

      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.dataUrl).toBe(longDataUrl);
    });

    it('should handle data URLs with different MIME types', () => {
      const pngUrl = 'data:image/png;base64,mockData';
      const jpegUrl = 'data:image/jpeg;base64,mockData';
      const webpUrl = 'data:image/webp;base64,mockData';

      expect(FormatOptimizer.estimateFileSize(pngUrl)).toBeGreaterThan(0);
      expect(FormatOptimizer.estimateFileSize(jpegUrl)).toBeGreaterThan(0);
      expect(FormatOptimizer.estimateFileSize(webpUrl)).toBeGreaterThan(0);
    });

    it('should handle malformed data URLs gracefully', () => {
      const malformedUrls = [
        'not-a-data-url',
        'data:image/png',
        'base64,mockData',
        ''
      ];

      malformedUrls.forEach(url => {
        expect(() => {
          FormatOptimizer.estimateFileSize(url);
        }).not.toThrow();
      });
    });
  });
});
