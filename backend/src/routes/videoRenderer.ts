import { Router, Request, Response } from 'express'
import { z } from 'zod'
import {
  AuthModel,
  Asset,
  BrandKit,
  Campaign,
  VideoScript,
  CaptionVariation,
} from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import validateRequest from '../middleware/validateRequest'
import {
  VideoRenderingService,
  VideoRenderRequest,
  VideoRenderResult,
} from '../services/videoRenderingService'
import { log } from '../middleware/logger'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any
const videoRenderer = new VideoRenderingService()

// Validation schemas
const submitRenderRequestSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  sourceAssets: z
    .array(z.string())
    .min(1, 'At least one source asset is required'),
  videoScriptId: z.string().optional(),
  captionVariationId: z.string().optional(),
  outputFormat: z.enum(['square', 'story', 'landscape', 'vertical']),
  duration: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(60),
    z.literal(90),
    z.literal(120),
  ]),
  style: z.enum([
    'professional',
    'energetic',
    'minimal',
    'cinematic',
    'animated',
  ]),
  brandKitId: z.string().optional(),
  campaignId: z.string().optional(),
  quality: z.enum(['draft', 'standard', 'high']).default('standard'),
  includeAudio: z.boolean().default(true),
  audioStyle: z.enum(['upbeat', 'corporate', 'dramatic', 'minimal']).optional(),
  customizations: z
    .object({
      textOverlays: z.boolean().default(true),
      logoPosition: z
        .enum([
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
          'center',
        ])
        .optional(),
      colorScheme: z.array(z.string()).optional(),
      fontChoice: z.string().optional(),
    })
    .optional(),
})

const renderIdSchema = z.object({
  renderId: z.string().min(1, 'Render ID is required'),
})

const workspaceIdSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
})

const cancelRenderSchema = z.object({
  renderId: z.string().min(1, 'Render ID is required'),
  reason: z.string().optional(),
})

/**
 * POST /api/video-renderer/submit
 * Submit a video render request
 */
router.post(
  '/submit',
  requireAuth,
  validateRequest(submitRenderRequestSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const requestData = (req as any).validatedData as VideoRenderRequest

      // Validate workspace access
      const workspace = AuthModel.getWorkspaceById(requestData.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Validate source assets access
      const assets = requestData.sourceAssets.map((assetId) => {
        const asset = AuthModel.getAssetById(assetId)
        if (!asset || asset.workspaceId !== requestData.workspaceId) {
          throw new Error(`Asset ${assetId} not found or access denied`)
        }
        return asset
      })

      // Validate video script access if provided
      let videoScript: VideoScript | undefined
      if (requestData.videoScriptId) {
        videoScript = {
          // Mock script data for now
          scenes: [
            {
              sceneNumber: 1,
              type: 'hook',
              description: 'Hook scene',
              visualDescription: 'Visual description',
              duration: 3,
              script: 'Hook scene content',
            },
          ],
          estimatedDuration: requestData.duration,
          callToAction: 'Call to action',
          platform: 'instagram',
        }
      }

      // Validate caption variation access if provided
      let captionVariation: CaptionVariation | undefined
      if (requestData.captionVariationId) {
        captionVariation = {
          id: requestData.captionVariationId,
          label: 'main',
          text: 'Mock caption variation',
          status: 'completed',
          approvalStatus: 'pending',
          approved: false,
          createdAt: new Date(),
          generatedAt: new Date(),
        }
      }

      // Validate brand kit access if provided
      let brandKit: BrandKit | undefined
      if (requestData.brandKitId) {
        brandKit = AuthModel.getBrandKitById(requestData.brandKitId)
        if (!brandKit || brandKit.workspaceId !== requestData.workspaceId) {
          return res.status(404).json({ error: 'Brand kit not found' })
        }
      }

      // Validate campaign access if provided
      let campaign: Campaign | undefined
      if (requestData.campaignId) {
        campaign = AuthModel.getCampaignById(requestData.campaignId)
        if (!campaign) {
          return res.status(404).json({ error: 'Campaign not found' })
        }

        const campaignWorkspace = AuthModel.getWorkspaceById(
          campaign.workspaceId
        )
        if (
          !campaignWorkspace ||
          campaignWorkspace.agencyId !== req.agency.id
        ) {
          return res.status(403).json({ error: 'Access denied' })
        }
      }

      log.info(
        {
          workspaceId: requestData.workspaceId,
          assetCount: requestData.sourceAssets.length,
          duration: requestData.duration,
          format: requestData.outputFormat,
          style: requestData.style,
          requestId: (req as any).requestId,
        },
        'Submitting video render request'
      )

      const renderResult = await videoRenderer.submitRenderRequest(
        requestData,
        assets,
        videoScript,
        brandKit,
        campaign
      )

      log.info(
        {
          renderId: renderResult.id,
          status: renderResult.renderJob.status,
          queuePosition: videoRenderer.getRenderQueueStats().queueLength,
          requestId: (req as any).requestId,
        },
        'Video render request submitted successfully'
      )

      res.json({
        success: true,
        render: renderResult,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Video render submission error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to submit video render request' })
    }
  }
)

/**
 * GET /api/video-renderer/:renderId
 * Get render status and details
 */
router.get(
  '/:renderId',
  requireAuth,
  validateRequest(renderIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { renderId } = (req as any).validatedData

      const renderResult = videoRenderer.getRenderStatus(renderId)
      if (!renderResult) {
        return res.status(404).json({ error: 'Video render not found' })
      }

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(
        renderResult.request.workspaceId
      )
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      res.json({
        success: true,
        render: renderResult,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get render status error'
      )
      res.status(500).json({ error: 'Failed to get render status' })
    }
  }
)

/**
 * GET /api/video-renderer
 * List all renders for the agency
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { workspaceId, status, format, page = 1, limit = 20 } = req.query

    // Get all workspaces for this agency
    const agencyWorkspaces = AuthModel.getAllWorkspaces().filter(
      (workspace) => workspace.agencyId === req.agency.id
    )

    const workspaceIds = agencyWorkspaces.map((w) => w.id)

    // Get renders from all accessible workspaces
    let allRenders: VideoRenderResult[] = []
    workspaceIds.forEach((id) => {
      allRenders.push(...videoRenderer.getWorkspaceRenders(id))
    })

    // Filter results
    let filteredRenders = allRenders.filter((render) => {
      let matches = true

      if (workspaceId) {
        matches = matches && render.request.workspaceId === workspaceId
      }

      if (status) {
        matches = matches && render.renderJob.status === status
      }

      if (format) {
        matches = matches && render.request.outputFormat === format
      }

      return matches
    })

    // Sort by creation date (newest first)
    filteredRenders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedRenders = filteredRenders.slice(startIndex, endIndex)

    res.json({
      success: true,
      renders: paginatedRenders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredRenders.length,
        totalPages: Math.ceil(filteredRenders.length / Number(limit)),
      },
    })
  } catch (error) {
    log.error(
      { err: error, requestId: (req as any).requestId },
      'List renders error'
    )
    res.status(500).json({ error: 'Failed to list video renders' })
  }
})

/**
 * POST /api/video-renderer/:renderId/cancel
 * Cancel a render request
 */
router.post(
  '/:renderId/cancel',
  requireAuth,
  validateRequest(cancelRenderSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { renderId } = (req as any).validatedData
      const { reason } = req.body

      // Get render to verify access
      const renderResult = videoRenderer.getRenderStatus(renderId)
      if (!renderResult) {
        return res.status(404).json({ error: 'Video render not found' })
      }

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(
        renderResult.request.workspaceId
      )
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const cancelled = videoRenderer.cancelRender(renderId)

      if (cancelled) {
        log.info(
          { renderId, reason, requestId: (req as any).requestId },
          'Video render cancelled successfully'
        )

        res.json({
          success: true,
          message: 'Video render cancelled successfully',
        })
      } else {
        res.status(400).json({
          success: false,
          error: 'Cannot cancel render - it may already be completed or failed',
        })
      }
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Cancel render error'
      )
      res.status(500).json({ error: 'Failed to cancel video render' })
    }
  }
)

