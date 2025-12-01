/**
 * Property-Based Tests for FilenameGenerator
 * Using fast-check for property-based testing
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FilenameGenerator, FilenameOptions } from './filenameGenerator';

describe('FilenameGenerator - Property-Based Tests', () => {
  /**
   * Feature: export-download-system, Property 1: Format extension matching
   * Validates: Requirements 2.5
   * 
   * For any export with format F, the generated filename should end with 
   * the correct extension (.png for PNG, .jpg for JPEG)
   */
  it('should always generate filenames with correct extension for format', () => {
    fc.assert(
      fc.property(
        fc.record({
          format: fc.constantFrom('png' as const, 'jpeg' as const),
          watermarked: fc.boolean(),
          timestamp: fc.date(),
        }),
        (options: FilenameOptions) => {
          const filename = FilenameGenerator.generate(options);
          
          if (options.format === 'png') {
            expect(filename).toMatch(/\.png$/);
          } else {
            expect(filename).toMatch(/\.jpg$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: export-download-system, Property 5: Filename timestamp uniqueness
   * Validates: Requirements 4.5
   * 
   * For any two exports performed at different times, the generated filenames 
   * should be different (due to timestamp)
   * 
   * Note: Timestamps must differ by at least 1 second since our format uses
   * second-level precision (YYYYMMDD-HHMMSS)
   */
  it('should generate unique filenames for different timestamps', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        ).filter(([date1, date2]) => {
          // Ensure timestamps differ by at least 1 second
          // since our format only has second-level precision
          const diff = Math.abs(date1.getTime() - date2.getTime());
          return diff >= 1000; // 1000ms = 1 second
        }),
        fc.constantFrom('png' as const, 'jpeg' as const),
        fc.boolean(),
        ([timestamp1, timestamp2], format, watermarked) => {
          const filename1 = FilenameGenerator.generate({
            format,
            watermarked,
            timestamp: timestamp1,
          });
          
          const filename2 = FilenameGenerator.generate({
            format,
            watermarked,
            timestamp: timestamp2,
          });
          
          expect(filename1).not.toBe(filename2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: export-download-system, Property 6: Watermark suffix presence
   * Validates: Requirements 4.3
   * 
   * For any free tier export, the filename should contain "-watermarked" 
   * before the extension
   */
  it('should include watermark suffix when watermarked is true', () => {
    fc.assert(
      fc.property(
        fc.record({
          format: fc.constantFrom('png' as const, 'jpeg' as const),
          watermarked: fc.constant(true),
          timestamp: fc.date(),
        }),
        (options: FilenameOptions) => {
          const filename = FilenameGenerator.generate(options);
          
          // Should contain -watermarked before the extension
          expect(filename).toMatch(/-watermarked\.(png|jpg)$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: No watermark suffix when watermarked is false
   */
  it('should not include watermark suffix when watermarked is false', () => {
    fc.assert(
      fc.property(
        fc.record({
          format: fc.constantFrom('png' as const, 'jpeg' as const),
          watermarked: fc.constant(false),
          timestamp: fc.date(),
        }),
        (options: FilenameOptions) => {
          const filename = FilenameGenerator.generate(options);
          
          // Should NOT contain -watermarked
          expect(filename).not.toMatch(/-watermarked/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Sanitization removes special characters
   */
  it('should sanitize filenames to remove special characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (customText) => {
          const sanitized = FilenameGenerator.sanitize(customText);
          
          // Should only contain alphanumeric, hyphens, and underscores
          expect(sanitized).toMatch(/^[a-zA-Z0-9-_]*$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Sanitization limits length
   */
  it('should limit sanitized filenames to maximum length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        (customText) => {
          const sanitized = FilenameGenerator.sanitize(customText);
          
          // Should not exceed 200 characters
          expect(sanitized.length).toBeLessThanOrEqual(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: ensureUnique returns original if not in list
   */
  it('should return original filename if not in existing list', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.png`),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.png`)),
        (filename, existingFilenames) => {
          // Ensure filename is not in the list
          const filtered = existingFilenames.filter(f => f !== filename);
          
          const result = FilenameGenerator.ensureUnique(filename, filtered);
          
          expect(result).toBe(filename);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: ensureUnique appends counter if filename exists
   */
  it('should append counter to filename if it exists in list', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.png`),
        (filename) => {
          const existingFilenames = [filename];
          
          const result = FilenameGenerator.ensureUnique(filename, existingFilenames);
          
          // Should have -1 appended before extension
          expect(result).toMatch(/-1\.png$/);
          expect(result).not.toBe(filename);
        }
      ),
      { numRuns: 100 }
    );
  });
});
