/**
 * Replicate API Client for BLIP image captioning
 * Requirements: 1.1, 1.2, 4.1, 4.2, 4.3
 */

import { retryWithBackoff } from './retryHandler'

/**
 * Replicate prediction status and response
 */
export interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string | string[]
  error?: string
}

/**
 * Custom error class for Replicate API errors
 * Requirements: 4.1, 4.2, 4.3
 */
export class ReplicateError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryAfter?: number,
    public isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'ReplicateError'
  }
}

/**
 * Parse error response and return user-friendly message
 * Requirements: 4.1, 4.3
 */
function parseErrorResponse(response: Response, errorData: any): string {
  const status = response.status
  
  // Rate limiting
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  
  // Authentication errors
  if (status === 401 || status === 403) {
    return 'Authentication failed. Please check your API key.'
  }
  
  // Not found
  if (status === 404) {
    return 'Resource not found. The prediction may have expired.'
  }
  
  // Bad request
  if (status === 400) {
    return errorData.detail || 'Invalid request. Please check your image format.'
  }
  
  // Server errors
  if (status >= 500) {
    return 'Caption service is temporarily unavailable. Please try again later.'
  }
  
  // Default message
  return errorData.detail || 'An unexpected error occurred. Please try again.'
}

/**
 * Check if error is a network/connection failure
 * Requirements: 4.1, 4.3
 */
function isNetworkError(error: any): boolean {
  return (
    error instanceof TypeError ||
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('Failed to fetch')
  )
}

/**
 * Client for interacting with Replicate API
 */
export class ReplicateClient {
  private apiKey: string
  private baseUrl = 'https://api.replicate.com/v1'
  private modelVersion = 'salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746'

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Replicate API key is required')
    }
    this.apiKey = apiKey
  }

  /**
   * Create a new prediction for image captioning
   * Requirements: 1.1, 4.1, 4.2, 4.3
   */
  async createPrediction(imageDataUrl: string): Promise<ReplicatePrediction> {
    try {
      return await retryWithBackoff(async () => {
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
                task: 'image_captioning'
              }
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const userMessage = parseErrorResponse(response, errorData)
            
            // Handle rate limiting - retryable
            if (response.status === 429) {
              const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
              throw new ReplicateError(
                userMessage,
                429,
                retryAfter,
                true // retryable
              )
            }
            
            // Server errors (5xx) are retryable
            const isRetryable = response.status >= 500
            
            throw new ReplicateError(
              userMessage,
              response.status,
              undefined,
              isRetryable
            )
          }

          const data = await response.json()
          return {
            id: data.id,
            status: data.status,
            output: data.output,
            error: data.error
          }
        } catch (error) {
          // Handle network/connection failures
          if (isNetworkError(error)) {
            throw new ReplicateError(
              'Unable to connect to caption service. Please check your internet connection.',
              undefined,
              undefined,
              true // retryable
            )
          }
          throw error
        }
      }, { maxRetries: 3, initialDelay: 1000, maxDelay: 10000 })
    } catch (error) {
      // Ensure we always throw a ReplicateError with user-friendly message
      if (error instanceof ReplicateError) {
        throw error
      }
      throw new ReplicateError(
        'Caption generation failed. Please try again.',
        undefined,
        undefined,
        false
      )
    }
  }

  /**
   * Get the status and result of a prediction
   * Requirements: 1.2, 4.1, 4.2, 4.3
   */
  async getPrediction(predictionId: string): Promise<ReplicatePrediction> {
    try {
      return await retryWithBackoff(async () => {
        try {
          const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Token ${this.apiKey}`,
              'Content-Type': 'application/json',
            }
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const userMessage = parseErrorResponse(response, errorData)
            
            // Handle rate limiting - retryable
            if (response.status === 429) {
              const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
              throw new ReplicateError(
                userMessage,
                429,
                retryAfter,
                true // retryable
              )
            }
            
            // Server errors (5xx) are retryable
            const isRetryable = response.status >= 500
            
            throw new ReplicateError(
              userMessage,
              response.status,
              undefined,
              isRetryable
            )
          }

          const data = await response.json()
          return {
            id: data.id,
            status: data.status,
            output: data.output,
            error: data.error
          }
        } catch (error) {
          // Handle network/connection failures
          if (isNetworkError(error)) {
            throw new ReplicateError(
              'Unable to connect to caption service. Please check your internet connection.',
              undefined,
              undefined,
              true // retryable
            )
          }
          throw error
        }
      }, { maxRetries: 3, initialDelay: 1000, maxDelay: 10000 })
    } catch (error) {
      // Ensure we always throw a ReplicateError with user-friendly message
      if (error instanceof ReplicateError) {
        throw error
      }
      throw new ReplicateError(
        'Failed to check caption status. Please try again.',
        undefined,
        undefined,
        false
      )
    }
  }

  /**
   * Wait for a prediction to complete with polling
   * Requirements: 1.3, 3.1, 3.2, 4.1, 4.3
   * 
   * Polls every 1 second for up to 30 seconds
   */
  async waitForCompletion(predictionId: string, timeout: number = 30000): Promise<string> {
    const pollInterval = 1000 // 1 second
    const maxAttempts = Math.floor(timeout / pollInterval)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const prediction = await this.getPrediction(predictionId)
      
      if (prediction.status === 'succeeded') {
        // Extract caption from output
        if (Array.isArray(prediction.output)) {
          return prediction.output[0] || ''
        }
        return prediction.output || ''
      }
      
      if (prediction.status === 'failed') {
        // Parse model failure error with user-friendly message
        const errorMessage = prediction.error || 'Caption generation failed'
        throw new ReplicateError(
          `Unable to generate caption: ${errorMessage}. Please try a different image.`,
          undefined,
          undefined,
          false // model failures are not retryable
        )
      }
      
      if (prediction.status === 'canceled') {
        throw new ReplicateError(
          'Caption generation was canceled.',
          undefined,
          undefined,
          false
        )
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
    
    throw new ReplicateError(
      'Caption generation timed out. Please try again.',
      undefined,
      undefined,
      true // timeouts are retryable
    )
  }

  /**
   * Cancel a pending prediction
   * Requirements: 3.5
   */
  async cancelPrediction(predictionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ReplicateError(
          errorData.detail || `Failed to cancel prediction: ${response.status}`,
          response.status
        )
      }
    } catch (error) {
      // Log error but don't throw - cancellation is best-effort
      console.warn('Failed to cancel prediction:', error)
    }
  }
}