/**
 * GET /api/video-renderer/workspace/:workspaceId
 * Get all renders for a specific workspace
 */
router.get(
  '/workspace/:workspaceId',
  requireAuth,
  validateRequest(workspaceIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { workspaceId } = (req as any).validatedData

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const renders = videoRenderer.getWorkspaceRenders(workspaceId)

      res.json({
        success: true,
        renders,
        count: renders.length,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get workspace renders error'
      )
      res.status(500).json({ error: 'Failed to get workspace renders' })
    }
  }
)

/**
 * GET /api/video-renderer/queue/stats
 * Get render queue statistics
 */
router.get(
  '/queue/stats',
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const queueStats = videoRenderer.getRenderQueueStats()

      res.json({
        success: true,
        queueStats,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get queue stats error'
      )
      res.status(500).json({ error: 'Failed to get queue statistics' })
    }
  }
)

/**
 * GET /api/video-renderer/analytics
 * Get render analytics for the agency
 */
router.get(
  '/analytics',
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { workspaceId, startDate, endDate } = req.query

      // Get analytics
      let analytics = videoRenderer.getRenderAnalytics()

      // Filter by workspace if specified
      if (workspaceId) {
        // Verify workspace access
        const workspace = AuthModel.getWorkspaceById(workspaceId as string)
        if (!workspace || workspace.agencyId !== req.agency.id) {
          return res.status(403).json({ error: 'Access denied' })
        }

        analytics = videoRenderer.getRenderAnalytics(workspaceId as string)
      }

      res.json({
        success: true,
        analytics,
        filters: {
          workspaceId,
          startDate,
          endDate,
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get render analytics error'
      )
      res.status(500).json({ error: 'Failed to get render analytics' })
    }
  }
)

/**
 * GET /api/video-renderer/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: any) => {
  const queueStats = videoRenderer.getRenderQueueStats()
  const analytics = videoRenderer.getRenderAnalytics()

  res.json({
    status: 'ok',
    service: 'video-renderer-service',
    timestamp: new Date().toISOString(),
    capabilities: [
      'video-rendering',
      'multiple-formats',
      'render-queue',
      'progress-tracking',
      'quality-levels',
      'audio-support',
      'brand-integration',
      'script-based-rendering',
    ],
    queueStats,
    analytics: {
      totalRenders: analytics.totalRenders,
      completedRenders: analytics.completedRenders,
      successRate:
        analytics.totalRenders > 0
          ? Math.round(
              (analytics.completedRenders / analytics.totalRenders) * 100
            )
          : 0,
    },
    performance: {
      averageRenderTime: analytics.averageRenderTime,
      averageQualityScore: analytics.averageQualityScore,
    },
  })
})

export default router
