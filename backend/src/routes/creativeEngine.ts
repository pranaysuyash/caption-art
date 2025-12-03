import { Router } from 'express'
import { z } from 'zod'
import { createAuthMiddleware } from '../routes/auth'
import validateRequest from '../middleware/validateRequest'
import { AuthenticatedRequest } from '../types/auth'
import { AuthModel } from '../models/auth'
import CreativeEngine from '../services/creativeEngine'
import { log } from '../middleware/logger'

const router = Router()
log.info('Initializing creative engine router')
const requireAuth = createAuthMiddleware() as any
const engine = CreativeEngine.getInstance()

// Schema validation
const generateCreativesSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  campaignId: z.string().optional(),
  brandKitId: z.string().min(1, 'Brand Kit ID is required'),
  sourceAssets: z
    .array(z.string())
    .min(1, 'At least one source asset is required'),
  referenceCreatives: z.array(z.string()).optional(),
  objectives: z
    .array(z.enum(['awareness', 'traffic', 'conversion', 'engagement']))
    .optional(),
  platforms: z
    .array(z.enum(['ig-feed', 'ig-story', 'fb-feed', 'fb-story', 'li-feed']))
    .optional(),
  outputCount: z.number().min(1).max(50).optional(),
  mode: z.enum(['caption', 'ad-copy']).optional(),
  mustIncludePhrases: z.array(z.string()).optional(),
  mustExcludePhrases: z.array(z.string()).optional(),
  styleTags: z.array(z.string()).optional(),
})

// Debug middleware - still useful in dev mode to get request-level context
router.use((req, res, next) => {
  log.info(
    { requestId: (req as any).requestId, method: req.method, path: req.path },
    'CREATIVE ENGINE ROUTER REQ'
  )
  next()
})

/**
 * POST /api/creative-engine/generate - Generate finished creatives from inputs
 *
 * This is the core endpoint that transforms:
 * - reference creatives → style learning
 * - brand kits → visual identity
 * - campaign briefs → creative direction
 * - client assets → production input
 *
 * Into finished, platform-specific creatives in minutes.
 */
