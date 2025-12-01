/**
 * TextAlignmentControls - UI for selecting text alignment
 * Provides buttons for left, center, right, and justify alignment
 */

import type { TextAlignment } from '../lib/text/alignmentManager';

export interface TextAlignmentControlsProps {
  /** Currently selected alignment */
  alignment: TextAlignment;
  /** Callback when alignment changes */
  onChange: (alignment: TextAlignment) => void;
  /** Disable all controls */
  disabled?: boolean;
}

const ALIGNMENTS: Array<{ value: TextAlignment; label: string; icon: string }> = [
  { value: 'left', label: 'Left', icon: '⬅' },
  { value: 'center', label: 'Center', icon: '↔' },
  { value: 'right', label: 'Right', icon: '➡' },
  { value: 'justify', label: 'Justify', icon: '⬌' },
];

/**
 * TextAlignmentControls component - provides UI for text alignment selection
 */
export function TextAlignmentControls({
  alignment,
  onChange,
  disabled = false,
}: TextAlignmentControlsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)',
        padding: 'var(--spacing-xl)',
        background: 'var(--color-bg)',
        border: 'var(--border-width-medium) solid var(--color-border)',
        boxShadow: 'var(--shadow-offset-md) var(--shadow-offset-md) 0 var(--color-border)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--font-size-lg)',
          fontWeight: 700,
          margin: 0,
          color: 'var(--color-text)',
        }}
      >
        Text Alignment
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--spacing-md)',
        }}
      >
        {ALIGNMENTS.map((option) => {
          const isSelected = alignment === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className="button"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                padding: 'var(--spacing-md)',
                border: `var(--border-width-medium) solid var(--color-border)`,
                background: isSelected ? 'var(--color-accent-turquoise)' : 'var(--color-bg)',
                color: isSelected ? 'white' : 'var(--color-text)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                boxShadow: isSelected
                  ? `var(--shadow-offset-md) var(--shadow-offset-md) 0 var(--color-border)`
                  : `var(--shadow-offset-sm) var(--shadow-offset-sm) 0 var(--color-border)`,
                transform: isSelected ? 'translateY(-2px)' : 'none',
                transition: 'all var(--transition-base) var(--ease-smooth)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-xs)',
              }}
              aria-pressed={isSelected}
              aria-label={`Align text ${option.label.toLowerCase()}`}
            >
              <span style={{ fontSize: 'var(--font-size-md)' }}>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
