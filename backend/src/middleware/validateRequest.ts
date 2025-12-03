import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

/**
 * Middleware to validate request bodies using Zod schemas.
 * Attaches a parsed `validatedData` object to the request for handlers to use.
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body) as T
      // Attach validated object to the request
      ;(req as any).validatedData = parsed
      next()
    } catch (err) {
      next(err)
    }
  }
}

export default validateRequest
