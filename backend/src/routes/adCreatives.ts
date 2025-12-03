import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AuthModel, Campaign, BrandKit } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import validateRequest from '../middleware/validateRequest'
import { AdCreativeGenerator } from '../services/adCreativeGenerator'
import { AdCreative, AdCreativeGenerationRequest } from '../types/adCreative'
import {
  AdCopyService,
  AdCopyGenerationRequest,
} from '../services/adCopyService'
import { CampaignAwareService } from '../services/campaignAwareService'
import { log } from '../middleware/logger'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas
const generateAdCreativeSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  brandKitId: z.string().min(1, 'Brand Kit ID is required'),
  objective: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
  funnelStage: z.enum(['top', 'middle', 'bottom']),
  platforms: z
    .array(z.enum(['instagram', 'facebook', 'linkedin']))
    .min(1, 'At least one platform is required'),
  targetAudience: z
    .object({
      demographics: z.string().optional(),
      psychographics: z.string().optional(),
      painPoints: z.array(z.string()).optional(),
    })
    .optional(),
  keyMessage: z.string().min(1, 'Key message is required'),
  cta: z.string().min(1, 'CTA is required'),
  tone: z.array(z.string()).optional(),
  variations: z.number().min(1).max(5).optional().default(3),
  includeVisuals: z.boolean().optional().default(false),
})

const updateAdCreativeSchema = z.object({
  name: z.string().optional(),
  status: z
    .enum(['draft', 'review', 'approved', 'active', 'paused'])
    .optional(),
  slots: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.enum([
          'headline',
          'subheadline',
          'body',
          'cta',
          'primaryText',
          'description',
        ]),
        content: z.string(),
        variations: z.array(z.string()).optional(),
        maxLength: z.number().optional(),
        platformSpecific: z.record(z.string(), z.string()).optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .optional(),
  abTestSettings: z
    .object({
      enabled: z.boolean(),
      variants: z.array(z.string()),
      testDuration: z.number(),
      successMetrics: z.array(z.string()),
    })
    .optional(),
})

const adCreativeIdSchema = z.object({
  adCreativeId: z.string().min(1, 'Ad Creative ID is required'),
})

// Phase 1.2: Ad-Copy Mode validation schemas
const generateAdCopySchema = z.object({
  campaignId: z.string().optional(),
  brandKitId: z.string().optional(),
  assetDescription: z.string().min(1, 'Asset description is required'),
  platforms: z
    .array(z.enum(['instagram', 'facebook', 'linkedin']))
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
  variationType: z.enum([
    'main',
    'alt1',
    'alt2',
    'alt3',
    'punchy',
    'short',
    'story',
  ]),
})

const generateMultipleAdCopySchema = z.object({
  campaignId: z.string().optional(),
  brandKitId: z.string().optional(),
  assetDescription: z.string().min(1, 'Asset description is required'),
  platforms: z
    .array(z.enum(['instagram', 'facebook', 'linkedin']))
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
  variationTypes: z
    .array(z.enum(['main', 'alt1', 'alt2', 'alt3', 'punchy', 'short', 'story']))
    .min(1, 'At least one variation type is required'),
})

// Phase 1.3: Campaign-Aware Prompting validation schema
const analyzeCampaignContextSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  brandKitId: z.string().min(1, 'Brand Kit ID is required'),
})

// In-memory storage for v1 (in production, use database)
const adCreatives = new Map<string, AdCreative>()
const adCopyService = new AdCopyService()
const campaignAwareService = new CampaignAwareService()

/**
 * POST /api/ad-creatives/generate
 * Generate new ad creative using AI
 */
