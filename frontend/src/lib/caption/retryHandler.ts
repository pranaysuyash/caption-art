/**
 * Retry handler with exponential backoff
 * Requirements: 4.1, 4.2
 */

export interface RetryOptions {
  maxRetries: number
  initialDelay: number
  maxDelay: number
}

/**
 * Determine if an error is retryable
 * Requirements: 4.1, 4.2, 4.3
 */
export function isRetryableError(error: any): boolean {
  // Check if error has explicit isRetryable flag (from ReplicateError)
  if (error.isRetryable !== undefined) {
    return error.isRetryable
  }
  
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  
  // Check for rate limiting (429)
  if (error.statusCode === 429 || error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
    return true
  }
  
  // Server errors (5xx) are retryable
  if (error.statusCode >= 500 || error.message?.match(/50\d/)) {
    return true
  }
  
  // Client errors (4xx except 429) are not retryable
  if ((error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) || error.message?.match(/4[0-8]\d/)) {
    return false
  }
  
  return false
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxRetries: 3, initialDelay: 1000, maxDelay: 10000 }
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error
      }
      
      // Don't delay after last attempt
      if (attempt < options.maxRetries - 1) {
        const delay = Math.min(
          options.initialDelay * Math.pow(2, attempt),
          options.maxDelay
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError!
}
