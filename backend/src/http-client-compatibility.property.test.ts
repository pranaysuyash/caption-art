import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { Express } from 'express'
import { Server } from 'http'

// Minimal, clean HTTP client compatibility tests
let app: Express | undefined
let server: Server | undefined
let port = 0

vi.mock('./services/replicate', () => ({
  generateBaseCaption: vi.fn().mockResolvedValue('A test caption'),
  generateMask: vi.fn().mockResolvedValue('https://example.com/mask.png'),
  generateImage: vi.fn().mockResolvedValue('https://example.com/generated.png'),
}))

vi.mock('./services/openai', () => ({
  rewriteCaption: vi
    .fn()
    .mockResolvedValue(['Variant 1', 'Variant 2', 'Variant 3']),
}))

vi.mock('./services/gumroad', () => ({
  verifyLicense: vi
    .fn()
    .mockResolvedValue({ valid: true, email: 'test@example.com' }),
}))

vi.mock('./services/imageRenderer', () => ({
  ImageRenderer: {
    renderImage: vi.fn().mockResolvedValue({
      imageUrl: '/generated/test.jpg',
      thumbnailUrl: '/generated/test_thumb.jpg',
      width: 1080,
      height: 1080,
    }),
  },
}))

beforeEach(async () => {
  vi.resetModules()
  const serverModule = await import('./server')
  const createServer =
    (serverModule as any).createServer ||
    (serverModule as any).default?.createServer
  app = createServer({ enableRateLimiter: false, loadRoutes: true })
  const { waitForAppReady } = await import('./server')
  await waitForAppReady(app)
  port = 3000 + Math.floor(Math.random() * 1000)
  await new Promise<void>(
    (resolve) => (server = app!.listen(port, () => resolve()))
  )
})

afterEach(async () => {
  vi.clearAllMocks()
  if (server)
    await new Promise<void>((resolve, reject) =>
      server!.close((err) => (err ? reject(err) : resolve()))
    )
})

describe('HTTP client compatibility', () => {
  it('supports fetch API', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Use a small 1x1 GIF data URI to avoid network fetches during tests
        const imageUrl = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
        const res = await fetch(`http://localhost:${port}/api/caption`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        })
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json).toHaveProperty('baseCaption')
      }),
      { numRuns: 3 }
    )
  }, 20000)

  it('supports undici', async () => {
    const { request } = await import('undici')
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Use a small 1x1 GIF data URI to avoid network fetches during tests
        const imageUrl = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
        const { statusCode, body } = await request(
          `http://localhost:${port}/api/mask`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl }),
          }
        )
        expect(statusCode).toBe(200)
        const data = await body.json()
        expect(data).toHaveProperty('maskUrl')
      }),
      { numRuns: 3 }
    )
  }, 20000)

  it('supports supertest', async () => {
    const request = await import('supertest')
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }),
        async (licenseKey) => {
          const res = await request
            .default(app!)
            .post('/api/verify')
            .send({ licenseKey })
            .set('Content-Type', 'application/json')
          expect(res.status).toBe(200)
          expect(res.body).toHaveProperty('valid')
        }
      ),
      { numRuns: 3 }
    )
  }, 20000)
})
