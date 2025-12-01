/**
 * User Preferences and Settings System Types
 */

export type StylePreset = 'minimal' | 'bold' | 'elegant' | 'playful';
export type ExportFormat = 'png' | 'jpeg';
export type Theme = 'light' | 'dark';

/**
 * Main user preferences interface
 */
export interface UserPreferences {
  defaults: {
    stylePreset: StylePreset;
    exportFormat: ExportFormat;
    exportQuality: number;
    fontSize: number;
  };
  keyboard: {
    shortcuts: Record<string, string>;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    keyboardHints: boolean;
    fontScaling: number;
    screenReaderMode: boolean;
  };
  ui: {
    theme: Theme;
    language: string;
  };
}
