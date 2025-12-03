import OpenAI from 'openai'
import {
  CampaignTemplate,
  Campaign,
  BrandKit,
  Asset,
  StyleReference
} from '../models/auth'
import { log } from '../middleware/logger'

export interface CampaignTemplateGenerationRequest {
  workspaceId: string
  name: string
  description: string
  industry: string
  campaignType: 'product-launch' | 'brand-awareness' | 'lead-generation' | 'event-promotion' | 'seasonal' | 'custom'
  targetAudience: {
    demographics: string[]
    psychographics: string[]
    painPoints: string[]
    interests: string[]
  }
  platforms: ('instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'twitter')[]
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
      const template = await this.buildCampaignTemplate(request, brandKit, styleReferences)

      // Generate platform-specific guidelines
      const appliedGuidelines = await this.generatePlatformGuidelines(request, template)

      // Generate quality recommendations
      const recommendations = this.generateTemplateRecommendations(request, template, brandKit)

      // Calculate quality metrics
      const qualityMetrics = this.calculateTemplateQuality(template, brandKit, styleReferences)

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
      throw new Error(`Failed to generate campaign template: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      const campaign = await this.createCampaignFromTemplate(template, campaignName, specificRequirements)

      // Generate platform-specific adaptations
      const adaptations = await this.generatePlatformAdaptations(template, platforms || template.targetPlatforms)

      // Generate performance predictions
      const performance = await this.predictCampaignPerformance(campaign, adaptations)

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
      throw new Error(`Failed to apply campaign template: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      template =>
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
      template => template.workspaceId === workspaceId && template.isActive
    )

    const queryLower = query.toLowerCase()

    return allTemplates
      .filter(template =>
        template.name.toLowerCase().includes(queryLower) ||
        template.description.toLowerCase().includes(queryLower) ||
        template.industry.toLowerCase().includes(queryLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(queryLower))
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
      contentStructure: await this.generateContentStructure(request, brandKit),
      messagingGuidelines: await this.generateMessagingGuidelines(request, brandKit),
      visualGuidelines: await this.generateVisualGuidelines(request, brandKit, styleReferences),
      platformOptimizations: await this.generatePlatformOptimizations(request),
      successMetrics: await this.generateSuccessMetrics(request),
      tags: this.generateTemplateTags(request),
      isActive: true,
      usageCount: 0,
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
      const aiStructure = await this.generateAIContentStructure(request, brandKit)
      if (aiStructure) {
        return aiStructure
      }
    } catch (error) {
      log.warn({ err: error }, 'AI content structure generation failed, using fallback')
    }

    // Fallback to basic structure
    const baseStructure = {
      phases: this.generateCampaignPhases(request.campaignType),
      touchpoints: this.generateTouchpoints(request.platforms),
      contentTypes: this.generateContentTypes(request.campaignType, request.platforms),
      frequency: this.generateContentFrequency(request.platforms),
      messagingHierarchy: ['primary-message', 'secondary-benefits', 'social-proof', 'call-to-action'],
    }

    // Add brand-specific elements if brand kit is available
    if (brandKit) {
      return {
        ...baseStructure,
        brandVoice: brandKit.brandVoice || 'professional',
        keyMessages: brandKit.keyDifferentiators || [],
      }
    }

    return baseStructure
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

${brandKit ? `BRAND DETAILS:
- Values: ${brandKit.values?.join(', ') || 'Not specified'}
- Voice: ${brandKit.brandVoice || 'Not specified'}
- Key Differentiators: ${brandKit.keyDifferentiators?.join(', ') || 'Not specified'}` : 'No brand kit provided'}

Generate a detailed content structure with:
1. Campaign phases (awareness, consideration, conversion)
2. Platform touchpoints
3. Content types by platform
4. Posting frequency recommendations
5. Messaging hierarchy
6. Brand voice integration
7. Key messages based on audience pain points

Return JSON with:
{
  "phases": ["phase1", "phase2", ...],
  "touchpoints": ["touchpoint1", "touchpoint2", ...],
  "contentTypes": ["type1", "type2", ...],
  "frequency": {"platform1": "frequency", "platform2": "frequency"},
  "messagingHierarchy": ["step1", "step2", ...],
  "brandVoice": "description",
  "keyMessages": ["message1", "message2", ...]
}

Make it specific and actionable for the campaign type and target audience.`

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
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
      const aiGuidelines = await this.generateAIMessagingGuidelines(request, brandKit)
      if (aiGuidelines && aiGuidelines.length > 0) {
        return aiGuidelines
      }
    } catch (error) {
      log.warn({ err: error }, 'AI messaging guidelines generation failed, using fallback')
    }

    // Fallback to basic guidelines
    const guidelines = [
      `Focus on solving ${request.targetAudience.painPoints.join(', ')}`,
      `Use language that resonates with ${request.targetAudience.psychographics.join(', ')}`,
      `Highlight benefits relevant to ${request.targetAudience.interests.join(', ')}`,
      'Maintain consistent brand voice across all platforms',
      'Include clear calls-to-action in each message',
    ]

    if (brandKit) {
      guidelines.push(`Incorporate brand values: ${brandKit.values?.join(', ') || 'professionalism and innovation'}`)
      guidelines.push(`Use brand tone: ${brandKit.toneOfVoice || 'professional and approachable'}`)
    }

    // Add campaign type specific guidelines
    switch (request.campaignType) {
      case 'product-launch':
        guidelines.push('Build anticipation through teaser content')
        guidelines.push('Highlight unique selling propositions clearly')
        guidelines.push('Include launch-specific urgency and scarcity')
        break
      case 'brand-awareness':
        guidelines.push('Focus on brand story and values')
        guidelines.push('Create emotionally resonant content')
        guidelines.push('Encourage social sharing and engagement')
        break
      case 'lead-generation':
        guidelines.push('Include lead magnets and value propositions')
        guidelines.push('Use clear benefit-driven headlines')
        guidelines.push('Minimize friction in conversion process')
        break
      case 'event-promotion':
        guidelines.push('Create event-specific excitement and urgency')
        guidelines.push('Provide clear date, time, and location information')
        guidelines.push('Include registration details and benefits')
        break
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
- Target Audience Psychographics: ${request.targetAudience.psychographics.join(', ')}
- Target Audience Interests: ${request.targetAudience.interests.join(', ')}

${brandKit ? `BRAND DETAILS:
- Values: ${brandKit.values?.join(', ') || 'Not specified'}
- Tone of Voice: ${brandKit.toneOfVoice || 'Not specified'}
- Key Differentiators: ${brandKit.keyDifferentiators?.join(', ') || 'Not specified'}` : 'No brand kit provided'}

Generate 8-12 specific, actionable messaging guidelines that will:
1. Address the target audience's pain points
2. Use language that resonates with their psychographics
3. Highlight benefits relevant to their interests
4. Incorporate brand voice and values
5. Include specific call-to-action strategies
6. Address campaign type specific needs
7. Consider industry best practices
8. Provide platform-appropriate messaging strategies

Return as a JSON array of strings: ["guideline1", "guideline2", ...]

Make guidelines specific, actionable, and tailored to the campaign type and audience.`

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" }
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
      const aiGuidelines = await this.generateAIVisualGuidelines(request, brandKit, styleReferences)
      if (aiGuidelines && aiGuidelines.length > 0) {
        return aiGuidelines
      }
    } catch (error) {
      log.warn({ err: error }, 'AI visual guidelines generation failed, using fallback')
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
      guidelines.push(`Use brand colors: ${brandKit.colors?.join(', ') || 'consistent brand palette'}`)
      guidelines.push(`Use brand typography: ${brandKit.typography?.join(', ') || 'consistent brand fonts'}`)
      guidelines.push(`Follow brand imagery style: ${brandKit.imageryStyle || 'professional and authentic'}`)
    }

