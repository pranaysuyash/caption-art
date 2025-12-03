/**
 * Template Memory System
 * Learns from approved work and creates reusable templates
 */

import {
  AuthModel,
  Campaign,
  BrandKit,
  Caption,
  GeneratedAsset,
} from '../models/auth'
import { log } from '../middleware/logger'
import { CaptionScorer } from './CaptionScorer'
import { MetricsService } from './MetricsService'

export interface Template {
  id: string
  name: string
  workspaceId: string
  campaignId?: string
  brandKitId: string
  // Template components
  captionStructure: {
    toneStyle: string
    lengthPreferences: {
      min: number
      max: number
      ideal: number
    }
    wordChoicePatterns: string[]
    emotionalAppeal: string
  }
  layoutPreferences: {
    format: ('instagram-square' | 'instagram-story')[]
    layout: ('center-focus' | 'bottom-text' | 'top-text')[]
    textPositioning: string
  }
  performanceMetrics: {
    engagementRate?: number
    approvalRate: number
    reuseCount: number
    averageScore: number
  }
  createdAt: Date
  lastUsedAt?: Date
}

export interface StyleProfile {
  id: string
  name: string
  workspaceId: string
  campaignId?: string
  learnedFromCreativeId: string
  // Visual style elements
  colors: {
    primaryPalette: string[] // Top 5 colors
    secondaryPalette: string[]
    accentColors: string[]
    contrastPreferences: 'high' | 'medium' | 'low'
  }
  typography: {
    fontHierarchy: {
      headings: string[]
      body: string[]
      accents: string[]
    }
    spacingPreferences: {
      lineSpacing: number
      paragraphSpacing: number
      marginPaddingRatios: number
    }
  }
  layout: {
    compositionStyle: 'symmetrical' | 'asymmetrical' | 'grid-based' | 'freeform'
    elementHierarchy:
      | 'text-over-image'
      | 'image-over-text'
      | 'side-by-side'
      | 'layered'
    whiteSpaceUsage: 'minimal' | 'balanced' | 'generous'
  }
  brandAlignment: {
    personalityMatch: number // 0-1
    valuePropositionIncorporation: number // 0-1
    targetAudienceResonance: number // 0-1
  }
  createdAt: Date
  lastAppliedAt?: Date
}

export class TemplateMemoryService {
  /**
   * Learn from approved work to create reusable templates
   */
  static async learnFromApprovedWork(
    workspaceId: string,
    campaignId?: string
  ): Promise<{
    templates: Template[]
    styles: StyleProfile[]
    insights: string[]
  }> {
    try {
      log.info(
        { workspaceId, campaignId },
        'Starting template learning from approved work'
      )

      // Get all approved content for the workspace/campaign
      const approvedCaptions = campaignId
        ? AuthModel.getCaptionsByCampaignAndStatus(campaignId, 'approved')
        : AuthModel.getApprovedCaptionsByWorkspace(workspaceId)

      const approvedAssets = campaignId
        ? AuthModel.getApprovedGeneratedAssetsByCampaign(campaignId)
        : AuthModel.getApprovedGeneratedAssets(workspaceId)

      if (approvedCaptions.length === 0 && approvedAssets.length === 0) {
        log.info(
          { workspaceId },
          'No approved content found for template learning'
        )
        return {
          templates: [],
          styles: [],
          insights: ['No approved content found to learn from'],
        }
      }

      // Analyze patterns in approved captions to create templates
      const templates = this.extractTemplatesFromCaptions(
        approvedCaptions,
        workspaceId,
        campaignId
      )

      // Analyze patterns in approved assets to create style profiles
      const styles = this.extractStylesFromAssets(
        approvedAssets,
        workspaceId,
        campaignId
      )

      // Generate insights from the analysis
      const insights = this.generateInsights(approvedCaptions, approvedAssets)

      log.info(
        {
          workspaceId,
          campaignId,
          templateCount: templates.length,
          styleCount: styles.length,
          insightCount: insights.length,
        },
        'Template learning completed'
      )

      // Save learned templates and styles to the model
      for (const template of templates) {
        await AuthModel.createTemplate(template)
      }

      for (const style of styles) {
        await AuthModel.createStyleProfile(style)
      }

      // Track template learning events
      MetricsService.trackTemplateLearning(workspaceId, templates.length)
      MetricsService.trackStyleProfileCreation(workspaceId, styles.length)

      return {
        templates,
        styles,
        insights,
      }
    } catch (error) {
      log.error({ error, workspaceId, campaignId }, 'Template learning failed')
      throw error
    }
  }

