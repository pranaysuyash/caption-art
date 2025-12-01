/**
 * MaskGenerator - Main orchestrator for mask generation pipeline
 * 
 * Coordinates:
 * - Image validation
 * - Replicate API calls via RembgClient
 * - Mask download and validation
 * - Quality assessment
 * - Caching
 * - Error handling
 */

import { RembgClient } from './clients/rembgClient';
import { MaskCache } from './maskCache';
import { MaskProcessor } from './maskProcessor';
import { MaskResult, SegmentationError } from './types';

/**
 * Configuration for MaskGenerator
 */
export interface MaskGeneratorConfig {
  replicateApiKey: string;
  maxRetries: number;
  timeout: number;
  cacheEnabled: boolean;
}

/**
 * MaskGenerator class - orchestrates the mask generation pipeline
 */
export class MaskGenerator {
  private client: RembgClient;
  private cache: MaskCache;
  private config: MaskGeneratorConfig;
  private currentPredictionId: string | null = null;
  private pendingRequests: Map<string, Promise<MaskResult>> = new Map();
  private prefetchEnabled: boolean = true;

  /**
   * Create a new MaskGenerator
   * 
   * @param config - Configuration options
   */
  constructor(config: MaskGeneratorConfig) {
    this.config = config;
    this.client = new RembgClient(config.replicateApiKey);
    this.cache = new MaskCache(30, 2 * 60 * 60 * 1000); // 30 entries, 2 hour TTL
  }

  /**
   * Generate a mask for the given image
   * 
   * Pipeline:
   * 1. Validate image format
   * 2. Check cache for existing mask
   * 3. Call Replicate rembg API
   * 4. Wait for mask URL
   * 5. Download mask image
   * 6. Validate mask
   * 7. Assess quality
   * 8. Cache result
   * 9. Return MaskResult
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   * 
   * @param imageDataUrl - Base64 data URL of the image
   * @returns Promise resolving to MaskResult
   */
  async generate(imageDataUrl: string): Promise<MaskResult> {
    const startTime = Date.now();

    // Validate image format
    this.validateImageFormat(imageDataUrl);

    // Generate hash for caching and deduplication
    const imageHash = await this.hashImage(imageDataUrl);

    // Check cache if enabled (Requirements 6.1, 6.2, 6.3)
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(imageHash);
      if (cached) {
        return cached;
      }
    }

