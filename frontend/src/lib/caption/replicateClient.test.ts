/**
 * Unit tests for ReplicateClient
 * Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.1, 4.2, 4.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ReplicateClient, ReplicateError } from './replicateClient'

// Mock fetch globally
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as any

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
      // Mock all retry attempts to return 429
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        json: async () => ({ detail: 'Rate limit exceeded' })
      })

      await expect(client.createPrediction(testImageDataUrl)).rejects.toThrow(ReplicateError)
      await expect(client.createPrediction(testImageDataUrl)).rejects.toMatchObject({
        statusCode: 429,
        retryAfter: 60,
        isRetryable: true
      })
    }, 10000)

    it('should handle authentication errors (401)', async () => {
      // Mock all retry attempts to return 401 (non-retryable)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid API key' })
      })

      await expect(client.createPrediction(testImageDataUrl)).rejects.toThrow(ReplicateError)
      await expect(client.createPrediction(testImageDataUrl)).rejects.toMatchObject({
        message: expect.stringContaining('Authentication failed')
      })
    })

    it('should handle server errors (500) as retryable', async () => {
      // Mock all retry attempts to return 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' })
      })

      await expect(client.createPrediction(testImageDataUrl)).rejects.toThrow(ReplicateError)
      await expect(client.createPrediction(testImageDataUrl)).rejects.toMatchObject({
        statusCode: 500,
        isRetryable: true
      })
    }, 10000)

    it('should handle network errors', async () => {
      // Mock all retry attempts to throw network error
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(client.createPrediction(testImageDataUrl)).rejects.toThrow(ReplicateError)
      await expect(client.createPrediction(testImageDataUrl)).rejects.toMatchObject({
        message: expect.stringContaining('Unable to connect'),
        isRetryable: true
      })
    }, 10000)
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
      // Mock all retry attempts to return 404 (non-retryable)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Prediction not found' })
      })

      await expect(client.getPrediction('invalid-id')).rejects.toThrow(ReplicateError)
      await expect(client.getPrediction('invalid-id')).rejects.toMatchObject({
        message: expect.stringContaining('Resource not found')
      })
    })
  })

  describe('waitForCompletion', () => {
    it('should return output when prediction succeeds', async () => {
      // First poll: processing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'processing',
          output: null
        })
      })

      // Second poll: succeeded
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'succeeded',
          output: 'A beautiful sunset over the ocean'
        })
      })

      const result = await client.waitForCompletion('test-id', 5000)

      expect(result).toBe('A beautiful sunset over the ocean')
      expect(mockFetch).toHaveBeenCalledTimes(2)
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
      // Mock all retry attempts to return failed status
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'failed',
          error: 'Model failed to process image'
        })
      })

      await expect(client.waitForCompletion('test-id', 5000)).rejects.toThrow(ReplicateError)
      await expect(client.waitForCompletion('test-id', 5000)).rejects.toMatchObject({
        message: expect.stringContaining('Unable to generate caption'),
        isRetryable: false
      })
    })

    it('should throw error when prediction is canceled', async () => {
      // Mock all retry attempts to return canceled status
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'canceled'
        })
      })

      await expect(client.waitForCompletion('test-id', 5000)).rejects.toThrow(ReplicateError)
      await expect(client.waitForCompletion('test-id', 5000)).rejects.toMatchObject({
        message: expect.stringContaining('canceled')
      })
    })

    it('should timeout after max attempts', async () => {
      // Mock all polls to return processing status
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id',
          status: 'processing'
        })
      })

      // Use short timeout for faster test
      await expect(client.waitForCompletion('test-id', 2000)).rejects.toThrow(ReplicateError)
      await expect(client.waitForCompletion('test-id', 2000)).rejects.toMatchObject({
        message: expect.stringContaining('timed out'),
        isRetryable: true
      })
    }, 10000)
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
        // Mock all retry attempts to return the same error
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
    }, 15000)
  })
})
