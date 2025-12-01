/**
 * Property-Based Tests for BatchUploader
 * 
 * Tests correctness properties using fast-check
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { BatchUploader } from './batchUploader';

// Helper to create a mock File object
function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(Math.min(size, 1000)).fill('a').join('');
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

// Helper to create a valid image file (small PNG)
function createValidImageFile(name: string): File {
  // Create a minimal valid PNG (1x1 transparent pixel)
  const pngData = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82
  ]);
  
  const blob = new Blob([pngData], { type: 'image/png' });
  return new File([blob], name, { type: 'image/png' });
}

// Helper to create an invalid file (too large)
function createInvalidFile(name: string): File {
  const size = 11 * 1024 * 1024; // 11MB - exceeds 10MB limit
  return createMockFile(name, size, 'image/jpeg');
}

describe('BatchUploader', () => {
  describe('Property 6: Batch processing independence', () => {
    /**
     * Feature: image-upload-preprocessing, Property 6: Batch processing independence
     * Validates: Requirements 7.3
     * 
     * For any batch of files, if one file fails validation, all other valid files should still be processed
     */
    it('should process valid files even when some files fail validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }), // Number of valid files
          fc.integer({ min: 1, max: 3 }), // Number of invalid files
          fc.integer({ min: 0, max: 9 }), // Position to insert invalid files
          async (validCount, invalidCount, insertPosition) => {
            // Ensure we don't exceed batch size limit
            const totalFiles = validCount + invalidCount;
            if (totalFiles > 10) {
              return true; // Skip this test case
            }

            // Create valid files
            const validFiles: File[] = [];
            for (let i = 0; i < validCount; i++) {
              validFiles.push(createValidImageFile(`valid-${i}.png`));
            }

            // Create invalid files (too large)
            const invalidFiles: File[] = [];
            for (let i = 0; i < invalidCount; i++) {
              invalidFiles.push(createInvalidFile(`invalid-${i}.jpg`));
            }

            // Interleave valid and invalid files at the specified position
            const allFiles: File[] = [];
            const normalizedPosition = Math.min(insertPosition, validCount);
            
            // Add valid files before insertion point
            for (let i = 0; i < normalizedPosition; i++) {
              allFiles.push(validFiles[i]);
            }
            
            // Add all invalid files
            allFiles.push(...invalidFiles);
            
            // Add remaining valid files
            for (let i = normalizedPosition; i < validCount; i++) {
              allFiles.push(validFiles[i]);
            }

            // Process the batch
            const result = await BatchUploader.processFiles(allFiles);

            // Property: All valid files should be processed successfully
            // even though some files failed
            expect(result.totalProcessed).toBe(totalFiles);
            expect(result.successCount).toBe(validCount);
            expect(result.failureCount).toBe(invalidCount);
            
            // Verify that each valid file was processed
            const validResults = result.results.filter(r => 
              validFiles.some(vf => vf.name === r.file.name)
            );
            expect(validResults.length).toBe(validCount);
            
            // All valid files should have success = true
            for (const validResult of validResults) {
              expect(validResult.success).toBe(true);
              expect(validResult.error).toBeUndefined();
            }
            
            // Verify that each invalid file failed
            const invalidResults = result.results.filter(r => 
              invalidFiles.some(inf => inf.name === r.file.name)
            );
            expect(invalidResults.length).toBe(invalidCount);
            
            // All invalid files should have success = false
            for (const invalidResult of invalidResults) {
              expect(invalidResult.success).toBe(false);
              expect(invalidResult.error).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should process files independently regardless of failure position', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 5 }), // Position of invalid file
          async (invalidPosition) => {
            const batchSize = 6;
            if (invalidPosition >= batchSize) {
              return true; // Skip invalid positions
            }

            // Create a batch with one invalid file at the specified position
            const files: File[] = [];
            for (let i = 0; i < batchSize; i++) {
              if (i === invalidPosition) {
                files.push(createInvalidFile(`invalid-${i}.jpg`));
              } else {
                files.push(createValidImageFile(`valid-${i}.png`));
              }
            }

            // Process the batch
            const result = await BatchUploader.processFiles(files);

            // Property: Exactly one file should fail, all others should succeed
            expect(result.totalProcessed).toBe(batchSize);
            expect(result.successCount).toBe(batchSize - 1);
            expect(result.failureCount).toBe(1);
            
            // The failed file should be at the expected position
            expect(result.results[invalidPosition].success).toBe(false);
            expect(result.results[invalidPosition].error).toBeDefined();
            
            // All other files should succeed
            for (let i = 0; i < batchSize; i++) {
              if (i !== invalidPosition) {
                expect(result.results[i].success).toBe(true);
                expect(result.results[i].error).toBeUndefined();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all files failing validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of invalid files
          async (invalidCount) => {
            // Create all invalid files
            const files: File[] = [];
            for (let i = 0; i < invalidCount; i++) {
              files.push(createInvalidFile(`invalid-${i}.jpg`));
            }

            // Process the batch
            const result = await BatchUploader.processFiles(files);

            // Property: All files should fail, but processing should complete
            expect(result.totalProcessed).toBe(invalidCount);
            expect(result.successCount).toBe(0);
            expect(result.failureCount).toBe(invalidCount);
            
            // All results should have success = false
            for (const fileResult of result.results) {
              expect(fileResult.success).toBe(false);
              expect(fileResult.error).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all files passing validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of valid files
          async (validCount) => {
            // Create all valid files
            const files: File[] = [];
            for (let i = 0; i < validCount; i++) {
              files.push(createValidImageFile(`valid-${i}.png`));
            }

            // Process the batch
            const result = await BatchUploader.processFiles(files);

            // Property: All files should succeed
            expect(result.totalProcessed).toBe(validCount);
            expect(result.successCount).toBe(validCount);
            expect(result.failureCount).toBe(0);
            
            // All results should have success = true
            for (const fileResult of result.results) {
              expect(fileResult.success).toBe(true);
              expect(fileResult.error).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Batch size enforcement', () => {
    it('should reject batches exceeding maximum size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 11, max: 20 }), // Batch size exceeding limit
          async (batchSize) => {
            // Create files exceeding the limit
            const files: File[] = [];
            for (let i = 0; i < batchSize; i++) {
              files.push(createValidImageFile(`file-${i}.png`));
            }

            // Property: Should throw an error for batches exceeding 10 files
            await expect(BatchUploader.processFiles(files)).rejects.toThrow(
              'Too many files. Maximum 10 files per upload.'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept batches at or below maximum size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Batch size within limit
          async (batchSize) => {
            // Create files within the limit
            const files: File[] = [];
            for (let i = 0; i < batchSize; i++) {
              files.push(createValidImageFile(`file-${i}.png`));
            }

            // Property: Should not throw an error for valid batch sizes
            const result = await BatchUploader.processFiles(files);
            expect(result.totalProcessed).toBe(batchSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Sequential processing', () => {
    it('should process files in order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }), // Number of files
          async (fileCount) => {
            // Create files with unique names
            const files: File[] = [];
            for (let i = 0; i < fileCount; i++) {
              files.push(createValidImageFile(`file-${i}.png`));
            }

            // Track which files have been started (first callback for each file)
            const fileStartOrder: string[] = [];
            const seenFiles = new Set<number>();
            
            const result = await BatchUploader.processFiles(files, (index) => {
              // Only track the first time we see each file index
              if (!seenFiles.has(index)) {
                seenFiles.add(index);
                fileStartOrder.push(files[index].name);
              }
            });

            // Property: Files should be processed in the order they were provided
            expect(result.results.length).toBe(fileCount);
            for (let i = 0; i < fileCount; i++) {
              expect(result.results[i].file.name).toBe(files[i].name);
            }
            
            // Files should start processing in order
            expect(fileStartOrder.length).toBe(fileCount);
            for (let i = 0; i < fileCount; i++) {
              expect(fileStartOrder[i]).toBe(files[i].name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
