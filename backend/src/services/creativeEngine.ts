/**
 * Creative Engine - Core Automated Creative Production System
 *
 * This is the competitive moat - the engine that transforms:
 * - reference creatives → style learning
 * - brand kits → visual identity
 * - campaign briefs → creative direction
 * - client assets → production input
 *
 * Into finished, platform-specific creatives in minutes.
 */

import { AuthModel, BrandKit, Campaign, ReferenceCreative, Asset, AdCreative } from '../models/auth'
import { ImageRenderer } from './imageRenderer'
import { CaptionGenerator } from './captionGenerator'
import { MaskingService } from './maskingService'

export interface CreativeEngineInput {
  // Core inputs
  workspaceId: string
  campaignId?: string
  brandKitId: string

  // Source assets and references
  sourceAssets: string[] // URLs to client assets
  referenceCreatives?: string[] // URLs to style references

  // Generation parameters
  objectives?: ('awareness' | 'traffic' | 'conversion' | 'engagement')[]
  platforms?: ('ig-feed' | 'ig-story' | 'fb-feed' | 'fb-story' | 'li-feed')[]
  outputCount?: number // How many variations to generate

  // Creative constraints
  mustIncludePhrases?: string[]
  mustExcludePhrases?: string[]
  styleTags?: string[]
}

export interface CreativeEngineOutput {
  adCreatives: AdCreative[]
  summary: {
    totalGenerated: number
    platformsCovered: string[]
    styleConsistency: number // 0-100 score
    brandAlignment: number // 0-100 score
    processingTime: number // milliseconds
  }
  insights: {
    dominantColors: string[]
    textDensity: 'minimal' | 'moderate' | 'heavy'
    visualStyle: string[]
    suggestedImprovements: string[]
  }
}

export interface StyleProfile {
  colors: {
    primary: string[]
    secondary: string[]
    accent: string[]
  }
  typography: {
    headingFonts: string[]
    bodyFonts: string[]
  }
  layout: {
    commonPatterns: ('center-focus' | 'bottom-text' | 'top-text')[]
    textDensity: 'minimal' | 'moderate' | 'heavy'
    visualHierarchy: 'bold' | 'subtle' | 'balanced'
  }
  tone: {
    voice: string[]
    messaging: 'direct' | 'inspirational' | 'educational' | 'entertaining'
    ctaStyle: 'urgent' | 'gentle' | 'professional' | 'casual'
  }
}

export class CreativeEngine {
  private static instance: CreativeEngine

  private constructor() {}

  static getInstance(): CreativeEngine {
    if (!CreativeEngine.instance) {
      CreativeEngine.instance = new CreativeEngine()
    }
    return CreativeEngine.instance
  }

