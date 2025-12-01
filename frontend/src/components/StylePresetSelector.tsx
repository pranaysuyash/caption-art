/**
 * StylePresetSelector - UI for selecting text style presets
 * Provides buttons for each preset with neo-brutalism styling
 */

import type { StylePreset } from '../lib/canvas/types';

export interface StylePresetSelectorProps {
  /** Currently selected preset */
  selectedPreset: StylePreset;
  /** Callback when preset changes */
  onChange: (preset: StylePreset) => void;
}

const PRESETS: Array<{ value: StylePreset; label: string; color: string }> = [
  { value: 'neon', label: 'Neon', color: 'var(--color-accent-turquoise)' },
  { value: 'magazine', label: 'Magazine', color: 'var(--color-accent-coral)' },
  { value: 'brush', label: 'Brush', color: 'var(--color-accent-yellow)' },
  { value: 'emboss', label: 'Emboss', color: 'var(--color-bg-secondary)' },
];

/**
 * StylePresetSelector component - provides UI for selecting text style presets
 */
export function StylePresetSelector({ selectedPreset, onChange }: StylePresetSelectorProps) {
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
        Text Style
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 'var(--spacing-md)',
        }}
      >
        {PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset.value;

          return (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              className="button"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                padding: 'var(--spacing-md)',
                border: `var(--border-width-medium) solid var(--color-border)`,
                background: isSelected ? preset.color : 'var(--color-bg)',
                color: isSelected && preset.value !== 'emboss' ? 'white' : 'var(--color-text)',
                cursor: 'pointer',
                boxShadow: isSelected
                  ? `var(--shadow-offset-md) var(--shadow-offset-md) 0 var(--color-border)`
                  : `var(--shadow-offset-sm) var(--shadow-offset-sm) 0 var(--color-border)`,
                transform: isSelected ? 'translateY(-2px)' : 'none',
                transition: 'all var(--transition-base) var(--ease-smooth)',
              }}
              aria-pressed={isSelected}
              aria-label={`Select ${preset.label} style preset`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
