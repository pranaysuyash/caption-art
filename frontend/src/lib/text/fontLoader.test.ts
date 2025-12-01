/**
 * Property-based tests for FontLoader
 * Feature: text-editing-advanced
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  validateFontFile,
  loadCustomFont,
  FontManager,
  type FontLoadResult,
} from './fontLoader';

// Mock FontFace API
class MockFontFace {
  family: string;
  source: string;

  constructor(family: string, source: string) {
    this.family = family;
    this.source = source;
  }

  async load() {
    return this;
  }
}

// Mock document.fonts
const mockDocumentFonts = {
  fonts: new Set<MockFontFace>(),
  add(font: MockFontFace) {
    this.fonts.add(font);
  },
  clear() {
    this.fonts.clear();
  },
};

describe('FontLoader', () => {
  beforeEach(() => {
    // Setup FontFace mock
    (globalThis as any).FontFace = MockFontFace;
    (globalThis as any).document = {
      fonts: mockDocumentFonts,
    };
    mockDocumentFonts.clear();

    // Mock FileReader
    (globalThis as any).FileReader = class {
      result: string | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      readAsDataURL(file: File) {
        // Simulate successful read
        this.result = `data:font/ttf;base64,mockbase64data`;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    };
  });

  afterEach(() => {
    mockDocumentFonts.clear();
  });

  /**
   * Feature: text-editing-advanced, Property 3: Font loading success
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4
   * 
   * For any valid font file (TTF, OTF, WOFF), the font should load
   * and be available for selection
   */
  describe('Property 3: Font loading success', () => {
    it('should successfully load valid font files', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid font file configurations
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s + '.ttf'),
            type: fc.constantFrom(
              'font/ttf',
              'font/otf',
              'font/woff',
              'font/woff2',
              'application/x-font-ttf',
              'application/x-font-otf'
            ),
            size: fc.integer({ min: 1000, max: 1000000 }),
          }),
          async (fileConfig) => {
            // Create a mock File object
            const mockFile = new File(
              [new ArrayBuffer(fileConfig.size)],
              fileConfig.name,
              { type: fileConfig.type }
            );

            // Requirement 3.1: Validate font file format
            const isValid = validateFontFile(mockFile);
            expect(isValid).toBe(true);

            // Requirements 3.2, 3.3: Load font and add to selection
            const result = await loadCustomFont(mockFile);

            // Property: Valid font files should load successfully
            expect(result.success).toBe(true);
            expect(result.font).toBeDefined();
            expect(result.font?.name).toBe(fileConfig.name);
            expect(result.font?.family).toMatch(/^CustomFont-/);
            expect(result.error).toBeUndefined();

            // Requirement 3.3: Font should be added to document fonts
            expect(mockDocumentFonts.fonts.size).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate font files by extension when MIME type is missing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            baseName: fc.string({ minLength: 1, maxLength: 30 }),
            extension: fc.constantFrom('.ttf', '.otf', '.woff', '.woff2'),
          }),
          async ({ baseName, extension }) => {
            const fileName = baseName + extension;
            
            // Create file with empty/unknown MIME type
            const mockFile = new File(
              [new ArrayBuffer(5000)],
              fileName,
              { type: '' }
            );

            // Property: Should validate by extension when MIME type is missing
            const isValid = validateFontFile(mockFile);
            expect(isValid).toBe(true);

            const result = await loadCustomFont(mockFile);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid font file formats', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            extension: fc.constantFrom('.jpg', '.png', '.pdf', '.txt', '.doc'),
            type: fc.constantFrom('image/jpeg', 'image/png', 'application/pdf', 'text/plain'),
          }),
          (fileConfig) => {
            const fileName = fileConfig.name + fileConfig.extension;
            const mockFile = new File(
              [new ArrayBuffer(1000)],
              fileName,
              { type: fileConfig.type }
            );

            // Property: Invalid formats should be rejected
            const isValid = validateFontFile(mockFile);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('FontManager', () => {
    it('should manage multiple loaded fonts', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of font configurations with valid font names
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
              extension: fc.constantFrom('.ttf', '.otf', '.woff'),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (fontConfigs) => {
            const manager = new FontManager();

            // Load all fonts
            const loadResults = [];
            for (const config of fontConfigs) {
              const fileName = config.name + config.extension;
              const mockFile = new File(
                [new ArrayBuffer(5000)],
                fileName,
                { type: 'font/ttf' }
              );

              const result = await manager.loadFont(mockFile);
              loadResults.push(result);
            }

            // Property: All fonts with valid names should load successfully
            const successfulLoads = loadResults.filter(r => r.success).length;
            
            // All loaded fonts should be retrievable
            const loadedFonts = manager.getLoadedFonts();
            expect(loadedFonts.length).toBe(successfulLoads);

            const fontFamilies = manager.getFontFamilies();
            expect(fontFamilies.length).toBe(successfulLoads);

            // Each font family should be marked as loaded
            fontFamilies.forEach(family => {
              expect(manager.isFontLoaded(family)).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle font removal correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '.ttf'),
            { minLength: 2, maxLength: 5 }
          ),
          async (fileNames) => {
            const manager = new FontManager();
            const families: string[] = [];

            // Load fonts
            for (const fileName of fileNames) {
              const mockFile = new File(
                [new ArrayBuffer(5000)],
                fileName,
                { type: 'font/ttf' }
              );

              const result = await manager.loadFont(mockFile);
              if (result.success && result.font) {
                families.push(result.font.family);
              }
            }

            const initialCount = manager.getLoadedFonts().length;
            expect(initialCount).toBe(fileNames.length);

            // Remove first font
            if (families.length > 0) {
              const removed = manager.removeFont(families[0]);
              expect(removed).toBe(true);

              // Property: After removal, font count should decrease
              expect(manager.getLoadedFonts().length).toBe(initialCount - 1);
              expect(manager.isFontLoaded(families[0])).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Error handling', () => {
    it('should handle invalid font files gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            extension: fc.constantFrom('.jpg', '.png', '.txt'),
            type: fc.constantFrom('image/jpeg', 'image/png', 'text/plain'),
          }),
          async (fileConfig) => {
            const fileName = fileConfig.name + fileConfig.extension;
            const mockFile = new File(
              [new ArrayBuffer(1000)],
              fileName,
              { type: fileConfig.type }
            );

            // Requirement 3.5: Handle loading errors
            const result = await loadCustomFont(mockFile);

            // Property: Invalid files should fail gracefully with error message
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Unsupported font format');
            expect(result.font).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
