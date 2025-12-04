import { BrandKit, Campaign } from '../models/auth'
import { log } from '../middleware/logger'

export interface CampaignContext {
  campaign: Campaign
  brandKit: BrandKit
  targetAudience: {
    demographics?: string
    psychographics?: string
    painPoints?: string[]
    motivations?: string[]
    challenges?: string[]
  }
  messagingStrategy: {
    primaryValueProp: string
    emotionalAppeal: string
    differentiators: string[]
    trustSignals: string[]
  }
  contentGuidelines: {
    tone: string[]
    style: string[]
    keywords: string[]
    avoidWords: string[]
  }
}

export interface AssetContext {
  description: string
  category?: string
  features?: string[]
  benefits?: string[]
  useCases?: string[]
}

export class CampaignAwareService {
  /**
   * Build comprehensive campaign context from campaign and brand kit
   */
  buildCampaignContext(campaign: Campaign, brandKit: BrandKit): CampaignContext {
    const brief = campaign.brief

    // Extract and structure target audience information
    const targetAudience = {
      demographics: Array.isArray(brief?.primaryAudience?.demographics)
        ? brief.primaryAudience.demographics.join(', ')
        : brief?.primaryAudience?.demographics || brandKit.targetAudience || '',
      psychographics: Array.isArray(brief?.primaryAudience?.psychographics)
        ? brief.primaryAudience.psychographics.join(', ')
        : brief?.primaryAudience?.psychographics || '',
      painPoints: brief?.primaryAudience?.painPoints || [],
      motivations: brief?.primaryAudience?.motivations || [],
      challenges: brief?.primaryAudience?.painPoints || [],
    }

    // Build messaging strategy from campaign and brand data
    const messagingStrategy = {
      primaryValueProp: brief?.keyMessage || brandKit.valueProposition || 'High quality products and services',
      emotionalAppeal: brief?.emotionalAppeal || 'Trust and reliability',
      differentiators: [
        brandKit.uniqueValue || 'Quality and innovation',
        ...(brief?.differentiators || [])
      ],
      trustSignals: [
        brandKit.brandPersonality || 'Professional and trustworthy',
        ...(brief?.socialProof || [])
      ],
    }

    // Determine content guidelines
    const contentGuidelines = {
      tone: this.extractToneGuidelines(campaign, brandKit),
      style: this.extractStyleGuidelines(campaign, brandKit),
      keywords: this.extractKeywords(campaign, brandKit),
      avoidWords: brief?.avoidWords || [],
    }

    return {
      campaign,
      brandKit,
      targetAudience,
      messagingStrategy,
      contentGuidelines,
    }
  }

  /**
   * Generate campaign-aware prompt for AI generation
   */
  generateCampaignAwarePrompt(
    campaignContext: CampaignContext,
    assetContext: AssetContext,
    variationType: string,
    platforms: string[],
    contentType: 'caption' | 'adcopy' | 'video-script'
  ): string {
    const { campaign, brandKit, targetAudience, messagingStrategy, contentGuidelines } = campaignContext

    const audienceSection = this.buildAudienceSection(targetAudience)
    const brandSection = this.buildBrandSection(brandKit)
    const campaignSection = this.buildCampaignSection(campaign)
    const messagingSection = this.buildMessagingSection(messagingStrategy)
    const guidelinesSection = this.buildGuidelinesSection(contentGuidelines)
    const assetSection = this.buildAssetSection(assetContext)
    const platformSection = this.buildPlatformSection(platforms)
    const variationSection = this.buildVariationSection(variationType)

    const contentTypeInstructions = this.getContentTypeInstructions(contentType)

    return `
CAMPAIGN-AWARE CONTENT GENERATION

${campaignSection}

${brandSection}

${audienceSection}

${messagingSection}

${assetSection}

CONTENT TYPE: ${contentType.toUpperCase()}
${contentTypeInstructions}

PLATFORMS: ${platforms.join(', ')}
${platformSection}

VARIATION TYPE: ${variationType}
${variationSection}

CONTENT GUIDELINES:
${guidelinesSection}

OUTPUT REQUIREMENTS:
Generate ${contentType} that deeply integrates the campaign context, brand identity, and audience needs. The content should:

1. Reflect the campaign's primary objective: ${campaign.objective}
2. Speak directly to the target audience's pain points and motivations
3. Use the brand's unique voice and personality
4. Incorporate the primary value proposition: ${messagingStrategy.primaryValueProp}
5. Align with the emotional appeal: ${messagingStrategy.emotionalAppeal}
6. Highlight key differentiators: ${messagingStrategy.differentiators.join(', ')}
7. Include trust signals: ${messagingStrategy.trustSignals.join(', ')}
8. Use specified tone: ${contentGuidelines.tone.join(', ')}
9. Incorporate keywords: ${contentGuidelines.keywords.join(', ')}
10. Avoid restricted words: ${contentGuidelines.avoidWords.join(', ') || 'None specified'}

${this.getSpecificOutputFormat(contentType)}

CAMPAIGN-AWARE BEST PRACTICES:
- Reference specific campaign goals and metrics where relevant
- Use campaign-specific terminology and concepts
- Maintain consistency with previous campaign messaging
- Address audience segments identified in the campaign
- Reinforce the campaign's core message and value proposition
- Use emotional triggers relevant to the campaign's psychological approach
- Ensure content drives toward campaign conversion goals
- Align with campaign stage (awareness, consideration, conversion, retention)

Generate compelling, campaign-aware ${contentType} that feels authentic to the brand and resonates with the target audience.
    `.trim()
  }

