import { describe, it, expect, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import * as fc from 'fast-check'
import { corsMiddleware } from './cors'

describe('CORS Middleware', () => {
  /**
   * Feature: platform-agnostic-backend, Property 18: CORS headers
   * Validates: Requirements 7.2
   *
   * For any API response, it should include the Access-Control-Allow-Origin header
   */
  it('should include Access-Control-Allow-Origin header for all requests', () => {
    fc.assert(
      fc.property(
        fc.record({
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          path: fc.string({ minLength: 1, maxLength: 50 }),
          headers: fc.record({
            origin: fc.option(fc.webUrl(), { nil: undefined }),
          }),
        }),
        (requestData) => {
          // Create mock request
          const req = {
            method: requestData.method,
            path: requestData.path,
            headers: requestData.headers,
          } as unknown as Request

          // Create mock response
          const headers: Record<string, string> = {}
          const res = {
            setHeader: vi.fn((name: string, value: string) => {
              headers[name] = value
            }),
            status: vi.fn().mockReturnThis(),
            end: vi.fn(),
          } as unknown as Response

          // Create mock next function
          const next = vi.fn() as NextFunction

          // Call middleware
          corsMiddleware(req, res, next)

          // Verify Access-Control-Allow-Origin header is set
          expect(headers['Access-Control-Allow-Origin']).toBeDefined()
          expect(typeof headers['Access-Control-Allow-Origin']).toBe('string')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should include all required CORS headers', () => {
    fc.assert(
      fc.property(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), (method) => {
        const req = {
          method,
          headers: {},
        } as unknown as Request

        const headers: Record<string, string> = {}
        const res = {
          setHeader: vi.fn((name: string, value: string) => {
            headers[name] = value
          }),
          status: vi.fn().mockReturnThis(),
          end: vi.fn(),
        } as unknown as Response

        const next = vi.fn() as NextFunction

        corsMiddleware(req, res, next)

        // Verify all required CORS headers are present
        expect(headers['Access-Control-Allow-Origin']).toBeDefined()
        expect(headers['Access-Control-Allow-Methods']).toBeDefined()
        expect(headers['Access-Control-Allow-Headers']).toBeDefined()
        expect(headers['Access-Control-Allow-Credentials']).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  it('should handle OPTIONS preflight requests', () => {
    const req = {
      method: 'OPTIONS',
      headers: {},
    } as unknown as Request

    const headers: Record<string, string> = {}
    const res = {
      setHeader: vi.fn((name: string, value: string) => {
        headers[name] = value
      }),
      status: vi.fn().mockReturnThis(),
      end: vi.fn(),
    } as unknown as Response

    const next = vi.fn() as NextFunction

    corsMiddleware(req, res, next)

    // Verify preflight response
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.end).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
    expect(headers['Access-Control-Allow-Origin']).toBeDefined()
  })
})
