/**
 * CollapsibleSection - Collapsible section with visual indicators
 * Requirements: 5.2
 */

import { ReactNode } from 'react'

export interface CollapsibleSectionProps {
  id: string
  title: string
  isExpanded: boolean
  onToggle: () => void
  hiddenItemCount?: number
  children: ReactNode
}

export function CollapsibleSection({
  id,
  title,
  isExpanded,
  onToggle,
  hiddenItemCount = 0,
  children,
}: CollapsibleSectionProps) {
  return (
    <div
      className="collapsible-section"
      style={{
        marginBottom: '1rem',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`section-${id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.75rem 1rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--color-text, #1f2937)',
          backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
          border: '2px solid var(--color-border, #000)',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary, #f3f4f6)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary, #f9fafb)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Expand/collapse icon */}
          <span
            style={{
              fontSize: '1.25rem',
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            ▶
          </span>

          {/* Title */}
          <span>{title}</span>

          {/* Hidden item count badge - Requirement: 5.2 */}
          {!isExpanded && hiddenItemCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '1.5rem',
                height: '1.5rem',
                padding: '0 0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'white',
                backgroundColor: 'var(--color-primary, #3b82f6)',
                borderRadius: '9999px',
              }}
              title={`${hiddenItemCount} hidden item${hiddenItemCount === 1 ? '' : 's'}`}
            >
              +{hiddenItemCount}
            </span>
          )}
        </div>

        {/* Hint text */}
        {!isExpanded && hiddenItemCount > 0 && (
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary, #6b7280)',
            }}
          >
            Click to expand
          </span>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          id={`section-${id}`}
          style={{
            marginTop: '0.5rem',
            padding: '1rem',
            border: '2px solid var(--color-border, #e5e7eb)',
            borderRadius: '4px',
            backgroundColor: 'var(--color-bg-primary, white)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
