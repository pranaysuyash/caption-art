import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AuthModel, Asset, BrandKit, Campaign, CaptionVariation, StyleReference } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import validateRequest from '../middleware/validateRequest'
import { MultiFormatService, MultiFormatGenerationRequest } from '../services/multiFormatService'
import { log } from '../middleware/logger'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any
const multiFormatService = new MultiFormatService()

// Validation schemas
const generateMultiFormatSchema = z.object({
  sourceAssetId: z.string().min(1, 'Source asset ID is required'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  captionVariationId: z.string().optional(),
  brandKitId: z.string().optional(),
  campaignId: z.string().optional(),
  outputFormats: z
    .array(z.enum(['square', 'story', 'landscape']))
    .min(1, 'At least one output format is required')
    .max(3, 'Maximum 3 output formats allowed'),
  platforms: z.object({
    square: z.array(z.enum(['instagram', 'facebook', 'linkedin'])).optional(),
    story: z.array(z.enum(['instagram', 'facebook', 'tiktok'])).optional(),
    landscape: z.array(z.enum(['youtube', 'facebook', 'linkedin'])).optional(),
  }).optional(),
  styleReferences: z.array(z.string()).optional(),
  synthesisMode: z.enum(['dominant', 'balanced', 'creative', 'conservative']).optional(),
})

const multiFormatOutputIdSchema = z.object({
  outputId: z.string().min(1, 'Multi-format output ID is required'),
})

const workspaceIdSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
})

// In-memory storage for v2 (in production, use database)
const multiFormatOutputs = new Map<string, any>()

/**
 * POST /api/multi-format/generate
 * Generate multi-format outputs for a source asset
 */
