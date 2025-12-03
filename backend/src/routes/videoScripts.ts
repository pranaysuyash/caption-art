import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AuthModel, Campaign, BrandKit } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import validateRequest from '../middleware/validateRequest'
import { VideoScriptService, VideoScriptGenerationRequest } from '../services/videoScriptService'
import { log } from '../middleware/logger'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas
const generateVideoScriptSchema = z.object({
  campaignId: z.string().optional(),
  brandKitId: z.string().optional(),
  assetDescription: z.string().min(1, 'Asset description is required'),
  product: z.object({
    name: z.string().min(1, 'Product name is required'),
    category: z.string().min(1, 'Product category is required'),
    features: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    useCases: z.array(z.string()).optional(),
  }),
  videoLength: z.number().min(5).max(180),
  platforms: z
    .array(z.enum(['instagram', 'facebook', 'linkedin', 'tiktok']))
    .min(1, 'At least one platform is required'),
  tone: z.array(z.string()).min(1, 'At least one tone is required'),
  objective: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
  targetAudience: z
    .object({
      demographics: z.string().optional(),
      psychographics: z.string().optional(),
      painPoints: z.array(z.string()).optional(),
    })
    .optional(),
  includeStoryboard: z.boolean().optional().default(false),
  visualStyle: z.string().optional(),
})

const videoScriptIdSchema = z.object({
  videoScriptId: z.string().min(1, 'Video Script ID is required'),
})

// In-memory storage for v1 (in production, use database)
const videoScripts = new Map<string, any>()
const videoScriptService = new VideoScriptService()

/**
 * POST /api/video-scripts/generate
 * Generate video script with optional storyboard
 */
