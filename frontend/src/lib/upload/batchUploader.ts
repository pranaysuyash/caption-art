/**
 * Batch Uploader
 * 
 * Handles processing multiple files with validation, optimization, and error handling.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { FileValidator } from './fileValidator';
import { ImageOptimizer } from './imageOptimizer';
import { readEXIF, correctOrientation } from './exifProcessor';
import type { ValidationResult, OptimizationResult } from './types';

const MAX_BATCH_SIZE = 10;

export interface BatchFileResult {
  file: File;
  success: boolean;
  error?: string;
  validationResult?: ValidationResult;
  optimizationResult?: OptimizationResult;
  processedBlob?: Blob;
}

export interface BatchProcessResult {
  results: BatchFileResult[];
  successCount: number;
  failureCount: number;
  totalProcessed: number;
}

export interface BatchProgressCallback {
  (fileIndex: number, totalFiles: number, status: string): void;
}

export class BatchUploader {
  /**
   * Process multiple files with validation and optimization
   * @param files - Array of files to process (max 10)
   * @param onProgress - Optional callback for progress updates
   * @returns BatchProcessResult with summary of all operations
   */
  static async processFiles(
    files: File[],
    onProgress?: BatchProgressCallback
  ): Promise<BatchProcessResult> {
    // Enforce maximum batch size - Requirement 8.4
    if (files.length > MAX_BATCH_SIZE) {
      throw new Error('Too many files. Maximum 10 files per upload.');
    }

    const results: BatchFileResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onProgress) {
        onProgress(i, files.length, 'validating');
      }

      try {
        const result = await this.processFile(file, onProgress ? (status) => {
          onProgress(i, files.length, status);
        } : undefined);

        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        // Handle unexpected errors for individual files
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        results.push({
          file,
          success: false,
          error: errorMessage,
        });
        failureCount++;
      }
    }

    return {
      results,
      successCount,
      failureCount,
      totalProcessed: files.length,
    };
  }

  /**
   * Process a single file with validation, EXIF correction, and optimization
   * @param file - File to process
   * @param onProgress - Optional callback for status updates
   * @returns BatchFileResult with processing outcome
   */
  private static async processFile(
    file: File,
    onProgress?: (status: string) => void
  ): Promise<BatchFileResult> {
    // Step 1: Validate file
    if (onProgress) onProgress('validating');
    
    const validationResult = FileValidator.validate(file);
    
    if (!validationResult.valid) {
      return {
        file,
        success: false,
        error: validationResult.error,
        validationResult,
      };
    }

    try {
      // Step 2: Load image and check for EXIF data - Requirement 8.3
      if (onProgress) onProgress('processing');
      
      const image = await this.loadImage(file);
      const exifData = await readEXIF(file);
      
      // Step 3: Correct orientation if needed
      let processedCanvas: HTMLCanvasElement;
      
      if (exifData && exifData.orientation !== 1) {
        processedCanvas = await correctOrientation(image, exifData.orientation);
      } else {
        // No orientation correction needed, create canvas from image
        processedCanvas = document.createElement('canvas');
        const ctx = processedCanvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        
        processedCanvas.width = image.naturalWidth || image.width;
        processedCanvas.height = image.naturalHeight || image.height;
        ctx.drawImage(image, 0, 0);
      }

      // Step 4: Optimize the image
      if (onProgress) onProgress('optimizing');
      
      // Convert canvas to blob first
      const canvasBlob = await this.canvasToBlob(processedCanvas, file.type);
      
      // Create a File object from the blob for optimization
      const processedFile = new File([canvasBlob], file.name, { type: file.type });
      
      const optimizationResult = await ImageOptimizer.optimize(processedFile, {
        maxDimension: 2000,
        quality: 0.85,
      });

      if (onProgress) onProgress('complete');

      return {
        file,
        success: true,
        validationResult,
        optimizationResult,
        processedBlob: optimizationResult.optimizedImage,
      };
    } catch (error) {
      // Requirement 8.3: Display error for corrupted images
      // Requirement 8.5: Provide clear error messages with context
      const errorMessage = error instanceof Error ? error.message : 'Unable to read image file. Please try another file.';
      return {
        file,
        success: false,
        error: errorMessage,
        validationResult,
      };
    }
  }

  /**
   * Load an image file into an HTMLImageElement
   * @param file - The image file to load
   * @returns Promise that resolves to HTMLImageElement
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert canvas to blob
   * @param canvas - Canvas to convert
   * @param mimeType - Output MIME type
   * @returns Promise that resolves to Blob
   */
  private static canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        mimeType
      );
    });
  }
}
