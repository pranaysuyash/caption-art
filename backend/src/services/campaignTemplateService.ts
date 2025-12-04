import OpenAI from 'openai'
import {
  CampaignTemplate,
  Campaign,
  BrandKit,
  Asset,
  StyleReference,
} from '../models/auth'
import { log } from '../middleware/logger'

export interface CampaignTemplateGenerationRequest {
  workspaceId: string
  name: string
  description: string
  industry: string
  campaignType:
    | 'product-launch'
    | 'brand-awareness'
    | 'lead-generation'
    | 'event-promotion'
    | 'sale'
    | 'content-series'
  targetAudience: {
    demographics: {
      ageRange: string
      gender: string
      location: string
      income: string
      segments?: string[]
      lifestage?: string[]
    }
    interests: string[]
    psychographics?: string[]
    behaviors?: string[]
    painPoints: string[]
    motivations?: string[]
    mediaTouchpoints?: string[]
    postingFrequency?: {
      platform: string
      cadence: string
      rationale?: string
    }[]
    brandVoice?: {
      tone?: string[]
      personality?: string[]
      dos?: string[]
      donts?: string[]
      vocabulary?: string[]
    }
    buyerJourneyStages?: string[]
  }
  platforms: (
    | 'instagram'
    | 'facebook'
    | 'linkedin'
    | 'tiktok'
    | 'youtube'
    | 'twitter'
  )[]
  brandKitId?: string
  styleReferenceIds?: string[]
  customRequirements?: string[]
}

export interface CampaignTemplateGenerationResult {
  id: string
  request: CampaignTemplateGenerationRequest
  template: CampaignTemplate
  appliedGuidelines: {
    messaging: string[]
    visualStyle: string[]
    contentStrategy: string[]
    platformOptimizations: { [platform: string]: string[] }
  }
  recommendations: string[]
  qualityMetrics: {
    completeness: number
    brandAlignment: number
    platformOptimization: number
    overallScore: number
  }
  processingTime: number
  createdAt: Date
}

export interface TemplateApplicationResult {
  id: string
  templateId: string
  campaign: Campaign
  adaptations: {
    platform: string
    modifications: string[]
    localizedContent: string[]
  }[]
  performance: {
    expectedEngagement: number
    expectedReach: number
    expectedConversions: number
  }
  appliedAt: Date
}

