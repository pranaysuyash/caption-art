/**
 * ThemeManager
 *
 * Orchestrates theme selection, application, and persistence.
 * Manages theme state, mode toggling, and system preference integration.
 */

import { ThemeConfig, ThemeState } from './types';
import { safeLocalStorage } from '../storage/safeLocalStorage';
import { ThemeEngine } from './themeEngine';
import { ThemeValidator } from './themeValidator';
import { themePresets } from './presets';

type ThemeMode = 'light' | 'dark';
type ThemeChangeCallback = (state: ThemeState) => void;

interface StoredThemeData {
  currentThemeId: string;
  mode: ThemeMode;
  customThemes: ThemeConfig[];
  respectSystemPreference: boolean;
  lastUpdated: number;
}

const STORAGE_KEY = 'caption-art-theme';
const CUSTOM_THEMES_KEY = 'caption-art-custom-themes';
const DEFAULT_THEME_ID = 'neobrutalism';

export class ThemeManager {
  private engine: ThemeEngine;
  private validator: ThemeValidator;
  private state: ThemeState;
  private subscribers: Set<ThemeChangeCallback>;
  private systemPreferenceListener: (() => void) | null = null;
  private currentThemeConfig: ThemeConfig;

  constructor() {
    this.engine = new ThemeEngine();
    this.validator = new ThemeValidator();
    this.subscribers = new Set();

    // Initialize state
    this.state = this.loadState();

    // Load current theme config
    this.currentThemeConfig =
      this.findTheme(this.state.currentTheme) || this.getDefaultTheme();

    // Apply initial theme
    this.applyCurrentTheme();

    // Set up system preference listener if enabled
    if (this.state.respectSystemPreference) {
      this.setupSystemPreferenceListener();
    }
  }