    // Check for pending request for same image (Requirements 6.1, 6.2, 6.3)
    // This avoids redundant API calls when the same image is uploaded multiple times
    const pendingRequest = this.pendingRequests.get(imageHash);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create promise for this request and store it for deduplication
    const requestPromise = this.executeGeneration(imageDataUrl, imageHash, startTime);
    this.pendingRequests.set(imageHash, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(imageHash);
    }
  }

  /**
   * Execute the actual mask generation
   * 
   * @param imageDataUrl - Base64 data URL of the image
   * @param imageHash - Hash of the image for caching
   * @param startTime - Start time for generation time calculation
   * @returns Promise resolving to MaskResult
   */
  private async executeGeneration(
    imageDataUrl: string,
    imageHash: string,
    startTime: number
  ): Promise<MaskResult> {
    try {
      // Create prediction
      const prediction = await this.client.createPrediction(
        imageDataUrl,
        this.config.maxRetries
      );
      this.currentPredictionId = prediction.id;

      // Wait for completion
      const maskUrl = await this.client.waitForCompletion(
        prediction.id,
        this.config.timeout
      );

      // Download mask
      const maskImage = await this.downloadMask(maskUrl);

      // Validate mask
      const validation = await MaskProcessor.validate(maskImage);
      if (!validation.isValid) {
        throw this.createValidationError(validation.errors);
      }

      // Assess quality
      const quality = validation.quality;

      // Calculate generation time
      const generationTime = Date.now() - startTime;

      // Create result
      const result: MaskResult = {
        maskUrl,
        maskImage,
        generationTime,
        quality
      };

      // Cache result if enabled
      if (this.config.cacheEnabled) {
        this.cache.set(imageHash, result);
      }

      // Clear current prediction
      this.currentPredictionId = null;

      return result;
    } catch (error) {
      // Clear current prediction
      this.currentPredictionId = null;

      // Re-throw if already a SegmentationError
      if (this.isSegmentationError(error)) {
        throw error;
      }

      // Wrap other errors
      throw this.wrapError(error);
    }
  }

  /**
   * Download mask from URL with retry logic
   * 
   * Requirements: 1.3, 1.4, 5.2
   * 
   * @param maskUrl - URL of the mask image
   * @returns Promise resolving to HTMLImageElement
   */
  private async downloadMask(maskUrl: string): Promise<HTMLImageElement> {
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Fetch mask (Requirement 5.2 - handle network failures)
        const response = await fetch(maskUrl, {
          mode: 'cors',
          credentials: 'omit',
        });

        if (!response.ok) {
          // Handle HTTP errors
          if (response.status === 404) {
            throw new Error('Mask not found. Please regenerate.');
          } else if (response.status === 403) {
            throw new Error('Access denied to mask. Please regenerate.');
          } else {
            throw new Error(`Failed to download mask: ${response.statusText}`);
          }
        }

        // Validate content type (Requirement 5.2 - handle invalid image)
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) {
          throw new Error('Invalid mask format received. Please regenerate.');
        }

        // Create blob
        const blob = await response.blob();
        
        // Validate blob size (Requirement 5.2 - handle invalid image)
        if (blob.size === 0) {
          throw new Error('Empty mask received. Please regenerate.');
        }

        const objectUrl = URL.createObjectURL(blob);

        // Load as HTMLImageElement (Requirement 5.2 - handle invalid image)
        const img = await this.loadImage(objectUrl);

        // Clean up object URL
        URL.revokeObjectURL(objectUrl);

        // Validate alpha channel
        const hasAlpha = await this.validateAlphaChannel(img);
        if (!hasAlpha) {
          throw new Error('Mask has no alpha channel');
        }

        return img;
      } catch (error) {
        lastError = error;

        // Check if error is CORS-related (Requirement 5.2)
        if (error instanceof TypeError && error.message.includes('CORS')) {
          lastError = new Error('Unable to load mask due to security restrictions. Please regenerate.');
        }

        // Check if error is network-related (Requirement 5.2)
        if (error instanceof TypeError && 
            (error.message.includes('Failed to fetch') || 
             error.message.includes('NetworkError'))) {
          lastError = new Error('Network error while downloading mask. Please check your connection.');
        }

        // Retry on network failures (Requirement 5.2 - retry up to 2 times)
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s
          await this.sleep(1000 * (attempt + 1));
          continue;
        }
      }
    }

    // All retries exhausted (Requirement 5.2)
    throw this.createDownloadError(lastError);
  }

  /**
   * Load image from URL with validation
   * 
   * Requirements: 5.4
   * 
   * @param url - Image URL
   * @returns Promise resolving to HTMLImageElement
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Validate image dimensions (Requirement 5.4)
        if (img.width === 0 || img.height === 0) {
          reject(new Error('Invalid image: zero dimensions'));
          return;
        }

        // Validate reasonable dimensions
        if (img.width > 10000 || img.height > 10000) {
          reject(new Error('Image dimensions too large (max 10000x10000)'));
          return;
        }

        resolve(img);
      };

      img.onerror = (event) => {
        // Provide user-friendly error message (Requirement 5.4)
        reject(new Error('Failed to load image. The file may be corrupted.'));
      };

      img.src = url;

      // Add timeout for loading (Requirement 5.4)
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error('Image loading timed out. Please try again.'));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Validate that image has alpha channel
   * 
   * @param img - Image to validate
   * @returns True if image has alpha channel
   */
  private async validateAlphaChannel(img: HTMLImageElement): Promise<boolean> {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return false;
    }

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Check for partial alpha values
    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];
      if (alpha > 0 && alpha < 255) {
        return true;
      }
    }

    // Also valid if has both fully transparent and fully opaque pixels
    let hasTransparent = false;
    let hasOpaque = false;

    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];
      if (alpha === 0) hasTransparent = true;
      if (alpha === 255) hasOpaque = true;
      if (hasTransparent && hasOpaque) return true;
    }

    return false;
  }

  /**
   * Regenerate mask, bypassing cache
   * 
   * Requirements: 6.1, 6.2, 6.4
   * 
   * @param imageDataUrl - Base64 data URL of the image
   * @returns Promise resolving to MaskResult
   */
  async regenerate(imageDataUrl: string): Promise<MaskResult> {
    // Temporarily disable cache
    const cacheEnabled = this.config.cacheEnabled;
    this.config.cacheEnabled = false;

    try {
      // Generate fresh mask
      const result = await this.generate(imageDataUrl);

      // Re-enable cache and store result
      this.config.cacheEnabled = cacheEnabled;
      if (cacheEnabled) {
        const imageHash = await this.hashImage(imageDataUrl);
        this.cache.set(imageHash, result);
      }

      return result;
    } finally {
      // Restore cache setting
      this.config.cacheEnabled = cacheEnabled;
    }
  }

  /**
   * Abort pending mask generation
   * 
   * Requirements: 6.1, 6.2
   */
  async abort(): Promise<void> {
    if (this.currentPredictionId) {
      await this.client.cancelPrediction(this.currentPredictionId);
      this.currentPredictionId = null;
    }
  }

  /**
   * Clear all cached masks
   * 
   * Requirements: 6.1
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Prefetch mask in background after image upload
   * 
   * This starts mask generation before the user explicitly requests it,
   * caching the result for instant display when needed.
   * 
   * Requirements: 3.1, 3.2, 3.3
   * 
   * @param imageDataUrl - Base64 data URL of the image
   */
  async prefetch(imageDataUrl: string): Promise<void> {
    if (!this.prefetchEnabled) {
      return;
    }

    try {
      // Validate image format first
      this.validateImageFormat(imageDataUrl);

      // Generate hash
      const imageHash = await this.hashImage(imageDataUrl);

      // Check if already cached or pending
      if (this.config.cacheEnabled && this.cache.has(imageHash)) {
        return;
      }

      if (this.pendingRequests.has(imageHash)) {
        return;
      }

      // Start generation in background (don't await)
      this.generate(imageDataUrl).catch(error => {
        // Silently fail prefetch - user can retry manually
        console.debug('Prefetch failed:', error);
      });
    } catch (error) {
      // Silently fail prefetch validation errors
      console.debug('Prefetch validation failed:', error);
    }
  }

  /**
   * Enable or disable prefetching
   * 
   * @param enabled - Whether to enable prefetching
   */
  setPrefetchEnabled(enabled: boolean): void {
    this.prefetchEnabled = enabled;
  }

  /**
   * Validate image format and size
   * 
   * Requirements: 5.4
   * 
   * @param imageDataUrl - Image data URL to validate
   * @throws SegmentationError if invalid
   */
  private validateImageFormat(imageDataUrl: string): void {
    // Check if input is provided (Requirement 5.4)
    if (!imageDataUrl || imageDataUrl.trim() === '') {
      throw this.createInputError('No image provided. Please upload an image.');
    }

    // Check if it's a data URL (Requirement 5.4)
    if (!imageDataUrl.startsWith('data:')) {
      throw this.createInputError('Invalid image format. Please use JPG or PNG.');
    }

    if (!imageDataUrl.startsWith('data:image/')) {
      throw this.createInputError('Invalid image format. Please use JPG or PNG.');
    }

    // Check supported formats (Requirement 5.4)
    const isJpeg = imageDataUrl.startsWith('data:image/jpeg') || 
                   imageDataUrl.startsWith('data:image/jpg');
    const isPng = imageDataUrl.startsWith('data:image/png');
    const isWebp = imageDataUrl.startsWith('data:image/webp');

    if (!isJpeg && !isPng && !isWebp) {
      throw this.createInputError('Unsupported image format. Please use JPG or PNG.');
    }

    // Check if data URL is properly formatted (Requirement 5.4)
    const parts = imageDataUrl.split(',');
    if (parts.length !== 2) {
      throw this.createInputError('Corrupted image data. Please try uploading again.');
    }

    const base64Data = parts[1];
    if (!base64Data || base64Data.length === 0) {
      throw this.createInputError('Empty image data. Please try uploading again.');
    }

    // Check size (rough estimate: base64 is ~1.37x original size) (Requirement 5.4)
    const base64Length = base64Data.length;
    const estimatedSize = (base64Length * 3) / 4;
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (estimatedSize > maxSize) {
      const sizeMB = (estimatedSize / (1024 * 1024)).toFixed(1);
      throw this.createInputError(`Image too large (${sizeMB}MB). Please use an image under 10MB.`);
    }

    // Check minimum size (Requirement 5.4)
    const minSize = 100; // 100 bytes minimum
    if (estimatedSize < minSize) {
      throw this.createInputError('Image file is too small or corrupted. Please try another image.');
    }
  }

  /**
   * Hash image for caching
   * 
   * Uses first 10KB of image data for performance
   * 
   * @param imageDataUrl - Image data URL
   * @returns Hash string
   */
  private async hashImage(imageDataUrl: string): Promise<string> {
    // Extract base64 data
    const base64Data = imageDataUrl.split(',')[1] || imageDataUrl;

    // Use first 10KB for hashing (performance optimization)
    const sampleSize = Math.min(base64Data.length, 10 * 1024);
    const sample = base64Data.substring(0, sampleSize);

    // Simple hash function (for demo - in production use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      const char = sample.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }

  /**
   * Sleep utility
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create validation error with user-friendly message
   * 
   * Requirements: 5.1, 5.4
   * 
   * @param errors - Validation error messages
   * @returns SegmentationError
   */
  private createValidationError(errors: string[]): SegmentationError {
    if (errors.length === 0) {
      return {
        type: 'validation',
        message: 'Mask validation failed. Please regenerate.',
        retryable: true
      };
    }

    // Get the first error and make it user-friendly
    const firstError = errors[0];
    let message = 'Mask validation failed. Please regenerate.';

    // Handle missing alpha channel (Requirement 5.1, 5.4)
    if (firstError.includes('no alpha channel') || firstError.includes('no transparency')) {
      message = 'Mask is invalid (no transparency). Please regenerate.';
    }
    // Handle dimension mismatch (Requirement 5.1, 5.4)
    else if (firstError.includes('Dimension mismatch') || firstError.includes('dimensions')) {
      message = "Mask dimensions don't match image. Please regenerate.";
    }
    // Handle all transparent mask (Requirement 5.4)
    else if (firstError.includes('completely transparent') || firstError.includes('no subject detected')) {
      message = 'No subject detected in mask. Text will appear on top.';
    }
    // Handle all opaque mask (Requirement 5.4)
    else if (firstError.includes('completely opaque') || firstError.includes('all opaque')) {
      message = 'Mask is invalid (no transparency). Please regenerate.';
    }
    // Handle noise/artifacts
    else if (firstError.includes('noise') || firstError.includes('artifacts')) {
      message = 'Mask quality is poor. Please regenerate.';
    }
    // Generic validation error
    else {
      message = `Mask validation failed: ${firstError}`;
    }

    return {
      type: 'validation',
      message,
      retryable: true
    };
  }

  /**
   * Create download error with user-friendly message
   * 
   * Requirements: 5.2
   * 
   * @param error - Original error
   * @returns SegmentationError
   */
  private createDownloadError(error: any): SegmentationError {
    let message = 'Unable to download mask. Please try again.';
    let retryable = true;

    if (error instanceof Error) {
      // Provide specific user-friendly messages based on error type
      if (error.message.includes('CORS') || error.message.includes('security')) {
        message = 'Unable to load mask due to security restrictions. Please regenerate.';
        retryable = true;
      } else if (error.message.includes('Network') || error.message.includes('connection')) {
        message = 'Network error while downloading mask. Please check your connection and try again.';
        retryable = true;
      } else if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        message = 'Unable to download mask. Please check your connection and try again.';
        retryable = true;
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        message = 'Mask not found. Please regenerate.';
        retryable = true;
      } else if (error.message.includes('Invalid') || error.message.includes('Empty')) {
        message = error.message; // Already user-friendly
        retryable = true;
      } else if (error.message.includes('alpha channel')) {
        message = 'Invalid mask received (no transparency). Please regenerate.';
        retryable = true;
      } else {
        // Generic error - ensure it has actionable language
        message = 'Unable to download mask. Please try again.';
        retryable = true;
      }
    }

    return {
      type: 'download',
      message,
      retryable
    };
  }

  /**
   * Create input validation error
   * 
   * @param message - Error message
   * @returns SegmentationError
   */
  private createInputError(message: string): SegmentationError {
    return {
      type: 'validation',
      message,
      retryable: false
    };
  }

  /**
   * Wrap generic error as SegmentationError
   * 
   * @param error - Original error
   * @returns SegmentationError
   */
  private wrapError(error: any): SegmentationError {
    const message = error instanceof Error 
      ? error.message 
      : 'Mask generation failed. Please try again.';

    return {
      type: 'replicate',
      message,
      retryable: true
    };
  }

  /**
   * Type guard for SegmentationError
   * 
   * @param error - Error to check
   * @returns True if error is SegmentationError
   */
  private isSegmentationError(error: any): error is SegmentationError {
    return error && 
           typeof error === 'object' && 
           'type' in error && 
           'message' in error && 
           'retryable' in error;
  }
}
