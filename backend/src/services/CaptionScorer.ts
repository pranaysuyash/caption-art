/**
 * Caption Scorer - Quality scoring engine for generated captions
 *
 * Scores captions 1-10 based on:
 * - Brand voice match
 * - Campaign objective alignment
 * - Character limit compliance
 * - Forbidden phrase absence
 * - Must-include phrase presence
 */

import { PLATFORM_PRESETS } from './captionGenerator'

export interface ScoringCriteria {
  brandVoiceKeywords?: string[]
  campaignObjective?: string
  platform?: string
  mustIncludePhrases?: string[]
  mustExcludePhrases?: string[]
  targetLength?: number
}

export interface CaptionScore {
  totalScore: number // 1-10
  breakdown: {
    brandVoiceMatch: number // 0-3 points
    objectiveAlignment: number // 0-2 points
    lengthCompliance: number // 0-2 points
    constraintCompliance: number // 0-3 points (critical)
  }
  issues: string[]
  strengths: string[]
}

export class CaptionScorer {
  /**
   * Score a caption based on multiple criteria
   */
  static scoreCaption(
    caption: string,
    criteria: ScoringCriteria
  ): CaptionScore {
    const breakdown = {
      brandVoiceMatch: 0,
      objectiveAlignment: 0,
      lengthCompliance: 0,
      constraintCompliance: 0,
    }
    const issues: string[] = []
    const strengths: string[] = []

    // 1. Brand Voice Match (0-3 points)
    if (criteria.brandVoiceKeywords && criteria.brandVoiceKeywords.length > 0) {
      const captionLower = caption.toLowerCase()
      const matchCount = criteria.brandVoiceKeywords.filter((keyword) =>
        captionLower.includes(keyword.toLowerCase())
      ).length

      const matchRatio = matchCount / criteria.brandVoiceKeywords.length

      if (matchRatio >= 0.5) {
        breakdown.brandVoiceMatch = 3
        strengths.push('Strong brand voice alignment')
      } else if (matchRatio >= 0.25) {
        breakdown.brandVoiceMatch = 2
        strengths.push('Good brand voice match')
      } else if (matchRatio > 0) {
        breakdown.brandVoiceMatch = 1
        issues.push('Limited brand voice keywords')
      } else {
        breakdown.brandVoiceMatch = 0
        issues.push('Missing brand voice elements')
      }
    } else {
      // No brand voice criteria - give default score
      breakdown.brandVoiceMatch = 2
    }

    // 2. Campaign Objective Alignment (0-2 points)
    if (criteria.campaignObjective) {
      const objectiveScore = this.scoreObjectiveAlignment(
        caption,
        criteria.campaignObjective
      )
      breakdown.objectiveAlignment = objectiveScore

      if (objectiveScore === 2) {
        strengths.push('Excellent objective alignment')
      } else if (objectiveScore === 1) {
        strengths.push('Moderate objective alignment')
      } else {
        issues.push('Weak campaign objective alignment')
      }
    } else {
      breakdown.objectiveAlignment = 1
    }

    // 3. Length Compliance (0-2 points)
    const lengthScore = this.scoreLengthCompliance(caption, criteria)
    breakdown.lengthCompliance = lengthScore.score

    if (lengthScore.score === 2) {
      strengths.push('Optimal length for platform')
    } else if (lengthScore.score === 1) {
      issues.push(lengthScore.issue || 'Length slightly off target')
    } else {
      issues.push(lengthScore.issue || 'Length significantly off target')
    }

    // 4. Constraint Compliance (0-3 points) - CRITICAL
    const constraintScore = this.scoreConstraintCompliance(caption, criteria)
    breakdown.constraintCompliance = constraintScore.score

    if (constraintScore.criticalViolation) {
      issues.push(`CRITICAL: ${constraintScore.issue}`)
    } else if (constraintScore.score === 3) {
      strengths.push('All constraints met')
    } else if (constraintScore.score > 0) {
      if (constraintScore.issue) {
        issues.push(constraintScore.issue)
      }
    }

    // Calculate total score (1-10)
    const rawScore =
      breakdown.brandVoiceMatch +
      breakdown.objectiveAlignment +
      breakdown.lengthCompliance +
      breakdown.constraintCompliance

    // Map 0-10 raw score to 1-10 scale
    const totalScore = Math.max(1, Math.min(10, Math.round(rawScore)))

    return {
      totalScore,
      breakdown,
      issues,
      strengths,
    }
  }