  /**
   * Extract tone guidelines from campaign and brand
   */
  private extractToneGuidelines(campaign: Campaign, brandKit: BrandKit): string[] {
    const tones = new Set<string>()

    // Brand personality tones
    if (brandKit.brandPersonality) {
      const personality = brandKit.brandPersonality.toLowerCase()
      if (personality.includes('professional')) tones.add('professional')
      if (personality.includes('friendly')) tones.add('friendly')
      if (personality.includes('casual')) tones.add('casual')
      if (personality.includes('urgent')) tones.add('urgent')
      if (personality.includes('luxury')) tones.add('luxury')
      if (personality.includes('innovative')) tones.add('innovative')
      if (personality.includes('trustworthy')) tones.add('trustworthy')
    }

    // Campaign-specific tones
    const brief = campaign.brief
    if (brief?.tone) {
      brief.tone.forEach(tone => tones.add(tone))
    }

    // Default tones based on campaign objective
    const objectiveTones = {
      awareness: ['informative', 'engaging', 'curious'],
      consideration: ['persuasive', 'helpful', 'educational'],
      conversion: ['urgent', 'compelling', 'action-oriented'],
      retention: ['appreciative', 'valuable', 'community-focused'],
    }

    objectiveTones[campaign.objective as keyof typeof objectiveTones]?.forEach(tone =>
      tones.add(tone)
    )

    return Array.from(tones).slice(0, 5) // Limit to 5 most relevant tones
  }

  /**
   * Extract style guidelines from campaign and brand
   */
  private extractStyleGuidelines(campaign: Campaign, brandKit: BrandKit): string[] {
    const styles = []

    // Brand colors and visual style
    if (brandKit.colors?.primary) {
      styles.push(`Primary brand color: ${brandKit.colors.primary}`)
    }
    if (brandKit.colors?.secondary) {
      styles.push(`Secondary brand color: ${brandKit.colors.secondary}`)
    }

    // Campaign style preferences
    const brief = campaign.brief
    if (brief?.style) {
      brief.style.forEach(style => styles.push(style))
    }

    // Default style guidelines
    styles.push('Consistent brand voice throughout')
    styles.push('Clear and concise messaging')
    styles.push('Mobile-first approach for social media')

    return styles
  }

  /**
   * Extract keywords from campaign and brand
   */
  private extractKeywords(campaign: Campaign, brandKit: BrandKit): string[] {
    const keywords = new Set<string>()

    // Brand keywords
    if (brandKit.keywords) {
      brandKit.keywords.forEach(keyword => keywords.add(keyword))
    }

    // Campaign keywords
    const brief = campaign.brief
    if (brief?.keywords) {
      brief.keywords.forEach(keyword => keywords.add(keyword))
    }

    // Extract keywords from campaign name and key message
    if (campaign.name) {
      campaign.name.split(/\s+/).forEach(word => {
        if (word.length > 3) keywords.add(word.toLowerCase())
      })
    }

    if (brief?.keyMessage) {
      brief.keyMessage.split(/\s+/).forEach(word => {
        if (word.length > 3) keywords.add(word.toLowerCase())
      })
    }

    return Array.from(keywords).slice(0, 10) // Limit to 10 most relevant keywords
  }

  /**
   * Build audience section of prompt
   */
  private buildAudienceSection(targetAudience: CampaignContext['targetAudience']): string {
    return `
TARGET AUDIENCE:
Demographics: ${targetAudience.demographics || 'General audience'}
Psychographics: ${targetAudience.psychographics || 'Standard consumer behavior'}
Pain Points: ${targetAudience.painPoints?.join(', ') || 'Not specified'}
Motivations: ${targetAudience.motivations?.join(', ') || 'Not specified'}
Challenges: ${targetAudience.challenges?.join(', ') || 'Not specified'}
    `.trim()
  }

