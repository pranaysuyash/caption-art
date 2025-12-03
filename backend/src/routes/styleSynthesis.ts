import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AuthModel, StyleReference, BrandKit, Campaign } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import validateRequest from '../middleware/validateRequest'
import {
  StyleSynthesisService,
  StyleMatchResult,
} from '../services/styleSynthesisService'
import { log } from '../middleware/logger'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any
const styleSynthesisService = new StyleSynthesisService()

// Validation schemas
const analyzeStyleSchema = z.object({
  referenceId: z.string().min(1, 'Reference ID is required'),
})

const synthesizeStylesSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  styleReferences: z
    .array(z.string())
    .min(1, 'At least one style reference is required'),
  synthesisMode: z
    .enum(['dominant', 'balanced', 'creative', 'conservative'])
    .optional(),
  targetFormat: z.string().optional(),
  brandKitId: z.string().optional(),
  campaignId: z.string().optional(),
})

const findMatchingStylesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  limit: z.number().min(1).max(50).optional(),
})

const styleSynthesisIdSchema = z.object({
  synthesisId: z.string().min(1, 'Style synthesis ID is required'),
})

const styleReferenceIdSchema = z.object({
  referenceId: z.string().min(1, 'Style reference ID is required'),
})

// In-memory storage for v2 (in production, use database)
const styleSyntheses = new Map<string, any>()
const styleReferences = new Map<string, StyleReference>()

/**
 * POST /api/style-synthesis/analyze
 * Analyze a style reference to extract visual attributes
 */
