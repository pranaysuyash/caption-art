/**
 * Default User Preferences
 * 
 * Defines default values for all user preferences.
 * These are used when:
 * - User first loads the application
 * - localStorage is unavailable
 * - Stored preferences are corrupted
 * - User resets to defaults
 */

import { UserPreferences } from './types';

/**
 * Default keyboard shortcuts
 * Maps action names to key combinations
 */
export const DEFAULT_KEYBOARD_SHORTCUTS: Record<string, string> = {
  // File operations
  'export': 'Ctrl+E',
  'save': 'Ctrl+S',
  
  // Edit operations
  'undo': 'Ctrl+Z',
  'redo': 'Ctrl+Shift+Z',
  'copy': 'Ctrl+C',
  'paste': 'Ctrl+V',
  'delete': 'Delete',
  
  // Canvas operations
  'zoomIn': 'Ctrl+=',
  'zoomOut': 'Ctrl+-',
  'resetZoom': 'Ctrl+0',
  'fitToScreen': 'Ctrl+1',
  
  // Text operations
  'bold': 'Ctrl+B',
  'italic': 'Ctrl+I',
  'alignLeft': 'Ctrl+L',
  'alignCenter': 'Ctrl+Shift+C',
  'alignRight': 'Ctrl+R',
  
  // UI operations
  'toggleSettings': 'Ctrl+,',
  'toggleHelp': 'F1',
  'search': 'Ctrl+F',
};

/**
 * Complete default preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  defaults: {
    // Default style preset for new text
    stylePreset: 'minimal',
    
    // Default export format
    exportFormat: 'png',
    
    // Default export quality (0-100 for JPEG, ignored for PNG)
    exportQuality: 90,
    
    // Default font size in pixels
    fontSize: 16,
  },
  
  keyboard: {
    shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
  },
  
  accessibility: {
    // Disable animations for users who prefer reduced motion
    reducedMotion: false,
    
    // Use high contrast color schemes
    highContrast: false,
    
    // Show keyboard navigation hints
    keyboardHints: false,
    
    // Font scaling multiplier (1.0 = 100%, 1.5 = 150%, etc.)
    fontScaling: 1.0,
    
    // Enable additional ARIA labels for screen readers
    screenReaderMode: false,
  },
  
  ui: {
    // UI theme (light or dark)
    theme: 'light',
    
    // Language code (ISO 639-1)
    language: 'en',
  },
};
