/**
 * RegenerateMaskButton Component
 * Requirements: 6.1, 6.2, 6.4
 * 
 * Button for regenerating masks that:
 * - Renders regenerate button
 * - Disables during generation
 * - Applies neo-brutalism styling
 */

export interface RegenerateMaskButtonProps {
  onRegenerate: () => void
  disabled?: boolean
}

/**
 * RegenerateMaskButton component for triggering mask regeneration
 * Requirements: 6.1, 6.2, 6.4
 */
export function RegenerateMaskButton({ onRegenerate, disabled = false }: RegenerateMaskButtonProps) {
  return (
    <button
      className="button button-primary"
      onClick={onRegenerate}
      disabled={disabled}
      aria-label="Regenerate subject mask for image"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
    >
      {/* Icon */}
      <span aria-hidden="true">🔄</span>
      
      {/* Text */}
      <span>Regenerate Mask</span>
    </button>
  )
}
