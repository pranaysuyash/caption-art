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
 * Feature: platform-agnostic-backend, Property 8: API compatibility
 *
 * For any endpoint, the response structure should match the expected format (same fields and types)
 * Validates: Requirements 4.5
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

describe('Property 8: API compatibility', () => {
  let app: Express

  beforeEach(() => {
    app = createTestApp()
    vi.clearAllMocks()

    // Set up default mocks
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
    vi.spyOn(gumroadService, 'verifyLicense').mockImplementation(
      async (key) => {
        const isValid = key.length > 10
        return {
          valid: isValid,
          email: isValid ? 'test@example.com' : undefined,
        }
      }
    )
  })

  it('caption endpoint should return baseCaption and variants fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('https://example.com/image.jpg'),
          fc.constant('data:image/png;base64,abcd')
        ),
        fc.option(
          fc.array(fc.stringMatching(/^[a-zA-Z0-9\s]+$/), {
            minLength: 0,
            maxLength: 5,
          }),
          { nil: undefined }
        ),
        async (imageUrl, keywords) => {
          const response = await request(app)
            .post('/api/caption')
            .send({ imageUrl, keywords })

          expect(response.status).toBe(200)
          expect(response.body).toHaveProperty('baseCaption')
          expect(response.body).toHaveProperty('variants')
          expect(typeof response.body.baseCaption).toBe('string')
          expect(Array.isArray(response.body.variants)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('mask endpoint should return maskUrl field', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async (_unused) => {
        const imageUrl = `http://localhost:3000/generated/test.jpg`
        const response = await request(app).post('/api/mask').send({ imageUrl })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('maskUrl')
        expect(typeof response.body.maskUrl).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  it('verify endpoint should return valid and optional email fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (key) =>
            // Filter out strings containing JavaScript reserved property names
            // that might interfere with Express routing or JSON parsing
            !key.includes('__proto__') &&
            !key.includes('constructor') &&
            !key.includes('prototype')
        ),
        async (licenseKey) => {
          const response = await request(app)
            .post('/api/verify')
            .send({ licenseKey })

          expect(response.status).toBe(200)
          expect(response.body).toHaveProperty('valid')
          expect(typeof response.body.valid).toBe('boolean')

          // email is optional, but if present should be a string
          if (response.body.email !== undefined) {
            expect(typeof response.body.email).toBe('string')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('health endpoint should return status, timestamp, and uptime fields', async () => {
    // Test health endpoint - it doesn't take any input so we just test it once
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('uptime')
    expect(typeof response.body.status).toBe('string')
    expect(['healthy', 'unhealthy']).toContain(response.body.status)
    expect(typeof response.body.timestamp).toBe('string')
    expect(typeof response.body.uptime).toBe('number')
  })

  it('error responses should have error field and optional details field', async () => {
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
          expect(response.body).toHaveProperty('error')
          expect(typeof response.body.error).toBe('string')

          // details is optional, but if present should be a string
          if (response.body.details !== undefined) {
            expect(typeof response.body.details).toBe('string')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
