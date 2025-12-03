import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AuthModel, Campaign, BrandKit } from '../models/auth'
import { log } from '../middleware/logger'
import { createAuthMiddleware } from '../routes/auth'
import validateRequest from '../middleware/validateRequest'
import {
  CampaignBriefGenerator,
  CreativeRequirements,
} from '../services/campaignBriefGenerator'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas
const updateCampaignBriefSchema = z.object({
  brief: z
    .object({
      clientOverview: z.string().optional(),
      campaignPurpose: z.string().optional(),
      primaryKPI: z.string().optional(),
      secondaryKPIs: z.array(z.string()).optional(),
      targetMetrics: z
        .object({
          impressions: z.number().optional(),
          reach: z.number().optional(),
          engagement: z.number().optional(),
          conversions: z.number().optional(),
          roi: z.number().optional(),
        })
        .optional(),
      competitorInsights: z.array(z.string()).optional(),
      differentiators: z.array(z.string()).optional(),
      primaryAudience: z
        .object({
          demographics: z.string().optional(),
          psychographics: z.string().optional(),
          painPoints: z.array(z.string()).optional(),
          motivations: z.array(z.string()).optional(),
        })
        .optional(),
      keyMessage: z.string().optional(),
      supportingPoints: z.array(z.string()).optional(),
      emotionalAppeal: z.string().optional(),
      mandatoryInclusions: z.array(z.string()).optional(),
      mandatoryExclusions: z.array(z.string()).optional(),
      legalRequirements: z.array(z.string()).optional(),
      platformSpecific: z
        .object({
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          linkedin: z.string().optional(),
        })
        .optional(),
      campaignDuration: z.string().optional(),
      seasonality: z.string().optional(),
      urgency: z.string().optional(),
    })
    .optional(),
})

const generateRequirementsSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
})

/**
 * PUT /api/campaign-briefs/:campaignId
 * Update campaign brief
 */
router.put(
  '/:campaignId',
  requireAuth,
  validateRequest(updateCampaignBriefSchema) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campaignId } = req.params
      const { brief } = (req as any).validatedData

      // Validate campaign exists and user has access
      const campaign = AuthModel.getCampaignById(campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Update campaign with brief
      const updatedCampaign = AuthModel.updateCampaign(campaignId, {
        brief,
      })

      log.info({ campaignId }, 'Campaign brief updated')

      res.json({
        success: true,
        campaign: updatedCampaign,
      })
    } catch (error) {
      log.error({ err: error }, 'Campaign brief update error')

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to update campaign brief' })
    }
  }
)

/**
 * POST /api/campaign-briefs/:campaignId/generate-requirements
 * Generate creative requirements from campaign brief
 */
router.post(
  '/:campaignId/generate-requirements',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campaignId } = req.params

      // Validate campaign exists and user has access
      const campaign = AuthModel.getCampaignById(campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Get brand kit for context
      const brandKit = AuthModel.getBrandKitById(campaign.brandKitId)
      if (!brandKit) {
        return res.status(404).json({ error: 'Brand kit not found' })
      }

      log.info({ campaignId }, 'Generating creative requirements for campaign')

      // Generate creative requirements
      const requirements =
        await CampaignBriefGenerator.generateCreativeRequirements(
          campaign,
          brandKit
        )

      log.info({ campaignId }, 'Creative requirements generated for campaign')

      res.json({
        success: true,
        requirements,
        campaignId,
      })
    } catch (error) {
      log.error({ err: error }, 'Creative requirements generation error')

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res
        .status(500)
        .json({ error: 'Failed to generate creative requirements' })
    }
  }
)

/**
 * GET /api/campaign-briefs/:campaignId
 * Get campaign brief
 */
router.get(
  '/:campaignId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campaignId } = req.params

      // Validate campaign exists and user has access
      const campaign = AuthModel.getCampaignById(campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      res.json({
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          brief: campaign.brief,
          objective: campaign.objective,
          launchType: campaign.launchType,
          funnelStage: campaign.funnelStage,
          primaryOffer: campaign.primaryOffer,
          primaryCTA: campaign.primaryCTA,
          secondaryCTA: campaign.secondaryCTA,
          targetAudience: campaign.targetAudience,
          placements: campaign.placements,
        },
      })
    } catch (error) {
      log.error({ err: error }, 'Get campaign brief error')

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to get campaign brief' })
    }
  }
)

/**
 * DELETE /api/campaign-briefs/:campaignId
 * Clear campaign brief
 */
