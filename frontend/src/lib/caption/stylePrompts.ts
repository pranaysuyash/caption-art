/**
 * Style-specific prompts for caption generation
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.2
 */

import { CaptionStyle } from './types'

/**
 * Interface for style-specific prompt configuration
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export interface StylePrompt {
  style: CaptionStyle
  systemPrompt: string
  userPromptTemplate: string
  examples: string[]
}

/**
 * System prompt for caption writing
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export const SYSTEM_PROMPT = `You are a creative caption writer. Generate short, engaging captions for images.
Keep captions under 100 characters. Return results as a JSON array of strings.`


/**
 * Style-specific prompt definitions
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
const STYLE_PROMPTS: Record<CaptionStyle, StylePrompt> = {
  creative: {
    style: 'creative',
    systemPrompt: SYSTEM_PROMPT,
    userPromptTemplate: 'Rewrite this caption with imaginative, artistic language. Use vivid imagery and creative metaphors.',
    examples: [
      'A canvas of clouds painting the sky',
      'Dancing shadows whisper secrets',
      'Time frozen in a moment of wonder'
    ]
  },
  funny: {
    style: 'funny',
    systemPrompt: SYSTEM_PROMPT,
    userPromptTemplate: 'Rewrite this caption with humor and wit. Make it playful and entertaining.',
    examples: [
      'When life gives you lemons, make memes',
      'Plot twist: nobody expected this',
      'This is fine. Everything is fine.'
    ]
  },
  poetic: {
    style: 'poetic',
    systemPrompt: SYSTEM_PROMPT,
    userPromptTemplate: 'Rewrite this caption poetically. Use lyrical language, metaphors, and rhythm.',
    examples: [
      'Beneath the moon, dreams take flight',
      'Where silence speaks in gentle tones',
      'A symphony of light and shadow'
    ]
  },
  minimal: {
    style: 'minimal',
    systemPrompt: SYSTEM_PROMPT,
    userPromptTemplate: 'Rewrite this caption minimally. Use the fewest words possible while maintaining impact.',
    examples: [
      'Less is more',
      'Simply beautiful',
      'Moment captured'
    ]
  },
  dramatic: {
    style: 'dramatic',
    systemPrompt: SYSTEM_PROMPT,
    userPromptTemplate: 'Rewrite this caption dramatically. Use intense, emotional language that evokes strong feelings.',
    examples: [
      'A moment that changed everything forever',
      'The weight of destiny hangs in the air',
      'Nothing will ever be the same again'
    ]
  },
  quirky: {
    style: 'quirky',
    systemPrompt: SYSTEM_PROMPT,
    userPromptTemplate: 'Rewrite this caption quirkily. Use unconventional, whimsical language that\'s unexpected.',
    examples: [
      'Vibes? Immaculate. Hotel? Trivago.',
      'Main character energy activated',
      'No thoughts, just vibes'
    ]
  }
}


/**
 * Get formatted prompt for a specific style
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * @param style - The caption style to use
 * @param baseCaption - The base caption to rewrite
 * @returns Formatted prompt string for OpenAI
 */
export function getPrompt(style: CaptionStyle, baseCaption: string): string {
  const stylePrompt = STYLE_PROMPTS[style]
  if (!stylePrompt) {
    throw new Error(`Unknown style: ${style}`)
  }
  
  return `Base caption: "${baseCaption}"\n\n${stylePrompt.userPromptTemplate}`
}


/**
 * Get all available caption styles
 * Requirements: 5.2
 * 
 * @returns Array of all caption styles
 */
export function getAllStyles(): CaptionStyle[] {
  return Object.keys(STYLE_PROMPTS) as CaptionStyle[]
}

/**
 * Get description for a specific style
 * Requirements: 5.2
 * 
 * @param style - The caption style
 * @returns Human-readable description of the style
 */
export function getStyleDescription(style: CaptionStyle): string {
  const descriptions: Record<CaptionStyle, string> = {
    creative: 'Imaginative and artistic with vivid imagery',
    funny: 'Humorous and playful with wit',
    poetic: 'Lyrical and metaphorical with rhythm',
    minimal: 'Concise and impactful with few words',
    dramatic: 'Intense and emotional with strong feelings',
    quirky: 'Unconventional and whimsical with unexpected twists'
  }
  
  return descriptions[style] || 'Unknown style'
}
