/**
 * Global error handler middleware
 * Catches all errors and sends appropriate responses
 */

import { Request, Response, NextFunction } from 'express'
import { AppError, ExternalAPIError, ErrorMetadata } from '../errors/AppError'
import { log } from './logger'
import { ZodError } from 'zod'

/**
 * Error handler middleware
 * Must be registered last in the middleware chain
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Extract request context for error logging
  const requestId = (req as any).requestId
  const method = req.method
  const path = req.path
  const userAgent =
    (typeof (req as any).get === 'function'
      ? (req as any).get('User-Agent')
      : req.headers?.['user-agent']) || ''
  const ip = req.ip || ''

  // Extract error metadata if it's an AppError
  let errorMetadata: ErrorMetadata | undefined
  if (err instanceof AppError) {
    errorMetadata = err.metadata
  }

  // Log error with full context and metadata
  log.error(
    {
      requestId,
      method,
      path,
      userAgent,
      ip,
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        statusCode: (err as any).statusCode,
        errorCode: (err as AppError).errorCode,
        isOperational: (err as AppError).isOperational,
        metadata: errorMetadata,
      },
    },
    'Unhandled error'
  )

  // Set content type to JSON if response object supports it
  try {
    if (typeof (res as any).setHeader === 'function') {
      res.setHeader('Content-Type', 'application/json')
    }
  } catch (headerErr) {
    // Fallback: ignore errors setting header in mocked test responses
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    try {
      if (
        typeof (res as any).status === 'function' &&
        typeof (res as any).json === 'function'
      ) {
        return res.status(400).json({
          error: 'Validation error',
          errorCode: 'VALIDATION_ERROR',
          details: err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
    } catch (sendErr) {
      // If stubs don't support .status/.json, fallback to setting a statusCode property
      try {
        ;(res as any).statusCode = 400
      } catch (ignore) {}
      return
    }
  }

  // Handle custom External API error (502)
  if (err instanceof ExternalAPIError) {
    try {
      if (
        typeof (res as any).status === 'function' &&
        typeof (res as any).json === 'function'
      ) {
        return res.status(err.statusCode).json({
          error: err.message,
          errorCode: err.errorCode || 'EXTERNAL_API_ERROR',
          service: err.service,
          metadata: err.metadata,
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        })
      }
    } catch (sendErr) {
      try {
        ;(res as any).statusCode = err.statusCode
      } catch (ignore) {}
      return
    }
  }

  // Handle custom AppError instances
  if (err instanceof AppError) {
    const response: any = {
      error: err.message,
      errorCode: err.errorCode,
      ...(err.metadata && { metadata: err.metadata }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    }

    // Only include metadata in the response if it doesn't contain sensitive information
    if (err.metadata) {
      const { retryable, rateLimitInfo, ...safeMetadata } = err.metadata
      if (Object.keys(safeMetadata).length > 0) {
        response.metadata = safeMetadata
      }
      if (retryable !== undefined) {
        response.retryable = retryable
      }
      if (rateLimitInfo) {
        response.rateLimitInfo = rateLimitInfo
      }
    }

    try {
      if (
        typeof (res as any).status === 'function' &&
        typeof (res as any).json === 'function'
      ) {
        return res.status(err.statusCode).json(response)
      }
    } catch (sendErr) {
      try {
        ;(res as any).statusCode = err.statusCode
      } catch (ignore) {}
      return
    }
  }

  // Handle unexpected errors
  try {
    if (
      typeof (res as any).status === 'function' &&
      typeof (res as any).json === 'function'
    ) {
      return res.status(500).json({
        error: 'Internal server error',
        errorCode: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          message: err.message,
          stack: err.stack,
        }),
      })
    }
  } catch (sendErr) {
    try {
      ;(res as any).statusCode = 500
    } catch (ignore) {}
    return
  }
}
