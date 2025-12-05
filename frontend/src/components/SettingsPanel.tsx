/**
 * SettingsPanel Component
 * 
 * Main settings UI that displays all user preferences in a modal/panel.
 * Organizes preferences into categories with save/cancel functionality.
 * Shows preview of changes before applying.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../lib/preferences/types';
import { preferencesManager } from '../lib/preferences/preferencesManager';
import { accessibilityManager } from '../lib/preferences/accessibilityManager';
import { DEFAULT_PREFERENCES } from '../lib/preferences/defaults';
import { useToast } from './Toast';
import { useConfirm } from '../contexts/DialogContext';
import './SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (preferences: UserPreferences) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(
    preferencesManager.load()
  );
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences>(
    preferencesManager.load()
  );
  const [activeTab, setActiveTab] = useState<'defaults' | 'keyboard' | 'accessibility' | 'ui'>('defaults');
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  // Load preferences when panel opens
  useEffect(() => {
    if (isOpen) {
      const loaded = preferencesManager.load();
      setPreferences(loaded);
      setOriginalPreferences(loaded);
      setHasChanges(false);
    }
  }, [isOpen]);

  // Check if there are unsaved changes
  useEffect(() => {
    const changed = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  // Apply preview of accessibility changes
  useEffect(() => {
    if (isOpen && hasChanges) {
      accessibilityManager.applySettings(preferences.accessibility);
    }
  }, [preferences.accessibility, isOpen, hasChanges]);

  const handleSave = () => {
    // Requirement 5.4: WHEN a user clicks save THEN the User Preferences System SHALL apply and persist all changes
    preferencesManager.save(preferences);
    accessibilityManager.applySettings(preferences.accessibility);
    setOriginalPreferences(preferences);
    setHasChanges(false);
    
    if (onSave) {
      onSave(preferences);
    }
    
    onClose();
  };

  const handleCancel = () => {
    // Requirement 5.5: WHEN a user clicks cancel THEN the User Preferences System SHALL discard unsaved changes
    setPreferences(originalPreferences);
    accessibilityManager.applySettings(originalPreferences.accessibility);
    setHasChanges(false);
    onClose();
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Reset Settings',
      message: 'Are you sure you want to reset all settings to defaults?',
      confirmLabel: 'Reset',
      variant: 'warning',
    });
    
    if (confirmed) {
      setPreferences({ ...DEFAULT_PREFERENCES });
      setHasChanges(true);
      toast.info('Settings reset to defaults');
    }
  };

  const handleExport = () => {
    const json = preferencesManager.export(preferences);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preferences-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = event.target?.result as string;
          const success = preferencesManager.import(json);
          if (success) {
            const loaded = preferencesManager.load();
            setPreferences(loaded);
            setOriginalPreferences(loaded);
            toast.success('Settings imported successfully!');
          } else {
            toast.error('Failed to import settings. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-panel-overlay" onClick={handleCancel}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            className="close-button"
            onClick={handleCancel}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        {/* Requirement 5.2: Organize preferences into categories */}
        <div className="settings-tabs">
          <button
            className={activeTab === 'defaults' ? 'active' : ''}
            onClick={() => setActiveTab('defaults')}
          >
            Defaults
          </button>
          <button
            className={activeTab === 'keyboard' ? 'active' : ''}
            onClick={() => setActiveTab('keyboard')}
          >
            Keyboard
          </button>
          <button
            className={activeTab === 'accessibility' ? 'active' : ''}
            onClick={() => setActiveTab('accessibility')}
          >
            Accessibility
          </button>
          <button
            className={activeTab === 'ui' ? 'active' : ''}
            onClick={() => setActiveTab('ui')}
          >
            UI
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeTab === 'defaults' && (
            <div className="settings-section">
              <h3>Default Preferences</h3>
              
              <div className="setting-item">
                <label htmlFor="stylePreset">Default Style Preset</label>
                <select
                  id="stylePreset"
                  value={preferences.defaults.stylePreset}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      defaults: {
                        ...preferences.defaults,
                        stylePreset: e.target.value as any,
                      },
                    })
                  }
                >
                  <option value="minimal">Minimal</option>
                  <option value="bold">Bold</option>
                  <option value="elegant">Elegant</option>
                  <option value="playful">Playful</option>
                </select>
              </div>

              <div className="setting-item">
                <label htmlFor="exportFormat">Default Export Format</label>
                <select
                  id="exportFormat"
                  value={preferences.defaults.exportFormat}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      defaults: {
                        ...preferences.defaults,
                        exportFormat: e.target.value as any,
                      },
                    })
                  }
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                </select>
              </div>

              <div className="setting-item">
                <label htmlFor="exportQuality">
                  Export Quality: {preferences.defaults.exportQuality}%
                </label>
                <input
                  type="range"
                  id="exportQuality"
                  min="1"
                  max="100"
                  value={preferences.defaults.exportQuality}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      defaults: {
                        ...preferences.defaults,
                        exportQuality: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="setting-item">
                <label htmlFor="fontSize">
                  Default Font Size: {preferences.defaults.fontSize}px
                </label>
                <input
                  type="range"
                  id="fontSize"
                  min="8"
                  max="72"
                  value={preferences.defaults.fontSize}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      defaults: {
                        ...preferences.defaults,
                        fontSize: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'keyboard' && (
            <div className="settings-section">
              <h3>Keyboard Shortcuts</h3>
              <p className="section-description">
                Keyboard shortcuts are managed in a separate editor.
              </p>
              <p className="section-note">
                Note: Full keyboard shortcut customization will be available in the KeyboardShortcutEditor component.
              </p>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="settings-section">
              <h3>Accessibility Options</h3>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.reducedMotion}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        accessibility: {
                          ...preferences.accessibility,
                          reducedMotion: e.target.checked,
                        },
                      })
                    }
                  />
                  Reduced Motion
                </label>
                <p className="setting-description">Disable animations</p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.highContrast}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        accessibility: {
                          ...preferences.accessibility,
                          highContrast: e.target.checked,
                        },
                      })
                    }
                  />
                  High Contrast
                </label>
                <p className="setting-description">Use high contrast colors</p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.keyboardHints}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        accessibility: {
                          ...preferences.accessibility,
                          keyboardHints: e.target.checked,
                        },
                      })
                    }
                  />
                  Keyboard Navigation Hints
                </label>
                <p className="setting-description">Show focus indicators</p>
              </div>

              <div className="setting-item">
                <label htmlFor="fontScaling">
                  Font Scaling: {(preferences.accessibility.fontScaling * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  id="fontScaling"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={preferences.accessibility.fontScaling}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      accessibility: {
                        ...preferences.accessibility,
                        fontScaling: parseFloat(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.screenReaderMode}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        accessibility: {
                          ...preferences.accessibility,
                          screenReaderMode: e.target.checked,
                        },
                      })
                    }
                  />
                  Screen Reader Mode
                </label>
                <p className="setting-description">Add additional ARIA labels</p>
              </div>

              {/* Requirement 5.3: Show preview of changes */}
              {hasChanges && (
                <div className="preview-notice">
                  <p>Preview: Accessibility changes are applied in real-time</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="settings-section">
              <h3>UI Preferences</h3>
              
              <div className="setting-item">
                <label htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  value={preferences.ui.theme}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      ui: {
                        ...preferences.ui,
                        theme: e.target.value as any,
                      },
                    })
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="setting-item">
                <label htmlFor="language">Language</label>
                <select
                  id="language"
                  value={preferences.ui.language}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      ui: {
                        ...preferences.ui,
                        language: e.target.value,
                      },
                    })
                  }
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <div className="footer-left">
            <button onClick={handleReset} className="btn btn-ghost">
              Reset to Defaults
            </button>
            <button onClick={handleExport} className="btn btn-ghost">
              Export
            </button>
            <button onClick={handleImport} className="btn btn-ghost">
              Import
            </button>
          </div>
          <div className="footer-right">
            <button onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={!hasChanges}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
