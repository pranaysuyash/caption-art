/**
 * MaskProcessor - Validates and processes mask images
 * 
 * Provides utilities for:
 * - Validating mask format and alpha channel
 * - Extracting alpha channel data
 * - Assessing mask quality
 * - Refining mask edges (optional)
 * 
 * Uses Web Workers for heavy processing when available to avoid blocking main thread.
 * Requirements: 3.1, 3.2, 3.3
 */

import { MaskValidation } from './types';
import { WorkerManager } from './workerManager';

/**
 * MaskProcessor class for validating and processing mask images
 */
export class MaskProcessor {
  private static workerManager: WorkerManager | null = null;
  private static processedMaskCache: Map<string, ImageData> = new Map();
  private static readonly MAX_CACHE_SIZE = 10;

  /**
   * Initialize worker manager
   */
  private static getWorkerManager(): WorkerManager {
    if (!this.workerManager) {
      this.workerManager = new WorkerManager();
    }
    return this.workerManager;
  }
  /**
   * Validate a mask image
   * 
   * Checks:
   * - Has alpha channel with partial transparency
   * - Dimensions are valid
   * - Alpha values are not all 0 or 255
   * - Edge quality assessment
   * 
   * @param maskImage - The mask image to validate
   * @param originalWidth - Optional original image width for dimension checking
   * @param originalHeight - Optional original image height for dimension checking
   * @returns Validation result with details
   */
  static async validate(
    maskImage: HTMLImageElement,
    originalWidth?: number,
    originalHeight?: number
  ): Promise<MaskValidation> {
    const errors: string[] = [];
    let hasAlphaChannel = false;
    let quality: 'high' | 'medium' | 'low' = 'low';

    const dimensions = {
      width: maskImage.width,
      height: maskImage.height
    };

    // Check dimensions match original if provided
    if (originalWidth !== undefined && originalHeight !== undefined) {
      if (maskImage.width !== originalWidth || maskImage.height !== originalHeight) {
        errors.push(
          `Dimension mismatch: expected ${originalWidth}x${originalHeight}, got ${maskImage.width}x${maskImage.height}`
        );
      }
    }

    try {
      // Extract image data to check alpha channel
      const canvas = document.createElement('canvas');
      canvas.width = maskImage.width;
      canvas.height = maskImage.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        errors.push('Failed to create canvas context');
        return {
          isValid: false,
          hasAlphaChannel: false,
          dimensions,
          quality: 'low',
          errors
        };
      }

      ctx.drawImage(maskImage, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Validate alpha channel
      const alphaValidation = await this.validateAlphaChannel(imageData);
      hasAlphaChannel = alphaValidation.hasAlpha;

      // Handle missing alpha channel (Requirement 5.1, 5.4)
      if (!alphaValidation.hasAlpha) {
        errors.push('Mask has no alpha channel or transparency');
      }

      // Handle all transparent mask (Requirement 5.4)
      if (alphaValidation.allTransparent) {
        errors.push('Mask is completely transparent (no subject detected)');
      }

      // Handle all opaque mask (Requirement 5.4)
      if (alphaValidation.allOpaque) {
        errors.push('Mask is completely opaque (no transparency)');
      }

      // Check for artifacts or noise (Requirement 5.1)
      if (alphaValidation.hasNoise) {
        errors.push('Mask contains noise or artifacts');
      }

      // Assess quality
      quality = await this.assessQuality(imageData);

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const isValid = errors.length === 0 && hasAlphaChannel;

    return {
      isValid,
      hasAlphaChannel,
      dimensions,
      quality,
      errors
    };
  }

  /**
   * Validate alpha channel properties
   * 
   * Uses Web Worker when available for better performance.
   * Requirements: 3.1, 3.2, 3.3
   * 
   * @param imageData - Image data to validate
   * @returns Validation details
   */
  private static async validateAlphaChannel(imageData: ImageData): Promise<{
    hasAlpha: boolean;
    allTransparent: boolean;
    allOpaque: boolean;
    hasNoise: boolean;
  }> {
    // Try to use worker for heavy processing
    const worker = this.getWorkerManager();
    if (worker.isAvailable()) {
      try {
        return await worker.validateAlpha(imageData);
      } catch (error) {
        console.debug('Worker alpha validation failed, falling back to main thread:', error);
        // Fall through to main thread implementation
      }
    }

    // Main thread implementation (fallback)
    return this.validateAlphaChannelSync(imageData);
  }

  /**
   * Synchronous alpha channel validation (main thread fallback)
   * 
   * @param imageData - Image data to validate
   * @returns Validation details
   */
  private static validateAlphaChannelSync(imageData: ImageData): {
    hasAlpha: boolean;
    allTransparent: boolean;
    allOpaque: boolean;
    hasNoise: boolean;
  } {
    const data = imageData.data;
    let hasPartialAlpha = false;
    let hasFullyOpaque = false;
    let hasFullyTransparent = false;
    let partialAlphaCount = 0;
    let opaqueCount = 0;
    let transparentCount = 0;

    // Sample pixels to check alpha values
    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];

      if (alpha === 0) {
        transparentCount++;
        hasFullyTransparent = true;
      } else if (alpha === 255) {
        opaqueCount++;
        hasFullyOpaque = true;
      } else {
        partialAlphaCount++;
        hasPartialAlpha = true;
      }
    }

