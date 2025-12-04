/**
 * Request validation schemas using Zod
 * Provides type-safe input validation for API routes
 * This is the single source of truth for all validation schemas
 */

import { z } from 'zod'

// Rate limiting configuration types
export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  max: number;         // Maximum requests per window
  points: number;      // Cost points for this endpoint (higher = more expensive)
  tier: 'basic' | 'standard' | 'premium' | 'enterprise';  // Service tier
}

// Enhanced schema with rate limiting metadata
export interface SchemaWithMetadata<T extends z.ZodTypeAny> {
  schema: T;
  rateLimit: RateLimitConfig;
  securityTags?: string[]; // Tags for security scanning/prompt injection
}

// Common validation patterns
const idSchema = z.string().min(1, 'ID cannot be empty')
const workspaceIdSchema = z.string().min(1, 'Workspace ID is required')
const assetIdSchema = z.string().min(1, 'Asset ID is required')

// Default rate limiting configurations
export const RATE_LIMIT_TIERS = {
  basic: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    points: 1,
    tier: 'basic' as const
  },
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    points: 1,
    tier: 'standard' as const
  },
  premium: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    points: 1,
    tier: 'premium' as const
  },
  enterprise: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    points: 1,
    tier: 'enterprise' as const
  }
}

// Cost-based rate limiting configurations
export const COST_BASED_RATE_LIMITS = {
  // Low-cost endpoints (no AI/external API usage)
  low: { points: 1, description: 'Simple read operations' },
  medium: { points: 3, description: 'Basic AI processing' },
  high: { points: 5, description: 'Complex AI processing' },
  veryHigh: { points: 10, description: 'Multiple AI services' }
}

export const Tones = z.enum(['default', 'witty', 'inspirational', 'formal']);

/**
 * Schema for caption generation requests
 */
export const CaptionRequestSchema: SchemaWithMetadata<z.ZodObject<any>> = {
  schema: z.object({
    imageUrl: z
      .string()
      .min(1, 'Image URL cannot be empty')
      .refine(
        (url) =>
          url.startsWith('data:image/') ||
          url.startsWith('http://') ||
          url.startsWith('https://'),
        'Invalid image URL format. Must be a data URI or HTTP(S) URL'
      )
      .refine((url) => {
        // Validate data URI format if it's a data URI
        if (url.startsWith('data:image/')) {
          return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(url)
        }
        return true
      }, 'Invalid data URI format. Must be base64-encoded image'),
    keywords: z.array(z.string()).optional().default([]),
    tone: Tones.optional().default('default'),
  }),
  rateLimit: {
    ...RATE_LIMIT_TIERS.standard,
    points: COST_BASED_RATE_LIMITS.medium.points,
    tier: 'standard'
  },
  securityTags: ['prompt', 'image-url']
};

/**
 * Schema for mask generation requests
 */
export const MaskRequestSchema: SchemaWithMetadata<z.ZodObject<any>> = {
  schema: z.object({
    imageUrl: z
      .string()
      .min(1, 'Image URL cannot be empty')
      .refine(
        (url) =>
          url.startsWith('data:image/') ||
          url.startsWith('http://') ||
          url.startsWith('https://'),
        'Invalid image URL format. Must be a data URI or HTTP(S) URL'
      )
      .refine((url) => {
        // Validate data URI format if it's a data URI
        if (url.startsWith('data:image/')) {
          return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(url)
        }
        return true
      }, 'Invalid data URI format. Must be base64-encoded image'),
  }),
  rateLimit: {
    ...RATE_LIMIT_TIERS.standard,
    points: COST_BASED_RATE_LIMITS.medium.points,
    tier: 'standard'
  },
  securityTags: ['image-url']
};

/**
 * Schema for batch caption generation
 */
export const BatchCaptionSchema: SchemaWithMetadata<z.ZodObject<any>> = {
  schema: z.object({
    workspaceId: workspaceIdSchema,
    assetIds: z.array(assetIdSchema).min(1, 'At least one asset is required').max(30, 'Maximum 30 assets per batch'),
    generateAdCopy: z.boolean().optional().default(false),
    variationsCount: z.number().min(1).max(10).optional().default(3)
  }),
  rateLimit: {
    ...RATE_LIMIT_TIERS.standard,
    points: COST_BASED_RATE_LIMITS.high.points, // Higher cost due to multiple processing
    tier: 'standard'
  },
  securityTags: ['workspace', 'assets']
};

/**
 * Schema for workspace creation
 */
export const CreateWorkspaceSchema: SchemaWithMetadata<z.ZodObject<any>> = {
  schema: z.object({
    clientName: z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
    industry: z.string().max(100).optional(),
  }),
  rateLimit: {
    ...RATE_LIMIT_TIERS.basic,
    points: COST_BASED_RATE_LIMITS.low.points,
    tier: 'basic'
  },
  securityTags: ['workspace']
};

/**
 * Schema for workspace update
 */
