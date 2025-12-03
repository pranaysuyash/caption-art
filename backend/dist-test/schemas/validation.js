"use strict";
/**
 * Request validation schemas using Zod
 * Provides type-safe input validation for API routes
 * This is the single source of truth for all validation schemas
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartBatchSchema = exports.UploadAssetsSchema = exports.NextFrameRequestSchema = exports.GenerateRequirementsSchema = exports.CreateReferenceCreativeSchema = exports.GenerateCreativesSchema = exports.BatchApproveRejectSchema = exports.ApproveRejectSchema = exports.LoginSchema = exports.SignupSchema = exports.UpdateCampaignBriefSchema = exports.CreateCampaignSchema = exports.CreateBrandKitSchema = exports.UpdateWorkspaceSchema = exports.CreateWorkspaceSchema = exports.BatchCaptionSchema = exports.MaskRequestSchema = exports.CaptionRequestSchema = exports.Tones = exports.COST_BASED_RATE_LIMITS = exports.RATE_LIMIT_TIERS = void 0;
var zod_1 = require("zod");
// Common validation patterns
var idSchema = zod_1.z.string().min(1, 'ID cannot be empty');
var workspaceIdSchema = zod_1.z.string().min(1, 'Workspace ID is required');
var assetIdSchema = zod_1.z.string().min(1, 'Asset ID is required');
// Default rate limiting configurations
exports.RATE_LIMIT_TIERS = {
    basic: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10,
        points: 1,
        tier: 'basic'
    },
    standard: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50,
        points: 1,
        tier: 'standard'
    },
    premium: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        points: 1,
        tier: 'premium'
    },
    enterprise: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500,
        points: 1,
        tier: 'enterprise'
    }
};
// Cost-based rate limiting configurations
exports.COST_BASED_RATE_LIMITS = {
    // Low-cost endpoints (no AI/external API usage)
    low: { points: 1, description: 'Simple read operations' },
    medium: { points: 3, description: 'Basic AI processing' },
    high: { points: 5, description: 'Complex AI processing' },
    veryHigh: { points: 10, description: 'Multiple AI services' }
};
exports.Tones = zod_1.z.enum(['default', 'witty', 'inspirational', 'formal']);
/**
 * Schema for caption generation requests
 */
exports.CaptionRequestSchema = {
    schema: zod_1.z.object({
        imageUrl: zod_1.z
            .string()
            .min(1, 'Image URL cannot be empty')
            .refine(function (url) {
            return url.startsWith('data:image/') ||
                url.startsWith('http://') ||
                url.startsWith('https://');
        }, 'Invalid image URL format. Must be a data URI or HTTP(S) URL')
            .refine(function (url) {
            // Validate data URI format if it's a data URI
            if (url.startsWith('data:image/')) {
                return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(url);
            }
            return true;
        }, 'Invalid data URI format. Must be base64-encoded image'),
        keywords: zod_1.z.array(zod_1.z.string()).optional().default([]),
        tone: exports.Tones.optional().default('default'),
    }),
    rateLimit: __assign(__assign({}, exports.RATE_LIMIT_TIERS.standard), { points: exports.COST_BASED_RATE_LIMITS.medium.points, tier: 'standard' }),
    securityTags: ['prompt', 'image-url']
};
/**
 * Schema for mask generation requests
 */
exports.MaskRequestSchema = {
    schema: zod_1.z.object({
        imageUrl: zod_1.z
            .string()
            .min(1, 'Image URL cannot be empty')
            .refine(function (url) {
            return url.startsWith('data:image/') ||
                url.startsWith('http://') ||
                url.startsWith('https://');
        }, 'Invalid image URL format. Must be a data URI or HTTP(S) URL')
            .refine(function (url) {
            // Validate data URI format if it's a data URI
            if (url.startsWith('data:image/')) {
                return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(url);
            }
            return true;
        }, 'Invalid data URI format. Must be base64-encoded image'),
    }),
    rateLimit: __assign(__assign({}, exports.RATE_LIMIT_TIERS.standard), { points: exports.COST_BASED_RATE_LIMITS.medium.points, tier: 'standard' }),
    securityTags: ['image-url']
};
/**
 * Schema for batch caption generation
 */
