/**
 * Batch Manager Tests
 * 
 * Property-based tests for batch processing functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { BatchManager } from './batchManager';

describe('BatchManager', () => {
  let batchManager: BatchManager;

  beforeEach(() => {
    batchManager = new BatchManager();
  });

  /**
   * Feature: batch-processing, Property 1: Batch size limit
   * 
   * For any batch upload, the system should accept at most 50 images
   * Validates: Requirements 1.1
   */
  it('should accept at most 50 images regardless of input size', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arrays of 1 to 100 files
        fc.integer({ min: 1, max: 100 }).chain(count =>
          fc.tuple(
            fc.constant(count),
            fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                type: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
                size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
              }),
              { minLength: count, maxLength: count }
            )
          )
        ),
        async ([count, fileData]) => {
          // Create a fresh BatchManager for each test run
          const manager = new BatchManager();
          
          // Create File objects from the generated data
          const files = fileData.map((data, index) => {
            // Ensure filename has proper extension
            const filename = `${data.name.trim() || 'file' + index}.jpg`;
            const blob = new Blob(['fake image data'], { type: data.type });
            return new File([blob], filename, { type: data.type });
          });

          // Add files to batch
          const addedImages = await manager.addFiles(files);

          // Property: batch size should never exceed 50
          const batchSize = manager.getBatchSize();
          expect(batchSize).toBeLessThanOrEqual(50);

          // Property: number of added images should be min(input count, 50)
          const expectedCount = Math.min(count, 50);
          expect(addedImages.length).toBe(expectedCount);
          expect(batchSize).toBe(expectedCount);

          // Property: if input > 50, batch should be full
          if (count > 50) {
            expect(manager.isFull()).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Multiple addFiles calls should respect the 50 limit
   */
  it('should respect 50 image limit across multiple addFiles calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 2-5 batches of files
        fc.array(
          fc.integer({ min: 1, max: 30 }),
          { minLength: 2, maxLength: 5 }
        ),
        async (batchSizes) => {
          const manager = new BatchManager();
          let totalAdded = 0;

          for (const size of batchSizes) {
            const files = Array.from({ length: size }, (_, i) => {
              const blob = new Blob(['data'], { type: 'image/jpeg' });
              return new File([blob], `file${i}.jpg`, { type: 'image/jpeg' });
            });

            const added = await manager.addFiles(files);
            totalAdded += added.length;

            // Property: total should never exceed 50
            expect(manager.getBatchSize()).toBeLessThanOrEqual(50);
            expect(totalAdded).toBeLessThanOrEqual(50);

            // Property: once at 50, no more files should be added
            if (manager.getBatchSize() === 50) {
              expect(manager.isFull()).toBe(true);
              expect(added.length).toBeLessThanOrEqual(size);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit test: Verify basic functionality
   */
  it('should handle empty file array', async () => {
    const result = await batchManager.addFiles([]);
    expect(result).toEqual([]);
    expect(batchManager.getBatchSize()).toBe(0);
  });

  /**
   * Unit test: Verify summary generation
   */
  it('should generate correct summary', async () => {
    // Create mix of valid and invalid files
    const validFile = new File(
      [new Blob(['data'], { type: 'image/jpeg' })],
      'valid.jpg',
      { type: 'image/jpeg' }
    );
    
    const invalidFile = new File(
      [new Blob(['data'], { type: 'text/plain' })],
      'invalid.txt',
      { type: 'text/plain' }
    );

    await batchManager.addFiles([validFile, invalidFile]);
    const summary = batchManager.generateSummary();

    expect(summary.total).toBe(2);
    expect(summary.successful).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.failedImages).toHaveLength(1);
    expect(summary.failedImages[0].filename).toBe('invalid.txt');
  });

  /**
   * Unit test: Verify remove functionality
   */
  it('should remove images by id', async () => {
    const file = new File(
      [new Blob(['data'], { type: 'image/jpeg' })],
      'test.jpg',
      { type: 'image/jpeg' }
    );

    const added = await batchManager.addFiles([file]);
    const imageId = added[0].id;

    expect(batchManager.getBatchSize()).toBe(1);
    
    const removed = batchManager.removeImage(imageId);
    expect(removed).toBe(true);
    expect(batchManager.getBatchSize()).toBe(0);
  });

  /**
   * Unit test: Verify clear functionality
   */
  it('should clear all images', async () => {
    const files = Array.from({ length: 5 }, (_, i) => {
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      return new File([blob], `file${i}.jpg`, { type: 'image/jpeg' });
    });

    await batchManager.addFiles(files);
    expect(batchManager.getBatchSize()).toBe(5);

    batchManager.clear();
    expect(batchManager.getBatchSize()).toBe(0);
    expect(batchManager.getImages()).toEqual([]);
  });

  /**
   * Unit test: Verify isEmpty functionality
   * Requirement 7.4: Exit batch mode when all images are removed
   */
  it('should correctly report when batch is empty', async () => {
    // Initially empty
    expect(batchManager.isEmpty()).toBe(true);

    // Add files
    const files = Array.from({ length: 3 }, (_, i) => {
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      return new File([blob], `file${i}.jpg`, { type: 'image/jpeg' });
    });

    const added = await batchManager.addFiles(files);
    expect(batchManager.isEmpty()).toBe(false);

    // Remove all files one by one
    for (const image of added) {
      batchManager.removeImage(image.id);
    }

    // Should be empty again
    expect(batchManager.isEmpty()).toBe(true);
  });

  /**
   * Unit test: Verify remove doesn't affect other images
   * Requirement 7.3: Not affect other images in the batch
   */
  it('should not affect other images when removing one', async () => {
    const files = Array.from({ length: 5 }, (_, i) => {
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      return new File([blob], `file${i}.jpg`, { type: 'image/jpeg' });
    });

    const added = await batchManager.addFiles(files);
    const initialImages = batchManager.getImages();
    
    // Remove the middle image
    const middleId = added[2].id;
    batchManager.removeImage(middleId);

    const remainingImages = batchManager.getImages();
    
    // Should have 4 images left
    expect(remainingImages.length).toBe(4);
    
    // Other images should still be present
    expect(remainingImages.find(img => img.id === added[0].id)).toBeDefined();
    expect(remainingImages.find(img => img.id === added[1].id)).toBeDefined();
    expect(remainingImages.find(img => img.id === added[3].id)).toBeDefined();
    expect(remainingImages.find(img => img.id === added[4].id)).toBeDefined();
    
    // Removed image should not be present
    expect(remainingImages.find(img => img.id === middleId)).toBeUndefined();
  });
});
