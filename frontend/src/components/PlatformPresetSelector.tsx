/**
 * Platform Preset Selector Component
 * Allows users to select platform-specific image size presets
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { useState } from 'react';
import type { ShareablePlatform } from '../lib/social/types';
import type { PlatformPreset } from '../lib/social/platformPresets';
import { getPlatformPresets, resizeCanvasToPreset } from '../lib/social/platformPresets';

export interface PlatformPresetSelectorProps {
  selectedPlatform: ShareablePlatform | null;
  onPlatformChange: (platform: ShareablePlatform) => void;
  onPresetSelect: (preset: PlatformPreset) => void;
  currentWidth?: number;
  currentHeight?: number;
}

export function PlatformPresetSelector({
  selectedPlatform,
  onPlatformChange,
  onPresetSelect,
  currentWidth,
  currentHeight,
}: PlatformPresetSelectorProps) {
  const platforms: ShareablePlatform[] = ['instagram', 'twitter', 'facebook', 'pinterest'];
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const getPlatformIcon = (platform: ShareablePlatform): string => {
    const icons: Record<ShareablePlatform, string> = {
      instagram: '📷',
      twitter: '🐦',
      facebook: '👥',
      pinterest: '📌',
    };
    return icons[platform];
  };

  const getPlatformDisplayName = (platform: ShareablePlatform): string => {
    const names: Record<ShareablePlatform, string> = {
      instagram: 'Instagram',
      twitter: 'Twitter',
      facebook: 'Facebook',
      pinterest: 'Pinterest',
    };
    return names[platform];
  };

  const handlePlatformClick = (platform: ShareablePlatform) => {
    onPlatformChange(platform);
    setSelectedPreset(null);
  };

  const handlePresetClick = (preset: PlatformPreset) => {
    setSelectedPreset(preset.name);
    onPresetSelect(preset);
  };

  const isCurrentSize = (preset: PlatformPreset): boolean => {
    if (!currentWidth || !currentHeight) return false;
    return currentWidth === preset.width && currentHeight === preset.height;
  };

  const presets = selectedPlatform ? getPlatformPresets(selectedPlatform) : [];

  return (
    <div className="platform-preset-selector">
      <div className="preset-selector-header">
        <h3>Platform Size Presets</h3>
        <p className="preset-hint">Optimize your image for social media platforms</p>
      </div>

      {/* Platform Selection */}
      <div className="platform-tabs">
        {platforms.map((platform) => (
          <button
            key={platform}
            className={`platform-tab ${selectedPlatform === platform ? 'active' : ''}`}
            onClick={() => handlePlatformClick(platform)}
            type="button"
          >
            <span className="platform-tab-icon">{getPlatformIcon(platform)}</span>
            <span className="platform-tab-name">{getPlatformDisplayName(platform)}</span>
          </button>
        ))}
      </div>

      {/* Preset Selection */}
      {selectedPlatform && presets.length > 0 && (
        <div className="preset-grid">
          {presets.map((preset) => {
            const isCurrent = isCurrentSize(preset);
            const isSelected = selectedPreset === preset.name;

            return (
              <button
                key={preset.name}
                className={`preset-card ${isSelected ? 'selected' : ''} ${
                  isCurrent ? 'current' : ''
                }`}
                onClick={() => handlePresetClick(preset)}
                type="button"
              >
                <div className="preset-visual">
                  <div
                    className="preset-rectangle"
                    style={{
                      aspectRatio: `${preset.width} / ${preset.height}`,
                    }}
                  />
                </div>
                <div className="preset-info">
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-dimensions">
                    {preset.width} × {preset.height}
                  </div>
                  {preset.description && (
                    <div className="preset-description">{preset.description}</div>
                  )}
                </div>
                {isCurrent && <div className="preset-badge current-badge">Current</div>}
                {isSelected && <div className="preset-check">✓</div>}
              </button>
            );
          })}
        </div>
      )}

      {!selectedPlatform && (
        <div className="preset-empty">
          <p>Select a platform to see available size presets</p>
        </div>
      )}

      <style>{`
        .platform-preset-selector {
          width: 100%;
        }

        .preset-selector-header {
          margin-bottom: 1.5rem;
        }

        .preset-selector-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .preset-hint {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .platform-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .platform-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .platform-tab:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .platform-tab.active {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #1e40af;
        }

        .platform-tab-icon {
          font-size: 1.25rem;
        }

        .platform-tab-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .preset-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .preset-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .preset-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .preset-card.current {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .preset-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 6px;
          margin-bottom: 1rem;
          min-height: 100px;
        }

        .preset-rectangle {
          width: 100%;
          max-width: 120px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .preset-info {
          flex: 1;
        }

        .preset-name {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .preset-dimensions {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .preset-description {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.5rem;
        }

        .preset-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.625rem;
          font-weight: 600;
        }

        .current-badge {
          background: #d1fae5;
          color: #065f46;
        }

        .preset-check {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          font-size: 0.875rem;
          font-weight: bold;
        }

        .preset-empty {
          padding: 3rem;
          text-align: center;
          color: #6b7280;
          background: #f9fafb;
          border-radius: 8px;
        }

        @media (max-width: 640px) {
          .preset-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
