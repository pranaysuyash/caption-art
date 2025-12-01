import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import * as fc from 'fast-check'
import { logger } from './logger'
import { ValidationError, ExternalAPIError } from '../errors/AppError'
import { errorHandler } from './errorHandler'

describe('Logger Middleware', () => {
  let consoleLogSpy: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  /**
   * Feature: platform-agnostic-backend, Property 13: Error logging
   * Validates: Requirements 6.1
   *
   * For any error that occurs, it should be logged with a timestamp and relevant context information
   */
  it('should log errors with timestamp and context when errors occur', () => {
    // Create a separate spy for console.error since errorHandler uses console.error
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    fc.assert(
      fc.property(
        fc.record({
          path: fc.constantFrom(
            '/api/caption',
            '/api/mask',
            '/api/verify',
            '/api/health'
          ),
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          error: fc.constantFrom(
            new ValidationError('Invalid input'),
            new ExternalAPIError('API failed', 'TestService'),
            new Error('Generic error')
          ),
        }),
        (requestData) => {
          const req = {
            path: requestData.path,
            method: requestData.method,
            headers: {},
          } as Request

          const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
          } as unknown as Response

          const next = vi.fn() as NextFunction

          // Clear previous spy calls
          consoleErrorSpy.mockClear()

          // Trigger error handler which should log
          errorHandler(requestData.error, req, res, next)

          // Verify error was logged
          expect(consoleErrorSpy).toHaveBeenCalled()

          // Get the log call
          const logCalls = consoleErrorSpy.mock.calls
          expect(logCalls.length).toBeGreaterThan(0)

          // Verify first argument contains timestamp (ISO format)
          const firstCall = logCalls[0]
          expect(firstCall[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

          // Verify log contains context (error details)
          const loggedData = firstCall[1]
          expect(loggedData).toBeDefined()
          expect(loggedData.name).toBeDefined()
          expect(loggedData.message).toBeDefined()
          expect(loggedData.path).toBe(requestData.path)
          expect(loggedData.method).toBe(requestData.method)
        }
      ),
      { numRuns: 100 }
    )

    consoleErrorSpy.mockRestore()
  })

  it('should log all requests with timestamp', () => {
    fc.assert(
      fc.property(
        fc.record({
          path: fc.string({ minLength: 1, maxLength: 50 }),
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        }),
        (requestData) => {
          const req = {
            path: requestData.path,
            method: requestData.method,
          } as Request

          const res = {
            on: vi.fn(),
          } as unknown as Response

          const next = vi.fn() as NextFunction

          consoleLogSpy.mockClear()

          logger(req, res, next)

          // Verify request was logged
          expect(consoleLogSpy).toHaveBeenCalled()

          // Verify log contains timestamp
          const logCall = consoleLogSpy.mock.calls[0][0]
          expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

          // Verify log contains method and path
          expect(logCall).toContain(requestData.method)
          expect(logCall).toContain(requestData.path)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should log response time when request completes', () => {
    const req = {
      path: '/api/test',
      method: 'GET',
    } as Request

    let finishCallback: (() => void) | undefined
    const res = {
      on: vi.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback = callback
        }
      }),
      statusCode: 200,
    } as unknown as Response

    const next = vi.fn() as NextFunction

    consoleLogSpy.mockClear()

    logger(req, res, next)

    // Simulate response finish
    if (finishCallback) {
      finishCallback()
    }

    // Should have two log calls: one for request, one for response
    expect(consoleLogSpy).toHaveBeenCalledTimes(2)

    // Second call should include response time
    const responseLog = consoleLogSpy.mock.calls[1][0]
    expect(responseLog).toMatch(/\d+ms/)
    expect(responseLog).toContain('200')
  })
})
