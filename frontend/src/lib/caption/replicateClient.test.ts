/**
 * Unit tests for ReplicateClient
 * Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.1, 4.2, 4.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ReplicateClient, ReplicateError } from './replicateClient'
import * as retryHandler from './retryHandler'

// Mock fetch globally
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as any

// Mock retryWithBackoff to execute immediately without delay
// We can spy on it to verify it's called, but we replace implementation to avoid delays
vi.mock('./retryHandler', async () => {
  const actual = await vi.importActual('./retryHandler')
  return {
    ...actual,
    retryWithBackoff: vi.fn(async (fn) => fn())
  }
})

describe('ReplicateClient', () => {
  let client: ReplicateClient
  const testApiKey = 'test-api-key'
  const testImageDataUrl = 'data:image/png;base64,test-image-data'

  beforeEach(() => {
    vi.clearAllMocks()
    client = new ReplicateClient(testApiKey)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should throw error if API key is not provided', () => {
      expect(() => new ReplicateClient('')).toThrow('Replicate API key is required')
    })

    it('should create client with valid API key', () => {
      expect(() => new ReplicateClient(testApiKey)).not.toThrow()
    })
  })

  describe('createPrediction', () => {
    it('should create prediction successfully', async () => {
      const mockResponse = {
        id: 'test-prediction-id',
        status: 'starting',
        output: null,
        error: null
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await client.createPrediction(testImageDataUrl)

      expect(result).toEqual({
        id: 'test-prediction-id',
        status: 'starting',
        output: null,
        error: null
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.replicate.com/v1/predictions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Token ${testApiKey}`,
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should handle rate limiting (429)', async () => {
      // Mock fetch to return 429
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        json: async () => ({ detail: 'Rate limit exceeded' })
      })

      // Since we mock retryWithBackoff to run once, it will throw immediately
      // We need to verify that ReplicateClient throws the correct error
      await expect(client.createPrediction(testImageDataUrl)).rejects.toThrow(ReplicateError)
      await expect(client.createPrediction(testImageDataUrl).catch(e => e)).resolves.toMatchObject({
        statusCode: 429,
        retryAfter: 60,
        isRetryable: true
      })
    })

    it('should handle authentication errors (401)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid API key' })
      })

      await expect(client.createPrediction(testImageDataUrl)).rejects.toThrow(ReplicateError)
      await expect(client.createPrediction(testImageDataUrl).catch(e => e)).resolves.toMatchObject({
        message: expect.stringContaining('Authentication failed')
      })
    })

    it('should handle server errors (500) as retryable', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' })
      })

      await expect(client.createPrediction(testImageDataUrl)).rejects.toThrow(ReplicateError)
      await expect(client.createPrediction(testImageDataUrl).catch(e => e)).resolves.toMatchObject({
        statusCode: 500,
        isRetryable: true
      })
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(client.createPrediction(testImageDataUrl)).rejects.toThrow(ReplicateError)
      await expect(client.createPrediction(testImageDataUrl).catch(e => e)).resolves.toMatchObject({
        message: expect.stringContaining('Unable to connect'),
        isRetryable: true
      })
    })
  })

  describe('getPrediction', () => {
    it('should get prediction status successfully', async () => {
      const mockResponse = {
        id: 'test-prediction-id',
        status: 'processing',
        output: null,
        error: null
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await client.getPrediction('test-prediction-id')

      expect(result).toEqual({
        id: 'test-prediction-id',
        status: 'processing',
        output: null,
        error: null
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.replicate.com/v1/predictions/test-prediction-id',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Token ${testApiKey}`
          })
        })
      )
    })

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Prediction not found' })
      })

      await expect(client.getPrediction('invalid-id')).rejects.toThrow(ReplicateError)
      await expect(client.getPrediction('invalid-id').catch(e => e)).resolves.toMatchObject({
        message: expect.stringContaining('Resource not found')
      })
    })
  })

  describe('waitForCompletion', () => {
    it('should return output when prediction succeeds', async () => {
      // Mock getPrediction to return succeeded
      // Since waitForCompletion calls getPrediction, and we mock retryWithBackoff,
      // getPrediction will be called.
      // We need to mock fetch to return processing then succeeded?
      // But waitForCompletion has its own polling loop.
      // It calls getPrediction inside a loop.
      
      // First call: processing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'processing',
          output: null
        })
      })

      // Second call: succeeded
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'succeeded',
          output: 'A beautiful sunset over the ocean'
        })
      })

      // We need to mock setTimeout for waitForCompletion's polling loop
      // waitForCompletion uses `new Promise(resolve => setTimeout(resolve, pollInterval))`
      // We can use fake timers just for this, or mock global setTimeout
      vi.useFakeTimers()
      
      const promise = client.waitForCompletion('test-id', 5000)
      
      // Advance time for polling
      await vi.advanceTimersByTimeAsync(1000)
      
      const result = await promise
      expect(result).toBe('A beautiful sunset over the ocean')
      
      vi.useRealTimers()
    })

    it('should handle array output', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'succeeded',
          output: ['First caption', 'Second caption']
        })
      })

      const result = await client.waitForCompletion('test-id', 5000)

      expect(result).toBe('First caption')
    })

    it('should throw error when prediction fails', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'failed',
          error: 'Model failed to process image'
        })
      })

      await expect(client.waitForCompletion('test-id', 5000)).rejects.toThrow(ReplicateError)
      await expect(client.waitForCompletion('test-id', 5000).catch(e => e)).resolves.toMatchObject({
        message: expect.stringContaining('Unable to generate caption'),
        isRetryable: false
      })
    })

    it('should throw error when prediction is canceled', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'canceled'
        })
      })

      await expect(client.waitForCompletion('test-id', 5000)).rejects.toThrow(ReplicateError)
      await expect(client.waitForCompletion('test-id', 5000).catch(e => e)).resolves.toMatchObject({
        message: expect.stringContaining('canceled')
      })
    })

    it('should timeout after max attempts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'processing'
        })
      })

      vi.useFakeTimers()
      const promise = client.waitForCompletion('test-id', 2000)
      
      // Advance time past timeout
      await vi.advanceTimersByTimeAsync(3000)
      
      await expect(promise).rejects.toThrow(ReplicateError)
      await expect(promise.catch(e => e)).resolves.toMatchObject({
        message: expect.stringContaining('timed out'),
        isRetryable: true
      })
      vi.useRealTimers()
    })
  })

  describe('cancelPrediction', () => {
    it('should cancel prediction successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      await expect(client.cancelPrediction('test-id')).resolves.not.toThrow()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.replicate.com/v1/predictions/test-id/cancel',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    it('should not throw on cancel failure (best-effort)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' })
      })

      // Should not throw - cancellation is best-effort
      await expect(client.cancelPrediction('test-id')).resolves.not.toThrow()
    })
  })

  describe('error parsing', () => {
    it('should provide user-friendly error messages', async () => {
      const testCases = [
        { status: 400, expected: 'Invalid request' },
        { status: 401, expected: 'Authentication failed' },
        { status: 403, expected: 'Authentication failed' },
        { status: 404, expected: 'Resource not found' },
        { status: 429, expected: 'Too many requests' },
        { status: 500, expected: 'temporarily unavailable' },
        { status: 503, expected: 'temporarily unavailable' }
      ]

      for (const testCase of testCases) {
        mockFetch.mockResolvedValue({
          ok: false,
          status: testCase.status,
          headers: new Map(),
          json: async () => ({})
        })

        try {
          await client.createPrediction(testImageDataUrl)
          throw new Error('Should have thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(ReplicateError)
          expect((error as ReplicateError).message).toMatch(new RegExp(testCase.expected, 'i'))
        }
      }
    })
  })
})
