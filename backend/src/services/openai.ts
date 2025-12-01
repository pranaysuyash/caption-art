import OpenAI from 'openai'
import { config } from '../config'
import { withRetry } from './replicate'

/**
 * Rewrites a base caption into multiple creative variants using OpenAI
 * @param baseCaption - The base caption to rewrite
 * @param keywords - Optional keywords to incorporate into variants
 * @returns Array of caption variants
 */
export async function rewriteCaption(
  baseCaption: string,
  keywords: string[] = []
): Promise<string[]> {
  return withRetry(
    async () => {
      const openai = new OpenAI({ apiKey: config.openai.apiKey })

      const keywordText =
        keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : ''

      const prompt = `You are a creative copywriter for image captions. Given a base caption, produce 5 concise, catchy variants for social posts. Keep 4-10 words each. Avoid hashtags, avoid quotes. ${keywordText ? 'If keywords are provided, weave 1-2 in naturally.' : ''} Base: "${baseCaption}". ${keywordText}`

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.openai.temperature,
      })

      const text = response.choices[0]?.message?.content || ''

      // Parse the response into individual variants
      // Split by newlines and clean up formatting
      const variants = text
        .split(/\n|\r/)
        .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 5)

      return variants
    },
    {
      maxRetries: 2, // Retry twice for OpenAI
      initialDelay: 1000,
      timeout: 30000,
    }
  )
}

/**
 * Generates a prompt for the next scene in a story using OpenAI
 * @param currentCaption - The caption of the current scene
 * @param styleContext - The style description to maintain consistency
 * @returns A prompt for the next scene
 */
export async function generateNextScenePrompt(
  currentCaption: string,
  styleContext: string
): Promise<string> {
  return withRetry(
    async () => {
      const openai = new OpenAI({ apiKey: config.openai.apiKey })

      const prompt = `You are a visual storyteller. Given the current scene: "${currentCaption}", write a concise visual description (prompt) for the NEXT scene in the story.
      
      Constraints:
      1. Keep the style consistent with: "${styleContext}".
      2. Focus on visual details (lighting, composition, subject action).
      3. Keep it under 40 words.
      4. Do not include "Next scene:" or similar prefixes. Just the visual description.`

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      })

      return response.choices[0]?.message?.content || ''
    },
    {
      maxRetries: 2,
      initialDelay: 1000,
      timeout: 30000,
    }
  )
}