  /**
   * Score how well caption aligns with campaign objective
   */
  private static scoreObjectiveAlignment(
    caption: string,
    objective: string
  ): number {
    const captionLower = caption.toLowerCase()

    const objectiveIndicators: Record<string, string[]> = {
      awareness: [
        'discover',
        'explore',
        'learn',
        'introducing',
        'check out',
        'new',
        'meet',
      ],
      traffic: [
        'learn more',
        'read more',
        'click',
        'visit',
        'explore',
        'discover more',
        'find out',
      ],
      conversion: [
        'buy',
        'shop',
        'get',
        'order',
        'purchase',
        'subscribe',
        'sign up',
        'join',
        'start',
      ],
      engagement: [
        'comment',
        'share',
        'tag',
        'tell us',
        'what do you',
        'your thoughts',
        'let us know',
      ],
    }

    const indicators = objectiveIndicators[objective] || []
    const matchCount = indicators.filter((indicator) =>
      captionLower.includes(indicator)
    ).length

    if (matchCount >= 2) return 2
    if (matchCount === 1) return 1
    return 0
  }

  /**
   * Score caption length compliance
   */
  private static scoreLengthCompliance(
    caption: string,
    criteria: ScoringCriteria
  ): { score: number; issue?: string } {
    const length = caption.length

    // Get platform-specific length guidelines
    let idealLength = criteria.targetLength || 125
    let maxLength = 2200

    if (criteria.platform) {
      const preset =
        PLATFORM_PRESETS[criteria.platform as keyof typeof PLATFORM_PRESETS]
      if (preset) {
        idealLength = preset.idealLength
        maxLength = preset.maxLength
      }
    }

    // Check if over max (serious issue)
    if (length > maxLength) {
      return {
        score: 0,
        issue: `Over ${maxLength} char limit (${length} chars)`,
      }
    }

    // Check if close to ideal
    const deviation = Math.abs(length - idealLength)
    const deviationPercent = deviation / idealLength

    if (deviationPercent <= 0.2) {
      // Within 20% of ideal
      return { score: 2 }
    } else if (deviationPercent <= 0.5) {
      // Within 50% of ideal
      return {
        score: 1,
        issue: `${length} chars (target ~${idealLength})`,
      }
    } else {
      // More than 50% off
      return {
        score: 0,
        issue: `${length} chars (target ~${idealLength})`,
      }
    }
  }

  /**
   * Score constraint compliance (must include/exclude phrases)
   */
  private static scoreConstraintCompliance(
    caption: string,
    criteria: ScoringCriteria
  ): { score: number; issue?: string; criticalViolation?: boolean } {
    const captionLower = caption.toLowerCase()
    let score = 3
    const issues: string[] = []

    // Check must-exclude phrases (critical)
    if (criteria.mustExcludePhrases && criteria.mustExcludePhrases.length > 0) {
      const violations = criteria.mustExcludePhrases.filter((phrase) =>
        captionLower.includes(phrase.toLowerCase())
      )

      if (violations.length > 0) {
        return {
          score: 0,
          issue: `Contains forbidden: "${violations[0]}"`,
          criticalViolation: true,
        }
      }
    }

    // Check must-include phrases
    if (criteria.mustIncludePhrases && criteria.mustIncludePhrases.length > 0) {
      const missing = criteria.mustIncludePhrases.filter(
        (phrase) => !captionLower.includes(phrase.toLowerCase())
      )

      if (missing.length > 0) {
        score = Math.max(0, score - missing.length)
        issues.push(`Missing required: "${missing[0]}"`)
      }
    }

    return {
      score,
      issue: issues.length > 0 ? issues[0] : undefined,
    }
  }

  /**
   * Batch score multiple captions
   */
  static batchScore(
    captions: Array<{ id: string; text: string }>,
    criteria: ScoringCriteria
  ): Array<{ id: string; score: CaptionScore }> {
    return captions.map((caption) => ({
      id: caption.id,
      score: this.scoreCaption(caption.text, criteria),
    }))
  }

  /**
   * Get top N captions by score
   */
  static getTopCaptions<T extends { id: string; text: string }>(
    captions: T[],
    criteria: ScoringCriteria,
    topN: number = 3
  ): Array<T & { score: CaptionScore }> {
    const scored = captions.map((caption) => ({
      ...caption,
      score: this.scoreCaption(caption.text, criteria),
    }))

    return scored
      .sort((a, b) => b.score.totalScore - a.score.totalScore)
      .slice(0, topN)
  }

