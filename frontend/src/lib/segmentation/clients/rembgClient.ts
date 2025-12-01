/**
 * RembgClient - Client for interacting with Replicate's rembg model API
 * 
 * This client handles:
 * - Creating predictions for background removal
 * - Polling for prediction completion
 * - Error handling and retries
 * - Cancellation of pending predictions
 */

import { SegmentationError } from '../types';

/**
 * Replicate prediction response structure
 */
export interface RembgPrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[]; // URL to mask PNG (can be string or array)
  error?: string;
  metrics?: {
    predict_time?: number;
  };
}

/**
 * Client for Replicate rembg API
 */
export class RembgClient {
  private apiKey: string;
  private baseUrl = 'https://api.replicate.com/v1';
  private modelVersion = 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003';
  private abortController: AbortController | null = null;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Replicate API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Create a new prediction for background removal with retry logic
   * Requirements: 1.1, 1.2, 5.1, 5.2, 5.3
   */
  async createPrediction(imageDataUrl: string, maxRetries: number = 3): Promise<RembgPrediction> {
    this.abortController = new AbortController();

    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/predictions`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: this.modelVersion,
            input: {
              image: imageDataUrl,
            },
          }),
          signal: this.abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = this.createSegmentationError(response.status, errorData);
          
          // Don't retry if not retryable (e.g., auth errors)
          if (!error.retryable) {
            throw error;
          }
          
          // Handle rate limiting with retry-after
          if (error.retryAfter && attempt < maxRetries - 1) {
            await this.sleep(error.retryAfter * 1000);
            continue;
          }
          
          lastError = error;
          
          // Retry with exponential backoff for retryable errors
          if (attempt < maxRetries - 1) {
            await this.sleep(Math.pow(2, attempt) * 1000);
            continue;
          }
          
          throw error;
        }

        const prediction: RembgPrediction = await response.json();
        return prediction;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw this.createSegmentationError(0, { detail: 'Request was cancelled' });
        }
        
        // If it's already a SegmentationError, check if retryable
        if (this.isSegmentationError(error)) {
          if (!error.retryable) {
            throw error;
          }
          lastError = error;
          
          // Retry with exponential backoff
          if (attempt < maxRetries - 1) {
            await this.sleep(Math.pow(2, attempt) * 1000);
            continue;
          }
        }
        
        lastError = error;
        
        // For network errors, retry
        if (attempt < maxRetries - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
    }

    // All retries exhausted
    throw lastError || this.createSegmentationError(0, { 
      detail: 'Unable to connect to mask service. Please try again later.' 
    });
  }

  /**
   * Get the current status of a prediction
   * Requirements: 1.1, 1.2
   */
  async getPrediction(predictionId: string): Promise<RembgPrediction> {
    try {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createSegmentationError(response.status, errorData);
      }

      const prediction: RembgPrediction = await response.json();
      return prediction;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createSegmentationError(0, { detail: 'Request was cancelled' });
      }
      throw error;
    }
  }

  /**
   * Cancel a pending prediction
   * Requirements: 6.1, 6.2
   */
  async cancelPrediction(predictionId: string): Promise<void> {
    try {
      // Abort any pending requests
      if (this.abortController) {
        this.abortController.abort();
      }

      // Call Replicate API to cancel the prediction
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Cancellation endpoint may return 200 or 404 if already complete
      if (!response.ok && response.status !== 404) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Failed to cancel prediction:', errorData);
      }

      // Clean up resources
      this.cleanup();
    } catch (error) {
      console.warn('Error cancelling prediction:', error);
      // Still clean up even if cancellation fails
      this.cleanup();
    }
  }

  /**
   * Clean up resources
   * Requirements: 6.1, 6.2
   */
  private cleanup(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Wait for prediction to complete with polling
   * Requirements: 1.3, 3.1, 3.2, 5.1, 5.4
   */
  async waitForCompletion(predictionId: string, timeout: number = 45000): Promise<string> {
    const maxAttempts = 45;
    const pollInterval = 1000; // 1 second
    const startTime = Date.now();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Check timeout (Requirement 3.1, 3.3)
      if (Date.now() - startTime > timeout) {
        throw this.createTimeoutError();
      }

      try {
        const prediction = await this.getPrediction(predictionId);

        // Handle succeeded status
        if (prediction.status === 'succeeded') {
          const maskUrl = this.extractMaskUrl(prediction.output);
          if (!maskUrl) {
            // No subject detected (Requirement 5.4)
            throw this.createSegmentationError(0, { 
              detail: 'No subject detected. Text will appear on top of image.' 
            });
          }
          return maskUrl;
        }

        // Handle failed status (Requirement 5.1)
        if (prediction.status === 'failed') {
          const errorMessage = prediction.error || 'Mask generation failed. Please try again.';
          // Sanitize and provide user-friendly error
          throw this.createSegmentationError(0, { detail: errorMessage });
        }

        // Handle canceled status
        if (prediction.status === 'canceled') {
          throw this.createSegmentationError(0, { detail: 'Mask generation was cancelled.' });
        }

        // Wait before next poll
        await this.sleep(pollInterval);
      } catch (error) {
        // If it's already a SegmentationError, re-throw it
        if (this.isSegmentationError(error)) {
          throw error;
        }

        // Handle network errors during polling (Requirement 5.5)
        if (error instanceof Error && error.name === 'AbortError') {
          throw this.createSegmentationError(0, { detail: 'Request was cancelled' });
        }

        // For other errors during polling, retry if we have attempts left
        if (attempt < maxAttempts - 1) {
          await this.sleep(pollInterval);
          continue;
        }

        // If we're out of retries, throw a network error
        throw this.createSegmentationError(0, { 
          detail: 'Unable to connect to mask service. Please try again.' 
        });
      }
    }

    // Max attempts reached (Requirement 3.1, 3.3)
    throw this.createTimeoutError();
  }

  /**
   * Extract mask URL from prediction output
   * Requirements: 1.3
   */
  private extractMaskUrl(output: string | string[] | undefined): string | null {
    if (!output) {
      return null;
    }

    // Handle array output (take first URL)
    if (Array.isArray(output)) {
      return output.length > 0 ? output[0] : null;
    }

    // Handle string output
    return output;
  }

  /**
   * Create a timeout error
   * Requirements: 3.1, 3.3
   */
  private createTimeoutError(): SegmentationError {
    return {
      type: 'timeout',
      message: 'Mask generation timed out. Please try again.',
      retryable: true,
    };
  }

  /**
   * Sleep utility for polling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a SegmentationError from API response
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  private createSegmentationError(status: number, errorData: any): SegmentationError {
    // Handle rate limiting (Requirement 5.3)
    if (status === 429) {
      const retryAfter = errorData.retry_after || 60;
      return {
        type: 'replicate',
        message: `Too many requests. Please wait ${retryAfter} seconds.`,
        retryable: true,
        retryAfter,
      };
    }

    // Handle connection failures (Requirement 5.1, 5.5)
    if (status === 0 || status >= 500) {
      return {
        type: 'network',
        message: 'Unable to connect to mask service. Retrying...',
        retryable: true,
      };
    }

    // Handle authentication errors (Requirement 5.1)
    if (status === 401 || status === 403) {
      return {
        type: 'replicate',
        message: 'Authentication failed. Please check your API key.',
        retryable: false,
      };
    }

    // Parse error message first to check for specific conditions (Requirement 5.1, 5.4)
    const errorMessage = errorData.detail || errorData.error || '';
    
    // Check for "no subject detected" type errors BEFORE handling 400 (Requirement 5.4)
    if (errorMessage.toLowerCase().includes('no subject') || 
        errorMessage.toLowerCase().includes('no foreground') ||
        errorMessage.toLowerCase().includes('empty') ||
        errorMessage.toLowerCase().includes('nothing detected')) {
      return {
        type: 'replicate',
        message: 'No subject detected. Text will appear on top of image.',
        retryable: false,
      };
    }

    // Handle bad request errors (Requirement 5.4)
    if (status === 400) {
      return {
        type: 'replicate',
        message: `Invalid request: ${errorMessage || 'Please check your image format.'}`,
        retryable: false,
      };
    }

    // Check for timeout errors (Requirement 5.1)
    if (errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('timed out')) {
      return {
        type: 'timeout',
        message: 'Mask generation timed out. Please try again.',
        retryable: true,
      };
    }

    // Check for model capacity errors (Requirement 5.1)
    if (errorMessage.toLowerCase().includes('capacity') ||
        errorMessage.toLowerCase().includes('overloaded')) {
      return {
        type: 'replicate',
        message: 'Service is currently busy. Please try again in a moment.',
        retryable: true,
      };
    }

    // Handle other errors with user-friendly messages (Requirement 5.1)
    const message = errorMessage || 'Mask generation failed. Please try again.';
    
    // Sanitize error message to be user-friendly (no stack traces or technical details)
    const userFriendlyMessage = this.sanitizeErrorMessage(message);
    
    return {
      type: 'replicate',
      message: userFriendlyMessage,
      retryable: status >= 500,
    };
  }

  /**
   * Sanitize error message to be user-friendly
   * Removes technical details, stack traces, and API-specific jargon
   * Requirements: 5.1
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove stack traces
    const lines = message.split('\n');
    const firstLine = lines[0];

    // Remove technical prefixes
    const cleaned = firstLine
      .replace(/^Error:\s*/i, '')
      .replace(/^Exception:\s*/i, '')
      .replace(/^TypeError:\s*/i, '')
      .replace(/^ReferenceError:\s*/i, '')
      .replace(/^NetworkError:\s*/i, '');

    // If message is too technical or empty, provide generic message
    if (!cleaned || 
        cleaned.length < 5 || 
        cleaned.includes('undefined') ||
        cleaned.includes('null') ||
        cleaned.includes('{}') ||
        cleaned.includes('[object Object]')) {
      return 'Mask generation failed. Please try again.';
    }

    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  /**
   * Type guard for SegmentationError
   */
  private isSegmentationError(error: any): error is SegmentationError {
    return error && 
           typeof error === 'object' && 
           'type' in error && 
           'message' in error && 
           'retryable' in error;
  }
}