  /**
   * Extract templates from approved captions
   */
  private static extractTemplatesFromCaptions(
    captions: Caption[],
    workspaceId: string,
    campaignId?: string
  ): Template[] {
    if (captions.length === 0) return []

    // Group captions by similarity to identify common patterns
    const groupedCaptions = this.groupSimilarCaptions(captions)

    const templates: Template[] = []

    for (const [groupId, groupCaptions] of groupedCaptions.entries()) {
      if (groupCaptions.length < 2) continue // Need at least 2 similar captions to form a template

      // Analyze the group to extract template characteristics
      const template = this.analyzeCaptionGroup(
        groupCaptions,
        workspaceId,
        campaignId
      )
      templates.push(template)
    }

    return templates
  }

  /**
   * Group similar captions to identify reusable templates
   */
  private static groupSimilarCaptions(captions: Caption[]): Caption[][] {
    const groups: Caption[][] = []
    const usedIndices = new Set<number>()

    for (let i = 0; i < captions.length; i++) {
      if (usedIndices.has(i)) continue

      const currentGroup: Caption[] = [captions[i]]
      usedIndices.add(i)

      // Look for similar captions in the remaining ones
      for (let j = i + 1; j < captions.length; j++) {
        if (usedIndices.has(j)) continue

        if (this.isCaptionSimilar(captions[i], captions[j])) {
          currentGroup.push(captions[j])
          usedIndices.add(j)
        }
      }

      groups.push(currentGroup)
    }

    return groups
  }

  /**
   * Check if two captions are similar enough to form a template
   */
  private static isCaptionSimilar(
    caption1: Caption,
    caption2: Caption
  ): boolean {
    // Compare basic characteristics
    if (!caption1.text || !caption2.text) return false

    // Calculate similarity based on various factors
    const textSimilarity = this.calculateTextSimilarity(
      caption1.text,
      caption2.text
    )
    const lengthSimilarity =
      Math.abs(caption1.text.length - caption2.text.length) /
      Math.max(caption1.text.length, caption2.text.length)

    // Consider them similar if text similarity is high and length is comparable
    return textSimilarity > 0.7 && lengthSimilarity < 0.3
  }