export const UpdateWorkspaceSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(100, 'Client name too long').optional(),
  industry: z.string().max(100).optional(),
})

/**
 * Schema for brand kit creation
 */
export const CreateBrandKitSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
    secondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
    tertiary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
  }),
  fonts: z.object({
    heading: z.string().min(1, 'Heading font is required'),
    body: z.string().min(1, 'Body font is required'),
  }),
  voicePrompt: z.string().min(10, 'Voice prompt must be at least 10 characters'),
  brandPersonality: z.string().optional(),
  targetAudience: z.string().optional(),
  valueProposition: z.string().optional(),
  forbiddenPhrases: z.array(z.string()).optional(),
  preferredPhrases: z.array(z.string()).optional(),
  toneStyle: z.enum(['professional', 'playful', 'bold', 'minimal', 'luxury', 'edgy']).optional(),
})

/**
 * Schema for campaign creation
 */
export const CreateCampaignSchema = z
  .object({
  workspaceId: workspaceIdSchema.optional(),
  brandKitId: z.string().min(1, 'Brand kit ID is required').optional(),
  name: z.string().min(1, 'Campaign name is required').max(100, 'Campaign name too long'),
  description: z.string().optional(),
  objective: z.enum(['awareness', 'traffic', 'conversion', 'engagement']),
  launchType: z.enum(['new-launch', 'evergreen', 'seasonal', 'sale', 'event']),
  funnelStage: z.enum(['cold', 'warm', 'hot']),
  placements: z.array(z.enum(['ig-feed', 'ig-story', 'fb-feed', 'fb-story', 'li-feed'])).optional(),
  // Campaign brief fields
  brief: z.object({
    clientOverview: z.string().optional(),
    campaignPurpose: z.string().optional(),
    primaryKPI: z.string().optional(),
    secondaryKPIs: z.array(z.string()).optional(),
    targetMetrics: z.object({
      impressions: z.number().optional(),
      reach: z.number().optional(),
      engagement: z.number().optional(),
      conversions: z.number().optional(),
      roi: z.number().optional(),
    }).optional(),
    competitorInsights: z.array(z.string()).optional(),
    differentiators: z.array(z.string()).optional(),
    primaryAudience: z.object({
      demographics: z.string().optional(),
      psychographics: z.string().optional(),
      painPoints: z.array(z.string()).optional(),
      motivations: z.array(z.string()).optional(),
    }).optional(),
    keyMessage: z.string().optional(),
    supportingPoints: z.array(z.string()).optional(),
    emotionalAppeal: z.string().optional(),
    mandatoryInclusions: z.array(z.string()).optional(),
    mandatoryExclusions: z.array(z.string()).optional(),
    platformStrategy: z.object({
      placements: z.array(z.string()).optional(),
      formatPreferences: z.array(z.string()).optional(),
      postingSchedule: z.string().optional(),
    }).optional(),
    campaignDuration: z.string().optional(),
    seasonality: z.string().optional(),
    budgetConstraints: z.string().optional(),
    successMetrics: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      trackingMethods: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  })
  .refine((data) => !!data.workspaceId || !!data.brandKitId, {
    message: 'Either workspaceId or brandKitId must be provided',
    path: ['workspaceId'],
  })

/**
 * Schema for campaign brief update
 */
export const UpdateCampaignBriefSchema = z.object({
  brief: z.object({
    clientOverview: z.string().optional(),
    campaignPurpose: z.string().optional(),
    primaryKPI: z.string().optional(),
    secondaryKPIs: z.array(z.string()).optional(),
    targetMetrics: z.object({
      impressions: z.number().optional(),
      reach: z.number().optional(),
      engagement: z.number().optional(),
      conversions: z.number().optional(),
      roi: z.number().optional(),
    }).optional(),
    competitorInsights: z.array(z.string()).optional(),
    differentiators: z.array(z.string()).optional(),
    primaryAudience: z.object({
      demographics: z.string().optional(),
      psychographics: z.string().optional(),
      painPoints: z.array(z.string()).optional(),
      motivations: z.array(z.string()).optional(),
    }).optional(),
    keyMessage: z.string().optional(),
    supportingPoints: z.array(z.string()).optional(),
    emotionalAppeal: z.string().optional(),
    mandatoryInclusions: z.array(z.string()).optional(),
    mandatoryExclusions: z.array(z.string()).optional(),
    platformStrategy: z.object({
      placements: z.array(z.string()).optional(),
      formatPreferences: z.array(z.string()).optional(),
      postingSchedule: z.string().optional(),
    }).optional(),
    campaignDuration: z.string().optional(),
    seasonality: z.string().optional(),
    budgetConstraints: z.string().optional(),
    successMetrics: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      trackingMethods: z.array(z.string()).optional(),
    }).optional(),
  })
})

/**
 * Schema for signup
 */
export const SignupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  agencyName: z.string().min(1, 'Agency name is required'),
})

