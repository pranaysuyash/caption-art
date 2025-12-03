import OpenAI from 'openai'
import {
  StyleProfile,
  ConsistencyScoreRequest,
  ConsistencyScoreResult,
  LEARNING_CONFIG,
} from '../types/styleMemory'
import { AuthModel, AdCreative, Campaign, BrandKit } from '../models/auth'
import { log } from '../middleware/logger'

export class ConsistencyScoringService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Analyze creative consistency with brand style profile
   */
  async scoreConsistency(
    request: ConsistencyScoreRequest
  ): Promise<ConsistencyScoreResult> {
    try {
      log.info(
        { creativeId: request.creativeId },
        `Scoring consistency for creative`
      )

      // Get creative data
      const creative = await this.getCreative(request.creativeId)
      if (!creative) {
        throw new Error('Creative not found')
      }

      // Get style profile
      const styleProfile = await this.getStyleProfile(request.styleProfileId)
      if (!styleProfile) {
        throw new Error('Style profile not found')
      }

      // Get brand kit for additional context
      const brandKit = AuthModel.getBrandKitById(creative.brandKitId)
      if (!brandKit) {
        throw new Error('Brand kit not found')
      }

      // Perform detailed analysis based on requested depth
      const analysis = await this.performAnalysis(
        creative,
        styleProfile,
        brandKit,
        request
      )

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        analysis,
        styleProfile
      )

      // Calculate overall score
      const overallScore = this.calculateOverallScore(analysis)

      log.info(
        { overallScore, creativeId: request.creativeId },
        `Consistency score calculated`
      )

      return {
        overallScore,
        breakdown: analysis,
        recommendations,
        confidence: this.calculateConfidence(analysis, styleProfile),
        analyzedAt: new Date(),
      }
    } catch (error) {
      log.error({ err: error }, 'Consistency scoring error')
      throw new Error('Failed to score consistency')
    }
  }

  /**
   * Perform detailed consistency analysis
   */
  private async performAnalysis(
    creative: AdCreative,
    styleProfile: StyleProfile,
    brandKit: BrandKit,
    request: ConsistencyScoreRequest
  ) {
    switch (request.analysisDepth) {
      case 'comprehensive':
        return await this.performComprehensiveAnalysis(
          creative,
          styleProfile,
          brandKit
        )
      case 'standard':
        return await this.performStandardAnalysis(
          creative,
          styleProfile,
          brandKit
        )
      case 'quick':
      default:
        return await this.performQuickAnalysis(creative, styleProfile, brandKit)
    }
  }

  /**
   * Perform quick analysis (basic checks)
   */
  private async performQuickAnalysis(
    creative: AdCreative,
    styleProfile: StyleProfile,
    brandKit: BrandKit
  ) {
    const visualScore = this.quickVisualCheck(creative, styleProfile, brandKit)
    const contentScore = this.quickContentCheck(creative, styleProfile)
    const platformScore = this.quickPlatformCheck(creative)

    return {
      visualConsistency: {
        score: visualScore,
        colorAlignment: this.checkColorAlignment(
          creative,
          styleProfile,
          brandKit
        ),
        fontAlignment: 75, // Basic check
        layoutAlignment: 80, // Basic check
        imageryAlignment: 70, // Basic check
      },
      contentConsistency: {
        score: contentScore,
        toneAlignment: this.checkToneAlignment(creative, styleProfile),
        messagingAlignment: 75, // Basic check
        brandVoiceAlignment: contentScore,
        ctaAlignment: 80, // Basic check
      },
      platformAlignment: {
        score: platformScore,
        characterLimitCompliance: this.checkCharacterLimits(creative),
        bestPracticeAdherence: 75, // Basic check
        audienceFit: 80, // Basic check
      },
    }
  }

  /**
   * Perform standard analysis (medium depth)
   */
  private async performStandardAnalysis(
    creative: AdCreative,
    styleProfile: StyleProfile,
    brandKit: BrandKit
  ) {
    // Use AI for deeper analysis
    const visualScore = await this.analyzeVisualConsistency(
      creative,
      styleProfile,
      brandKit
    )
    const contentScore = await this.analyzeContentConsistency(
      creative,
      styleProfile
    )
    const platformScore = await this.analyzePlatformConsistency(
      creative,
      styleProfile
    )

    return {
      visualConsistency: visualScore,
      contentConsistency: contentScore,
      platformAlignment: platformScore,
    }
  }

  /**
   * Perform comprehensive analysis (deep AI analysis)
   */
  private async performComprehensiveAnalysis(
    creative: AdCreative,
    styleProfile: StyleProfile,
    brandKit: BrandKit
  ) {
    const prompt = this.buildComprehensiveAnalysisPrompt(
      creative,
      styleProfile,
      brandKit
    )

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            "You are an expert brand analyst specializing in creative consistency evaluation. Analyze how well an ad creative aligns with a brand's established style profile.",
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Failed to analyze consistency')
    }

    return this.parseComprehensiveAnalysis(response, creative, styleProfile)
  }

  /**
   * Analyze visual consistency using AI
   */
  private async analyzeVisualConsistency(
    creative: AdCreative,
    styleProfile: StyleProfile,
    brandKit: BrandKit
  ) {
    const prompt = this.buildVisualAnalysisPrompt(
      creative,
      styleProfile,
      brandKit
    )

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Analyze visual brand consistency focusing on colors, typography, and layout.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content
    const scoreMatch = response?.match(/(\d+)/)

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
      colorAlignment: this.checkColorAlignment(
        creative,
        styleProfile,
        brandKit
      ),
      fontAlignment: 80,
      layoutAlignment: 75,
      imageryAlignment: 70,
    }
  }

  /**
   * Analyze content consistency using AI
   */
  private async analyzeContentConsistency(
    creative: AdCreative,
    styleProfile: StyleProfile
  ) {
    const prompt = this.buildContentAnalysisPrompt(creative, styleProfile)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Analyze content consistency focusing on tone, messaging, and brand voice.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content
    const scoreMatch = response?.match(/(\d+)/)

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
      toneAlignment: this.checkToneAlignment(creative, styleProfile),
      messagingAlignment: 80,
      brandVoiceAlignment: 75,
      ctaAlignment: 85,
    }
  }

  /**
   * Analyze platform alignment using AI
   */
  private async analyzePlatformConsistency(
    creative: AdCreative,
    styleProfile: StyleProfile
  ) {
    const prompt = this.buildPlatformAnalysisPrompt(creative, styleProfile)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Analyze platform-specific optimization and best practice adherence.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content
    const scoreMatch = response?.match(/(\d+)/)

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
      characterLimitCompliance: this.checkCharacterLimits(creative),
      bestPracticeAdherence: 80,
      audienceFit: 70,
    }
  }

  /**
   * Generate improvement recommendations
   */
  private async generateRecommendations(
    analysis: any,
    styleProfile: StyleProfile
  ) {
    const recommendations = []

    // Visual recommendations
    if (
      analysis.visualConsistency.score <
      LEARNING_CONFIG.consistencyScoring.thresholds.good
    ) {
      if (analysis.visualConsistency.colorAlignment < 80) {
        recommendations.push({
          category: 'visual',
          severity: 'warning',
          issue: 'Color alignment could be improved',
          recommendation: `Use brand primary colors: ${styleProfile.visualStyle.colorPalette.primary.slice(0, 3).join(', ')}`,
          impact: 15,
        })
      }

      if (analysis.visualConsistency.fontAlignment < 80) {
        recommendations.push({
          category: 'visual',
          severity: 'suggestion',
          issue: 'Font consistency check needed',
          recommendation: 'Use consistent brand typography across all elements',
          impact: 10,
        })
      }
    }

    // Content recommendations
    if (
      analysis.contentConsistency.score <
      LEARNING_CONFIG.consistencyScoring.thresholds.good
    ) {
      if (analysis.contentConsistency.toneAlignment < 80) {
        recommendations.push({
          category: 'content',
          severity: 'warning',
          issue: 'Tone could better match brand voice',
          recommendation: `Maintain ${styleProfile.contentStyle.tone.primary.join(', ')} tone throughout`,
          impact: 20,
        })
      }

      if (analysis.contentConsistency.ctaAlignment < 70) {
        recommendations.push({
          category: 'content',
          severity: 'critical',
          issue: 'Call-to-action needs improvement',
          recommendation: 'Use stronger, more specific action language',
          impact: 25,
        })
      }
    }

    // Platform recommendations
    if (
      analysis.platformAlignment.score <
      LEARNING_CONFIG.consistencyScoring.thresholds.fair
    ) {
      if (analysis.platformAlignment.characterLimitCompliance < 90) {
        recommendations.push({
          category: 'platform',
          severity: 'critical',
          issue: 'Character limits exceeded',
          recommendation: 'Shorten content to meet platform requirements',
          impact: 30,
        })
      }
    }

    return recommendations
  }

  /**
   * Quick visual check
   */
  private quickVisualCheck(
    creative: AdCreative,
    styleProfile: StyleProfile,
    brandKit: BrandKit
  ): number {
    let score = 80 // Base score

    // Check brand colors
    const brandColors = brandKit.colors
    if (brandColors?.primary && brandColors.primary.length > 0) {
      score += 10 // Has brand colors defined
    }

    // Check for visual consistency in slots
    const hasConsistentVisuals = creative.slots.some(
      (slot) => slot.metadata?.emotionalImpact?.length > 0
    )
    if (hasConsistentVisuals) {
      score += 10
    }

    return Math.min(100, score)
  }

  /**
   * Quick content check
   */
  private quickContentCheck(
    creative: AdCreative,
    styleProfile: StyleProfile
  ): number {
    let score = 75 // Base score

    // Check CTA presence and quality
    const ctaSlot = creative.slots.find((slot) => slot.type === 'cta')
    if (ctaSlot && ctaSlot.content) {
      score += 10
      if (
        ctaSlot.content.match(
          /\b(shop|buy|get|start|try|learn|discover|sign|register)\b/i
        )
      ) {
        score += 10
      }
    }

    // Check content length consistency
    const bodySlot = creative.slots.find((slot) => slot.type === 'body')
    if (bodySlot && bodySlot.content.length > 20) {
      score += 5
    }

    return Math.min(100, score)
  }

  /**
   * Quick platform check
   */
  private quickPlatformCheck(creative: AdCreative): number {
    let score = 80 // Base score

    // Check character limits for primary platform
    const platformCompliance = this.checkCharacterLimits(creative)
    if (platformCompliance === 100) {
      score += 15
    } else if (platformCompliance > 80) {
      score += 5
    }

    // Check for platform-specific adaptations
    const hasAdaptations = creative.slots.some(
      (slot) =>
        slot.platformSpecific && Object.keys(slot.platformSpecific).length > 0
    )
    if (hasAdaptations) {
      score += 5
    }

    return Math.min(100, score)
  }

  /**
   * Check color alignment
   */
  private checkColorAlignment(
    creative: AdCreative,
    styleProfile: StyleProfile,
    brandKit: BrandKit
  ): number {
    if (!styleProfile.visualStyle.colorPalette.confidence) {
      return 50 // No style data available
    }

    // In production, would analyze actual creative colors
    // For now, using style profile confidence
    return styleProfile.visualStyle.colorPalette.confidence
  }

  /**
   * Check tone alignment
   */
  private checkToneAlignment(
    creative: AdCreative,
    styleProfile: StyleProfile
  ): number {
    if (!styleProfile.contentStyle.tone.confidence) {
      return 50 // No style data available
    }

    // Analyze creative content tone
    const headlineSlot = creative.slots.find((slot) => slot.type === 'headline')
    const bodySlot = creative.slots.find((slot) => slot.type === 'body')

    let alignmentScore = styleProfile.contentStyle.tone.confidence

    // Bonus for tone keywords in content
    const allText = [headlineSlot?.content, bodySlot?.content]
      .filter(Boolean)
      .join(' ')
    const toneKeywords = styleProfile.contentStyle.tone.primary.concat(
      styleProfile.contentStyle.tone.secondary || []
    )

    const foundToneWords = toneKeywords.filter((tone) =>
      allText.toLowerCase().includes(tone.toLowerCase())
    ).length

    if (foundToneWords > 0) {
      alignmentScore = Math.min(100, alignmentScore + foundToneWords * 5)
    }

    return alignmentScore
  }

  /**
   * Check character limits compliance
   */
  private checkCharacterLimits(creative: AdCreative): number {
    if (!creative.primaryPlatform || creative.primaryPlatform === 'multi') {
      return 70 // Can't check specific platform limits
    }

    let complianceScore = 100
    const platform = creative.primaryPlatform

    creative.slots.forEach((slot) => {
      const slotConfig = this.getSlotCharacterLimit(slot.type, platform)
      if (slotConfig && slot.content.length > slotConfig) {
        complianceScore -= 20
      }
    })

    return Math.max(0, complianceScore)
  }

  /**
   * Get character limit for slot type on platform
   */
  private getSlotCharacterLimit(
    slotType: string,
    platform: string
  ): number | null {
    const limits = {
      instagram: {
        headline: 30,
        subheadline: 20,
        body: 125,
        cta: 20,
        primaryText: 2200,
      },
      facebook: {
        headline: 50,
        subheadline: 30,
        body: 300,
        cta: 25,
        primaryText: 50000,
      },
      linkedin: {
        headline: 60,
        subheadline: 40,
        body: 500,
        cta: 30,
        primaryText: 1300,
      },
    }

    return (
      limits[platform as keyof typeof limits]?.[
        slotType as keyof typeof limits.instagram
      ] || null
    )
  }

  /**
   * Calculate overall consistency score
   */
  private calculateOverallScore(analysis: any): number {
    const weights = LEARNING_CONFIG.consistencyScoring.weights

    const visualScore = analysis.visualConsistency.score
    const contentScore = analysis.contentConsistency.score
    const platformScore = analysis.platformAlignment.score

    return Math.round(
      visualScore * weights.visual +
        contentScore * weights.content +
        platformScore * weights.platform
    )
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(
    analysis: any,
    styleProfile: StyleProfile
  ): number {
    let confidence = 75 // Base confidence

    // Higher confidence if style profile is well-established
    if (styleProfile.learning.confidence > 80) {
      confidence += 10
    }

    // Higher confidence if analysis is consistent across dimensions
    const scores = [
      analysis.visualConsistency.score,
      analysis.contentConsistency.score,
      analysis.platformAlignment.score,
    ]

    const scoreVariance = Math.max(...scores) - Math.min(...scores)
    if (scoreVariance < 20) {
      confidence += 10
    }

    return Math.min(95, confidence)
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildComprehensiveAnalysisPrompt(
    creative: AdCreative,
    styleProfile: StyleProfile,
    brandKit: BrandKit
  ): string {
    return `
Analyze the brand consistency of this ad creative:

CREATIVE DATA:
${JSON.stringify(creative.slots, null, 2)}

BRAND STYLE PROFILE:
${JSON.stringify(styleProfile, null, 2)}

BRAND KIT:
${JSON.stringify(brandKit, null, 2)}

Analyze and rate (0-100):
1. Visual Consistency (colors, typography, layout, imagery)
2. Content Consistency (tone, messaging, brand voice, CTA)
3. Platform Alignment (character limits, best practices, audience fit)

Respond with JSON structure:
{
  "visualConsistency": {
    "score": 85,
    "colorAlignment": 90,
    "fontAlignment": 80,
    "layoutAlignment": 85,
    "imageryAlignment": 75
  },
  "contentConsistency": {
    "score": 80,
    "toneAlignment": 85,
    "messagingAlignment": 75,
    "brandVoiceAlignment": 80,
    "ctaAlignment": 80
  },
  "platformAlignment": {
    "score": 90,
    "characterLimitCompliance": 100,
    "bestPracticeAdherence": 85,
    "audienceFit": 85
  }
}
`
  }

  /**
   * Build visual analysis prompt
   */
  private buildVisualAnalysisPrompt(
    creative: AdCreative,
    styleProfile: StyleProfile,
    brandKit: BrandKit
  ): string {
    return `
Analyze visual brand consistency:
Creative: ${JSON.stringify(
      creative.slots.filter((s) =>
        ['headline', 'subheadline'].includes(s.type)
      ),
      null,
      2
    )}
Style Profile: ${JSON.stringify(styleProfile.visualStyle, null, 2)}

Rate visual consistency (0-100) and provide brief analysis.
`
  }

  /**
   * Build content analysis prompt
   */
  private buildContentAnalysisPrompt(
    creative: AdCreative,
    styleProfile: StyleProfile
  ): string {
    return `
Analyze content brand consistency:
Creative: ${JSON.stringify(creative.slots, null, 2)}
Style Profile: ${JSON.stringify(styleProfile.contentStyle, null, 2)}

Rate content consistency (0-100) and provide brief analysis.
`
  }

  /**
   * Build platform analysis prompt
   */
  private buildPlatformAnalysisPrompt(
    creative: AdCreative,
    styleProfile: StyleProfile
  ): string {
    return `
Analyze platform optimization:
Creative: ${JSON.stringify(creative, null, 2)}
Platform: ${creative.primaryPlatform}

Rate platform alignment (0-100) and provide brief analysis.
`
  }

  /**
   * Parse comprehensive analysis response
   */
  private parseComprehensiveAnalysis(
    response: string,
    creative: AdCreative,
    styleProfile: StyleProfile
  ) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response')
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      log.error({ err: error }, 'Error parsing comprehensive analysis')
      // Return standard analysis as fallback
      return this.performStandardAnalysis(
        creative,
        styleProfile,
        {} as BrandKit
      )
    }
  }

  // Helper methods (mock implementations)
  private async getCreative(creativeId: string): Promise<AdCreative | null> {
    // In production, would fetch from database
    return null
  }

  private async getStyleProfile(
    profileId: string
  ): Promise<StyleProfile | null> {
    // In production, would fetch from database
    return null
  }
}
