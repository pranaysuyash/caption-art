/**
 * Unified validation middleware
 * Provides centralized request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express'
import { log } from './logger'
import { z, ZodSchema } from 'zod'

export interface ValidationOptions {
  body?: ZodSchema | { schema: ZodSchema }
  params?: ZodSchema | { schema: ZodSchema }
  query?: ZodSchema | { schema: ZodSchema }
}

/**
 * Creates a validation middleware for a specific route
 */
export function validateRequest(options: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    const reqId = (req as any).requestId || 'no-req-id'
    log.debug(
      { requestId: reqId, middleware: 'validateRequest' },
      'validateRequest start'
    )
    try {
      // Validate body if schema provided
      if (options.body) {
        const bodySchema: ZodSchema =
          (options.body as any).schema || (options.body as ZodSchema)
        const parsedBody = bodySchema.parse(req.body)
        ;(req as any).body = parsedBody as any
      }

      // Validate params if schema provided
      if (options.params) {
        const paramsSchema: ZodSchema =
          (options.params as any).schema || (options.params as ZodSchema)
        const parsedParams = paramsSchema.parse(req.params)
        ;(req as any).params = parsedParams as any
      }

      // Validate query if schema provided
      if (options.query) {
        const querySchema: ZodSchema =
          (options.query as any).schema || (options.query as ZodSchema)
        const parsedQuery = querySchema.parse(req.query)
        ;(req as any).query = parsedQuery as any
      }

      next()
      const duration = Date.now() - start
      log.debug(
        { requestId: reqId, middleware: 'validateRequest', duration },
        'validateRequest done'
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors for response - details must be string for Lambda compatibility
        const errorMessages = error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')

        return res.status(400).json({
          error: 'Validation error',
          details: errorMessages,
        })
      }

      // Handle other errors
      const duration = Date.now() - start
      log.debug(
        { requestId: reqId, middleware: 'validateRequest', duration },
        'validateRequest failed'
      )

      return res.status(500).json({
        error: 'Internal server error during validation',
      })
    }
  }
}

/**
 * Generic validation function that can be used in route handlers directly
 */
export function validateData<T>(data: unknown, schema: ZodSchema<T>): T {
  return schema.parse(data)
}

/**
 * Safe validation function that returns result or error
 */
export function safeValidateData<T>(
  data: unknown,
  schema: ZodSchema<T>
):
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: z.ZodError
    } {
  try {
    const parsedData = schema.parse(data)
    return { success: true, data: parsedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}
