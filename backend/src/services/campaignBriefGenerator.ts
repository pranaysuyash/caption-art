import OpenAI from 'openai'
import { Campaign, BrandKit } from '../models/auth'
import { log } from '../middleware/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CreativeRequirements {
  // Visual Style Requirements
  visualStyle: {
    mood: string[] // ['energetic', 'sophisticated', 'approachable']
    colorScheme: string[] // ['#FF6B6B', '#4ECDC4', '#45B7D1']
    composition: string // 'hero-product', 'lifestyle', 'flat-lay'
    typography: string // 'bold-headlines', 'elegant-script', 'clean-sans'
  }

  // Content Requirements
  messaging: {
    tone: string[] // ['confident', 'inspiring', 'trustworthy']
    focusAreas: string[] // ['product-benefits', 'emotional-appeal', 'social-proof']
    keyMessages: string[] // ['Premium quality', 'Sustainable materials', 'Limited time']
    emotionalDrivers: string[] // ['aspiration', 'security', 'belonging']
  }

  // Structural Requirements
  structure: {
    headlineStyle: string // 'question-based', 'benefit-driven', 'curiosity-gap'
    bodyFormat: string[] // ['bullet-points', 'storytelling', 'problem-solution']
    ctaPlacement: string // 'primary-bottom', 'secondary-mid', 'multiple-options']
    contentDensity: 'minimal' | 'moderate' | 'detailed'
  }

  // Platform Adaptations
  platformSpecific: {
    instagram: {
      visualPriority: 'lifestyle' | 'product' | 'user-generated'
      captionLength: 'short' | 'medium' | 'long'
      hashtagStrategy: 'broad' | 'niche' | 'branded'
      storyElements: string[] // ['polls', 'swipe-up', 'countdown']
    }
    facebook: {
      contentFocus: 'informational' | 'entertaining' | 'promotional'
      engagementType: 'discussion' | 'sharing' | 'conversion'
      adFormat: 'image' | 'video' | 'carousel'
    }
    linkedin: {
      professionalAngle: string // 'innovation', 'leadership', 'corporate-responsibility'
      contentDepth: 'high-level' | 'detailed-analysis'
      networkStrategy: 'employee-advocacy' | 'thought-leadership'
    }
  }
}

export class CampaignBriefGenerator {
  /**
   * Generate creative requirements from campaign brief
   */
  static async generateCreativeRequirements(
    campaign: any,
    brandKit: any
  ): Promise<CreativeRequirements> {
    try {
      const brief = (campaign.briefData as any) || campaign.brief
      const brandContext = {
        brandPersonality: brandKit.brandPersonality,
        targetAudience: brandKit.targetAudience,
        valueProposition: brandKit.valueProposition,
        toneStyle: brandKit.toneStyle,
        colors: brandKit.colors,
      }

      const prompt = this.buildCreativeRequirementsPrompt(
        campaign,
        brandContext
      )

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a senior creative strategist and AI creative director. Your role is to translate client campaign briefs into precise creative requirements that will guide AI-generated advertising creative.

Analyze the campaign brief and brand context to generate detailed creative specifications. Focus on:
1. Visual style guidance (mood, colors, composition, typography)
2. Messaging strategy (tone, focus areas, key messages, emotional drivers)
3. Content structure (headline approach, body format, CTA placement)
4. Platform-specific adaptations for Instagram, Facebook, and LinkedIn

Return your analysis as a JSON object following this exact structure:
{
  "visualStyle": {
    "mood": ["mood1", "mood2"],
    "colorScheme": ["#color1", "#color2", "#color3"],
    "composition": "composition-type",
    "typography": "typography-style"
  },
  "messaging": {
    "tone": ["tone1", "tone2"],
    "focusAreas": ["area1", "area2"],
    "keyMessages": ["message1", "message2"],
    "emotionalDrivers": ["driver1", "driver2"]
  },
  "structure": {
    "headlineStyle": "headline-type",
    "bodyFormat": ["format1", "format2"],
    "ctaPlacement": "placement-type",
    "contentDensity": "minimal|moderate|detailed"
  },
  "platformSpecific": {
    "instagram": {
      "visualPriority": "lifestyle|product|user-generated",
      "captionLength": "short|medium|long",
      "hashtagStrategy": "broad|niche|branded",
      "storyElements": ["element1", "element2"]
    },
    "facebook": {
      "contentFocus": "informational|entertaining|promotional",
      "engagementType": "discussion|sharing|conversion",
      "adFormat": "image|video|carousel"
    },
    "linkedin": {
      "professionalAngle": "innovation|leadership|corporate-responsibility",
      "contentDepth": "high-level|detailed-analysis",
      "networkStrategy": "employee-advocacy|thought-leadership"
    }
  }
}

Be specific and strategic in your recommendations. Consider the campaign objective, target audience, competitive positioning, and brand personality.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      })

      const requirements = completion.choices[0]?.message?.content?.trim()

      if (!requirements) {
        throw new Error('Failed to generate creative requirements')
      }

