import { Router, Request, Response, NextFunction } from 'express'
import { generateMask } from '../services/replicate'
import { MaskResponse } from '../types/api'
import { MaskRequestSchema } from '../schemas/validation'
import validateRequest from '../middleware/validateRequest'
import { ValidationError, ExternalAPIError } from '../errors/AppError'

const router = Router()

/**
 * POST /api/mask
 * Generates a subject mask for text-behind effect
 *
 * Request body:
 * - imageUrl: string (required) - Direct URL to image or base64 data URI
 *
 * Response:
 * - maskUrl: string - URL to the generated mask image
 */
router.post(
  '/',
  validateRequest(MaskRequestSchema) as any,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body with Zod schema
      const validatedData = (req as any).validatedData
      const { imageUrl } = validatedData

      // Generate mask using Replicate's rembg model
      let maskUrl: string
      try {
        maskUrl = await generateMask(imageUrl)
      } catch (error) {
        throw new ExternalAPIError(
          error instanceof Error ? error.message : 'Mask generation failed',
          'Replicate'
        )
      }

      const response: MaskResponse = {
        maskUrl,
      }

      res.json(response)
    } catch (error) {
      // Pass error to error handler middleware
      next(error)
    }
  }
)

export default router