router.post(
  '/generate',
  requireAuth,
  validateRequest(generateCreativesSchema) as any,
  async (req, res) => {
    log.info(
      { requestId: (req as any).requestId },
      'Creative Engine: Starting creative generation'
    )
    const startTime = Date.now()

    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      let validatedData = (req as any).validatedData
      // Sanitize textual inputs to prevent injection and excessive length
      const { sanitizeKeywords, sanitizeText, sanitizePhrases } =
        await import('../utils/sanitizers')
      if (validatedData.styleTags)
        validatedData.styleTags = sanitizeKeywords(
          validatedData.styleTags
        ) as any
      if (validatedData.referenceCreatives)
        validatedData.referenceCreatives = validatedData.referenceCreatives.map(
          (rc: string) => sanitizeText(rc, 500) || rc
        )
      if (validatedData.mustIncludePhrases)
        validatedData.mustIncludePhrases = sanitizePhrases(
          validatedData.mustIncludePhrases
        )
      if (validatedData.mustExcludePhrases)
        validatedData.mustExcludePhrases = sanitizePhrases(
          validatedData.mustExcludePhrases
        )

      // Verify workspace belongs to agency
      const workspace = AuthModel.getWorkspaceById(validatedData.workspaceId)
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Verify brand kit exists and belongs to workspace
      const brandKit = AuthModel.getBrandKitById(validatedData.brandKitId)
      if (!brandKit || brandKit.workspaceId !== validatedData.workspaceId) {
        return res.status(404).json({ error: 'Brand kit not found' })
      }

      // Verify campaign exists and belongs to workspace if specified
      if (validatedData.campaignId) {
        const campaign = AuthModel.getCampaignById(validatedData.campaignId)
        if (!campaign || campaign.workspaceId !== validatedData.workspaceId) {
          return res.status(404).json({ error: 'Campaign not found' })
        }
      }

      log.info(
        {
          requestId: (req as any).requestId,
          assets: validatedData.sourceAssets.length,
        },
        `Creative Engine: Processing ${validatedData.sourceAssets.length} source assets`
      )
      log.info(
        {
          requestId: (req as any).requestId,
          primaryColor: brandKit.colors.primary,
          headingFont: brandKit.fonts.heading,
        },
        'Brand Kit context'
      )
      log.info(
        {
          requestId: (req as any).requestId,
          campaignId: validatedData.campaignId || 'General',
        },
        'Campaign context'
      )

      // Generate creatives using the Creative Engine
      const result = await engine.generateCreatives({
        workspaceId: validatedData.workspaceId,
        campaignId: validatedData.campaignId,
        brandKitId: validatedData.brandKitId,
        sourceAssets: validatedData.sourceAssets,
        referenceCreatives: validatedData.referenceCreatives,
        objectives: validatedData.objectives,
        platforms: validatedData.platforms,
        outputCount: validatedData.outputCount || 5,
        mustIncludePhrases: validatedData.mustIncludePhrases,
        mustExcludePhrases: validatedData.mustExcludePhrases,
        styleTags: validatedData.styleTags,
      })

      // Save generated creatives to the database
      const savedCreatives = []
      for (const creative of result.adCreatives) {
        const savedCreative = await AuthModel.createAdCreative(creative)
        savedCreatives.push(savedCreative)
      }

      const processingTime = Date.now() - startTime
      const enhancedResult = {
        ...result,
        adCreatives: savedCreatives,
        summary: {
          ...result.summary,
          processingTime,
          performance: `${processingTime}ms`,
        },
      }

      log.info(
        {
          requestId: (req as any).requestId,
          created: savedCreatives.length,
          processingTime,
        },
        `Creative Engine: Generated ${savedCreatives.length} creatives`
      )
      log.info(
        {
          requestId: (req as any).requestId,
          platforms: enhancedResult.summary.platformsCovered,
        },
        'Coverage'
      )
      log.info(
        {
          requestId: (req as any).requestId,
          styleConsistency: enhancedResult.summary.styleConsistency,
          brandAlignment: enhancedResult.summary.brandAlignment,
        },
        'Style consistency and brand alignment'
      )

      res.status(201).json({
        success: true,
        result: enhancedResult,
        message: `Generated ${savedCreatives.length} creative variations`,
      })
    } catch (error) {
      log.error(
        { requestId: (req as any).requestId, err: error },
        'Creative Engine generation failed'
      )

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        })
      }

      res.status(500).json({
        error: 'Creative generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

/**
 * POST /api/creative-engine/repurpose - Create multi-platform variants from existing creative
 *
 * Transform one creative into all platform formats automatically
 */
router.post('/repurpose', requireAuth, async (req, res) => {
  log.info(
    { requestId: (req as any).requestId },
    'Creative Engine: Starting creative repurposing'
  )

  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { creativeId, targetPlatforms } = req.body

    // Validate required fields
    if (!creativeId) {
      return res.status(400).json({ error: 'Creative ID is required' })
    }

    if (!targetPlatforms || !Array.isArray(targetPlatforms)) {
      return res
        .status(400)
        .json({ error: 'Target platforms array is required' })
    }

    // Get original creative
    const originalCreative = AuthModel.getAdCreativeById(creativeId)
    if (!originalCreative) {
      return res.status(404).json({ error: 'Creative not found' })
    }

    // Verify workspace belongs to agency
    const workspace = AuthModel.getWorkspaceById(originalCreative.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    log.info(
      {
        requestId: (req as any).requestId,
        creativeId,
        platforms: targetPlatforms,
      },
      `Repurposing creative ${creativeId} for platforms`
    )

    // Create platform variants
    const variants = []
    for (const platform of targetPlatforms) {
      try {
        // Skip if original is already for this platform
        if (originalCreative.placement === platform) {
          continue
        }

        // Create variant with platform-specific adaptations
        const variant = await engine.generateCreatives({
          workspaceId: originalCreative.workspaceId,
          campaignId: originalCreative.campaignId,
          brandKitId: '', // Would need to get from workspace
          sourceAssets: [], // Would need original source asset
          platforms: [platform],
          outputCount: 1,
          objectives: [originalCreative.objective || 'awareness'],
        })

        if (variant.adCreatives.length > 0) {
          // Link to original creative
          const enhancedVariant = {
            ...variant.adCreatives[0],
            originalCreativeId: creativeId,
            repurposedFrom: originalCreative.placement,
          }

          const savedVariant = await AuthModel.createAdCreative(enhancedVariant)
          variants.push(savedVariant)
        }
      } catch (error) {
        log.error(
          { requestId: (req as any).requestId, err: error, platform },
          `Failed to create ${platform} variant`
        )
      }
    }

    log.info(
      { requestId: (req as any).requestId, created: variants.length },
      `Repurposing complete: Created ${variants.length} variants`
    )

    res.status(201).json({
      success: true,
      originalCreative,
      variants,
      summary: {
        totalVariants: variants.length,
        platformsAdded: variants.map((v) => v.placement),
        processingTime: 'repurposing',
      },
    })
  } catch (error) {
    log.error(
      { requestId: (req as any).requestId, err: error },
      'Creative repurposing failed'
    )
    res.status(500).json({
      error: 'Creative repurposing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/creative-engine/insights/:workspaceId - Get style insights and recommendations
 */
router.get('/insights/:workspaceId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { workspaceId } = req.params

    // Verify workspace belongs to agency
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get all creatives for style analysis
    const creatives = AuthModel.getAdCreativesByWorkspace(workspaceId)
    const referenceCreatives =
      AuthModel.getReferenceCreativesByWorkspace(workspaceId)

    if (creatives.length === 0) {
      return res.json({
        insights: {
          hasData: false,
          message: 'No creatives found for analysis',
        },
      })
    }

    // Analyze patterns (simplified for now)
    const platforms = [...new Set(creatives.map((c) => c.placement))]
    const formats = [...new Set(creatives.map((c) => c.format))]
    const layouts = [...new Set(creatives.map((c) => c.layout))]

    const insights = {
      hasData: true,
      workspaceAnalytics: {
        totalCreatives: creatives.length,
        referenceCreatives: referenceCreatives.length,
        platformsCovered: platforms,
        formatsUsed: formats,
        commonLayouts: layouts,
        averageApprovalRate:
          (creatives.filter((c) => c.approvalStatus === 'approved').length /
            creatives.length) *
          100,
      },
      stylePatterns: {
        dominantPlatforms: platforms.slice(0, 3),
        preferredFormats: formats.slice(0, 2),
        layoutPreferences: layouts,
        visualStyle:
          referenceCreatives.length > 0
            ? 'Learning from references'
            : 'Default brand kit',
      },
      recommendations: [
        referenceCreatives.length === 0
          ? 'Upload reference creatives to improve style consistency'
          : null,
        'Test different CTA variations for improved performance',
        'Consider A/B testing different platforms with the same creative',
        'Add more diverse source assets for greater creative variety',
        'Review and optimize the most successful creative patterns',
      ].filter(Boolean),
    }

    res.json(insights)
  } catch (error) {
    log.error(
      { requestId: (req as any).requestId, err: error },
      'Get insights error'
    )
    res.status(500).json({ error: 'Failed to generate insights' })
  }
})

export default router
