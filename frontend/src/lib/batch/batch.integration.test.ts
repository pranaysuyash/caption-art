/**
 * Batch Processing Integration Tests
 * 
 * End-to-end tests for the complete batch processing workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchManager } from './batchManager';
import { BatchStyler } from './batchStyler';
import { BatchExporter, ImageProcessor } from './batchExporter';
import { ProgressTracker } from './progressTracker';
import { BatchImage, BatchStyle } from './types';

describe('Batch Processing Integration', () => {
  let batchManager: BatchManager;
  let batchStyler: BatchStyler;

  beforeEach(() => {
    batchManager = new BatchManager();
    batchStyler = new BatchStyler();
  });

  /**
   * Integration Test: Complete batch processing workflow
   * Tests Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.5, 6.1-6.5
   */
  it('should handle complete batch processing workflow', async () => {
    // Step 1: Upload multiple images (Requirement 1.1, 1.2)
    const files = Array.from({ length: 5 }, (_, i) => {
      const blob = new Blob(['image data'], { type: 'image/jpeg' });
      return new File([blob], `image-${i}.jpg`, { type: 'image/jpeg' });
    });

    const addedImages = await batchManager.addFiles(files);
    expect(addedImages).toHaveLength(5);
    expect(batchManager.getBatchSize()).toBe(5);

    // Step 2: Generate summary (Requirement 1.5)
    const summary = batchManager.generateSummary();
    expect(summary.total).toBe(5);
    expect(summary.successful).toBe(5);
    expect(summary.failed).toBe(0);

    // Step 3: Apply shared caption (Requirement 2.1, 2.2)
    const caption = 'Test Caption';
    let styledImages = batchStyler.applyCaption(addedImages, caption);
    expect(styledImages.every(img => img.caption === caption)).toBe(true);

    // Step 4: Apply shared style (Requirement 3.1, 3.2, 3.3)
    const style: BatchStyle = {
      preset: 'neon',
      fontSize: 24,
    };
    styledImages = batchStyler.applyStyle(styledImages, style);
    expect(styledImages.every(img => 
      img.style?.preset === 'neon' && img.style?.fontSize === 24
    )).toBe(true);

    // Step 5: Customize one image (Requirement 2.3, 3.4)
    batchStyler.setPerImageCustomization(true);
    const customCaption = 'Custom Caption';
    styledImages = batchStyler.updateImageCaption(
      styledImages,
      styledImages[0].id,
      customCaption
    );
    expect(styledImages[0].caption).toBe(customCaption);
    expect(styledImages[1].caption).toBe(caption);

    // Step 6: Remove one image (Requirement 7.1, 7.2, 7.3)
    const imageToRemove = styledImages[2].id;
    const removed = batchManager.removeImage(imageToRemove);
    expect(removed).toBe(true);
    expect(batchManager.getBatchSize()).toBe(4);

    // Step 7: Export batch with progress tracking (Requirements 5.1-5.5, 6.1-6.5)
    const progressUpdates: any[] = [];
    const progressTracker = new ProgressTracker({
      total: 4,
      onProgress: (state) => {
        progressUpdates.push({ ...state });
      },
    });

    progressTracker.start();

    // Mock processor
    const processor: ImageProcessor = vi.fn(async (image: BatchImage) => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      return canvas;
    });

    // Mock downloadZip
    const downloadZipSpy = vi.spyOn(BatchExporter as any, 'downloadZip')
      .mockResolvedValue(undefined);

    try {
      const remainingImages = batchManager.getImages();
      const result = await BatchExporter.exportBatch(
        remainingImages,
        processor,
        { format: 'png' },
        (progress) => {
          progressTracker.updateCurrent(progress.currentFilename || '');
          if (progress.successful > progressTracker.getState().successful) {
            progressTracker.markSuccess();
          }
          if (progress.failed > progressTracker.getState().failed) {
            progressTracker.markFailure();
          }
        }
      );

      // Verify export results (Requirement 5.1, 5.4)
      expect(result.total).toBe(4);
      expect(result.successful).toBe(4);
      expect(result.failed).toBe(0);

      // Verify progress tracking (Requirement 6.1, 6.2, 6.5)
      expect(progressUpdates.length).toBeGreaterThan(0);
      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.percentage).toBeGreaterThan(0);

      // Verify all images were processed
      expect(processor).toHaveBeenCalledTimes(4);
    } finally {
      downloadZipSpy.mockRestore();
    }
  });

  /**
   * Integration Test: Batch processing with failures
   * Tests Requirements: 1.4, 5.3, 8.2, 8.3
   */
  it('should handle failures gracefully and continue processing', async () => {
    // Upload images
    const files = Array.from({ length: 5 }, (_, i) => {
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      return new File([blob], `image-${i}.jpg`, { type: 'image/jpeg' });
    });

    const addedImages = await batchManager.addFiles(files);

    // Create processor that fails for specific images
    const processor: ImageProcessor = vi.fn(async (image: BatchImage) => {
      const index = parseInt(image.file.name.split('-')[1].split('.')[0]);
      
      // Fail images 1 and 3
      if (index === 1 || index === 3) {
        throw new Error(`Failed to process ${image.file.name}`);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
      return canvas;
    });

    const downloadZipSpy = vi.spyOn(BatchExporter as any, 'downloadZip')
      .mockResolvedValue(undefined);

    try {
      const result = await BatchExporter.exportBatch(
        addedImages,
        processor,
        { format: 'jpeg' }
      );

      // Verify processing independence (Requirement 1.4, 5.3)
      expect(result.total).toBe(5);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(2);

      // Verify failed images are tracked (Requirement 8.3)
      expect(result.failedImages).toHaveLength(2);
      expect(result.failedImages.map(f => f.filename).sort()).toEqual([
        'image-1.jpg',
        'image-3.jpg',
      ]);

      // Verify all images were attempted
      expect(processor).toHaveBeenCalledTimes(5);
    } finally {
      downloadZipSpy.mockRestore();
    }
  });

  /**
   * Integration Test: Batch size limit enforcement
   * Tests Requirement: 1.1
   */
  it('should enforce 50 image limit across workflow', async () => {
    // Try to upload 60 images
    const files = Array.from({ length: 60 }, (_, i) => {
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      return new File([blob], `image-${i}.jpg`, { type: 'image/jpeg' });
    });

    const addedImages = await batchManager.addFiles(files);

    // Should only accept 50
    expect(addedImages).toHaveLength(50);
    expect(batchManager.getBatchSize()).toBe(50);
    expect(batchManager.isFull()).toBe(true);

    // Apply styling to all 50
    const style: BatchStyle = { preset: 'magazine', fontSize: 18 };
    const styledImages = batchStyler.applyStyle(addedImages, style);
    expect(styledImages).toHaveLength(50);

    // Verify all have the style
    expect(styledImages.every(img => 
      img.style?.preset === 'magazine' && img.style?.fontSize === 18
    )).toBe(true);
  });

  /**
   * Integration Test: Cancel and resume workflow
   * Tests Requirements: 8.1, 8.2, 8.4
   */
  it('should support cancellation and resumption', async () => {
    // Upload images
    const files = Array.from({ length: 10 }, (_, i) => {
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      return new File([blob], `image-${i}.jpg`, { type: 'image/jpeg' });
    });

    const addedImages = await batchManager.addFiles(files);

    // Create processor
    let processedCount = 0;
    const processor: ImageProcessor = vi.fn(async () => {
      processedCount++;
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      return canvas;
    });

    const downloadZipSpy = vi.spyOn(BatchExporter as any, 'downloadZip')
      .mockResolvedValue(undefined);

    try {
      // Import CancellationToken
      const { CancellationToken } = await import('./batchExporter');
      const cancellationToken = new CancellationToken();

      // Cancel after 5 images
      const onProgress = vi.fn((progress) => {
        if (progress.currentIndex === 5) {
          cancellationToken.cancel();
        }
      });

      // First export (will be cancelled)
      const result1 = await BatchExporter.exportBatch(
        addedImages,
        processor,
        { format: 'png' },
        onProgress,
        cancellationToken
      );

      // Verify cancellation (Requirement 8.1, 8.2)
      expect(result1.successful).toBeLessThan(10);
      expect(result1.successful).toBeGreaterThan(0);

      // Mark processed images as complete
      const processedImages = addedImages.map((img, i) => ({
        ...img,
        status: i < result1.successful ? ('complete' as const) : ('valid' as const),
      }));

      // Get unprocessed images for resume (Requirement 8.4)
      const unprocessed = BatchExporter.getUnprocessedImages(processedImages);
      expect(unprocessed.length).toBeGreaterThan(0);
      expect(unprocessed.length).toBeLessThan(10);

      // Resume processing
      const result2 = await BatchExporter.exportBatch(
        unprocessed,
        processor,
        { format: 'png' }
      );

      // Verify resume completed remaining images
      expect(result2.successful).toBe(unprocessed.length);
      expect(result1.successful + result2.successful).toBeLessThanOrEqual(10);
    } finally {
      downloadZipSpy.mockRestore();
    }
  });

  /**
   * Integration Test: Empty batch handling
   * Tests Requirement: 7.4
   */
  it('should exit batch mode when all images are removed', async () => {
    // Upload images
    const files = Array.from({ length: 3 }, (_, i) => {
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      return new File([blob], `image-${i}.jpg`, { type: 'image/jpeg' });
    });

    const addedImages = await batchManager.addFiles(files);
    expect(batchManager.isEmpty()).toBe(false);

    // Remove all images
    for (const image of addedImages) {
      batchManager.removeImage(image.id);
    }

    // Should be empty (Requirement 7.4)
    expect(batchManager.isEmpty()).toBe(true);
    expect(batchManager.getBatchSize()).toBe(0);
  });

  /**
   * Integration Test: Progress monotonicity throughout workflow
   * Tests Requirement: 6.1, 6.2
   */
  it('should maintain monotonic progress throughout processing', async () => {
    // Upload images
    const files = Array.from({ length: 10 }, (_, i) => {
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      return new File([blob], `image-${i}.jpg`, { type: 'image/jpeg' });
    });

    const addedImages = await batchManager.addFiles(files);

    // Track progress
    const progressValues: number[] = [];
    const progressTracker = new ProgressTracker({
      total: 10,
      onProgress: (state) => {
        progressValues.push(state.percentage);
      },
    });

    progressTracker.start();

    // Simulate processing
    for (let i = 0; i < 10; i++) {
      progressTracker.updateCurrent(`image-${i}.jpg`);
      progressTracker.markSuccess();
    }

    progressTracker.complete();

    // Verify monotonicity (Requirement 6.1, 6.2)
    for (let i = 1; i < progressValues.length; i++) {
      expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
    }

    // Verify final progress is 100%
    expect(progressValues[progressValues.length - 1]).toBe(100);
  });

  /**
   * Integration Test: Style consistency across batch
   * Tests Requirements: 3.1, 3.2, 3.3
   */
  it('should maintain style consistency across all images', async () => {
    // Upload images
    const files = Array.from({ length: 8 }, (_, i) => {
      const blob = new Blob(['data'], { type: 'image/jpeg' });
      return new File([blob], `image-${i}.jpg`, { type: 'image/jpeg' });
    });

    const addedImages = await batchManager.addFiles(files);

    // Apply multiple style changes
    let styledImages = addedImages;

    // Apply caption
    styledImages = batchStyler.applyCaption(styledImages, 'Caption 1');
    expect(styledImages.every(img => img.caption === 'Caption 1')).toBe(true);

    // Change caption
    styledImages = batchStyler.applyCaption(styledImages, 'Caption 2');
    expect(styledImages.every(img => img.caption === 'Caption 2')).toBe(true);

    // Apply style
    const style1: BatchStyle = { preset: 'neon', fontSize: 20 };
    styledImages = batchStyler.applyStyle(styledImages, style1);
    expect(styledImages.every(img => 
      img.style?.preset === 'neon' && img.style?.fontSize === 20
    )).toBe(true);

    // Change style
    const style2: BatchStyle = { preset: 'brush', fontSize: 32 };
    styledImages = batchStyler.applyStyle(styledImages, style2);
    expect(styledImages.every(img => 
      img.style?.preset === 'brush' && img.style?.fontSize === 32
    )).toBe(true);

    // Apply transform
    const transform = { x: 0.5, y: 0.5, scale: 1.5, rotation: 45 };
    styledImages = batchStyler.applyTransform(styledImages, transform);
    expect(styledImages.every(img =>
      img.transform?.x === 0.5 &&
      img.transform?.y === 0.5 &&
      img.transform?.scale === 1.5 &&
      img.transform?.rotation === 45
    )).toBe(true);
  });
});
