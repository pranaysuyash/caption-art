/**
 * EffectPresetSelector - UI for managing text effect presets
 * Allows users to save, load, and delete effect presets
 */

import { useState, useEffect } from 'react';
import type { TextEffects } from '../lib/text/textEffects';
import { PresetManager } from '../lib/text/presetManager';

export interface EffectPresetSelectorProps {
  /** Current text effects configuration */
  currentEffects: TextEffects;
  /** Callback when a preset is loaded */
  onPresetLoad: (effects: TextEffects) => void;
  /** Callback when preset operation succeeds */
  onSuccess?: (message: string) => void;
  /** Callback when preset operation fails */
  onError?: (error: string) => void;
  /** Disable all controls */
  disabled?: boolean;
}

/**
 * EffectPresetSelector component - provides UI for preset management
 */
export function EffectPresetSelector({
  currentEffects,
  onPresetLoad,
  onSuccess,
  onError,
  disabled = false,
}: EffectPresetSelectorProps) {
  const [presetNames, setPresetNames] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load preset names on mount
  useEffect(() => {
    loadPresetNames();
  }, []);

  const loadPresetNames = async () => {
    try {
      const names = await PresetManager.getPresetNames();
      setPresetNames(names);
    } catch (error) {
      console.error('Failed to load preset names:', error);
    }
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      onError?.('Please enter a preset name');
      return;
    }

    setIsLoading(true);
    try {
      await PresetManager.savePreset(newPresetName.trim(), currentEffects);
      await loadPresetNames();
      setNewPresetName('');
      setShowSaveDialog(false);
      onSuccess?.(`Preset "${newPresetName.trim()}" saved successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to save preset: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreset = async (name: string) => {
    setIsLoading(true);
    try {
      const effects = await PresetManager.loadPreset(name);
      if (effects) {
        onPresetLoad(effects);
        setSelectedPreset(name);
        onSuccess?.(`Preset "${name}" loaded successfully`);
      } else {
        onError?.(`Preset "${name}" not found`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to load preset: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePreset = async (name: string) => {
    if (!confirm(`Are you sure you want to delete preset "${name}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await PresetManager.deletePreset(name);
      await loadPresetNames();
      if (selectedPreset === name) {
        setSelectedPreset('');
      }
      onSuccess?.(`Preset "${name}" deleted successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to delete preset: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

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
        Effect Presets
      </h3>

      {/* Save Preset Button */}
      <button
        onClick={() => setShowSaveDialog(!showSaveDialog)}
        disabled={disabled || isLoading}
        className="button button-primary"
        aria-label="Save current effects as preset"
        style={{
          width: '100%',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          padding: 'var(--spacing-md)',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled || isLoading ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-xs)',
        }}
      >
        <span>💾</span>
        <span>Save Current Effects</span>
      </button>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-md)',
            background: 'var(--color-bg-secondary)',
            border: 'var(--border-width-thin) solid var(--color-border)',
          }}
        >
          <label
            htmlFor="preset-name-input"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            Preset Name
          </label>
          <input
            id="preset-name-input"
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSavePreset();
              }
            }}
            placeholder="Enter preset name..."
            disabled={disabled || isLoading}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--spacing-sm)',
              border: 'var(--border-width-thin) solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={handleSavePreset}
              disabled={disabled || isLoading || !newPresetName.trim()}
              className="button button-primary"
              aria-label="Confirm save preset"
              style={{ flex: 1 }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setNewPresetName('');
              }}
              disabled={disabled || isLoading}
              className="button"
              aria-label="Cancel save preset"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved Presets List */}
      {presetNames.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <label
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            Saved Presets ({presetNames.length})
          </label>
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-xs)',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: 'var(--spacing-sm)',
              background: 'var(--color-bg-secondary)',
              border: 'var(--border-width-thin) solid var(--color-border)',
            }}
          >
            {presetNames.map((name) => {
              const isSelected = selectedPreset === name;
              
              return (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-xs)',
                    alignItems: 'center',
                  }}
                >
                  <button
                    onClick={() => handleLoadPreset(name)}
                    disabled={disabled || isLoading}
                    className="button"
                    aria-label={`Load preset ${name}`}
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      padding: 'var(--spacing-sm)',
                      border: `var(--border-width-thin) solid var(--color-border)`,
                      background: isSelected ? 'var(--color-accent-turquoise)' : 'var(--color-bg)',
                      color: isSelected ? 'white' : 'var(--color-text)',
                      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
                      opacity: disabled || isLoading ? 0.5 : 1,
                      textAlign: 'left',
                      transition: 'all var(--transition-base) var(--ease-smooth)',
                    }}
                    aria-pressed={isSelected}
                  >
                    {name}
                  </button>
                  
                  <button
                    onClick={() => handleDeletePreset(name)}
                    disabled={disabled || isLoading}
                    className="button"
                    aria-label={`Delete preset ${name}`}
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: 'var(--font-size-sm)',
                      background: 'var(--color-accent-coral)',
                      color: 'white',
                      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
                      opacity: disabled || isLoading ? 0.5 : 1,
                    }}
                    title={`Delete preset "${name}"`}
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            margin: 0,
            padding: 'var(--spacing-md)',
            background: 'var(--color-bg-secondary)',
            border: 'var(--border-width-thin) solid var(--color-border)',
          }}
        >
          No saved presets yet. Save your current effects to create a preset!
        </p>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Loading effect presets"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            padding: 'var(--spacing-sm)',
          }}
        >
          <span aria-hidden="true">⏳</span> Loading...
        </div>
      )}
    </div>
  );
}