router.post(
  '/generate',
  requireAuth,
  validateRequest(generateAdCreativeSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const requestData = (req as any)
        .validatedData as AdCreativeGenerationRequest

      // Validate campaign exists and user has access
      const campaign = AuthModel.getCampaignById(requestData.campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Validate brand kit exists and user has access
      const brandKit = AuthModel.getBrandKitById(requestData.brandKitId)
      if (!brandKit) {
        return res.status(404).json({ error: 'Brand kit not found' })
      }

      log.info(
        {
          campaignId: requestData.campaignId,
          requestId: (req as any).requestId,
        },
        `Generating ad creative for campaign`
      )

      // Generate ad creative using AI
      const generator = new AdCreativeGenerator()
      const result = await generator.generateAdCreative(
        requestData,
        campaign,
        brandKit
      )

      // Store generated creative
      adCreatives.set(result.adCreative.id, result.adCreative)

      // Store platform versions
      Object.values(result.platformVersions).forEach((version) => {
        adCreatives.set(version.id, version)
      })

      log.info(
        {
          adCreativeId: result.adCreative.id,
          requestId: (req as any).requestId,
        },
        'Ad creative generated'
      )

      res.json({
        success: true,
        result: {
          adCreative: result.adCreative,
          platformVersions: result.platformVersions,
          qualityScore: result.qualityScore,
          recommendations: result.recommendations,
          estimatedPerformance: result.estimatedPerformance,
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Ad creative generation error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to generate ad creative' })
    }
  }
)

/**
 * GET /api/ad-creatives
 * List all ad creatives for the agency
 */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { campaignId, status, platform, page = 1, limit = 20 } = req.query

    // Get all campaigns for this agency
    const agencyCampaigns = AuthModel.getAllCampaigns().filter((campaign) => {
      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      return workspace?.agencyId === req.agency.id
    })

    const campaignIds = agencyCampaigns.map((c) => c.id)

    // Filter ad creatives
    let filteredCreatives = Array.from(adCreatives.values()).filter(
      (creative) => {
        let matches = true

        if (campaignId) {
          matches = matches && creative.campaignId === campaignId
        }

        if (status) {
          matches = matches && creative.status === status
        }

        if (platform) {
          matches = matches && creative.primaryPlatform === platform
        }

        matches = matches && campaignIds.includes(creative.campaignId)

        return matches
      }
    )

    // Sort by creation date (newest first)
    filteredCreatives.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedCreatives = filteredCreatives.slice(startIndex, endIndex)

    res.json({
      success: true,
      adCreatives: paginatedCreatives,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredCreatives.length,
        totalPages: Math.ceil(filteredCreatives.length / Number(limit)),
      },
    })
  } catch (error) {
    log.error(
      { err: error, requestId: (req as any).requestId },
      'List ad creatives error'
    )
    res.status(500).json({ error: 'Failed to list ad creatives' })
  }
})

/**
 * GET /api/ad-creatives/:adCreativeId
 * Get specific ad creative by ID
 */
