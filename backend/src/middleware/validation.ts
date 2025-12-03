/**
 * Unified validation middleware
 * Provides centralized request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'

export interface ValidationOptions {
  body?: ZodSchema
  params?: ZodSchema
  query?: ZodSchema
}

/**
 * Creates a validation middleware for a specific route
 */
export function validateRequest(options: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (options.body) {
        const parsedBody = options.body.parse(req.body)
        req.body = parsedBody
      }

      // Validate params if schema provided  
      if (options.params) {
        const parsedParams = options.params.parse(req.params)
        req.params = parsedParams
      }

      // Validate query if schema provided
      if (options.query) {
        const parsedQuery = options.query.parse(req.query)
        req.query = parsedQuery
      }

      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors for response
        const errors = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          value: issue.input
        }))

        return res.status(400).json({
          error: 'Validation error',
          details: errors
        })
      }
      
      // Handle other errors
      return res.status(500).json({ 
        error: 'Internal server error during validation' 
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
export function safeValidateData<T>(data: unknown, schema: ZodSchema<T>): { 
  success: true; data: T 
} | { 
  success: false; error: z.ZodError 
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