exports.BatchCaptionSchema = {
    schema: zod_1.z.object({
        workspaceId: workspaceIdSchema,
        assetIds: zod_1.z.array(assetIdSchema).min(1, 'At least one asset is required').max(30, 'Maximum 30 assets per batch'),
        generateAdCopy: zod_1.z.boolean().optional().default(false),
        variationsCount: zod_1.z.number().min(1).max(10).optional().default(3)
    }),
    rateLimit: __assign(__assign({}, exports.RATE_LIMIT_TIERS.standard), { points: exports.COST_BASED_RATE_LIMITS.high.points, tier: 'standard' }),
    securityTags: ['workspace', 'assets']
};
/**
 * Schema for workspace creation
 */
exports.CreateWorkspaceSchema = {
    schema: zod_1.z.object({
        clientName: zod_1.z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
        brandKitId: zod_1.z.string().optional(), // Optional since brand kit might be created separately
    }),
    rateLimit: __assign(__assign({}, exports.RATE_LIMIT_TIERS.basic), { points: exports.COST_BASED_RATE_LIMITS.low.points, tier: 'basic' }),
    securityTags: ['workspace']
};
/**
 * Schema for workspace update
 */
exports.UpdateWorkspaceSchema = zod_1.z.object({
    clientName: zod_1.z.string().min(1, 'Client name is required').max(100, 'Client name too long').optional(),
});
/**
 * Schema for brand kit creation
 */
exports.CreateBrandKitSchema = zod_1.z.object({
    colors: zod_1.z.object({
        primary: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
        secondary: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
        tertiary: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format'),
    }),
    fonts: zod_1.z.object({
        heading: zod_1.z.string().min(1, 'Heading font is required'),
        body: zod_1.z.string().min(1, 'Body font is required'),
    }),
    voicePrompt: zod_1.z.string().min(10, 'Voice prompt must be at least 10 characters'),
    brandPersonality: zod_1.z.string().optional(),
    targetAudience: zod_1.z.string().optional(),
    valueProposition: zod_1.z.string().optional(),
    forbiddenPhrases: zod_1.z.array(zod_1.z.string()).optional(),
    preferredPhrases: zod_1.z.array(zod_1.z.string()).optional(),
    toneStyle: zod_1.z.enum(['professional', 'playful', 'bold', 'minimal', 'luxury', 'edgy']).optional(),
});
/**
 * Schema for campaign creation
 */
exports.CreateCampaignSchema = zod_1.z.object({
    workspaceId: workspaceIdSchema,
    brandKitId: zod_1.z.string().min(1, 'Brand kit ID is required'),
    name: zod_1.z.string().min(1, 'Campaign name is required').max(100, 'Campaign name too long'),
    description: zod_1.z.string().optional(),
    objective: zod_1.z.enum(['awareness', 'traffic', 'conversion', 'engagement']),
    launchType: zod_1.z.enum(['new-launch', 'evergreen', 'seasonal', 'sale', 'event']),
    funnelStage: zod_1.z.enum(['cold', 'warm', 'hot']),
    // Campaign brief fields
    brief: zod_1.z.object({
        clientOverview: zod_1.z.string().optional(),
        campaignPurpose: zod_1.z.string().optional(),
        primaryKPI: zod_1.z.string().optional(),
        secondaryKPIs: zod_1.z.array(zod_1.z.string()).optional(),
        targetMetrics: zod_1.z.object({
            impressions: zod_1.z.number().optional(),
            reach: zod_1.z.number().optional(),
            engagement: zod_1.z.number().optional(),
            conversions: zod_1.z.number().optional(),
            roi: zod_1.z.number().optional(),
        }).optional(),
        competitorInsights: zod_1.z.array(zod_1.z.string()).optional(),
        differentiators: zod_1.z.array(zod_1.z.string()).optional(),
        primaryAudience: zod_1.z.object({
            demographics: zod_1.z.string().optional(),
            psychographics: zod_1.z.string().optional(),
            painPoints: zod_1.z.array(zod_1.z.string()).optional(),
            motivations: zod_1.z.array(zod_1.z.string()).optional(),
        }).optional(),
        keyMessage: zod_1.z.string().optional(),
        supportingPoints: zod_1.z.array(zod_1.z.string()).optional(),
        emotionalAppeal: zod_1.z.string().optional(),
        mandatoryInclusions: zod_1.z.array(zod_1.z.string()).optional(),
        mandatoryExclusions: zod_1.z.array(zod_1.z.string()).optional(),
        platformStrategy: zod_1.z.object({
            placements: zod_1.z.array(zod_1.z.string()).optional(),
            formatPreferences: zod_1.z.array(zod_1.z.string()).optional(),
            postingSchedule: zod_1.z.string().optional(),
        }).optional(),
        campaignDuration: zod_1.z.string().optional(),
        seasonality: zod_1.z.string().optional(),
        budgetConstraints: zod_1.z.string().optional(),
        successMetrics: zod_1.z.object({
            primary: zod_1.z.string().optional(),
            secondary: zod_1.z.string().optional(),
            trackingMethods: zod_1.z.array(zod_1.z.string()).optional(),
        }).optional(),
    }).optional(),
});
/**
 * Schema for campaign brief update
 */
