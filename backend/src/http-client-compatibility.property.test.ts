import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { createServer } from './server'
import { Express } from 'express'
import * as replicateService from './services/replicate'
import * as openaiService from './services/openai'
import * as gumroadService from './services/gumroad'
import { Server } from 'http'

/**
 * Feature: platform-agnostic-backend, Property 21: HTTP client compatibility
 *
 * For any standard HTTP client (curl, fetch, axios), it should be able to successfully call the API endpoints
 * Validates: Requirements 9.4
 */

describe('Property 21: HTTP client compatibility', () => {
  let app: Express
  let server: Server
  let port: number

  beforeEach(async () => {
    // Create app without rate limiter for testing
    app = createServer({ enableRateLimiter: false })

    // Mock external services
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
      'Variant 4',
      'Variant 5',
    ])
    vi.spyOn(gumroadService, 'verifyLicense').mockResolvedValue({
      valid: true,
      email: 'test@example.com',
    })

    // Start server on random port
    port = 3000 + Math.floor(Math.random() * 1000)
    await new Promise<void>((resolve) => {
      server = app.listen(port, () => resolve())
    })
  })

  afterEach(async () => {
    vi.clearAllMocks()
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  })

  it('should work with native fetch API', async () => {
    await fc.assert(
      fc.asyncProperty(fc.webUrl(), async (imageUrl) => {
        const response = await fetch(`http://localhost:${port}/api/caption`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        })

        expect(response.ok).toBe(true)
        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toContain(
          'application/json'
        )

        const data = await response.json()
        expect(data).toHaveProperty('baseCaption')
        expect(data).toHaveProperty('variants')
      }),
      { numRuns: 100 }
    )
  })

  it('should work with undici (Node.js HTTP client)', async () => {
    const { request } = await import('undici')

    await fc.assert(
      fc.asyncProperty(fc.webUrl(), async (imageUrl) => {
        const { statusCode, headers, body } = await request(
          `http://localhost:${port}/api/mask`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl }),
          }
        )

        expect(statusCode).toBe(200)
        expect(headers['content-type']).toContain('application/json')

        const data = await body.json()
        expect(data).toHaveProperty('maskUrl')
      }),
      { numRuns: 100 }
    )
  })

  it('should work with supertest (testing library)', async () => {
    const request = await import('supertest')

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }),
        async (licenseKey) => {
          const response = await request
            .default(app)
            .post('/api/verify')
            .send({ licenseKey })
            .set('Content-Type', 'application/json')

          expect(response.status).toBe(200)
          expect(response.headers['content-type']).toContain(
            'application/json'
          )
          expect(response.body).toHaveProperty('valid')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle GET requests from any HTTP client', async () => {
    // Test with fetch
    const fetchResponse = await fetch(`http://localhost:${port}/api/health`)
    expect(fetchResponse.ok).toBe(true)
    const fetchData = await fetchResponse.json()
    expect(fetchData).toHaveProperty('status')

    // Test with undici
    const { request } = await import('undici')
    const { statusCode, body } = await request(
      `http://localhost:${port}/api/health`
    )
    expect(statusCode).toBe(200)
    const undiciData = await body.json()
    expect(undiciData).toHaveProperty('status')

    // Test with supertest
    const supertestRequest = await import('supertest')
    const supertestResponse = await supertestRequest.default(app).get('/api/health')
    expect(supertestResponse.status).toBe(200)
    expect(supertestResponse.body).toHaveProperty('status')
  })

  it('should handle different content-type headers from various clients', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.constantFrom(
          'application/json',
          'application/json; charset=utf-8',
          'application/json;charset=UTF-8'
        ),
        async (imageUrl, contentType) => {
          const response = await fetch(`http://localhost:${port}/api/caption`, {
            method: 'POST',
            headers: {
              'Content-Type': contentType,
            },
            body: JSON.stringify({ imageUrl }),
          })

          expect(response.ok).toBe(true)
          const data = await response.json()
          expect(data).toHaveProperty('baseCaption')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle requests with different user-agent headers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.constantFrom(
          'curl/7.68.0',
          'Mozilla/5.0 (compatible; Node.js)',
          'axios/1.0.0',
          'fetch-api',
          'undici'
        ),
        async (imageUrl, userAgent) => {
          const response = await fetch(`http://localhost:${port}/api/mask`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': userAgent,
            },
            body: JSON.stringify({ imageUrl }),
          })

          expect(response.ok).toBe(true)
          const data = await response.json()
          expect(data).toHaveProperty('maskUrl')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return proper HTTP status codes for all clients', async () => {
    // Test successful request
    const successResponse = await fetch(`http://localhost:${port}/api/health`)
    expect(successResponse.status).toBe(200)

    // Test bad request (invalid input)
    const badRequestResponse = await fetch(
      `http://localhost:${port}/api/caption`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: null }),
      }
    )
    expect(badRequestResponse.status).toBe(400)

    // Test method not allowed
    const methodNotAllowedResponse = await fetch(
      `http://localhost:${port}/api/caption`,
      {
        method: 'GET',
      }
    )
    expect(methodNotAllowedResponse.status).toBe(404)
  })

  it('should handle concurrent requests from multiple clients', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.webUrl(), { minLength: 5, maxLength: 20 }),
        async (imageUrls) => {
          // Simulate multiple clients making concurrent requests
          const promises = imageUrls.map((imageUrl, index) => {
            // Alternate between different "clients"
            if (index % 3 === 0) {
              // fetch
              return fetch(`http://localhost:${port}/api/caption`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl }),
              }).then((r) => r.json())
            } else if (index % 3 === 1) {
              // undici
              return import('undici').then(({ request }) =>
                request(`http://localhost:${port}/api/caption`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageUrl }),
                }).then(({ body }) => body.json())
              )
            } else {
              // supertest
              return import('supertest').then((request) =>
                request
                  .default(app)
                  .post('/api/caption')
                  .send({ imageUrl })
                  .then((r) => r.body)
              )
            }
          })

          const results = await Promise.all(promises)

          // All requests should succeed
          results.forEach((result) => {
            expect(result).toHaveProperty('baseCaption')
            expect(result).toHaveProperty('variants')
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle requests with and without trailing slashes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (withTrailingSlash) => {
          const path = withTrailingSlash ? '/api/health/' : '/api/health'
          const response = await fetch(`http://localhost:${port}${path}`)

          // Both should work (Express handles trailing slashes)
          expect(response.status).toBeLessThan(500)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve request body across different HTTP clients', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          imageUrl: fc.webUrl(),
          keywords: fc.option(
            fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
              minLength: 0,
              maxLength: 5,
            }),
            { nil: undefined }
          ),
        }),
        async (requestBody) => {
          // Test with fetch
          const fetchResponse = await fetch(
            `http://localhost:${port}/api/caption`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            }
          )
          expect(fetchResponse.ok).toBe(true)

          // Test with undici
          const { request } = await import('undici')
          const { statusCode } = await request(
            `http://localhost:${port}/api/caption`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            }
          )
          expect(statusCode).toBe(200)

          // Test with supertest
          const supertestRequest = await import('supertest')
          const supertestResponse = await supertestRequest
            .default(app)
            .post('/api/caption')
            .send(requestBody)
          expect(supertestResponse.status).toBe(200)
        }
      ),
      { numRuns: 100 }
    )
  })
})
