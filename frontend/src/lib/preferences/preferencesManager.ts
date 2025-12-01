/**
 * PreferencesManager
 * 
 * Manages loading, saving, resetting, and importing/exporting user preferences.
 * Handles localStorage persistence with fallback to defaults.
 */

import { UserPreferences } from './types';
import { DEFAULT_PREFERENCES } from './defaults';

const STORAGE_KEY = 'user-preferences';
const STORAGE_VERSION = '1.0';

/**
 * Validates if an object matches the UserPreferences structure
 */
function isValidPreferences(obj: unknown): obj is UserPreferences {
  if (!obj || typeof obj !== 'object') return false;
  
  const prefs = obj as Partial<UserPreferences>;
  
  // Check required top-level properties
  if (!prefs.defaults || !prefs.keyboard || !prefs.accessibility || !prefs.ui) {
    return false;
  }
  
  // Check defaults structure
  if (
    typeof prefs.defaults.stylePreset !== 'string' ||
    typeof prefs.defaults.exportFormat !== 'string' ||
    typeof prefs.defaults.exportQuality !== 'number' ||
    typeof prefs.defaults.fontSize !== 'number'
  ) {
    return false;
  }
  
  // Check keyboard structure
  if (typeof prefs.keyboard.shortcuts !== 'object') {
    return false;
  }
  
  // Check accessibility structure
  if (
    typeof prefs.accessibility.reducedMotion !== 'boolean' ||
    typeof prefs.accessibility.highContrast !== 'boolean' ||
    typeof prefs.accessibility.keyboardHints !== 'boolean' ||
    typeof prefs.accessibility.fontScaling !== 'number' ||
    typeof prefs.accessibility.screenReaderMode !== 'boolean'
  ) {
    return false;
  }
  
  // Check ui structure
  if (
    typeof prefs.ui.theme !== 'string' ||
    typeof prefs.ui.language !== 'string'
  ) {
    return false;
  }
  
  return true;
}

/**
 * Deep merge preferences with defaults
 */
function mergeWithDefaults(partial: Partial<UserPreferences>): UserPreferences {
  return {
    defaults: {
      ...DEFAULT_PREFERENCES.defaults,
      ...(partial.defaults || {}),
    },
    keyboard: {
      shortcuts: {
        ...DEFAULT_PREFERENCES.keyboard.shortcuts,
        ...(partial.keyboard?.shortcuts || {}),
      },
    },
    accessibility: {
      ...DEFAULT_PREFERENCES.accessibility,
      ...(partial.accessibility || {}),
    },
    ui: {
      ...DEFAULT_PREFERENCES.ui,
      ...(partial.ui || {}),
    },
  };
}

/**
 * PreferencesManager class
 */
export class PreferencesManager {
  /**
   * Load preferences from localStorage
   * Falls back to defaults if localStorage is unavailable or data is corrupted
   */
  load(): UserPreferences {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        return { ...DEFAULT_PREFERENCES };
      }
      
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (!stored) {
        return { ...DEFAULT_PREFERENCES };
      }
      
      const parsed = JSON.parse(stored);
      
      // Validate the parsed data
      if (!isValidPreferences(parsed)) {
        console.warn('Invalid preferences structure, using defaults');
        return { ...DEFAULT_PREFERENCES };
      }
      
      // Return the parsed preferences as-is (round-trip property)
      return parsed;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return { ...DEFAULT_PREFERENCES };
    }
  }

  /**
   * Save preferences to localStorage
   */
  save(preferences: UserPreferences): void {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage not available, preferences not saved');
        return;
      }
      
      const serialized = JSON.stringify(preferences);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  /**
   * Reset preferences to defaults
   */
  reset(): void {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage not available, cannot reset');
        return;
      }
      
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      throw new Error('Failed to reset preferences');
    }
  }

  /**
   * Export preferences as JSON string
   */
  export(preferences: UserPreferences): string {
    try {
      const exportData = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        preferences,
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export preferences:', error);
      throw new Error('Failed to export preferences');
    }
  }

  /**
   * Import preferences from JSON string
   * Returns true if import was successful, false otherwise
   */
  import(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      
      // Check if it has the expected export structure
      if (!parsed.preferences) {
        console.error('Invalid export format: missing preferences');
        return false;
      }
      
      // Validate the preferences structure
      if (!isValidPreferences(parsed.preferences)) {
        console.error('Invalid preferences structure in import');
        return false;
      }
      
      // Save the imported preferences
      this.save(parsed.preferences);
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const preferencesManager = new PreferencesManager();
