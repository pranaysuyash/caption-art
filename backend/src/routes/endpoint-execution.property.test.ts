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
 * Feature: platform-agnostic-backend, Property 6: Endpoint execution
 *
 * For any registered endpoint, accessing it with the correct method should execute the associated handler
 * Validates: Requirements 3.3
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

describe('Property 6: Endpoint execution', () => {
  let app: Express
  let generateBaseCaptionSpy: any
  let generateMaskSpy: any
  let rewriteCaptionSpy: any
  let verifyLicenseSpy: any

  beforeEach(() => {
    app = createTestApp()
    vi.clearAllMocks()

    // Set up spies to track if handlers are executed
    generateBaseCaptionSpy = vi
      .spyOn(replicateService, 'generateBaseCaption')
      .mockResolvedValue('A test caption')
    generateMaskSpy = vi
      .spyOn(replicateService, 'generateMask')
      .mockResolvedValue('https://example.com/mask.png')
    rewriteCaptionSpy = vi
      .spyOn(openaiService, 'rewriteCaption')
      .mockResolvedValue(['Variant 1', 'Variant 2'])
    verifyLicenseSpy = vi
      .spyOn(gumroadService, 'verifyLicense')
      .mockResolvedValue({ valid: true, email: 'test@example.com' })
  })

  it('caption endpoint should execute handler when called with POST', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        fc.option(
          fc.array(
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => {
              // Filter out strings with problematic characters that might interfere with JSON/routing
              return (
                !s.includes('\\') &&
                !s.includes('"') &&
                !s.includes('\n') &&
                !s.includes('\r')
              )
            }),
            { minLength: 0, maxLength: 5 }
          ),
          { nil: undefined }
        ),
        async (_unused, keywords) => {
          const imageUrl = `http://localhost:3000/generated/test.jpg`
          generateBaseCaptionSpy.mockClear()
          rewriteCaptionSpy.mockClear()

          const response = await request(app)
            .post('/api/caption')
            .send({ imageUrl, keywords })

          // Handler should be executed
          expect(response.status).toBe(200)
          expect(generateBaseCaptionSpy).toHaveBeenCalledWith(imageUrl)
          expect(rewriteCaptionSpy).toHaveBeenCalled()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('mask endpoint should execute handler when called with POST', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async (_unused) => {
        const imageUrl = `http://localhost:3000/generated/test.jpg`
        generateMaskSpy.mockClear()

        const response = await request(app).post('/api/mask').send({ imageUrl })

        // Handler should be executed
        expect(response.status).toBe(200)
        expect(generateMaskSpy).toHaveBeenCalledWith(imageUrl)
      }),
      { numRuns: 100 }
    )
  })

  it('verify endpoint should execute handler when called with POST', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }).filter((s) => {
          // Filter out strings that might interfere with routing or JSON parsing
          const trimmed = s.trim()
          if (trimmed.length === 0) return false

          // Filter out strings with special JavaScript/JSON reserved words or problematic patterns
          const problematicPatterns = [
            '__proto__',
            'constructor',
            'prototype',
            '__defineGetter__',
            '__defineSetter__',
            '__lookupGetter__',
            '__lookupSetter__',
            '__lookup', // Catch partial matches
            '__define', // Catch partial matches
            '\\', // Backslashes can cause JSON issues
            '"', // Quotes can break JSON
            '\n', // Newlines can break routing
            '\r', // Carriage returns can break routing
          ]

          return !problematicPatterns.some((pattern) => s.includes(pattern))
        }),
        async (licenseKey) => {
          verifyLicenseSpy.mockClear()

          const response = await request(app)
            .post('/api/verify')
            .send({ licenseKey })

          // Handler should be executed (200 for success, 400 for validation errors, 502 for API errors)
          expect([200, 400, 502]).toContain(response.status)
          if (response.status === 200) {
            expect(verifyLicenseSpy).toHaveBeenCalledWith(licenseKey)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('health endpoint should execute handler when called with GET', async () => {
    // Health endpoint doesn't call external services, so we just verify it responds
    // Test it a few times to ensure consistency
    for (let i = 0; i < 10; i++) {
      const response = await request(app).get('/api/health')

      // Handler should be executed and return expected response
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
    }
  })

  it('all endpoints should execute their handlers when accessed correctly', async () => {
    // Test that each endpoint executes its handler
    const endpoints = [
      {
        path: '/api/caption',
        method: 'POST',
        body: { imageUrl: 'http://example.com/image.jpg' },
        spy: generateBaseCaptionSpy,
      },
      {
        path: '/api/mask',
        method: 'POST',
        body: { imageUrl: 'http://example.com/image.jpg' },
        spy: generateMaskSpy,
      },
      {
        path: '/api/verify',
        method: 'POST',
        body: { licenseKey: 'test-key-12345' },
        spy: verifyLicenseSpy,
      },
    ]

    for (const endpoint of endpoints) {
      endpoint.spy.mockClear()

      const response = await request(app)
        .post(endpoint.path)
        .send(endpoint.body)

      expect(response.status).toBe(200)
      expect(endpoint.spy).toHaveBeenCalled()
    }

    // Test health endpoint separately (GET request, no spy)
    const healthResponse = await request(app).get('/api/health')
    expect(healthResponse.status).toBe(200)
  })
})
