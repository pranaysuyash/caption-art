/**
 * ProfessionalTextEditor - Advanced text editing controls
 * Requirements: 8.1-8.8
 */

import React, { useState, useEffect } from 'react';
import type { TextEffects } from '../lib/text/textEffects';
import type { TextAlignment } from '../lib/text/alignmentManager';
import './ProfessionalTextEditor.css';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  color: string;
  letterSpacing: number;
  lineHeight: number;
  rotation: number;
  effects: TextEffects;
  alignment: TextAlignment;
}

export interface TextStylePreset {
  id: string;
  name: string;
  style: Partial<TextStyle>;
  isCustom?: boolean;
}

export interface ProfessionalTextEditorProps {
  /** Current text style */
  style: TextStyle;
  /** Callback when style changes */
  onChange: (style: TextStyle) => void;
  /** Available font families */
  availableFonts?: string[];
  /** Text style presets */
  presets?: TextStylePreset[];
  /** Callback to save custom preset */
  onSavePreset?: (name: string, style: TextStyle) => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Font pairing suggestions based on selected font
 */
const FONT_PAIRINGS: Record<string, string[]> = {
  'Arial': ['Georgia', 'Times New Roman', 'Courier New'],
  'Helvetica': ['Georgia', 'Garamond', 'Courier'],
  'Georgia': ['Arial', 'Helvetica', 'Verdana'],
  'Times New Roman': ['Arial', 'Helvetica', 'Verdana'],
  'Courier New': ['Arial', 'Helvetica', 'Georgia'],
  'Verdana': ['Georgia', 'Times New Roman', 'Courier New'],
};

/**
 * Default text style presets
 */
const DEFAULT_PRESETS: TextStylePreset[] = [
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    style: {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 72,
      fontWeight: 'bold',
      color: '#000000',
      letterSpacing: 2,
      effects: {
        fillColor: '#000000',
        outline: { enabled: true, width: 4, color: '#ffffff' },
        gradient: { enabled: false, type: 'linear', colorStops: [], angle: 0 },
        pattern: { enabled: false, image: null, scale: 1 },
      },
    },
  },
  {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 56,
      fontWeight: 'normal',
      fontStyle: 'italic',
      color: '#2c3e50',
      letterSpacing: 1,
      lineHeight: 1.4,
    },
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 64,
      fontWeight: 'bold',
      color: '#00ffff',
      effects: {
        fillColor: '#00ffff',
        outline: { enabled: true, width: 2, color: '#0088ff' },
        gradient: {
          enabled: true,
          type: 'linear',
          colorStops: [
            { color: '#00ffff', position: 0 },
            { color: '#0088ff', position: 1 },
          ],
          angle: 90,
        },
        pattern: { enabled: false, image: null, scale: 1 },
      },
    },
  },
];

/**
 * ProfessionalTextEditor component
 */
