/**
 * ViewModeToggle - Toggle between compact and expanded views
 * Requirements: 5.1, 5.3
 */

import { ViewMode } from '../lib/disclosure/ProgressiveDisclosureManager'

export interface ViewModeToggleProps {
  mode: ViewMode
  onToggle: () => void
  hiddenCount?: number
}

export function ViewModeToggle({ mode, onToggle, hiddenCount = 0 }: ViewModeToggleProps) {
  const isCompact = mode === 'compact'

  return (
    <button
      onClick={onToggle}
      className="view-mode-toggle"
      aria-label={`Switch to ${isCompact ? 'expanded' : 'compact'} view`}
      title={`Switch to ${isCompact ? 'expanded' : 'compact'} view`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: 'var(--color-text, #1f2937)',
        backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
        border: '2px solid var(--color-border, #000)',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '4px 4px 0 var(--color-border, #000)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: '1.25rem' }}>
        {isCompact ? '⊞' : '⊟'}
      </span>

      {/* Label */}
      <span>{isCompact ? 'Expand' : 'Compact'}</span>

      {/* Hidden feature count badge - Requirement: 5.2 */}
      {isCompact && hiddenCount > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '1.25rem',
            height: '1.25rem',
            padding: '0 0.25rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'white',
            backgroundColor: 'var(--color-primary, #3b82f6)',
            borderRadius: '9999px',
          }}
          title={`${hiddenCount} hidden feature${hiddenCount === 1 ? '' : 's'}`}
        >
          {hiddenCount}
        </span>
      )}
    </button>
  )
}