  /**
   * Calculate text similarity using simple string comparison
   */
  private static calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)

    const intersection = words1.filter((word) => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]

    return union.length > 0 ? intersection.length / union.length : 0
  }

  /**
   * Analyze a group of similar captions to extract template characteristics
   */
  private static analyzeCaptionGroup(
    captions: Caption[],
    workspaceId: string,
    campaignId?: string
  ): Template {
    // Calculate common characteristics from the group
    const lengths = captions.map((c) => c.text.length)
    const avgLength =
      lengths.reduce((sum, len) => sum + len, 0) / lengths.length
    const minLength = Math.min(...lengths)
    const maxLength = Math.max(...lengths)

    // Extract common word patterns
    const allWords = captions.flatMap((c) =>
      c.text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    )
    const wordFrequency = new Map<string, number>()
    allWords.forEach((word) => {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1)
    })

    // Get top recurring words as patterns
    const sortedWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)

    // Calculate average scores for performance metrics
    const scores = captions.map((c) => c.qualityScore || 0)
    const avgScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length

    return {
      id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Template from ${captions.length} similar captions`,
      workspaceId,
      campaignId,
      brandKitId: captions[0].workspaceId, // Assuming all captions in group are from same workspace
      captionStructure: {
        toneStyle: 'mixed', // Would analyze this more deeply in practice
        lengthPreferences: {
          min: minLength,
          max: maxLength,
          ideal: Math.round(avgLength),
        },
        wordChoicePatterns: sortedWords,
        emotionalAppeal: 'mixed', // Would analyze this more deeply
      },
      layoutPreferences: {
        format: ['instagram-square', 'instagram-story'], // Default for now
        layout: ['center-focus'], // Default assumption
        textPositioning: 'center', // Default assumption
      },
      performanceMetrics: {
        approvalRate: 1, // All in group are approved
        reuseCount: 0, // New template
        averageScore: parseFloat(avgScore.toFixed(2)),
      },
      createdAt: new Date(),
    }
  }

  /**
   * Extract style profiles from approved assets
   */
  private static extractStylesFromAssets(
    assets: GeneratedAsset[],
    workspaceId: string,
    campaignId?: string
  ): StyleProfile[] {
    if (assets.length === 0) return []

    // For now, we'll create a basic style profile from available data
    // In a real implementation, this would analyze the actual image files
    const styles: StyleProfile[] = []

    // Group by visual characteristics if possible
    for (const asset of assets) {
      // In a real implementation, we'd analyze the actual image
      // For now, we'll create a placeholder with available metadata
      const style: StyleProfile = {
        id: `style_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `Style from asset ${asset.id.substring(0, 8)}`,
        workspaceId,
        campaignId,
        learnedFromCreativeId: asset.id,
        colors: {
          primaryPalette: ['#333333', '#666666'], // Placeholder - would extract from image
          secondaryPalette: ['#999999', '#CCCCCC'],
          accentColors: ['#0066CC', '#FF6B35'], // Common accent colors
          contrastPreferences: 'high',
        },
        typography: {
          fontHierarchy: {
            headings: ['Inter Bold', 'Helvetica Neue Bold'], // Common fonts
            body: ['Inter Regular', 'Helvetica Neue'],
            accents: ['Inter Medium', 'Helvetica Neue Medium'],
          },
          spacingPreferences: {
            lineSpacing: 1.5,
            paragraphSpacing: 2,
            marginPaddingRatios: 0.5,
          },
        },
        layout: {
          compositionStyle: 'symmetrical',
          elementHierarchy: 'text-over-image',
          whiteSpaceUsage: 'balanced',
        },
        brandAlignment: {
          personalityMatch: 0.85,
          valuePropositionIncorporation: 0.9,
          targetAudienceResonance: 0.88,
        },
        createdAt: new Date(),
      }

      styles.push(style)
    }

    return styles
  }

  /**
   * Generate insights from approved content analysis
   */
  private static generateInsights(
    approvedCaptions: Caption[],
    approvedAssets: GeneratedAsset[]
  ): string[] {
    const insights: string[] = []

    if (approvedCaptions.length > 0) {
      // Calculate average caption length
      const avgLength =
        approvedCaptions.reduce(
          (sum, cap) => sum + (cap.text?.length || 0),
          0
        ) / approvedCaptions.length
      insights.push(
        `Average approved caption length: ${Math.round(avgLength)} characters`
      )

      // Identify common themes/keywords
      const allText = approvedCaptions
        .map((c) => c.text)
        .join(' ')
        .toLowerCase()
      const commonWords = this.getMostCommonWords(allText, 5)
      insights.push(`Common themes: ${commonWords.join(', ')}`)

      // Calculate average score if available
      const scores = approvedCaptions
        .map((c) => c.qualityScore || 0)
        .filter((score) => score > 0)
      if (scores.length > 0) {
        const avgScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        insights.push(
          `Average caption quality score: ${avgScore.toFixed(2)}/10`
        )
      }
    }

    if (approvedAssets.length > 0) {
      insights.push(`Total approved assets: ${approvedAssets.length}`)

      // Format distribution
      const formatCounts = approvedAssets.reduce(
        (acc, asset) => {
          acc[asset.format] = (acc[asset.format] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      const formatDistribution = Object.entries(formatCounts)
        .map(([format, count]) => `${format}: ${count}`)
        .join(', ')

      insights.push(`Format distribution: ${formatDistribution}`)
    }

    if (approvedCaptions.length > 0 && approvedAssets.length > 0) {
      insights.push(
        `Combined content analysis complete: ${approvedCaptions.length} captions, ${approvedAssets.length} assets`
      )
    }

    return insights
  }

  /**
   * Get most common words from text
   */
  private static getMostCommonWords(text: string, count: number): string[] {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
    ])

    const words = text
      .split(/\s+/)
      .map((w) => w.replace(/[^\w]/g, '').toLowerCase())
      .filter((w) => w.length > 2 && !stopWords.has(w))

    const frequencyMap = new Map<string, number>()
    words.forEach((word) => {
      frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1)
    })

    return Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word)
  }

  /**
   * Apply a learned template to generate new content
   */
  static async applyTemplate(
    templateId: string,
    context: {
      brandKit: BrandKit
      campaign?: Campaign
      sourceText: string
      targetLength?: number
    }
  ): Promise<{
    caption: string
    confidence: number // 0-1, how well the template matched
    appliedRules: string[] // Which template rules were applied
  }> {
    try {
      const template = AuthModel.getTemplateById(templateId)
      if (!template) {
        throw new Error(`Template ${templateId} not found`)
      }

      log.info(
        { templateId, sourceText: context.sourceText.substring(0, 50) },
        'Applying template to generate content'
      )

      // Apply template rules to the source text
      let resultText = context.sourceText

      // Apply length preferences if specified
      if (context.targetLength) {
        resultText = this.adaptTextLength(resultText, context.targetLength)
      } else if (template.captionStructure.lengthPreferences.ideal) {
        resultText = this.adaptTextLength(
          resultText,
          template.captionStructure.lengthPreferences.ideal
        )
      }

      // Apply word choice patterns - inject common patterns if missing
      resultText = this.applyWordChoicePatterns(
        resultText,
        template.captionStructure.wordChoicePatterns
      )

      // Calculate confidence based on how many template rules were applied
      const appliedRules: string[] = []
      if (
        context.targetLength ||
        template.captionStructure.lengthPreferences.ideal
      )
        appliedRules.push('length_adaptation')
      if (template.captionStructure.wordChoicePatterns.length > 0)
        appliedRules.push('word_patterns')

      const confidence = appliedRules.length / 5 // Normalize based on possible rules

      // Update template usage statistics
      await this.incrementTemplateUsage(templateId)

      return {
        caption: resultText,
        confidence: Math.min(confidence, 1),
        appliedRules,
      }
    } catch (error) {
      log.error({ error, templateId }, 'Template application failed')
      throw error
    }
  }

  /**
   * Adapt text to target length
   */
  private static adaptTextLength(text: string, targetLength: number): string {
    if (text.length <= targetLength) {
      return text // Already under target, keep as is
    }

    // For now, simply truncate - in real implementation, would preserve meaning
    let result = text.substring(0, targetLength).trim()

    // Try to break at word boundary
    const lastSpace = result.lastIndexOf(' ')
    if (lastSpace > 0 && result.length > targetLength * 0.9) {
      // Only if we trimmed significantly
      result = result.substring(0, lastSpace).trim()
    }

    return result
  }

  /**
   * Apply word choice patterns to text
   */
  private static applyWordChoicePatterns(
    text: string,
    patterns: string[]
  ): string {
    // For now, just ensure certain patterns are present
    // In real implementation, would incorporate patterns more intelligently
    let result = text

    for (const pattern of patterns) {
      if (!result.toLowerCase().includes(pattern.toLowerCase())) {
        // Simple approach: append common patterns if not present
        result += ` #${pattern}`
      }
    }

    return result
  }

  /**
   * Increment template usage counter
   */
  private static async incrementTemplateUsage(
    templateId: string
  ): Promise<void> {
    const template = AuthModel.getTemplateById(templateId)
    if (!template) return

    // Update the template with incremented usage and last used timestamp
    const updatedTemplate = {
      ...template,
      performanceMetrics: {
        ...template.performanceMetrics,
        reuseCount: (template.performanceMetrics.reuseCount || 0) + 1,
      },
      lastUsedAt: new Date(),
    }

    // Save back to data model (implementation depends on the actual model)
    // AuthModel.updateTemplate(templateId, updatedTemplate);
  }

  /**
   * Get recommended templates for a workspace or campaign
   */
  static async getRecommendedTemplates(
    workspaceId: string,
    campaignId?: string,
    limit: number = 5
  ): Promise<Template[]> {
    try {
      // Get all templates for the workspace
      let templates = AuthModel.getTemplatesByWorkspace(workspaceId)

      // Filter by campaign if specified
      if (campaignId) {
        templates = templates.filter((t) => t.campaignId === campaignId)
      }

      // Sort by performance metrics (prefer templates with high approval rate, high scores, recent usage)
      templates.sort((a, b) => {
        const scoreA =
          (a.performanceMetrics.averageScore || 0) *
          (a.performanceMetrics.approvalRate || 0) *
          (a.performanceMetrics.reuseCount + 1)
        const scoreB =
          (b.performanceMetrics.averageScore || 0) *
          (b.performanceMetrics.approvalRate || 0) *
          (b.performanceMetrics.reuseCount + 1)

        // Prefer more recently used templates
        const timeA = a.lastUsedAt
          ? new Date(a.lastUsedAt).getTime()
          : new Date(a.createdAt).getTime()
        const timeB = b.lastUsedAt
          ? new Date(b.lastUsedAt).getTime()
          : new Date(b.createdAt).getTime()

        // Combine score and recency (recently used templates get a boost)
        const combinedA = scoreA * (1 + timeA / Date.now())
        const combinedB = scoreB * (1 + timeB / Date.now())

        return combinedB - combinedA // Higher scores first
      })

      return templates.slice(0, limit)
    } catch (error) {
      log.error(
        { error, workspaceId, campaignId },
        'Failed to get recommended templates'
      )
      throw error
    }
  }

  /**
   * Auto-apply best templates based on content context
   */
  static async autoApplyBestTemplate(
    workspaceId: string,
    context: {
      brandKit: BrandKit
      campaign?: Campaign
      sourceText: string
      targetLength?: number
    }
  ): Promise<{
    caption: string
    templateId: string
    confidence: number
  } | null> {
    try {
      // Get recommended templates for this workspace
      const recommendedTemplates = await this.getRecommendedTemplates(
        workspaceId,
        context.campaign?.id,
        10
      )

      if (recommendedTemplates.length === 0) {
        log.info({ workspaceId }, 'No templates available for auto-application')
        return null
      }

      // Try each template and rate the result
      const results = await Promise.all(
        recommendedTemplates.map(async (template) => {
          try {
            const result = await this.applyTemplate(template.id, context)
            return {
              ...result,
              templateId: template.id,
              templateAverageScore:
                template.performanceMetrics.averageScore || 0,
            }
          } catch (err) {
            log.warn(
              { err, templateId: template.id },
              'Failed to apply template'
            )
            return null
          }
        })
      )

      // Filter out failed applications and find the best result
      const successfulResults = results.filter((r) => r !== null) as Exclude<
        (typeof results)[number],
        null
      >[]

      if (successfulResults.length === 0) {
        return null
      }

      // Select the best result based on confidence and template performance
      const bestResult = successfulResults.reduce((best, current) => {
        // Calculate composite score combining application confidence with template's historical performance
        const currentScore =
          (current.confidence || 0) * 0.6 +
          (current.templateAverageScore / 10) * 0.4
        const bestScore =
          (best.confidence || 0) * 0.6 + (best.templateAverageScore / 10) * 0.4

        return currentScore > bestScore ? current : best
      })

      log.info(
        {
          workspaceId,
          bestTemplateId: bestResult.templateId,
          confidence: bestResult.confidence,
        },
        'Best template auto-applied'
      )

      return {
        caption: bestResult.caption,
        templateId: bestResult.templateId,
        confidence: bestResult.confidence,
      }
    } catch (error) {
      log.error({ error, workspaceId }, 'Auto-template application failed')
      throw error
    }
  }
}
