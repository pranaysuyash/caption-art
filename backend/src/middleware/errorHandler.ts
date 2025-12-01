/**
 * Global error handler middleware
 * Catches all errors and sends appropriate responses
 */

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
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
  // Log error with context
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] Error on ${req.method} ${req.path}:`, err)

  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json')

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  // Handle custom AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
  }

  // Handle unexpected errors
  return res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack,
    }),
  })
}
