/**
 * UI Configuration Constants
 * Centralized configuration for UI behavior and limits
 */

export const UI_CONFIG = {
  /**
   * Caption generation settings
   */
  captions: {
    /** Number of captions to show initially in sidebar */
    initialDisplayCount: 3,
    /** Interval for progress bar updates (ms) */
    progressUpdateInterval: 500,
    /** Maximum progress before completion */
    maxProgressBeforeComplete: 90,
  },

  /**
   * Text input settings
   */
  text: {
    /** Debounce delay for text input (ms) */
    inputDebounceDelay: 150,
    /** Minimum font size */
    minFontSize: 24,
    /** Maximum font size */
    maxFontSize: 160,
    /** Default font size */
    defaultFontSize: 96,
  },

  /**
   * Canvas settings
   */
  canvas: {
    /** Maximum dimension for canvas scaling (px) */
    maxDimension: 1080,
    /** Grid size for auto-placement algorithm (px) */
    autoPlacementGridSize: 50,
  },

  /**
   * History settings
   */
  history: {
    /** Maximum number of undo/redo states */
    maxHistoryStates: 50,
    /** Debounce delay for saving state (ms) */
    saveStateDebounce: 500,
  },

  /**
   * Toast notification settings
   */
  toast: {
    /** Default duration for info toasts (ms) */
    defaultDuration: 3000,
    /** Duration for error toasts (ms) */
    errorDuration: 5000,
    /** Animation duration (ms) */
    animationDuration: 300,
  },

  /**
   * Export settings
   */
  export: {
    /** Default export format */
    defaultFormat: 'png' as const,
    /** Default JPEG quality (0-1) */
    defaultQuality: 0.92,
    /** Watermark text for unlicensed exports */
    watermarkText: 'CaptionArt.io',
  },
} as const;

/**
 * Type-safe access to UI config
 */
export type UIConfig = typeof UI_CONFIG;