/**
 * Schema for login
 */
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Schema for approval/rejection
 */
export const ApproveRejectSchema = z.object({
  reason: z.string().optional(),
})

/**
 * Schema for batch approval/rejection
 */
export const BatchApproveRejectSchema = z.object({
  captionIds: z.array(z.string()).min(1, 'At least one caption ID is required'),
  reason: z.string().optional(),
})

/**
 * Schema for creative engine generation
 */
export const GenerateCreativesSchema = z.object({
  sourceAssets: z.array(z.object({
    id: z.string(),
    url: z.string(),
    name: z.string(),
    type: z.string(),
  })),
  campaignId: z.string().optional(),
  workspaceId: workspaceIdSchema,
  brandKitId: z.string().optional(),
  targetPlatforms: z.array(z.string()).optional(),
  generateAdCopy: z.boolean().optional().default(false),
  outputCount: z.number().min(1).max(10).optional().default(3),
  referenceCreatives: z.array(z.string()).optional(),
  generateVariations: z.boolean().optional().default(true),
  styleConstraints: z.object({
    platforms: z.array(z.string()).optional(),
    objectives: z.array(z.string()).optional(),
    funnelStage: z.string().optional(),
    targetAudience: z.string().optional(),
    brandPersonality: z.string().optional(),
    valueProposition: z.string().optional(),
    mustInclude: z.array(z.string()).optional(),
    mustExclude: z.array(z.string()).optional(),
    toneStyle: z.string().optional(),
    referenceCaptions: z.array(z.string()).optional(),
  }).optional(),
})

/**
 * Schema for reference creative creation
 */
export const CreateReferenceCreativeSchema = z.object({
  workspaceId: workspaceIdSchema,
  campaignId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  notes: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL'),
})

/**
 * Schema for campaign brief generation requirements
 */
export const GenerateRequirementsSchema = z.object({
  workspaceId: workspaceIdSchema,
  campaignId: z.string().optional(),
  brandKitId: z.string().optional(),
  clientContext: z.object({
    companyDescription: z.string().optional(),
    productService: z.string().optional(),
    uniqueSellingProposition: z.string().optional(),
  }).optional(),
  businessGoals: z.object({
    primaryObjective: z.string().optional(),
    successMetrics: z.array(z.string()).optional(),
    timeline: z.string().optional(),
  }).optional(),
  targetAudience: z.object({
    demographics: z.string().optional(),
    psychographics: z.string().optional(),
    painPoints: z.array(z.string()).optional(),
    buyingBehavior: z.string().optional(),
  }).optional(),
  competitiveLandscape: z.object({
    mainCompetitors: z.array(z.string()).optional(),
    positioning: z.string().optional(),
  }).optional(),
})

/**
 * Schema for story/next-frame requests
 */
export const NextFrameRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  imageUrl: z.string().url('Valid image URL required'),
  action: z.enum(['generate', 'edit', 'improve']),
})

/**
 * Schema for upload assets
 */
export const UploadAssetsSchema = z.object({
  workspaceId: workspaceIdSchema,
  files: z.array(z.object({
    originalname: z.string(),
    mimetype: z.string().regex(/^image\//, 'Only image files are allowed'),
    size: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'), // 50MB
  })),
})

/**
 * Schema for batch processing
 */
export const StartBatchSchema = z.object({
  workspaceId: workspaceIdSchema,
  assetIds: z.array(z.string()).min(1).max(30),
  generateAdCopy: z.boolean().optional().default(false),
})

/**
 * Type inference from schemas
 */
export type CaptionRequest = z.infer<typeof CaptionRequestSchema>
export type MaskRequest = z.infer<typeof MaskRequestSchema>
export type BatchCaptionRequest = z.infer<typeof BatchCaptionSchema>
export type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceSchema>
export type UpdateWorkspaceRequest = z.infer<typeof UpdateWorkspaceSchema>
export type CreateBrandKitRequest = z.infer<typeof CreateBrandKitSchema>
export type CreateCampaignRequest = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignBriefRequest = z.infer<typeof UpdateCampaignBriefSchema>
export type SignupRequest = z.infer<typeof SignupSchema>
export type LoginRequest = z.infer<typeof LoginSchema>
export type ApproveRejectRequest = z.infer<typeof ApproveRejectSchema>
export type BatchApproveRejectRequest = z.infer<typeof BatchApproveRejectSchema>
export type GenerateCreativesRequest = z.infer<typeof GenerateCreativesSchema>
export type CreateReferenceCreativeRequest = z.infer<typeof CreateReferenceCreativeSchema>
export type GenerateRequirementsRequest = z.infer<typeof GenerateRequirementsSchema>
export type NextFrameRequest = z.infer<typeof NextFrameRequestSchema>
export type UploadAssetsRequest = z.infer<typeof UploadAssetsSchema>
export type StartBatchRequest = z.infer<typeof StartBatchSchema>
