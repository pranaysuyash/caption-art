/**
 * V4 Style Memory + Templates System
 *
 * Automatic learning of client visual identity, style profile persistence,
 * template management system, and creative consistency scoring.
 */

export interface StyleProfile {
  id: string
  brandKitId: string
  agencyId: string
  name: string
  version: number
  createdAt: Date
  updatedAt: Date

  // Visual Style DNA
  visualStyle: {
    colorPalette: {
      primary: string[]
      secondary: string[]
      accent: string[]
      neutrals: string[]
      confidence: number // 0-100
    }
    typography: {
      headlineFonts: Array<{
        family: string
        weight: number
        usage: number
        confidence: number
      }>
      bodyFonts: Array<{
        family: string
        weight: number
        usage: number
        confidence: number
      }>
      personality: 'modern' | 'classic' | 'playful' | 'minimal' | 'bold'
    }
    composition: {
      layouts: Array<{
        type: 'centered' | 'left-aligned' | 'right-aligned' | 'grid'
        usage: number
        platforms: string[]
        confidence: number
      }>
      spacing: {
        tight: number // percentage
        normal: number // percentage
        loose: number // percentage
      }
      visualHierarchy: 'strong' | 'moderate' | 'subtle'
    }
    imagery: {
      photographyStyle: 'professional' | 'lifestyle' | 'product-focused' | 'abstract'
      illustrationStyle: 'minimal' | 'detailed' | 'iconic' | 'artistic' | null
      filterPatterns: Array<{
        type: string
        intensity: number
        frequency: number
      }>
    }
  }

  // Content Style DNA
  contentStyle: {
    tone: {
      primary: string[]
      secondary: string[]
      confidence: number
    }
    language: {
      complexity: 'simple' | 'moderate' | 'complex'
      formality: 'casual' | 'professional' | 'mixed'
      sentiment: 'positive' | 'neutral' | 'mixed'
    }
    messaging: {
      valuePropositions: Array<{
        statement: string
        frequency: number
        effectiveness: number
      }>
      callToActions: Array<{
        text: string
        conversionRate: number
        usage: number
      }>
      emotionalAppeals: Array<{
        type: string
        effectiveness: number
        usage: number
      }>
    }
    hashtags: {
      brandHashtags: string[]
      campaignHashtags: string[]
      industryHashtags: string[]
      effectiveness: Record<string, number>
    }
  }

  // Performance Analytics
  performance: {
    averageCtr: number
    averageEngagementRate: number
    averageConversionRate: number
    topPerformingElements: Array<{
      type: 'color' | 'font' | 'layout' | 'messaging'
      element: string
      performance: number
      confidence: number
    }>
    underperformingElements: Array<{
      type: 'color' | 'font' | 'layout' | 'messaging'
      element: string
      performance: number
      recommendations: string[]
    }>
  }

  // Learning Metadata
  learning: {
    sampleSize: number
    lastTrained: Date
    accuracyScore: number
    confidence: number
    dataSources: string[]
    versionHistory: Array<{
      version: number
      changes: string[]
      performance: number
      timestamp: Date
    }>
  }
}

export interface CreativeTemplate {
  id: string
  name: string
  category: 'ecommerce' | 'saas' | 'service' | 'b2b' | 'lifestyle' | 'education' | 'healthcare' | 'generic'
  description: string
  tags: string[]

  // Template Configuration
  configuration: {
    objectives: Array<'awareness' | 'consideration' | 'conversion' | 'retention'>
    funnelStages: Array<'top' | 'middle' | 'bottom'>
    platforms: Array<'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok'>
    industries: string[]
  }

  // Slot Structure
  slots: {
    headline: {
      template: string
      maxLength: number
      variations: string[]
      placeholders: Array<{
        name: string
        type: 'text' | 'brand' | 'offer' | 'audience' | 'painpoint'
        description: string
        required: boolean
      }>
    }
    subheadline?: {
      template: string
      maxLength: number
      variations: string[]
      placeholders: Array<{
        name: string
        type: 'text' | 'brand' | 'offer' | 'audience' | 'painpoint'
        description: string
        required: boolean
      }>
    }
    body: {
      template: string
      maxLength: number
      variations: string[]
      paragraphs: number
      placeholders: Array<{
        name: string
        type: 'text' | 'brand' | 'offer' | 'audience' | 'painpoint' | 'socialproof'
        description: string
        required: boolean
      }>
    }
    cta: {
      template: string
      maxLength: number
      variations: string[]
      urgencyOptions: string[]
    }
    primaryText?: {
      template: string
      maxLength: number
      hashtags: string[]
      mentions: string[]
    }
  }

  // Platform Adaptations
  platformAdaptations: {
    instagram: {
      adjustments: Record<string, string>
      characterLimits: Record<string, number>
      bestPractices: string[]
    }
    facebook: {
      adjustments: Record<string, string>
      characterLimits: Record<string, number>
      bestPractices: string[]
    }
    linkedin: {
      adjustments: Record<string, string>
      characterLimits: Record<string, number>
      bestPractices: string[]
    }
  }

  // Style Guidelines
  styleGuidelines: {
    visual: {
      colorUsage: 'full' | 'limited' | 'monochrome'
      imageryStyle: string[]
      layoutRequirements: string[]
    }
    tone: string[]
    forbiddenWords: string[]
    requiredElements: string[]
  }

  // Performance Data
  performance: {
    usageCount: number
    averagePerformance: {
      ctr: number
      engagementRate: number
      conversionRate: number
    }
    bestPerformingVariations: Record<string, string>
    industryBenchmarks: {
      ctr: number
      engagementRate: number
      conversionRate: number
    }
  }

