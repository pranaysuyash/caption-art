/**
 * useProgress - Hook for progress tracking
 * Requirements: 1.3, 6.1, 6.2, 6.3, 6.4, 6.6
 * 
 * Provides easy-to-use progress tracking with:
 * - Automatic progress updates
 * - Time estimation
 * - Cancellation support
 * - Step tracking
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ProgressTracker,
  type ProgressInfo,
  type ProgressTrackerOptions,
} from '../lib/progress/ProgressTracker'

export interface UseProgressOptions {
  operation: string
  steps?: string[]
  canCancel?: boolean
  onComplete?: () => void
  onError?: (error: Error) => void
  onCancel?: () => void
}

export function useProgress(options: UseProgressOptions) {
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null)
  const trackerRef = useRef<ProgressTracker | null>(null)

  // Initialize tracker
  useEffect(() => {
    const trackerOptions: ProgressTrackerOptions = {
      operation: options.operation,
      canCancel: options.canCancel,
      onProgress: (info) => setProgressInfo(info),
      onComplete: options.onComplete,
      onError: options.onError,
      onCancel: options.onCancel,
    }

    if (options.steps) {
      trackerOptions.steps = options.steps.map((name, index) => ({
        id: `step_${index}`,
        name,
        weight: 1,
        status: 'pending',
      }))
    }

    trackerRef.current = new ProgressTracker(trackerOptions)

    return () => {
      trackerRef.current = null
    }
  }, [options.operation, options.steps, options.canCancel])

  /**
   * Start tracking progress
   */
  const start = useCallback(() => {
    trackerRef.current?.start()
  }, [])

  /**
   * Update progress percentage
   */
  const updateProgress = useCallback((percentage: number, message?: string) => {
    trackerRef.current?.updateProgress(percentage, message)
  }, [])

  /**
   * Complete current step
   */
  const completeStep = useCallback((stepId?: string) => {
    trackerRef.current?.completeStep(stepId)
  }, [])

  /**
   * Mark current step as error
   */
  const errorStep = useCallback((stepId?: string, error?: Error) => {
    trackerRef.current?.errorStep(stepId, error)
  }, [])

  /**
   * Complete the operation
   */
  const complete = useCallback((message?: string) => {
    trackerRef.current?.complete(message)
  }, [])

  /**
   * Mark operation as error
   */
  const error = useCallback((err?: Error) => {
    trackerRef.current?.error(err)
  }, [])

  /**
   * Cancel the operation
   */
  const cancel = useCallback(() => {
    trackerRef.current?.cancel()
  }, [])

  /**
   * Check if cancellation was requested
   */
  const isCancelRequested = useCallback((): boolean => {
    return trackerRef.current?.isCancelRequested() || false
  }, [])

  /**
   * Reset tracker
   */
  const reset = useCallback(() => {
    trackerRef.current?.reset()
    setProgressInfo(null)
  }, [])

  return {
    progressInfo,
    start,
    updateProgress,
    completeStep,
    errorStep,
    complete,
    error,
    cancel,
    isCancelRequested,
    reset,
    isRunning: progressInfo?.state === 'running',
    isComplete: progressInfo?.state === 'success',
    isError: progressInfo?.state === 'error',
    isCancelled: progressInfo?.state === 'cancelled',
  }
}

/**
 * Wrapper for async operations with automatic progress tracking
 */
export async function withProgress<T>(
  operation: string,
  fn: (updateProgress: (percentage: number) => void) => Promise<T>,
  onProgress?: (info: ProgressInfo) => void
): Promise<T> {
  const tracker = new ProgressTracker({
    operation,
    onProgress,
  })

  tracker.start()

  try {
    const result = await fn((percentage) => tracker.updateProgress(percentage))
    tracker.complete()
    return result
  } catch (error) {
    tracker.error(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Wrapper for multi-step operations with automatic step tracking
 */
export async function withSteps<T>(
  operation: string,
  steps: string[],
  fn: (completeStep: () => void, checkCancel: () => boolean) => Promise<T>,
  options?: {
    canCancel?: boolean
    onProgress?: (info: ProgressInfo) => void
    onCancel?: () => void
  }
): Promise<T> {
  const tracker = new ProgressTracker({
    operation,
    steps: steps.map((name, index) => ({
      id: `step_${index}`,
      name,
      weight: 1,
      status: 'pending',
    })),
    canCancel: options?.canCancel,
    onProgress: options?.onProgress,
    onCancel: options?.onCancel,
  })

  tracker.start()

  try {
    const result = await fn(
      () => tracker.completeStep(),
      () => tracker.isCancelRequested()
    )

    if (tracker.isCancelRequested()) {
      tracker.cancel()
      throw new Error('Operation cancelled')
    }

    tracker.complete()
    return result
  } catch (error) {
    if (tracker.isCancelRequested()) {
      tracker.cancel()
    } else {
      tracker.error(error instanceof Error ? error : new Error(String(error)))
    }
    throw error
  }
}

/**
 * Example usage with batch processing
 */
export async function processBatchWithProgress<T, R>(
  operation: string,
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options?: {
    canCancel?: boolean
    onProgress?: (info: ProgressInfo) => void
    onItemComplete?: (result: R, index: number) => void
  }
): Promise<R[]> {
  const results: R[] = []

  await withProgress(
    operation,
    async (updateProgress) => {
      for (let i = 0; i < items.length; i++) {
        // Check for cancellation
        const percentage = (i / items.length) * 100
        updateProgress(percentage)

        // Process item
        const result = await processor(items[i], i)
        results.push(result)

        options?.onItemComplete?.(result, i)
      }

      updateProgress(100)
    },
    options?.onProgress
  )

  return results
}
