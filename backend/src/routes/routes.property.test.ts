import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fc from 'fast-check'
import express, { Express } from 'express'
import request from 'supertest'
import captionRouter from './caption'
import maskRouter from './mask'
import verifyRouter from './verify'
import healthRouter from './health'
import { errorHandler } from '../middleware/errorHandler'

/**
 * Feature: platform-agnostic-backend, Property 15: Input validation errors
 *
 * For any invalid input, the service should return a 400 status code with validation error details
 * Validates: Requirements 6.3
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

describe('Property 15: Input validation errors', () => {
  let app: Express

  beforeAll(() => {
    app = createTestApp()
  })

  it('should return 400 for missing imageUrl in caption endpoint', async () => {
    // Test with empty body
    const response1 = await request(app).post('/api/caption').send({})

    expect(response1.status).toBe(400)
    expect(response1.body).toHaveProperty('error')

    // Test with keywords but no imageUrl
    const response2 = await request(app)
      .post('/api/caption')
      .send({ keywords: ['test', 'keywords'] })

    expect(response2.status).toBe(400)
    expect(response2.body).toHaveProperty('error')
  })

  it('should return 400 for invalid imageUrl type in caption endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.string()),
          fc.object()
        ),
        async (invalidImageUrl) => {
          const response = await request(app)
            .post('/api/caption')
            .send({ imageUrl: invalidImageUrl })

          expect(response.status).toBe(400)
          expect(response.body).toHaveProperty('error')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return 400 for missing imageUrl in mask endpoint', async () => {
    // Test with empty body
    const response = await request(app).post('/api/mask').send({})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
  })

  it('should return 400 for invalid imageUrl type in mask endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.string()),
          fc.object()
        ),
        async (invalidImageUrl) => {
          const response = await request(app)
            .post('/api/mask')
            .send({ imageUrl: invalidImageUrl })

          expect(response.status).toBe(400)
          expect(response.body).toHaveProperty('error')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return 400 for missing licenseKey in verify endpoint', async () => {
    const response = await request(app).post('/api/verify').send({})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error')
  })

  it('should return 400 for invalid licenseKey type in verify endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.array(fc.string()),
          fc.object()
        ),
        async (invalidLicenseKey) => {
          const response = await request(app)
            .post('/api/verify')
            .send({ licenseKey: invalidLicenseKey })

          expect(response.status).toBe(400)
          expect(response.body).toHaveProperty('error')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return 400 for invalid keywords type in caption endpoint', async () => {
    // Test with non-array keywords
    const response1 = await request(app).post('/api/caption').send({
      imageUrl: 'http://example.com/image.jpg',
      keywords: 'not-an-array',
    })

    expect(response1.status).toBe(400)
    expect(response1.body).toHaveProperty('error')

    const response2 = await request(app)
      .post('/api/caption')
      .send({ imageUrl: 'http://example.com/image.jpg', keywords: 123 })

    expect(response2.status).toBe(400)
    expect(response2.body).toHaveProperty('error')
  })
})