exports.UpdateCampaignBriefSchema = zod_1.z.object({
    brief: zod_1.z.object({
        clientOverview: zod_1.z.string().optional(),
        campaignPurpose: zod_1.z.string().optional(),
        primaryKPI: zod_1.z.string().optional(),
        secondaryKPIs: zod_1.z.array(zod_1.z.string()).optional(),
        targetMetrics: zod_1.z.object({
            impressions: zod_1.z.number().optional(),
            reach: zod_1.z.number().optional(),
            engagement: zod_1.z.number().optional(),
            conversions: zod_1.z.number().optional(),
            roi: zod_1.z.number().optional(),
        }).optional(),
        competitorInsights: zod_1.z.array(zod_1.z.string()).optional(),
        differentiators: zod_1.z.array(zod_1.z.string()).optional(),
        primaryAudience: zod_1.z.object({
            demographics: zod_1.z.string().optional(),
            psychographics: zod_1.z.string().optional(),
            painPoints: zod_1.z.array(zod_1.z.string()).optional(),
            motivations: zod_1.z.array(zod_1.z.string()).optional(),
        }).optional(),
        keyMessage: zod_1.z.string().optional(),
        supportingPoints: zod_1.z.array(zod_1.z.string()).optional(),
        emotionalAppeal: zod_1.z.string().optional(),
        mandatoryInclusions: zod_1.z.array(zod_1.z.string()).optional(),
        mandatoryExclusions: zod_1.z.array(zod_1.z.string()).optional(),
        platformStrategy: zod_1.z.object({
            placements: zod_1.z.array(zod_1.z.string()).optional(),
            formatPreferences: zod_1.z.array(zod_1.z.string()).optional(),
            postingSchedule: zod_1.z.string().optional(),
        }).optional(),
        campaignDuration: zod_1.z.string().optional(),
        seasonality: zod_1.z.string().optional(),
        budgetConstraints: zod_1.z.string().optional(),
        successMetrics: zod_1.z.object({
            primary: zod_1.z.string().optional(),
            secondary: zod_1.z.string().optional(),
            trackingMethods: zod_1.z.array(zod_1.z.string()).optional(),
        }).optional(),
    })
});
/**
 * Schema for signup
 */
exports.SignupSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    agencyName: zod_1.z.string().min(1, 'Agency name is required'),
});
/**
 * Schema for login
 */
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
/**
 * Schema for approval/rejection
 */
exports.ApproveRejectSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
/**
 * Schema for batch approval/rejection
 */
exports.BatchApproveRejectSchema = zod_1.z.object({
    captionIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one caption ID is required'),
    reason: zod_1.z.string().optional(),
});
/**
 * Schema for creative engine generation
 */