router.post(
  '/generate',
  requireAuth,
  validateRequest(generateMultiFormatSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const requestData = (req as any).validatedData as MultiFormatGenerationRequest

      // Validate workspace access
      const workspace = AuthModel.getWorkspaceById(requestData.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Validate source asset access
      const asset = AuthModel.getAssetById(requestData.sourceAssetId)
      if (!asset || asset.workspaceId !== requestData.workspaceId) {
        return res.status(404).json({ error: 'Source asset not found' })
      }

      // Validate caption variation access if provided
      let captionVariation: CaptionVariation | undefined
      if (requestData.captionVariationId) {
        captionVariation = Array.from(multiFormatOutputs.values()).find(
          output => output.id === requestData.captionVariationId
        )
        if (!captionVariation) {
          return res.status(404).json({ error: 'Caption variation not found' })
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

        const campaignWorkspace = AuthModel.getWorkspaceById(campaign.workspaceId)
        if (!campaignWorkspace || campaignWorkspace.agencyId !== req.agency.id) {
          return res.status(403).json({ error: 'Access denied' })
        }
      }

      log.info(
        {
          sourceAssetId: requestData.sourceAssetId,
          outputFormats: requestData.outputFormats,
          platforms: requestData.platforms,
          requestId: (req as any).requestId,
        },
        `Generating multi-format outputs for ${requestData.outputFormats.length} formats`
      )

      // Generate multi-format outputs
      const result = await multiFormatService.generateMultiFormatOutputs(
        requestData,
        asset,
        brandKit,
        campaign,
        captionVariation
      )

      // Store generated outputs
      const multiFormatWithMetadata = {
        id: `multi-format-${Date.now()}`,
        request: requestData,
        outputs: result.outputs,
        qualityMetrics: result.qualityMetrics,
        recommendations: result.recommendations,
        processingTime: result.processingTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      multiFormatOutputs.set(multiFormatWithMetadata.id, multiFormatWithMetadata)

      log.info(
        {
          multiFormatId: multiFormatWithMetadata.id,
          outputsCount: result.outputs.length,
          avgQualityScore: result.qualityMetrics.overallScore,
          processingTime: result.processingTime,
          requestId: (req as any).requestId,
        },
        `Multi-format generation completed`
      )

      res.json({
        success: true,
        result: {
          multiFormatId: multiFormatWithMetadata.id,
          outputs: result.outputs,
          qualityMetrics: result.qualityMetrics,
          recommendations: result.recommendations,
          processingTime: result.processingTime,
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Multi-format generation error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to generate multi-format outputs' })
    }
  }
)

/**
 * GET /api/multi-format
 * List all multi-format generations for the agency
 */
router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { workspaceId, format, status, page = 1, limit = 20 } = req.query

      // Get all workspaces for this agency
      const agencyWorkspaces = AuthModel.getAllWorkspaces().filter((workspace) =>
        workspace.agencyId === req.agency.id
      )

      const workspaceIds = agencyWorkspaces.map((w) => w.id)

      // Filter multi-format outputs
      let filteredOutputs = Array.from(multiFormatOutputs.values()).filter((output) => {
        let matches = true

        if (workspaceId) {
          matches = matches && output.request.workspaceId === workspaceId
        }

        if (format) {
          matches = matches && output.request.outputFormats.includes(format as string)
        }

        if (status) {
          // For v2, all outputs are 'completed'
          matches = matches && status === 'completed'
        }

        matches = matches && workspaceIds.includes(output.request.workspaceId)

        return matches
      })

      // Sort by creation date (newest first)
      filteredOutputs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit)
      const endIndex = startIndex + Number(limit)
      const paginatedOutputs = filteredOutputs.slice(startIndex, endIndex)

      res.json({
        success: true,
        multiFormats: paginatedOutputs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredOutputs.length,
          totalPages: Math.ceil(filteredOutputs.length / Number(limit)),
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'List multi-formats error'
      )
      res.status(500).json({ error: 'Failed to list multi-format outputs' })
    }
  }
)

/**
 * GET /api/multi-format/:multiFormatId
 * Get specific multi-format output by ID
 */
router.get(
  '/:multiFormatId',
  requireAuth,
  validateRequest(multiFormatOutputIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { multiFormatId } = (req as any).validatedData

      const multiFormat = multiFormatOutputs.get(multiFormatId)
      if (!multiFormat) {
        return res.status(404).json({ error: 'Multi-format output not found' })
      }

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(multiFormat.request.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      res.json({
        success: true,
        multiFormat,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get multi-format error'
      )
      res.status(500).json({ error: 'Failed to get multi-format output' })
    }
  }
)

/**
 * POST /api/multi-format/:multiFormatId/duplicate
 * Duplicate multi-format output with different settings
 */
router.post(
  '/:multiFormatId/duplicate',
  requireAuth,
  validateRequest(multiFormatOutputIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { multiFormatId } = (req as any).validatedData
      const { outputFormats, platforms, synthesisMode } = req.body

      const existingMultiFormat = multiFormatOutputs.get(multiFormatId)
      if (!existingMultiFormat) {
        return res.status(404).json({ error: 'Multi-format output not found' })
      }

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(existingMultiFormat.request.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Create duplicate request with modified parameters
      const duplicateRequest: MultiFormatGenerationRequest = {
        ...existingMultiFormat.request,
        outputFormats: outputFormats || existingMultiFormat.request.outputFormats,
        platforms: platforms || existingMultiFormat.request.platforms,
        synthesisMode: synthesisMode || existingMultiFormat.request.synthesisMode,
      }

      log.info(
        { originalId: multiFormatId, requestId: (req as any).requestId },
        `Duplicating multi-format output`
      )

      // Generate duplicate outputs
      const result = await multiFormatService.generateMultiFormatOutputs(
        duplicateRequest
      )

      // Store duplicate
      const duplicate = {
        ...existingMultiFormat,
        id: `multi-format-${Date.now()}`,
        request: duplicateRequest,
        outputs: result.outputs,
        qualityMetrics: result.qualityMetrics,
        recommendations: result.recommendations,
        processingTime: result.processingTime,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: `${existingMultiFormat.name || 'Multi-Format'} (Duplicate)`,
      }

      multiFormatOutputs.set(duplicate.id, duplicate)

      log.info(
        { multiFormatId: duplicate.id, originalId: multiFormatId },
        `Multi-format output duplicated`
      )

      res.json({
        success: true,
        multiFormat: duplicate,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Duplicate multi-format error'
      )
      res.status(500).json({ error: 'Failed to duplicate multi-format output' })
    }
  }
)

/**
 * DELETE /api/multi-format/:multiFormatId
 * Delete multi-format output
 */
router.delete(
  '/:multiFormatId',
  requireAuth,
  validateRequest(multiFormatOutputIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { multiFormatId } = (req as any).validatedData

      const existingMultiFormat = multiFormatOutputs.get(multiFormatId)
      if (!existingMultiFormat) {
        return res.status(404).json({ error: 'Multi-format output not found' })
      }

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(existingMultiFormat.request.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      multiFormatOutputs.delete(multiFormatId)

      log.info(
        { multiFormatId },
        `Multi-format output deleted`
      )

      res.json({
        success: true,
        message: 'Multi-format output deleted successfully',
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Delete multi-format error'
      )
      res.status(500).json({ error: 'Failed to delete multi-format output' })
    }
  }
)

/**
 * GET /api/multi-format/workspace/:workspaceId/stats
 * Get statistics for multi-format outputs in a workspace
 */
router.get(
  '/workspace/:workspaceId/stats',
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

      const stats = multiFormatService.getMultiFormatStats(workspaceId)

      res.json({
        success: true,
        stats,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get multi-format stats error'
      )
      res.status(500).json({ error: 'Failed to get multi-format statistics' })
    }
  }
)

/**
 * GET /api/multi-format/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: any) => {
  res.json({
    status: 'ok',
    service: 'multi-format-service',
    timestamp: new Date().toISOString(),
    multiFormatCount: multiFormatOutputs.size,
    capabilities: [
      'multi-format-generation',
      'square-format (1:1)',
      'story-format (9:16)',
      'landscape-format (16:9)',
      'platform-optimization',
      'campaign-aware-generation',
      'style-synthesis-ready',
      'quality-metrics',
    ],
  })
})

export default router