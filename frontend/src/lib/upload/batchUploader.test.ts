/**
 * Unit Tests for BatchUploader
 * 
 * Tests batch file processing functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { BatchUploader } from './batchUploader';

// Helper to create a test file
function createTestFile(name: string, type: string, size: number): File {
  const file = new File(['x'.repeat(size)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('BatchUploader', () => {
  describe('processFiles', () => {
    it('should reject when more than 10 files are provided', async () => {
      const files = Array.from({ length: 11 }, (_, i) => 
        createTestFile(`test${i}.jpg`, 'image/jpeg', 1024)
      );
      
      await expect(BatchUploader.processFiles(files)).rejects.toThrow(
        'Too many files. Maximum 10 files per upload.'
      );
    });

    it('should accept exactly 10 files', async () => {
      const files = Array.from({ length: 10 }, (_, i) => 
        createTestFile(`test${i}.jpg`, 'image/jpeg', 1024)
      );
      
      // This will fail in test environment due to image loading, but should not throw the batch size error
      try {
        await BatchUploader.processFiles(files);
      } catch (error) {
        // Should not be the batch size error
        expect((error as Error).message).not.toContain('Too many files');
      }
    });

    it('should process files sequentially', async () => {
      const files = [
        createTestFile('test1.jpg', 'image/jpeg', 1024),
        createTestFile('test2.jpg', 'image/jpeg', 1024),
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
      
      // Should have progress calls for both files
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls.some(call => call.index === 0)).toBe(true);
      expect(progressCalls.some(call => call.index === 1)).toBe(true);
    });

    it('should return summary with success and failure counts', async () => {
      const files = [
        createTestFile('test1.jpg', 'image/jpeg', 1024),
        createTestFile('test2.gif', 'image/gif', 1024), // Invalid type
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('successCount');
      expect(result).toHaveProperty('failureCount');
      expect(result).toHaveProperty('totalProcessed');
      expect(result.totalProcessed).toBe(2);
      expect(result.results.length).toBe(2);
    });

    it('should continue processing after validation failure', async () => {
      const files = [
        createTestFile('test1.gif', 'image/gif', 1024), // Invalid
        createTestFile('test2.jpg', 'image/jpeg', 1024), // Valid
        createTestFile('test3.jpg', 'image/jpeg', 1024), // Valid
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(3);
      expect(result.failureCount).toBeGreaterThanOrEqual(1); // At least the GIF should fail
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('Unsupported file type');
    });

    it('should reject files over 10MB', async () => {
      const files = [
        createTestFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024), // 11MB
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.failureCount).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('File too large');
    });

    it('should accept files under 10MB', async () => {
      const files = [
        createTestFile('valid.jpg', 'image/jpeg', 5 * 1024 * 1024), // 5MB
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      // Will fail due to image loading in test environment, but validation should pass
      expect(result.results[0].validationResult?.valid).toBe(true);
    });

    it('should call progress callback with correct parameters', async () => {
      const files = [
        createTestFile('test1.jpg', 'image/jpeg', 1024),
        createTestFile('test2.jpg', 'image/jpeg', 1024),
      ];
      
      const progressCalls: Array<{ index: number; total: number; status: string }> = [];
      const onProgress = (index: number, total: number, status: string) => {
        progressCalls.push({ index, total, status });
      };
      
      try {
        await BatchUploader.processFiles(files, onProgress);
      } catch (error) {
        // Expected
      }
      
      // Check that progress was called with correct total
      progressCalls.forEach(call => {
        expect(call.total).toBe(2);
        expect(call.index).toBeGreaterThanOrEqual(0);
        expect(call.index).toBeLessThan(2);
      });
    });

    it('should include validation results in output', async () => {
      const files = [
        createTestFile('test.jpg', 'image/jpeg', 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.results[0]).toHaveProperty('validationResult');
      expect(result.results[0].validationResult).toBeDefined();
    });

    it('should handle empty file array', async () => {
      const files: File[] = [];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(result.results.length).toBe(0);
    });

    it('should handle single file', async () => {
      const files = [
        createTestFile('single.jpg', 'image/jpeg', 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(1);
      expect(result.results.length).toBe(1);
    });

    it('should handle mixed valid and invalid files', async () => {
      const files = [
        createTestFile('valid1.jpg', 'image/jpeg', 1024),
        createTestFile('invalid.gif', 'image/gif', 1024),
        createTestFile('valid2.png', 'image/png', 1024),
        createTestFile('toolarge.jpg', 'image/jpeg', 11 * 1024 * 1024),
        createTestFile('valid3.webp', 'image/webp', 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(5);
      expect(result.failureCount).toBeGreaterThanOrEqual(2); // GIF and large file
      
      // Check specific failures
      expect(result.results[1].success).toBe(false); // GIF
      expect(result.results[1].error).toContain('Unsupported file type');
      
      expect(result.results[3].success).toBe(false); // Large file
      expect(result.results[3].error).toContain('File too large');
    });

    it('should report progress status changes', async () => {
      const files = [
        createTestFile('test.jpg', 'image/jpeg', 1024),
      ];
      
      const statuses: string[] = [];
      const onProgress = (_: number, __: number, status: string) => {
        statuses.push(status);
      };
      
      try {
        await BatchUploader.processFiles(files, onProgress);
      } catch (error) {
        // Expected
      }
      
      // Should have at least validating status
      expect(statuses).toContain('validating');
    });

    it('should handle all supported image formats', async () => {
      const files = [
        createTestFile('test.jpg', 'image/jpeg', 1024),
        createTestFile('test.jpeg', 'image/jpeg', 1024),
        createTestFile('test.png', 'image/png', 1024),
        createTestFile('test.webp', 'image/webp', 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.totalProcessed).toBe(4);
      // All should pass validation (though may fail on image loading in test env)
      result.results.forEach(r => {
        expect(r.validationResult?.valid).toBe(true);
      });
    });

    it('should preserve file references in results', async () => {
      const file1 = createTestFile('test1.jpg', 'image/jpeg', 1024);
      const file2 = createTestFile('test2.jpg', 'image/jpeg', 1024);
      const files = [file1, file2];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.results[0].file).toBe(file1);
      expect(result.results[1].file).toBe(file2);
    });

    it('should handle unexpected errors gracefully', async () => {
      const files = [
        createTestFile('test.jpg', 'image/jpeg', 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      // Should complete without throwing
      expect(result).toBeDefined();
      expect(result.totalProcessed).toBe(1);
    });
  });

  describe('error messages', () => {
    it('should provide clear error for unsupported file type', async () => {
      const files = [
        createTestFile('test.gif', 'image/gif', 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.results[0].error).toBe('Unsupported file type. Please use JPG, PNG, or WebP.');
    });

    it('should provide clear error for oversized file', async () => {
      const files = [
        createTestFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.results[0].error).toBe('File too large. Maximum size is 10MB.');
    });

    it('should include file metadata in results', async () => {
      const files = [
        createTestFile('test.jpg', 'image/jpeg', 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.results[0].validationResult?.fileType).toBe('image/jpeg');
      expect(result.results[0].validationResult?.fileSize).toBe(1024);
    });
  });

  describe('edge cases', () => {
    it('should handle files with uppercase extensions', async () => {
      const files = [
        createTestFile('test.JPG', 'image/jpeg', 1024),
        createTestFile('test.PNG', 'image/png', 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      result.results.forEach(r => {
        expect(r.validationResult?.valid).toBe(true);
      });
    });

    it('should handle files with no extension', async () => {
      const files = [
        createTestFile('noextension', 'image/jpeg', 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      // Should still validate based on MIME type
      expect(result.results[0].validationResult?.valid).toBe(true);
    });

    it('should handle very small files', async () => {
      const files = [
        createTestFile('tiny.jpg', 'image/jpeg', 10), // 10 bytes
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.results[0].validationResult?.valid).toBe(true);
    });

    it('should handle files at exactly 10MB limit', async () => {
      const files = [
        createTestFile('exact.jpg', 'image/jpeg', 10 * 1024 * 1024),
      ];
      
      const result = await BatchUploader.processFiles(files);
      
      expect(result.results[0].validationResult?.valid).toBe(true);
    });
  });
});
