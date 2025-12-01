/**
 * Unit tests for OpenAIClient
 * Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenAIClient, OpenAIError, OpenAIConfig, RewriteRequest } from './openaiClient'
import { CaptionStyle } from './types'

// Mock fetch globally
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as any

describe('OpenAIClient', () => {
  let client: OpenAIClient
  const testConfig: OpenAIConfig = {
    apiKey: 'test-api-key',
    model: 'gpt-3.5-turbo',
    temperature: 0.8,
    maxTokens: 150
  }

  beforeEach(() => {
    vi.clearAllMocks()
    client = new OpenAIClient(testConfig)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should throw error if API key is not provided', () => {
      expect(() => new OpenAIClient({ ...testConfig, apiKey: '' })).toThrow('OpenAI API key is required')
    })

    it('should create client with valid config', () => {
      expect(() => new OpenAIClient(testConfig)).not.toThrow()
    })
  })

  describe('rewriteCaption', () => {
    const baseRequest: RewriteRequest = {
      baseCaption: 'A beautiful sunset over the ocean',
      styles: ['creative', 'funny', 'poetic'],
      maxLength: 100
    }

    it('should generate caption variants successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify([
              'A canvas of gold melting into the sea',
              'When the sun decided to take a dip',
              'Where day kisses night goodbye'
            ])
          }
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await client.rewriteCaption(baseRequest)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        text: 'A canvas of gold melting into the sea',
        style: 'creative'
      })
      expect(result[1]).toEqual({
        text: 'When the sun decided to take a dip',
        style: 'funny'
      })
      expect(result[2]).toEqual({
        text: 'Where day kisses night goodbye',
        style: 'poetic'
      })
    })

    it('should construct proper prompt with style instructions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(['test1', 'test2', 'test3'])
            }
          }]
        })
      })

      await client.rewriteCaption(baseRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${testConfig.apiKey}`,
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('creative')
        })
      )

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.messages).toHaveLength(2)
      expect(callBody.messages[0].role).toBe('system')
      expect(callBody.messages[1].role).toBe('user')
      expect(callBody.messages[1].content).toContain('Creative')
      expect(callBody.messages[1].content).toContain('Funny')
      expect(callBody.messages[1].content).toContain('Poetic')
    })

    it('should handle malformed JSON by extracting quoted strings', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Here are the captions: "First caption" and "Second caption" and "Third caption"'
          }
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await client.rewriteCaption(baseRequest)

      expect(result).toHaveLength(3)
      expect(result[0].text).toBe('First caption')
      expect(result[1].text).toBe('Second caption')
      expect(result[2].text).toBe('Third caption')
    })

    it('should handle rate limiting (429)', async () => {
      // Mock all retry attempts to return 429
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      })

      await expect(client.rewriteCaption(baseRequest)).rejects.toThrow(OpenAIError)
      await expect(client.rewriteCaption(baseRequest)).rejects.toMatchObject({
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
        json: async () => ({ error: { message: 'Invalid API key' } })
      })

      await expect(client.rewriteCaption(baseRequest)).rejects.toThrow(OpenAIError)
      await expect(client.rewriteCaption(baseRequest)).rejects.toMatchObject({
        message: expect.stringContaining('Authentication failed')
      })
    })

    it('should handle server errors (500) as retryable', async () => {
      // Mock all retry attempts to return 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal server error' } })
      })

      await expect(client.rewriteCaption(baseRequest)).rejects.toThrow(OpenAIError)
      await expect(client.rewriteCaption(baseRequest)).rejects.toMatchObject({
        statusCode: 500,
        isRetryable: true
      })
    }, 10000)

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(client.rewriteCaption(baseRequest)).rejects.toThrow(OpenAIError)
      await expect(client.rewriteCaption(baseRequest)).rejects.toMatchObject({
        message: expect.stringContaining('Unable to connect'),
        isRetryable: true
      })
    })

    it('should handle content policy violations with fallback captions', async () => {
      // Mock all retry attempts to return content policy violation (non-retryable)
      // The error message needs to contain "Unable to generate variations" to trigger fallback
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 'content_policy_violation',
            message: 'Unable to generate variations for this image.'
          }
        })
      })

      const result = await client.rewriteCaption(baseRequest)

      // Should return fallback captions instead of throwing
      expect(result).toHaveLength(3)
      expect(result[0].style).toBe('creative')
      expect(result[1].style).toBe('funny')
      expect(result[2].style).toBe('poetic')
    })

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'not a valid json array'
            }
          }]
        })
      })

      await expect(client.rewriteCaption(baseRequest)).rejects.toThrow(OpenAIError)
    })

    it('should handle empty response', async () => {
      // Mock all retry attempts to return empty response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: []
        })
      })

      await expect(client.rewriteCaption(baseRequest)).rejects.toThrow(OpenAIError)
      await expect(client.rewriteCaption(baseRequest)).rejects.toMatchObject({
        message: expect.stringContaining('Invalid response')
      })
    }, 10000)

    it('should handle abort signal', async () => {
      const abortController = new AbortController()
      
      // Create an AbortError
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      
      // Mock all retry attempts to throw abort error
      mockFetch.mockImplementation(() => {
        return Promise.reject(abortError)
      })

      await expect(
        client.rewriteCaption(baseRequest, abortController.signal)
      ).rejects.toThrow(OpenAIError)
      
      await expect(
        client.rewriteCaption(baseRequest, abortController.signal)
      ).rejects.toMatchObject({
        message: expect.stringContaining('canceled')
      })
    }, 10000)

    it('should trim whitespace from captions', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify([
              '  Caption with spaces  ',
              '\nCaption with newlines\n',
              '\tCaption with tabs\t'
            ])
          }
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await client.rewriteCaption(baseRequest)

      expect(result[0].text).toBe('Caption with spaces')
      expect(result[1].text).toBe('Caption with newlines')
      expect(result[2].text).toBe('Caption with tabs')
    })

    it('should handle all caption styles', async () => {
      const allStyles: CaptionStyle[] = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
      const request: RewriteRequest = {
        baseCaption: 'Test caption',
        styles: allStyles,
        maxLength: 100
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify([
                'Creative caption',
                'Funny caption',
                'Poetic caption',
                'Minimal caption',
                'Dramatic caption',
                'Quirky caption'
              ])
            }
          }]
        })
      })

      const result = await client.rewriteCaption(request)

      expect(result).toHaveLength(6)
      allStyles.forEach((style, index) => {
        expect(result[index].style).toBe(style)
      })
    })
  })

  describe('error messages', () => {
    it('should provide user-friendly error messages', async () => {
      const testCases = [
        { status: 400, expected: 'Invalid request' },
        { status: 401, expected: 'Authentication failed' },
        { status: 403, expected: 'Authentication failed' },
        { status: 429, expected: 'Service busy' },
        { status: 500, expected: 'temporarily unavailable' },
        { status: 503, expected: 'temporarily unavailable' }
      ]

      const request: RewriteRequest = {
        baseCaption: 'Test',
        styles: ['creative'],
        maxLength: 100
      }

      for (const testCase of testCases) {
        // Mock all retry attempts to return the same error
        mockFetch.mockResolvedValue({
          ok: false,
          status: testCase.status,
          headers: new Map(),
          json: async () => ({ error: {} })
        })

        try {
          await client.rewriteCaption(request)
          throw new Error('Should have thrown')
        } catch (error) {
          expect(error).toBeInstanceOf(OpenAIError)
          expect((error as OpenAIError).message).toMatch(new RegExp(testCase.expected, 'i'))
        }
      }
    }, 15000)
  })
})