export class CampaignTemplateService {
  private openai: OpenAI
  private templates = new Map<string, CampaignTemplate>()

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Generate a campaign template based on requirements
   */
  async generateCampaignTemplate(
    request: CampaignTemplateGenerationRequest,
    brandKit?: BrandKit,
    styleReferences?: StyleReference[]
  ): Promise<CampaignTemplateGenerationResult> {
    try {
      log.info(
        {
          workspaceId: request.workspaceId,
          campaignType: request.campaignType,
          industry: request.industry,
          platforms: request.platforms,
        },
        'Generating campaign template'
      )

      const startTime = Date.now()

      // Generate comprehensive template structure
      const template = await this.buildCampaignTemplate(
        request,
        brandKit,
        styleReferences
      )

      // Generate platform-specific guidelines
      const appliedGuidelines = await this.generatePlatformGuidelines(
        request,
        template
      )

      // Generate quality recommendations
      const recommendations = this.generateTemplateRecommendations(
        request,
        template,
        brandKit
      )

      // Calculate quality metrics
      const qualityMetrics = this.calculateTemplateQuality(
        template,
        brandKit,
        styleReferences
      )

      const processingTime = Date.now() - startTime

      const result: CampaignTemplateGenerationResult = {
        id: `campaign-template-${Date.now()}`,
        request,
        template,
        appliedGuidelines,
        recommendations,
        qualityMetrics,
        processingTime,
        createdAt: new Date(),
      }

      // Store template
      this.templates.set(template.id, template)

      log.info(
        {
          templateId: template.id,
          qualityScore: qualityMetrics.overallScore,
          processingTime,
          workspaceId: request.workspaceId,
        },
        'Campaign template generated successfully'
      )

      return result
    } catch (error) {
      log.error(
        { err: error, workspaceId: request.workspaceId },
        'Campaign template generation failed'
      )
      throw new Error(
        `Failed to generate campaign template: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Apply a template to create a new campaign
   */
  async applyTemplate(
    templateId: string,
    campaignName: string,
    specificRequirements: string[],
    workspaceId: string,
    platforms?: string[]
  ): Promise<TemplateApplicationResult> {
    try {
      const template = this.templates.get(templateId)
      if (!template) {
        throw new Error('Campaign template not found')
      }

      log.info(
        { templateId, campaignName, workspaceId },
        'Applying campaign template'
      )

      // Generate campaign from template
      const campaign = await this.createCampaignFromTemplate(
        template,
        campaignName,
        specificRequirements
      )

      // Generate platform-specific adaptations
      const adaptations = await this.generatePlatformAdaptations(
        template,
        platforms || template.targetPlatforms
      )

      // Generate performance predictions
      const performance = await this.predictCampaignPerformance(
        campaign,
        adaptations
      )

      const result: TemplateApplicationResult = {
        id: `template-application-${Date.now()}`,
        templateId,
        campaign,
        adaptations,
        performance,
        appliedAt: new Date(),
      }

      log.info(
        {
          applicationId: result.id,
          campaignId: campaign.id,
          expectedEngagement: performance.expectedEngagement,
        },
        'Campaign template applied successfully'
      )

      return result
    } catch (error) {
      log.error({ err: error, templateId }, 'Template application failed')
      throw new Error(
        `Failed to apply campaign template: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get available campaign templates by category
   */
  getTemplatesByCategory(
    category: string,
    workspaceId: string
  ): CampaignTemplate[] {
    return Array.from(this.templates.values()).filter(
      (template) =>
        template.category === category &&
        template.workspaceId === workspaceId &&
        template.isActive
    )
  }

  /**
   * Search templates by keywords
   */
  searchTemplates(
    query: string,
    workspaceId: string,
    limit = 10
  ): CampaignTemplate[] {
    const allTemplates = Array.from(this.templates.values()).filter(
      (template) => template.workspaceId === workspaceId && template.isActive
    )

    const queryLower = query.toLowerCase()

    return allTemplates
      .filter(
        (template) =>
          template.name.toLowerCase().includes(queryLower) ||
          template.description.toLowerCase().includes(queryLower) ||
          template.industry.toLowerCase().includes(queryLower) ||
          template.tags.some((tag) => tag.toLowerCase().includes(queryLower))
      )
      .slice(0, limit)
  }

  /**
   * Build comprehensive campaign template
   */
  private async buildCampaignTemplate(
    request: CampaignTemplateGenerationRequest,
    brandKit?: BrandKit,
    styleReferences?: StyleReference[]
  ): Promise<CampaignTemplate> {
    const template: CampaignTemplate = {
      id: `template-${Date.now()}`,
      name: request.name,
      description: request.description,
      workspaceId: request.workspaceId,
      category: request.campaignType,
      industry: request.industry,
      targetAudience: request.targetAudience,
      targetPlatforms: request.platforms,
      contentStructure: {
        phases: {
          hook: 'Attention-grabbing opening',
          body: 'Main content and value proposition',
          cta: 'Clear call-to-action',
        },
        contentTypes: this.generateContentTypes(
          request.campaignType,
          request.platforms
        ),
      },
      messagingGuidelines: await this.generateMessagingGuidelines(
        request,
        brandKit
      ),
      visualGuidelines: await this.generateVisualGuidelines(
        request,
        brandKit,
        styleReferences
      ),
      platformOptimizations:
        await this.generatePlatformOptimizationsStructured(request),
      successMetrics: await this.generateSuccessMetrics(request),
      tags: this.generateTemplateTags(request),
      isActive: true,
      templateStructure: {
        contentTypes: this.generateContentTypes(
          request.campaignType,
          request.platforms
        ) as ('image' | 'carousel' | 'story' | 'video')[],
        captionPatterns: {
          hook: ['Attention-grabbing opening line'],
          body: ['Main content with value proposition'],
          cta: ['Clear call-to-action'],
          hashtags: ['Relevant hashtags for platform'],
        },
        visualStyle: {
          colorStrategy: 'brand-colors',
          layoutPattern: 'grid',
          textTreatment: 'bold-headlines',
        },
        suggestedAssets: {
          types: ['product', 'lifestyle'],
          layouts: ['product-focused', 'lifestyle-integrated'],
        },
      },
      placeholderVariables: {
        productName: {
          type: 'text',
          description: 'Name of the product or service',
          example: 'Premium Coffee Beans',
          required: true,
        },
        targetAudience: {
          type: 'text',
          description: 'Description of target audience',
          example: 'Coffee enthusiasts aged 25-45',
          required: false,
        },
      },
      usageStats: {
        timesUsed: 0,
        successRate: 0,
        avgEngagement: 0,
      },
      isPremium: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return template
  }

  /**
   * Generate AI-powered content structure for the template
   */
  private async generateContentStructure(
    request: CampaignTemplateGenerationRequest,
    brandKit?: BrandKit
  ): Promise<CampaignTemplate['contentStructure']> {
    try {
      const aiStructure = await this.generateAIContentStructure(
        request,
        brandKit
      )
      if (aiStructure) {
        return aiStructure
      }
    } catch (error) {
      log.warn(
        { err: error },
        'AI content structure generation failed, using fallback'
      )
    }

    // Fallback to basic structure with proper interface format
    return {
      phases: {
        hook: 'Attention-grabbing opening to capture interest',
        body: 'Main content delivering value proposition and benefits',
        cta: 'Clear call-to-action driving desired behavior',
      },
      contentTypes: this.generateContentTypes(
        request.campaignType,
        request.platforms
      ),
    }
  }

  /**
   * Generate content structure using AI
   */
  private async generateAIContentStructure(
    request: CampaignTemplateGenerationRequest,
    brandKit?: BrandKit
  ): Promise<CampaignTemplate['contentStructure'] | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    const prompt = `Generate a comprehensive campaign content structure for the following requirements:

CAMPAIGN DETAILS:
- Type: ${request.campaignType}
- Industry: ${request.industry}
- Platforms: ${request.platforms.join(', ')}
- Target Audience: ${JSON.stringify(request.targetAudience, null, 2)}

${
  brandKit
    ? `BRAND DETAILS:
- Values: ${brandKit.values?.join(', ') || 'Not specified'}
- Voice: ${brandKit.voicePrompt || 'Not specified'}
- Key Differentiators: ${brandKit.keyDifferentiators?.join(', ') || 'Not specified'}`
    : 'No brand kit provided'
}

Generate a detailed content structure with:
1. Campaign phases (hook, body, cta structure)
2. Content types by platform
3. Messaging hierarchy

Return JSON with:
{
  "phases": {
    "hook": "description of hook phase",
    "body": "description of body phase", 
    "cta": "description of cta phase"
  },
  "contentTypes": ["type1", "type2", ...]
}

Make it specific and actionable for the campaign type and target audience.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const aiStructure = JSON.parse(response.choices[0].message.content || '{}')
    return aiStructure
  }

  /**
   * Generate AI-powered messaging guidelines
   */
  private async generateMessagingGuidelines(
    request: CampaignTemplateGenerationRequest,
    brandKit?: BrandKit
  ): Promise<string[]> {
    try {
      const aiGuidelines = await this.generateAIMessagingGuidelines(
        request,
        brandKit
      )
      if (aiGuidelines && aiGuidelines.length > 0) {
        return aiGuidelines
      }
    } catch (error) {
      log.warn(
        { err: error },
        'AI messaging guidelines generation failed, using fallback'
      )
    }

    // Fallback to basic guidelines
    const guidelines = [
      `Focus on solving ${request.targetAudience.painPoints.join(', ')}`,
      `Use language that resonates with ${request.targetAudience.interests.join(', ')}`,
      `Highlight benefits relevant to ${request.targetAudience.interests.join(', ')}`,
      'Maintain consistent brand voice across all platforms',
      'Include clear calls-to-action in each message',
    ]

    // Add brand-specific elements if brand kit is available
    if (brandKit) {
      guidelines.push(
        `Incorporate brand values: ${brandKit.values?.join(', ') || 'professionalism and innovation'}`
      )
      guidelines.push(
        `Use brand tone: ${brandKit.toneOfVoice || 'professional and approachable'}`
      )
    }

    return guidelines
  }

  /**
   * Generate messaging guidelines using AI
   */
  private async generateAIMessagingGuidelines(
    request: CampaignTemplateGenerationRequest,
    brandKit?: BrandKit
  ): Promise<string[] | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    const prompt = `Generate comprehensive messaging guidelines for a marketing campaign:

CAMPAIGN DETAILS:
- Type: ${request.campaignType}
- Industry: ${request.industry}
- Description: ${request.description}
- Target Audience Pain Points: ${request.targetAudience.painPoints.join(', ')}
- Target Audience Interests: ${request.targetAudience.interests.join(', ')}

${
  brandKit
    ? `BRAND DETAILS:
- Values: ${brandKit.values?.join(', ') || 'Not specified'}
- Tone of Voice: ${brandKit.toneOfVoice || 'Not specified'}
- Key Differentiators: ${brandKit.keyDifferentiators?.join(', ') || 'Not specified'}`
    : 'No brand kit provided'
}

Generate 8-12 specific, actionable messaging guidelines that will:
1. Address the target audience's pain points
2. Use language that resonates with their interests and demographics
3. Highlight benefits relevant to their interests
4. Incorporate brand voice and values
5. Include specific call-to-action strategies
6. Address campaign type specific needs
7. Consider industry best practices
8. Provide platform-appropriate messaging strategies

Return as a JSON array of strings: ["guideline1", "guideline2", ...]

Make guidelines specific, actionable, and tailored to the campaign type and audience.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return Array.isArray(result) ? result : result.guidelines || null
  }

  /**
   * Generate AI-powered visual guidelines
   */
  private async generateVisualGuidelines(
    request: CampaignTemplateGenerationRequest,
    brandKit?: BrandKit,
    styleReferences?: StyleReference[]
  ): Promise<string[]> {
    try {
      const aiGuidelines = await this.generateAIVisualGuidelines(
        request,
        brandKit,
        styleReferences
      )
      if (aiGuidelines && aiGuidelines.length > 0) {
        return aiGuidelines
      }
    } catch (error) {
      log.warn(
        { err: error },
        'AI visual guidelines generation failed, using fallback'
      )
    }

    // Fallback to basic guidelines
    const guidelines = [
      'Maintain visual consistency across all platforms',
      'Use high-quality imagery and professional design',
      'Optimize for mobile-first viewing',
      'Include brand logo consistently but subtly',
      'Use contrasting colors for better readability',
    ]

    if (brandKit) {
      guidelines.push(
        `Use brand colors: ${Object.values(brandKit.colors).join(', ') || 'consistent brand palette'}`
      )
      guidelines.push(
        `Follow brand imagery style: ${brandKit.imageryStyle || 'professional and authentic'}`
      )
    }

    if (styleReferences && styleReferences.length > 0) {
      guidelines.push(
        `Incorporate elements from ${styleReferences.length} style references`
      )
      guidelines.push('Balance brand consistency with creative elements')
    }

    // Add platform-specific visual guidelines
    request.platforms.forEach((platform) => {
      switch (platform) {
        case 'instagram':
          guidelines.push('Use square and story formats for Instagram')
          guidelines.push('Include visually appealing lifestyle imagery')
          break
        case 'linkedin':
          guidelines.push('Use professional, business-appropriate imagery')
          guidelines.push(
            'Include text overlays with clear statistics or benefits'
          )
          break
        case 'tiktok':
          guidelines.push('Use vertical video format with engaging motion')
          guidelines.push(
            'Include trending elements and user-generated content style'
          )
          break
        case 'youtube':
          guidelines.push('Use high-resolution thumbnails with clear titles')
          guidelines.push('Include branded elements in video content')
          break
      }
    })

    return guidelines
  }

  /**
   * Generate visual guidelines using AI
   */
  private async generateAIVisualGuidelines(
    request: CampaignTemplateGenerationRequest,
    brandKit?: BrandKit,
    styleReferences?: StyleReference[]
  ): Promise<string[] | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    const styleReferenceInfo = styleReferences
      ? styleReferences
          .map((ref) => `${ref.name}: ${ref.description}`)
          .join('; ')
      : 'No style references provided'

    const brandInfo = brandKit
      ? {
          colors: Object.values(brandKit.colors).join(', ') || 'Not specified',
          fonts:
            `${brandKit.fonts.heading}, ${brandKit.fonts.body}` ||
            'Not specified',
          imageryStyle: brandKit.imageryStyle || 'Not specified',
          logoGuidelines: 'Include brand logo consistently but subtly',
        }
      : null

    const prompt = `Generate comprehensive visual design guidelines for a marketing campaign:

CAMPAIGN DETAILS:
- Type: ${request.campaignType}
- Industry: ${request.industry}
- Platforms: ${request.platforms.join(', ')}
- Target Audience: ${JSON.stringify(request.targetAudience.demographics)}

${
  brandInfo
    ? `BRAND VISUAL IDENTITY:
- Colors: ${brandInfo.colors}
- Fonts: ${brandInfo.fonts}
- Imagery Style: ${brandInfo.imageryStyle}
- Logo Guidelines: ${brandInfo.logoGuidelines}`
    : 'No brand kit provided'
}

STYLE REFERENCES:
${styleReferenceInfo}

Generate 10-15 specific, actionable visual guidelines that cover:
1. Color palette usage and combinations
2. Typography hierarchy and readability
3. Imagery and photography style
4. Logo placement and usage
5. Platform-specific visual specifications
6. Mobile optimization requirements
7. Brand consistency guidelines
8. Creative elements from style references
9. Visual hierarchy principles
10. Accessibility considerations
11. Video content guidelines (if relevant)
12. Image dimension specifications by platform

Return as a JSON array of strings: ["guideline1", "guideline2", ...]

Make guidelines specific, actionable, and tailored to each platform's visual requirements.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return Array.isArray(result) ? result : result.guidelines || null
  }

  /**
   * Generate AI-powered platform-specific optimizations with proper structure
   */
  private async generatePlatformOptimizationsStructured(
    request: CampaignTemplateGenerationRequest
  ): Promise<
    Record<
      string,
      {
        tone: string
        characterLimits: {
          headline: number
          body: number
          cta: number
          primaryText: number
        }
        bestPractices: string[]
        adjustments: Record<string, string>
      }
    >
  > {
    try {
      const aiOptimizations =
        await this.generateAIPlatformOptimizationsStructured(request)
      if (aiOptimizations && Object.keys(aiOptimizations).length > 0) {
        return aiOptimizations
      }
    } catch (error) {
      log.warn(
        { err: error },
        'AI platform optimizations generation failed, using fallback'
      )
    }

    // Fallback to basic optimizations with proper structure
    const optimizations: Record<
      string,
      {
        tone: string
        characterLimits: {
          headline: number
          body: number
          cta: number
          primaryText: number
        }
        bestPractices: string[]
        adjustments: Record<string, string>
      }
    > = {}

    request.platforms.forEach((platform) => {
      switch (platform) {
        case 'instagram':
          optimizations[platform] = {
            tone: 'casual and engaging',
            characterLimits: {
              headline: 125,
              body: 2200,
              cta: 30,
              primaryText: 125,
            },
            bestPractices: [
              'Post during peak engagement hours (9-11 AM, 7-9 PM)',
              'Use 15-30 relevant hashtags',
              'Include stories with interactive elements',
              'Leverage carousel posts for detailed content',
            ],
            adjustments: {
              'mobile-optimization': 'square format preferred',
              'hashtag-strategy': 'mix of popular and niche hashtags',
            },
          }
          break
        case 'facebook':
          optimizations[platform] = {
            tone: 'conversational and community-focused',
            characterLimits: {
              headline: 40,
              body: 63206,
              cta: 30,
              primaryText: 40,
            },
            bestPractices: [
              'Mix of organic and boosted content',
              'Include share-worthy content formats',
              'Use Facebook Groups for community building',
              'Optimize post length for mobile reading',
            ],
            adjustments: {
              'content-format': 'mix of image, video, and link posts',
              'engagement-focus': 'encourage comments and shares',
            },
          }
          break
        case 'linkedin':
          optimizations[platform] = {
            tone: 'professional and insightful',
            characterLimits: {
              headline: 70,
              body: 3000,
              cta: 30,
              primaryText: 70,
            },
            bestPractices: [
              'Post during business hours (Tuesday-Thursday)',
              'Include professional insights and statistics',
              'Use LinkedIn articles for long-form content',
              'Engage with relevant industry groups',
            ],
            adjustments: {
              'content-type': 'focus on thought leadership',
              'visual-style': 'professional imagery with text overlays',
            },
          }
          break
        case 'tiktok':
          optimizations[platform] = {
            tone: 'energetic and entertaining',
            characterLimits: {
              headline: 80,
              body: 2200,
              cta: 30,
              primaryText: 80,
            },
            bestPractices: [
              'Create short, attention-grabbing content (15-30 seconds)',
              'Use trending sounds and effects',
              'Include clear call-to-actions in captions',
              'Post frequently to maintain engagement',
            ],
            adjustments: {
              'video-format': 'vertical 9:16 aspect ratio',
              'content-style': 'fast-paced and trend-driven',
            },
          }
          break
        case 'youtube':
          optimizations[platform] = {
            tone: 'educational and entertaining',
            characterLimits: {
              headline: 70,
              body: 5000,
              cta: 30,
              primaryText: 70,
            },
            bestPractices: [
              'Create compelling thumbnails with clear titles',
              'Optimize video descriptions with keywords',
              'Include end screens with calls-to-action',
              'Use YouTube Stories for behind-the-scenes content',
            ],
            adjustments: {
              'thumbnail-design': 'high contrast with readable text',
              'seo-optimization': 'keyword-rich titles and descriptions',
            },
          }
          break
        case 'twitter':
          optimizations[platform] = {
            tone: 'concise and conversational',
            characterLimits: {
              headline: 280,
              body: 280,
              cta: 30,
              primaryText: 280,
            },
            bestPractices: [
              'Keep tweets concise and impactful',
              'Use relevant hashtags and mentions',
              'Include visual content in tweets',
              'Engage in real-time conversations and trends',
            ],
            adjustments: {
              'thread-strategy': 'break complex messages into threads',
              timing: 'post during peak hours for maximum reach',
            },
          }
          break
      }
    })

    return optimizations
  }

  /**
   * Generate platform optimizations using AI with proper structure
   */
  private async generateAIPlatformOptimizationsStructured(
    request: CampaignTemplateGenerationRequest
  ): Promise<Record<
    string,
    {
      tone: string
      characterLimits: {
        headline: number
        body: number
        cta: number
        primaryText: number
      }
      bestPractices: string[]
      adjustments: Record<string, string>
    }
  > | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    const prompt = `Generate platform-specific optimization strategies for a marketing campaign with detailed structure:

CAMPAIGN DETAILS:
- Type: ${request.campaignType}
- Industry: ${request.industry}
- Target Audience: ${JSON.stringify(request.targetAudience.demographics)}
- Platforms: ${request.platforms.join(', ')}
- Target Audience Interests: ${request.targetAudience.interests.join(', ')}

For each platform, generate optimization details with:
1. Recommended tone for the platform
2. Character limits for different content elements
3. Best practices (5-7 specific strategies)
4. Platform-specific adjustments (key-value pairs)
5. Recommended posting cadence if provided (respect request.targetAudience.postingFrequency)
6. How to weave brand voice/tone (${JSON.stringify(request.targetAudience.brandVoice || {})}) into copy

Return JSON with platform as keys and structured objects as values:
{
  "instagram": {
    "tone": "casual and engaging",
    "characterLimits": {
      "headline": 125,
      "body": 2200,
      "cta": 30,
      "primaryText": 125
    },
    "bestPractices": ["strategy1", "strategy2", ...],
    "adjustments": {
      "mobile-optimization": "square format preferred",
      "hashtag-strategy": "mix of popular and niche hashtags"
    }
  },
  ...
}

Make strategies specific to the campaign type, industry, and target audience.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result || null
  }

  /**
   * Generate AI-powered platform-specific optimizations (legacy method for compatibility)
   */
  private async generatePlatformOptimizations(
    request: CampaignTemplateGenerationRequest
  ): Promise<{ [platform: string]: string[] }> {
    const structured =
      await this.generatePlatformOptimizationsStructured(request)

    // Convert structured format to simple string arrays for backward compatibility
    const simple: { [platform: string]: string[] } = {}
    for (const [platform, data] of Object.entries(structured)) {
      simple[platform] = data.bestPractices
    }

    return simple
  }

  /**
   * Generate AI-powered success metrics for the campaign
   */
  private async generateSuccessMetrics(
    request: CampaignTemplateGenerationRequest
  ): Promise<string[]> {
    try {
      const aiMetrics = await this.generateAISuccessMetrics(request)
      if (aiMetrics && aiMetrics.length > 0) {
        return aiMetrics
      }
    } catch (error) {
      log.warn(
        { err: error },
        'AI success metrics generation failed, using fallback'
      )
    }

    // Fallback to basic metrics
    const baseMetrics = [
      'Engagement rate (likes, comments, shares)',
      'Reach and impressions',
      'Click-through rate',
      'Conversion rate',
      'Return on ad spend (ROAS)',
    ]

    // Add campaign type specific metrics
    switch (request.campaignType) {
      case 'product-launch':
        baseMetrics.push('Pre-launch buzz and sign-ups')
        baseMetrics.push('Launch day sales velocity')
        baseMetrics.push('Product review generation')
        break
      case 'brand-awareness':
        baseMetrics.push('Brand mention sentiment')
        baseMetrics.push('Share of voice')
        baseMetrics.push('Brand recall metrics')
        break
      case 'lead-generation':
        baseMetrics.push('Cost per lead (CPL)')
        baseMetrics.push('Lead quality score')
        baseMetrics.push('Lead-to-customer conversion rate')
        break
      case 'event-promotion':
        baseMetrics.push('Registration rate')
        baseMetrics.push('Attendance rate')
        baseMetrics.push('Post-event engagement')
        break
    }

    return baseMetrics
  }

  /**
   * Generate success metrics using AI
   */
  private async generateAISuccessMetrics(
    request: CampaignTemplateGenerationRequest
  ): Promise<string[] | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    const prompt = `Generate comprehensive success metrics and KPIs for a marketing campaign:

CAMPAIGN DETAILS:
- Type: ${request.campaignType}
- Industry: ${request.industry}
- Description: ${request.description}
- Target Platforms: ${request.platforms.join(', ')}
- Target Audience: ${JSON.stringify(request.targetAudience.demographics)}

Generate 12-15 specific, measurable success metrics that include:
1. Standard engagement metrics (likes, comments, shares, etc.)
2. Reach and awareness metrics
3. Conversion and lead generation metrics
4. Platform-specific metrics for each target platform
5. Campaign-type specific metrics
6. ROI and business impact metrics
7. Audience growth and retention metrics
8. Content performance metrics
9. Brand perception metrics
10. Cost efficiency metrics

Return as a JSON array of strings: ["metric1", "metric2", ...]

Make metrics specific, actionable, and relevant to the campaign type and industry.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return Array.isArray(result) ? result : result.metrics || null
  }

  /**
   * Generate template tags
   */
  private generateTemplateTags(
    request: CampaignTemplateGenerationRequest
  ): string[] {
    const tags = [request.industry, request.campaignType, ...request.platforms]

    // Add demographic-based tags
    if (
      request.targetAudience.demographics.ageRange?.includes?.('25-35') ||
      request.targetAudience.demographics.ageRange?.includes?.('18-24')
    ) {
      tags.push('young-adults')
    }
    if (
      request.targetAudience.demographics.location
        ?.toLowerCase()
        ?.includes('urban')
    ) {
      tags.push('urban')
    }

    tags.push(...request.targetAudience.interests.slice(0, 2))
    if (request.targetAudience.psychographics?.length) {
      tags.push(...request.targetAudience.psychographics.slice(0, 2))
    }
    if (request.targetAudience.demographics.segments?.length) {
      tags.push(...request.targetAudience.demographics.segments.slice(0, 2))
    }
    if (request.targetAudience.buyerJourneyStages?.length) {
      tags.push(
        ...request.targetAudience.buyerJourneyStages
          .map((stage) => `${stage}-stage`)
          .slice(0, 2)
      )
    }

    return tags
  }

  /**
   * Helper methods for content structure generation
   */
  private generateCampaignPhases(campaignType: string): string[] {
    const phases = ['awareness', 'consideration', 'conversion']

    if (campaignType === 'product-launch') {
      return ['teaser', 'launch', 'post-launch']
    }
    if (campaignType === 'event-promotion') {
      return ['pre-event', 'event', 'post-event']
    }

    return phases
  }

  private generateTouchpoints(platforms: string[]): string[] {
    const touchpoints = []
    if (platforms.includes('instagram'))
      touchpoints.push('instagram-feed', 'instagram-stories', 'instagram-reels')
    if (platforms.includes('facebook'))
      touchpoints.push('facebook-feed', 'facebook-stories', 'facebook-groups')
    if (platforms.includes('linkedin'))
      touchpoints.push('linkedin-feed', 'linkedin-articles')
    if (platforms.includes('tiktok'))
      touchpoints.push('tiktok-feed', 'tiktok-stories')
    if (platforms.includes('youtube'))
      touchpoints.push('youtube-videos', 'youtube-shorts')
    if (platforms.includes('twitter'))
      touchpoints.push('twitter-feed', 'twitter-spaces')

    return touchpoints
  }

  private generateContentTypes(
    campaignType: string,
    platforms: string[]
  ): string[] {
    const types = ['static-image', 'carousel', 'story']

    if (platforms.includes('youtube') || platforms.includes('tiktok')) {
      types.push('short-form-video', 'long-form-video')
    }
    if (campaignType === 'product-launch') {
      types.push('product-demo', 'testimonial', 'announcement')
    }
    if (campaignType === 'brand-awareness') {
      types.push('brand-story', 'behind-scenes', 'user-generated')
    }

    return types
  }

  private generateContentFrequency(platforms: string[]): {
    [platform: string]: string
  } {
    const frequency: { [platform: string]: string } = {}

    platforms.forEach((platform) => {
      switch (platform) {
        case 'twitter':
          frequency[platform] = '3-5 times per day'
          break
        case 'instagram':
          frequency[platform] = '1-2 times per day'
          break
        case 'facebook':
          frequency[platform] = '1-2 times per day'
          break
        case 'linkedin':
          frequency[platform] = '3-5 times per week'
          break
        case 'tiktok':
          frequency[platform] = '1-3 times per day'
          break
        case 'youtube':
          frequency[platform] = '2-3 times per week'
          break
        default:
          frequency[platform] = '1 time per day'
      }
    })

    return frequency
  }

  /**
   * Generate platform guidelines
   */
  private async generatePlatformGuidelines(
    request: CampaignTemplateGenerationRequest,
    template: CampaignTemplate
  ): Promise<CampaignTemplateGenerationResult['appliedGuidelines']> {
    // Convert structured platform optimizations to string arrays for the result interface
    const platformOptimizations: { [platform: string]: string[] } = {}
    for (const [platform, data] of Object.entries(
      template.platformOptimizations
    )) {
      platformOptimizations[platform] = data.bestPractices
    }

    return {
      messaging: template.messagingGuidelines,
      visualStyle: template.visualGuidelines,
      contentStrategy: [
        `Follow structured campaign phases: hook, body, and call-to-action`,
        `Maintain consistent brand voice across ${template.targetPlatforms.length} platforms`,
        `Use content types: ${Array.isArray(template.contentStructure.contentTypes) ? template.contentStructure.contentTypes.join(', ') : 'mixed content'}`,
        `Post frequency guidelines by platform`,
      ],
      platformOptimizations,
    }
  }

  /**
   * Generate template recommendations
   */
  private generateTemplateRecommendations(
    request: CampaignTemplateGenerationRequest,
    template: CampaignTemplate,
    brandKit?: BrandKit
  ): string[] {
    const recommendations = [
      'Test different content formats to see what resonates best',
      'Monitor engagement metrics and adjust strategy accordingly',
      'Use A/B testing for key messaging and visuals',
      'Plan content calendar in advance for consistency',
    ]

    if (!brandKit) {
      recommendations.push(
        'Consider creating a brand kit for better consistency'
      )
    }

    if (request.platforms.length < 3) {
      recommendations.push(
        'Consider expanding to additional platforms for greater reach'
      )
    }

    if (request.campaignType === 'product-launch') {
      recommendations.push(
        'Prepare customer service and support for launch day inquiries'
      )
    }

    return recommendations
  }

  /**
   * Calculate template quality metrics
   */
  private calculateTemplateQuality(
    template: CampaignTemplate,
    brandKit?: BrandKit,
    styleReferences?: StyleReference[]
  ): CampaignTemplateGenerationResult['qualityMetrics'] {
    let completeness = 80
    let brandAlignment = 70
    let platformOptimization = 85

    // Assess completeness
    if (template.messagingGuidelines.length > 5) completeness += 5
    if (template.visualGuidelines.length > 5) completeness += 5
    if (Object.keys(template.platformOptimizations).length > 0)
      completeness += 5
    if (template.successMetrics.length > 5) completeness += 5

    // Assess brand alignment
    if (brandKit) brandAlignment += 15
    if (styleReferences && styleReferences.length > 0) brandAlignment += 10

    // Assess platform optimization
    if (template.targetPlatforms.length >= 3) platformOptimization += 10
    if (
      Object.keys(template.platformOptimizations).length ===
      template.targetPlatforms.length
    ) {
      platformOptimization += 5
    }

    const overallScore = Math.round(
      (completeness + brandAlignment + platformOptimization) / 3
    )

    return {
      completeness: Math.min(100, completeness),
      brandAlignment: Math.min(100, brandAlignment),
      platformOptimization: Math.min(100, platformOptimization),
      overallScore,
    }
  }

  /**
   * Create AI-enhanced campaign from template
   */
  private async createCampaignFromTemplate(
    template: CampaignTemplate,
    campaignName: string,
    specificRequirements: string[]
  ): Promise<Campaign> {
    try {
      const aiCampaign = await this.generateAICampaignFromTemplate(
        template,
        campaignName,
        specificRequirements
      )
      if (aiCampaign) {
        return aiCampaign
      }
    } catch (error) {
      log.warn({ err: error }, 'AI campaign creation failed, using fallback')
    }

    // Fallback to basic campaign creation
    const campaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name: campaignName,
      description: `${template.description} - Customized for specific requirements`,
      workspaceId: template.workspaceId,
      brandKitId: '', // Will be set when campaign is created
      objective: 'awareness', // Default objective
      launchType: 'new-launch',
      funnelStage: 'cold',
      primaryOffer: '',
      primaryCTA: '',
      secondaryCTA: '',
      placements: template.targetPlatforms as (
        | 'ig-feed'
        | 'ig-story'
        | 'fb-feed'
        | 'fb-story'
        | 'li-feed'
      )[],
      targetAudience: `${template.targetAudience.demographics.ageRange} ${template.targetAudience.demographics.gender} in ${template.targetAudience.demographics.location}`,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return campaign
  }

  /**
   * Generate campaign from template using AI
   */
  private async generateAICampaignFromTemplate(
    template: CampaignTemplate,
    campaignName: string,
    specificRequirements: string[]
  ): Promise<Campaign | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    const prompt = `Create a detailed campaign specification based on a template and specific requirements:

TEMPLATE DETAILS:
- Name: ${template.name}
- Description: ${template.description}
- Category: ${template.category}
- Industry: ${template.industry}
- Target Platforms: ${template.targetPlatforms.join(', ')}
- Success Metrics: ${template.successMetrics.slice(0, 5).join(', ')}

SPECIFIC REQUIREMENTS:
${specificRequirements.join('\n- ')}
CAMPAIGN NAME: ${campaignName}

Generate campaign details including:
1. Enhanced description that incorporates specific requirements
2. Smart budget allocation by platform
3. Realistic duration (in days)
4. SMART objectives based on template and requirements
5. Content strategy overview

Return JSON with:
{
  "description": "Enhanced campaign description",
  "budget": {
    "total": number,
    "allocated": {"platform1": amount, "platform2": amount, ...}
  },
  "duration": number,
  "objectives": ["objective1", "objective2", "objective3"],
  "contentStrategy": "Brief content strategy overview"
}

Make it realistic and actionable for the campaign type and industry.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    // Create campaign with AI-generated details
    const campaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name: campaignName,
      description:
        result.description ||
        `${template.description} - Customized for specific requirements`,
      workspaceId: template.workspaceId,
      brandKitId: '', // Will be set when campaign is created
      objective: 'awareness', // Default objective
      launchType: 'new-launch',
      funnelStage: 'cold',
      primaryOffer: result.budget?.total
        ? `$${result.budget.total} campaign budget`
        : '',
      primaryCTA: 'Learn More',
      secondaryCTA: '',
      placements: template.targetPlatforms as (
        | 'ig-feed'
        | 'ig-story'
        | 'fb-feed'
        | 'fb-story'
        | 'li-feed'
      )[],
      targetAudience: `${template.targetAudience.demographics.ageRange} ${template.targetAudience.demographics.gender} in ${template.targetAudience.demographics.location}`,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return campaign
  }

  /**
   * Generate AI-powered platform adaptations
   */
  private async generatePlatformAdaptations(
    template: CampaignTemplate,
    platforms: string[]
  ): Promise<TemplateApplicationResult['adaptations']> {
    try {
      const aiAdaptations = await this.generateAIPlatformAdaptations(
        template,
        platforms
      )
      if (aiAdaptations && aiAdaptations.length > 0) {
        return aiAdaptations
      }
    } catch (error) {
      log.warn(
        { err: error },
        'AI platform adaptations generation failed, using fallback'
      )
    }

    // Fallback to basic adaptations
    return platforms.map((platform) => ({
      platform,
      modifications: [
        `Optimize content format for ${platform} specifications`,
        `Adjust tone for ${platform} audience expectations`,
        `Use ${platform}-specific features and tools`,
      ],
      localizedContent: [
        `${platform}-specific hashtags and mentions`,
        'Platform-appropriate call-to-action',
        `${platform} native content format`,
      ],
    }))
  }

  /**
   * Generate platform adaptations using AI
   */
  private async generateAIPlatformAdaptations(
    template: CampaignTemplate,
    platforms: string[]
  ): Promise<TemplateApplicationResult['adaptations'] | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    const prompt = `Generate detailed platform-specific adaptations for a campaign template:

TEMPLATE DETAILS:
- Name: ${template.name}
- Industry: ${template.industry}
- Target Audience: ${JSON.stringify(template.targetAudience.demographics)}
- Platforms to adapt: ${platforms.join(', ')}
- Content Types: ${template.contentStructure.contentTypes?.join(', ') || 'various'}

For each platform, generate specific adaptations covering:
1. Content format modifications
2. Tone and voice adjustments
3. Platform-specific features to leverage
4. Localized content elements
5. Hashtag and mention strategies
6. Visual style adaptations
7. Timing and scheduling considerations

Return JSON array with objects:
[
  {
    "platform": "platform1",
    "modifications": ["modification1", "modification2", ...],
    "localizedContent": ["content1", "content2", ...]
  },
  ...
]

Make adaptations specific to each platform's unique characteristics and audience expectations.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return Array.isArray(result) ? result : result.adaptations || null
  }

  /**
   * Predict campaign performance using AI
   */
  private async predictCampaignPerformance(
    campaign: Campaign,
    adaptations: TemplateApplicationResult['adaptations']
  ): Promise<TemplateApplicationResult['performance']> {
    try {
      const aiPerformance = await this.generateAIPerformancePrediction(
        campaign,
        adaptations
      )
      if (aiPerformance) {
        return aiPerformance
      }
    } catch (error) {
      log.warn(
        { err: error },
        'AI performance prediction failed, using fallback'
      )
    }

    // Fallback to basic prediction
    const platformMultiplier = adaptations.length * 0.8
    const baseEngagement = 1000
    const baseReach = 5000

    return {
      expectedEngagement: Math.round(baseEngagement * platformMultiplier),
      expectedReach: Math.round(baseReach * platformMultiplier),
      expectedConversions: Math.round(baseReach * 0.02 * platformMultiplier),
    }
  }

  /**
   * Generate performance prediction using AI
   */
  private async generateAIPerformancePrediction(
    campaign: Campaign,
    adaptations: TemplateApplicationResult['adaptations']
  ): Promise<TemplateApplicationResult['performance'] | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    const platforms = adaptations.map((a) => a.platform).join(', ')
    const campaignInfo = {
      name: campaign.name,
      objectives: (campaign.briefData as any)?.objective || campaign.objective, // Single objective, not array
      targetAudience: campaign.targetAudience,
      platforms: platforms,
    }

    const prompt = `Predict campaign performance metrics for a marketing campaign:

CAMPAIGN DETAILS:
- Name: ${campaignInfo.name}
- Objectives: ${campaignInfo.objectives}
- Target Platforms: ${campaignInfo.platforms}
- Target Audience: ${campaignInfo.targetAudience}
- Platform Adaptations: ${adaptations.length} platforms optimized

Predict realistic performance metrics for:
1. Expected engagement (total interactions across all platforms)
2. Expected reach (total unique impressions)
3. Expected conversions (leads, sales, or desired actions)

Consider:
- Industry benchmarks
- Platform engagement rates
- Campaign type performance
- Target audience behavior
- Content strategy effectiveness
- Platform-specific factors

Return JSON with:
{
  "expectedEngagement": number,
  "expectedReach": number,
  "expectedConversions": number
}

Be realistic and conservative in predictions. Consider this is for planning purposes.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result
  }
}
