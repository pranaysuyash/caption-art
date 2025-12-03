import { Router, Request, Response } from 'express'
import { VisualStyleAnalyzer } from '../services/visualStyleAnalyzer'
import { createAuthMiddleware } from './auth'
import { log } from '../middleware/logger'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any

/**
 * POST /api/analyze-style
 * Analyze visual style characteristics of an image
 */
router.post(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { imageUrl } = req.body

      if (!imageUrl) {
        return res.status(400).json({
          error: 'imageUrl is required',
        })
      }

      // Validate imageUrl format
      try {
        new URL(imageUrl)
      } catch {
        return res.status(400).json({
          error: 'imageUrl must be a valid URL',
        })
      }

      log.info(
        { imageUrl, requestId: (req as any).requestId },
        `Analyzing visual style for image`
      )

      // Perform visual style analysis
      const analysis = await VisualStyleAnalyzer.analyzeVisualStyle(imageUrl)

      log.info(
        { imageUrl, requestId: (req as any).requestId },
        `Visual style analysis completed`
      )

      res.json({
        success: true,
        analysis,
      })
    } catch (error) {
      log.error(
        {
          err: error,
          imageUrl: req.body.imageUrl,
          requestId: (req as any).requestId,
        },
        'Visual style analysis error'
      )

      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        })
      }

      res.status(500).json({
        error: 'Failed to analyze visual style',
      })
    }
  }
)

/**
 * GET /api/analyze-style/health
 * Health check endpoint for style analysis service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'visual-style-analyzer',
    timestamp: new Date().toISOString(),
  })
})

export default router