  // Metadata
  metadata: {
    createdBy: string
    createdAt: Date
    updatedAt: Date
    version: number
    isPublic: boolean
    rating: number
    reviews: Array<{
      userId: string
      rating: number
      comment: string
      timestamp: Date
    }>
  }
}

export interface StyleLearningRequest {
  brandKitId: string
  agencyId: string
  dataSources: {
    referenceCreatives: string[]
    pastCampaigns: string[]
    topPerformingAds: string[]
    brandAssets: string[]
    websiteContent?: string
    competitorAnalysis?: string[]
  }
  learningParameters: {
    sampleSize: number
    minConfidence: number
    includeIndustryBenchmarks: boolean
    updateExistingProfile: boolean
  }
}

export interface StyleLearningResult {
  styleProfile: StyleProfile
  insights: {
    visualConsistency: number
    brandVoiceStrength: number
    competitiveDifferentiation: number
    recommendationConfidence: number
  }
  recommendations: Array<{
    category: 'colors' | 'typography' | 'messaging' | 'layout' | 'performance'
    priority: 'high' | 'medium' | 'low'
    recommendation: string
    reasoning: string
    expectedImpact: number
  }>
  templateSuggestions: CreativeTemplate[]
  performancePredictions: {
    expectedCtr: number
    expectedEngagementRate: number
    expectedConversionRate: number
    confidence: number
  }
}

export interface TemplateMatchingRequest {
  styleProfileId: string
  campaignBrief: {
    objective: string
    funnelStage: string
    targetAudience: string
    keyMessage: string
    industry: string
  }
  platform: string
  constraints: {
    budget?: 'low' | 'medium' | 'high'
    timeline?: 'urgent' | 'normal' | 'flexible'
    resources?: string[]
  }
  preferences: {
    templates?: string[]
    excludeCategories?: string[]
    minPerformance?: number
  }
}

export interface TemplateMatchingResult {
  matches: Array<{
    template: CreativeTemplate
    compatibilityScore: number
    expectedPerformance: {
      ctr: number
      engagementRate: number
      conversionRate: number
    }
    adaptations: Array<{
      element: string
      recommendation: string
      confidence: number
    }>
    reasoning: string
  }>
  alternativeSuggestions: Array<{
    template: CreativeTemplate
    reason: string
  }>
  styleAlignment: {
    visualAlignment: number
    toneAlignment: number
    audienceAlignment: number
    platformAlignment: number
  }
}

export interface ConsistencyScoreRequest {
  creativeId: string
  styleProfileId: string
  platform: string
  analysisDepth: 'quick' | 'standard' | 'comprehensive'
}

export interface ConsistencyScoreResult {
  overallScore: number // 0-100
  breakdown: {
    visualConsistency: {
      score: number
      colorAlignment: number
      fontAlignment: number
      layoutAlignment: number
      imageryAlignment: number
    }
    contentConsistency: {
      score: number
      toneAlignment: number
      messagingAlignment: number
      brandVoiceAlignment: number
      ctaAlignment: number
    }
    platformAlignment: {
      score: number
      characterLimitCompliance: number
      bestPracticeAdherence: number
      audienceFit: number
    }
  }
  recommendations: Array<{
    category: 'visual' | 'content' | 'platform'
    severity: 'critical' | 'warning' | 'suggestion'
    issue: string
    recommendation: string
    impact: number
  }>
  confidence: number
  analyzedAt: Date
}

// Learning Configuration
export const LEARNING_CONFIG = {
  minSampleSize: 10,
  confidenceThreshold: 0.75,
  updateFrequency: 'weekly', // daily, weekly, monthly
  retentionPeriod: 90, // days
  maxProfilesPerBrand: 5,
  templateMatching: {
    maxResults: 10,
    minCompatibilityScore: 0.6,
    weighting: {
      visual: 0.3,
      content: 0.4,
      performance: 0.2,
      platform: 0.1
    }
  },
  consistencyScoring: {
    weights: {
      visual: 0.4,
      content: 0.35,
      platform: 0.25
    },
    thresholds: {
      excellent: 90,
      good: 75,
      fair: 60,
      poor: 40
    }
  }
} as const

// Industry Templates
export const INDUSTRY_TEMPLATES = {
  ecommerce: {
    objectives: ['conversion', 'awareness'],
    commonPatterns: ['urgency', 'social-proof', 'scarcity', 'benefit-focused'],
    colorTendencies: ['vibrant', 'high-contrast', 'trust-inducing'],
    ctas: ['Buy Now', 'Shop Today', 'Limited Offer', 'Add to Cart']
  },
  saas: {
    objectives: ['consideration', 'conversion'],
    commonPatterns: ['problem-solution', 'feature-benefit', 'case-study', 'demo-offer'],
    colorTendencies: ['professional', 'tech-forward', 'clean', 'corporate'],
    ctas: ['Start Free Trial', 'Book Demo', 'Learn More', 'Get Started']
  },
  healthcare: {
    objectives: ['awareness', 'consideration'],
    commonPatterns: ['trust-building', 'educational', 'empathy', 'expertise'],
    colorTendencies: ['calming', 'professional', 'medical', 'clean'],
    ctas: ['Book Appointment', 'Learn More', 'Find Provider', 'Contact Us']
  },
  finance: {
    objectives: ['consideration', 'conversion'],
    commonPatterns: ['security', 'growth', 'trust', 'expertise'],
    colorTendencies: ['conservative', 'stable', 'professional', 'corporate'],
    ctas: ['Open Account', 'Learn More', 'Get Started', 'Talk to Advisor']
  }
} as const