router.delete(
  '/:campaignId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campaignId } = req.params

      // Validate campaign exists and user has access
      const campaign = AuthModel.getCampaignById(campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Clear the brief
      const updatedCampaign = AuthModel.updateCampaign(campaignId, {
        brief: undefined,
      })

      log.info({ campaignId }, 'Campaign brief cleared')

      res.json({
        success: true,
        campaign: updatedCampaign,
      })
    } catch (error) {
      log.error({ err: error }, 'Clear campaign brief error')

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to clear campaign brief' })
    }
  }
)

/**
 * POST /api/campaign-briefs/:campaignId/validate
 * Validate campaign brief completeness
 */
router.post(
  '/:campaignId/validate',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campaignId } = req.params

      // Validate campaign exists and user has access
      const campaign = AuthModel.getCampaignById(campaignId)
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const brief = campaign.brief
      const validation = {
        isValid: true,
        score: 0,
        missingFields: [] as string[],
        recommendations: [] as string[],
        completeness: {
          clientContext: 0,
          businessGoals: 0,
          competitiveAnalysis: 0,
          targetAudience: 0,
          messaging: 0,
          constraints: 0,
          platformStrategy: 0,
          timeline: 0,
        },
      }

      // Validate each section
      if (brief) {
        // Client Context (25 points)
        if (brief.clientOverview) validation.completeness.clientContext += 15
        if (brief.campaignPurpose) validation.completeness.clientContext += 10
        if (!brief.clientOverview || !brief.campaignPurpose) {
          validation.missingFields.push('Client context (overview and purpose)')
        }

        // Business Goals (20 points)
        if (brief.primaryKPI) validation.completeness.businessGoals += 10
        if (brief.secondaryKPIs && brief.secondaryKPIs.length > 0)
          validation.completeness.businessGoals += 10
        if (!brief.primaryKPI || !brief.secondaryKPIs?.length) {
          validation.missingFields.push('Business goals (KPIs)')
        }

        // Competitive Analysis (15 points)
        if (brief.competitorInsights && brief.competitorInsights.length > 0)
          validation.completeness.competitiveAnalysis += 10
        if (brief.differentiators && brief.differentiators.length > 0)
          validation.completeness.competitiveAnalysis += 5
        if (!brief.competitorInsights?.length) {
          validation.missingFields.push('Competitive analysis')
        }

        // Target Audience (20 points)
        if (brief.primaryAudience?.demographics)
          validation.completeness.targetAudience += 8
        if (brief.primaryAudience?.psychographics)
          validation.completeness.targetAudience += 7
        if (
          brief.primaryAudience?.painPoints &&
          brief.primaryAudience.painPoints.length > 0
        )
          validation.completeness.targetAudience += 5
        if (
          !brief.primaryAudience?.demographics ||
          !brief.primaryAudience?.psychographics
        ) {
          validation.missingFields.push('Target audience details')
        }

        // Messaging Strategy (10 points)
        if (brief.keyMessage) validation.completeness.messaging += 6
        if (brief.supportingPoints && brief.supportingPoints.length > 0)
          validation.completeness.messaging += 4
        if (!brief.keyMessage) {
          validation.missingFields.push('Key messaging strategy')
        }

        // Mandatories (5 points)
        if (brief.mandatoryInclusions || brief.mandatoryExclusions)
          validation.completeness.constraints += 5

        // Platform Strategy (5 points)
        if (
          brief.platformSpecific?.instagram ||
          brief.platformSpecific?.facebook ||
          brief.platformSpecific?.linkedin
        ) {
          validation.completeness.platformStrategy += 5
        }

        // Timeline (5 points)
        if (brief.campaignDuration || brief.seasonality)
          validation.completeness.timeline += 5

        // Calculate total score
        validation.score = Object.values(validation.completeness).reduce(
          (sum, score) => sum + score,
          0
        )

        // Determine if valid (requires at least 70 points)
        validation.isValid = validation.score >= 70

        // Generate recommendations
        if (validation.score < 85) {
          validation.recommendations.push(
            'Add more detail to strengthen the brief'
          )
        }
        if (!brief.targetMetrics) {
          validation.recommendations.push(
            'Specify target metrics for better measurement'
          )
        }
        if (!brief.emotionalAppeal) {
          validation.recommendations.push(
            'Define emotional appeal for stronger connection'
          )
        }
      } else {
        validation.isValid = false
        validation.missingFields.push('Campaign brief not created')
        validation.recommendations.push('Create a comprehensive campaign brief')
      }

      res.json({
        success: true,
        validation,
      })
    } catch (error) {
      log.error({ err: error }, 'Validate campaign brief error')

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to validate campaign brief' })
    }
  }
)

/**
 * GET /api/campaign-briefs/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'campaign-brief-service',
    timestamp: new Date().toISOString(),
  })
})

export default router