export const ProfessionalTextEditor: React.FC<ProfessionalTextEditorProps> = ({
  style,
  onChange,
  availableFonts = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'],
  presets = DEFAULT_PRESETS,
  onSavePreset,
  disabled = false,
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showFontPairings, setShowFontPairings] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');

  // Get font pairing suggestions (Requirement: 8.6)
  const fontPairings = FONT_PAIRINGS[style.fontFamily] || [];

  const updateStyle = (updates: Partial<TextStyle>) => {
    onChange({ ...style, ...updates });
  };

  const updateEffects = (updates: Partial<TextEffects>) => {
    onChange({
      ...style,
      effects: { ...style.effects, ...updates },
    });
  };

  const applyPreset = (preset: TextStylePreset) => {
    onChange({ ...style, ...preset.style });
    setShowPresets(false);
  };

  const saveCustomPreset = () => {
    if (customPresetName.trim() && onSavePreset) {
      onSavePreset(customPresetName.trim(), style);
      setCustomPresetName('');
    }
  };

  return (
    <div className="professional-text-editor">
      {/* Presets Section (Requirements: 8.7, 8.8) */}
      <div className="text-editor-section">
        <button
          className="text-editor-button text-editor-button--primary"
          onClick={() => setShowPresets(!showPresets)}
          disabled={disabled}
        >
          {showPresets ? 'Hide' : 'Show'} Presets
        </button>

        {showPresets && (
          <div className="text-editor-presets">
            {presets.map((preset) => (
              <button
                key={preset.id}
                className="text-editor-preset-card"
                onClick={() => applyPreset(preset)}
                disabled={disabled}
              >
                <span className="text-editor-preset-name">{preset.name}</span>
                {preset.isCustom && <span className="text-editor-preset-badge">Custom</span>}
              </button>
            ))}

            {/* Save custom preset (Requirement: 8.8) */}
            {onSavePreset && (
              <div className="text-editor-save-preset">
                <input
                  type="text"
                  className="text-editor-input"
                  placeholder="Preset name..."
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  disabled={disabled}
                />
                <button
                  className="text-editor-button"
                  onClick={saveCustomPreset}
                  disabled={disabled || !customPresetName.trim()}
                >
                  Save Current Style
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Font Controls (Requirement: 8.1) */}
      <div className="text-editor-section">
        <h3 className="text-editor-section-title">Font</h3>

        <div className="text-editor-control">
          <label className="text-editor-label">Font Family</label>
          <select
            className="text-editor-select"
            value={style.fontFamily}
            onChange={(e) => {
              updateStyle({ fontFamily: e.target.value });
              setShowFontPairings(true);
            }}
            disabled={disabled}
          >
            {availableFonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font pairing suggestions (Requirement: 8.6) */}
        {showFontPairings && fontPairings.length > 0 && (
          <div className="text-editor-font-pairings">
            <span className="text-editor-label">Pairs well with:</span>
            <div className="text-editor-font-pairing-list">
              {fontPairings.map((font) => (
                <button
                  key={font}
                  className="text-editor-font-pairing-button"
                  onClick={() => updateStyle({ fontFamily: font })}
                  disabled={disabled}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-editor-control">
          <label className="text-editor-label">Size: {style.fontSize}px</label>
          <input
            type="range"
            className="text-editor-slider"
            min="12"
            max="200"
            value={style.fontSize}
            onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
            disabled={disabled}
          />
        </div>

        <div className="text-editor-control">
          <label className="text-editor-label">Color</label>
          <input
            type="color"
            className="text-editor-color-input"
            value={style.color}
            onChange={(e) => updateStyle({ color: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="text-editor-control-group">
          <div className="text-editor-control">
            <label className="text-editor-label">Weight</label>
            <select
              className="text-editor-select"
              value={style.fontWeight}
              onChange={(e) => updateStyle({ fontWeight: e.target.value as any })}
              disabled={disabled}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </div>

          <div className="text-editor-control">
            <label className="text-editor-label">Style</label>
            <select
              className="text-editor-select"
              value={style.fontStyle}
              onChange={(e) => updateStyle({ fontStyle: e.target.value as any })}
              disabled={disabled}
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spacing Controls (Requirement: 8.2) */}
      <div className="text-editor-section">
        <h3 className="text-editor-section-title">Spacing</h3>

        <div className="text-editor-control">
          <label className="text-editor-label">Letter Spacing: {style.letterSpacing}px</label>
          <input
            type="range"
            className="text-editor-slider"
            min="-5"
            max="20"
            step="0.5"
            value={style.letterSpacing}
            onChange={(e) => updateStyle({ letterSpacing: parseFloat(e.target.value) })}
            disabled={disabled}
          />
        </div>

        <div className="text-editor-control">
          <label className="text-editor-label">Line Height: {style.lineHeight.toFixed(1)}</label>
          <input
            type="range"
            className="text-editor-slider"
            min="0.8"
            max="3"
            step="0.1"
            value={style.lineHeight}
            onChange={(e) => updateStyle({ lineHeight: parseFloat(e.target.value) })}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Effects Controls (Requirement: 8.3) */}
      <div className="text-editor-section">
        <h3 className="text-editor-section-title">Effects</h3>

        {/* Outline */}
        <div className="text-editor-control">
          <label className="text-editor-checkbox-label">
            <input
              type="checkbox"
              checked={style.effects.outline.enabled}
              onChange={(e) =>
                updateEffects({
                  outline: { ...style.effects.outline, enabled: e.target.checked },
                })
              }
              disabled={disabled}
            />
            Outline
          </label>

          {style.effects.outline.enabled && (
            <div className="text-editor-sub-controls">
              <div className="text-editor-control">
                <label className="text-editor-label">Width: {style.effects.outline.width}px</label>
                <input
                  type="range"
                  className="text-editor-slider"
                  min="1"
                  max="20"
                  value={style.effects.outline.width}
                  onChange={(e) =>
                    updateEffects({
                      outline: {
                        ...style.effects.outline,
                        width: parseInt(e.target.value),
                      },
                    })
                  }
                  disabled={disabled}
                />
              </div>

              <div className="text-editor-control">
                <label className="text-editor-label">Color</label>
                <input
                  type="color"
                  className="text-editor-color-input"
                  value={style.effects.outline.color}
                  onChange={(e) =>
                    updateEffects({
                      outline: { ...style.effects.outline, color: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>

        {/* Gradient */}
        <div className="text-editor-control">
          <label className="text-editor-checkbox-label">
            <input
              type="checkbox"
              checked={style.effects.gradient.enabled}
              onChange={(e) =>
                updateEffects({
                  gradient: { ...style.effects.gradient, enabled: e.target.checked },
                })
              }
              disabled={disabled}
            />
            Gradient
          </label>

          {style.effects.gradient.enabled && (
            <div className="text-editor-sub-controls">
              <div className="text-editor-control">
                <label className="text-editor-label">Type</label>
                <select
                  className="text-editor-select"
                  value={style.effects.gradient.type}
                  onChange={(e) =>
                    updateEffects({
                      gradient: {
                        ...style.effects.gradient,
                        type: e.target.value as 'linear' | 'radial',
                      },
                    })
                  }
                  disabled={disabled}
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>

              <div className="text-editor-control">
                <label className="text-editor-label">Angle: {style.effects.gradient.angle}°</label>
                <input
                  type="range"
                  className="text-editor-slider"
                  min="0"
                  max="360"
                  value={style.effects.gradient.angle}
                  onChange={(e) =>
                    updateEffects({
                      gradient: {
                        ...style.effects.gradient,
                        angle: parseInt(e.target.value),
                      },
                    })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rotation Control (Requirement: 8.4) */}
      <div className="text-editor-section">
        <h3 className="text-editor-section-title">Transform</h3>

        <div className="text-editor-control">
          <label className="text-editor-label">Rotation: {style.rotation}°</label>
          <input
            type="range"
            className="text-editor-slider"
            min="-180"
            max="180"
            value={style.rotation}
            onChange={(e) => updateStyle({ rotation: parseInt(e.target.value) })}
            disabled={disabled}
          />
          <input
            type="number"
            className="text-editor-number-input"
            min="-180"
            max="180"
            value={style.rotation}
            onChange={(e) => updateStyle({ rotation: parseInt(e.target.value) || 0 })}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Alignment Control */}
      <div className="text-editor-section">
        <h3 className="text-editor-section-title">Alignment</h3>

        <div className="text-editor-alignment-buttons">
          {(['left', 'center', 'right', 'justify'] as TextAlignment[]).map((align) => (
            <button
              key={align}
              className={`text-editor-alignment-button ${
                style.alignment === align ? 'text-editor-alignment-button--active' : ''
              }`}
              onClick={() => updateStyle({ alignment: align })}
              disabled={disabled}
              aria-label={`Align ${align}`}
            >
              {align.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
