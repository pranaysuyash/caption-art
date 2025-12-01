/**
 * CaptionCard Component
 * Requirements: 5.1, 5.2, 8.4
 * 
 * Individual caption display card that:
 * - Renders individual caption with style label
 * - Applies neo-brutalism styling
 * - Handles click to select
 * - Shows character count
 */

import { CaptionStyle } from '../lib/caption/types'

export interface CaptionCardProps {
  text: string
  style: CaptionStyle | 'base'
  label: string
  onClick: () => void
}

/**
 * CaptionCard component for displaying individual captions
 * Requirements: 5.1, 5.2, 8.4
 */
export function CaptionCard({ text, style, label, onClick }: CaptionCardProps) {
  const characterCount = text.length

  // Get style-specific color for the label
  const getLabelColor = (captionStyle: CaptionStyle | 'base'): string => {
    const colors: Record<CaptionStyle | 'base', string> = {
      base: '#4ECDC4',
      creative: '#FF6B6B',
      funny: '#FFD93D',
      poetic: '#A8E6CF',
      minimal: '#95E1D3',
      dramatic: '#F38181',
      quirky: '#AA96DA'
    }
    return colors[captionStyle] || '#4ECDC4'
  }

  const labelColor = getLabelColor(style)

  return (
    <button
      className="caption-card card-interactive"
      onClick={onClick}
      aria-label={`Select ${label} caption: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`}
    >
      {/* Style label - Requirements: 5.1, 5.2 */}
      <div className="caption-label" style={{ color: labelColor }}>
        <span>{label}</span>
        {/* Character count - Requirements: 8.4 */}
        <span style={{ opacity: 0.7 }}>
          {characterCount} chars
        </span>
      </div>

      {/* Caption text */}
      <div className="caption-text">
        {text}
      </div>

      {/* Neo-brutalism accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: labelColor,
          opacity: 0.3
        }}
      />
    </button>
  )
}
