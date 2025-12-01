/**
 * RegenerateButton Component
 * Requirements: 6.1, 6.3, 6.4
 * 
 * Button for regenerating captions that:
 * - Renders regenerate button
 * - Disables during generation
 * - Applies neo-brutalism styling
 */

export interface RegenerateButtonProps {
  onRegenerate: () => void
  disabled?: boolean
}

/**
 * RegenerateButton component for triggering caption regeneration
 * Requirements: 6.1, 6.3, 6.4
 */
export function RegenerateButton({ onRegenerate, disabled = false }: RegenerateButtonProps) {
  return (
    <button
      className="button button-secondary"
      onClick={onRegenerate}
      disabled={disabled}
      aria-label="Regenerate captions with new variations"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
    >
      {/* Icon */}
      <span>🔄</span>
      
      {/* Text */}
      <span>Regenerate</span>
    </button>
  )
}
