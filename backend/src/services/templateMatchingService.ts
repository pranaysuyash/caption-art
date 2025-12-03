import OpenAI from 'openai'
import {
  StyleProfile,
  CreativeTemplate,
  TemplateMatchingRequest,
  TemplateMatchingResult,
  INDUSTRY_TEMPLATES,
  LEARNING_CONFIG,
} from '../types/styleMemory'
import { AuthModel, Campaign, BrandKit } from '../models/auth'
import { log } from '../middleware/logger'

export class TemplateMatchingService {
  private openai: OpenAI
  private templateDatabase: Map<string, CreativeTemplate> = new Map()

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.initializeTemplateDatabase()
  }

  /**
   * Initialize template database with built-in templates
   */
  private async initializeTemplateDatabase() {
    // Add built-in templates
    const builtinTemplates = this.getBuiltinTemplates()
    builtinTemplates.forEach((template) => {
      this.templateDatabase.set(template.id, template)
    })
  }

  /**
   * Find best matching templates for a campaign
   */
  async findMatchingTemplates(
    request: TemplateMatchingRequest
  ): Promise<TemplateMatchingResult> {
    try {
      log.info(
        { styleProfileId: request.styleProfileId },
        `Finding templates for style profile`
      )

      // Get style profile
      const styleProfile = await this.getStyleProfile(request.styleProfileId)
      if (!styleProfile) {
        throw new Error('Style profile not found')
      }

      // Get all eligible templates
      const eligibleTemplates = this.getEligibleTemplates(request)

      // Score each template
      const scoredTemplates = await this.scoreTemplates(
        eligibleTemplates,
        styleProfile,
        request
      )

      // Sort by compatibility score
      const matches = scoredTemplates
        .filter(
          (scored) =>
            scored.compatibilityScore >=
            LEARNING_CONFIG.templateMatching.minCompatibilityScore
        )
        .slice(0, LEARNING_CONFIG.templateMatching.maxResults)

      // Generate alternative suggestions
      const alternativeSuggestions = await this.generateAlternatives(
        matches,
        styleProfile,
        request
      )

      // Calculate style alignment metrics
      const styleAlignment = this.calculateStyleAlignment(
        matches[0],
        styleProfile,
        request
      )

      log.info(
        { count: matches.length, styleProfileId: request.styleProfileId },
        `Found matching templates`
      )

      return {
        matches,
        alternativeSuggestions,
        styleAlignment,
      }
    } catch (error) {
      log.error({ err: error }, 'Template matching error')
      throw new Error('Failed to match templates')
    }
  }

  /**
   * Score templates against style profile and campaign requirements
   */
  private async scoreTemplates(
    templates: CreativeTemplate[],
    styleProfile: StyleProfile,
    request: TemplateMatchingRequest
  ) {
    const scoredTemplates = []

    for (const template of templates) {
      const score = await this.calculateCompatibilityScore(
        template,
        styleProfile,
        request
      )
      const adaptations = await this.generateAdaptations(
        template,
        styleProfile,
        request
      )
      const reasoning = await this.generateReasoning(
        template,
        styleProfile,
        request,
        score
      )

      scoredTemplates.push({
        template,
        compatibilityScore: score,
        expectedPerformance: this.predictPerformance(
          template,
          styleProfile,
          request
        ),
        adaptations,
        reasoning,
      })
    }

    return scoredTemplates.sort(
      (a, b) => b.compatibilityScore - a.compatibilityScore
    )
  }

  /**
   * Calculate compatibility score between template and style profile
   */
  private async calculateCompatibilityScore(
    template: CreativeTemplate,
    styleProfile: StyleProfile,
    request: TemplateMatchingRequest
  ): Promise<number> {
    let score = 0

    // Objective alignment (25%)
    const objectiveMatch = template.configuration.objectives.includes(
      request.campaignBrief.objective as any
    )
    score += objectiveMatch ? 25 : 0

    // Funnel stage alignment (20%)
    const funnelMatch = template.configuration.funnelStages.includes(
      request.campaignBrief.funnelStage as any
    )
    score += funnelMatch ? 20 : 0

    // Platform alignment (15%)
    const platformMatch = template.configuration.platforms.includes(
      request.platform as any
    )
    score += platformMatch ? 15 : 0

    // Style alignment (25%)
    const styleScore = await this.calculateStyleAlignmentScore(
      template,
      styleProfile
    )
    score += styleScore * 0.25

    // Industry alignment (15%)
    const industryMatch =
      template.configuration.industries.includes(
        request.campaignBrief.industry
      ) || template.configuration.industries.includes('generic')
    score += industryMatch ? 15 : 0

    return Math.min(100, score)
  }

  /**
   * Calculate style alignment score using AI
   */
  private async calculateStyleAlignmentScore(
    template: CreativeTemplate,
    styleProfile: StyleProfile
  ): Promise<number> {
    const prompt = this.buildStyleAlignmentPrompt(template, styleProfile)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            "You are an expert in brand consistency and template matching. Rate how well a template matches a brand's established style profile.",
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      return 50 // Default score
    }

    const scoreMatch = response.match(/(\d+)/)
    return scoreMatch ? parseInt(scoreMatch[1]) : 50
  }

  /**
   * Generate template adaptations based on style profile
   */
  private async generateAdaptations(
    template: CreativeTemplate,
    styleProfile: StyleProfile,
    request: TemplateMatchingRequest
  ) {
    const adaptations = []

    // Color adaptations
    if (styleProfile.visualStyle.colorPalette.confidence > 80) {
      adaptations.push({
        element: 'color',
        recommendation: `Use brand primary colors: ${styleProfile.visualStyle.colorPalette.primary.join(', ')}`,
        confidence: styleProfile.visualStyle.colorPalette.confidence,
      })
    }

    // Typography adaptations
    if (styleProfile.visualStyle.typography.headlineFonts.length > 0) {
      const primaryFont = styleProfile.visualStyle.typography.headlineFonts[0]
      adaptations.push({
        element: 'typography',
        recommendation: `Use ${primaryFont.family} for headlines`,
        confidence: primaryFont.confidence,
      })
    }

    // Tone adaptations
    if (styleProfile.contentStyle.tone.primary.length > 0) {
      adaptations.push({
        element: 'tone',
        recommendation: `Maintain ${styleProfile.contentStyle.tone.primary.join(', ')} tone`,
        confidence: styleProfile.contentStyle.tone.confidence,
      })
    }

    // Platform-specific adaptations
    const platformAdaptations =
      template.platformAdaptations[
        request.platform as keyof typeof template.platformAdaptations
      ]
    if (platformAdaptations) {
      adaptations.push({
        element: 'platform',
        recommendation: `Follow ${request.platform} best practices: ${platformAdaptations.bestPractices.slice(0, 2).join(', ')}`,
        confidence: 90,
      })
    }

    return adaptations
  }

  /**
   * Generate reasoning for template recommendation
   */
  private async generateReasoning(
    template: CreativeTemplate,
    styleProfile: StyleProfile,
    request: TemplateMatchingRequest,
    score: number
  ): Promise<string> {
    return `This template matches ${score.toFixed(1)}% with your brand style. Key alignments: ${template.configuration.objectives.join(', ')} objectives, ${template.configuration.funnelStages.join(', ')} funnel stages, and compatible visual style for ${request.platform}.`
  }

  /**
   * Predict template performance
   */
  private predictPerformance(
    template: CreativeTemplate,
    styleProfile: StyleProfile,
    request: TemplateMatchingRequest
  ) {
    const basePerformance = template.performance.averagePerformance

    // Adjust based on style alignment
    const styleMultiplier = styleProfile.learning.confidence / 100

    // Adjust based on historical template performance
    const templateMultiplier =
      template.performance.averagePerformance.ctr / 0.025 // Industry average

    return {
      ctr: basePerformance.ctr * styleMultiplier * templateMultiplier,
      engagementRate: basePerformance.engagementRate * styleMultiplier,
      conversionRate: basePerformance.conversionRate * styleMultiplier,
    }
  }

  /**
   * Calculate detailed style alignment metrics
   */
  private calculateStyleAlignment(
    match: any,
    styleProfile: StyleProfile,
    request: TemplateMatchingRequest
  ) {
    return {
      visualAlignment: styleProfile.visualStyle.colorPalette.confidence,
      toneAlignment: styleProfile.contentStyle.tone.confidence,
      audienceAlignment: 85, // Would calculate based on target audience matching
      platformAlignment: match.template.configuration.platforms.includes(
        request.platform as any
      )
        ? 90
        : 50,
    }
  }

  /**
   * Generate alternative template suggestions
   */
  private async generateAlternatives(
    matches: any[],
    styleProfile: StyleProfile,
    request: TemplateMatchingRequest
  ) {
    const alternatives = []

    // If top match is category-specific, suggest generic alternatives
    if (matches.length > 0 && matches[0].template.category !== 'generic') {
      const genericTemplates = Array.from(this.templateDatabase.values())
        .filter((t) => t.category === 'generic')
        .slice(0, 2)

      for (const template of genericTemplates) {
        alternatives.push({
          template,
          reason: 'Generic template that can be customized to your brand style',
        })
      }
    }

    // Suggest templates from adjacent industries
    const adjacentIndustry = this.getAdjacentIndustry(
      request.campaignBrief.industry
    )
    if (adjacentIndustry) {
      const adjacentTemplates = Array.from(this.templateDatabase.values())
        .filter((t) => t.configuration.industries.includes(adjacentIndustry))
        .slice(0, 1)

      for (const template of adjacentTemplates) {
        alternatives.push({
          template,
          reason: `Successful template from ${adjacentIndustry} industry that can be adapted`,
        })
      }
    }

    return alternatives
  }

  /**
   * Get eligible templates based on campaign requirements
   */
  private getEligibleTemplates(
    request: TemplateMatchingRequest
  ): CreativeTemplate[] {
    let templates = Array.from(this.templateDatabase.values())

    // Filter by preferences
    if (request.preferences.templates?.length > 0) {
      templates = templates.filter((t) =>
        request.preferences.templates!.includes(t.id)
      )
    }

    if (request.preferences.excludeCategories?.length > 0) {
      templates = templates.filter(
        (t) => !request.preferences.excludeCategories!.includes(t.category)
      )
    }

    if (request.preferences.minPerformance) {
      templates = templates.filter(
        (t) =>
          t.performance.averagePerformance.ctr >=
          request.preferences.minPerformance!
      )
    }

    return templates
  }

  /**
   * Get style profile by ID (mock implementation)
   */
  private async getStyleProfile(
    profileId: string
  ): Promise<StyleProfile | null> {
    // In production, would fetch from database
    // For now, returning null to indicate no profile found
    return null
  }

  /**
   * Get built-in templates
   */
  private getBuiltinTemplates(): CreativeTemplate[] {
    return [
      {
        id: 'template-ecommerce-urgent',
        name: 'Ecommerce Urgency',
        category: 'ecommerce',
        description:
          'High-conversion template with urgency elements for ecommerce',
        tags: ['ecommerce', 'urgency', 'conversion', 'scarcity'],
        configuration: {
          objectives: ['conversion'],
          funnelStages: ['bottom'],
          platforms: ['instagram', 'facebook'],
          industries: ['ecommerce', 'retail'],
        },
        slots: {
          headline: {
            template: '⚡ {offer} - Only {time} Left!',
            maxLength: 50,
            variations: ['Last Chance: {offer}', '{offer} Ends {time}'],
            placeholders: [
              {
                name: 'offer',
                type: 'offer',
                description: 'Special offer details',
                required: true,
              },
              {
                name: 'time',
                type: 'text',
                description: 'Time limit',
                required: true,
              },
            ],
          },
          body: {
            template:
              "🔥 {productBenefits}\n\n⏰ Limited stock available\n\n👇 Shop now before it's gone!",
            maxLength: 300,
            variations: [],
            paragraphs: 3,
            placeholders: [
              {
                name: 'productBenefits',
                type: 'text',
                description: 'Key product benefits',
                required: true,
              },
            ],
          },
          cta: {
            template: 'Shop Now',
            maxLength: 20,
            variations: ['Buy Now', 'Get Yours'],
            urgencyOptions: [
              'Limited Time',
              'Today Only',
              'Now',
              'While Stocks Last',
            ],
          },
        },
        platformAdaptations: {
          instagram: {
            adjustments: {
              emojis: 'Use fire, clock, and arrow emojis strategically',
            },
            characterLimits: { headline: 30, body: 125, cta: 20 },
            bestPractices: [
              'Lead with urgency',
              'Use countdown stickers',
              'Tag relevant accounts',
            ],
          },
          facebook: {
            adjustments: {},
            characterLimits: { headline: 50, body: 300, cta: 25 },
            bestPractices: [
              'Use scarcity indicators',
              'Include social proof',
              'Clear urgency',
            ],
          },
          linkedin: {
            adjustments: { tone: 'Professional urgency' },
            characterLimits: { headline: 60, body: 500, cta: 30 },
            bestPractices: [
              'B2B urgency approach',
              'Professional benefits focus',
            ],
          },
        },
        styleGuidelines: {
          visual: {
            colorUsage: 'full',
            imageryStyle: ['product-focused', 'lifestyle'],
            layoutRequirements: ['clear cta', 'urgency indicators'],
          },
          tone: ['urgent', 'exciting', 'persuasive'],
          forbiddenWords: [],
          requiredElements: ['urgency indicator', 'clear cta', 'offer details'],
        },
        performance: {
          usageCount: 0,
          averagePerformance: {
            ctr: 0.035,
            engagementRate: 0.055,
            conversionRate: 0.028,
          },
          bestPerformingVariations: {},
          industryBenchmarks: {
            ctr: 0.03,
            engagementRate: 0.045,
            conversionRate: 0.02,
          },
        },
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          isPublic: true,
          rating: 4.2,
          reviews: [],
        },
      },
      {
        id: 'template-saas-demo',
        name: 'SaaS Demo Request',
        category: 'saas',
        description:
          'Professional template optimized for SaaS demo and trial requests',
        tags: ['saas', 'demo', 'trial', 'b2b', 'professional'],
        configuration: {
          objectives: ['consideration', 'conversion'],
          funnelStages: ['middle', 'bottom'],
          platforms: ['linkedin', 'facebook'],
          industries: ['saas', 'technology', 'software'],
        },
        slots: {
          headline: {
            template: 'See How {brand} Solves {problem}',
            maxLength: 60,
            variations: [
              'Transform Your {process} with {brand}',
              '{solution} for {industry}',
            ],
            placeholders: [
              {
                name: 'brand',
                type: 'brand',
                description: 'Your brand name',
                required: true,
              },
              {
                name: 'problem',
                type: 'painpoint',
                description: 'Problem you solve',
                required: true,
              },
              {
                name: 'process',
                type: 'text',
                description: 'Business process',
                required: true,
              },
              {
                name: 'solution',
                type: 'text',
                description: 'Your solution',
                required: true,
              },
              {
                name: 'industry',
                type: 'text',
                description: 'Target industry',
                required: true,
              },
            ],
          },
          subheadline: {
            template: '{keyBenefit} in just {timeframe}',
            maxLength: 40,
            variations: [
              '{result} Guaranteed',
              'Trusted by {number}+ {companies}',
            ],
            placeholders: [
              {
                name: 'keyBenefit',
                type: 'text',
                description: 'Main benefit',
                required: true,
              },
              {
                name: 'timeframe',
                type: 'text',
                description: 'Time to see results',
                required: true,
              },
              {
                name: 'result',
                type: 'text',
                description: 'Guaranteed result',
                required: true,
              },
              {
                name: 'number',
                type: 'text',
                description: 'Customer count',
                required: true,
              },
              {
                name: 'companies',
                type: 'text',
                description: 'Customer type',
                required: true,
              },
            ],
          },
          body: {
            template:
              '{painpoint}?\n\n✅ {solution1}\n✅ {solution2}\n✅ {solution3}\n\n📅 Book your free {demoLength} demo today!',
            maxLength: 500,
            variations: [],
            paragraphs: 4,
            placeholders: [
              {
                name: 'painpoint',
                type: 'painpoint',
                description: 'Customer pain point',
                required: true,
              },
              {
                name: 'solution1',
                type: 'text',
                description: 'Solution point 1',
                required: true,
              },
              {
                name: 'solution2',
                type: 'text',
                description: 'Solution point 2',
                required: true,
              },
              {
                name: 'solution3',
                type: 'text',
                description: 'Solution point 3',
                required: true,
              },
              {
                name: 'demoLength',
                type: 'text',
                description: 'Demo duration',
                required: true,
              },
            ],
          },
          cta: {
            template: 'Book Free Demo',
            maxLength: 30,
            variations: ['Start Free Trial', 'Get Started'],
            urgencyOptions: ['Limited Spots', 'This Week', 'Today'],
          },
          primaryText: {
            template: '{extendedPitch}\n\n#SaaS #B2B #Software #{industry}',
            maxLength: 1300,
            hashtags: ['#SaaS', '#B2B', '#Software'],
            mentions: [],
          },
        },
        platformAdaptations: {
          instagram: {
            adjustments: { focus: 'Mobile-friendly demo booking' },
            characterLimits: {
              headline: 30,
              body: 125,
              cta: 20,
              primaryText: 2200,
            },
            bestPractices: [
              'Use checkmarks for benefits',
              'Clear demo CTA',
              'Professional emojis',
            ],
          },
          facebook: {
            adjustments: {},
            characterLimits: {
              headline: 50,
              body: 300,
              cta: 25,
              primaryText: 50000,
            },
            bestPractices: [
              'Use carousels for features',
              'Include customer logos',
              'Demo video integration',
            ],
          },
          linkedin: {
            adjustments: {
              tone: 'Professional B2B',
              addSocialProof: 'Include social proof elements',
            },
            characterLimits: {
              headline: 60,
              body: 500,
              cta: 30,
              primaryText: 1300,
            },
            bestPractices: [
              'Tag decision makers',
              'Include ROI stats',
              'Professional success metrics',
            ],
          },
        },
        styleGuidelines: {
          visual: {
            colorUsage: 'limited',
            imageryStyle: ['professional', 'technology', 'screenshots'],
            layoutRequirements: [
              'clear value proposition',
              'trust indicators',
              'demo CTA',
            ],
          },
          tone: ['professional', 'confident', 'value-focused'],
          forbiddenWords: ['cheap', 'free', 'discount'],
          requiredElements: [
            'social proof',
            'clear benefits',
            'professional branding',
          ],
        },
        performance: {
          usageCount: 0,
          averagePerformance: {
            ctr: 0.028,
            engagementRate: 0.042,
            conversionRate: 0.018,
          },
          bestPerformingVariations: {},
          industryBenchmarks: {
            ctr: 0.025,
            engagementRate: 0.04,
            conversionRate: 0.015,
          },
        },
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          isPublic: true,
          rating: 4.6,
          reviews: [],
        },
      },
    ]
  }

  /**
   * Get adjacent industry for template suggestions
   */
  private getAdjacentIndustry(industry: string): string | null {
    const adjacencyMap: Record<string, string[]> = {
      ecommerce: ['retail', 'fashion', 'consumer-goods'],
      saas: ['technology', 'software', 'b2b'],
      healthcare: ['wellness', 'medical', 'fitness'],
      finance: ['banking', 'insurance', 'investment'],
      education: ['training', 'learning', 'development'],
    }

    for (const [key, values] of Object.entries(adjacencyMap)) {
      if (values.includes(industry)) {
        return key
      }
    }

    return null
  }

  /**
   * Build style alignment prompt for AI
   */
  private buildStyleAlignmentPrompt(
    template: CreativeTemplate,
    styleProfile: StyleProfile
  ): string {
    return `
Rate how well this template matches the brand style profile on a scale of 0-100.

TEMPLATE: ${template.name}
Category: ${template.category}
Objectives: ${template.configuration.objectives.join(', ')}
Style Guidelines: ${template.styleGuidelines.tone.join(', ')}

BRAND STYLE PROFILE:
Visual Personality: ${styleProfile.visualStyle.typography.personality}
Primary Tone: ${styleProfile.contentStyle.tone.primary.join(', ')}
Color Confidence: ${styleProfile.visualStyle.colorPalette.confidence}%

Consider:
1. Tone compatibility
2. Visual style alignment
3. Industry appropriateness
4. Platform suitability

Respond with just the score (0-100).
`
  }
}
