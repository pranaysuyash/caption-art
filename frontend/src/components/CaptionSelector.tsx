/**
 * CaptionSelector - Click-to-apply caption selection component
 * Requirements: 2.1, 2.2, 2.5, 2.6
 * 
 * Features:
 * - Displays captions as clickable cards
 * - Click to apply caption
 * - Highlights currently applied caption
 * - Hover preview indicator
 * - Visual feedback on selection
 * - Integrates with history system
 */

import { useState } from 'react'

export interface Caption {
  id: string
  text: string
  style?: string
  confidence?: number
}

export interface CaptionSelectorProps {
  captions: Caption[]
  selectedCaptionId?: string
  onSelect: (caption: Caption) => void
  onHover?: (caption: Caption | null) => void
  disabled?: boolean
  showConfidence?: boolean
}

export function CaptionSelector({
  captions,
  selectedCaptionId,
  onSelect,
  onHover,
  disabled = false,
  showConfidence = false,
}: CaptionSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleClick = (caption: Caption) => {
    if (disabled) return
    onSelect(caption)
  }

  const handleMouseEnter = (caption: Caption) => {
    if (disabled) return
    setHoveredId(caption.id)
    onHover?.(caption)
  }

  const handleMouseLeave = () => {
    setHoveredId(null)
    onHover?.(null)
  }

  if (captions.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary, #6b7280)',
          backgroundColor: 'var(--color-bg-secondary, #f3f4f6)',
          border: '2px dashed var(--color-border, #e5e7eb)',
          borderRadius: '8px',
        }}
      >
        <p style={{ margin: 0 }}>No captions available</p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
          Generate captions to get started
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
      role="listbox"
      aria-label="Caption options"
    >
      {captions.map((caption) => {
        const isSelected = caption.id === selectedCaptionId
        const isHovered = caption.id === hoveredId

        return (
          <div
            key={caption.id}
            role="option"
            aria-selected={isSelected}
            tabIndex={disabled ? -1 : 0}
            onClick={() => handleClick(caption)}
            onMouseEnter={() => handleMouseEnter(caption)}
            onMouseLeave={handleMouseLeave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick(caption)
              }
            }}
            style={{
              padding: '1rem',
              backgroundColor: isSelected
                ? 'var(--color-primary, #3b82f6)'
                : 'var(--color-bg-primary, white)',
              color: isSelected
                ? 'white'
                : 'var(--color-text, #1f2937)',
              border: `3px solid ${
                isSelected
                  ? 'var(--color-primary, #3b82f6)'
                  : isHovered
                  ? 'var(--color-primary, #3b82f6)'
                  : 'var(--color-border, #e5e7eb)'
              }`,
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              transform: isHovered && !disabled ? 'translateX(4px)' : 'translateX(0)',
              boxShadow: isSelected
                ? '4px 4px 0 var(--color-border, #000)'
                : isHovered
                ? '2px 2px 0 var(--color-border, #000)'
                : 'none',
              opacity: disabled ? 0.6 : 1,
              position: 'relative',
            }}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  width: '24px',
                  height: '24px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: 'var(--color-primary, #3b82f6)',
                }}
                aria-hidden="true"
              >
                ✓
              </div>
            )}

            {/* Hover indicator */}
            {isHovered && !isSelected && !disabled && (
              <div
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  width: '24px',
                  height: '24px',
                  backgroundColor: 'var(--color-bg-secondary, #f3f4f6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary, #6b7280)',
                }}
                aria-hidden="true"
              >
                →
              </div>
            )}

            {/* Caption text */}
            <div
              style={{
                fontSize: '1rem',
                lineHeight: 1.5,
                paddingRight: isSelected || isHovered ? '2.5rem' : 0,
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {caption.text}
            </div>

            {/* Metadata */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                opacity: isSelected ? 0.9 : 0.7,
              }}
            >
              {caption.style && (
                <span>
                  <strong>Style:</strong> {caption.style}
                </span>
              )}
              {showConfidence && caption.confidence !== undefined && (
                <span>
                  <strong>Confidence:</strong> {Math.round(caption.confidence * 100)}%
                </span>
              )}
              <span>
                <strong>Length:</strong> {caption.text.length} chars
              </span>
            </div>

            {/* Hover hint */}
            {isHovered && !isSelected && !disabled && (
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  fontStyle: 'italic',
                  opacity: 0.8,
                }}
              >
                Click to apply this caption
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Compact caption selector for smaller spaces
 */
export function CaptionSelectorCompact({
  captions,
  selectedCaptionId,
  onSelect,
  disabled = false,
}: Omit<CaptionSelectorProps, 'onHover' | 'showConfidence'>) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {captions.map((caption) => {
        const isSelected = caption.id === selectedCaptionId

        return (
          <button
            key={caption.id}
            onClick={() => onSelect(caption)}
            disabled={disabled}
            className={isSelected ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.75rem',
              fontSize: '0.875rem',
              justifyContent: 'flex-start',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isSelected && <span style={{ marginRight: '0.5rem' }}>✓</span>}
            {caption.text}
          </button>
        )
      })}
    </div>
  )
}
