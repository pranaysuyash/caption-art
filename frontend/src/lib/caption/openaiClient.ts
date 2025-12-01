/**
 * OpenAI API Client for caption style rewrites
 * Requirements: 1.1, 1.4, 4.1, 4.2, 4.3
 */

import { CaptionStyle, CaptionVariant } from './types'
import { retryWithBackoff } from './retryHandler'

/**
 * Configuration for OpenAI client
 * Requirements: 1.1, 1.4
 */
export interface OpenAIConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

/**
 * Request for caption rewriting
 * Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5
 */
export interface RewriteRequest {
  baseCaption: string
  styles: CaptionStyle[]
  maxLength: number
}

/**
 * Custom error class for OpenAI API errors
 * Requirements: 4.1, 4.2, 4.3
 */
export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryAfter?: number,
    public isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'OpenAIError'
  }
}

/**
 * Parse error response and return user-friendly message
 * Requirements: 4.1, 4.3
 */
function parseErrorResponse(response: Response, errorData: any): string {
  const status = response.status
  
  // Rate limiting
  if (status === 429) {
    return 'Service busy. Please wait a moment and try again.'
  }
  
  // Authentication errors
  if (status === 401 || status === 403) {
    return 'Authentication failed. Please check your API key.'
  }
  
  // Bad request
  if (status === 400) {
    return errorData.error?.message || 'Invalid request. Please try again.'
  }
  
  // Content policy violation
  if (status === 400 && errorData.error?.code === 'content_policy_violation') {
    return 'Unable to generate variations for this image.'
  }
  
  // Server errors
  if (status >= 500) {
    return 'Service temporarily unavailable. Please try again later.'
  }
  
  // Default message
  return errorData.error?.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Check if error is a network/connection failure
 * Requirements: 4.1, 4.3
 */
function isNetworkError(error: any): boolean {
  return (
    error instanceof TypeError ||
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('Failed to fetch')
  )
}

/**
 * Get style-specific prompt for caption rewriting
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
function getStylePrompt(style: CaptionStyle): string {
  const prompts: Record<CaptionStyle, string> = {
    creative: 'Use imaginative, artistic language with vivid imagery and creative metaphors.',
    funny: 'Add humor and wit. Make it playful and entertaining.',
    poetic: 'Use lyrical, metaphorical language with rhythm.',
    minimal: 'Use the fewest words possible while maintaining impact.',
    dramatic: 'Use intense, emotional language that evokes strong feelings.',
    quirky: 'Use unconventional, whimsical language that\'s unexpected.'
  }
  return prompts[style]
}

/**
 * Client for interacting with OpenAI API
 */
export class OpenAIClient {
  private config: OpenAIConfig
  private baseUrl = 'https://api.openai.com/v1'

  constructor(config: OpenAIConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required')
    }
    this.config = config
  }

  /**
   * Generate fallback captions when API fails
   * Requirements: 4.1, 4.2, 4.3
   */
  private generateFallbackCaptions(baseCaption: string, styles: CaptionStyle[]): CaptionVariant[] {
    // Create simple variations of the base caption
    const fallbacks: Record<CaptionStyle, (caption: string) => string> = {
      creative: (c) => `✨ ${c}`,
      funny: (c) => `😄 ${c}`,
      poetic: (c) => `${c}...`,
      minimal: (c) => c.split(' ').slice(0, 3).join(' '),
      dramatic: (c) => `${c}!`,
      quirky: (c) => `~ ${c} ~`
    }

    return styles.map(style => ({
      text: fallbacks[style](baseCaption),
      style
    }))
  }

  /**
   * Rewrite a base caption into multiple style variants
   * Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async rewriteCaption(request: RewriteRequest, signal?: AbortSignal): Promise<CaptionVariant[]> {
    const { baseCaption, styles, maxLength } = request

    // Construct the system prompt
    const systemPrompt = `You are a creative caption writer. Generate short, engaging captions for images.
Keep captions under ${maxLength} characters. Return results as a JSON array of strings.`

    // Construct the user prompt with style instructions
    const styleInstructions = styles.map((style, index) => 
      `${index + 1}. ${style.charAt(0).toUpperCase() + style.slice(1)}: ${getStylePrompt(style)}`
    ).join('\n')

    const userPrompt = `Base caption: "${baseCaption}"

Rewrite this caption in the following styles:
${styleInstructions}

Return as JSON array: ["creative caption", "funny caption", ...]`

    try {
      return await retryWithBackoff(async () => {
        try {
          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
            signal,
            body: JSON.stringify({
              model: this.config.model,
              temperature: this.config.temperature,
              max_tokens: this.config.maxTokens,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ]
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const userMessage = parseErrorResponse(response, errorData)
            
            // Handle rate limiting - retryable
            if (response.status === 429) {
              const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
              throw new OpenAIError(
                userMessage,
                429,
                retryAfter,
                true // retryable
              )
            }
            
            // Server errors (5xx) are retryable
            const isRetryable = response.status >= 500
            
            throw new OpenAIError(
              userMessage,
              response.status,
              undefined,
              isRetryable
            )
          }

          const data = await response.json()
          
          // Extract the response content
          const content = data.choices?.[0]?.message?.content
          if (!content) {
            throw new OpenAIError(
              'Invalid response from service. Please try again.',
              undefined,
              undefined,
              false
            )
          }

          // Parse JSON response
          let captions: string[]
          try {
            captions = JSON.parse(content)
          } catch (parseError) {
            // Try to extract captions manually if JSON parsing fails
            // Look for array-like structure or quoted strings
            const matches = content.match(/"([^"]+)"/g)
            if (matches && matches.length > 0) {
              captions = matches.map((m: string) => m.slice(1, -1))
            } else {
              throw new OpenAIError(
                'Some caption variations may be incomplete.',
                undefined,
                undefined,
                false
              )
            }
          }

          // Validate response structure
          if (!Array.isArray(captions) || captions.length === 0) {
            throw new OpenAIError(
              'Invalid response format. Please try again.',
              undefined,
              undefined,
              false
            )
          }

          // Map captions to variants with styles
          const variants: CaptionVariant[] = captions.slice(0, styles.length).map((text, index) => ({
            text: text.trim(),
            style: styles[index]
          }))

          return variants

        } catch (error) {
          // Handle network/connection failures
          if (isNetworkError(error)) {
            throw new OpenAIError(
              'Unable to connect to service. Please check your internet connection.',
              undefined,
              undefined,
              true // retryable
            )
          }
          throw error
        }
      }, { maxRetries: 2, initialDelay: 1000, maxDelay: 5000 })
    } catch (error) {
      // For content policy violations or severe errors, provide fallback captions
      if (error instanceof OpenAIError && 
          (error.message.includes('Unable to generate variations') || 
           error.message.includes('content policy'))) {
        console.warn('OpenAI API failed, using fallback captions:', error.message)
        return this.generateFallbackCaptions(baseCaption, styles)
      }
      
      // Ensure we always throw an OpenAIError with user-friendly message
      if (error instanceof OpenAIError) {
        throw error
      }
      
      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OpenAIError(
          'Caption generation was canceled.',
          undefined,
          undefined,
          false
        )
      }
      
      throw new OpenAIError(
        'Caption variation generation failed. Please try again.',
        undefined,
        undefined,
        false
      )
    }
  }
}
