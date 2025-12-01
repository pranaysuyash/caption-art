import { Router, Request, Response, NextFunction } from 'express'
import { generateBaseCaption } from '../services/replicate'
import { rewriteCaption } from '../services/openai'
import { CaptionResponse } from '../types/api'
import { CaptionRequestSchema } from '../schemas/validation'
import { ValidationError, ExternalAPIError } from '../errors/AppError'

const router = Router()

/**
 * POST /api/caption
 * Generates AI-powered caption suggestions for an image
 *
 * Request body:
 * - imageUrl: string (required) - Direct URL to image or base64 data URI
 * - keywords: string[] (optional) - Keywords to incorporate into variants
 *
 * Response:
 * - baseCaption: string - Base caption from BLIP model
 * - variants: string[] - Creative variants from OpenAI
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body with Zod schema
    const validatedData = CaptionRequestSchema.parse(req.body)
    const { imageUrl, keywords } = validatedData

    // Generate base caption with BLIP via Replicate
    let baseCaption: string
    try {
      baseCaption = await generateBaseCaption(imageUrl)
    } catch (error) {
      throw new ExternalAPIError(
        error instanceof Error ? error.message : 'Caption generation failed',
        'Replicate'
      )
    }

    // Generate creative variants with OpenAI
    let variants: string[]
    try {
      variants = await rewriteCaption(baseCaption, keywords)
    } catch (error) {
      throw new ExternalAPIError(
        error instanceof Error ? error.message : 'Caption rewriting failed',
        'OpenAI'
      )
    }

    const response: CaptionResponse = {
      baseCaption,
      variants,
    }

    res.json(response)
  } catch (error) {
    // Pass error to error handler middleware
    next(error)
  }
})

export default router
