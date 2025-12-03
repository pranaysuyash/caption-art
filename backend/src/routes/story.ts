import { Router, Request, Response, NextFunction } from 'express'
import { generateNextScenePrompt } from '../services/openai'
import { generateImage } from '../services/replicate'
import { ExternalAPIError } from '../errors/AppError'
import { z } from 'zod'
import validateRequest from '../middleware/validateRequest'

const router = Router()

// Validation schema for next-frame request
const NextFrameRequestSchema = z.object({
  currentCaption: z.string().min(1),
  styleContext: z.string().min(1),
})

/**
 * POST /api/story/next-frame
 * Generates the next frame in a story sequence
 *
 * Request body:
 * - currentCaption: string (required) - Caption of the current scene
 * - styleContext: string (required) - Description of the visual style to maintain
 *
 * Response:
 * - nextPrompt: string - The prompt used to generate the next image
 * - nextImageUrl: string - URL of the generated image
 */
router.post(
  '/next-frame',
  validateRequest(NextFrameRequestSchema) as any,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validatedData = (req as any).validatedData
      const { currentCaption, styleContext } = validatedData

      // 1. Generate prompt for the next scene
      let nextPrompt: string
      try {
        nextPrompt = await generateNextScenePrompt(currentCaption, styleContext)
      } catch (error) {
        throw new ExternalAPIError(
          error instanceof Error
            ? error.message
            : 'Failed to generate story script',
          'OpenAI'
        )
      }

      // 2. Generate image for the next scene
      let nextImageUrl: string
      try {
        // Combine style context with the new prompt for better consistency
        const fullPrompt = `${styleContext}. ${nextPrompt}`
        nextImageUrl = await generateImage(fullPrompt)
      } catch (error) {
        throw new ExternalAPIError(
          error instanceof Error
            ? error.message
            : 'Failed to generate story image',
          'Replicate'
        )
      }

      res.json({
        nextPrompt,
        nextImageUrl,
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