    const totalPixels = data.length / 4;
    const allTransparent = transparentCount === totalPixels;
    const allOpaque = opaqueCount === totalPixels;

    // Check for noise: very few partial alpha pixels might indicate artifacts
    const partialAlphaRatio = partialAlphaCount / totalPixels;
    const hasNoise = partialAlphaRatio > 0 && partialAlphaRatio < 0.001;

    return {
      hasAlpha: hasPartialAlpha || (hasFullyOpaque && hasFullyTransparent),
      allTransparent,
      allOpaque,
      hasNoise
    };
  }

  /**
   * Extract alpha channel from mask image
   * 
   * Caches processed masks to avoid redundant canvas operations.
   * Requirements: 3.1, 3.2, 3.3
   * 
   * @param maskImage - The mask image
   * @returns ImageData containing the alpha channel
   */
  static async extractAlphaChannel(maskImage: HTMLImageElement): Promise<ImageData> {
    // Generate cache key from image src
    const cacheKey = this.generateCacheKey(maskImage);

    // Check cache first
    const cached = this.processedMaskCache.get(cacheKey);
    if (cached) {
      // Return a copy to prevent mutations
      return new ImageData(
        new Uint8ClampedArray(cached.data),
        cached.width,
        cached.height
      );
    }

    // Create canvas and draw mask
    const canvas = document.createElement('canvas');
    canvas.width = maskImage.width;
    canvas.height = maskImage.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }

    // Draw mask to canvas
    ctx.drawImage(maskImage, 0, 0);

    // Get ImageData
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Cache the result
    this.cacheProcessedMask(cacheKey, imageData);

    // Return ImageData (alpha channel is in data[3], data[7], data[11], etc.)
    return imageData;
  }

  /**
   * Generate cache key for mask image
   * 
   * @param maskImage - Mask image
   * @returns Cache key
   */
  private static generateCacheKey(maskImage: HTMLImageElement): string {
    return `${maskImage.src}_${maskImage.width}x${maskImage.height}`;
  }

  /**
   * Cache processed mask with LRU eviction
   * 
   * @param key - Cache key
   * @param imageData - Image data to cache
   */
  private static cacheProcessedMask(key: string, imageData: ImageData): void {
    // Evict oldest entry if cache is full
    if (this.processedMaskCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.processedMaskCache.keys().next().value;
      if (firstKey) {
        this.processedMaskCache.delete(firstKey);
      }
    }

    // Store a copy to prevent mutations
    const copy = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    this.processedMaskCache.set(key, copy);
  }

  /**
   * Clear processed mask cache
   */
  static clearCache(): void {
    this.processedMaskCache.clear();
  }

  /**
   * Assess mask quality based on edge smoothness
   * 
   * Samples edge pixels (alpha 10-245) and checks for smooth gradients
   * Uses Web Worker when available for better performance.
   * 
   * Requirements: 3.1, 3.2, 3.3
   * 
   * @param imageData - Image data to assess
   * @returns Quality rating: 'high', 'medium', or 'low'
   */
  static async assessQuality(imageData: ImageData): Promise<'high' | 'medium' | 'low'> {
    // Try to use worker for heavy processing
    const worker = this.getWorkerManager();
    if (worker.isAvailable()) {
      try {
        return await worker.assessQuality(imageData);
      } catch (error) {
        console.debug('Worker quality assessment failed, falling back to main thread:', error);
        // Fall through to main thread implementation
      }
    }

    // Main thread implementation (fallback)
    return this.assessQualitySync(imageData);
  }

  /**
   * Synchronous quality assessment (main thread fallback)
   * 
   * @param imageData - Image data to assess
   * @returns Quality rating
   */
  private static assessQualitySync(imageData: ImageData): 'high' | 'medium' | 'low' {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let edgePixels = 0;
    let smoothEdges = 0;

    // Sample edge pixels (alpha between 10 and 245)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const alpha = data[i + 3];

        // Check if this is an edge pixel
        if (alpha > 10 && alpha < 245) {
          edgePixels++;

          // Check if neighboring pixels have gradual transition
          const neighbors = this.getNeighborAlphas(imageData, x, y);
          const isSmooth = neighbors.every(n => Math.abs(n - alpha) < 50);

          if (isSmooth) {
            smoothEdges++;
          }
        }
      }
    }

    // If no edge pixels found, quality is low
    if (edgePixels === 0) {
      return 'low';
    }

    // Calculate smooth ratio
    const smoothRatio = smoothEdges / edgePixels;

    // Determine quality based on smooth ratio
    if (smoothRatio > 0.8) {
      return 'high';
    } else if (smoothRatio > 0.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get alpha values of neighboring pixels
   * 
   * @param imageData - Image data
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Array of neighbor alpha values
   */
  private static getNeighborAlphas(imageData: ImageData, x: number, y: number): number[] {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const neighbors: number[] = [];

    // Check 8 neighbors (top, bottom, left, right, and diagonals)
    const offsets = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],           [1, 0],
      [-1, 1],  [0, 1],  [1, 1]
    ];

    for (const [dx, dy] of offsets) {
      const nx = x + dx;
      const ny = y + dy;

      // Check bounds
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const i = (ny * width + nx) * 4;
        neighbors.push(data[i + 3]);
      }
    }

    return neighbors;
  }

  /**
   * Refine mask by applying smoothing and morphological operations (optional)
   * 
   * @param maskImage - The mask image to refine
   * @param options - Refinement options
   * @returns Refined mask image
   */
  static async refine(
    maskImage: HTMLImageElement,
    options: {
      blur?: number;
      dilate?: number;
      erode?: number;
      threshold?: number;
    } = {}
  ): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas');
    canvas.width = maskImage.width;
    canvas.height = maskImage.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }

    // Draw original mask
    ctx.drawImage(maskImage, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Apply Gaussian blur for smoothing (use worker if available)
    if (options.blur && options.blur > 0) {
      const worker = this.getWorkerManager();
      if (worker.isAvailable()) {
        try {
          imageData = await worker.applyBlur(imageData, options.blur);
        } catch (error) {
          console.debug('Worker blur failed, falling back to main thread:', error);
          imageData = this.applyGaussianBlur(imageData, options.blur);
        }
      } else {
        imageData = this.applyGaussianBlur(imageData, options.blur);
      }
    }

    // Apply morphological operations
    if (options.dilate && options.dilate > 0) {
      imageData = this.applyDilation(imageData, options.dilate);
    }

    if (options.erode && options.erode > 0) {
      imageData = this.applyErosion(imageData, options.erode);
    }

    // Adjust threshold
    if (options.threshold !== undefined) {
      imageData = this.applyThreshold(imageData, options.threshold);
    }

    // Put refined data back
    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to image
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load refined image'));
        };
        img.src = url;
      });
    });
  }

  /**
   * Apply Gaussian blur to image data
   * 
   * @param imageData - Image data to blur
   * @param radius - Blur radius
   * @returns Blurred image data
   */
  private static applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
    // Simple box blur approximation of Gaussian blur
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new ImageData(width, height);

    const kernelSize = Math.ceil(radius) * 2 + 1;
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
        let count = 0;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const nx = x + kx;
            const ny = y + ky;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const i = (ny * width + nx) * 4;
              sumR += data[i];
              sumG += data[i + 1];
              sumB += data[i + 2];
              sumA += data[i + 3];
              count++;
            }
          }
        }

        const i = (y * width + x) * 4;
        output.data[i] = sumR / count;
        output.data[i + 1] = sumG / count;
        output.data[i + 2] = sumB / count;
        output.data[i + 3] = sumA / count;
      }
    }

    return output;
  }

  /**
   * Apply dilation morphological operation
   * 
   * @param imageData - Image data to dilate
   * @param iterations - Number of dilation iterations
   * @returns Dilated image data
   */
  private static applyDilation(imageData: ImageData, iterations: number): ImageData {
    let result = imageData;

    for (let iter = 0; iter < iterations; iter++) {
      const data = result.data;
      const width = result.width;
      const height = result.height;
      const output = new ImageData(width, height);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          let maxAlpha = data[i + 3];

          // Check 8 neighbors
          const offsets = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
          ];

          for (const [dx, dy] of offsets) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4;
              maxAlpha = Math.max(maxAlpha, data[ni + 3]);
            }
          }

          output.data[i] = data[i];
          output.data[i + 1] = data[i + 1];
          output.data[i + 2] = data[i + 2];
          output.data[i + 3] = maxAlpha;
        }
      }

      result = output;
    }

    return result;
  }

  /**
   * Apply erosion morphological operation
   * 
   * @param imageData - Image data to erode
   * @param iterations - Number of erosion iterations
   * @returns Eroded image data
   */
  private static applyErosion(imageData: ImageData, iterations: number): ImageData {
    let result = imageData;

    for (let iter = 0; iter < iterations; iter++) {
      const data = result.data;
      const width = result.width;
      const height = result.height;
      const output = new ImageData(width, height);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          let minAlpha = data[i + 3];

          // Check 8 neighbors
          const offsets = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
          ];

          for (const [dx, dy] of offsets) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4;
              minAlpha = Math.min(minAlpha, data[ni + 3]);
            }
          }

          output.data[i] = data[i];
          output.data[i + 1] = data[i + 1];
          output.data[i + 2] = data[i + 2];
          output.data[i + 3] = minAlpha;
        }
      }

      result = output;
    }

    return result;
  }

  /**
   * Apply threshold to alpha channel
   * 
   * @param imageData - Image data to threshold
   * @param threshold - Threshold value (0-255)
   * @returns Thresholded image data
   */
  private static applyThreshold(imageData: ImageData, threshold: number): ImageData {
    const data = imageData.data;
    const output = new ImageData(imageData.width, imageData.height);

    for (let i = 0; i < data.length; i += 4) {
      output.data[i] = data[i];
      output.data[i + 1] = data[i + 1];
      output.data[i + 2] = data[i + 2];
      output.data[i + 3] = data[i + 3] >= threshold ? 255 : 0;
    }

    return output;
  }
}
