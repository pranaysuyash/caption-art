/**
 * Image loading utilities with error handling and retry mechanism
 */

export interface ImageLoadOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Timeout for image loading in milliseconds (default: 30000) */
  timeout?: number;
  /** Cross-origin setting (default: 'anonymous') */
  crossOrigin?: string | null;
}

export interface ImageLoadError extends Error {
  /** Number of retry attempts made */
  attempts: number;
  /** Original error that caused the failure */
  originalError?: Error;
}

/**
 * Load an image with error handling and retry mechanism
 * @param src - Image source URL or data URL
 * @param options - Loading options
 * @returns Promise that resolves to loaded HTMLImageElement
 * @throws {ImageLoadError} If image fails to load after all retries
 */
export async function loadImage(
  src: string,
  options: ImageLoadOptions = {}
): Promise<HTMLImageElement> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    crossOrigin = 'anonymous',
  } = options;

  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const image = await loadImageAttempt(src, timeout, crossOrigin);
      return image;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Image load attempt ${attempt + 1}/${maxRetries} failed:`, error);
      
      // Don't retry on the last attempt
      if (attempt < maxRetries - 1) {
        await delay(retryDelay);
      }
    }
  }
  
  // All retries failed
  const loadError = new Error(
    `Failed to load image after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  ) as ImageLoadError;
  loadError.attempts = maxRetries;
  loadError.originalError = lastError;
  throw loadError;
}

/**
 * Single attempt to load an image with timeout
 * @private
 */
function loadImageAttempt(
  src: string,
  timeout: number,
  crossOrigin: string | null
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    // Set cross-origin if specified
    if (crossOrigin !== null) {
      image.crossOrigin = crossOrigin;
    }
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Image load timeout after ${timeout}ms`));
    }, timeout);
    
    // Success handler
    const handleLoad = () => {
      cleanup();
      
      // Validate image dimensions
      if (image.naturalWidth === 0 || image.naturalHeight === 0) {
        reject(new Error('Image loaded but has invalid dimensions'));
        return;
      }
      
      resolve(image);
    };
    
    // Error handler
    const handleError = () => {
      cleanup();
      reject(new Error('Image failed to load'));
    };
    
    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeoutId);
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
    
    // Attach event listeners
    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);
    
    // Start loading
    image.src = src;
  });
}

/**
 * Delay utility for retry mechanism
 * @private
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate if an image is properly loaded
 * @param image - Image element to validate
 * @returns True if image is valid and loaded
 */
export function isImageLoaded(image: HTMLImageElement): boolean {
  return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
}

/**
 * Create an error message for image loading failures
 * @param error - The error that occurred
 * @returns User-friendly error message
 */
export function getImageLoadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const imageError = error as ImageLoadError;
    
    if (imageError.attempts) {
      return `Failed to load image after ${imageError.attempts} attempts. Please check your connection and try again.`;
    }
    
    if (error.message.includes('timeout')) {
      return 'Image loading timed out. Please try again or use a smaller image.';
    }
    
    if (error.message.includes('invalid dimensions')) {
      return 'The image file appears to be corrupted or invalid.';
    }
    
    return `Failed to load image: ${error.message}`;
  }
  
  return 'Failed to load image. Please try again.';
}
