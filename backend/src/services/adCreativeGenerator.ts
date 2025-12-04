import OpenAI from 'openai'
import {
  AdCreative,
  AdCreativeSlot,
  AdCreativeGenerationRequest,
  AdCreativeGenerationResult,
  AdCreativeTemplate,
  SLOT_CONFIGS,
  FUNNEL_STAGE_STRATEGIES,
  PLATFORM_GUIDELINES,
} from '../types/adCreative'
import { Campaign, BrandKit } from '../models/auth'
import { log } from '../middleware/logger'

export class AdCreativeGenerator {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Generate complete ad creative with slot-based structure
   */
  async generateAdCreative(
    request: AdCreativeGenerationRequest,
    campaign: any,
    brandKit: any
  ): Promise<AdCreativeGenerationResult> {
    try {
      log.info(
        { campaignId: request.campaignId },
        `Generating ad creative for campaign`
      )

      // Generate slot content using AI
      const generatedSlots = await this.generateSlots(
        request,
        campaign,
        brandKit
      )

      // Create platform-specific adaptations
      const platformVersions = await this.generatePlatformVersions(
        generatedSlots,
        request.platforms,
        brandKit
      )

      // Create main ad creative
      const adCreative: AdCreative = {
        id: `ad-creative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        campaignId: request.campaignId,
        brandKitId: request.brandKitId,
        name: `${campaign.name} - ${request.objective} - ${request.funnelStage}`,
        objective: request.objective,
        funnelStage: request.funnelStage,
        primaryPlatform:
          request.platforms.length === 1 ? request.platforms[0] : 'multi',
        status: 'draft',
        slots: generatedSlots,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }

      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(
        adCreative,
        request,
        brandKit
      )

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        adCreative,
        request
      )

      // Estimate performance
      const estimatedPerformance = await this.estimatePerformance(
        adCreative,
        request
      )

      log.info({ adCreativeId: adCreative.id }, `Ad creative generated`)

      return {
        adCreative,
        generatedSlots,
        platformVersions,
        qualityScore,
        recommendations,
        estimatedPerformance,
      }
    } catch (error) {
      log.error({ err: error }, 'Ad creative generation error')
      throw new Error('Failed to generate ad creative')
    }
  }

  /**
   * Generate individual slots based on campaign and brand requirements
   */
  private async generateSlots(
    request: AdCreativeGenerationRequest,
    campaign: any,
    brandKit: any
  ): Promise<AdCreativeSlot[]> {
    const strategy = FUNNEL_STAGE_STRATEGIES[request.funnelStage]

    const prompt = this.buildSlotGenerationPrompt(
      request,
      campaign,
      brandKit,
      strategy
    )

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert copywriter specializing in digital advertising. Generate compelling, conversion-focused ad copy that follows best practices for each platform and funnel stage.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Failed to generate slot content')
    }

    return this.parseSlotResponse(response, request)
  }

  /**
   * Build comprehensive prompt for slot generation
   */
  private buildSlotGenerationPrompt(
    request: AdCreativeGenerationRequest,
    campaign: any,
    brandKit: any,
    strategy: any
  ): string {
    const brief = (campaign.briefData as any) || campaign.brief
    const brandPersonality =
      brandKit.brandPersonality || 'Professional and trustworthy'
    const colors = brandKit.colors || { primary: 'Not specified', secondary: 'Not specified' }

    return `
Generate ${request.variations} variations of ad creative content for the following campaign:

CAMPAIGN DETAILS:
- Campaign Name: ${campaign.name}
- Objective: ${request.objective}
- Funnel Stage: ${request.funnelStage} (${strategy.focus})
- Primary Platform: ${request.platforms.join(', ')}
- Key Message: ${request.keyMessage}
- Target CTA: ${request.cta}

TARGET AUDIENCE:
- Demographics: ${request.targetAudience.demographics}
- Psychographics: ${request.targetAudience.psychographics}
- Pain Points: ${request.targetAudience.painPoints?.join(', ') || 'Not specified'}

BRAND IDENTITY:
- Brand Personality: ${brandPersonality}
- Brand Colors: ${colors.primary || 'Not specified'}, ${colors.secondary || 'Not specified'}
- Target Audience: ${brandKit.targetAudience || 'Not specified'}
- Value Proposition: ${brandKit.valueProposition || 'Not specified'}

CAMPAIGN BRIEF:
${
  brief
    ? `
- Primary KPI: ${brief.primaryKPI || 'Not specified'}
- Key Message: ${brief.keyMessage || 'Not specified'}
- Emotional Appeal: ${brief.emotionalAppeal || 'Not specified'}
- Primary Audience: ${brief.primaryAudience?.demographics || 'Not specified'}
`
    : 'No detailed brief provided'
}

FUNNEL STAGE STRATEGY:
Focus: ${strategy.focus}
Key Elements: ${strategy.keyElements.join(', ')}
Recommended Tone: ${strategy.tone.join(', ')}
CTA Types: ${strategy.ctaTypes.join(', ')}

REQUIRED OUTPUT:
Generate content in this JSON format:
{
  "headline": {
    "content": "Main headline",
    "variations": ["Variation 1", "Variation 2", "Variation 3"],
    "metadata": {
      "tone": ["confident", "action-oriented"],
      "emotionalImpact": ["urgent", "empowering"],
      "targetKPI": "clicks"
    }
  },
  "subheadline": {
    "content": "Supporting subheadline",
    "variations": ["Variation 1", "Variation 2"],
    "metadata": {
      "tone": ["informative", "benefit-focused"]
    }
  },
  "body": {
    "content": "Main body text",
    "variations": ["Variation 1", "Variation 2"],
    "metadata": {
      "tone": ["persuasive", "trust-building"],
      "emotionalImpact": ["reassuring", "motivating"]
    }
  },
  "cta": {
    "content": "Call to action",
    "variations": ["Variation 1", "Variation 2"],
    "metadata": {
      "tone": ["urgent", "action-oriented"]
    }
  },
  "primaryText": {
    "content": "Extended primary text for social media",
    "variations": ["Variation 1", "Variation 2"],
    "metadata": {
      "tone": ["engaging", "conversational"]
    }
  }
}

GUIDELINES:
- Headlines: Max ${SLOT_CONFIGS.headline.maxLength.instagram} chars (Instagram), ${SLOT_CONFIGS.headline.maxLength.facebook} chars (Facebook), ${SLOT_CONFIGS.headline.maxLength.linkedin} chars (LinkedIn)
- Body: Max ${SLOT_CONFIGS.body.maxLength.instagram} chars (Instagram), ${SLOT_CONFIGS.body.maxLength.facebook} chars (Facebook), ${SLOT_CONFIGS.body.maxLength.linkedin} chars (LinkedIn)
- CTA: Max ${SLOT_CONFIGS.cta.maxLength.instagram} chars (Instagram), ${SLOT_CONFIGS.cta.maxLength.facebook} chars (Facebook), ${SLOT_CONFIGS.cta.maxLength.linkedin} chars (LinkedIn)
- Primary Text: Max ${SLOT_CONFIGS.primaryText.maxLength.instagram} chars (Instagram), ${SLOT_CONFIGS.primaryText.maxLength.facebook} chars (Facebook), ${SLOT_CONFIGS.primaryText.maxLength.linkedin} chars (LinkedIn)

${PLATFORM_GUIDELINES.instagram.bestPractices
  .slice(0, 3)
  .map((b) => `- Instagram: ${b}`)
  .join('\n')}
${PLATFORM_GUIDELINES.facebook.bestPractices
  .slice(0, 3)
  .map((b) => `- Facebook: ${b}`)
  .join('\n')}
${PLATFORM_GUIDELINES.linkedin.bestPractices
  .slice(0, 3)
  .map((b) => `- LinkedIn: ${b}`)
  .join('\n')}

Make sure to:
1. Create compelling, action-oriented copy
2. Include ${request.tone.join(', ')} tones
3. Address the target audience pain points
4. Highlight unique value propositions
5. Follow platform character limits
6. Generate ${request.variations} variations for each slot
7. Align with ${request.objective} objective and ${request.funnelStage} funnel stage
`
  }

  /**
   * Parse AI response into structured slots
   */
  private parseSlotResponse(
    response: string,
    request: AdCreativeGenerationRequest
  ): AdCreativeSlot[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const slotData = JSON.parse(jsonMatch[0])
      const slots: AdCreativeSlot[] = []

      // Create slot objects from parsed data
      const slotTypes = [
        'headline',
        'subheadline',
        'body',
        'cta',
        'primaryText',
      ] as const

      for (const slotType of slotTypes) {
        if (slotData[slotType]) {
          const slot: AdCreativeSlot = {
            id: `${slotType}-${Date.now()}`,
            type: slotType,
            content: slotData[slotType].content || '',
            variations: slotData[slotType].variations || [],
            maxLength:
              SLOT_CONFIGS[slotType]?.maxLength?.instagram || undefined,
            metadata: slotData[slotType].metadata || {},
          }

          // Add platform-specific adaptations
          slot.platformSpecific = {}
          request.platforms.forEach((platform) => {
            const maxLength = SLOT_CONFIGS[slotType]?.maxLength?.[platform]
            if (maxLength && slot.content.length > maxLength) {
              // Truncate content for platform if needed
              slot.platformSpecific![platform] =
                slot.content.substring(0, maxLength - 3) + '...'
            }
          })

          slots.push(slot)
        }
      }

      return slots
    } catch (error) {
      log.error({ err: error }, 'Error parsing slot response')
      throw new Error('Failed to parse generated slots')
    }
  }

  /**
   * Generate platform-specific versions
   */
  private async generatePlatformVersions(
    slots: AdCreativeSlot[],
    platforms: string[],
    brandKit: BrandKit
  ): Promise<Record<string, AdCreative>> {
    const versions: Record<string, AdCreative> = {}

    for (const platform of platforms) {
      const adaptedSlots = slots.map((slot) => ({
        ...slot,
        platformSpecific: {
          ...slot.platformSpecific,
          [platform]: this.adaptContentForPlatform(slot.content, platform),
        },
      }))

      versions[platform] = {
        id: `ad-creative-${Date.now()}-${platform}`,
        campaignId: slots[0]?.id || '',
        brandKitId: '',
        name: `Platform-specific: ${platform}`,
        objective: 'consideration' as any,
        funnelStage: 'middle',
        primaryPlatform: platform as any,
        status: 'draft',
        slots: adaptedSlots,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }
    }

    return versions
  }

  /**
   * Adapt content for specific platform requirements
   */
  private adaptContentForPlatform(content: string, platform: string): string {
    const guidelines =
      PLATFORM_GUIDELINES[platform as keyof typeof PLATFORM_GUIDELINES]

    if (!guidelines) return content

    // Platform-specific adaptations
    switch (platform) {
      case 'instagram':
        // Add emojis if not present
        if (
          !/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(
            content
          )
        ) {
          content = `✨ ${content}`
        }
        break

      case 'linkedin':
        // Make more professional
        content = content.replace(/!/g, '.').replace(/\s+/g, ' ')
        break

      case 'facebook':
        // Add engagement elements
        if (!content.includes('?') && !content.includes('!')) {
          content = `${content} 🔥`
        }
        break
    }

    return content
  }

  /**
   * Calculate quality score for generated creative
   */
  private async calculateQualityScore(
    adCreative: AdCreative,
    request: AdCreativeGenerationRequest,
    brandKit: any
  ): Promise<number> {
    let score = 0
    const maxScore = 100

    // Check slot completeness (30 points)
    const requiredSlots = ['headline', 'body', 'cta']
    const hasRequiredSlots = requiredSlots.every((slotType) =>
      adCreative.slots.some((slot) => slot.type === slotType && slot.content)
    )
    if (hasRequiredSlots) score += 30

    // Check character limits (20 points)
    const primaryPlatform = adCreative.primaryPlatform
    let withinLimits = 0
    adCreative.slots.forEach((slot) => {
      const maxLength = SLOT_CONFIGS[slot.type]?.maxLength?.[primaryPlatform]
      if (maxLength && slot.content.length <= maxLength) {
        withinLimits++
      }
    })
    if (withinLimits === adCreative.slots.length) score += 20

    // Check variations (15 points)
    const hasVariations = adCreative.slots.every(
      (slot) => slot.variations && slot.variations.length > 0
    )
    if (hasVariations) score += 15

    // Check alignment with brief (15 points)
    const brief = request.targetAudience
    const hasAudienceAlignment = brief.demographics && brief.psychographics
    if (hasAudienceAlignment) score += 15

    // Check tone alignment (10 points)
    const brandToneMatches = request.tone.some((tone) =>
      brandKit.brandPersonality?.toLowerCase().includes(tone.toLowerCase())
    )
    if (brandToneMatches) score += 10

    // Check objective alignment (10 points)
    const objectiveMatch = adCreative.objective === request.objective
    if (objectiveMatch) score += 10

    return Math.min(score, maxScore)
  }

  /**
   * Generate improvement recommendations
   */
  private async generateRecommendations(
    adCreative: AdCreative,
    request: AdCreativeGenerationRequest
  ): Promise<string[]> {
    const recommendations: string[] = []

    // Check for missing slots
    const requiredSlots = ['headline', 'body', 'cta']
    const missingSlots = requiredSlots.filter(
      (slotType) =>
        !adCreative.slots.some((slot) => slot.type === slotType && slot.content)
    )
    if (missingSlots.length > 0) {
      recommendations.push(`Add missing slots: ${missingSlots.join(', ')}`)
    }

    // Check character limits
    adCreative.slots.forEach((slot) => {
      const maxLength = SLOT_CONFIGS[slot.type]?.maxLength?.instagram
      if (maxLength && slot.content.length > maxLength) {
        recommendations.push(
          `Shorten ${slot.type} to ${maxLength} characters or less`
        )
      }
    })

    // Check variations
    adCreative.slots.forEach((slot) => {
      if (!slot.variations || slot.variations.length === 0) {
        recommendations.push(
          `Add variations for ${slot.type} to enable A/B testing`
        )
      }
    })

    // Check platform optimization
    if (!adCreative.primaryPlatform || adCreative.primaryPlatform === 'multi') {
      recommendations.push(
        'Consider creating platform-specific versions for better performance'
      )
    }

    // Check CTA strength
    const ctaSlot = adCreative.slots.find((slot) => slot.type === 'cta')
    if (
      ctaSlot &&
      !ctaSlot.content.match(
        /\b(shop|buy|get|start|try|learn|discover|sign|register)\b/i
      )
    ) {
      recommendations.push('Strengthen CTA with more action-oriented language')
    }

    // Check emotional appeal
    const hasEmotionalWords = adCreative.slots.some((slot) =>
      slot.content.match(
        /\b(amazing|incredible|transform|revolutionary|breakthrough|powerful|unforgettable)\b/i
      )
    )
    if (!hasEmotionalWords) {
      recommendations.push(
        'Add more emotionally resonant language to increase engagement'
      )
    }

    return recommendations
  }

  /**
   * Estimate performance metrics
   */
  private async estimatePerformance(
    adCreative: AdCreative,
    request: AdCreativeGenerationRequest
  ): Promise<{ ctr: number; conversionRate: number; engagementRate: number }> {
    // Base estimates by objective
    const baseMetrics = {
      awareness: { ctr: 0.015, conversionRate: 0.002, engagementRate: 0.035 },
      consideration: {
        ctr: 0.025,
        conversionRate: 0.008,
        engagementRate: 0.045,
      },
      conversion: { ctr: 0.035, conversionRate: 0.025, engagementRate: 0.04 },
      retention: { ctr: 0.02, conversionRate: 0.015, engagementRate: 0.06 },
    }

    const base = baseMetrics[request.objective]

    // Adjust based on quality score (this would be calculated earlier)
    let qualityMultiplier = 1.0
    // if (qualityScore >= 80) qualityMultiplier = 1.2
    // else if (qualityScore >= 60) qualityMultiplier = 1.0
    // else qualityMultiplier = 0.8

    // Adjust based on platform
    const platformMultipliers = {
      instagram: 1.1,
      facebook: 1.0,
      linkedin: 0.9,
    }

    let platformMultiplier = 1.0
    request.platforms.forEach((platform) => {
      platformMultiplier = Math.max(
        platformMultiplier,
        platformMultipliers[platform] || 1.0
      )
    })

    return {
      ctr: base.ctr * qualityMultiplier * platformMultiplier,
      conversionRate:
        base.conversionRate * qualityMultiplier * platformMultiplier,
      engagementRate:
        base.engagementRate * qualityMultiplier * platformMultiplier,
    }
  }
}
