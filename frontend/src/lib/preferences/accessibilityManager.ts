/**
 * AccessibilityManager
 * 
 * Manages accessibility settings and applies them to the application.
 * Handles reduced motion, high contrast, keyboard hints, font scaling, and screen reader mode.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  keyboardHints: boolean;
  fontScaling: number;
  screenReaderMode: boolean;
}

/**
 * AccessibilityManager class
 * Applies accessibility settings to the DOM and manages their state
 */
export class AccessibilityManager {
  private currentSettings: AccessibilitySettings;

  constructor(initialSettings?: AccessibilitySettings) {
    this.currentSettings = initialSettings || {
      reducedMotion: false,
      highContrast: false,
      keyboardHints: false,
      fontScaling: 1.0,
      screenReaderMode: false,
    };
  }

  /**
   * Get current accessibility settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.currentSettings };
  }

  /**
   * Apply all accessibility settings to the DOM
   */
  applySettings(settings: AccessibilitySettings): void {
    this.currentSettings = { ...settings };
    
    this.applyReducedMotion(settings.reducedMotion);
    this.applyHighContrast(settings.highContrast);
    this.applyKeyboardHints(settings.keyboardHints);
    this.applyFontScaling(settings.fontScaling);
    this.applyScreenReaderMode(settings.screenReaderMode);
  }

  /**
   * Toggle reduced motion
   * Requirement 4.1: WHEN a user enables reduced motion THEN the User Preferences System SHALL disable all animations
   */
  toggleReducedMotion(enabled: boolean): void {
    this.currentSettings.reducedMotion = enabled;
    this.applyReducedMotion(enabled);
  }

  private applyReducedMotion(enabled: boolean): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    if (enabled) {
      // Disable all animations by setting CSS custom property
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
      root.setAttribute('data-reduced-motion', 'true');
      
      // Add class for CSS targeting
      root.classList.add('reduced-motion');
    } else {
      // Restore animations
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
      root.removeAttribute('data-reduced-motion');
      root.classList.remove('reduced-motion');
    }
  }

  /**
   * Toggle high contrast mode
   * Requirement 4.2: WHEN a user increases contrast THEN the User Preferences System SHALL apply high-contrast color schemes
   */
  toggleHighContrast(enabled: boolean): void {
    this.currentSettings.highContrast = enabled;
    this.applyHighContrast(enabled);
  }

  private applyHighContrast(enabled: boolean): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    if (enabled) {
      // Apply high contrast theme
      root.setAttribute('data-high-contrast', 'true');
      root.classList.add('high-contrast');
      
      // Set high contrast CSS custom properties
      root.style.setProperty('--contrast-multiplier', '1.5');
    } else {
      // Remove high contrast theme
      root.removeAttribute('data-high-contrast');
      root.classList.remove('high-contrast');
      root.style.removeProperty('--contrast-multiplier');
    }
  }

  /**
   * Toggle keyboard navigation hints
   * Requirement 4.3: WHEN a user enables keyboard navigation hints THEN the User Preferences System SHALL display focus indicators
   */
  toggleKeyboardHints(enabled: boolean): void {
    this.currentSettings.keyboardHints = enabled;
    this.applyKeyboardHints(enabled);
  }

  private applyKeyboardHints(enabled: boolean): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    if (enabled) {
      // Enable visible focus indicators
      root.setAttribute('data-keyboard-hints', 'true');
      root.classList.add('keyboard-hints');
      
      // Enhance focus visibility
      root.style.setProperty('--focus-outline-width', '3px');
      root.style.setProperty('--focus-outline-offset', '2px');
    } else {
      // Use default focus indicators
      root.removeAttribute('data-keyboard-hints');
      root.classList.remove('keyboard-hints');
      root.style.removeProperty('--focus-outline-width');
      root.style.removeProperty('--focus-outline-offset');
    }
  }

  /**
   * Set font scaling
   * Requirement 4.4: WHEN a user adjusts font scaling THEN the User Preferences System SHALL scale all text by the specified factor
   */
  setFontScaling(scale: number): void {
    // Clamp scale between 0.5 and 2.0 for reasonable bounds
    const clampedScale = Math.max(0.5, Math.min(2.0, scale));
    this.currentSettings.fontScaling = clampedScale;
    this.applyFontScaling(clampedScale);
  }

  private applyFontScaling(scale: number): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Apply font scaling via CSS custom property
    root.style.setProperty('--font-scale', scale.toString());
    root.setAttribute('data-font-scale', scale.toString());
  }

  /**
   * Toggle screen reader mode
   * Requirement 4.5: WHEN a user enables screen reader mode THEN the User Preferences System SHALL add additional ARIA labels
   */
  toggleScreenReaderMode(enabled: boolean): void {
    this.currentSettings.screenReaderMode = enabled;
    this.applyScreenReaderMode(enabled);
  }

  private applyScreenReaderMode(enabled: boolean): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    if (enabled) {
      // Enable screen reader mode
      root.setAttribute('data-screen-reader', 'true');
      root.classList.add('screen-reader-mode');
      
      // Set ARIA live region politeness
      root.setAttribute('aria-live', 'polite');
    } else {
      // Disable screen reader mode
      root.removeAttribute('data-screen-reader');
      root.classList.remove('screen-reader-mode');
      root.removeAttribute('aria-live');
    }
  }

  /**
   * Reset all accessibility settings to defaults
   */
  reset(): void {
    const defaultSettings: AccessibilitySettings = {
      reducedMotion: false,
      highContrast: false,
      keyboardHints: false,
      fontScaling: 1.0,
      screenReaderMode: false,
    };
    
    this.applySettings(defaultSettings);
  }

  /**
   * Detect system preferences and apply them
   * Useful for respecting OS-level accessibility settings
   */
  detectSystemPreferences(): Partial<AccessibilitySettings> {
    if (typeof window === 'undefined') return {};

    const detected: Partial<AccessibilitySettings> = {};

    // Detect prefers-reduced-motion
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (prefersReducedMotion.matches) {
        detected.reducedMotion = true;
      }

      // Detect prefers-contrast
      const prefersHighContrast = window.matchMedia('(prefers-contrast: more)');
      if (prefersHighContrast.matches) {
        detected.highContrast = true;
      }
    }

    return detected;
  }
}

/**
 * Singleton instance
 */
export const accessibilityManager = new AccessibilityManager();
