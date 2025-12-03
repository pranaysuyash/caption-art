/**
 * V3 Ad Creative System - Slot-based Structure
 * Frontend TypeScript definitions
 */

export interface AdCreativeSlot {
  id: string
  type: 'headline' | 'subheadline' | 'body' | 'cta' | 'primaryText' | 'description'
  content: string
  variations: string[]
  maxLength?: number
  platformSpecific?: {
    instagram?: string
    facebook?: string
    linkedin?: string
  }
  metadata?: {
    tone?: string[]
    emotionalImpact?: string[]
    targetKPI?: string
    abTestVariant?: string
  }
}

export interface AdCreative {
  id: string
  campaignId: string
  brandKitId: string
  name: string
  objective: 'awareness' | 'consideration' | 'conversion' | 'retention'
  funnelStage: 'top' | 'middle' | 'bottom'
  primaryPlatform: 'instagram' | 'facebook' | 'linkedin' | 'multi'
  status: 'draft' | 'review' | 'approved' | 'active' | 'paused'
  slots: AdCreativeSlot[]
  visualRequirements?: {
    imageDimensions?: { width: number; height: number }
    videoSpecs?: { duration: number; format: string }
    colorPalette?: string[]
    brandGuidelines?: string[]
  }
  performance?: {
    impressions?: number
    clicks?: number
    conversions?: number
    ctr?: number
    cpc?: number
    roas?: number
  }
  createdAt: Date
  updatedAt: Date
  version: number
  abTestSettings?: {
    enabled: boolean
    variants: string[]
    testDuration: number
    successMetrics: string[]
  }
}

export interface AdCreativeTemplate {
  id: string
  name: string
  category: 'ecommerce' | 'saas' | 'service' | 'b2b' | 'lifestyle' | 'generic'
  objective: 'awareness' | 'consideration' | 'conversion' | 'retention'
  funnelStage: 'top' | 'middle' | 'bottom'
  slots: {
    headline: { template: string; variations: string[]; maxLength: number }
    subheadline?: { template: string; variations: string[]; maxLength: number }
    body: { template: string; variations: string[]; maxLength: number }
    cta: { template: string; variations: string[] }
    primaryText?: { template: string; variations: string[]; maxLength: number }
  }
  platformAdaptations: {
    instagram: Record<string, string>
    facebook: Record<string, string>
    linkedin: Record<string, string>
  }
  bestPractices: string[]
}

export interface AdCreativeGenerationRequest {
  campaignId: string
  brandKitId: string
  objective: 'awareness' | 'consideration' | 'conversion' | 'retention'
  funnelStage: 'top' | 'middle' | 'bottom'
  platforms: ('instagram' | 'facebook' | 'linkedin')[]
  targetAudience: {
    demographics?: string
    psychographics?: string
    painPoints?: string[]
  }
  keyMessage: string
  cta: string
  tone: string[]
  variations: number
  includeVisuals: boolean
}

export interface AdCreativeGenerationResult {
  adCreative: AdCreative
  generatedSlots: AdCreativeSlot[]
  platformVersions: Record<string, AdCreative>
  qualityScore: number
  recommendations: string[]
  estimatedPerformance: {
    ctr: number
    conversionRate: number
    engagementRate: number
  }
}

// Slot Configuration
export const SLOT_CONFIGS = {
  headline: {
    maxLength: {
      instagram: 30,
      facebook: 50,
      linkedin: 60
    },
    bestPractices: [
      'Keep it short and punchy',
      'Use strong action words',
      'Include value proposition',
      'Ask questions to engage'
    ]
  },
  subheadline: {
    maxLength: {
      instagram: 20,
      facebook: 30,
      linkedin: 40
    },
    bestPractices: [
      'Support the headline',
      'Add specific details',
      'Create curiosity',
      'Mention key benefits'
    ]
  },
  body: {
    maxLength: {
      instagram: 125,
      facebook: 300,
      linkedin: 500
    },
    bestPractices: [
      'Focus on benefits over features',
      'Use social proof',
      'Include specific numbers/results',
      'Address pain points'
    ]
  },
  cta: {
    maxLength: {
      instagram: 20,
      facebook: 25,
      linkedin: 30
    },
    bestPractices: [
      'Use action-oriented language',
      'Create urgency',
      'Be specific about next step',
      'Remove friction'
    ]
  },
  primaryText: {
    maxLength: {
      instagram: 2200,
      facebook: 50000,
      linkedin: 1300
    },
    bestPractices: [
      'Hook in first sentence',
      'Use emojis strategically',
      'Include hashtags',
      'Tag relevant accounts'
    ]
  }
} as const

// Funnel Stage Strategies
export const FUNNEL_STAGE_STRATEGIES = {
  top: {
    focus: 'Awareness and education',
    keyElements: ['Problem identification', 'Brand introduction', 'Value proposition'],
    tone: ['Educational', 'Inspirational', 'Curiosity-driven'],
    ctaTypes: ['Learn More', 'Discover', 'Explore']
  },
  middle: {
    focus: 'Consideration and comparison',
    keyElements: ['Solution benefits', 'Social proof', 'Differentiation'],
    tone: ['Informative', 'Persuasive', 'Trust-building'],
    ctaTypes: ['Get Started', 'Try Now', 'Compare']
  },
  bottom: {
    focus: 'Conversion and action',
    keyElements: ['Urgency', 'Specific offer', 'Risk reversal'],
    tone: ['Urgent', 'Direct', 'Confident'],
    ctaTypes: ['Buy Now', 'Sign Up', 'Book Demo']
  }
} as const

// Platform-specific Guidelines
export const PLATFORM_GUIDELINES = {
  instagram: {
    characterLimits: { headline: 30, body: 125, cta: 20 },
    visualPriority: 'High',
    bestPractices: [
      'First line is crucial (appears before "See More")',
      'Use emojis strategically',
      'Include relevant hashtags (5-10 max)',
      'Tag accounts and locations'
    ]
  },
  facebook: {
    characterLimits: { headline: 50, body: 300, cta: 25 },
    visualPriority: 'Medium-High',
    bestPractices: [
      'Lead with value proposition',
      'Use link preview effectively',
      'Include social proof',
      'Consider carousel for multiple points'
    ]
  },
  linkedin: {
    characterLimits: { headline: 60, body: 500, cta: 30 },
    visualPriority: 'Medium',
    bestPractices: [
      'Professional tone with personality',
      'Lead with insights or data',
      'Use relevant hashtags (3-5)',
      'Tag companies and individuals'
    ]
  }
} as const

// API Response Types
export interface AdCreativeListResponse {
  success: boolean
  adCreatives: AdCreative[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdCreativeGenerateResponse {
  success: boolean
  result: {
    adCreative: AdCreative
    platformVersions: Record<string, AdCreative>
    qualityScore: number
    recommendations: string[]
    estimatedPerformance: {
      ctr: number
      conversionRate: number
      engagementRate: number
    }
  }
}

export interface AdCreativeAnalysisResponse {
  success: boolean
  analysis: {
    qualityScore: number
    recommendations: string[]
    estimatedPerformance: {
      ctr: number
      conversionRate: number
      engagementRate: number
    }
    slotAnalysis: Array<{
      type: string
      contentLength: number
      variationCount: number
      hasPlatformSpecific: boolean
    }>
  }
}