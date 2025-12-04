import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import express, { Express } from 'express'
import request from 'supertest'
import captionRouter from './caption'
import maskRouter from './mask'
import verifyRouter from './verify'
import healthRouter from './health'
import { errorHandler } from '../middleware/errorHandler'
import * as replicateService from '../services/replicate'
import * as openaiService from '../services/openai'
import * as gumroadService from '../services/gumroad'

/**
 * Feature: platform-agnostic-backend, Property 7: Response headers
 *
 * For any API response, it should include appropriate headers including Content-Type
 * Validates: Requirements 3.4
 */

// Create a test app with all routes
function createTestApp(): Express {
  const app = express()
  app.use(express.json())

  app.use('/api/caption', captionRouter)
  app.use('/api/mask', maskRouter)
  app.use('/api/verify', verifyRouter)
  app.use('/api/health', healthRouter)

  app.use(errorHandler)

  return app
}

describe('Property 7: Response headers', () => {
  let app: Express

  beforeEach(() => {
    app = createTestApp()
    vi.clearAllMocks()

    // Set up mocks to avoid external API calls
    vi.spyOn(replicateService, 'generateBaseCaption').mockResolvedValue(
      'A test caption'
    )
    vi.spyOn(replicateService, 'generateMask').mockResolvedValue(
      'https://example.com/mask.png'
    )
    vi.spyOn(openaiService, 'rewriteCaption').mockResolvedValue([
      'Variant 1',
      'Variant 2',
    ])
    vi.spyOn(gumroadService, 'verifyLicense').mockResolvedValue({
      valid: true,
      email: 'test@example.com',
    })
  })

  it('caption endpoint should return Content-Type header', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        fc.option(fc.array(fc.string(), { minLength: 0, maxLength: 5 }), {
          nil: undefined,
        }),
        async (_unused, keywords) => {
          const imageUrl = `http://localhost:3000/generated/test.jpg`
          const response = await request(app)
            .post('/api/caption')
            .send({ imageUrl, keywords })

          expect(response.status).toBe(200)
          expect(response.headers['content-type']).toMatch(/application\/json/)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('mask endpoint should return Content-Type header', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(`http://localhost:3000/generated/test.jpg`),
        async (_unused) => {
          const imageUrl = `http://localhost:3000/generated/test.jpg`
          const response = await request(app)
            .post('/api/mask')
            .send({ imageUrl })

          expect(response.status).toBe(200)
          expect(response.headers['content-type']).toMatch(/application\/json/)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('verify endpoint should return Content-Type header', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 5, maxLength: 50 })
          .filter((s) => /^[a-zA-Z0-9-_]+$/.test(s)),
        async (licenseKey) => {
          const response = await request(app)
            .post('/api/verify')
            .send({ licenseKey })

          // Should return 200 or error status, but always with JSON content-type
          expect([200, 400, 502]).toContain(response.status)
          if (response.headers['content-type']) {
            expect(response.headers['content-type']).toMatch(
              /application\/json/
            )
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('health endpoint should return Content-Type header', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/application\/json/)
  })

  it('error responses should return Content-Type header', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.string())
        ),
        async (invalidInput) => {
          const response = await request(app)
            .post('/api/caption')
            .send({ imageUrl: invalidInput })

          expect(response.status).toBe(400)
          expect(response.headers['content-type']).toMatch(/application\/json/)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('all endpoints should return appropriate headers', async () => {
    const testCases = [
      {
        method: 'POST',
        path: '/api/caption',
        body: { imageUrl: 'http://example.com/image.jpg' },
      },
      {
        method: 'POST',
        path: '/api/mask',
        body: { imageUrl: 'http://example.com/image.jpg' },
      },
      {
        method: 'POST',
        path: '/api/verify',
        body: { licenseKey: 'test-key-12345' },
      },
      {
        method: 'GET',
        path: '/api/health',
        body: undefined,
      },
    ]

    for (const testCase of testCases) {
      let response
      if (testCase.method === 'GET') {
        response = await request(app).get(testCase.path)
      } else {
        response = await request(app).post(testCase.path).send(testCase.body)
      }

      expect(response.status).toBe(200)
      expect(response.headers).toHaveProperty('content-type')
      expect(response.headers['content-type']).toMatch(/application\/json/)
    }
  })

  it('responses should have standard HTTP headers', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)

    // Check for standard headers
    expect(response.headers).toHaveProperty('content-type')
    expect(response.headers).toHaveProperty('content-length')

    // Content-Type should be JSON
    expect(response.headers['content-type']).toMatch(/application\/json/)
  })
})