exports.GenerateCreativesSchema = zod_1.z.object({
    sourceAssets: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        url: zod_1.z.string(),
        name: zod_1.z.string(),
        type: zod_1.z.string(),
    })),
    campaignId: zod_1.z.string().optional(),
    workspaceId: workspaceIdSchema,
    brandKitId: zod_1.z.string().optional(),
    targetPlatforms: zod_1.z.array(zod_1.z.string()).optional(),
    generateAdCopy: zod_1.z.boolean().optional().default(false),
    outputCount: zod_1.z.number().min(1).max(10).optional().default(3),
    referenceCreatives: zod_1.z.array(zod_1.z.string()).optional(),
    generateVariations: zod_1.z.boolean().optional().default(true),
    styleConstraints: zod_1.z.object({
        platforms: zod_1.z.array(zod_1.z.string()).optional(),
        objectives: zod_1.z.array(zod_1.z.string()).optional(),
        funnelStage: zod_1.z.string().optional(),
        targetAudience: zod_1.z.string().optional(),
        brandPersonality: zod_1.z.string().optional(),
        valueProposition: zod_1.z.string().optional(),
        mustInclude: zod_1.z.array(zod_1.z.string()).optional(),
        mustExclude: zod_1.z.array(zod_1.z.string()).optional(),
        toneStyle: zod_1.z.string().optional(),
        referenceCaptions: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
/**
 * Schema for reference creative creation
 */
exports.CreateReferenceCreativeSchema = zod_1.z.object({
    workspaceId: workspaceIdSchema,
    campaignId: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Name is required'),
    notes: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url('Invalid image URL'),
    thumbnailUrl: zod_1.z.string().url('Invalid thumbnail URL'),
});
/**
 * Schema for campaign brief generation requirements
 */
exports.GenerateRequirementsSchema = zod_1.z.object({
    workspaceId: workspaceIdSchema,
    campaignId: zod_1.z.string().optional(),
    brandKitId: zod_1.z.string().optional(),
    clientContext: zod_1.z.object({
        companyDescription: zod_1.z.string().optional(),
        productService: zod_1.z.string().optional(),
        uniqueSellingProposition: zod_1.z.string().optional(),
    }).optional(),
    businessGoals: zod_1.z.object({
        primaryObjective: zod_1.z.string().optional(),
        successMetrics: zod_1.z.array(zod_1.z.string()).optional(),
        timeline: zod_1.z.string().optional(),
    }).optional(),
    targetAudience: zod_1.z.object({
        demographics: zod_1.z.string().optional(),
        psychographics: zod_1.z.string().optional(),
        painPoints: zod_1.z.array(zod_1.z.string()).optional(),
        buyingBehavior: zod_1.z.string().optional(),
    }).optional(),
    competitiveLandscape: zod_1.z.object({
        mainCompetitors: zod_1.z.array(zod_1.z.string()).optional(),
        positioning: zod_1.z.string().optional(),
    }).optional(),
});
/**
 * Schema for story/next-frame requests
 */
exports.NextFrameRequestSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(1, 'Prompt is required'),
    imageUrl: zod_1.z.string().url('Valid image URL required'),
    action: zod_1.z.enum(['generate', 'edit', 'improve']),
});
/**
 * Schema for upload assets
 */
exports.UploadAssetsSchema = zod_1.z.object({
    workspaceId: workspaceIdSchema,
    files: zod_1.z.array(zod_1.z.object({
        originalname: zod_1.z.string(),
        mimetype: zod_1.z.string().regex(/^image\//, 'Only image files are allowed'),
        size: zod_1.z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'), // 50MB
    })),
});
/**
 * Schema for batch processing
 */
exports.StartBatchSchema = zod_1.z.object({
    workspaceId: workspaceIdSchema,
    assetIds: zod_1.z.array(zod_1.z.string()).min(1).max(30),
    generateAdCopy: zod_1.z.boolean().optional().default(false),
});
