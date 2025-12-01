/**
 * Property-based tests for MultiLineRenderer
 * Feature: text-editing-advanced
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { MultiLineRenderer } from './multiLineRenderer';

describe('MultiLineRenderer', () => {
  /**
   * Feature: text-editing-advanced, Property 1: Line break preservation
   * Validates: Requirements 1.1, 1.2, 1.5
   * 
   * For any multi-line text, the number of lines after rendering should equal
   * the number of line breaks + 1
   */
  it('should preserve line breaks - number of lines equals line breaks + 1', () => {
    fc.assert(
      fc.property(
        // Generate text with random line breaks
        fc.array(fc.string({ minLength: 0, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        (textSegments) => {
          // Join segments with line breaks to create multi-line text
          const text = textSegments.join('\n');
          const expectedLineCount = textSegments.length;

          // Split the text using the renderer
          const lines = MultiLineRenderer.splitLines(text);

          // Property: number of lines should equal number of line breaks + 1
          expect(lines.length).toBe(expectedLineCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: calculateBounds should report correct line count
   */
  it('should calculate correct line count in bounds', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 0, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        fc.double({ min: 12, max: 72 }), // fontSize
        fc.double({ min: 1.0, max: 2.0 }), // lineSpacing
        (textSegments, fontSize, lineSpacing) => {
          const text = textSegments.join('\n');
          const expectedLineCount = textSegments.length;

          // Mock canvas context with measureText
          const mockCtx = {
            measureText: vi.fn((text: string) => ({
              width: text.length * fontSize * 0.6, // Approximate width
            })),
          } as unknown as CanvasRenderingContext2D;

          const bounds = MultiLineRenderer.calculateBounds(mockCtx, text, {
            fontSize,
            lineSpacing,
          });

          // Property: bounds should report correct line count
          expect(bounds.lineCount).toBe(expectedLineCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test different line break formats (\n, \r\n, \r)
   */
  it('should handle different line break formats', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 5 }),
        fc.constantFrom('\n', '\r\n', '\r'),
        (textSegments, lineBreak) => {
          const text = textSegments.join(lineBreak);
          const lines = MultiLineRenderer.splitLines(text);

          // Property: should split correctly regardless of line break format
          expect(lines.length).toBe(textSegments.length);
          expect(lines).toEqual(textSegments);
        }
      ),
      { numRuns: 100 }
    );
  });
});