  /**
   * Build brand section of prompt
   */
  private buildBrandSection(brandKit: BrandKit): string {
    return `
BRAND IDENTITY:
Brand Name: ${brandKit.name || 'Not specified'}
Brand Personality: ${brandKit.brandPersonality || 'Professional and trustworthy'}
Value Proposition: ${brandKit.valueProposition || 'High quality products and services'}
Unique Value: ${brandKit.uniqueValue || 'Quality and innovation'}
Target Audience: ${brandKit.targetAudience || 'General consumers'}
Brand Colors: ${brandKit.colors?.primary || 'Not specified'}, ${brandKit.colors?.secondary || 'Not specified'}
Keywords: ${brandKit.keywords?.join(', ') || 'Not specified'}
    `.trim()
  }

  /**
   * Build campaign section of prompt
   */
  private buildCampaignSection(campaign: Campaign): string {
    const brief = campaign.brief
    return `
CAMPAIGN DETAILS:
Campaign Name: ${campaign.name}
Objective: ${campaign.objective}
Primary CTA: ${campaign.primaryCTA || 'Learn more'}
Key Message: ${brief?.keyMessage || 'Not specified'}
Emotional Appeal: ${brief?.emotionalAppeal || 'Trust and reliability'}
Primary Audience: ${brief?.primaryAudience?.demographics || 'Not specified'}
Differentiators: ${brief?.differentiators?.join(', ') || 'Not specified'}
Social Proof: ${brief?.socialProof?.join(', ') || 'Not specified'}
Campaign Stage: ${campaign.objective} (funnel stage: ${campaign.funnelStage || 'middle'})
    `.trim()
  }

  /**
   * Build messaging section of prompt
   */
  private buildMessagingSection(messagingStrategy: CampaignContext['messagingStrategy']): string {
    return `
MESSAGING STRATEGY:
Primary Value Proposition: ${messagingStrategy.primaryValueProp}
Emotional Appeal: ${messagingStrategy.emotionalAppeal}
Key Differentiators: ${messagingStrategy.differentiators.join(', ')}
Trust Signals: ${messagingStrategy.trustSignals.join(', ')}
    `.trim()
  }

  /**
   * Build guidelines section of prompt
   */
  private buildGuidelinesSection(contentGuidelines: CampaignContext['contentGuidelines']): string {
    return `
CONTENT GUIDELINES:
Tone: ${contentGuidelines.tone.join(', ')}
Style: ${contentGuidelines.style.join(', ')}
Keywords to Include: ${contentGuidelines.keywords.join(', ')}
Words to Avoid: ${contentGuidelines.avoidWords.join(', ') || 'None specified'}
    `.trim()
  }

  /**
   * Build asset section of prompt
   */
  private buildAssetSection(assetContext: AssetContext): string {
    return `
ASSET DETAILS:
Description: ${assetContext.description}
Category: ${assetContext.category || 'General'}
Key Features: ${assetContext.features?.join(', ') || 'Not specified'}
Benefits: ${assetContext.benefits?.join(', ') || 'Not specified'}
Use Cases: ${assetContext.useCases?.join(', ') || 'Not specified'}
    `.trim()
  }

  /**
   * Build platform section of prompt
   */
  private buildPlatformSection(platforms: string[]): string {
    const platformGuidelines = {
      instagram: 'Visual-first, emojis, hashtags, casual tone, stories format',
      facebook: 'Community-focused, detailed descriptions, questions, longer posts',
      linkedin: 'Professional, industry terminology, business value, articles',
    }

    return platforms
      .map(platform => `- ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${platformGuidelines[platform as keyof typeof platformGuidelines]}`)
      .join('\n')
  }

  /**
   * Build variation section of prompt
   */
  private buildVariationSection(variationType: string): string {
    const variationInstructions = {
      main: 'Main variation: Balanced, professional, and comprehensive. Best all-around performer.',
      alt1: 'Alternative 1: More casual and conversational tone. Uses questions and personal language.',
      alt2: 'Alternative 2: Benefit-focused with strong value propositions. Uses numbers and statistics.',
      alt3: 'Alternative 3: Urgent and direct. Uses scarcity and time-limited language.',
      punchy: 'Punchy: Short, bold, and attention-grabbing. Uses strong words and minimal text.',
      short: 'Short: Concise and to-the-point. Focuses on essential information only.',
      story: 'Story: Narrative-driven with emotional appeal. Uses storytelling techniques.',
    }

    return variationInstructions[variationType as keyof typeof variationInstructions] || variationInstructions.main
  }

