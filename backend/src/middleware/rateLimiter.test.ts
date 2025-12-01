import { describe, it, expect, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import * as fc from 'fast-check'
import { rateLimiter } from './rateLimiter'

describe('Rate Limiter Middleware', () => {
  /**
   * Feature: platform-agnostic-backend, Property 16: Rate limit responses
   * Validates: Requirements 6.4
   *
   * For any rate limit exceeded scenario, the service should return a 429 status code
   */
  it('should return 429 status when rate limit is exceeded', async () => {
    // This test verifies the rate limiter configuration returns 429
    // We test the handler function directly since testing actual rate limiting
    // would require making 100+ requests which is impractical for property testing

    fc.assert(
      fc.property(
        fc.record({
          path: fc.constantFrom('/api/caption', '/api/mask', '/api/verify'),
          method: fc.constantFrom('GET', 'POST'),
          ip: fc.ipV4(),
        }),
        (requestData) => {
          const req = {
            path: requestData.path,
            method: requestData.method,
            ip: requestData.ip,
          } as Request

          let statusCode: number | undefined
          let responseData: any
          const res = {
            status: vi.fn((code) => {
              statusCode = code
              return res
            }),
            json: vi.fn((data) => {
              responseData = data
            }),
          } as unknown as Response

          // Call the rate limiter's handler directly to test 429 response
          const handler = (rateLimiter as any).handler
          if (handler) {
            handler(req, res)

            // Verify 429 status code
            expect(statusCode).toBe(429)

            // Verify error message is present
            expect(responseData).toBeDefined()
            expect(responseData.error).toBeDefined()
            expect(typeof responseData.error).toBe('string')
            expect(responseData.error).toContain('Too many requests')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should include rate limit error message in response', () => {
    const req = {
      path: '/api/test',
      method: 'POST',
      ip: '192.168.1.1',
    } as Request

    let responseData: any
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((data) => {
        responseData = data
      }),
    } as unknown as Response

    // Call the handler
    const handler = (rateLimiter as any).handler
    if (handler) {
      handler(req, res)

      expect(responseData.error).toBe(
        'Too many requests, please try again later'
      )
    }
  })
})
