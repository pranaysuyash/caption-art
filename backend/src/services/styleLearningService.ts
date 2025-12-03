import OpenAI from 'openai'
import {
  StyleProfile,
  CreativeTemplate,
  StyleLearningRequest,
  StyleLearningResult,
  LEARNING_CONFIG,
  INDUSTRY_TEMPLATES,
} from '../types/styleMemory'
import {
  AuthModel,
  Campaign,
  BrandKit,
  ReferenceCreative,
} from '../models/auth'
import { log } from '../middleware/logger'
import { AdCreativeGenerator } from './adCreativeGenerator'

export class StyleLearningService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Learn and update style profile from brand data
   */
  async learnStyleProfile(
    request: StyleLearningRequest
  ): Promise<StyleLearningResult> {
    try {
      log.info(
        { brandKitId: request.brandKitId },
        'Learning style profile for brand kit'
      )

      // Collect data from all sources
      const learningData = await this.collectLearningData(request)

      // Extract visual patterns
      const visualStyle = await this.extractVisualStyle(learningData)

      // Analyze content patterns
      const contentStyle = await this.analyzeContentStyle(learningData)

      // Calculate performance insights
      const performance = await this.calculatePerformanceInsights(learningData)

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        visualStyle,
        contentStyle,
        performance
      )

      // Suggest templates
      const templateSuggestions = await this.suggestTemplates(
        visualStyle,
        contentStyle
      )

      // Create style profile
      const styleProfile: StyleProfile = {
        id: `style-profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        brandKitId: request.brandKitId,
        agencyId: request.agencyId,
        name: `Style Profile v${this.getNextVersion(request.brandKitId)}`,
        version: this.getNextVersion(request.brandKitId),
        createdAt: new Date(),
        updatedAt: new Date(),
        visualStyle,
        contentStyle,
        performance,
        learning: {
          sampleSize: learningData.totalSamples,
          lastTrained: new Date(),
          accuracyScore: this.calculateAccuracy(visualStyle, contentStyle),
          confidence: this.calculateConfidence(learningData),
          dataSources: Object.keys(learningData),
          versionHistory: [
            {
              version: 1,
              changes: ['Initial profile creation'],
              performance: performance.averageCtr,
              timestamp: new Date(),
            },
          ],
        },
      }

      // Calculate insights
      const insights = {
        visualConsistency: this.calculateVisualConsistency(visualStyle),
        brandVoiceStrength: this.calculateBrandVoiceStrength(contentStyle),
        competitiveDifferentiation: this.calculateCompetitiveDifferentiation(
          visualStyle,
          contentStyle
        ),
        recommendationConfidence: styleProfile.learning.confidence,
      }

      // Predict performance
      const performancePredictions = {
        expectedCtr: this.predictCTR(visualStyle, contentStyle, performance),
        expectedEngagementRate: this.predictEngagementRate(
          visualStyle,
          contentStyle,
          performance
        ),
        expectedConversionRate: this.predictConversionRate(
          visualStyle,
          contentStyle,
          performance
        ),
        confidence: styleProfile.learning.confidence,
      }

      log.info({ styleProfileId: styleProfile.id }, 'Style profile learned')

      return {
        styleProfile,
        insights,
        recommendations,
        templateSuggestions,
        performancePredictions,
      }
    } catch (error) {
      log.error({ err: error }, 'Style learning error')
      throw new Error('Failed to learn style profile')
    }
  }

  /**
   * Collect learning data from various sources
   */
  private async collectLearningData(request: StyleLearningRequest) {
    const data: any = {
      referenceCreatives: [],
      campaigns: [],
      topPerformers: [],
      brandAssets: [],
      totalSamples: 0,
    }

    // Collect reference creatives
    if (request.dataSources.referenceCreatives?.length > 0) {
      for (const creativeId of request.dataSources.referenceCreatives) {
        const creative = AuthModel.getReferenceCreativeById(creativeId)
        if (creative) {
          data.referenceCreatives.push(creative)
        }
      }
    }

    // Collect campaign data
    if (request.dataSources.pastCampaigns?.length > 0) {
      for (const campaignId of request.dataSources.pastCampaigns) {
        const campaign = AuthModel.getCampaignById(campaignId)
        if (campaign) {
          data.campaigns.push(campaign)
        }
      }
    }

    // Collect brand assets (mock for now - in production would integrate with asset management)
    if (request.dataSources.brandAssets?.length > 0) {
      data.brandAssets = request.dataSources.brandAssets
    }

    data.totalSamples = data.referenceCreatives.length + data.campaigns.length

    return data
  }

  /**
   * Extract visual style patterns using AI
   */
  private async extractVisualStyle(learningData: any) {
    const prompt = this.buildVisualStylePrompt(learningData)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert visual brand analyst specializing in digital advertising. Extract and analyze visual style patterns from brand assets and creatives.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Failed to extract visual style')
    }

    return this.parseVisualStyle(response, learningData)
  }

  /**
   * Analyze content style patterns using AI
   */
  private async analyzeContentStyle(learningData: any) {
    const prompt = this.buildContentStylePrompt(learningData)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert content strategist specializing in brand voice and messaging analysis. Extract and analyze content style patterns from marketing materials.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Failed to analyze content style')
    }

    return this.parseContentStyle(response, learningData)
  }

  /**
   * Calculate performance insights from historical data
   */
  private async calculatePerformanceInsights(learningData: any) {
    // This would integrate with actual performance data
    // For now, using simulated data based on patterns observed

    const baseMetrics = {
      averageCtr: 0.025,
      averageEngagementRate: 0.045,
      averageConversionRate: 0.012,
    }

    // Analyze top performing elements
    const topPerformingElements = this.analyzeTopPerformers(learningData)

    // Identify underperforming elements
    const underperformingElements = this.identifyUnderperformers(learningData)

    return {
      ...baseMetrics,
      topPerformingElements,
      underperformingElements,
    }
  }

  /**
   * Generate improvement recommendations
   */
  private async generateRecommendations(
    visualStyle: any,
    contentStyle: any,
    performance: any
  ) {
    const recommendations = []

    // Visual consistency recommendations
    if (visualStyle.colorPalette.confidence < 80) {
      recommendations.push({
        category: 'colors',
        priority: 'high',
        recommendation:
          'Strengthen color palette consistency across all creatives',
        reasoning:
          'Current color usage shows variability that may dilute brand recognition',
        expectedImpact: 15,
      })
    }

    // Typography recommendations
    if (visualStyle.typography.personality === 'mixed') {
      recommendations.push({
        category: 'typography',
        priority: 'medium',
        recommendation: 'Establish a consistent typography hierarchy',
        reasoning: 'Mixed font personalities can create brand confusion',
        expectedImpact: 10,
      })
    }

    // Content recommendations
    if (contentStyle.tone.confidence < 70) {
      recommendations.push({
        category: 'messaging',
        priority: 'high',
        recommendation: 'Develop a more consistent brand voice',
        reasoning: 'Inconsistent tone affects brand perception and engagement',
        expectedImpact: 20,
      })
    }

    // Performance-based recommendations
    if (performance.averageCtr < 0.02) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        recommendation:
          'Optimize headline and visual combinations for better CTR',
        reasoning: 'Current CTR is below industry averages',
        expectedImpact: 25,
      })
    }

    return recommendations
  }

  /**
   * Suggest relevant templates based on learned style
   */
  private async suggestTemplates(
    visualStyle: any,
    contentStyle: any
  ): Promise<CreativeTemplate[]> {
    // This would match against a template database
    // For now, returning mock suggestions

    const templates: CreativeTemplate[] = [
      {
        id: 'template-modern-minimal',
        name: 'Modern Minimal',
        category: 'generic',
        description: 'Clean, minimalist template perfect for modern brands',
        tags: ['minimal', 'clean', 'modern', 'professional'],
        configuration: {
          objectives: ['awareness', 'consideration'],
          funnelStages: ['top', 'middle'],
          platforms: ['instagram', 'facebook', 'linkedin'],
          industries: ['saas', 'technology', 'professional-services'],
        },
        slots: {
          headline: {
            template: '{brand}: {keyMessage}',
            maxLength: 50,
            variations: ['{keyMessage} by {brand}', 'Discover {keyMessage}'],
            placeholders: [
              {
                name: 'brand',
                type: 'brand',
                description: 'Brand name',
                required: true,
              },
              {
                name: 'keyMessage',
                type: 'text',
                description: 'Key value proposition',
                required: true,
              },
            ],
          },
          body: {
            template: '{painpoint}?\n\n{solution}\n\n{cta}',
            maxLength: 300,
            variations: [],
            paragraphs: 3,
            placeholders: [
              {
                name: 'painpoint',
                type: 'painpoint',
                description: 'Customer pain point',
                required: true,
              },
              {
                name: 'solution',
                type: 'text',
                description: 'Your solution',
                required: true,
              },
              {
                name: 'cta',
                type: 'text',
                description: 'Call to action',
                required: true,
              },
            ],
          },
          cta: {
            template: 'Learn More',
            maxLength: 25,
            variations: ['Get Started', 'Discover More'],
            urgencyOptions: ['Limited Time', 'Today Only', 'Now'],
          },
        },
        platformAdaptations: {
          instagram: {
            adjustments: { body: 'Keep first line engaging' },
            characterLimits: { headline: 30, body: 125, cta: 20 },
            bestPractices: [
              'Use emojis strategically',
              'Include relevant hashtags',
            ],
          },
          facebook: {
            adjustments: {},
            characterLimits: { headline: 50, body: 300, cta: 25 },
            bestPractices: [
              'Use link preview effectively',
              'Include social proof',
            ],
          },
          linkedin: {
            adjustments: { tone: 'Professional' },
            characterLimits: { headline: 60, body: 500, cta: 30 },
            bestPractices: ['Lead with insights', 'Use professional tone'],
          },
        },
        styleGuidelines: {
          visual: {
            colorUsage: 'limited',
            imageryStyle: ['professional', 'clean'],
            layoutRequirements: ['minimal', 'white-space'],
          },
          tone: ['professional', 'confident'],
          forbiddenWords: ['amazing', 'incredible'],
          requiredElements: ['brand logo', 'clear cta'],
        },
        performance: {
          usageCount: 0,
          averagePerformance: {
            ctr: 0.028,
            engagementRate: 0.042,
            conversionRate: 0.015,
          },
          bestPerformingVariations: {},
          industryBenchmarks: {
            ctr: 0.025,
            engagementRate: 0.04,
            conversionRate: 0.012,
          },
        },
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          isPublic: true,
          rating: 4.5,
          reviews: [],
        },
      },
    ]

    return templates
  }

  /**
   * Build visual style analysis prompt
   */
  private buildVisualStylePrompt(learningData: any): string {
    return `
Analyze the visual style patterns from the following brand materials:

REFERENCE CREATIVES: ${JSON.stringify(learningData.referenceCreatives.slice(0, 3), null, 2)}
CAMPAIGNS: ${JSON.stringify(learningData.campaigns.slice(0, 2), null, 2)}

Extract and analyze:
1. Color Palette (primary, secondary, accent colors with confidence scores)
2. Typography patterns (headline/body fonts with usage frequency)
3. Composition preferences (layouts, spacing, hierarchy)
4. Imagery style (photography, illustration, filters)
5. Visual personality (modern, classic, playful, minimal, bold)

Respond with JSON structure:
{
  "colorPalette": {
    "primary": ["#color1", "#color2"],
    "secondary": ["#color3", "#color4"],
    "accent": ["#color5"],
    "confidence": 85
  },
  "typography": {
    "headlineFonts": [{"family": "Font Name", "weight": 700, "usage": 60, "confidence": 90}],
    "bodyFonts": [{"family": "Font Name", "weight": 400, "usage": 80, "confidence": 85}],
    "personality": "modern"
  },
  "composition": {
    "layouts": [{"type": "centered", "usage": 40, "confidence": 75}],
    "spacing": {"tight": 20, "normal": 60, "loose": 20},
    "visualHierarchy": "strong"
  },
  "imagery": {
    "photographyStyle": "professional",
    "illustrationStyle": "minimal",
    "filterPatterns": [{"type": "brightness", "intensity": 1.2, "frequency": 30}]
  }
}
`
  }

  /**
   * Build content style analysis prompt
   */
  private buildContentStylePrompt(learningData: any): string {
    return `
Analyze the content style and messaging patterns from the following materials:

BRAND BRIEFS: ${JSON.stringify(learningData.campaigns.map((c: any) => c.brief).filter(Boolean), null, 2)}
CAMPAIGN DATA: ${JSON.stringify(learningData.campaigns.slice(0, 2), null, 2)}

Extract and analyze:
1. Brand tone and voice (primary/secondary tones with confidence)
2. Language patterns (complexity, formality, sentiment)
3. Messaging strategies (value propositions, CTAs, emotional appeals)
4. Hashtag usage patterns
5. Content effectiveness indicators

Respond with JSON structure:
{
  "tone": {
    "primary": ["professional", "confident"],
    "secondary": ["friendly", "approachable"],
    "confidence": 80
  },
  "language": {
    "complexity": "moderate",
    "formality": "professional",
    "sentiment": "positive"
  },
  "messaging": {
    "valuePropositions": [{"statement": "Quality results", "frequency": 45, "effectiveness": 8}],
    "callToActions": [{"text": "Learn More", "conversionRate": 0.025, "usage": 60}],
    "emotionalAppeals": [{"type": "trust", "effectiveness": 7.5, "usage": 35}]
  },
  "hashtags": {
    "brandHashtags": ["#brandname"],
    "campaignHashtags": ["#campaign2024"],
    "industryHashtags": ["#industry"],
    "effectiveness": {"#brandname": 0.8}
  }
}
`
  }

  /**
   * Parse visual style AI response
   */
  private parseVisualStyle(response: string, learningData: any) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in visual style response')
      }

      const visualData = JSON.parse(jsonMatch[0])
      return visualData
    } catch (error) {
      log.error({ err: error }, 'Error parsing visual style')
      // Return default structure
      return {
        colorPalette: {
          primary: ['#000000'],
          secondary: ['#666666'],
          accent: ['#0066cc'],
          neutrals: ['#f5f5f5'],
          confidence: 50,
        },
        typography: {
          headlineFonts: [
            { family: 'Arial', weight: 700, usage: 50, confidence: 50 },
          ],
          bodyFonts: [
            { family: 'Arial', weight: 400, usage: 50, confidence: 50 },
          ],
          personality: 'modern',
        },
        composition: {
          layouts: [
            {
              type: 'centered',
              usage: 50,
              platforms: ['instagram'],
              confidence: 50,
            },
          ],
          spacing: { tight: 30, normal: 40, loose: 30 },
          visualHierarchy: 'moderate',
        },
        imagery: {
          photographyStyle: 'professional',
          illustrationStyle: null,
          filterPatterns: [],
        },
      }
    }
  }

  /**
   * Parse content style AI response
   */
  private parseContentStyle(response: string, learningData: any) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in content style response')
      }

      const contentData = JSON.parse(jsonMatch[0])
      return contentData
    } catch (error) {
      log.error({ err: error }, 'Error parsing content style')
      // Return default structure
      return {
        tone: {
          primary: ['professional'],
          secondary: ['friendly'],
          confidence: 50,
        },
        language: {
          complexity: 'moderate',
          formality: 'professional',
          sentiment: 'positive',
        },
        messaging: {
          valuePropositions: [],
          callToActions: [],
          emotionalAppeals: [],
        },
        hashtags: {
          brandHashtags: [],
          campaignHashtags: [],
          industryHashtags: [],
          effectiveness: {},
        },
      }
    }
  }

  // Helper methods for calculations
  private getNextVersion(brandKitId: string): number {
    // In production, would check existing versions
    return 1
  }

  private calculateAccuracy(visualStyle: any, contentStyle: any): number {
    return (
      (visualStyle.colorPalette.confidence + contentStyle.tone.confidence) / 2
    )
  }

  private calculateConfidence(learningData: any): number {
    if (learningData.totalSamples < LEARNING_CONFIG.minSampleSize) {
      return 50
    }
    return Math.min(95, 60 + (learningData.totalSamples / 100) * 10)
  }

  private calculateVisualConsistency(visualStyle: any): number {
    return visualStyle.colorPalette.confidence
  }

  private calculateBrandVoiceStrength(contentStyle: any): number {
    return contentStyle.tone.confidence
  }

  private calculateCompetitiveDifferentiation(
    visualStyle: any,
    contentStyle: any
  ): number {
    // Would analyze against competitor data
    return 75
  }

  private predictCTR(
    visualStyle: any,
    contentStyle: any,
    performance: any
  ): number {
    const baseCtr = performance.averageCtr
    const visualBoost = visualStyle.colorPalette.confidence > 80 ? 1.1 : 1.0
    const contentBoost = contentStyle.tone.confidence > 80 ? 1.1 : 1.0
    return baseCtr * visualBoost * contentBoost
  }

  private predictEngagementRate(
    visualStyle: any,
    contentStyle: any,
    performance: any
  ): number {
    return (
      performance.averageEngagementRate * (contentStyle.tone.confidence / 100)
    )
  }

  private predictConversionRate(
    visualStyle: any,
    contentStyle: any,
    performance: any
  ): number {
    const baseRate = performance.averageConversionRate
    const ctaBoost =
      contentStyle.messaging.callToActions.length > 0 ? 1.15 : 1.0
    return baseRate * ctaBoost
  }

  private analyzeTopPerformers(learningData: any) {
    // Mock analysis - would use actual performance data
    return [
      {
        type: 'color' as const,
        element: '#0066cc',
        performance: 8.5,
        confidence: 85,
      },
    ]
  }

  private identifyUnderperformers(learningData: any) {
    // Mock analysis - would use actual performance data
    return [
      {
        type: 'messaging' as const,
        element: 'Generic CTA',
        performance: 3.2,
        recommendations: [
          'Use more specific action language',
          'Add urgency elements',
        ],
      },
    ]
  }
}