  /**
   * Get content type specific instructions
   */
  private getContentTypeInstructions(contentType: string): string {
    const instructions = {
      caption: 'Generate engaging social media captions that encourage interaction and sharing.',
      adcopy: 'Generate conversion-focused advertising copy with clear CTAs and value propositions.',
      'video-script': 'Generate compelling video scripts that tell a story and drive action.',
    }

    return instructions[contentType as keyof typeof instructions] || instructions.caption
  }

  /**
   * Get specific output format for each content type
   */
  private getSpecificOutputFormat(contentType: string): string {
    const formats = {
      caption: `
OUTPUT FORMAT:
{
  "caption": "Engaging caption text",
  "hashtags": ["relevant", "hashtags"],
  "emojiPlacement": "strategic emoji usage",
  "callToAction": "clear engagement prompt",
  "platformSpecific": {
    "instagram": "instagram-optimized version",
    "facebook": "facebook-optimized version",
    "linkedin": "linkedin-optimized version"
  }
}
      `,
      adcopy: `
OUTPUT FORMAT:
{
  "headline": "Attention-grabbing headline",
  "subheadline": "Supporting subheadline",
  "primaryText": "Compelling body text",
  "ctaText": "Clear call-to-action",
  "platformSpecific": {
    "instagram": "instagram-optimized ad copy",
    "facebook": "facebook-optimized ad copy",
    "linkedin": "linkedin-optimized ad copy"
  }
}
      `,
      'video-script': `
OUTPUT FORMAT:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "type": "hook",
      "duration": 3,
      "script": "Opening hook",
      "visualNotes": "Visual description"
    }
  ],
  "totalDuration": 15,
  "cta": "Strong call-to-action",
  "platform": "primary platform"
}
      `,
    }

    return formats[contentType as keyof typeof formats] || formats.caption
  }

  /**
   * Analyze campaign context quality and provide recommendations
   */
  analyzeCampaignContext(campaignContext: CampaignContext): {
    score: number
    gaps: string[]
    recommendations: string[]
  } {
    let score = 0
    const gaps: string[] = []
    const recommendations: string[] = []

    // Check target audience completeness (25 points)
    if (campaignContext.targetAudience.demographics) score += 8
    else gaps.push('Missing target audience demographics')

    if (campaignContext.targetAudience.painPoints && campaignContext.targetAudience.painPoints.length > 0) score += 9
    else gaps.push('Missing audience pain points')

    if (campaignContext.targetAudience.motivations && campaignContext.targetAudience.motivations.length > 0) score += 8
    else gaps.push('Missing audience motivations')

    // Check messaging strategy (25 points)
    if (campaignContext.messagingStrategy.primaryValueProp) score += 10
    else gaps.push('Missing primary value proposition')

    if (campaignContext.messagingStrategy.differentiators.length > 0) score += 8
    else gaps.push('Missing brand differentiators')

    if (campaignContext.messagingStrategy.trustSignals.length > 0) score += 7
    else gaps.push('Missing trust signals')

    // Check content guidelines (25 points)
    if (campaignContext.contentGuidelines.tone.length > 0) score += 10
    else gaps.push('Missing tone guidelines')

    if (campaignContext.contentGuidelines.keywords.length > 0) score += 8
    else gaps.push('Missing keywords')

    if (campaignContext.contentGuidelines.avoidWords.length > 0) score += 7
    else gaps.push('Missing word restrictions')

    // Check brand completeness (25 points)
    if (campaignContext.brandKit.brandPersonality) score += 10
    else gaps.push('Missing brand personality')

    if (campaignContext.brandKit.valueProposition) score += 8
    else gaps.push('Missing value proposition')

    if (campaignContext.brandKit.uniqueValue) score += 7
    else gaps.push('Missing unique value proposition')

    // Generate recommendations based on gaps
    if (gaps.includes('Missing audience pain points')) {
      recommendations.push('Add specific audience pain points to improve resonance')
    }
    if (gaps.includes('Missing brand differentiators')) {
      recommendations.push('Define what makes your brand unique compared to competitors')
    }
    if (gaps.includes('Missing keywords')) {
      recommendations.push('Add campaign-specific keywords for better SEO and relevance')
    }
    if (gaps.includes('Missing tone guidelines')) {
      recommendations.push('Define specific tone guidelines for consistent brand voice')
    }

    return {
      score: Math.min(score, 100),
      gaps,
      recommendations,
    }
  }
}