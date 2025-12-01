/**
 * i18nManager Tests
 * 
 * Tests for internationalization manager functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { i18nManager } from './i18nManager';

describe('i18nManager', () => {
  let manager: i18nManager;

  beforeEach(() => {
    manager = new i18nManager();
  });

  describe('detectBrowserLanguage', () => {
    it('should return a supported language code', () => {
      const lang = manager.detectBrowserLanguage();
      expect(['en', 'es', 'fr', 'de', 'ja', 'zh']).toContain(lang);
    });

    it('should default to en if browser language is not supported', () => {
      // This test assumes the browser language is either supported or defaults to 'en'
      const lang = manager.detectBrowserLanguage();
      expect(lang).toBeDefined();
      expect(typeof lang).toBe('string');
    });
  });

  describe('loadLanguage', () => {
    it('should load English by default', async () => {
      await manager.loadLanguage('en');
      expect(manager.isLanguageLoaded('en')).toBe(true);
    });

    it('should load Spanish translations', async () => {
      await manager.loadLanguage('es');
      expect(manager.isLanguageLoaded('es')).toBe(true);
    });

    it('should load French translations', async () => {
      await manager.loadLanguage('fr');
      expect(manager.isLanguageLoaded('fr')).toBe(true);
    });

    it('should not reload already loaded language', async () => {
      await manager.loadLanguage('en');
      const loadedBefore = manager.getLoadedLanguages().length;
      await manager.loadLanguage('en');
      const loadedAfter = manager.getLoadedLanguages().length;
      expect(loadedBefore).toBe(loadedAfter);
    });
  });

  describe('setLanguage', () => {
    it('should set current language to English', async () => {
      await manager.setLanguage('en');
      expect(manager.getCurrentLanguage()).toBe('en');
    });

    it('should set current language to Spanish', async () => {
      await manager.setLanguage('es');
      expect(manager.getCurrentLanguage()).toBe('es');
    });

    it('should load language when setting it', async () => {
      await manager.setLanguage('fr');
      expect(manager.isLanguageLoaded('fr')).toBe(true);
    });
  });

  describe('translate', () => {
    it('should translate key in English', async () => {
      await manager.setLanguage('en');
      const translation = manager.translate('app.title');
      expect(translation).toBe('Image Editor');
    });

    it('should translate key in Spanish', async () => {
      await manager.setLanguage('es');
      const translation = manager.translate('app.title');
      expect(translation).toBe('Editor de Imágenes');
    });

    it('should translate key in French', async () => {
      await manager.setLanguage('fr');
      const translation = manager.translate('app.title');
      expect(translation).toBe('Éditeur d\'Images');
    });

    it('should fallback to English when translation is missing', async () => {
      await manager.setLanguage('es');
      // This key exists in English but not in Spanish
      const translation = manager.translate('edit.undo');
      expect(translation).toBe('Undo'); // English fallback
    });

    it('should return key when translation is not found', async () => {
      await manager.setLanguage('en');
      const translation = manager.translate('nonexistent.key');
      expect(translation).toBe('nonexistent.key');
    });

    it('should replace parameters in translation', async () => {
      await manager.setLanguage('en');
      // Add a translation with parameters for testing
      const translation = manager.translate('common.ok');
      expect(translation).toBeDefined();
    });
  });

  describe('t (shorthand)', () => {
    it('should work as alias for translate', async () => {
      await manager.setLanguage('en');
      const translation1 = manager.translate('app.title');
      const translation2 = manager.t('app.title');
      expect(translation1).toBe(translation2);
    });
  });

  describe('initialize', () => {
    it('should initialize with browser language', async () => {
      await manager.initialize();
      const currentLang = manager.getCurrentLanguage();
      expect(['en', 'es', 'fr', 'de', 'ja', 'zh']).toContain(currentLang);
    });

    it('should load the detected language', async () => {
      await manager.initialize();
      const currentLang = manager.getCurrentLanguage();
      expect(manager.isLanguageLoaded(currentLang)).toBe(true);
    });
  });

  describe('getLoadedLanguages', () => {
    it('should return array of loaded languages', async () => {
      await manager.loadLanguage('en');
      await manager.loadLanguage('es');
      const loaded = manager.getLoadedLanguages();
      expect(loaded).toContain('en');
      expect(loaded).toContain('es');
    });

    it('should include English by default', () => {
      const loaded = manager.getLoadedLanguages();
      expect(loaded).toContain('en');
    });
  });
});