router.post(
  '/analyze',
  requireAuth,
  validateRequest(analyzeStyleSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { referenceId } = (req as any).validatedData

      // Get style reference
      let reference = styleReferences.get(referenceId)
      if (!reference) {
        // Try to get from auth model or create mock for testing
        reference = {
          id: referenceId,
          workspaceId: 'test-workspace',
          name: `Style Reference ${referenceId}`,
          description: 'Mock style reference for analysis',
          referenceImages: [`https://example.com/style/${referenceId}`],
          extractedStyles: {
            colorPalette: {
              primary: [],
              secondary: [],
              accent: [],
            },
            typography: {
              fonts: [],
              weights: [],
              sizes: [],
            },
            composition: {
              layout: 'centered',
              spacing: 'normal',
              balance: 'symmetrical',
            },
            visualElements: {
              gradients: false,
              shadows: false,
              borders: false,
              patterns: false,
              illustration: false,
              photography: true,
            },
          },
          usageCount: 0,
          createdAt: new Date(),
        }
        styleReferences.set(referenceId, reference)
      }

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(reference.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      log.info(
        { referenceId, requestId: (req as any).requestId },
        'Analyzing style reference'
      )

      const analysis =
        await styleSynthesisService.analyzeStyleReference(reference)

      res.json({
        success: true,
        analysis,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Style analysis error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to analyze style reference' })
    }
  }
)

/**
 * POST /api/style-synthesis/synthesize
 * Synthesize multiple style references into a unified style
 */
router.post(
  '/synthesize',
  requireAuth,
  validateRequest(synthesizeStylesSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const requestData = (req as any).validatedData

      // Validate workspace access
      const workspace = AuthModel.getWorkspaceById(requestData.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
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
          referenceCount: requestData.styleReferences.length,
          synthesisMode: requestData.synthesisMode,
          requestId: (req as any).requestId,
        },
        'Starting style synthesis'
      )

      const synthesisRequest = {
        workspaceId: requestData.workspaceId,
        styleReferences: requestData.styleReferences,
        synthesisMode: requestData.synthesisMode || 'balanced',
        targetFormat: requestData.targetFormat,
      }

      const result = await styleSynthesisService.synthesizeStyles(
        synthesisRequest,
        brandKit,
        campaign
      )

      // Store synthesis result
      const synthesisWithMetadata = {
        id: result.id,
        request: synthesisRequest,
        result,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      styleSyntheses.set(result.id, synthesisWithMetadata)

      log.info(
        {
          synthesisId: result.id,
          qualityScore: result.qualityMetrics.overallScore,
          processingTime: result.processingTime,
          requestId: (req as any).requestId,
        },
        'Style synthesis completed'
      )

      res.json({
        success: true,
        result,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Style synthesis error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to synthesize styles' })
    }
  }
)

/**
 * GET /api/style-synthesis/match
 * Find style references that match a given aesthetic
 */
router.get(
  '/match',
  requireAuth,
  validateRequest(findMatchingStylesSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { query, workspaceId, limit = 10 } = (req as any).validatedData

      // Validate workspace access
      const workspace = AuthModel.getWorkspaceById(workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      log.info(
        { query, workspaceId, limit, requestId: (req as any).requestId },
        'Searching for matching styles'
      )

      const matches = await styleSynthesisService.findMatchingStyles(
        query,
        workspaceId,
        limit
      )

      res.json({
        success: true,
        matches,
        pagination: {
          query,
          limit,
          total: matches.length,
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Style matching error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to find matching styles' })
    }
  }
)

/**
 * GET /api/style-synthesis
 * List all style syntheses for the agency
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { workspaceId, synthesisMode, page = 1, limit = 20 } = req.query

    // Get all workspaces for this agency
    const agencyWorkspaces = AuthModel.getAllWorkspaces().filter(
      (workspace) => workspace.agencyId === req.agency.id
    )

    const workspaceIds = agencyWorkspaces.map((w) => w.id)

    // Filter style syntheses
    let filteredSyntheses = Array.from(styleSyntheses.values()).filter(
      (synthesis) => {
        let matches = true

        if (workspaceId) {
          matches = matches && synthesis.request.workspaceId === workspaceId
        }

        if (synthesisMode) {
          matches =
            matches &&
            synthesis.result.synthesizedStyle.synthesisMode === synthesisMode
        }

        matches =
          matches && workspaceIds.includes(synthesis.request.workspaceId)

        return matches
      }
    )

    // Sort by creation date (newest first)
    filteredSyntheses.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedSyntheses = filteredSyntheses.slice(startIndex, endIndex)

    res.json({
      success: true,
      syntheses: paginatedSyntheses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredSyntheses.length,
        totalPages: Math.ceil(filteredSyntheses.length / Number(limit)),
      },
    })
  } catch (error) {
    log.error(
      { err: error, requestId: (req as any).requestId },
      'List style syntheses error'
    )
    res.status(500).json({ error: 'Failed to list style syntheses' })
  }
})

/**
 * GET /api/style-synthesis/:synthesisId
 * Get specific style synthesis by ID
 */
router.get(
  '/:synthesisId',
  requireAuth,
  validateRequest(styleSynthesisIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { synthesisId } = (req as any).validatedData

      const synthesis = styleSyntheses.get(synthesisId)
      if (!synthesis) {
        return res.status(404).json({ error: 'Style synthesis not found' })
      }

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(
        synthesis.request.workspaceId
      )
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      res.json({
        success: true,
        synthesis,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get style synthesis error'
      )
      res.status(500).json({ error: 'Failed to get style synthesis' })
    }
  }
)

/**
 * POST /api/style-synthesis/:synthesisId/duplicate
 * Duplicate style synthesis with different settings
 */
router.post(
  '/:synthesisId/duplicate',
  requireAuth,
  validateRequest(styleSynthesisIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { synthesisId } = (req as any).validatedData
      const { synthesisMode, targetFormat, additionalReferences } = req.body

      const existingSynthesis = styleSyntheses.get(synthesisId)
      if (!existingSynthesis) {
        return res.status(404).json({ error: 'Style synthesis not found' })
      }

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(
        existingSynthesis.request.workspaceId
      )
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Create duplicate request with modified parameters
      const duplicateRequest = {
        ...existingSynthesis.request,
        synthesisMode: synthesisMode || existingSynthesis.request.synthesisMode,
        targetFormat: targetFormat || existingSynthesis.request.targetFormat,
        styleReferences: additionalReferences
          ? [
              ...existingSynthesis.request.styleReferences,
              ...additionalReferences,
            ]
          : existingSynthesis.request.styleReferences,
      }

      log.info(
        { originalId: synthesisId, requestId: (req as any).requestId },
        'Duplicating style synthesis'
      )

      const result =
        await styleSynthesisService.synthesizeStyles(duplicateRequest)

      // Store duplicate
      const duplicate = {
        ...existingSynthesis,
        id: result.id,
        request: duplicateRequest,
        result,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: `${existingSynthesis.name || 'Style Synthesis'} (Duplicate)`,
      }

      styleSyntheses.set(result.id, duplicate)

      log.info(
        { synthesisId: result.id, originalId: synthesisId },
        'Style synthesis duplicated'
      )

      res.json({
        success: true,
        synthesis: duplicate,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Duplicate style synthesis error'
      )
      res.status(500).json({ error: 'Failed to duplicate style synthesis' })
    }
  }
)

/**
 * DELETE /api/style-synthesis/:synthesisId
 * Delete style synthesis
 */
router.delete(
  '/:synthesisId',
  requireAuth,
  validateRequest(styleSynthesisIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { synthesisId } = (req as any).validatedData

      const existingSynthesis = styleSyntheses.get(synthesisId)
      if (!existingSynthesis) {
        return res.status(404).json({ error: 'Style synthesis not found' })
      }

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(
        existingSynthesis.request.workspaceId
      )
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      styleSyntheses.delete(synthesisId)

      log.info({ synthesisId }, 'Style synthesis deleted')

      res.json({
        success: true,
        message: 'Style synthesis deleted successfully',
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Delete style synthesis error'
      )
      res.status(500).json({ error: 'Failed to delete style synthesis' })
    }
  }
)

/**
 * GET /api/style-synthesis/workspace/:workspaceId/stats
 * Get statistics for style syntheses in a workspace
 */
router.get(
  '/workspace/:workspaceId/stats',
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { workspaceId } = req.params

      // Verify workspace access
      const workspace = AuthModel.getWorkspaceById(workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Calculate stats
      const workspaceSyntheses = Array.from(styleSyntheses.values()).filter(
        (synthesis) => synthesis.request.workspaceId === workspaceId
      )

      const stats = {
        totalSyntheses: workspaceSyntheses.length,
        avgQualityScore:
          workspaceSyntheses.length > 0
            ? Math.round(
                workspaceSyntheses.reduce(
                  (sum, s) => sum + s.result.qualityMetrics.overallScore,
                  0
                ) / workspaceSyntheses.length
              )
            : 0,
        synthesisModes: workspaceSyntheses.reduce(
          (modes, s) => {
            const mode = s.result.synthesizedStyle.synthesisMode
            modes[mode] = (modes[mode] || 0) + 1
            return modes
          },
          {} as Record<string, number>
        ),
        avgProcessingTime:
          workspaceSyntheses.length > 0
            ? Math.round(
                workspaceSyntheses.reduce(
                  (sum, s) => sum + s.result.processingTime,
                  0
                ) / workspaceSyntheses.length
              )
            : 0,
      }

      res.json({
        success: true,
        stats,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get style synthesis stats error'
      )
      res
        .status(500)
        .json({ error: 'Failed to get style synthesis statistics' })
    }
  }
)

/**
 * GET /api/style-synthesis/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: any) => {
  res.json({
    status: 'ok',
    service: 'style-synthesis-service',
    timestamp: new Date().toISOString(),
    synthesesCount: styleSyntheses.size,
    referencesCount: styleReferences.size,
    capabilities: [
      'style-reference-analysis',
      'multi-style-synthesis',
      'style-matching-search',
      'dominant-mode-synthesis',
      'balanced-mode-synthesis',
      'creative-mode-synthesis',
      'conservative-mode-synthesis',
      'quality-metrics',
      'brand-alignment-scoring',
    ],
  })
})

export default router
