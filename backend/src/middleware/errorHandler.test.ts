import { describe, it, expect, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import * as fc from 'fast-check'
import { errorHandler } from './errorHandler'
import {
  ValidationError,
  ExternalAPIError,
  RateLimitError,
} from '../errors/AppError'

describe('Error Handler Middleware', () => {
  /**
   * Feature: platform-agnostic-backend, Property 17: User-friendly error messages
   * Validates: Requirements 6.5
   *
   * For any error response, it should include a user-friendly error message
   * (not just stack traces or technical jargon)
   */
  it('should return user-friendly error messages for all error types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          new ValidationError('Invalid input provided'),
          new ExternalAPIError('External service unavailable', 'TestService'),
          new RateLimitError(),
          new Error('Generic error')
        ),
        (error) => {
          const req = {
            path: '/api/test',
            method: 'POST',
          } as Request

          let responseData: any
          const res = {
            setHeader: vi.fn(),
            status: vi.fn().mockReturnThis(),
            json: vi.fn((data) => {
              responseData = data
            }),
          } as unknown as Response

          const next = vi.fn() as NextFunction

          errorHandler(error, req, res, next)

          // Verify response has user-friendly error message
          expect(responseData).toBeDefined()
          expect(responseData.error).toBeDefined()
          expect(typeof responseData.error).toBe('string')
          expect(responseData.error.length).toBeGreaterThan(0)

          // Verify no stack traces in response
          expect(responseData.stack).toBeUndefined()

          // Verify message is not just technical jargon
          expect(responseData.error).not.toMatch(/^Error:/)
          expect(responseData.error).not.toMatch(/at Object\.<anonymous>/)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle ValidationError with 400 status', () => {
    const error = new ValidationError('Image URL is required')
    const req = { path: '/api/caption', method: 'POST' } as Request

    let statusCode: number | undefined
    let responseData: any
    const res = {
      setHeader: vi.fn(),
      status: vi.fn((code) => {
        statusCode = code
        return res
      }),
      json: vi.fn((data) => {
        responseData = data
      }),
    } as unknown as Response

    const next = vi.fn() as NextFunction

    errorHandler(error, req, res, next)

    expect(statusCode).toBe(400)
    expect(responseData.error).toBe('Image URL is required')
  })

  it('should handle ExternalAPIError with 502 status', () => {
    const error = new ExternalAPIError('Replicate API failed', 'Replicate')
    const req = { path: '/api/caption', method: 'POST' } as Request

    let statusCode: number | undefined
    let responseData: any
    const res = {
      setHeader: vi.fn(),
      status: vi.fn((code) => {
        statusCode = code
        return res
      }),
      json: vi.fn((data) => {
        responseData = data
      }),
    } as unknown as Response

    const next = vi.fn() as NextFunction

    errorHandler(error, req, res, next)

    expect(statusCode).toBe(502)
    expect(responseData.error).toBe('Replicate API failed')
  })

  it('should handle RateLimitError with 429 status', () => {
    const error = new RateLimitError()
    const req = { path: '/api/caption', method: 'POST' } as Request

    let statusCode: number | undefined
    let responseData: any
    const res = {
      setHeader: vi.fn(),
      status: vi.fn((code) => {
        statusCode = code
        return res
      }),
      json: vi.fn((data) => {
        responseData = data
      }),
    } as unknown as Response

    const next = vi.fn() as NextFunction

    errorHandler(error, req, res, next)

    expect(statusCode).toBe(429)
    expect(responseData.error).toContain('Too many requests')
  })

  it('should handle generic errors with 500 status and user-friendly message', () => {
    const error = new Error('Some internal error')
    const req = { path: '/api/test', method: 'GET' } as Request

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

    const next = vi.fn() as NextFunction

    errorHandler(error, req, res, next)

    expect(statusCode).toBe(500)
    expect(responseData.error).toBe('Internal server error')
    expect(responseData.error).not.toContain('Some internal error')
  })

  it('should log errors with timestamp and context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const error = new ValidationError('Test error')
    const req = { path: '/api/test', method: 'POST' } as Request
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response
    const next = vi.fn() as NextFunction

    errorHandler(error, req, res, next)

    expect(consoleSpy).toHaveBeenCalled()
    const logCall = consoleSpy.mock.calls[0] as any
    expect(logCall[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

    consoleSpy.mockRestore()
  })
})