  /**
   * Set the active theme
   */
  async setTheme(themeId: string, mode?: ThemeMode): Promise<void> {
    const theme = this.findTheme(themeId);
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    // Validate theme
    const validation = this.validator.validate(theme);
    if (!validation.valid) {
      throw new Error(
        `Invalid theme: ${validation.errors.map((e) => e.message).join(', ')}`
      );
    }

    // When manually setting a theme, disable system preference respect
    this.state.respectSystemPreference = false;

    // Update state
    this.state.currentTheme = themeId;
    this.currentThemeConfig = theme;
    if (mode !== undefined) {
      this.state.mode = mode;
    }

    // Apply theme
    await this.engine.applyTheme(theme, this.state.mode);

    // Save state
    this.saveState();

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Get the current theme configuration
   */
  getTheme(): ThemeConfig {
    return this.currentThemeConfig;
  }

  /**
   * Get all available themes (presets + custom)
   */
  getAvailableThemes(): ThemeConfig[] {
    return [...themePresets, ...this.state.customThemes];
  }

  /**
   * Toggle between light and dark mode
   */
  toggleMode(): void {
    this.setMode(this.state.mode === 'light' ? 'dark' : 'light');
  }

  /**
   * Set the theme mode (light or dark)
   */
  setMode(mode: ThemeMode): void {
    if (this.state.mode === mode) {
      return;
    }

    this.state.mode = mode;

    // Apply theme with new mode
    this.engine.applyTheme(this.currentThemeConfig, mode);

    // Save state
    this.saveState();

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Create a custom theme
   */
  createCustomTheme(config: Partial<ThemeConfig>): ThemeConfig {
    // Generate ID if not provided
    const id = config.id || `custom-${Date.now()}`;

    // Create full theme config with defaults
    const theme: ThemeConfig = {
      id,
      name: config.name || 'Custom Theme',
      description: config.description || 'A custom theme',
      category: 'custom',
      version: '1.0.0',
      colors: config.colors || this.currentThemeConfig.colors,
      typography: config.typography || this.currentThemeConfig.typography,
      spacing: config.spacing || this.currentThemeConfig.spacing,
      shadows: config.shadows || this.currentThemeConfig.shadows,
      borders: config.borders || this.currentThemeConfig.borders,
      animations: config.animations || this.currentThemeConfig.animations,
      accessibility:
        config.accessibility || this.currentThemeConfig.accessibility,
    };

    // Validate theme
    const validation = this.validator.validate(theme);
    if (!validation.valid) {
      throw new Error(
        `Invalid theme: ${validation.errors.map((e) => e.message).join(', ')}`
      );
    }

    // Add to custom themes
    this.state.customThemes.push(theme);

    // Save state
    this.saveState();

    // Notify subscribers
    this.notifySubscribers();

    return theme;
  }

  /**
   * Update an existing custom theme
   */
  updateCustomTheme(themeId: string, updates: Partial<ThemeConfig>): void {
    const index = this.state.customThemes.findIndex((t) => t.id === themeId);
    if (index === -1) {
      throw new Error(`Custom theme not found: ${themeId}`);
    }

    // Merge updates
    const updatedTheme = {
      ...this.state.customThemes[index],
      ...updates,
      id: themeId, // Preserve ID
      category: 'custom' as const, // Preserve category
    };

    // Validate updated theme
    const validation = this.validator.validate(updatedTheme);
    if (!validation.valid) {
      throw new Error(
        `Invalid theme: ${validation.errors.map((e) => e.message).join(', ')}`
      );
    }

    // Update theme
    this.state.customThemes[index] = updatedTheme;

    // If this is the current theme, reapply it
    if (this.state.currentTheme === themeId) {
      this.currentThemeConfig = updatedTheme;
      this.engine.applyTheme(updatedTheme, this.state.mode);
    }

    // Save state
    this.saveState();

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Delete a custom theme
   */
  deleteCustomTheme(themeId: string): void {
    const index = this.state.customThemes.findIndex((t) => t.id === themeId);
    if (index === -1) {
      throw new Error(`Custom theme not found: ${themeId}`);
    }

    // Remove theme
    this.state.customThemes.splice(index, 1);

    // If this was the current theme, switch to default
    if (this.state.currentTheme === themeId) {
      const defaultTheme = this.getDefaultTheme();
      this.state.currentTheme = defaultTheme.id;
      this.currentThemeConfig = defaultTheme;
      this.engine.applyTheme(defaultTheme, this.state.mode);
    }

    // Save state
    this.saveState();

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Export a theme as JSON
   */
  exportTheme(themeId: string): string {
    const theme = this.findTheme(themeId);
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      theme,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import a theme from JSON
   */
  importTheme(themeJson: string): ThemeConfig {
    let data: any;
    try {
      data = JSON.parse(themeJson);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    // Validate structure
    if (!data.theme || !data.version) {
      throw new Error('Invalid theme file structure');
    }

    const theme = data.theme;

    // Ensure it's marked as custom
    theme.category = 'custom';

    // Generate new ID to avoid conflicts
    theme.id = `imported-${Date.now()}`;

    // Validate theme
    const validation = this.validator.validate(theme);
    if (!validation.valid) {
      throw new Error(
        `Invalid theme: ${validation.errors.map((e) => e.message).join(', ')}`
      );
    }

    // Add to custom themes
    this.state.customThemes.push(theme);

    // Save state
    this.saveState();

    // Notify subscribers
    this.notifySubscribers();

    return theme;
  }

  /**
   * Reset to default theme
   */
  resetTheme(): void {
    const defaultTheme = this.getDefaultTheme();
    this.state.currentTheme = defaultTheme.id;
    this.currentThemeConfig = defaultTheme;
    this.state.mode = 'light';
    this.state.respectSystemPreference = false;

    this.engine.applyTheme(defaultTheme, 'light');

    // Save state
    this.saveState();

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Get current theme state
   */
  getState(): ThemeState {
    return { ...this.state };
  }

  /**
   * Subscribe to theme changes
   */
  subscribeToChanges(callback: ThemeChangeCallback): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Detect system color scheme preference
   */
  detectSystemPreference(): ThemeMode {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Enable or disable system preference synchronization
   */
  setRespectSystemPreference(respect: boolean): void {
    this.state.respectSystemPreference = respect;

    if (respect) {
      // Apply system preference
      const systemMode = this.detectSystemPreference();
      this.setMode(systemMode);

      // Set up listener
      this.setupSystemPreferenceListener();
    } else {
      // Remove listener
      this.teardownSystemPreferenceListener();
    }

    // Save state
    this.saveState();

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Set up system preference change listener
   */
  private setupSystemPreferenceListener(): void {
    if (this.systemPreferenceListener) {
      return; // Already set up
    }

    if (!window.matchMedia) {
      return; // Not supported
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      if (this.state.respectSystemPreference) {
        const newMode = e.matches ? 'dark' : 'light';
        this.setMode(newMode);
      }
    };

    mediaQuery.addEventListener('change', handler);

    // Store cleanup function
    this.systemPreferenceListener = () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }

  /**
   * Remove system preference change listener
   */
  private teardownSystemPreferenceListener(): void {
    if (this.systemPreferenceListener) {
      this.systemPreferenceListener();
      this.systemPreferenceListener = null;
    }
  }

  /**
   * Find a theme by ID (searches presets and custom themes)
   */
  private findTheme(themeId: string): ThemeConfig | undefined {
    return this.getAvailableThemes().find((t) => t.id === themeId);
  }

  /**
   * Apply the current theme
   */
  private applyCurrentTheme(): void {
    this.engine.applyTheme(this.currentThemeConfig, this.state.mode);
  }

  /**
   * Get the default theme
   */
  private getDefaultTheme(): ThemeConfig {
    return themePresets.find((t) => t.id === DEFAULT_THEME_ID)!;
  }

  /**
   * Load state from localStorage
   */
  private loadState(): ThemeState {
    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredThemeData = JSON.parse(stored);

        // Load custom themes
        const customThemes = data.customThemes || [];

        // Detect system preference
        const systemPreference = this.detectSystemPreference();

        return {
          currentTheme: data.currentThemeId,
          mode: data.mode,
          customThemes,
          systemPreference,
          respectSystemPreference: data.respectSystemPreference || false,
        };
      }
    } catch (error) {
      console.warn('Failed to load theme state:', error);
    }

    // Return default state
    const systemPreference = this.detectSystemPreference();

    return {
      currentTheme: DEFAULT_THEME_ID,
      mode: systemPreference,
      customThemes: [],
      systemPreference,
      respectSystemPreference: true,
    };
  }

  /**
   * Save state to localStorage
   */
  private saveState(): void {
    try {
      const data: StoredThemeData = {
        currentThemeId: this.state.currentTheme,
        mode: this.state.mode,
        customThemes: this.state.customThemes,
        respectSystemPreference: this.state.respectSystemPreference,
        lastUpdated: Date.now(),
      };

      // Use safeLocalStorage wrapper to avoid errors in restricted contexts
      safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save theme state:', error);
    }
  }

  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in theme change subscriber:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.teardownSystemPreferenceListener();
    this.subscribers.clear();
  }
}

// Export singleton instance
let instance: ThemeManager | null = null;

export function getThemeManager(): ThemeManager {
  if (!instance) {
    instance = new ThemeManager();
  }
  return instance;
}

export function resetThemeManager(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
