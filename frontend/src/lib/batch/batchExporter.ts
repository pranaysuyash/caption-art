/**
 * Batch Exporter
 * 
 * Processes multiple images sequentially, shows progress for each,
 * continues on failures, and creates a ZIP file for download.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import JSZip from 'jszip';
import { BatchImage } from './types';

export interface BatchExportOptions {
  /** Image format ('png' or 'jpeg') */
  format: 'png' | 'jpeg';
  /** Quality parameter for JPEG (0-1, default: 0.92) */
  quality?: number;
  /** Whether to apply watermark (for free tier) */
  watermark?: boolean;
  /** Watermark text to display */
  watermarkText?: string;
}

export interface BatchExportProgress {
  /** Current image being processed (0-based index) */
  currentIndex: number;
  /** Total number of images to process */
  total: number;
  /** Number of successfully processed images */
  successful: number;
  /** Number of failed images */
  failed: number;
  /** Current image filename */
  currentFilename: string;
  /** Progress percentage (0-100) */
  percentage: number;
}

export interface BatchExportResult {
  /** Total number of images processed */
  total: number;
  /** Number of successfully exported images */
  successful: number;
  /** Number of failed exports */
  failed: number;
  /** Details of failed exports */
  failedImages: Array<{
    filename: string;
    error: string;
  }>;
}

/**
 * Callback function for progress updates
 */
export type ProgressCallback = (progress: BatchExportProgress) => void;

/**
 * Callback function for processing individual images
 * Should return a canvas element with the processed image
 */
export type ImageProcessor = (image: BatchImage) => Promise<HTMLCanvasElement>;

/**
 * Cancellation token for batch export operations
 */
export class CancellationToken {
  private _cancelled = false;

  /**
   * Cancels the operation
   */
  cancel(): void {
    this._cancelled = true;
  }

  /**
   * Checks if the operation has been cancelled
   */
  isCancelled(): boolean {
    return this._cancelled;
  }

  /**
   * Resets the cancellation state
   */
  reset(): void {
    this._cancelled = false;
  }
}

export class BatchExporter {
  /**
   * Exports multiple images as a ZIP file
   * Requirement 5.1: Process all images sequentially
   * Requirement 5.2: Display progress for each image
   * Requirement 5.3: Continue with remaining images if an export fails
   * Requirement 5.4: Download all images as a ZIP file
   * Requirement 5.5: Use the same format and quality for all images
   * Requirement 8.1: Stop processing remaining images when cancelled
   * Requirement 8.2: Keep already processed images when cancelled
   * Requirement 8.3: Display which images were completed
   * Requirement 8.5: Clean up any partial processing
   * 
   * @param images - Array of batch images to export
   * @param processor - Function to process each image into a canvas
   * @param options - Export options
   * @param onProgress - Optional callback for progress updates
   * @param cancellationToken - Optional token to cancel the operation
   * @returns Promise resolving to export result
   */
  static async exportBatch(
    images: BatchImage[],
    processor: ImageProcessor,
    options: BatchExportOptions,
    onProgress?: ProgressCallback,
    cancellationToken?: CancellationToken
  ): Promise<BatchExportResult> {
    const zip = new JSZip();
    const result: BatchExportResult = {
      total: images.length,
      successful: 0,
      failed: 0,
      failedImages: [],
    };

    // Requirement 5.1: Process all images sequentially
    for (let i = 0; i < images.length; i++) {
      // Requirement 8.1: Stop processing remaining images when cancelled
      if (cancellationToken?.isCancelled()) {
        break;
      }

      const image = images[i];
      
      // Requirement 5.2: Display progress for each image
      if (onProgress) {
        onProgress({
          currentIndex: i,
          total: images.length,
          successful: result.successful,
          failed: result.failed,
          currentFilename: image.file.name,
          percentage: Math.round((i / images.length) * 100),
        });
      }

      try {
        // Process the image
        const canvas = await processor(image);
        
        // Requirement 8.1: Check for cancellation after async operation
        if (cancellationToken?.isCancelled()) {
          // Requirement 8.5: Clean up partial processing
          break;
        }
        
        // Convert canvas to blob
        const blob = await this.canvasToBlob(canvas, options);
        
        // Generate filename
        const filename = this.generateFilename(image.file.name, options.format);
        
        // Add to ZIP
        zip.file(filename, blob);
        
        result.successful++;
      } catch (error) {
        // Requirement 5.3: Continue with remaining images if an export fails
        result.failed++;
        result.failedImages.push({
          filename: image.file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Final progress update
    if (onProgress) {
      const currentIndex = cancellationToken?.isCancelled() 
        ? result.successful + result.failed 
        : images.length;
      
      onProgress({
        currentIndex,
        total: images.length,
        successful: result.successful,
        failed: result.failed,
        currentFilename: '',
        percentage: Math.round((currentIndex / images.length) * 100),
      });
    }

    // Requirement 5.4: Download all images as a ZIP file
    // Requirement 8.2: Keep already processed images when cancelled
    if (result.successful > 0) {
      await this.downloadZip(zip);
    }

    return result;
  }

  /**
   * Converts a canvas to a blob
   * Requirement 5.5: Use the same format and quality for all images
   * 
   * @param canvas - Canvas to convert
   * @param options - Export options
   * @returns Promise resolving to blob
   */
  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    options: BatchExportOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const quality = options.format === 'jpeg' ? (options.quality || 0.92) : undefined;
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generates a filename for an exported image
   * 
   * @param originalFilename - Original filename
   * @param format - Export format
   * @returns Generated filename
   */
  private static generateFilename(originalFilename: string, format: string): string {
    // Remove extension from original filename
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
    
    // Add timestamp and new extension
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${nameWithoutExt}-${timestamp}.${format}`;
  }

  /**
   * Downloads a ZIP file
   * 
   * @param zip - JSZip instance
   */
  private static async downloadZip(zip: JSZip): Promise<void> {
    try {
      // Generate ZIP file
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch-export-${Date.now()}.zip`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download ZIP:', error);
      throw new Error('Failed to download ZIP file');
    }
  }

  /**
   * Gets only valid images from a batch
   * 
   * @param images - Array of batch images
   * @returns Array of valid images
   */
  static getValidImages(images: BatchImage[]): BatchImage[] {
    return images.filter(img => img.status === 'valid' || img.status === 'complete');
  }

  /**
   * Gets images that have not been processed yet
   * Requirement 8.4: Allow resuming from where it stopped
   * 
   * @param images - Array of batch images
   * @returns Array of unprocessed images
   */
  static getUnprocessedImages(images: BatchImage[]): BatchImage[] {
    return images.filter(img => 
      img.status !== 'complete' && 
      img.status !== 'error' &&
      img.status !== 'invalid'
    );
  }

  /**
   * Gets images that have been successfully processed
   * Requirement 8.3: Display which images were completed
   * 
   * @param images - Array of batch images
   * @returns Array of completed images
   */
  static getCompletedImages(images: BatchImage[]): BatchImage[] {
    return images.filter(img => img.status === 'complete');
  }

  /**
   * Estimates the time remaining for batch export
   * 
   * @param currentIndex - Current image index
   * @param total - Total number of images
   * @param elapsedMs - Elapsed time in milliseconds
   * @returns Estimated time remaining in milliseconds
   */
  static estimateTimeRemaining(
    currentIndex: number,
    total: number,
    elapsedMs: number
  ): number {
    if (currentIndex === 0) return 0;
    
    const avgTimePerImage = elapsedMs / currentIndex;
    const remainingImages = total - currentIndex;
    return Math.round(avgTimePerImage * remainingImages);
  }
}