      const parsedRequirements = JSON.parse(
        requirements
      ) as CreativeRequirements
      return this.validateAndNormalizeRequirements(
        parsedRequirements,
        campaign,
        brandKit
      )
    } catch (error) {
      log.error(
        { err: error, campaignId: campaign.id },
        'Error generating creative requirements'
      )
      return this.getFallbackRequirements(campaign, brandKit)
    }
  }

  /**
   * Build the prompt for creative requirements generation
   */
  private static buildCreativeRequirementsPrompt(
    campaign: Campaign,
    brandContext: any
  ): string {
    const brief = (campaign.briefData as any) || campaign.brief

    return `
CAMPAIGN BRIEF ANALYSIS

Campaign: ${campaign.name}
Objective: ${(campaign.briefData as any)?.objective || campaign.objective}
Funnel Stage: ${(campaign.briefData as any)?.funnelStage || campaign.funnelStage}
Launch Type: ${campaign.launchType}

CLIENT CONTEXT:
${brief?.clientOverview || 'Not specified'}
Campaign Purpose: ${brief?.campaignPurpose || 'Not specified'}

BUSINESS GOALS:
Primary KPI: ${brief?.primaryKPI || 'Not specified'}
Secondary KPIs: ${brief?.secondaryKPIs?.join(', ') || 'Not specified'}

COMPETITIVE LANDSCAPE:
Competitor Insights: ${brief?.competitorInsights?.join('; ') || 'Not specified'}
Differentiators: ${brief?.differentiators?.join(', ') || 'Not specified'}

TARGET AUDIENCE:
${brief?.primaryAudience?.demographics || 'Not specified'}
Psychographics: ${brief?.primaryAudience?.psychographics || 'Not specified'}
Pain Points: ${brief?.primaryAudience?.painPoints?.join(', ') || 'Not specified'}
Motivations: ${brief?.primaryAudience?.motivations?.join(', ') || 'Not specified'}

MESSAGE STRATEGY:
Key Message: ${brief?.keyMessage || 'Not specified'}
Supporting Points: ${brief?.supportingPoints?.join(', ') || 'Not specified'}
Emotional Appeal: ${brief?.emotionalAppeal || 'Not specified'}

MANDATORIES & CONSTRAINTS:
Must Include: ${brief?.mandatoryInclusions?.join(', ') || 'Not specified'}
Must Exclude: ${brief?.mandatoryExclusions?.join(', ') || 'Not specified'}

PLATFORM STRATEGY:
${campaign.placements.join(', ')}
Instagram Focus: ${brief?.platformSpecific?.instagram || 'Not specified'}
Facebook Focus: ${brief?.platformSpecific?.facebook || 'Not specified'}
LinkedIn Focus: ${brief?.platformSpecific?.linkedin || 'Not specified'}

TIMING & URGENCY:
Duration: ${brief?.campaignDuration || 'Not specified'}
Seasonality: ${brief?.seasonality || 'Not specified'}
Urgency: ${brief?.urgency || 'Not specified'}

BRAND CONTEXT:
Brand Personality: ${brandContext.brandPersonality || 'Not specified'}
Target Audience: ${brandContext.targetAudience || 'Not specified'}
Value Proposition: ${brandContext.valueProposition || 'Not specified'}
Tone Style: ${brandContext.toneStyle || 'Not specified'}

OFFER & CTA:
Primary Offer: ${campaign.primaryOffer || 'Not specified'}
Primary CTA: ${(campaign.callToAction as any) || campaign.primaryCTA || 'Not specified'}
Secondary CTA: ${campaign.secondaryCTA || 'Not specified'}

Based on this comprehensive brief, generate detailed creative requirements that will guide effective creative development.
`
  }

  /**
   * Validate and normalize the generated requirements
   */
  private static validateAndNormalizeRequirements(
    requirements: CreativeRequirements,
    campaign: Campaign,
    brandKit: BrandKit
  ): CreativeRequirements {
    // Ensure all required fields exist
    return {
      visualStyle: {
        mood: requirements.visualStyle.mood || [],
        colorScheme: requirements.visualStyle.colorScheme || [
          brandKit.colors.primary,
          brandKit.colors.secondary,
          brandKit.colors.tertiary,
        ],
        composition: requirements.visualStyle.composition || 'hero-product',
        typography: requirements.visualStyle.typography || 'clean-sans',
      },
      messaging: {
        tone: requirements.messaging.tone || [],
        focusAreas: requirements.messaging.focusAreas || [],
        keyMessages: requirements.messaging.keyMessages || [],
        emotionalDrivers: requirements.messaging.emotionalDrivers || [],
      },
      structure: {
        headlineStyle: requirements.structure.headlineStyle || 'benefit-driven',
        bodyFormat: requirements.structure.bodyFormat || ['bullet-points'],
        ctaPlacement: requirements.structure.ctaPlacement || 'primary-bottom',
        contentDensity: requirements.structure.contentDensity || 'moderate',
      },
      platformSpecific: {
        instagram: {
          visualPriority:
            requirements.platformSpecific.instagram.visualPriority ||
            'lifestyle',
          captionLength:
            requirements.platformSpecific.instagram.captionLength || 'medium',
          hashtagStrategy:
            requirements.platformSpecific.instagram.hashtagStrategy || 'niche',
          storyElements:
            requirements.platformSpecific.instagram.storyElements || [],
        },
        facebook: {
          contentFocus:
            requirements.platformSpecific.facebook.contentFocus ||
            'promotional',
          engagementType:
            requirements.platformSpecific.facebook.engagementType ||
            'conversion',
          adFormat: requirements.platformSpecific.facebook.adFormat || 'image',
        },
        linkedin: {
          professionalAngle:
            requirements.platformSpecific.linkedin.professionalAngle ||
            'innovation',
          contentDepth:
            requirements.platformSpecific.linkedin.contentDepth || 'high-level',
          networkStrategy:
            requirements.platformSpecific.linkedin.networkStrategy ||
            'thought-leadership',
        },
      },
    }
  }

  /**
   * Get fallback requirements when AI generation fails
   */
  private static getFallbackRequirements(
    campaign: Campaign,
    brandKit: BrandKit
  ): CreativeRequirements {
    const objectiveMapping = {
      awareness: ['educational', 'inspiring', 'memorable'],
      traffic: ['engaging', 'curious', 'clear'],
      conversion: ['trustworthy', 'urgent', 'persuasive'],
      engagement: ['entertaining', 'relatable', 'shareable'],
    }

    return {
      visualStyle: {
        mood: objectiveMapping[campaign.objective] || ['professional'],
        colorScheme: [brandKit.colors.primary, brandKit.colors.secondary],
        composition: 'hero-product',
        typography: 'clean-sans',
      },
      messaging: {
        tone: ['confident', 'professional'],
        focusAreas: ['product-benefits'],
        keyMessages: [campaign.primaryOffer || 'Quality products'],
        emotionalDrivers: ['security', 'aspiration'],
      },
      structure: {
        headlineStyle: 'benefit-driven',
        bodyFormat: ['bullet-points'],
        ctaPlacement: 'primary-bottom',
        contentDensity: 'moderate',
      },
      platformSpecific: {
        instagram: {
          visualPriority: 'product',
          captionLength: 'medium',
          hashtagStrategy: 'branded',
          storyElements: ['swipe-up'],
        },
        facebook: {
          contentFocus: 'promotional',
          engagementType: 'conversion',
          adFormat: 'image',
        },
        linkedin: {
          professionalAngle: 'innovation',
          contentDepth: 'high-level',
          networkStrategy: 'thought-leadership',
        },
      },
    }
  }

  /**
   * Convert creative requirements to AI prompt instructions
   */
  static creativeRequirementsToPrompt(
    requirements: CreativeRequirements
  ): string {
    const instructions = []

    // Visual style instructions
    instructions.push(`Visual Style:`)
    instructions.push(`- Mood: ${requirements.visualStyle.mood.join(', ')}`)
    instructions.push(
      `- Color scheme: ${requirements.visualStyle.colorScheme.join(', ')}`
    )
    instructions.push(`- Composition: ${requirements.visualStyle.composition}`)
    instructions.push(`- Typography: ${requirements.visualStyle.typography}`)

    // Messaging instructions
    instructions.push(`\nMessaging:`)
    instructions.push(`- Tone: ${requirements.messaging.tone.join(', ')}`)
    instructions.push(
      `- Focus areas: ${requirements.messaging.focusAreas.join(', ')}`
    )
    instructions.push(
      `- Key messages: ${requirements.messaging.keyMessages.join(', ')}`
    )
    instructions.push(
      `- Emotional drivers: ${requirements.messaging.emotionalDrivers.join(', ')}`
    )

    // Structure instructions
    instructions.push(`\nStructure:`)
    instructions.push(
      `- Headline style: ${requirements.structure.headlineStyle}`
    )
    instructions.push(
      `- Body format: ${requirements.structure.bodyFormat.join(', ')}`
    )
    instructions.push(`- CTA placement: ${requirements.structure.ctaPlacement}`)
    instructions.push(
      `- Content density: ${requirements.structure.contentDensity}`
    )

    // Platform-specific instructions
    instructions.push(`\nPlatform Adaptations:`)
    instructions.push(
      `- Instagram: ${requirements.platformSpecific.instagram.visualPriority} focus, ${requirements.platformSpecific.instagram.captionLength} captions`
    )
    instructions.push(
      `- Facebook: ${requirements.platformSpecific.facebook.contentFocus} content, ${requirements.platformSpecific.facebook.engagementType} focus`
    )
    instructions.push(
      `- LinkedIn: ${requirements.platformSpecific.linkedin.professionalAngle} angle, ${requirements.platformSpecific.linkedin.contentDepth} content`
    )

    return instructions.join('\n')
  }
}
