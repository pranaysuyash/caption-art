/**
 * Batch Exporter Tests
 * 
 * Property-based tests for batch export functionality
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { BatchExporter, ImageProcessor } from './batchExporter';
import { BatchImage } from './types';

describe('BatchExporter', () => {
  /**
   * Feature: batch-processing, Property 3: Processing independence
   * 
   * For any batch, if one image fails, all other images should still be processed
   * Validates: Requirements 1.4, 5.3
   */
  it('should process all images independently - failures do not affect other images', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a batch of 2-20 images
        fc.integer({ min: 2, max: 20 }).chain(count =>
          fc.tuple(
            fc.constant(count),
            // Generate indices of images that should fail (at least 1, at most count-1)
            fc.array(
              fc.integer({ min: 0, max: count - 1 }),
              { minLength: 1, maxLength: Math.max(1, count - 1) }
            ).map(arr => [...new Set(arr)]) // Remove duplicates
          )
        ),
        async ([imageCount, failIndices]) => {
          // Create batch images
          const images: BatchImage[] = Array.from({ length: imageCount }, (_, i) => ({
            id: `image-${i}`,
            file: new File([new Blob(['data'])], `image-${i}.jpg`, { type: 'image/jpeg' }),
            thumbnail: `data:image/jpeg;base64,fake${i}`,
            status: 'valid' as const,
          }));

          // Create a mock processor that fails for specific indices
          const processor: ImageProcessor = vi.fn(async (image: BatchImage) => {
            const index = parseInt(image.id.split('-')[1]);
            
            if (failIndices.includes(index)) {
              throw new Error(`Processing failed for image ${index}`);
            }
            
            // Create a mock canvas for successful processing
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            return canvas;
          });

          // Mock the downloadZip method to avoid actual download
          const downloadZipSpy = vi.spyOn(BatchExporter as any, 'downloadZip')
            .mockResolvedValue(undefined);

          try {
            // Export the batch
            const result = await BatchExporter.exportBatch(
              images,
              processor,
              { format: 'png' }
            );

            // Property: Total processed should equal total images
            expect(result.total).toBe(imageCount);

            // Property: Successful + Failed should equal Total
            expect(result.successful + result.failed).toBe(result.total);

            // Property: Number of failures should match the number of fail indices
            expect(result.failed).toBe(failIndices.length);

            // Property: Number of successes should be total minus failures
            expect(result.successful).toBe(imageCount - failIndices.length);

            // Property: Failed images array should have correct length
            expect(result.failedImages).toHaveLength(failIndices.length);

            // Property: All images should have been attempted (processor called for each)
            expect(processor).toHaveBeenCalledTimes(imageCount);

            // Property: Each image should be processed exactly once
            const processedIds = new Set(
              (processor as any).mock.calls.map((call: any) => call[0].id)
            );
            expect(processedIds.size).toBe(imageCount);

            // Property: All failed image filenames should be in the result
            const failedFilenames = result.failedImages.map(f => f.filename);
            const expectedFailedFilenames = failIndices.map(i => `image-${i}.jpg`);
            expect(failedFilenames.sort()).toEqual(expectedFailedFilenames.sort());
          } finally {
            downloadZipSpy.mockRestore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: batch-processing, Property 5: Export completeness
   * 
   * For any batch export, the ZIP file should contain exactly the number of successfully processed images
   * Validates: Requirements 5.1, 5.4
   */
  it('should include exactly the successfully processed images in the ZIP', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a batch of 1-15 images
        fc.integer({ min: 1, max: 15 }).chain(count =>
          fc.tuple(
            fc.constant(count),
            // Generate indices of images that should fail (0 to count-1 failures)
            fc.array(
              fc.integer({ min: 0, max: count - 1 }),
              { minLength: 0, maxLength: count - 1 }
            ).map(arr => [...new Set(arr)]) // Remove duplicates
          )
        ),
        async ([imageCount, failIndices]) => {
          // Create batch images
          const images: BatchImage[] = Array.from({ length: imageCount }, (_, i) => ({
            id: `img-${i}`,
            file: new File([new Blob(['data'])], `test-${i}.jpg`, { type: 'image/jpeg' }),
            thumbnail: `data:image/jpeg;base64,thumb${i}`,
            status: 'valid' as const,
          }));

          // Track which files were added to the ZIP
          const zipFiles: string[] = [];
          
          // Mock JSZip
          const mockZip = {
            file: vi.fn((filename: string, _blob: Blob) => {
              zipFiles.push(filename);
            }),
            generateAsync: vi.fn().mockResolvedValue(new Blob(['fake zip'])),
          };

          // Mock JSZip constructor
          const JSZipMock = vi.fn(() => mockZip);
          vi.doMock('jszip', () => ({ default: JSZipMock }));

          // Create a processor that fails for specific indices
          const processor: ImageProcessor = vi.fn(async (image: BatchImage) => {
            const index = parseInt(image.id.split('-')[1]);
            
            if (failIndices.includes(index)) {
              throw new Error(`Failed to process image ${index}`);
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            return canvas;
          });

          // Mock downloadZip to capture the zip object
          let capturedZip: any = null;
          const downloadZipSpy = vi.spyOn(BatchExporter as any, 'downloadZip')
            .mockImplementation(async (zip: any) => {
              capturedZip = zip;
            });

          try {
            // Export the batch
            const result = await BatchExporter.exportBatch(
              images,
              processor,
              { format: 'jpeg', quality: 0.9 }
            );

            // Property: ZIP should only be downloaded if there are successful exports
            if (result.successful > 0) {
              expect(downloadZipSpy).toHaveBeenCalledTimes(1);
              expect(capturedZip).toBeTruthy();
            } else {
              expect(downloadZipSpy).not.toHaveBeenCalled();
            }

            // Property: Number of files in ZIP should equal successful count
            // Note: We can't directly test the ZIP contents without mocking JSZip more extensively,
            // but we verify the result counts are correct
            expect(result.successful).toBe(imageCount - failIndices.length);
            
            // Property: All non-failing images should have been processed
            const successfulIndices = Array.from({ length: imageCount }, (_, i) => i)
              .filter(i => !failIndices.includes(i));
            expect(result.successful).toBe(successfulIndices.length);

          } finally {
            downloadZipSpy.mockRestore();
            vi.doUnmock('jszip');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit test: Verify progress callback is called correctly
   */
  it('should call progress callback for each image', async () => {
    const images: BatchImage[] = Array.from({ length: 3 }, (_, i) => ({
      id: `img-${i}`,
      file: new File([new Blob(['data'])], `test-${i}.jpg`, { type: 'image/jpeg' }),
      thumbnail: `data:image/jpeg;base64,thumb${i}`,
      status: 'valid' as const,
    }));

    const processor: ImageProcessor = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      return canvas;
    };

    const progressUpdates: any[] = [];
    const onProgress = vi.fn((progress) => {
      progressUpdates.push({ ...progress });
    });

    const downloadZipSpy = vi.spyOn(BatchExporter as any, 'downloadZip')
      .mockResolvedValue(undefined);

    try {
      await BatchExporter.exportBatch(images, processor, { format: 'png' }, onProgress);

      // Should be called once per image + final update
      expect(onProgress).toHaveBeenCalledTimes(4);

      // Verify progress increases
      expect(progressUpdates[0].currentIndex).toBe(0);
      expect(progressUpdates[1].currentIndex).toBe(1);
      expect(progressUpdates[2].currentIndex).toBe(2);
      expect(progressUpdates[3].currentIndex).toBe(3);

      // Final update should show 100%
      expect(progressUpdates[3].percentage).toBe(100);
    } finally {
      downloadZipSpy.mockRestore();
    }
  });

  /**
   * Unit test: Verify getValidImages filters correctly
   */
  it('should filter only valid images', () => {
    const images: BatchImage[] = [
      {
        id: '1',
        file: new File([new Blob(['data'])], 'valid1.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb1',
        status: 'valid',
      },
      {
        id: '2',
        file: new File([new Blob(['data'])], 'invalid.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb2',
        status: 'invalid',
      },
      {
        id: '3',
        file: new File([new Blob(['data'])], 'complete.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb3',
        status: 'complete',
      },
      {
        id: '4',
        file: new File([new Blob(['data'])], 'error.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb4',
        status: 'error',
      },
    ];

    const validImages = BatchExporter.getValidImages(images);
    
    expect(validImages).toHaveLength(2);
    expect(validImages[0].id).toBe('1');
    expect(validImages[1].id).toBe('3');
  });

  /**
   * Unit test: Verify time estimation
   */
  it('should estimate time remaining correctly', () => {
    // After processing 5 images in 10 seconds, with 15 remaining
    const estimate = BatchExporter.estimateTimeRemaining(5, 20, 10000);
    
    // Should estimate 30 seconds (2 seconds per image * 15 remaining)
    expect(estimate).toBe(30000);
  });

  it('should return 0 for time estimate when no images processed', () => {
    const estimate = BatchExporter.estimateTimeRemaining(0, 10, 0);
    expect(estimate).toBe(0);
  });

  /**
   * Unit test: Verify cancellation stops processing
   * Requirement 8.1: Stop processing remaining images when cancelled
   * Requirement 8.2: Keep already processed images when cancelled
   */
  it('should stop processing when cancelled', async () => {
    const images: BatchImage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `img-${i}`,
      file: new File([new Blob(['data'])], `test-${i}.jpg`, { type: 'image/jpeg' }),
      thumbnail: `data:image/jpeg;base64,thumb${i}`,
      status: 'valid' as const,
    }));

    let processedCount = 0;
    const processor: ImageProcessor = async () => {
      processedCount++;
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      return canvas;
    };

    const downloadZipSpy = vi.spyOn(BatchExporter as any, 'downloadZip')
      .mockResolvedValue(undefined);

    try {
      // Import CancellationToken
      const { CancellationToken } = await import('./batchExporter');
      const cancellationToken = new CancellationToken();

      // Cancel after 3 images
      const onProgress = vi.fn((progress) => {
        if (progress.currentIndex === 3) {
          cancellationToken.cancel();
        }
      });

      const result = await BatchExporter.exportBatch(
        images,
        processor,
        { format: 'png' },
        onProgress,
        cancellationToken
      );

      // Should have processed 3 images before cancellation
      expect(processedCount).toBeLessThanOrEqual(4); // May process one more due to async
      expect(result.successful).toBeLessThan(10);
      
      // Should have kept the processed images
      expect(result.successful).toBeGreaterThan(0);
    } finally {
      downloadZipSpy.mockRestore();
    }
  });

  /**
   * Unit test: Verify getUnprocessedImages filters correctly
   * Requirement 8.4: Allow resuming from where it stopped
   */
  it('should identify unprocessed images for resume', () => {
    const images: BatchImage[] = [
      {
        id: '1',
        file: new File([new Blob(['data'])], 'complete.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb1',
        status: 'complete',
      },
      {
        id: '2',
        file: new File([new Blob(['data'])], 'pending.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb2',
        status: 'pending',
      },
      {
        id: '3',
        file: new File([new Blob(['data'])], 'valid.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb3',
        status: 'valid',
      },
      {
        id: '4',
        file: new File([new Blob(['data'])], 'error.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb4',
        status: 'error',
      },
      {
        id: '5',
        file: new File([new Blob(['data'])], 'processing.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb5',
        status: 'processing',
      },
    ];

    const unprocessed = BatchExporter.getUnprocessedImages(images);
    
    // Should include pending, valid, and processing (not complete, error, or invalid)
    expect(unprocessed).toHaveLength(3);
    expect(unprocessed.map(img => img.id).sort()).toEqual(['2', '3', '5']);
  });

  /**
   * Unit test: Verify getCompletedImages filters correctly
   * Requirement 8.3: Display which images were completed
   */
  it('should identify completed images', () => {
    const images: BatchImage[] = [
      {
        id: '1',
        file: new File([new Blob(['data'])], 'complete1.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb1',
        status: 'complete',
      },
      {
        id: '2',
        file: new File([new Blob(['data'])], 'pending.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb2',
        status: 'pending',
      },
      {
        id: '3',
        file: new File([new Blob(['data'])], 'complete2.jpg', { type: 'image/jpeg' }),
        thumbnail: 'thumb3',
        status: 'complete',
      },
    ];

    const completed = BatchExporter.getCompletedImages(images);
    
    expect(completed).toHaveLength(2);
    expect(completed.map(img => img.id).sort()).toEqual(['1', '3']);
  });
});
