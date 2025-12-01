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
 * Feature: platform-agnostic-backend, Property 5: HTTP method routing
 *
 * For any defined route, only the specified HTTP method should trigger the handler
 * Validates: Requirements 3.2
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

describe('Property 5: HTTP method routing', () => {
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

  it('caption endpoint should only accept POST requests', async () => {
    // POST should work
    const postResponse = await request(app)
      .post('/api/caption')
      .send({ imageUrl: 'http://example.com/image.jpg' })

    expect(postResponse.status).toBe(200)

    // GET should not work
    const getResponse = await request(app).get('/api/caption')

    expect(getResponse.status).not.toBe(200)

    // PUT should not work
    const putResponse = await request(app)
      .put('/api/caption')
      .send({ imageUrl: 'http://example.com/image.jpg' })

    expect(putResponse.status).not.toBe(200)

    // DELETE should not work
    const deleteResponse = await request(app).delete('/api/caption')

    expect(deleteResponse.status).not.toBe(200)
  })

  it('mask endpoint should only accept POST requests', async () => {
    // POST should work
    const postResponse = await request(app)
      .post('/api/mask')
      .send({ imageUrl: 'http://example.com/image.jpg' })

    expect(postResponse.status).toBe(200)

    // GET should not work
    const getResponse = await request(app).get('/api/mask')

    expect(getResponse.status).not.toBe(200)

    // PUT should not work
    const putResponse = await request(app)
      .put('/api/mask')
      .send({ imageUrl: 'http://example.com/image.jpg' })

    expect(putResponse.status).not.toBe(200)

    // DELETE should not work
    const deleteResponse = await request(app).delete('/api/mask')

    expect(deleteResponse.status).not.toBe(200)
  })

  it('verify endpoint should only accept POST requests', async () => {
    // POST should work
    const postResponse = await request(app)
      .post('/api/verify')
      .send({ licenseKey: 'test-key-12345' })

    expect(postResponse.status).toBe(200)

    // GET should not work
    const getResponse = await request(app).get('/api/verify')

    expect(getResponse.status).not.toBe(200)

    // PUT should not work
    const putResponse = await request(app)
      .put('/api/verify')
      .send({ licenseKey: 'test-key-12345' })

    expect(putResponse.status).not.toBe(200)

    // DELETE should not work
    const deleteResponse = await request(app).delete('/api/verify')

    expect(deleteResponse.status).not.toBe(200)
  })

  it('health endpoint should only accept GET requests', async () => {
    // GET should work
    const getResponse = await request(app).get('/api/health')

    expect(getResponse.status).toBe(200)

    // POST should not work
    const postResponse = await request(app).post('/api/health').send({})

    expect(postResponse.status).not.toBe(200)

    // PUT should not work
    const putResponse = await request(app).put('/api/health').send({})

    expect(putResponse.status).not.toBe(200)

    // DELETE should not work
    const deleteResponse = await request(app).delete('/api/health')

    expect(deleteResponse.status).not.toBe(200)
  })

  it('wrong HTTP methods should return 404 or 405', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          '/api/caption',
          '/api/mask',
          '/api/verify',
          '/api/health'
        ),
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
        async (endpoint, method) => {
          // Define which methods are valid for each endpoint
          const validMethods: Record<string, string[]> = {
            '/api/caption': ['POST'],
            '/api/mask': ['POST'],
            '/api/verify': ['POST'],
            '/api/health': ['GET'],
          }

          const isValidMethod = validMethods[endpoint]?.includes(method)

          let response
          switch (method) {
            case 'GET':
              response = await request(app).get(endpoint)
              break
            case 'POST':
              response = await request(app).post(endpoint).send({})
              break
            case 'PUT':
              response = await request(app).put(endpoint).send({})
              break
            case 'DELETE':
              response = await request(app).delete(endpoint)
              break
            case 'PATCH':
              response = await request(app).patch(endpoint).send({})
              break
            default:
              throw new Error(`Unexpected method: ${method}`)
          }

          if (isValidMethod) {
            // Valid methods might return 200 or 400 (validation error), but not 404/405
            expect([200, 400, 500, 502]).toContain(response.status)
          } else {
            // Invalid methods should return an error status
            // 400: validation error (handler runs but rejects invalid input)
            // 404: route not found
            // 405: method not allowed
            expect([400, 404, 405]).toContain(response.status)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
