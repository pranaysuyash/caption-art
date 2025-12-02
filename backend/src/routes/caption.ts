import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { generateBaseCaption } from '../services/replicate'
import { rewriteCaption } from '../services/openai'
import { CaptionGenerator, CAPTION_TEMPLATES } from '../services/captionGenerator'
import { AuthModel } from '../models/auth'
import { createAuthMiddleware } from './auth'
import { CaptionResponse } from '../types/api'
import { CaptionRequestSchema } from '../schemas/validation'
import { ValidationError, ExternalAPIError } from '../errors/AppError'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas
const batchCaptionSchema = z.object({
  workspaceId: z.string().min(1),
  assetIds: z.array(z.string().min(1)).max(30),
  template: z.enum(['punchy', 'descriptive', 'hashtag-heavy', 'storytelling', 'question']).optional().default('descriptive')
})

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

// POST /api/caption/batch - Start batch caption generation
router.post('/batch', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as unknown as any
    const { workspaceId, assetIds, template } = batchCaptionSchema.parse(req.body)

    // Verify workspace belongs to current agency
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Verify all assets belong to workspace
    for (const assetId of assetIds) {
      const asset = AuthModel.getAssetById(assetId)
      if (!asset) {
        return res.status(404).json({ error: `Asset ${assetId} not found` })
      }
      if (asset.workspaceId !== workspaceId) {
        return res.status(403).json({ error: `Asset ${assetId} does not belong to this workspace` })
      }
    }

    // Create batch job with template
    const job = AuthModel.createBatchJob(workspaceId, assetIds)

    // Update job with template
    AuthModel.updateBatchJob(job.id, { template })

    // Start processing in background
    CaptionGenerator.processBatchJob(job.id).catch(error => {
      console.error(`Background batch processing failed for job ${job.id}:`, error)
    })

    res.status(201).json({
      message: `Batch caption generation started for ${assetIds.length} assets using ${template} template`,
      job: {
        id: job.id,
        workspaceId,
        assetCount: assetIds.length,
        template,
        status: job.status
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues })
    }
    console.error('Batch caption generation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/caption/batch/:jobId - Get batch job status
router.get('/batch/:jobId', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as unknown as any
    const { jobId } = req.params

    const job = AuthModel.getBatchJobById(jobId)
    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' })
    }

    // Verify job belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(job.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ job })
  } catch (error) {
    console.error('Get batch job error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/caption/templates - Get available caption templates
router.get('/templates', (req: Request, res: Response) => {
  res.json({
    templates: CAPTION_TEMPLATES,
    defaultTemplate: 'descriptive'
  })
})

export default router