  /**
   * Score a caption variation using the 4-rubric system mentioned in the feedback
   */
  static scoreCaptionVariation(
    text: string,
    brandVoicePrompt: string,
    campaignContext?: {
      objective?: string
      targetAudience?: string
      brandPersonality?: string
    }
  ): {
    clarity: number
    originality: number
    brandConsistency: number
    platformRelevance: number
    totalScore: number
  } {
    // Note: In a real implementation, you would use AI to analyze the caption
    // For now, we'll use heuristics based on content analysis

    // Simulate clarity score (1-10)
    // Longer, more descriptive captions with clear subject matter score higher
    const clarity = this.calculateClarityScore(text)

    // Simulate originality score (1-10)
    // Vary based on unique word usage and sentence structure
    const originality = this.calculateOriginalityScore(text)

    // Simulate brand consistency score (1-10)
    // Based on alignment with brand voice and personality
    const brandConsistency = this.calculateBrandConsistencyScore(
      text,
      brandVoicePrompt
    )

    // Simulate platform relevance score (1-10)
    // Based on caption structure and length being appropriate for the target platform
    const platformRelevance = this.calculatePlatformRelevanceScore(text)

    const totalScore = Math.round(
      (clarity + originality + brandConsistency + platformRelevance) / 4
    )

    return {
      clarity,
      originality,
      brandConsistency,
      platformRelevance,
      totalScore,
    }
  }

  private static calculateClarityScore(text: string): number {
    // Longer text with complete sentences scores higher
    // Clear action words and specific nouns also help
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length
    const hasCallToAction =
      /buy|get|try|learn|discover|explore|click|share|comment|visit|shop|order|sign up|join/i.test(
        text
      )
    const hasSpecificNouns =
      /product|feature|thing|tool|service|app|platform|device|item|solution|way|method/i.test(
        text.toLowerCase()
      )

    let score = 5 // base score

    if (wordCount >= 10 && wordCount <= 50) score += 2
    else if (wordCount > 50) score += 1

    if (hasCallToAction) score += 2
    if (hasSpecificNouns) score += 1

    return Math.min(10, Math.max(1, score))
  }

  private static calculateOriginalityScore(text: string): number {
    // Check against common phrases, calculate uniqueness
    const commonPhrases = [
      'check this out',
      'amazing',
      'incredible',
      'best',
      'top',
      'awesome',
    ]
    const lowerText = text.toLowerCase()

    let matches = 0
    for (const phrase of commonPhrases) {
      if (lowerText.includes(phrase)) matches++
    }

    let score = 10 - matches * 2 // -2 points per common phrase

    // Bonus for unique length or structure
    const uniqueElements = /#|#\w+|@\w+|emoji|smiley|:|;|-|_|,|\.|!|\?/.test(
      text
    )
      ? 1
      : 0
    score += uniqueElements

    return Math.min(10, Math.max(1, score))
  }

  private static calculateBrandConsistencyScore(
    text: string,
    brandVoice: string
  ): number {
    // Simulate checking alignment with brand voice
    const brandLower = brandVoice.toLowerCase()
    const textLower = text.toLowerCase()

    let score = 3 // base score

    // Check for alignment with brand personality keywords
    const personalityKeywords = [
      'professional',
      'fun',
      'innovative',
      'premium',
      'approachable',
      'bold',
      'minimal',
    ]
    for (const keyword of personalityKeywords) {
      if (brandLower.includes(keyword)) {
        if (
          textLower.includes(keyword) ||
          (keyword === 'professional' &&
            /expert|reliable|quality|trusted/.test(textLower)) ||
          (keyword === 'fun' &&
            /fun|exciting|enjoy|party|celebrate/.test(textLower)) ||
          (keyword === 'innovative' &&
            /new|revolutionary|cutting edge|first/.test(textLower))
        ) {
          score += 2
        }
      }
    }

    return Math.min(10, Math.max(1, score))
  }

  private static calculatePlatformRelevanceScore(text: string): number {
    // Score based on typical platform-specific patterns
    const hasHashtag = text.includes('#')
    const isShort = text.length < 100
    const isMedium = text.length >= 100 && text.length <= 300
    const hasEmojis =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(
        text
      )

    let score = 5 // base score

    // Instagram/Facebook: hashtags, emojis, medium length
    if (hasHashtag) score += 2
    if (hasEmojis) score += 1
    if (isMedium) score += 1
    else if (isShort) score += 0.5

    return Math.min(10, Math.max(1, score))
  }
}
