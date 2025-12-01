/**
 * AccessibilitySettings Component
 * 
 * Displays accessibility options with toggles and sliders.
 * Shows live preview of accessibility changes.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useEffect } from 'react';
import { AccessibilitySettings as AccessibilitySettingsType } from '../lib/preferences/accessibilityManager';
import { accessibilityManager } from '../lib/preferences/accessibilityManager';
import './AccessibilitySettings.css';

interface AccessibilitySettingsProps {
  settings: AccessibilitySettingsType;
  onChange: (settings: AccessibilitySettingsType) => void;
  showPreview?: boolean;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  settings,
  onChange,
  showPreview = true,
}) => {
  // Apply preview of changes in real-time
  useEffect(() => {
    if (showPreview) {
      accessibilityManager.applySettings(settings);
    }
  }, [settings, showPreview]);

  const handleToggle = (key: keyof AccessibilitySettingsType) => {
    onChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleFontScalingChange = (value: number) => {
    onChange({
      ...settings,
      fontScaling: value,
    });
  };

  const handleDetectSystemPreferences = () => {
    const detected = accessibilityManager.detectSystemPreferences();
    if (Object.keys(detected).length > 0) {
      onChange({
        ...settings,
        ...detected,
      });
      alert('System accessibility preferences detected and applied!');
    } else {
      alert('No system accessibility preferences detected.');
    }
  };

  return (
    <div className="accessibility-settings">
      <div className="settings-header">
        <h3>Accessibility Options</h3>
        <button
          onClick={handleDetectSystemPreferences}
          className="detect-button"
          title="Detect and apply system accessibility preferences"
        >
          Detect System Preferences
        </button>
      </div>

      <div className="settings-grid">
        {/* Requirement 4.1: Reduced Motion */}
        <div className="setting-card">
          <div className="setting-header">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={() => handleToggle('reducedMotion')}
                className="setting-checkbox"
              />
              <span className="setting-title">Reduced Motion</span>
            </label>
          </div>
          <p className="setting-description">
            Disable all animations and transitions for a calmer experience.
            Recommended for users sensitive to motion.
          </p>
          {showPreview && settings.reducedMotion && (
            <div className="preview-indicator active">
              ✓ Animations disabled
            </div>
          )}
        </div>

        {/* Requirement 4.2: High Contrast */}
        <div className="setting-card">
          <div className="setting-header">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={() => handleToggle('highContrast')}
                className="setting-checkbox"
              />
              <span className="setting-title">High Contrast</span>
            </label>
          </div>
          <p className="setting-description">
            Apply high-contrast color schemes for better visibility.
            Increases contrast between text and backgrounds.
          </p>
          {showPreview && settings.highContrast && (
            <div className="preview-indicator active">
              ✓ High contrast active
            </div>
          )}
        </div>

        {/* Requirement 4.3: Keyboard Navigation Hints */}
        <div className="setting-card">
          <div className="setting-header">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.keyboardHints}
                onChange={() => handleToggle('keyboardHints')}
                className="setting-checkbox"
              />
              <span className="setting-title">Keyboard Navigation Hints</span>
            </label>
          </div>
          <p className="setting-description">
            Display enhanced focus indicators when navigating with keyboard.
            Makes it easier to see which element is currently focused.
          </p>
          {showPreview && settings.keyboardHints && (
            <div className="preview-indicator active">
              ✓ Focus indicators enhanced
            </div>
          )}
        </div>

        {/* Requirement 4.4: Font Scaling */}
        <div className="setting-card full-width">
          <div className="setting-header">
            <span className="setting-title">Font Scaling</span>
            <span className="setting-value">
              {(settings.fontScaling * 100).toFixed(0)}%
            </span>
          </div>
          <p className="setting-description">
            Scale all text by a multiplier. Useful for users who need larger or smaller text.
          </p>
          <div className="slider-container">
            <span className="slider-label">50%</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.fontScaling}
              onChange={(e) => handleFontScalingChange(parseFloat(e.target.value))}
              className="setting-slider"
            />
            <span className="slider-label">200%</span>
          </div>
          {showPreview && (
            <div className="preview-text" style={{ fontSize: `${settings.fontScaling}em` }}>
              Preview: This is how text will appear at {(settings.fontScaling * 100).toFixed(0)}% scale
            </div>
          )}
        </div>

        {/* Requirement 4.5: Screen Reader Mode */}
        <div className="setting-card">
          <div className="setting-header">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.screenReaderMode}
                onChange={() => handleToggle('screenReaderMode')}
                className="setting-checkbox"
              />
              <span className="setting-title">Screen Reader Mode</span>
            </label>
          </div>
          <p className="setting-description">
            Add additional ARIA labels and live regions for screen reader users.
            Provides more context and announcements.
          </p>
          {showPreview && settings.screenReaderMode && (
            <div className="preview-indicator active">
              ✓ Enhanced ARIA labels active
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="preview-notice">
          <div className="notice-icon">👁️</div>
          <div className="notice-content">
            <strong>Live Preview Active</strong>
            <p>Changes are being applied in real-time so you can see how they affect the interface.</p>
          </div>
        </div>
      )}

      <div className="accessibility-info">
        <h4>About Accessibility Settings</h4>
        <p>
          These settings help make the application more comfortable and usable for everyone.
          They can be particularly helpful for users with visual impairments, motion sensitivity,
          or those who prefer keyboard navigation.
        </p>
        <p>
          <strong>Tip:</strong> You can also use the "Detect System Preferences" button to
          automatically apply accessibility settings from your operating system.
        </p>
      </div>
    </div>
  );
};
