/**
 * Exporter - Main Export Orchestrator
 * Coordinates the entire export pipeline from canvas to downloaded file
 * Validates: Requirements All
 */

import { CanvasConverter } from './canvasConverter';
import { FormatOptimizer } from './formatOptimizer';
import { FilenameGenerator } from './filenameGenerator';
import { DownloadTrigger } from './downloadTrigger';
import { WorkerManager } from './workerManager';
import type { ExportConfig, ExportResult, ExportProgress } from './types';

// Check if we're in a test environment
const isTestEnvironment = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

/**
 * Main exporter class that orchestrates the export pipeline
 */
export class Exporter {
  private aborted: boolean = false;
  private isExporting: boolean = false;
  private exportQueue: Array<{
    canvas: HTMLCanvasElement;
    config: ExportConfig;
    onProgress?: (progress: ExportProgress) => void;
    resolve: (result: ExportResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private scaledCanvasCache: Map<string, { canvas: HTMLCanvasElement; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds cache TTL
  private workerManager: WorkerManager | null = null;
  private readonly LARGE_IMAGE_THRESHOLD = 1920 * 1080; // Use worker for images larger than 1080p

  constructor() {
    // Initialize exporter
    this.aborted = false;
    this.isExporting = false;
    this.exportQueue = [];
    this.scaledCanvasCache = new Map();
    
    // Initialize Web Worker for large images (10.3)
    this.workerManager = new WorkerManager();
    if (this.workerManager.isSupported()) {
      this.workerManager.initialize().catch(() => {
        // Worker initialization failed, will fall back to main thread
        this.workerManager = null;
      });
    }
  }

  /**
   * Export canvas to downloadable image file
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 5.5
   * 
   * @param canvas - The canvas element to export
   * @param config - Export configuration
   * @param onProgress - Optional progress callback
   * @returns Promise resolving to export result
   */
  async export(
    canvas: HTMLCanvasElement,
    config: ExportConfig,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    // Prevent multiple simultaneous exports (10.1)
    // Queue exports if one is already in progress
    if (this.isExporting) {
      return new Promise<ExportResult>((resolve, reject) => {
        this.exportQueue.push({
          canvas,
          config,
          onProgress,
          resolve,
          reject
        });
      });
    }

    this.isExporting = true;
    this.aborted = false;

    try {
      // Stage 1: Preparing (0%)
      this.reportProgress(onProgress, {
        stage: 'preparing',
        progress: 0,
        message: 'Preparing image...'
      });

      // Validate canvas has content (9.1)
      // This will throw if validation fails
      this.validateCanvas(canvas);

      if (this.aborted) {
        throw new Error('Export aborted');
      }

      // Allow UI update (skip in test environment)
      if (!isTestEnvironment) {
        await this.sleep(50);
      }

      // Stage 2: Watermarking (25%) - if needed
      let processedCanvas = canvas;
      if (config.watermark) {
        this.reportProgress(onProgress, {
          stage: 'watermarking',
          progress: 25,
          message: 'Applying watermark...'
        });

        processedCanvas = await this.applyWatermark(canvas, config.watermarkText);
        
        if (this.aborted) {
          throw new Error('Export aborted');
        }

        // Allow UI update (skip in test environment)
        if (!isTestEnvironment) {
          await this.sleep(50);
        }
      }

      // Stage 3: Converting (50%)
      this.reportProgress(onProgress, {
        stage: 'converting',
        progress: 50,
        message: 'Converting to image...'
      });

      // Check cache for scaled canvas (10.2)
      let canvasToConvert = processedCanvas;
      if (config.maxDimension) {
        const cached = this.getCachedScaledCanvas(processedCanvas, config.maxDimension);
        if (cached) {
          canvasToConvert = cached;
        } else if (this.shouldUseWorker(processedCanvas)) {
          // Use Web Worker for large images (10.3)
          try {
            canvasToConvert = await this.workerManager!.scaleCanvas(
              processedCanvas,
              config.maxDimension
            );
            // Cache the worker-scaled canvas
            this.cacheScaledCanvas(processedCanvas, canvasToConvert, config.maxDimension);
          } catch (workerError) {
            // Fall back to main thread if worker fails
            console.warn('Worker scaling failed, falling back to main thread:', workerError);
          }
        }
      }

      // Convert canvas to data URL
      const dataUrl = CanvasConverter.toDataURL(canvasToConvert, {
        format: config.format,
        quality: config.quality,
        maxDimension: config.maxDimension
      });

      // Cache the scaled canvas if it was created and not already cached (10.2)
      if (config.maxDimension && canvasToConvert !== processedCanvas && !this.getCachedScaledCanvas(processedCanvas, config.maxDimension)) {
        this.cacheScaledCanvas(processedCanvas, canvasToConvert, config.maxDimension);
      }

      if (this.aborted) {
        throw new Error('Export aborted');
      }

      // Allow UI update (skip in test environment)
      if (!isTestEnvironment) {
        await this.sleep(50);
      }

      // Optimize based on format
      const optimized = config.format === 'png'
        ? FormatOptimizer.optimizePNG(dataUrl)
        : FormatOptimizer.optimizeJPEG(dataUrl, config.quality);

      // Stage 4: Downloading (75%)
      this.reportProgress(onProgress, {
        stage: 'downloading',
        progress: 75,
        message: 'Starting download...'
      });

      // Generate filename
      const filename = FilenameGenerator.generate({
        format: config.format,
        watermarked: config.watermark
      });

      // Trigger download
      DownloadTrigger.trigger({
        filename,
        dataUrl: optimized.dataUrl,
        mimeType: config.format === 'png' ? 'image/png' : 'image/jpeg'
      });

      if (this.aborted) {
        throw new Error('Export aborted');
      }

      // Allow UI update (skip in test environment)
      if (!isTestEnvironment) {
        await this.sleep(50);
      }

      // Stage 5: Complete (100%)
      this.reportProgress(onProgress, {
        stage: 'complete',
        progress: 100,
        message: 'Export complete!'
      });

      const result: ExportResult = {
        success: true,
        filename,
        fileSize: optimized.fileSize,
        format: config.format,
        error: null
      };

      // Process next export in queue if any (10.1)
      this.isExporting = false;
      this.processQueue();

      return result;

    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      
      const result: ExportResult = {
        success: false,
        filename: '',
        fileSize: 0,
        format: config.format,
        error: errorMessage
      };

      // Process next export in queue if any (10.1)
      this.isExporting = false;
      this.processQueue();

      return result;
    }
  }

  /**
   * Process the next export in the queue
   * Validates: Requirements 5.5 (10.1)
   */
  private processQueue(): void {
    if (this.exportQueue.length > 0) {
      const next = this.exportQueue.shift();
      if (next) {
        this.export(next.canvas, next.config, next.onProgress)
          .then(next.resolve)
          .catch(next.reject);
      }
    }
  }

  /**
   * Get cached scaled canvas or create new one
   * Validates: Requirements 5.1, 5.2 (10.2)
   * @param canvas - Original canvas
   * @param maxDimension - Maximum dimension
   * @returns Cached or newly created scaled canvas
   */
  private getCachedScaledCanvas(
    canvas: HTMLCanvasElement,
    maxDimension: number
  ): HTMLCanvasElement | null {
    const cacheKey = `${canvas.width}x${canvas.height}-${maxDimension}`;
    const cached = this.scaledCanvasCache.get(cacheKey);

    if (cached) {
      const now = Date.now();
      // Check if cache is still valid
      if (now - cached.timestamp < this.CACHE_TTL) {
        return cached.canvas;
      } else {
        // Cache expired, remove it
        this.scaledCanvasCache.delete(cacheKey);
      }
    }

    return null;
  }

  /**
   * Cache scaled canvas for reuse
   * Validates: Requirements 5.1, 5.2 (10.2)
   * @param canvas - Original canvas
   * @param scaledCanvas - Scaled canvas to cache
   * @param maxDimension - Maximum dimension used
   */
  private cacheScaledCanvas(
    canvas: HTMLCanvasElement,
    scaledCanvas: HTMLCanvasElement,
    maxDimension: number
  ): void {
    const cacheKey = `${canvas.width}x${canvas.height}-${maxDimension}`;
    this.scaledCanvasCache.set(cacheKey, {
      canvas: scaledCanvas,
      timestamp: Date.now()
    });

    // Clean up old cache entries (10.2)
    this.cleanupCache();
  }

  /**
   * Clean up expired cache entries
   * Validates: Requirements 5.1, 5.2 (10.2)
   */
  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.scaledCanvasCache.forEach((value, key) => {
      if (now - value.timestamp >= this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.scaledCanvasCache.delete(key);
    });
  }

  /**
   * Clear all cached canvases
   * Validates: Requirements 5.1, 5.2 (10.2)
   */
  public clearCache(): void {
    this.scaledCanvasCache.clear();
  }

  /**
   * Check if canvas should use Web Worker for processing
   * Validates: Requirements 5.2 (10.3)
   * @param canvas - Canvas to check
   * @returns true if should use worker
   */
  private shouldUseWorker(canvas: HTMLCanvasElement): boolean {
    const pixelCount = canvas.width * canvas.height;
    return (
      this.workerManager !== null &&
      this.workerManager.isSupported() &&
      pixelCount > this.LARGE_IMAGE_THRESHOLD
    );
  }

  /**
   * Terminate Web Worker
   * Validates: Requirements 5.2 (10.3)
   */
  public terminate(): void {
    if (this.workerManager) {
      this.workerManager.terminate();
      this.workerManager = null;
    }
  }

  /**
   * Abort the current export operation
   * Validates: Requirements 5.5
   */
  abort(): void {
    this.aborted = true;
  }

  /**
   * Validate that canvas has content
   * Validates: Requirements 7.1, 7.4 (9.1)
   * @param canvas - Canvas to validate
   * @returns true if valid, false otherwise
   */
  private validateCanvas(canvas: HTMLCanvasElement): boolean {
    // Check if canvas exists (9.1)
    if (!canvas) {
      throw new Error('Please upload an image before exporting.');
    }

    // Check if canvas has dimensions (9.1)
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Please upload an image before exporting.');
    }

    // Check if canvas context is available (9.1)
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas error. Please refresh and try again.');
    }

    // Check if canvas has any non-transparent pixels (9.1)
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check if there's any non-transparent pixel
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
          return true; // Found a non-transparent pixel
        }
      }
      
