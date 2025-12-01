/**
 * i18nManager
 * 
 * Manages internationalization (i18n) and localization.
 * Handles language loading, translation lookup, fallback to English,
 * and browser language detection.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

/**
 * Translation dictionary type
 */
export type TranslationDictionary = Record<string, string>;

/**
 * Supported languages
 */
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

/**
 * Translation data structure
 */
interface TranslationData {
  [language: string]: TranslationDictionary;
}

/**
 * Default English translations
 * This serves as the fallback when translations are missing
 */
const DEFAULT_TRANSLATIONS: TranslationDictionary = {
  // App general
  'app.title': 'Image Editor',
  'app.loading': 'Loading...',
  'app.error': 'An error occurred',
  
  // File operations
  'file.export': 'Export',
  'file.save': 'Save',
  'file.open': 'Open',
  'file.new': 'New',
  
  // Edit operations
  'edit.undo': 'Undo',
  'edit.redo': 'Redo',
  'edit.copy': 'Copy',
  'edit.paste': 'Paste',
  'edit.delete': 'Delete',
  
  // Settings
  'settings.title': 'Settings',
  'settings.save': 'Save',
  'settings.cancel': 'Cancel',
  'settings.reset': 'Reset to Defaults',
  'settings.export': 'Export Settings',
  'settings.import': 'Import Settings',
  
  // Preferences
  'preferences.defaults': 'Defaults',
  'preferences.keyboard': 'Keyboard Shortcuts',
  'preferences.accessibility': 'Accessibility',
  'preferences.language': 'Language',
  
  // Accessibility
  'accessibility.reducedMotion': 'Reduced Motion',
  'accessibility.highContrast': 'High Contrast',
  'accessibility.keyboardHints': 'Keyboard Hints',
  'accessibility.fontScaling': 'Font Scaling',
  'accessibility.screenReader': 'Screen Reader Mode',
  
  // Common
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.ok': 'OK',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.apply': 'Apply',
};

/**
 * Translation storage
 * Stores loaded translations for each language
 */
const translations: TranslationData = {
  en: DEFAULT_TRANSLATIONS,
};

/**
 * i18nManager class
 */
export class i18nManager {
  private currentLanguage: SupportedLanguage = 'en';
  private loadedLanguages: Set<string> = new Set(['en']);

  /**
   * Detect browser language
   * Returns the browser's preferred language or 'en' as fallback
   * 
   * Requirement 8.4: Browser language detection
   */
  detectBrowserLanguage(): SupportedLanguage {
    try {
      if (typeof window === 'undefined' || !window.navigator) {
        return 'en';
      }

      // Get browser language (e.g., 'en-US', 'fr-FR')
      const browserLang = window.navigator.language || 'en';
      
      // Extract the language code (e.g., 'en' from 'en-US')
      const langCode = browserLang.split('-')[0].toLowerCase();
      
      // Check if it's a supported language
      const supportedLanguages: SupportedLanguage[] = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
      
      if (supportedLanguages.includes(langCode as SupportedLanguage)) {
        return langCode as SupportedLanguage;
      }
      
      return 'en';
    } catch (error) {
      console.error('Failed to detect browser language:', error);
      return 'en';
    }
  }

  /**
   * Load language translations
   * In a real implementation, this would fetch translation files from the server
   * For now, we'll use inline translations for demonstration
   * 
   * Requirement 8.1: Language loading
   */
  async loadLanguage(language: SupportedLanguage): Promise<void> {
    try {
      // If already loaded, skip
      if (this.loadedLanguages.has(language)) {
        return;
      }

      // In a real implementation, this would fetch from:
      // const response = await fetch(`/locales/${language}.json`);
      // const translations = await response.json();
      
      // For now, we'll use inline translations
      const languageTranslations = this.getInlineTranslations(language);
      
      if (languageTranslations) {
        translations[language] = languageTranslations;
        this.loadedLanguages.add(language);
      }
    } catch (error) {
      console.error(`Failed to load language ${language}:`, error);
      // Fallback to English is handled in translate()
    }
  }

  /**
   * Get inline translations for demonstration
   * In production, these would be loaded from separate JSON files
   */
  private getInlineTranslations(language: SupportedLanguage): TranslationDictionary | null {
    // Sample translations for Spanish
    if (language === 'es') {
      return {
        'app.title': 'Editor de Imágenes',
        'app.loading': 'Cargando...',
        'app.error': 'Ocurrió un error',
        'file.export': 'Exportar',
        'file.save': 'Guardar',
        'settings.title': 'Configuración',
        'settings.save': 'Guardar',
        'settings.cancel': 'Cancelar',
        'common.yes': 'Sí',
        'common.no': 'No',
        'common.ok': 'Aceptar',
        'common.cancel': 'Cancelar',
      };
    }
    
    // Sample translations for French
    if (language === 'fr') {
      return {
        'app.title': 'Éditeur d\'Images',
        'app.loading': 'Chargement...',
        'app.error': 'Une erreur s\'est produite',
        'file.export': 'Exporter',
        'file.save': 'Enregistrer',
        'settings.title': 'Paramètres',
        'settings.save': 'Enregistrer',
        'settings.cancel': 'Annuler',
        'common.yes': 'Oui',
        'common.no': 'Non',
        'common.ok': 'OK',
        'common.cancel': 'Annuler',
      };
    }
    
    return null;
  }

  /**
   * Set current language
   * 
   * Requirement 8.1, 8.2: Language selection and UI update
   */
  async setLanguage(language: SupportedLanguage): Promise<void> {
    try {
      // Load the language if not already loaded
      await this.loadLanguage(language);
      
      // Set as current language
      this.currentLanguage = language;
    } catch (error) {
      console.error(`Failed to set language to ${language}:`, error);
      // Keep current language on error
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Translate a key to the current language
   * Falls back to English if translation is missing
   * 
   * Requirement 8.2, 8.3: Translation lookup with fallback
   */
  translate(key: string, params?: Record<string, string>): string {
    try {
      // Try to get translation in current language
      let translation = translations[this.currentLanguage]?.[key];
      
      // Fallback to English if not found
      if (!translation) {
        translation = DEFAULT_TRANSLATIONS[key];
      }
      
      // If still not found, return the key itself
      if (!translation) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      
      // Replace parameters if provided
      if (params) {
        Object.keys(params).forEach(paramKey => {
          translation = translation.replace(`{${paramKey}}`, params[paramKey]);
        });
      }
      
      return translation;
    } catch (error) {
      console.error(`Failed to translate key ${key}:`, error);
      return key;
    }
  }

  /**
   * Shorthand for translate
   */
  t(key: string, params?: Record<string, string>): string {
    return this.translate(key, params);
  }

  /**
   * Check if a language is loaded
   */
  isLanguageLoaded(language: string): boolean {
    return this.loadedLanguages.has(language);
  }

  /**
   * Get all loaded languages
   */
  getLoadedLanguages(): string[] {
    return Array.from(this.loadedLanguages);
  }

  /**
   * Initialize i18n with browser language detection
   * 
   * Requirement 8.4: Browser language detection on load
   */
  async initialize(): Promise<void> {
    try {
      const browserLang = this.detectBrowserLanguage();
      await this.setLanguage(browserLang);
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      // Default to English on error
      this.currentLanguage = 'en';
    }
  }
}

/**
 * Singleton instance
 */
export const i18n = new i18nManager();
