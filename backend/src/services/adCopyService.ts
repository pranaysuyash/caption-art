import OpenAI from 'openai'
import { AdCopyContent, CaptionVariation, BrandKit, Campaign } from '../models/auth'
import { CampaignAwareService, AssetContext } from './campaignAwareService'
import { log } from '../middleware/logger'

export interface AdCopyGenerationRequest {
  campaignId?: string
  brandKitId?: string
  assetDescription: string
  platforms: ('instagram' | 'facebook' | 'linkedin')[]
  tone: string[]
  objective: 'awareness' | 'consideration' | 'conversion' | 'retention'
  targetAudience?: {
    demographics?: string
    psychographics?: string
    painPoints?: string[]
  }
  variationType: 'main' | 'alt1' | 'alt2' | 'alt3' | 'punchy' | 'short' | 'story'
}

export interface AdCopyGenerationResult {
  variation: CaptionVariation
  adCopy: AdCopyContent
  qualityScore: number
  recommendations: string[]
}

export class AdCopyService {
  private openai: OpenAI
  private campaignAwareService: CampaignAwareService

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.campaignAwareService = new CampaignAwareService()
  }

  /**
   * Generate ad copy content for a single variation
   */
  async generateAdCopy(
    request: AdCopyGenerationRequest,
    campaign?: Campaign,
    brandKit?: BrandKit
  ): Promise<AdCopyGenerationResult> {
    try {
      log.info(
        {
          variationType: request.variationType,
          platforms: request.platforms,
          assetDescription: request.assetDescription.substring(0, 100)
        },
        `Generating ad copy for variation: ${request.variationType}`
      )

      const prompt = this.buildAdCopyPrompt(request, campaign, brandKit)

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert copywriter specializing in digital advertising. Generate compelling, conversion-focused ad copy that follows best practices for each platform and variation type.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('Failed to generate ad copy content')
      }

      const adCopy = this.parseAdCopyResponse(response, request)
      const variation = this.createVariationFromAdCopy(adCopy, request.variationType)
      const qualityScore = this.calculateQualityScore(adCopy, request)
      const recommendations = this.generateRecommendations(adCopy, request)

      log.info(
        {
          variationType: request.variationType,
          qualityScore,
          headlineLength: adCopy.headline.length
        },
        `Ad copy generated successfully`
      )

      return {
        variation,
        adCopy,
        qualityScore,
        recommendations,
      }
    } catch (error) {
      log.error({ err: error, variationType: request.variationType }, 'Ad copy generation error')
      throw new Error(`Failed to generate ad copy: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build comprehensive prompt for ad copy generation using campaign-aware service
   */
  private buildAdCopyPrompt(
    request: AdCopyGenerationRequest,
    campaign?: Campaign,
    brandKit?: BrandKit
  ): string {
    // If we have both campaign and brand kit, use campaign-aware prompting
    if (campaign && brandKit) {
      const campaignContext = this.campaignAwareService.buildCampaignContext(campaign, brandKit)

      const assetContext: AssetContext = {
        description: request.assetDescription,
        category: 'ad-copy',
        features: request.targetAudience?.painPoints,
        benefits: [campaign.brief?.keyMessage || brandKit.valueProposition || 'High quality products'],
        useCases: [`Drive ${request.objective} through compelling advertising`],
      }

      return this.campaignAwareService.generateCampaignAwarePrompt(
        campaignContext,
        assetContext,
        request.variationType,
        request.platforms,
        'adcopy'
      )
    }

    // Fallback to original prompting if no campaign/brand context
    const brandPersonality = brandKit?.brandPersonality || 'Professional and trustworthy'
    const brandColors = brandKit?.colors || {}
    const valueProposition = brandKit?.valueProposition || 'High quality products and services'

    const variationInstructions = this.getVariationInstructions(request.variationType)
    const platformGuidelines = this.getPlatformGuidelines(request.platforms)

    return `
Generate ${request.variationType} ad copy for the following:

ASSET DESCRIPTION:
${request.assetDescription}

CAMPAIGN CONTEXT:
${campaign ? `
- Campaign Name: ${campaign.name}
- Objective: ${request.objective}
- Key Message: ${campaign.brief?.keyMessage || 'Not specified'}
- Primary Audience: ${campaign.brief?.primaryAudience?.demographics || 'Not specified'}
` : 'No specific campaign context provided'}

BRAND IDENTITY:
- Brand Personality: ${brandPersonality}
- Value Proposition: ${valueProposition}
- Brand Colors: ${brandColors.primary || 'Not specified'}, ${brandColors.secondary || 'Not specified'}

TARGET AUDIENCE:
${request.targetAudience ? `
- Demographics: ${request.targetAudience.demographics || 'Not specified'}
- Psychographics: ${request.targetAudience.psychographics || 'Not specified'}
- Pain Points: ${request.targetAudience.painPoints?.join(', ') || 'Not specified'}
` : 'General audience'}

VARIATION TYPE: ${request.variationType}
${variationInstructions}

PLATFORMS: ${request.platforms.join(', ')}
${platformGuidelines}

TONE: ${request.tone.join(', ')}

REQUIRED OUTPUT:
Generate ad copy in this JSON format:
{
  "headline": "Compelling headline that grabs attention",
  "subheadline": "Supporting subheadline that reinforces the main message",
  "primaryText": "Main body text that provides details and benefits (2-4 sentences)",
  "ctaText": "Clear call-to-action that drives engagement",
  "platformSpecific": {
    "instagram": {
      "headline": "Instagram-optimized headline",
      "primaryText": "Instagram-optimized body with emojis and hashtags",
      "ctaText": "Instagram-optimized CTA"
    },
    "facebook": {
      "headline": "Facebook-optimized headline",
      "primaryText": "Facebook-optimized body with more detail",
      "ctaText": "Facebook-optimized CTA"
    },
    "linkedin": {
      "headline": "LinkedIn-optimized professional headline",
      "primaryText": "LinkedIn-optimized professional body",
      "ctaText": "LinkedIn-optimized professional CTA"
    }
  }
}

GUIDELINES:
- Headlines: Max 40 characters for mobile, 60 for desktop
- Primary Text: 125 characters for Instagram, 255 for Facebook, 300 for LinkedIn
- CTA: Action-oriented and urgent
- Include relevant emojis for Instagram and Facebook
- Use professional tone for LinkedIn
- Focus on benefits, not just features
- Include social proof when relevant
- Create urgency without being pushy

Generate compelling, conversion-focused ad copy that aligns with the ${request.variationType} variation type.
    `.trim()
  }

  /**
   * Get specific instructions for each variation type
   */
  private getVariationInstructions(variationType: string): string {
    const instructions = {
      main: 'Main variation: Balanced, professional, and comprehensive. Best all-around performer.',
      alt1: 'Alternative 1: More casual and conversational tone. Uses questions and personal language.',
      alt2: 'Alternative 2: Benefit-focused with strong value propositions. Uses numbers and statistics.',
      alt3: 'Alternative 3: Urgent and direct. Uses scarcity and time-limited language.',
      punchy: 'Punchy: Short, bold, and attention-grabbing. Uses strong words and minimal text.',
      short: 'Short: Concise and to-the-point. Focuses on essential information only.',
      story: 'Story: Narrative-driven with emotional appeal. Uses storytelling techniques and testimonials.',
    }

    return instructions[variationType as keyof typeof instructions] || instructions.main
  }

  /**
   * Get platform-specific guidelines
   */
  private getPlatformGuidelines(platforms: string[]): string {
    const guidelines = {
      instagram: 'Visual-first, use emojis, hashtags, and casual tone. Max 125 characters for primary text.',
      facebook: 'Community-focused, use detailed descriptions and questions. Max 255 characters for primary text.',
      linkedin: 'Professional, use industry terminology and business value. Max 300 characters for primary text.',
    }

    return platforms
      .map(platform => `- ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${guidelines[platform as keyof typeof guidelines]}`)
      .join('\n')
  }

  /**
   * Parse AI response into structured ad copy
   */
  private parseAdCopyResponse(response: string, request: AdCopyGenerationRequest): AdCopyContent {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const adCopyData = JSON.parse(jsonMatch[0])

      return {
        headline: adCopyData.headline || '',
        subheadline: adCopyData.subheadline || '',
        primaryText: adCopyData.primaryText || '',
        ctaText: adCopyData.ctaText || '',
        platformSpecific: adCopyData.platformSpecific || {},
      }
    } catch (error) {
      log.error({ err: error }, 'Error parsing ad copy response')

      // Fallback structure
      return {
        headline: 'Transform Your Business Today',
        subheadline: 'Professional solutions for modern challenges',
        primaryText: 'Discover how our innovative approach can help you achieve your goals with proven results.',
        ctaText: 'Learn More',
        platformSpecific: {},
      }
    }
  }

  /**
   * Create CaptionVariation from AdCopyContent
   */
  private createVariationFromAdCopy(adCopy: AdCopyContent, variationType: string): CaptionVariation {
    return {
      id: `variation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: variationType as any,
      text: `${adCopy.headline}\n\n${adCopy.subheadline ? adCopy.subheadline + '\n\n' : ''}${adCopy.primaryText}\n\n${adCopy.ctaText}`,
      status: 'completed',
      approvalStatus: 'pending',
      approved: false,
      qualityScore: 0, // Will be calculated separately
      metadata: {
        readingGrade: 8, // Estimated
        toneClassification: ['professional', 'persuasive'],
        platform: ['instagram', 'facebook', 'linkedin'],
      },
      adCopy,
      createdAt: new Date(),
    }
  }

  /**
   * Calculate quality score for generated ad copy
   */
  private calculateQualityScore(adCopy: AdCopyContent, request: AdCopyGenerationRequest): number {
    let score = 0
    const maxScore = 100

    // Headline quality (30 points)
    if (adCopy.headline.length >= 10 && adCopy.headline.length <= 60) score += 15
    if (/\b(Amazing|Incredible|Transform|Revolutionary|Powerful|Ultimate|Guaranteed)\b/i.test(adCopy.headline)) score += 15

    // Body content quality (25 points)
    if (adCopy.primaryText.length >= 50 && adCopy.primaryText.length <= 300) score += 10
    if (/\b(benefit|advantage|result|outcome|solution)\b/i.test(adCopy.primaryText)) score += 15

    // CTA quality (20 points)
    if (adCopy.ctaText.length >= 3 && adCopy.ctaText.length <= 20) score += 10
    if (/\b(Shop|Buy|Get|Start|Try|Learn|Discover|Sign|Register|Now|Today)\b/i.test(adCopy.ctaText)) score += 10

    // Platform optimization (15 points)
    if (adCopy.platformSpecific && Object.keys(adCopy.platformSpecific).length > 0) score += 15

    // Brand alignment (10 points)
    if (request.tone.some(tone => adCopy.headline.toLowerCase().includes(tone.toLowerCase()))) score += 5
    if (request.tone.some(tone => adCopy.primaryText.toLowerCase().includes(tone.toLowerCase()))) score += 5

    return Math.min(score, maxScore)
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(adCopy: AdCopyContent, request: AdCopyGenerationRequest): string[] {
    const recommendations: string[] = []

    // Check headline
    if (adCopy.headline.length > 60) {
      recommendations.push('Shorten headline to under 60 characters for better mobile performance')
    }
    if (!/\b(Amazing|Incredible|Transform|Revolutionary|Powerful|Ultimate|Guaranteed)\b/i.test(adCopy.headline)) {
      recommendations.push('Add more powerful words to headline for better attention')
    }

    // Check body text
    if (adCopy.primaryText.length > 300) {
      recommendations.push('Consider shortening primary text for better readability')
    }
    if (!/\b(benefit|advantage|result|outcome|solution)\b/i.test(adCopy.primaryText)) {
      recommendations.push('Focus more on benefits rather than features')
    }

    // Check CTA
    if (!/\b(Shop|Buy|Get|Start|Try|Learn|Discover|Sign|Register|Now|Today)\b/i.test(adCopy.ctaText)) {
      recommendations.push('Strengthen CTA with more action-oriented language')
    }

    // Check platform optimization
    if (!adCopy.platformSpecific || Object.keys(adCopy.platformSpecific).length === 0) {
      recommendations.push('Add platform-specific variations for better performance')
    }

    return recommendations
  }
}