import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { log } from '../middleware/logger'
import { createAuthMiddleware } from '../routes/auth'
import validateRequest from '../middleware/validateRequest'
import { StyleLearningService } from '../services/styleLearningService'
import { TemplateMatchingService } from '../services/templateMatchingService'
import { ConsistencyScoringService } from '../services/consistencyScoringService'
import {
  StyleLearningRequest,
  TemplateMatchingRequest,
  ConsistencyScoreRequest,
  StyleProfile,
  CreativeTemplate,
} from '../types/styleMemory'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas
const styleLearningRequestSchema = z.object({
  brandKitId: z.string().min(1, 'Brand Kit ID is required'),
  agencyId: z.string().min(1, 'Agency ID is required'),
  dataSources: z.object({
    referenceCreatives: z.array(z.string()).optional(),
    pastCampaigns: z.array(z.string()).optional(),
    topPerformingAds: z.array(z.string()).optional(),
    brandAssets: z.array(z.string()).optional(),
    websiteContent: z.string().optional(),
    competitorAnalysis: z.array(z.string()).optional(),
  }),
  learningParameters: z
    .object({
      sampleSize: z.number().min(10).optional(),
      minConfidence: z.number().min(0).max(100).optional(),
      includeIndustryBenchmarks: z.boolean().optional(),
      updateExistingProfile: z.boolean().optional(),
    })
    .optional(),
})

const templateMatchingRequestSchema = z.object({
  styleProfileId: z.string().min(1, 'Style Profile ID is required'),
  campaignBrief: z.object({
    objective: z.string(),
    funnelStage: z.string(),
    targetAudience: z.string(),
    keyMessage: z.string(),
    industry: z.string(),
  }),
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok']),
  constraints: z
    .object({
      budget: z.enum(['low', 'medium', 'high']).optional(),
      timeline: z.enum(['urgent', 'normal', 'flexible']).optional(),
      resources: z.array(z.string()).optional(),
    })
    .optional(),
  preferences: z
    .object({
      templates: z.array(z.string()).optional(),
      excludeCategories: z.array(z.string()).optional(),
      minPerformance: z.number().optional(),
    })
    .optional(),
})

const consistencyScoreRequestSchema = z.object({
  creativeId: z.string().min(1, 'Creative ID is required'),
  styleProfileId: z.string().min(1, 'Style Profile ID is required'),
  platform: z.string().optional(),
  analysisDepth: z
    .enum(['quick', 'standard', 'comprehensive'])
    .optional()
    .default('standard'),
})

const styleProfileIdSchema = z.object({
  profileId: z.string().min(1, 'Style Profile ID is required'),
})

const templateIdSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
})

// In-memory storage for v1 (in production, use database)
const styleProfiles = new Map<string, StyleProfile>()
const templates = new Map<string, CreativeTemplate>()

// Service instances
const styleLearningService = new StyleLearningService()
const templateMatchingService = new TemplateMatchingService()
const consistencyScoringService = new ConsistencyScoringService()

/**
 * POST /api/style-memory/learn
 * Learn and update style profile from brand data
 */
router.post(
  '/learn',
  requireAuth,
  validateRequest(styleLearningRequestSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const requestData = (req as any).validatedData as StyleLearningRequest

      // Validate brand kit exists and user has access
      const brandKit = AuthModel.getBrandKitById(requestData.brandKitId)
      if (!brandKit) {
        return res.status(404).json({ error: 'Brand kit not found' })
      }

      const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      log.info(
        { brandKitId: requestData.brandKitId },
        'Starting style learning for brand kit'
      )

      // Learn style profile
      const result = await styleLearningService.learnStyleProfile(requestData)

      // Store the style profile
      styleProfiles.set(result.styleProfile.id, result.styleProfile)

      log.info(
        { styleProfileId: result.styleProfile.id },
        'Style profile learned'
      )

      res.json({
        success: true,
        result: {
          styleProfile: result.styleProfile,
          insights: result.insights,
          recommendations: result.recommendations,
          templateSuggestions: result.templateSuggestions,
          performancePredictions: result.performancePredictions,
        },
      })
    } catch (error) {
      log.error({ err: error }, 'Style learning error')

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to learn style profile' })
    }
  }
)

/**
 * GET /api/style-memory/profiles
 * List all style profiles for the agency
 */
