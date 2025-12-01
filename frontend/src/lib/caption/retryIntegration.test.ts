/**
 * Integration tests for retry logic with API clients
 * Requirements: 4.1, 4.2, 4.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ReplicateClient, ReplicateError } from './replicateClient'
import { OpenAIClient, OpenAIError } from './openaiClient'

describe('Retry Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ReplicateClient retry behavior', () => {
    it('should retry network errors up to 3 times', async () => {
      const client = new ReplicateClient('test-key')
      
      // Mock fetch to fail twice with network error, then succeed
      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new TypeError('Failed to fetch'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-id',
            status: 'starting',
            output: null,
            error: null
          })
        })
      })

      const result = await client.createPrediction('data:image/png;base64,test')
      
      expect(result.id).toBe('test-id')
      expect(callCount).toBe(3)
    })

    it('should retry server errors (5xx) up to 3 times', async () => {
      const client = new ReplicateClient('test-key')
      
      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ detail: 'Internal server error' })
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-id',
            status: 'starting',
            output: null,
            error: null
          })
        })
      })

      const result = await client.createPrediction('data:image/png;base64,test')
      
      expect(result.id).toBe('test-id')
      expect(callCount).toBe(3)
    })

    it('should NOT retry client errors (400)', async () => {
      const client = new ReplicateClient('test-key')
      
      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ detail: 'Bad request' })
        })
      })

      await expect(client.createPrediction('data:image/png;base64,test'))
        .rejects.toThrow(ReplicateError)
      
      // Should only be called once (no retries)
      expect(callCount).toBe(1)
    })

    it('should retry rate limit errors (429)', async () => {
      const client = new ReplicateClient('test-key')
      
      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Map([['Retry-After', '1']]),
            json: () => Promise.resolve({ detail: 'Rate limit exceeded' })
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-id',
            status: 'starting',
            output: null,
            error: null
          })
        })
      })

      const result = await client.createPrediction('data:image/png;base64,test')
      
      expect(result.id).toBe('test-id')
      expect(callCount).toBe(2)
    })
  })

  describe('OpenAIClient retry behavior', () => {
    it('should retry network errors up to 2 times', async () => {
      const client = new OpenAIClient({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        maxTokens: 150
      })
      
      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 1) {
          return Promise.reject(new TypeError('Failed to fetch'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: '["creative caption", "funny caption", "poetic caption"]'
              }
            }]
          })
        })
      })

      const result = await client.rewriteCaption({
        baseCaption: 'test caption',
        styles: ['creative', 'funny', 'poetic'],
        maxLength: 100
      })
      
      expect(result).toHaveLength(3)
      expect(callCount).toBe(2)
    })

    it('should retry server errors (5xx) up to 2 times', async () => {
      const client = new OpenAIClient({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        maxTokens: 150
      })
      
      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: () => Promise.resolve({ error: { message: 'Service unavailable' } })
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: '["creative caption", "funny caption"]'
              }
            }]
          })
        })
      })

      const result = await client.rewriteCaption({
        baseCaption: 'test caption',
        styles: ['creative', 'funny'],
        maxLength: 100
      })
      
      expect(result).toHaveLength(2)
      expect(callCount).toBe(2)
    })

    it('should NOT retry client errors (400)', async () => {
      const client = new OpenAIClient({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        maxTokens: 150
      })
      
      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: { message: 'Bad request' } })
        })
      })

      await expect(client.rewriteCaption({
        baseCaption: 'test caption',
        styles: ['creative'],
        maxLength: 100
      })).rejects.toThrow(OpenAIError)
      
      // Should only be called once (no retries)
      expect(callCount).toBe(1)
    })
  })
})