  /**
   * Main engine method - transforms inputs into finished creatives
   */
  async generateCreatives(input: CreativeEngineInput): Promise<CreativeEngineOutput> {
    const startTime = Date.now()

    try {
      // 1. Load and analyze all inputs
      const context = await this.analyzeInputs(input)

      // 2. Build style profile from brand kit + references
      const styleProfile = await this.buildStyleProfile(context)

      // 3. Generate creative variations
      const adCreatives = await this.produceCreatives(input, context, styleProfile)

      // 4. Analyze results and provide insights
      const summary = this.generateSummary(adCreatives, input, Date.now() - startTime)
      const insights = await this.generateInsights(adCreatives, styleProfile)

      return {
        adCreatives,
        summary,
        insights
      }
    } catch (error) {
      console.error('Creative Engine generation failed:', error)
      throw new Error(`Creative generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Analyze and validate all input data
   */
  private async analyzeInputs(input: CreativeEngineInput): Promise<{
    brandKit: BrandKit
    campaign?: Campaign
    referenceCreatives: ReferenceCreative[]
    sourceAssets: Asset[]
    styleConstraints: any
  }> {
    // Load brand kit
    const brandKit = AuthModel.getBrandKitById(input.brandKitId)
    if (!brandKit) {
      throw new Error('Brand kit not found')
    }

    // Load campaign if specified
    let campaign
    if (input.campaignId) {
      campaign = AuthModel.getCampaignById(input.campaignId)
      if (!campaign) {
        throw new Error('Campaign not found')
      }
    }

    // Load reference creatives for style learning
    const referenceCreatives: ReferenceCreative[] = []
    if (input.referenceCreatives && input.referenceCreatives.length > 0) {
      // For now, we'll need to find reference creatives by URL
      // In a real implementation, you'd have a more efficient lookup
      const allRefs = AuthModel.getReferenceCreativesByWorkspace(input.workspaceId)
      referenceCreatives.push(...allRefs.filter(ref =>
        input.referenceCreatives!.includes(ref.imageUrl)
      ))
    }

    // Load source assets
    const sourceAssets: Asset[] = []
    for (const assetUrl of input.sourceAssets) {
      // For now, assume assets are already uploaded and find by URL pattern
      // In production, you'd have proper asset management
      const allAssets = AuthModel.getAssetsByWorkspace(input.workspaceId)
      const asset = allAssets.find(a => a.url === assetUrl)
      if (asset) {
        sourceAssets.push(asset)
      }
    }

    if (sourceAssets.length === 0) {
      throw new Error('No valid source assets found')
    }

    // Build style constraints from campaign + manual overrides
    const styleConstraints = {
      objectives: input.objectives || [campaign?.objective || 'awareness'],
      platforms: input.platforms || campaign?.placements || ['ig-feed'],
      mustInclude: input.mustIncludePhrases || campaign?.mustIncludePhrases || [],
      mustExclude: input.mustExcludePhrases || campaign?.mustExcludePhrases || [],
      brandPersonality: brandKit.brandPersonality,
      targetAudience: campaign?.targetAudience || brandKit.targetAudience,
      valueProposition: brandKit.valueProposition,
      toneStyle: brandKit.toneStyle
    }

    return {
      brandKit,
      campaign,
      referenceCreatives,
      sourceAssets,
      styleConstraints
    }
  }

  /**
   * Build comprehensive style profile from brand kit + reference creatives
   */
  private async buildStyleProfile(context: any): Promise<StyleProfile> {
    const { brandKit, referenceCreatives } = context

    // Extract colors from brand kit + references
    const colors = this.extractColors(brandKit, referenceCreatives)

    // Analyze typography preferences
    const typography = this.analyzeTypography(brandKit, referenceCreatives)

    // Learn layout patterns from references
    const layout = this.analyzeLayout(referenceCreatives)

    // Determine tone and voice
    const tone = this.analyzeTone(brandKit, context.styleConstraints)

    return {
      colors,
      typography,
      layout,
      tone
    }
  }

  /**
   * Produce the actual creative variations
   */
  private async produceCreatives(
    input: CreativeEngineInput,
    context: any,
    styleProfile: StyleProfile
  ): Promise<AdCreative[]> {
    const adCreatives: AdCreative[] = []

    // Generate combinations of format + platform + style
    const formats = ['instagram-square', 'instagram-story'] as const
    const platforms = context.styleConstraints.platforms
    const outputCount = input.outputCount || 5

    let creativeIndex = 0

    for (const sourceAsset of context.sourceAssets) {
      if (creativeIndex >= outputCount) break

      for (const platform of platforms) {
        if (creativeIndex >= outputCount) break

        for (const format of formats) {
          if (creativeIndex >= outputCount) break

          // Check format-platform compatibility
          if (!this.isFormatCompatible(format, platform)) continue

          try {
            // 1. Generate ad copy using learned style + campaign context
            const adCopy = await this.generateAdCopy(
              sourceAsset,
              styleProfile,
              context.styleConstraints,
              format
            )

            // 2. Render the creative with the brand style
            const renderResult = await ImageRenderer.renderImage(
              sourceAsset.url,
              {
                format,
                layout: styleProfile.layout.commonPatterns[0] || 'center-focus',
                caption: adCopy.bodyText,
                brandKit: context.brandKit,
                watermark: false, // Agency plan
                workspaceId: input.workspaceId
              }
            )

            // 3. Create AdCreative record
            const adCreative: AdCreative = {
              id: `ad_${Date.now()}_${creativeIndex}`,
              jobId: `engine_${Date.now()}`,
              sourceAssetId: sourceAsset.id,
              workspaceId: input.workspaceId,
              captionId: `caption_${creativeIndex}`,
              campaignId: input.campaignId,
              placement: platform,

              // Ad structure
              headline: adCopy.headline,
              subheadline: adCopy.subheadline,
              bodyText: adCopy.bodyText,
              ctaText: adCopy.ctaText,
              objective: context.styleConstraints.objectives[0],
              offerText: context.campaign?.primaryOffer || undefined,

              // Generated assets
              approvalStatus: 'pending',
              format,
              layout: styleProfile.layout.commonPatterns[0] || 'center-focus',
              caption: `${adCopy.headline} ${adCopy.bodyText} ${adCopy.ctaText}`,
              imageUrl: renderResult.imageUrl,
              thumbnailUrl: renderResult.thumbnailUrl,
              watermark: false,
              createdAt: new Date()
            }

            adCreatives.push(adCreative)
            creativeIndex++

          } catch (error) {
            console.error('Failed to generate creative:', error)
            // Continue with next combination
          }
        }
      }
    }

    return adCreatives
  }

  /**
   * Generate ad copy based on style profile and context
   */
  private async generateAdCopy(
    sourceAsset: Asset,
    styleProfile: StyleProfile,
    constraints: any,
    format: string
  ): Promise<{
    headline: string
    subheadline?: string
    bodyText: string
    ctaText: string
  }> {
    // Build comprehensive prompt from style profile
    const prompt = this.buildCopyPrompt(styleProfile, constraints, format)

    // In a real implementation, you'd use your AI service to generate copy
    // For now, use a simplified template-based approach

    const ctas = constraints.mustExclude && constraints.mustExclude.length > 0
      ? ['Learn More', 'Discover More', 'Get Started']
      : ['Shop Now', 'Buy Now', 'Learn More', 'Get Started']

    const headlines = [
      `${constraints.brandPersonality || 'Elevate'} Your Style`,
      `Discover ${constraints.valueProposition || 'Something Amazing'}`,
      `Transform Your ${constraints.targetAudience || 'Daily'} Routine`,
      `Premium Quality, Unmatched Results`
    ]

    const bodyTexts = [
      `Experience the difference with our carefully crafted ${constraints.targetAudience || 'solutions'}.`,
      `Join thousands of satisfied customers who have transformed their lives.`,
      `Designed for those who appreciate quality and attention to detail.`
    ]

    return {
      headline: headlines[Math.floor(Math.random() * headlines.length)],
      subheadline: constraints.campaign?.primaryOffer || undefined,
      bodyText: bodyTexts[Math.floor(Math.random() * bodyTexts.length)],
      ctaText: ctas[Math.floor(Math.random() * ctas.length)]
    }
  }

  /**
   * Build comprehensive copy generation prompt
   */
  private buildCopyPrompt(styleProfile: StyleProfile, constraints: any, format: string): string {
    const parts = [
      `Generate ad copy for ${constraints.targetAudience}`,
      `Brand personality: ${constraints.brandPersonality}`,
      `Value proposition: ${constraints.valueProposition}`,
      `Tone: ${styleProfile.tone.voice.join(', ')}`,
      `CTA style: ${styleProfile.tone.ctaStyle}`,
      `Format: ${format} (${format === 'instagram-story' ? 'vertical' : 'square'})`
    ]

    if (constraints.mustInclude.length > 0) {
      parts.push(`Must include: ${constraints.mustInclude.join(', ')}`)
    }

    if (constraints.mustExclude.length > 0) {
      parts.push(`Must exclude: ${constraints.mustExclude.join(', ')}`)
    }

    return parts.join('. ')
  }

  /**
   * Extract colors from brand kit and reference creatives
   */
  private extractColors(brandKit: BrandKit, referenceCreatives: ReferenceCreative[]): StyleProfile['colors'] {
    const colors = {
      primary: [brandKit.colors.primary],
      secondary: [brandKit.colors.secondary],
      accent: [brandKit.colors.tertiary]
    }

    // Add colors from reference creatives
    referenceCreatives.forEach(ref => {
      if (ref.extractedColors) {
        colors.secondary.push(...ref.extractedColors.slice(0, 3)) // Limit to prevent too many colors
      }
    })

    // Remove duplicates and limit
    colors.primary = [...new Set(colors.primary)].slice(0, 1)
    colors.secondary = [...new Set(colors.secondary)].slice(0, 3)
    colors.accent = [...new Set(colors.accent)].slice(0, 2)

    return colors
  }

  /**
   * Analyze typography preferences
   */
  private analyzeTypography(brandKit: BrandKit, referenceCreatives: ReferenceCreative[]): StyleProfile['typography'] {
    return {
      headingFonts: [brandKit.fonts.heading],
      bodyFonts: [brandKit.fonts.body]
    }
  }

  /**
   * Learn layout patterns from reference creatives
   */
  private analyzeLayout(referenceCreatives: ReferenceCreative[]): StyleProfile['layout'] {
    if (referenceCreatives.length === 0) {
      return {
        commonPatterns: ['center-focus'],
        textDensity: 'moderate',
        visualHierarchy: 'balanced'
      }
    }

    // Analyze patterns from references
    const layoutCounts: Record<string, number> = {
      'center-focus': 0,
      'bottom-text': 0,
      'top-text': 0,
    }

    let totalDensity = 0
    referenceCreatives.forEach(ref => {
      if (ref.detectedLayout) {
        layoutCounts[ref.detectedLayout]++
      }
      if (ref.textDensity) {
        totalDensity += ref.textDensity === 'minimal' ? 1 : ref.textDensity === 'moderate' ? 2 : 3
      }
    })

    // Find most common layout
    const mostCommonLayout = Object.entries(layoutCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as any

    const avgDensity = totalDensity / referenceCreatives.length
    const textDensity = avgDensity < 1.5 ? 'minimal' : avgDensity < 2.5 ? 'moderate' : 'heavy'

    return {
      commonPatterns: [mostCommonLayout],
      textDensity,
      visualHierarchy: textDensity === 'heavy' ? 'bold' : textDensity === 'minimal' ? 'subtle' : 'balanced'
    }
  }

  /**
   * Analyze tone and voice
   */
  private analyzeTone(brandKit: BrandKit, constraints: any): StyleProfile['tone'] {
    return {
      voice: [brandKit.voicePrompt || 'Professional'],
      messaging: constraints.objectives?.includes('conversion') ? 'direct' : 'inspirational',
      ctaStyle: constraints.objectives?.includes('awareness') ? 'gentle' : 'urgent'
    }
  }

  /**
   * Check if format is compatible with platform
   */
  private isFormatCompatible(format: string, platform: string): boolean {
    // Instagram story works best with vertical formats
    if (platform === 'ig-story' && format !== 'instagram-story') {
      return false
    }

    // Square formats work on most platforms
    return true
  }

  /**
   * Generate summary of the creative generation
   */
  private generateSummary(
    adCreatives: AdCreative[],
    input: CreativeEngineInput,
    processingTime: number
  ): CreativeEngineOutput['summary'] {
    const platformsCovered = [...new Set(adCreatives.map(ac => ac.placement))]

    return {
      totalGenerated: adCreatives.length,
      platformsCovered,
      styleConsistency: 85, // Placeholder - would analyze consistency
      brandAlignment: 90, // Placeholder - would analyze brand alignment
      processingTime
    }
  }

  /**
   * Generate insights about the creative set
   */
  private async generateInsights(
    adCreatives: AdCreative[],
    styleProfile: StyleProfile
  ): Promise<CreativeEngineOutput['insights']> {
    return {
      dominantColors: styleProfile.colors.primary.concat(styleProfile.colors.secondary),
      textDensity: styleProfile.layout.textDensity,
      visualStyle: styleProfile.layout.commonPatterns,
      suggestedImprovements: [
        'Consider adding more visual variety in next batch',
        'Test different CTA language for improved conversion',
        'Review copy length for mobile readability'
      ]
    }
  }
}

export default CreativeEngine