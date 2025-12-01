/**
 * Tests for retry handler with exponential backoff
 * Requirements: 4.1, 4.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retryWithBackoff, isRetryableError } from './retryHandler'

describe('retryHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkError = new TypeError('Failed to fetch')
      expect(isRetryableError(networkError)).toBe(true)
    })

    it('should identify rate limit errors (429) as retryable', () => {
      const rateLimitError = { statusCode: 429, message: 'Too many requests' }
      expect(isRetryableError(rateLimitError)).toBe(true)
    })

    it('should identify server errors (5xx) as retryable', () => {
      const serverError = { statusCode: 500, message: 'Internal server error' }
      expect(isRetryableError(serverError)).toBe(true)
      
      const serviceUnavailable = { statusCode: 503, message: 'Service unavailable' }
      expect(isRetryableError(serviceUnavailable)).toBe(true)
    })

    it('should not retry client errors (400)', () => {
      const badRequest = { statusCode: 400, message: 'Bad request' }
      expect(isRetryableError(badRequest)).toBe(false)
      
      const notFound = { statusCode: 404, message: 'Not found' }
      expect(isRetryableError(notFound)).toBe(false)
    })

    it('should respect explicit isRetryable flag', () => {
      const retryableError = { isRetryable: true, message: 'Custom error' }
      expect(isRetryableError(retryableError)).toBe(true)
      
      const nonRetryableError = { isRetryable: false, message: 'Custom error' }
      expect(isRetryableError(nonRetryableError)).toBe(false)
    })
  })

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      
      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000
      })
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry up to maxRetries times for retryable errors', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce({ statusCode: 500, isRetryable: true })
        .mockRejectedValueOnce({ statusCode: 500, isRetryable: true })
        .mockResolvedValue('success')
      
      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100
      })
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should use exponential backoff delays', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce({ statusCode: 500, isRetryable: true })
        .mockRejectedValueOnce({ statusCode: 500, isRetryable: true })
        .mockResolvedValue('success')
      
      const startTime = Date.now()
      
      await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000
      })
      
      const duration = Date.now() - startTime
      
      // Should have delays of 100ms and 200ms (exponential: 100 * 2^0, 100 * 2^1)
      // Total should be at least 300ms
      expect(duration).toBeGreaterThanOrEqual(250)
    })

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue({ statusCode: 400, isRetryable: false })
      
      await expect(retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100
      })).rejects.toMatchObject({ statusCode: 400 })
      
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should throw last error after all retries exhausted', async () => {
      const lastError = { statusCode: 500, isRetryable: true, message: 'Final error' }
      const fn = vi.fn()
        .mockRejectedValueOnce({ statusCode: 500, isRetryable: true })
        .mockRejectedValueOnce({ statusCode: 500, isRetryable: true })
        .mockRejectedValue(lastError)
      
      await expect(retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100
      })).rejects.toMatchObject(lastError)
      
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should respect maxDelay cap', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce({ statusCode: 500, isRetryable: true })
        .mockRejectedValueOnce({ statusCode: 500, isRetryable: true })
        .mockResolvedValue('success')
      
      const startTime = Date.now()
      
      await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 500 // Cap at 500ms
      })
      
      const duration = Date.now() - startTime
      
      // Even though exponential would be 1000ms + 2000ms, it should be capped
      // Should be around 1000ms (first delay capped to 500) + 500ms (second delay capped)
      expect(duration).toBeLessThan(1500)
    })
  })
})