      // All pixels are transparent - canvas is empty
      throw new Error('Please upload an image before exporting.');
    } catch (error) {
      // If we can't read the canvas (e.g., CORS), check the error
      if (error instanceof Error) {
        if (error.message.includes('upload an image')) {
          throw error; // Re-throw our validation error
        }
        if (error.message.includes('tainted') || error.message.includes('cross-origin')) {
          // Canvas has CORS issues but likely has content
          return true;
        }
      }
      // For other errors, assume canvas has content
      return true;
    }
  }

  /**
   * Apply watermark to canvas
   * @param canvas - Original canvas
   * @param watermarkText - Text to display in watermark
   * @returns Canvas with watermark applied
   */
  private async applyWatermark(
    canvas: HTMLCanvasElement,
    watermarkText: string
  ): Promise<HTMLCanvasElement> {
    // Create a new canvas with the same dimensions
    const watermarkedCanvas = document.createElement('canvas');
    watermarkedCanvas.width = canvas.width;
    watermarkedCanvas.height = canvas.height;

    const ctx = watermarkedCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for watermarked canvas');
    }

    // Draw original canvas
    ctx.drawImage(canvas, 0, 0);

    // Add watermark
    const fontSize = Math.max(12, Math.floor(canvas.height / 30));
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    const padding = 10;
    ctx.fillText(
      watermarkText,
      canvas.width - padding,
      canvas.height - padding
    );

    return watermarkedCanvas;
  }

  /**
   * Report progress to callback if provided
   * Uses requestAnimationFrame for smooth UI updates (10.2)
   * Validates: Requirements 5.1, 5.2
   * @param callback - Progress callback
   * @param progress - Progress information
   */
  private reportProgress(
    callback: ((progress: ExportProgress) => void) | undefined,
    progress: ExportProgress
  ): void {
    if (callback) {
      // Use requestAnimationFrame for smooth progress updates in production (10.2)
      // In test environment, call synchronously to maintain order
      if (!isTestEnvironment && typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          callback(progress);
        });
      } else {
        // Synchronous for test environments to maintain order
        callback(progress);
      }
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5 (9.1-9.5)
   * @param error - Error object
   * @returns User-friendly error message
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message;

      // Return already user-friendly messages as-is
      // These come from our validation and error handling
      if (message.includes('Please upload an image')) {
        return message; // 9.1 - Canvas validation
      }
      if (message.includes('Canvas error. Please refresh')) {
        return message; // 9.1 - Context error
      }
      if (message.includes('Failed to generate image')) {
        return message; // 9.2 - Conversion error
      }
      if (message.includes('Image too large to export')) {
        return message; // 9.3 - Memory error
      }
      if (message.includes('Download blocked')) {
        return message; // 9.4 - Download error
      }
      if (message.includes('Unable to save file')) {
        return message; // 9.4 - Filesystem error
      }
      
      // Map other technical errors to user-friendly messages
      if (message.includes('aborted') || message.includes('cancelled')) {
        return 'Export was cancelled.';
      }
      if (message.includes('toDataURL') || message.includes('toBlob')) {
        return 'Failed to generate image. Please try again.';
      }
      if (message.includes('memory') || message.includes('allocation')) {
        return 'Image too large to export. Try reducing size.';
      }
      if (message.includes('tainted') || message.includes('cross-origin')) {
        return 'Failed to generate image. Canvas contains cross-origin data.';
      }
      if (message.includes('context')) {
        return 'Canvas error. Please refresh and try again.';
      }
      if (message.includes('filesystem') || message.includes('disk')) {
        return 'Unable to save file. Please check available disk space.';
      }

      // Generic fallback - avoid technical jargon
      return 'Failed to export image. Please try again.';
    }

    return 'An unknown error occurred. Please try again.';
  }
}