    if (styleReferences && styleReferences.length > 0) {
      guidelines.push(`Incorporate elements from ${styleReferences.length} style references`)
      guidelines.push('Balance brand consistency with creative elements')
    }

    // Add platform-specific visual guidelines
    request.platforms.forEach(platform => {
      switch (platform) {
        case 'instagram':
          guidelines.push('Use square and story formats for Instagram')
          guidelines.push('Include visually appealing lifestyle imagery')
          break
        case 'linkedin':
          guidelines.push('Use professional, business-appropriate imagery')
          guidelines.push('Include text overlays with clear statistics or benefits')
          break
        case 'tiktok':
          guidelines.push('Use vertical video format with engaging motion')
          guidelines.push('Include trending elements and user-generated content style')
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
      ? styleReferences.map(ref => `${ref.name}: ${ref.description}`).join('; ')
      : 'No style references provided'

    const brandInfo = brandKit ? {
      colors: brandKit.colors?.join(', ') || 'Not specified',
      typography: brandKit.typography?.join(', ') || 'Not specified',
      imageryStyle: brandKit.imageryStyle || 'Not specified',
      logoGuidelines: brandKit.logoGuidelines || 'Not specified'
    } : null

    const prompt = `Generate comprehensive visual design guidelines for a marketing campaign:

CAMPAIGN DETAILS:
- Type: ${request.campaignType}
- Industry: ${request.industry}
- Platforms: ${request.platforms.join(', ')}
- Target Audience: ${JSON.stringify(request.targetAudience.demographics)}

${brandInfo ? `BRAND VISUAL IDENTITY:
- Colors: ${brandInfo.colors}
- Typography: ${brandInfo.typography}
- Imagery Style: ${brandInfo.imageryStyle}
- Logo Guidelines: ${brandInfo.logoGuidelines}` : 'No brand kit provided'}

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
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return Array.isArray(result) ? result : result.guidelines || null
  }

  /**
   * Generate AI-powered platform-specific optimizations
   */
  private async generatePlatformOptimizations(
    request: CampaignTemplateGenerationRequest
  ): Promise<{ [platform: string]: string[] }> {
    try {
      const aiOptimizations = await this.generateAIPlatformOptimizations(request)
      if (aiOptimizations && Object.keys(aiOptimizations).length > 0) {
        return aiOptimizations
      }
    } catch (error) {
      log.warn({ err: error }, 'AI platform optimizations generation failed, using fallback')
    }

    // Fallback to basic optimizations
    const optimizations: { [platform: string]: string[] } = {}

    request.platforms.forEach(platform => {
      switch (platform) {
        case 'instagram':
          optimizations[platform] = [
            'Post during peak engagement hours (9-11 AM, 7-9 PM)',
            'Use 15-30 relevant hashtags',
            'Include stories with interactive elements',
            'Leverage carousel posts for detailed content',
          ]
          break
        case 'facebook':
          optimizations[platform] = [
            'Mix of organic and boosted content',
            'Include share-worthy content formats',
            'Use Facebook Groups for community building',
            'Optimize post length for mobile reading',
          ]
          break
        case 'linkedin':
          optimizations[platform] = [
            'Post during business hours (Tuesday-Thursday)',
            'Include professional insights and statistics',
            'Use LinkedIn articles for long-form content',
            'Engage with relevant industry groups',
          ]
          break
        case 'tiktok':
          optimizations[platform] = [
            'Create short, attention-grabbing content (15-30 seconds)',
            'Use trending sounds and effects',
            'Include clear call-to-actions in captions',
            'Post frequently to maintain engagement',
          ]
          break
        case 'youtube':
          optimizations[platform] = [
            'Create compelling thumbnails with clear titles',
            'Optimize video descriptions with keywords',
            'Include end screens with calls-to-action',
            'Use YouTube Stories for behind-the-scenes content',
          ]
          break
        case 'twitter':
          optimizations[platform] = [
            'Keep tweets concise and impactful',
            'Use relevant hashtags and mentions',
            'Include visual content in tweets',
            'Engage in real-time conversations and trends',
          ]
          break
      }
    })

    return optimizations
  }

  /**
   * Generate platform optimizations using AI
   */
  private async generateAIPlatformOptimizations(
    request: CampaignTemplateGenerationRequest
  ): Promise<{ [platform: string]: string[] } | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    const prompt = `Generate platform-specific optimization strategies for a marketing campaign:

CAMPAIGN DETAILS:
- Type: ${request.campaignType}
- Industry: ${request.industry}
- Target Audience: ${JSON.stringify(request.targetAudience.demographics)}
- Platforms: ${request.platforms.join(', ')}
- Target Audience Psychographics: ${request.targetAudience.psychographics.join(', ')}
- Target Audience Interests: ${request.targetAudience.interests.join(', ')}

For each platform, generate 5-7 specific optimization strategies that cover:
1. Best posting times and frequency
2. Content format optimization
3. Engagement strategies
4. Platform-specific features to leverage
5. Hashtag and discovery strategies
6. Community building approaches
7. Algorithm optimization tactics

Return JSON with platform as keys and array of optimizations as values:
{
  "instagram": ["strategy1", "strategy2", ...],
  "facebook": ["strategy1", "strategy2", ...],
  ...
}

Make strategies specific to the campaign type, industry, and target audience.`

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result.optimizations || result || null
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
      log.warn({ err: error }, 'AI success metrics generation failed, using fallback')
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
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return Array.isArray(result) ? result : result.metrics || null
  }

  /**
   * Generate template tags
   */
  private generateTemplateTags(request: CampaignTemplateGenerationRequest): string[] {
    const tags = [
      request.industry,
      request.campaignType,
      ...request.platforms,
    ]

    if (request.targetAudience.demographics.includes('b2b')) {
      tags.push('b2b')
    }
    if (request.targetAudience.demographics.includes('b2c')) {
      tags.push('b2c')
    }

    tags.push(...request.targetAudience.interests.slice(0, 2))

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
    if (platforms.includes('instagram')) touchpoints.push('instagram-feed', 'instagram-stories', 'instagram-reels')
    if (platforms.includes('facebook')) touchpoints.push('facebook-feed', 'facebook-stories', 'facebook-groups')
    if (platforms.includes('linkedin')) touchpoints.push('linkedin-feed', 'linkedin-articles')
    if (platforms.includes('tiktok')) touchpoints.push('tiktok-feed', 'tiktok-stories')
    if (platforms.includes('youtube')) touchpoints.push('youtube-videos', 'youtube-shorts')
    if (platforms.includes('twitter')) touchpoints.push('twitter-feed', 'twitter-spaces')

    return touchpoints
  }

  private generateContentTypes(campaignType: string, platforms: string[]): string[] {
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

  private generateContentFrequency(platforms: string[]): { [platform: string]: string } {
    const frequency: { [platform: string]: string } = {}

    platforms.forEach(platform => {
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
    return {
      messaging: template.messagingGuidelines,
      visualStyle: template.visualGuidelines,
      contentStrategy: [
        `Follow ${template.contentStructure.phases.length}-phase campaign structure`,
        `Maintain consistent brand voice across ${template.targetPlatforms.length} platforms`,
        `Use content types: ${Array.isArray(template.contentStructure.contentTypes) ? template.contentStructure.contentTypes.join(', ') : 'mixed content'}`,
        `Post frequency guidelines by platform`,
      ],
      platformOptimizations: template.platformOptimizations,
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
      recommendations.push('Consider creating a brand kit for better consistency')
    }

    if (request.platforms.length < 3) {
      recommendations.push('Consider expanding to additional platforms for greater reach')
    }

    if (request.campaignType === 'product-launch') {
      recommendations.push('Prepare customer service and support for launch day inquiries')
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
    if (Object.keys(template.platformOptimizations).length > 0) completeness += 5
    if (template.successMetrics.length > 5) completeness += 5

    // Assess brand alignment
    if (brandKit) brandAlignment += 15
    if (styleReferences && styleReferences.length > 0) brandAlignment += 10

    // Assess platform optimization
    if (template.targetPlatforms.length >= 3) platformOptimization += 10
    if (Object.keys(template.platformOptimizations).length === template.targetPlatforms.length) {
      platformOptimization += 5
    }

    const overallScore = Math.round((completeness + brandAlignment + platformOptimization) / 3)

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
      const aiCampaign = await this.generateAICampaignFromTemplate(template, campaignName, specificRequirements)
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
      status: 'draft',
      templateId: template.id,
      targetAudience: template.targetAudience,
      platforms: template.targetPlatforms,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      budget: {
        total: 10000,
        allocated: {},
        spent: 0,
      },
      objectives: template.successMetrics,
      assets: [],
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
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    // Create campaign with AI-generated details
    const campaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name: campaignName,
      description: result.description || `${template.description} - Customized for specific requirements`,
      workspaceId: template.workspaceId,
      status: 'draft',
      templateId: template.id,
      targetAudience: template.targetAudience,
      platforms: template.targetPlatforms,
      startDate: new Date(),
      endDate: new Date(Date.now() + (result.duration || 30) * 24 * 60 * 60 * 1000),
      budget: {
        total: result.budget?.total || 10000,
        allocated: result.budget?.allocated || {},
        spent: 0,
      },
      objectives: result.objectives || template.successMetrics,
      assets: [],
      contentStrategy: result.contentStrategy,
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
      const aiAdaptations = await this.generateAIPlatformAdaptations(template, platforms)
      if (aiAdaptations && aiAdaptations.length > 0) {
        return aiAdaptations
      }
    } catch (error) {
      log.warn({ err: error }, 'AI platform adaptations generation failed, using fallback')
    }

    // Fallback to basic adaptations
    return platforms.map(platform => ({
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
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
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
      const aiPerformance = await this.generateAIPerformancePrediction(campaign, adaptations)
      if (aiPerformance) {
        return aiPerformance
      }
    } catch (error) {
      log.warn({ err: error }, 'AI performance prediction failed, using fallback')
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

    const platforms = adaptations.map(a => a.platform).join(', ')
    const campaignInfo = {
      name: campaign.name,
      objectives: campaign.objectives.slice(0, 3).join(', '),
      targetAudience: JSON.stringify(campaign.targetAudience.demographics),
      platforms: platforms
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
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result
  }
}