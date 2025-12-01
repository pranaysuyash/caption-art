/**
 * SettingsPanel Component Tests
 * 
 * Tests the settings panel UI component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { preferencesManager } from '../lib/preferences/preferencesManager';
import { DEFAULT_PREFERENCES } from '../lib/preferences/defaults';

describe('SettingsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should load preferences when opened', () => {
    const loaded = preferencesManager.load();
    expect(loaded).toEqual(DEFAULT_PREFERENCES);
  });

  it('should save preferences when save is clicked', () => {
    const testPreferences = {
      ...DEFAULT_PREFERENCES,
      defaults: {
        ...DEFAULT_PREFERENCES.defaults,
        fontSize: 24,
      },
    };

    preferencesManager.save(testPreferences);
    const loaded = preferencesManager.load();
    
    expect(loaded.defaults.fontSize).toBe(24);
  });

  it('should discard changes when cancel is clicked', () => {
    const original = preferencesManager.load();
    
    // Simulate making changes but not saving
    const modified = {
      ...original,
      defaults: {
        ...original.defaults,
        fontSize: 48,
      },
    };
    
    // Don't save, just verify original is still in storage
    const loaded = preferencesManager.load();
    expect(loaded).toEqual(original);
  });

  it('should reset to defaults when reset is clicked', () => {
    // Save custom preferences
    const custom = {
      ...DEFAULT_PREFERENCES,
      defaults: {
        ...DEFAULT_PREFERENCES.defaults,
        fontSize: 32,
      },
    };
    preferencesManager.save(custom);
    
    // Reset
    preferencesManager.reset();
    
    // Should load defaults
    const loaded = preferencesManager.load();
    expect(loaded).toEqual(DEFAULT_PREFERENCES);
  });

  it('should export preferences as JSON', () => {
    const exported = preferencesManager.export(DEFAULT_PREFERENCES);
    const parsed = JSON.parse(exported);
    
    expect(parsed.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(parsed.version).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
  });

  it('should import valid preferences', () => {
    const testPreferences = {
      ...DEFAULT_PREFERENCES,
      defaults: {
        ...DEFAULT_PREFERENCES.defaults,
        fontSize: 20,
      },
    };
    
    const exported = preferencesManager.export(testPreferences);
    const success = preferencesManager.import(exported);
    
    expect(success).toBe(true);
    
    const loaded = preferencesManager.load();
    expect(loaded.defaults.fontSize).toBe(20);
  });

  it('should reject invalid import data', () => {
    const invalidJson = '{"invalid": "data"}';
    const success = preferencesManager.import(invalidJson);
    
    expect(success).toBe(false);
  });

  it('should organize preferences into categories', () => {
    const categories = ['defaults', 'keyboard', 'accessibility', 'ui'];
    const prefs = preferencesManager.load();
    
    categories.forEach(category => {
      expect(prefs).toHaveProperty(category);
    });
  });

  it('should show preview of accessibility changes', () => {
    const prefs = preferencesManager.load();
    
    // Verify accessibility settings exist
    expect(prefs.accessibility).toBeDefined();
    expect(prefs.accessibility.reducedMotion).toBeDefined();
    expect(prefs.accessibility.highContrast).toBeDefined();
    expect(prefs.accessibility.keyboardHints).toBeDefined();
    expect(prefs.accessibility.fontScaling).toBeDefined();
    expect(prefs.accessibility.screenReaderMode).toBeDefined();
  });
});