router.get(
  '/profiles',
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { brandKitId, page = 1, limit = 20 } = req.query

      // Get all brand kits for this agency
      const agencyBrandKits = AuthModel.getAllBrandKits().filter((brandKit) => {
        const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
        return workspace?.agencyId === req.agency.id
      })

      const brandKitIds = agencyBrandKits.map((bk) => bk.id)

      // Filter style profiles
      let filteredProfiles = Array.from(styleProfiles.values()).filter(
        (profile) => {
          let matches = true

          if (brandKitId) {
            matches = matches && profile.brandKitId === brandKitId
          }

          matches = matches && brandKitIds.includes(profile.brandKitId)

          return matches
        }
      )

      // Sort by creation date (newest first)
      filteredProfiles.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit)
      const endIndex = startIndex + Number(limit)
      const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex)

      res.json({
        success: true,
        styleProfiles: paginatedProfiles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredProfiles.length,
          totalPages: Math.ceil(filteredProfiles.length / Number(limit)),
        },
      })
    } catch (error) {
      log.error({ err: error }, 'List style profiles error')
      res.status(500).json({ error: 'Failed to list style profiles' })
    }
  }
)

/**
 * GET /api/style-memory/profiles/:profileId
 * Get specific style profile
 */
router.get(
  '/profiles/:profileId',
  requireAuth,
  validateRequest(styleProfileIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { profileId } = (req as any).validatedData

      const styleProfile = styleProfiles.get(profileId)
      if (!styleProfile) {
        return res.status(404).json({ error: 'Style profile not found' })
      }

      // Verify user has access to the brand kit
      const brandKit = AuthModel.getBrandKitById(styleProfile.brandKitId)
      if (!brandKit) {
        return res.status(404).json({ error: 'Associated brand kit not found' })
      }

      const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      res.json({
        success: true,
        styleProfile,
      })
    } catch (error) {
      log.error({ err: error }, 'Get style profile error')
      res.status(500).json({ error: 'Failed to get style profile' })
    }
  }
)

/**
 * POST /api/style-memory/templates/match
 * Find best matching templates
 */
router.post(
  '/templates/match',
  requireAuth,
  validateRequest(templateMatchingRequestSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const requestData = (req as any).validatedData as TemplateMatchingRequest

      // Validate style profile exists and user has access
      const styleProfile = styleProfiles.get(requestData.styleProfileId)
      if (!styleProfile) {
        return res.status(404).json({ error: 'Style profile not found' })
      }

      const brandKit = AuthModel.getBrandKitById(styleProfile.brandKitId)
      if (!brandKit) {
        return res.status(404).json({ error: 'Associated brand kit not found' })
      }

      const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      log.info(
        { styleProfileId: requestData.styleProfileId },
        'Finding template matches for style profile'
      )

      // Find matching templates
      const result =
        await templateMatchingService.findMatchingTemplates(requestData)

      log.info(
        {
          matches: result.matches.length,
          styleProfileId: requestData.styleProfileId,
        },
        'Found matching templates'
      )

      res.json({
        success: true,
        result,
      })
    } catch (error) {
      log.error({ err: error }, 'Template matching error')

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to match templates' })
    }
  }
)

/**
 * GET /api/style-memory/templates
 * List all available templates
 */
router.get(
  '/templates',
  requireAuth,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { category, industry, page = 1, limit = 20, search } = req.query

      let filteredTemplates = Array.from(templates.values())

      // Apply filters
      if (category) {
        filteredTemplates = filteredTemplates.filter(
          (t) => t.category === category
        )
      }

      if (industry) {
        filteredTemplates = filteredTemplates.filter(
          (t) =>
            t.configuration.industries.includes(industry as string) ||
            t.configuration.industries.includes('generic')
        )
      }

      if (search) {
        const searchTerm = (search as string).toLowerCase()
        filteredTemplates = filteredTemplates.filter(
          (t) =>
            t.name.toLowerCase().includes(searchTerm) ||
            t.description.toLowerCase().includes(searchTerm) ||
            t.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        )
      }

      // Sort by rating and usage
      filteredTemplates.sort((a, b) => {
        const scoreA = a.metadata.rating * (1 + a.performance.usageCount * 0.1)
        const scoreB = b.metadata.rating * (1 + b.performance.usageCount * 0.1)
        return scoreB - scoreA
      })

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit)
      const endIndex = startIndex + Number(limit)
      const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex)

      res.json({
        success: true,
        templates: paginatedTemplates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredTemplates.length,
          totalPages: Math.ceil(filteredTemplates.length / Number(limit)),
        },
        categories: [
          'ecommerce',
          'saas',
          'service',
          'b2b',
          'lifestyle',
          'education',
          'healthcare',
          'generic',
        ],
        industries: [
          'ecommerce',
          'saas',
          'healthcare',
          'finance',
          'education',
          'retail',
          'technology',
        ],
      })
    } catch (error) {
      log.error({ err: error }, 'List templates error')
      res.status(500).json({ error: 'Failed to list templates' })
    }
  }
)

