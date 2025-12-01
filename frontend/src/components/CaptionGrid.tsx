/**
 * CaptionGrid Component
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2
 * 
 * Grid layout component for displaying caption suggestions that:
 * - Displays captions in a responsive grid with neo-brutalism cards
 * - Applies hover lift effects to cards
 * - Applies click bounce animation
 * - Shows skeleton loaders during loading
 * - Uses staggered entry animations when captions appear
 * - Integrates with existing caption logic
 */

import { CaptionCard } from './CaptionCard'
import { CaptionStyle } from '../lib/caption/types'

export interface CaptionGridProps {
  captions: Array<{ text: string; style: CaptionStyle | 'base'; label: string }>
  onSelect: (caption: string) => void
  loading: boolean
}

/**
 * CaptionGrid component for displaying caption suggestions in a grid
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2
 */
export function CaptionGrid({ captions, onSelect, loading }: CaptionGridProps) {
  // Skeleton loader component - Requirements: 5.4
  const SkeletonCard = ({ index }: { index: number }) => (
    <div 
      className={`caption-card skeleton-card stagger-${Math.min(index + 1, 5)}`}
      style={{
        minHeight: '120px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="loading-shimmer" style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 0
      }} />
    </div>
  )

  // Show skeleton loaders during loading - Requirements: 5.4
  if (loading) {
    return (
      <div className="caption-grid">
        {[...Array(6)].map((_, index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </div>
    )
  }

  // Don't render if no captions
  if (captions.length === 0) {
    return null
  }

  // Render caption cards with staggered entry animations - Requirements: 5.1, 5.2, 5.3, 5.5
  return (
    <div className="caption-grid">
      {captions.map((caption, index) => (
        <div
          key={`${caption.style}-${index}`}
          className={`stagger-${Math.min(index + 1, 5)}`}
        >
          <CaptionCard
            text={caption.text}
            style={caption.style}
            label={caption.label}
            onClick={() => onSelect(caption.text)}
          />
        </div>
      ))}
    </div>
  )
}