router.post(
  '/generate',
  requireAuth,
  validateRequest(generateVideoScriptSchema) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requestData = (req as any).validatedData as VideoScriptGenerationRequest

      // Validate campaign access if provided
      let campaign: Campaign | undefined
      if (requestData.campaignId) {
        campaign = AuthModel.getCampaignById(requestData.campaignId)
        if (!campaign) {
          return res.status(404).json({ error: 'Campaign not found' })
        }

        const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
        if (!workspace || workspace.agencyId !== req.agency.id) {
          return res.status(403).json({ error: 'Access denied' })
        }
      }

      // Validate brand kit access if provided
      let brandKit: BrandKit | undefined
      if (requestData.brandKitId) {
        brandKit = AuthModel.getBrandKitById(requestData.brandKitId)
        if (!brandKit) {
          return res.status(404).json({ error: 'Brand kit not found' })
        }

        const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
        if (!workspace || workspace.agencyId !== req.agency.id) {
          return res.status(403).json({ error: 'Access denied' })
        }
      }

      log.info(
        {
          productName: requestData.product.name,
          videoLength: requestData.videoLength,
          platforms: requestData.platforms,
          includeStoryboard: requestData.includeStoryboard,
          requestId: (req as any).requestId,
        },
        `Generating video script for ${requestData.product.name}`
      )

      // Generate video script using AI
      const result = await videoScriptService.generateVideoScript(
        requestData,
        campaign,
        brandKit
      )

      // Store generated video script
      const videoScriptWithMetadata = {
        ...result.videoScript,
        id: `video-script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        campaignId: requestData.campaignId,
        brandKitId: requestData.brandKitId,
        request: requestData,
        qualityScore: result.qualityScore,
        recommendations: result.recommendations,
        estimatedPerformance: result.estimatedPerformance,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      videoScripts.set(videoScriptWithMetadata.id, videoScriptWithMetadata)

      log.info(
        {
          videoScriptId: videoScriptWithMetadata.id,
          qualityScore: result.qualityScore,
          totalDuration: result.videoScript.totalDuration,
          requestId: (req as any).requestId,
        },
        `Video script generated successfully`
      )

      res.json({
        success: true,
        result: {
          videoScript: result.videoScript,
          videoStoryboard: result.videoStoryboard,
          metadata: {
            id: videoScriptWithMetadata.id,
            qualityScore: result.qualityScore,
            recommendations: result.recommendations,
            estimatedPerformance: result.estimatedPerformance,
          },
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Video script generation error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to generate video script' })
    }
  }
)

/**
 * GET /api/video-scripts
 * List all video scripts for the agency
 */
router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campaignId, platform, status, page = 1, limit = 20 } = req.query

      // Get all campaigns for this agency
      const agencyCampaigns = AuthModel.getAllCampaigns().filter((campaign) => {
        const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
        return workspace?.agencyId === req.agency.id
      })

      const campaignIds = agencyCampaigns.map((c) => c.id)

      // Filter video scripts
      let filteredScripts = Array.from(videoScripts.values()).filter((script) => {
        let matches = true

        if (campaignId) {
          matches = matches && script.campaignId === campaignId
        }

        if (platform) {
          matches = matches && script.request.platforms.includes(platform as string)
        }

        if (status) {
          matches = matches && script.status === status
        }

        matches = matches && (!script.campaignId || campaignIds.includes(script.campaignId))

        return matches
      })

      // Sort by creation date (newest first)
      filteredScripts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit)
      const endIndex = startIndex + Number(limit)
      const paginatedScripts = filteredScripts.slice(startIndex, endIndex)

      res.json({
        success: true,
        videoScripts: paginatedScripts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredScripts.length,
          totalPages: Math.ceil(filteredScripts.length / Number(limit)),
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'List video scripts error'
      )
      res.status(500).json({ error: 'Failed to list video scripts' })
    }
  }
)

/**
 * GET /api/video-scripts/:videoScriptId
 * Get specific video script by ID
 */
router.get(
  '/:videoScriptId',
  requireAuth,
  validateRequest(videoScriptIdSchema) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { videoScriptId } = (req as any).validatedData

      const videoScript = videoScripts.get(videoScriptId)
      if (!videoScript) {
        return res.status(404).json({ error: 'Video script not found' })
      }

      // Verify user has access to the campaign
      if (videoScript.campaignId) {
        const campaign = AuthModel.getCampaignById(videoScript.campaignId)
        if (!campaign) {
          return res.status(404).json({ error: 'Associated campaign not found' })
        }

        const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
        if (!workspace || workspace.agencyId !== req.agency.id) {
          return res.status(403).json({ error: 'Access denied' })
        }
      }

      res.json({
        success: true,
        videoScript,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get video script error'
      )
      res.status(500).json({ error: 'Failed to get video script' })
    }
  }
)

/**
 * POST /api/video-scripts/:videoScriptId/duplicate
 * Duplicate video script
 */
router.post(
  '/:videoScriptId/duplicate',
  requireAuth,
  validateRequest(videoScriptIdSchema) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { videoScriptId } = (req as any).validatedData

      const existingScript = videoScripts.get(videoScriptId)
      if (!existingScript) {
        return res.status(404).json({ error: 'Video script not found' })
      }

      // Verify user has access to the campaign
      if (existingScript.campaignId) {
        const campaign = AuthModel.getCampaignById(existingScript.campaignId)
        if (!campaign) {
          return res.status(404).json({ error: 'Associated campaign not found' })
        }

        const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
        if (!workspace || workspace.agencyId !== req.agency.id) {
          return res.status(403).json({ error: 'Access denied' })
        }
      }

      // Create duplicate
      const duplicate = {
        ...existingScript,
        id: `video-script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${existingScript.request.product.name} Video Script (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      videoScripts.set(duplicate.id, duplicate)

      log.info(
        { videoScriptId: duplicate.id, originalId: videoScriptId },
        `Video script duplicated`
      )

      res.json({
        success: true,
        videoScript: duplicate,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Duplicate video script error'
      )
      res.status(500).json({ error: 'Failed to duplicate video script' })
    }
  }
)

/**
 * DELETE /api/video-scripts/:videoScriptId
 * Delete video script
 */
router.delete(
  '/:videoScriptId',
  requireAuth,
  validateRequest(videoScriptIdSchema) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { videoScriptId } = (req as any).validatedData

      const existingScript = videoScripts.get(videoScriptId)
      if (!existingScript) {
        return res.status(404).json({ error: 'Video script not found' })
      }

      // Verify user has access to the campaign
      if (existingScript.campaignId) {
        const campaign = AuthModel.getCampaignById(existingScript.campaignId)
        if (!campaign) {
          return res.status(404).json({ error: 'Associated campaign not found' })
        }

        const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
        if (!workspace || workspace.agencyId !== req.agency.id) {
          return res.status(403).json({ error: 'Access denied' })
        }
      }

      videoScripts.delete(videoScriptId)

      log.info(
        { videoScriptId },
        `Video script deleted`
      )

      res.json({
        success: true,
        message: 'Video script deleted successfully',
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Delete video script error'
      )
      res.status(500).json({ error: 'Failed to delete video script' })
    }
  }
)

/**
 * GET /api/video-scripts/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'video-script-service',
    timestamp: new Date().toISOString(),
    videoScriptsCount: videoScripts.size,
    capabilities: [
      'video-script-generation',
      '5-scene-structure',
      'campaign-aware-scripting',
      'storyboard-generation',
      'quality-scoring',
      'performance-estimation',
      'multi-platform-support',
    ],
  })
})

export default router