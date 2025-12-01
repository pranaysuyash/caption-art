/**
 * TextEffectsPanel - UI for configuring text effects
 * Provides controls for outline, gradient, and pattern effects
 */

import { useState, useRef } from 'react';
import type { TextEffects, ColorStop } from '../lib/text/textEffects';

export interface TextEffectsPanelProps {
  /** Current text effects configuration */
  effects: TextEffects;
  /** Callback when effects change */
  onChange: (effects: TextEffects) => void;
  /** Disable all controls */
  disabled?: boolean;
}

/**
 * TextEffectsPanel component - provides UI for configuring text effects
 */
export function TextEffectsPanel({
  effects,
  onChange,
  disabled = false,
}: TextEffectsPanelProps) {
  const [activeTab, setActiveTab] = useState<'outline' | 'gradient' | 'pattern'>('outline');
  const patternInputRef = useRef<HTMLInputElement>(null);

  // Outline handlers
  const handleOutlineToggle = () => {
    onChange({
      ...effects,
      outline: { ...effects.outline, enabled: !effects.outline.enabled },
    });
  };

  const handleOutlineWidthChange = (width: number) => {
    onChange({
      ...effects,
      outline: { ...effects.outline, width },
    });
  };

  const handleOutlineColorChange = (color: string) => {
    onChange({
      ...effects,
      outline: { ...effects.outline, color },
    });
  };

  // Gradient handlers
  const handleGradientToggle = () => {
    onChange({
      ...effects,
      gradient: { ...effects.gradient, enabled: !effects.gradient.enabled },
    });
  };

  const handleGradientTypeChange = (type: 'linear' | 'radial') => {
    onChange({
      ...effects,
      gradient: { ...effects.gradient, type },
    });
  };

  const handleGradientAngleChange = (angle: number) => {
    onChange({
      ...effects,
      gradient: { ...effects.gradient, angle },
    });
  };

  const handleColorStopChange = (index: number, updates: Partial<ColorStop>) => {
    const newColorStops = [...effects.gradient.colorStops];
    newColorStops[index] = { ...newColorStops[index], ...updates };
    onChange({
      ...effects,
      gradient: { ...effects.gradient, colorStops: newColorStops },
    });
  };

  const handleAddColorStop = () => {
    const newColorStops = [
      ...effects.gradient.colorStops,
      { color: '#000000', position: 1.0 },
    ];
    onChange({
      ...effects,
      gradient: { ...effects.gradient, colorStops: newColorStops },
    });
  };

  const handleRemoveColorStop = (index: number) => {
    if (effects.gradient.colorStops.length <= 2) return; // Keep minimum 2 stops
    const newColorStops = effects.gradient.colorStops.filter((_, i) => i !== index);
    onChange({
      ...effects,
      gradient: { ...effects.gradient, colorStops: newColorStops },
    });
  };

  // Pattern handlers
  const handlePatternToggle = () => {
    onChange({
      ...effects,
      pattern: { ...effects.pattern, enabled: !effects.pattern.enabled },
    });
  };

  const handlePatternScaleChange = (scale: number) => {
    onChange({
      ...effects,
      pattern: { ...effects.pattern, scale },
    });
  };

  const handlePatternUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onChange({
          ...effects,
          pattern: { ...effects.pattern, image: img },
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
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
        Text Effects
      </h3>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-xs)',
          borderBottom: 'var(--border-width-thin) solid var(--color-border)',
        }}
      >
        {(['outline', 'gradient', 'pattern'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            disabled={disabled}
            className="button"
            aria-label={`${tab.charAt(0).toUpperCase() + tab.slice(1)} effects tab`}
            aria-selected={activeTab === tab}
            role="tab"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              padding: 'var(--spacing-sm) var(--spacing-md)',
              border: 'none',
              background: activeTab === tab ? 'var(--color-accent-turquoise)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--color-text)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              borderBottom: activeTab === tab ? '3px solid var(--color-accent-turquoise)' : 'none',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Outline Tab */}
      {activeTab === 'outline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <input
              type="checkbox"
              checked={effects.outline.enabled}
              onChange={handleOutlineToggle}
              disabled={disabled}
            />
            <span style={{ fontWeight: 600 }}>Enable Outline</span>
          </label>

          {effects.outline.enabled && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <label style={{ fontWeight: 600 }}>
                  Width: {effects.outline.width}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={effects.outline.width}
                  onChange={(e) => handleOutlineWidthChange(Number(e.target.value))}
                  disabled={disabled}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <label style={{ fontWeight: 600 }}>Color</label>
                <input
                  type="color"
                  value={effects.outline.color}
                  onChange={(e) => handleOutlineColorChange(e.target.value)}
                  disabled={disabled}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Gradient Tab */}
      {activeTab === 'gradient' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <input
              type="checkbox"
              checked={effects.gradient.enabled}
              onChange={handleGradientToggle}
              disabled={disabled}
            />
            <span style={{ fontWeight: 600 }}>Enable Gradient</span>
          </label>

          {effects.gradient.enabled && (
            <>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                  onClick={() => handleGradientTypeChange('linear')}
                  disabled={disabled}
                  className="button"
                  aria-label="Linear gradient"
                  aria-pressed={effects.gradient.type === 'linear'}
                  style={{
                    flex: 1,
                    background: effects.gradient.type === 'linear' ? 'var(--color-accent-turquoise)' : 'var(--color-bg)',
                    color: effects.gradient.type === 'linear' ? 'white' : 'var(--color-text)',
                  }}
                >
                  Linear
                </button>
                <button
                  onClick={() => handleGradientTypeChange('radial')}
                  disabled={disabled}
                  className="button"
                  aria-label="Radial gradient"
                  aria-pressed={effects.gradient.type === 'radial'}
                  style={{
                    flex: 1,
                    background: effects.gradient.type === 'radial' ? 'var(--color-accent-turquoise)' : 'var(--color-bg)',
                    color: effects.gradient.type === 'radial' ? 'white' : 'var(--color-text)',
                  }}
                >
                  Radial
                </button>
              </div>

              {effects.gradient.type === 'linear' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <label style={{ fontWeight: 600 }}>
                    Angle: {effects.gradient.angle}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={effects.gradient.angle}
                    onChange={(e) => handleGradientAngleChange(Number(e.target.value))}
                    disabled={disabled}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <label style={{ fontWeight: 600 }}>Color Stops</label>
                {effects.gradient.colorStops.map((stop, index) => (
                  <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => handleColorStopChange(index, { color: e.target.value })}
                      disabled={disabled}
                      style={{ width: '60px', height: '30px', cursor: 'pointer' }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={stop.position}
                      onChange={(e) => handleColorStopChange(index, { position: Number(e.target.value) })}
                      disabled={disabled}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 'var(--font-size-xs)', minWidth: '40px' }}>
                      {(stop.position * 100).toFixed(0)}%
                    </span>
                    {effects.gradient.colorStops.length > 2 && (
                      <button
                        onClick={() => handleRemoveColorStop(index)}
                        disabled={disabled}
                        className="button"
                        aria-label={`Remove color stop ${index + 1}`}
                        style={{ padding: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddColorStop}
                  disabled={disabled}
                  className="button button-secondary"
                  aria-label="Add color stop"
                  style={{ width: '100%' }}
                >
                  + Add Color Stop
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Pattern Tab */}
      {activeTab === 'pattern' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <input
              type="checkbox"
              checked={effects.pattern.enabled}
              onChange={handlePatternToggle}
              disabled={disabled}
            />
            <span style={{ fontWeight: 600 }}>Enable Pattern</span>
          </label>

          {effects.pattern.enabled && (
            <>
              <div>
                <input
                  ref={patternInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePatternUpload}
                  disabled={disabled}
                  aria-label="Upload pattern image"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => patternInputRef.current?.click()}
                  disabled={disabled}
                  className="button button-primary"
                  aria-label="Choose pattern image file"
                  style={{ width: '100%' }}
                >
                  {effects.pattern.image ? '✓ Pattern Loaded' : '📁 Upload Pattern'}
                </button>
              </div>

              {effects.pattern.image && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    <label style={{ fontWeight: 600 }}>
                      Scale: {(effects.pattern.scale * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={effects.pattern.scale}
                      onChange={(e) => handlePatternScaleChange(Number(e.target.value))}
                      disabled={disabled}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: '100px',
                      border: 'var(--border-width-thin) solid var(--color-border)',
                      background: `url(${effects.pattern.image.src})`,
                      backgroundSize: `${effects.pattern.scale * 100}%`,
                      backgroundRepeat: 'repeat',
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