router.get(
  '/:adCreativeId',
  requireAuth,
  validateRequest(adCreativeIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { adCreativeId } = (req as any).validatedData

      const adCreative = adCreatives.get(adCreativeId)
      if (!adCreative) {
        return res.status(404).json({ error: 'Ad creative not found' })
      }

      // Verify user has access to the campaign
      const campaign = AuthModel.getCampaignById(adCreative.campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Associated campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      res.json({
        success: true,
        adCreative,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Get ad creative error'
      )
      res.status(500).json({ error: 'Failed to get ad creative' })
    }
  }
)

/**
 * PUT /api/ad-creatives/:adCreativeId
 * Update ad creative
 */
router.put(
  '/:adCreativeId',
  requireAuth,
  validateRequest(updateAdCreativeSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { adCreativeId } = req.params
      const updateData = (req as any).validatedData

      const existingCreative = adCreatives.get(adCreativeId)
      if (!existingCreative) {
        return res.status(404).json({ error: 'Ad creative not found' })
      }

      // Verify user has access to the campaign
      const campaign = AuthModel.getCampaignById(existingCreative.campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Associated campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Update ad creative
      const updatedCreative: AdCreative = {
        ...existingCreative,
        ...updateData,
        updatedAt: new Date(),
        version: existingCreative.version + 1,
      }

      // Handle slot updates
      if (updateData.slots) {
        updatedCreative.slots = updateData.slots.map((slotUpdate: any) => {
          if (slotUpdate.id) {
            // Update existing slot
            const existingSlot = existingCreative.slots.find(
              (s) => s.id === slotUpdate.id
            )
            return existingSlot
              ? { ...existingSlot, ...slotUpdate }
              : slotUpdate
          } else {
            // Add new slot
            return {
              ...slotUpdate,
              id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            }
          }
        })
      }

      adCreatives.set(adCreativeId, updatedCreative)

      log.info(
        { adCreativeId, requestId: (req as any).requestId },
        `Ad creative updated`
      )

      res.json({
        success: true,
        adCreative: updatedCreative,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Update ad creative error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to update ad creative' })
    }
  }
)

/**
 * DELETE /api/ad-creatives/:adCreativeId
 * Delete ad creative
 */
router.delete(
  '/:adCreativeId',
  requireAuth,
  validateRequest(adCreativeIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { adCreativeId } = (req as any).validatedData

      const existingCreative = adCreatives.get(adCreativeId)
      if (!existingCreative) {
        return res.status(404).json({ error: 'Ad creative not found' })
      }

      // Verify user has access to the campaign
      const campaign = AuthModel.getCampaignById(existingCreative.campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Associated campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      adCreatives.delete(adCreativeId)

      log.info(
        { adCreativeId, requestId: (req as any).requestId },
        `Ad creative deleted`
      )

      res.json({
        success: true,
        message: 'Ad creative deleted successfully',
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Delete ad creative error'
      )
      res.status(500).json({ error: 'Failed to delete ad creative' })
    }
  }
)

/**
 * POST /api/ad-creatives/:adCreativeId/duplicate
 * Duplicate ad creative
 */
router.post(
  '/:adCreativeId/duplicate',
  requireAuth,
  validateRequest(adCreativeIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { adCreativeId } = (req as any).validatedData

      const existingCreative = adCreatives.get(adCreativeId)
      if (!existingCreative) {
        return res.status(404).json({ error: 'Ad creative not found' })
      }

      // Verify user has access to the campaign
      const campaign = AuthModel.getCampaignById(existingCreative.campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Associated campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Create duplicate
      const duplicate: AdCreative = {
        ...existingCreative,
        id: `ad-creative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${existingCreative.name} (Copy)`,
        status: 'draft',
        slots: existingCreative.slots.map((slot) => ({
          ...slot,
          id: `${slot.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        performance: undefined, // Reset performance data
      }

      adCreatives.set(duplicate.id, duplicate)

      log.info(
        { adCreativeId: duplicate.id, requestId: (req as any).requestId },
        `Ad creative duplicated`
      )

      res.json({
        success: true,
        adCreative: duplicate,
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Duplicate ad creative error'
      )
      res.status(500).json({ error: 'Failed to duplicate ad creative' })
    }
  }
)

/**
 * POST /api/ad-creatives/:adCreativeId/analyze
 * Analyze ad creative performance and quality
 */
router.post(
  '/:adCreativeId/analyze',
  requireAuth,
  validateRequest(adCreativeIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { adCreativeId } = (req as any).validatedData

      const adCreative = adCreatives.get(adCreativeId)
      if (!adCreative) {
        return res.status(404).json({ error: 'Ad creative not found' })
      }

      // Verify user has access to the campaign
      const campaign = AuthModel.getCampaignById(adCreative.campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Associated campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Perform analysis
      const generator = new AdCreativeGenerator()

      // Create a mock request for analysis
      const analysisRequest: AdCreativeGenerationRequest = {
        campaignId: adCreative.campaignId,
        brandKitId: adCreative.brandKitId,
        objective: adCreative.objective,
        funnelStage: adCreative.funnelStage,
        platforms:
          adCreative.primaryPlatform === 'multi'
            ? ['instagram', 'facebook', 'linkedin']
            : [adCreative.primaryPlatform],
        targetAudience: {
          demographics: campaign.brief?.primaryAudience?.demographics || '',
          psychographics: campaign.brief?.primaryAudience?.psychographics || '',
          painPoints: campaign.brief?.primaryAudience?.painPoints || [],
        },
        keyMessage: campaign.brief?.keyMessage || '',
        cta: campaign.primaryCTA || '',
        tone: ['professional'],
        variations: 3,
        includeVisuals: false,
      }

      const brandKit = AuthModel.getBrandKitById(adCreative.brandKitId)

      if (!brandKit) {
        return res.status(404).json({ error: 'Brand kit not found' })
      }

      const qualityScore = await generator['calculateQualityScore'](
        adCreative,
        analysisRequest,
        brandKit
      )
      const recommendations = await generator['generateRecommendations'](
        adCreative,
        analysisRequest
      )
      const estimatedPerformance = await generator['estimatePerformance'](
        adCreative,
        analysisRequest
      )

      res.json({
        success: true,
        analysis: {
          qualityScore,
          recommendations,
          estimatedPerformance,
          slotAnalysis: adCreative.slots.map((slot) => ({
            type: slot.type,
            contentLength: slot.content.length,
            variationCount: slot.variations.length,
            hasPlatformSpecific: !!slot.platformSpecific,
          })),
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Analyze ad creative error'
      )
      res.status(500).json({ error: 'Failed to analyze ad creative' })
    }
  }
)

// Phase 1.2: Ad-Copy Mode Endpoints

/**
 * POST /api/ad-creatives/adcopy/generate
 * Generate ad copy content for a single variation
 */
router.post(
  '/adcopy/generate',
  requireAuth,
  validateRequest(generateAdCopySchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const requestData = (req as any).validatedData as AdCopyGenerationRequest

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
          variationType: requestData.variationType,
          platforms: requestData.platforms,
          requestId: (req as any).requestId,
        },
        `Generating ad copy content`
      )

      // Generate ad copy using AI
      const result = await adCopyService.generateAdCopy(
        requestData,
        campaign,
        brandKit
      )

      log.info(
        {
          variationType: requestData.variationType,
          qualityScore: result.qualityScore,
          requestId: (req as any).requestId,
        },
        `Ad copy generated successfully`
      )

      res.json({
        success: true,
        result: {
          variation: result.variation,
          adCopy: result.adCopy,
          qualityScore: result.qualityScore,
          recommendations: result.recommendations,
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Ad copy generation error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to generate ad copy' })
    }
  }
)

/**
 * POST /api/ad-creatives/adcopy/generate-multiple
 * Generate ad copy content for multiple variations
 */
router.post(
  '/adcopy/generate-multiple',
  requireAuth,
  validateRequest(generateMultipleAdCopySchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const requestData = (req as any).validatedData

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
          variationTypes: requestData.variationTypes,
          platforms: requestData.platforms,
          requestId: (req as any).requestId,
        },
        `Generating multiple ad copy variations`
      )

      // Generate ad copy for each variation type
      const results = []
      for (const variationType of requestData.variationTypes) {
        const variationRequest: AdCopyGenerationRequest = {
          ...requestData,
          variationType,
        }

        const result = await adCopyService.generateAdCopy(
          variationRequest,
          campaign,
          brandKit
        )

        results.push(result)
      }

      // Calculate overall statistics
      const averageQualityScore =
        results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length
      const allRecommendations = results.flatMap((r) => r.recommendations)

      log.info(
        {
          variationCount: results.length,
          averageQualityScore,
          requestId: (req as any).requestId,
        },
        `Multiple ad copy variations generated successfully`
      )

      res.json({
        success: true,
        results: {
          variations: results.map((r) => ({
            variation: r.variation,
            adCopy: r.adCopy,
            qualityScore: r.qualityScore,
            recommendations: r.recommendations,
          })),
          statistics: {
            totalVariations: results.length,
            averageQualityScore,
            allRecommendations,
          },
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Multiple ad copy generation error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res
        .status(500)
        .json({ error: 'Failed to generate multiple ad copy variations' })
    }
  }
)

/**
 * GET /api/ad-creatives/adcopy/health
 * Health check endpoint for ad copy service
 */
router.get('/adcopy/health', (req: Request, res: any) => {
  res.json({
    status: 'ok',
    service: 'ad-copy-service',
    timestamp: new Date().toISOString(),
    capabilities: [
      'single-variation-generation',
      'multiple-variation-generation',
      'platform-specific-optimization',
      'quality-scoring',
      'recommendations',
    ],
  })
})

// Phase 1.3: Campaign-Aware Prompting Endpoints

/**
 * POST /api/ad-creatives/campaign-context/analyze
 * Analyze campaign context and provide recommendations
 */
router.post(
  '/campaign-context/analyze',
  requireAuth,
  validateRequest(analyzeCampaignContextSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { campaignId, brandKitId } = (req as any).validatedData

      // Validate campaign exists and user has access
      const campaign = AuthModel.getCampaignById(campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Validate brand kit exists and user has access
      const brandKit = AuthModel.getBrandKitById(brandKitId)
      if (!brandKit) {
        return res.status(404).json({ error: 'Brand kit not found' })
      }

      const brandWorkspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
      if (!brandWorkspace || brandWorkspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied to brand kit' })
      }

      log.info(
        {
          campaignId,
          brandKitId,
          requestId: (req as any).requestId,
        },
        `Analyzing campaign context`
      )

      // Build campaign context
      const campaignContext = campaignAwareService.buildCampaignContext(
        campaign,
        brandKit
      )

      // Analyze context quality
      const analysis =
        campaignAwareService.analyzeCampaignContext(campaignContext)

      log.info(
        {
          campaignId,
          contextScore: analysis.score,
          gapCount: analysis.gaps.length,
          requestId: (req as any).requestId,
        },
        `Campaign context analyzed successfully`
      )

      res.json({
        success: true,
        result: {
          campaignContext,
          analysis,
          recommendations: {
            immediate: analysis.recommendations.filter((r) =>
              r.includes('Missing')
            ),
            strategic: analysis.recommendations.filter(
              (r) => !r.includes('Missing')
            ),
          },
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Campaign context analysis error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to analyze campaign context' })
    }
  }
)

/**
 * POST /api/ad-creatives/campaign-context/generate-prompt
 * Generate campaign-aware prompt for testing
 */
router.post(
  '/campaign-context/generate-prompt',
  requireAuth,
  validateRequest(analyzeCampaignContextSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { campaignId, brandKitId } = (req as any).validatedData
      const { assetDescription, variationType, platforms, contentType } =
        req.body

      // Validate campaign exists and user has access
      const campaign = AuthModel.getCampaignById(campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Validate brand kit exists and user has access
      const brandKit = AuthModel.getBrandKitById(brandKitId)
      if (!brandKit) {
        return res.status(404).json({ error: 'Brand kit not found' })
      }

      const brandWorkspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
      if (!brandWorkspace || brandWorkspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied to brand kit' })
      }

      log.info(
        {
          campaignId,
          brandKitId,
          contentType: contentType || 'adcopy',
          requestId: (req as any).requestId,
        },
        `Generating campaign-aware prompt`
      )

      // Build campaign context
      const campaignContext = campaignAwareService.buildCampaignContext(
        campaign,
        brandKit
      )

      // Generate sample prompt
      const assetContext = {
        description:
          assetDescription || 'Sample product or service description',
        category: contentType || 'ad-copy',
        features: [],
        benefits: [
          campaign.brief?.keyMessage ||
            brandKit.valueProposition ||
            'High quality products',
        ],
        useCases: [`Drive ${campaign.objective} through compelling content`],
      }

      const prompt = campaignAwareService.generateCampaignAwarePrompt(
        campaignContext,
        assetContext,
        variationType || 'main',
        platforms || ['instagram', 'facebook'],
        contentType || 'adcopy'
      )

      log.info(
        {
          campaignId,
          promptLength: prompt.length,
          requestId: (req as any).requestId,
        },
        `Campaign-aware prompt generated successfully`
      )

      res.json({
        success: true,
        result: {
          prompt,
          contextSummary: {
            campaignName: campaign.name,
            brandName: brandKit.name,
            objective: campaign.objective,
            targetAudience: campaignContext.targetAudience.demographics,
            tone: campaignContext.contentGuidelines.tone,
            keywords: campaignContext.contentGuidelines.keywords,
          },
        },
      })
    } catch (error) {
      log.error(
        { err: error, requestId: (req as any).requestId },
        'Campaign-aware prompt generation error'
      )

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res
        .status(500)
        .json({ error: 'Failed to generate campaign-aware prompt' })
    }
  }
)

/**
 * GET /api/ad-creatives/campaign-context/health
 * Health check endpoint for campaign-aware service
 */
router.get('/campaign-context/health', (req: Request, res: any) => {
  res.json({
    status: 'ok',
    service: 'campaign-aware-service',
    timestamp: new Date().toISOString(),
    capabilities: [
      'campaign-context-building',
      'context-quality-analysis',
      'campaign-aware-prompting',
      'brand-integration',
      'audience-analysis',
      'messaging-strategy',
    ],
  })
})

/**
 * GET /api/ad-creatives/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: any) => {
  res.json({
    status: 'ok',
    service: 'ad-creative-service',
    timestamp: new Date().toISOString(),
    adCreativesCount: adCreatives.size,
  })
})

export default router
