import OpenAI from 'openai'
import { log } from '../middleware/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface StyleProfile {
  tone: string[]
  vocabulary: string[]
  sentenceStructure: string
  punctuationStyle: string
  emojiUsage: string
  hashtagPattern: string
  averageLength: number
  uniquePatterns: string[]
}

export interface ReferenceCaption {
  text: string
  platform?: string
  performance?: 'high' | 'medium' | 'low'
}

export class StyleAnalyzer {
  /**
   * Analyze a collection of reference captions to extract style patterns
   */
  static async analyzeStyle(
    references: ReferenceCaption[]
  ): Promise<StyleProfile> {
    if (references.length === 0) {
      throw new Error('At least one reference caption is required')
    }

    try {
      // Use AI to analyze the style patterns
      const referencesText = references
        .map((ref, idx) => `Example ${idx + 1}:\n${ref.text}`)
        .join('\n\n')

      const systemPrompt = `You are a style analysis expert. Analyze the provided caption examples and extract detailed style patterns.

Your analysis should identify:
1. Tone (e.g., professional, casual, playful, inspirational)
2. Common vocabulary and word choices
3. Sentence structure patterns (short/long, simple/complex)
4. Punctuation style (heavy, minimal, specific patterns)
5. Emoji usage (frequency, placement, types)
6. Hashtag patterns (quantity, placement, style)
7. Average caption length
8. Unique stylistic patterns or signatures

Return your analysis as a JSON object with this structure:
{
  "tone": ["tone1", "tone2"],
  "vocabulary": ["word1", "word2", "phrase1"],
  "sentenceStructure": "description",
  "punctuationStyle": "description",
  "emojiUsage": "description",
  "hashtagPattern": "description",
  "averageLength": number,
  "uniquePatterns": ["pattern1", "pattern2"]
}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Analyze these caption examples and extract the style profile:\n\n${referencesText}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent analysis
        response_format: { type: 'json_object' },
      })

      const analysis = completion.choices[0]?.message?.content?.trim()

      if (!analysis) {
        throw new Error('Failed to analyze style: No content returned from AI')
      }

      const styleProfile = JSON.parse(analysis) as StyleProfile
      return styleProfile
    } catch (error) {
      log.error({ err: error }, 'Error analyzing caption style')
      throw new Error('Failed to analyze caption style')
    }
  }

  /**
   * Convert a style profile into prompt instructions for caption generation
   */
  static styleProfileToPrompt(profile: StyleProfile): string {
    const instructions = []

    if (profile.tone && profile.tone.length > 0) {
      instructions.push(`Tone: Maintain a ${profile.tone.join(', ')} tone`)
    }

    if (profile.vocabulary && profile.vocabulary.length > 0) {
      instructions.push(
        `Vocabulary: Use similar words and phrases like: ${profile.vocabulary.slice(0, 10).join(', ')}`
      )
    }

    if (profile.sentenceStructure) {
      instructions.push(`Sentence Structure: ${profile.sentenceStructure}`)
    }

    if (profile.punctuationStyle) {
      instructions.push(`Punctuation: ${profile.punctuationStyle}`)
    }

    if (profile.emojiUsage) {
      instructions.push(`Emojis: ${profile.emojiUsage}`)
    }

    if (profile.hashtagPattern) {
      instructions.push(`Hashtags: ${profile.hashtagPattern}`)
    }

    if (profile.averageLength) {
      instructions.push(
        `Length: Target approximately ${profile.averageLength} characters`
      )
    }

    if (profile.uniquePatterns && profile.uniquePatterns.length > 0) {
      instructions.push(
        `Unique Style Elements: ${profile.uniquePatterns.join('; ')}`
      )
    }

    return instructions.join('\n- ')
  }

  /**
   * Quick validation to ensure reference captions are suitable for analysis
   */
  static validateReferences(references: ReferenceCaption[]): {
    valid: boolean
    issues: string[]
  } {
    const issues: string[] = []

    if (references.length === 0) {
      issues.push('No reference captions provided')
      return { valid: false, issues }
    }

    if (references.length < 2) {
      issues.push(
        'At least 2 reference captions recommended for accurate style analysis'
      )
    }

    const emptyRefs = references.filter(
      (ref) => !ref.text || ref.text.trim().length === 0
    )
    if (emptyRefs.length > 0) {
      issues.push(`${emptyRefs.length} empty reference caption(s) found`)
    }

    const tooShortRefs = references.filter((ref) => ref.text.trim().length < 10)
    if (tooShortRefs.length > 0) {
      issues.push(
        `${tooShortRefs.length} reference caption(s) are very short (< 10 characters)`
      )
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }
}
