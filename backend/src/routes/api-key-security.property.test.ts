import { describe, it, expect, beforeAll, vi } from 'vitest'
import * as fc from 'fast-check'
import request from 'supertest'
import { Express } from 'express'
import * as replicateService from '../services/replicate'
import * as openaiService from '../services/openai'
import * as gumroadService from '../services/gumroad'

/**
 * Feature: platform-agnostic-backend, Property 3: API key security
 *
 * Property: For any API response, it should not contain API keys or tokens
 * in the response body or headers
 *
 * Validates: Requirements 2.2
 */

describe('Property 3: API key security', () => {
  let app: Express

  beforeAll(async () => {
    // Dynamic import from index to break circular dependency
    const serverModule = await import('../index')
    const createServer =
      (serverModule as any).createServer ||
      (serverModule as any).default?.createServer

    // Mock external services to prevent real API calls during property tests
    vi.spyOn(replicateService, 'generateBaseCaption').mockResolvedValue(
      'A test caption'
    )
    vi.spyOn(replicateService, 'generateMask').mockResolvedValue(
      'https://example.com/mask.png'
    )
    vi.spyOn(openaiService, 'rewriteCaption').mockResolvedValue([
      'Variant 1',
      'Variant 2',
      'Variant 3',
    ])
    vi.spyOn(gumroadService, 'verifyLicense').mockResolvedValue({
      valid: true,
      email: 'test@example.com',
    })

    // Disable rate limiter for property tests that run 100 iterations
    app = createServer({ enableRateLimiter: false })
  })

  // Patterns that might indicate API keys or tokens
  const API_KEY_PATTERNS = [
    /REPLICATE_API_TOKEN/i,
    /OPENAI_API_KEY/i,
    /GUMROAD_ACCESS_TOKEN/i,
    /GUMROAD_PRODUCT_PERMALINK/i,
    /r8_[a-zA-Z0-9]+/, // Replicate API token pattern
    /sk-[a-zA-Z0-9]+/, // OpenAI API key pattern
    /Bearer\s+[a-zA-Z0-9_-]+/i, // Bearer token pattern
    /api[_-]?key[:\s=]+[a-zA-Z0-9_-]+/i,
    /token[:\s=]+[a-zA-Z0-9_-]+/i,
    /secret[:\s=]+[a-zA-Z0-9_-]+/i,
  ]

  /**
   * Helper function to check if a string contains any API key patterns
   */
  function containsApiKey(text: string): boolean {
    return API_KEY_PATTERNS.some((pattern) => pattern.test(text))
  }

  /**
   * Helper function to recursively search for API keys in an object
   */
  function searchForApiKeys(obj: any): string[] {
    const found: string[] = []

    if (typeof obj === 'string') {
      if (containsApiKey(obj)) {
        found.push(obj)
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        found.push(...searchForApiKeys(item))
      }
    } else if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        found.push(...searchForApiKeys(value))
      }
    }

    return found
  }

  it('should not expose API keys in health endpoint response', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const response = await request(app).get('/api/health').expect(200)

        // Check response body
        const bodyStr = JSON.stringify(response.body)
        const keysInBody = searchForApiKeys(response.body)
        expect(keysInBody).toHaveLength(0)
        expect(containsApiKey(bodyStr)).toBe(false)

        // Check response headers
        const headersStr = JSON.stringify(response.headers)
        expect(containsApiKey(headersStr)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should not expose API keys in caption endpoint error responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageUrl: fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            fc.integer(),
            fc.boolean()
          ),
        }),
        async (body) => {
          const response = await request(app).post('/api/caption').send(body)

          // Check response body
          const bodyStr = JSON.stringify(response.body)
          const keysInBody = searchForApiKeys(response.body)
          expect(keysInBody).toHaveLength(0)
          expect(containsApiKey(bodyStr)).toBe(false)

          // Check response headers
          const headersStr = JSON.stringify(response.headers)
          expect(containsApiKey(headersStr)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not expose API keys in mask endpoint error responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageUrl: fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            fc.integer(),
            fc.boolean()
          ),
        }),
        async (body) => {
          const response = await request(app).post('/api/mask').send(body)

          // Check response body
          const bodyStr = JSON.stringify(response.body)
          const keysInBody = searchForApiKeys(response.body)
          expect(keysInBody).toHaveLength(0)
          expect(containsApiKey(bodyStr)).toBe(false)

          // Check response headers
          const headersStr = JSON.stringify(response.headers)
          expect(containsApiKey(headersStr)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not expose API keys in verify endpoint error responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          licenseKey: fc.oneof(
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(''),
            fc.integer(),
            fc.boolean()
          ),
        }),
        async (body) => {
          const response = await request(app).post('/api/verify').send(body)

          // Check response body
          const bodyStr = JSON.stringify(response.body)
          const keysInBody = searchForApiKeys(response.body)
          expect(keysInBody).toHaveLength(0)
          expect(containsApiKey(bodyStr)).toBe(false)

          // Check response headers
          const headersStr = JSON.stringify(response.headers)
          expect(containsApiKey(headersStr)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  }, 10000) // Increase timeout to 10 seconds

  it('should not expose API keys in any endpoint responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          endpoint: fc.constantFrom(
            '/api/caption',
            '/api/mask',
            '/api/verify',
            '/api/health'
          ),
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          body: fc.record({
            imageUrl: fc.option(fc.string(), { nil: undefined }),
            licenseKey: fc.option(fc.string(), { nil: undefined }),
            keywords: fc.option(fc.array(fc.string()), { nil: undefined }),
          }),
        }),
        async ({ endpoint, method, body }) => {
          let req =
            request(app)[
              method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'
            ](endpoint)

          if (method === 'POST' || method === 'PUT') {
            req = req.send(body)
          }

          const response = await req

          // Check response body
          const bodyStr = JSON.stringify(response.body)
          const keysInBody = searchForApiKeys(response.body)
          expect(keysInBody).toHaveLength(0)
          expect(containsApiKey(bodyStr)).toBe(false)

          // Check response headers
          const headersStr = JSON.stringify(response.headers)
          expect(containsApiKey(headersStr)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  }, 10000) // Increase timeout to 10 seconds
})
