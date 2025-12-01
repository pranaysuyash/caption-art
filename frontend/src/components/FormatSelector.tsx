/**
 * FormatSelector Component
 * Allows users to select between PNG and JPEG export formats
 * Requirements: 2.1, 2.2, 2.5
 */

export interface FormatSelectorProps {
  format: 'png' | 'jpeg'
  onChange: (format: 'png' | 'jpeg') => void
  disabled?: boolean
}

export function FormatSelector({ format, onChange, disabled }: FormatSelectorProps) {
  return (
    <div 
      className="format-selector"
      style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        alignItems: 'center'
      }}
    >
      <label
        style={{
          fontWeight: 600,
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text)'
        }}
      >
        Format:
      </label>
      
      <div 
        style={{
          display: 'flex',
          gap: 'var(--spacing-lg)',
          alignItems: 'center'
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
        >
          <input
            type="radio"
            name="export-format"
            value="png"
            checked={format === 'png'}
            onChange={() => onChange('png')}
            disabled={disabled}
            style={{
              width: '20px',
              height: '20px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              accentColor: 'var(--color-accent-turquoise)'
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-base)',
              fontWeight: format === 'png' ? 600 : 400,
              color: 'var(--color-text)'
            }}
          >
            PNG (Lossless)
          </span>
        </label>
        
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
        >
          <input
            type="radio"
            name="export-format"
            value="jpeg"
            checked={format === 'jpeg'}
            onChange={() => onChange('jpeg')}
            disabled={disabled}
            style={{
              width: '20px',
              height: '20px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              accentColor: 'var(--color-accent-turquoise)'
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-base)',
              fontWeight: format === 'jpeg' ? 600 : 400,
              color: 'var(--color-text)'
            }}
          >
            JPEG (Smaller)
          </span>
        </label>
      </div>
    </div>
  )
}
