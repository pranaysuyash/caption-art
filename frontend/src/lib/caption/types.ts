/**
 * Core types and interfaces for the AI Caption Generation System
 * Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5
 */

/**
 * Available caption styles
 */
export type CaptionStyle = 'creative' | 'funny' | 'poetic' | 'minimal' | 'dramatic' | 'quirky'

/**
 * A caption variant with a specific style
 */
export interface CaptionVariant {
  text: string
  style: CaptionStyle
  confidence?: number
}

/**
 * Result of caption generation
 */
export interface GenerationResult {
  baseCaption: string
  variants: CaptionVariant[]
  generationTime: number
}

/**
 * State of the caption generation process
 */
export interface GenerationState {
  status: 'idle' | 'generating-base' | 'generating-variants' | 'complete' | 'error'
  baseCaption: string | null
  variants: CaptionVariant[]
  error: string | null
  progress: number // 0-100
}

/**
 * API error types and information
 */
export interface APIError {
  type: 'replicate' | 'openai' | 'network' | 'timeout' | 'rate-limit'
  message: string
  retryable: boolean
  retryAfter?: number
}
