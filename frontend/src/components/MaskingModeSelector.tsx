/**
 * MaskingModeSelector - UI component for selecting masking modes
 * Displays all 6 masking modes with preview thumbnails
 * Requirements: 7.1, 7.7, 7.8
 */

import React, { useState, useEffect } from 'react';
import { MaskingEngine, type MaskingMode, type MaskingConfig } from '../lib/masking/MaskingEngine';
import './MaskingModeSelector.css';

export interface MaskingModeSelectorProps {
  /** Currently selected mode */
  selectedMode: MaskingMode;
  /** Callback when mode is selected */
  onModeChange: (mode: MaskingMode) => void;
  /** Text canvas for preview generation */
  textCanvas?: HTMLCanvasElement;
  /** Mask canvas for preview generation */
  maskCanvas?: HTMLCanvasElement;
  /** Whether to show preview thumbnails on hover */
  showPreviews?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * MaskingModeSelector component
 */
export const MaskingModeSelector: React.FC<MaskingModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  textCanvas,
  maskCanvas,
  showPreviews = true,
  disabled = false,
}) => {
  const [hoveredMode, setHoveredMode] = useState<MaskingMode | null>(null);
  const [previews, setPreviews] = useState<Map<MaskingMode, string>>(new Map());

  const modes = MaskingEngine.getModes();
  const engine = MaskingEngine.getInstance();

  // Generate previews when canvases are available
  useEffect(() => {
    if (!textCanvas || !maskCanvas || !showPreviews) {
      return;
    }

    const newPreviews = new Map<MaskingMode, string>();

    modes.forEach(({ mode }) => {
      try {
        const config: MaskingConfig = { mode };
        const thumbnail = engine.generatePreview(textCanvas, maskCanvas, config, 80);
        newPreviews.set(mode, thumbnail.toDataURL());
      } catch (error) {
        console.error(`Failed to generate preview for ${mode}:`, error);
      }
    });

    setPreviews(newPreviews);
  }, [textCanvas, maskCanvas, showPreviews]);

  const handleModeClick = (mode: MaskingMode) => {
    if (disabled) return;
    onModeChange(mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent, mode: MaskingMode) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onModeChange(mode);
    }
  };

  return (
    <div className="masking-mode-selector">
      <h3 className="masking-mode-selector__title">Masking Mode</h3>
      <div className="masking-mode-selector__grid">
        {modes.map(({ mode, name, description }) => {
          const isSelected = mode === selectedMode;
          const isHovered = mode === hoveredMode;
          const previewUrl = previews.get(mode);

          return (
            <div
              key={mode}
              className={`masking-mode-card ${isSelected ? 'masking-mode-card--selected' : ''} ${
                disabled ? 'masking-mode-card--disabled' : ''
              }`}
              onClick={() => handleModeClick(mode)}
              onMouseEnter={() => setHoveredMode(mode)}
              onMouseLeave={() => setHoveredMode(null)}
              onKeyDown={(e) => handleKeyDown(e, mode)}
              tabIndex={disabled ? -1 : 0}
              role="button"
              aria-pressed={isSelected}
              aria-label={`${name}: ${description}`}
              aria-disabled={disabled}
            >
              {/* Preview thumbnail */}
              {showPreviews && previewUrl && (
                <div className="masking-mode-card__preview">
                  <img
                    src={previewUrl}
                    alt={`${name} preview`}
                    className="masking-mode-card__preview-image"
                  />
                </div>
              )}

              {/* Mode info */}
              <div className="masking-mode-card__info">
                <div className="masking-mode-card__name">
                  {isSelected && <span className="masking-mode-card__checkmark">✓</span>}
                  {name}
                </div>
                <div className="masking-mode-card__description">{description}</div>
              </div>

              {/* Hover indicator */}
              {isHovered && !disabled && (
                <div className="masking-mode-card__hover-indicator" aria-hidden="true">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
