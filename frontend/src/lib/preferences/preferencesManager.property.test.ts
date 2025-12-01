/**
 * Property-based tests for PreferencesManager
 * 
 * Feature: user-preferences-settings
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { PreferencesManager } from './preferencesManager';
import { UserPreferences, StylePreset, ExportFormat, Theme } from './types';

describe('PreferencesManager - Property Tests', () => {
  let manager: PreferencesManager;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    manager = new PreferencesManager();
    
    // Mock localStorage
    const storage: Record<string, string> = {};
    originalLocalStorage = window.localStorage;
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, value: string) => {
          storage[key] = value;
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
        clear: () => {
          Object.keys(storage).forEach(key => delete storage[key]);
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  /**
   * Arbitrary for StylePreset
   */
  const stylePresetArb = fc.constantFrom<StylePreset>(
    'minimal',
    'bold',
    'elegant',
    'playful'
  );

  /**
   * Arbitrary for ExportFormat
   */
  const exportFormatArb = fc.constantFrom<ExportFormat>('png', 'jpeg');

  /**
   * Arbitrary for Theme
   */
  const themeArb = fc.constantFrom<Theme>('light', 'dark');

  /**
   * Arbitrary for UserPreferences
   */
  const userPreferencesArb: fc.Arbitrary<UserPreferences> = fc.record({
    defaults: fc.record({
      stylePreset: stylePresetArb,
      exportFormat: exportFormatArb,
      exportQuality: fc.integer({ min: 0, max: 100 }),
      fontSize: fc.integer({ min: 8, max: 72 }),
    }),
    keyboard: fc.record({
      shortcuts: fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 })
      ),
    }),
    accessibility: fc.record({
      reducedMotion: fc.boolean(),
      highContrast: fc.boolean(),
      keyboardHints: fc.boolean(),
      fontScaling: fc.float({ min: 0.5, max: 3.0, noNaN: true }),
      screenReaderMode: fc.boolean(),
    }),
    ui: fc.record({
      theme: themeArb,
      language: fc.constantFrom('en', 'es', 'fr', 'de', 'ja', 'zh'),
    }),
  });

  /**
   * **Feature: user-preferences-settings, Property 1: Persistence round-trip**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any preference change, after saving and reloading, 
   * the preference should match the saved value
   */
  it('Property 1: Persistence round-trip - saved preferences should match loaded preferences', () => {
    fc.assert(
      fc.property(userPreferencesArb, (preferences) => {
        // Save preferences
        manager.save(preferences);
        
        // Load preferences
        const loaded = manager.load();
        
        // Verify they match
        expect(loaded).toEqual(preferences);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: user-preferences-settings, Property 2: Default fallback**
   * **Validates: Requirements 1.3, 1.4**
   * 
   * For any corrupted or missing preference, the system should use the default value
   */
  it('Property 2: Default fallback - corrupted data should return defaults', () => {
    fc.assert(
      fc.property(fc.string(), (corruptedData) => {
        // Clear localStorage first
        localStorage.clear();
        
        // Set corrupted data
        localStorage.setItem('user-preferences', corruptedData);
        
        // Load preferences
        const loaded = manager.load();
        
        // Should return valid preferences (either defaults or valid parsed data)
        expect(loaded).toBeDefined();
        expect(loaded.defaults).toBeDefined();
        expect(loaded.keyboard).toBeDefined();
        expect(loaded.accessibility).toBeDefined();
        expect(loaded.ui).toBeDefined();
        
        // Verify structure is valid
        expect(typeof loaded.defaults.stylePreset).toBe('string');
        expect(typeof loaded.defaults.exportFormat).toBe('string');
        expect(typeof loaded.defaults.exportQuality).toBe('number');
        expect(typeof loaded.defaults.fontSize).toBe('number');
        expect(typeof loaded.keyboard.shortcuts).toBe('object');
        expect(typeof loaded.accessibility.reducedMotion).toBe('boolean');
        expect(typeof loaded.accessibility.highContrast).toBe('boolean');
        expect(typeof loaded.accessibility.keyboardHints).toBe('boolean');
        expect(typeof loaded.accessibility.fontScaling).toBe('number');
        expect(typeof loaded.accessibility.screenReaderMode).toBe('boolean');
        expect(typeof loaded.ui.theme).toBe('string');
        expect(typeof loaded.ui.language).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: user-preferences-settings, Property 2: Default fallback**
   * **Validates: Requirements 1.3, 1.4**
   * 
   * When localStorage is empty, should return defaults
   */
  it('Property 2: Default fallback - missing data should return defaults', () => {
    // Clear localStorage
    localStorage.clear();
    
    // Load preferences
    const loaded = manager.load();
    
    // Should return defaults
    expect(loaded.defaults.stylePreset).toBe('minimal');
    expect(loaded.defaults.exportFormat).toBe('png');
    expect(loaded.defaults.exportQuality).toBe(90);
    expect(loaded.defaults.fontSize).toBe(16);
    expect(loaded.accessibility.reducedMotion).toBe(false);
    expect(loaded.accessibility.highContrast).toBe(false);
    expect(loaded.accessibility.keyboardHints).toBe(false);
    expect(loaded.accessibility.fontScaling).toBe(1.0);
    expect(loaded.accessibility.screenReaderMode).toBe(false);
    expect(loaded.ui.theme).toBe('light');
    expect(loaded.ui.language).toBe('en');
  });
});
