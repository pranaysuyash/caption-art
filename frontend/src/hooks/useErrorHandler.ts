/**
 * useErrorHandler - Hook for error handling with toast notifications
 * Requirements: 1.1, 1.2, 3.1, 3.3
 * 
 * Provides easy-to-use error handling with:
 * - Automatic error processing
 * - Toast notifications
 * - Retry support
 * - Recovery actions
 */

import { useState, useCallback } from 'react'
import { errorManager, type ErrorInfo } from '../lib/errors/ErrorManager'

export interface UseErrorHandlerOptions {
  operation: string
  onRetry?: () => void | Promise<void>
  maxRetries?: number
}

export function useErrorHandler(options: UseErrorHandlerOptions) {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  /**
   * Handle an error with automatic processing and toast display
   */
  const handleError = useCallback(
    (error: Error | unknown, context?: Record<string, any>) => {
      const errorInfo = errorManager.processError(error, options.operation, {
        retryCount,
        details: context,
      })

      setCurrentError(errorInfo)
      return errorInfo
    },
    [options.operation, retryCount]
  )

  /**
   * Retry the failed operation
   */
  const retry = useCallback(async () => {
    if (!options.onRetry) {
      console.warn('No retry handler provided')
      return
    }

    if (retryCount >= (options.maxRetries || 3)) {
      console.warn('Max retries exceeded')
      return
    }

    setRetryCount((prev) => prev + 1)

    try {
      await options.onRetry()
      // Success - clear error
      setCurrentError(null)
      setRetryCount(0)
    } catch (err) {
      // Handle retry failure
      handleError(err, { isRetry: true })
    }
  }, [options.onRetry, options.maxRetries, retryCount, handleError])

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setCurrentError(null)
    setRetryCount(0)
  }, [])

  /**
   * Reset retry count
   */
  const resetRetries = useCallback(() => {
    setRetryCount(0)
  }, [])

  return {
    currentError,
    handleError,
    retry,
    clearError,
    resetRetries,
    retryCount,
  }
}

/**
 * Wrapper function for async operations with automatic error handling
 */
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  onError?: (errorInfo: ErrorInfo) => void
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const errorInfo = errorManager.processError(error, operation)
    onError?.(errorInfo)
    return null
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: string,
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      const errorInfo = errorManager.processError(error, operation, {
        retryCount: attempt,
      })

      // Don't retry if not retryable
      if (!errorInfo.isRetryable) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