/**
 * GET /api/style-memory/templates/:templateId
 * Get specific template
 */
router.get(
  '/templates/:templateId',
  requireAuth,
  validateRequest(templateIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { templateId } = (req as any).validatedData

      const template = templates.get(templateId)
      if (!template) {
        return res.status(404).json({ error: 'Template not found' })
      }

      res.json({
        success: true,
        template,
      })
    } catch (error) {
      log.error({ err: error }, 'Get template error')
      res.status(500).json({ error: 'Failed to get template' })
    }
  }
)

/**
 * POST /api/style-memory/consistency/score
 * Score creative consistency
 */
router.post(
  '/consistency/score',
  requireAuth,
  validateRequest(consistencyScoreRequestSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const requestData = (req as any).validatedData as ConsistencyScoreRequest

      // Validate style profile exists and user has access
      const styleProfile = styleProfiles.get(requestData.styleProfileId)
      if (!styleProfile) {
        return res.status(404).json({ error: 'Style profile not found' })
      }

      const brandKit = AuthModel.getBrandKitById(styleProfile.brandKitId)
      if (!brandKit) {
        return res.status(404).json({ error: 'Associated brand kit not found' })
      }

      const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
      if (!workspace || workspace.agencyId !== req.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      log.info(
        { creativeId: requestData.creativeId },
        'Scoring consistency for creative'
      )

      // Score consistency
      const result =
        await consistencyScoringService.scoreConsistency(requestData)

      log.info(
        {
          overallScore: result.overallScore,
          creativeId: requestData.creativeId,
        },
        'Consistency score calculated'
      )

      res.json({
        success: true,
        result,
      })
    } catch (error) {
      log.error({ err: error }, 'Consistency scoring error')

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }

      res.status(500).json({ error: 'Failed to score consistency' })
    }
  }
)

/**
 * POST /api/style-memory/templates/:templateId/use
 * Record template usage for learning
 */
router.post(
  '/templates/:templateId/use',
  requireAuth,
  validateRequest(templateIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { templateId } = (req as any).validatedData

      const template = templates.get(templateId)
      if (!template) {
        return res.status(404).json({ error: 'Template not found' })
      }

      // Update usage statistics
      template.performance.usageCount++
      template.metadata.updatedAt = new Date()

      log.info({ templateId }, 'Template usage recorded')

      res.json({
        success: true,
        template: template,
      })
    } catch (error) {
      log.error({ err: error }, 'Record template usage error')
      res.status(500).json({ error: 'Failed to record template usage' })
    }
  }
)

/**
 * POST /api/style-memory/templates/:templateId/review
 * Add template review
 */
router.post(
  '/templates/:templateId/review',
  requireAuth,
  validateRequest(templateIdSchema) as any,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { templateId } = (req as any).validatedData
      const { rating, comment } = req.body

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' })
      }

      const template = templates.get(templateId)
      if (!template) {
        return res.status(404).json({ error: 'Template not found' })
      }

      // Add review
      const review = {
        userId: req.user.id,
        rating,
        comment,
        timestamp: new Date(),
      }

      template.metadata.reviews.push(review)

      // Update average rating
      const totalRating = template.metadata.reviews.reduce(
        (sum, r) => sum + r.rating,
        0
      )
      template.metadata.rating = totalRating / template.metadata.reviews.length
      template.metadata.updatedAt = new Date()

      log.info({ templateId, rating }, 'Template review added')

      res.json({
        success: true,
        template: template,
      })
    } catch (error) {
      log.error({ err: error }, 'Add template review error')
      res.status(500).json({ error: 'Failed to add template review' })
    }
  }
)

/**
 * GET /api/style-memory/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: any) => {
  res.json({
    status: 'ok',
    service: 'style-memory-service',
    timestamp: new Date().toISOString(),
    statistics: {
      styleProfilesCount: styleProfiles.size,
      templatesCount: templates.size,
    },
  })
})

export default router
