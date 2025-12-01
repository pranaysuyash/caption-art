/**
 * Property-based tests for AlignmentManager
 * Feature: text-editing-advanced
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { AlignmentManager, type TextAlignment } from './alignmentManager';

describe('AlignmentManager', () => {
  /**
   * Feature: text-editing-advanced, Property 2: Alignment consistency
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
   * 
   * For any alignment setting, all lines should be aligned according to the selected option
   */
  it('should align all lines consistently according to the selected alignment', () => {
    fc.assert(
      fc.property(
        // Generate multiple lines of text
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        // Generate alignment type
        fc.constantFrom<TextAlignment>('left', 'center', 'right', 'justify'),
        // Generate base X position (exclude NaN, Infinity)
        fc.double({ min: 100, max: 500, noNaN: true }),
        // Generate max width (exclude NaN, Infinity)
        fc.double({ min: 100, max: 400, noNaN: true }),
        // Generate font size for width calculation
        fc.double({ min: 12, max: 48 }),
        (lines, alignment, baseX, maxWidth, fontSize) => {
          // Mock canvas context with measureText
          const mockCtx = {
            measureText: vi.fn((text: string) => ({
              width: text.length * fontSize * 0.6, // Approximate width
            })),
          } as unknown as CanvasRenderingContext2D;

          // Calculate alignment for all lines
          const results = AlignmentManager.alignMultipleLines(
            mockCtx,
            lines,
            baseX,
            maxWidth,
            alignment
          );

          // Property: All lines should be aligned consistently
          results.forEach((result, index) => {
            const line = lines[index];
            const lineWidth = line.length * fontSize * 0.6;

            switch (alignment) {
              case 'left':
                // Left alignment: all lines should start at the same X (left edge)
                expect(result.x).toBeCloseTo(baseX - maxWidth / 2, 5);
                expect(result.wordSpacing).toBeUndefined();
                break;

              case 'center':
                // Center alignment: all lines should be centered around baseX
                const expectedCenterX = baseX - lineWidth / 2;
                expect(result.x).toBeCloseTo(expectedCenterX, 5);
                expect(result.wordSpacing).toBeUndefined();
                break;

              case 'right':
                // Right alignment: all lines should end at the same X (right edge)
                const expectedRightX = baseX + maxWidth / 2 - lineWidth;
                expect(result.x).toBeCloseTo(expectedRightX, 5);
                expect(result.wordSpacing).toBeUndefined();
                break;

              case 'justify':
                // Justify alignment: lines with multiple words should have word spacing
                // unless the line is already close to maxWidth
                const words = line.trim().split(/\s+/);
                expect(result.x).toBeCloseTo(baseX - maxWidth / 2, 5);
                
                if (words.length > 1 && lineWidth < maxWidth * 0.95) {
                  // Multiple words and room to justify: should have word spacing
                  expect(result.wordSpacing).toBeDefined();
                  expect(result.wordSpacing).toBeGreaterThanOrEqual(0);
                } else {
                  // Single word or line too long: falls back to left alignment (no word spacing)
                  // wordSpacing may or may not be defined
                }
                break;
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Left alignment consistency
   * All lines should start at the same X position
   */
  it('should align all lines to the same left edge for left alignment', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
        fc.double({ min: 100, max: 500, noNaN: true }),
        fc.double({ min: 100, max: 400, noNaN: true }),
        fc.double({ min: 12, max: 48, noNaN: true }),
        (lines, baseX, maxWidth, fontSize) => {
          const mockCtx = {
            measureText: vi.fn((text: string) => ({
              width: text.length * fontSize * 0.6,
            })),
          } as unknown as CanvasRenderingContext2D;

          const results = AlignmentManager.alignMultipleLines(
            mockCtx,
            lines,
            baseX,
            maxWidth,
            'left'
          );

          // Property: All left-aligned lines should have the same X position
          const firstX = results[0].x;
          results.forEach(result => {
            expect(result.x).toBeCloseTo(firstX, 5);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Right alignment consistency
   * All lines should end at the same X position
   */
  it('should align all lines to the same right edge for right alignment', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
        fc.double({ min: 100, max: 500, noNaN: true }),
        fc.double({ min: 100, max: 400, noNaN: true }),
        fc.double({ min: 12, max: 48, noNaN: true }),
        (lines, baseX, maxWidth, fontSize) => {
          const mockCtx = {
            measureText: vi.fn((text: string) => ({
              width: text.length * fontSize * 0.6,
            })),
          } as unknown as CanvasRenderingContext2D;

          const results = AlignmentManager.alignMultipleLines(
            mockCtx,
            lines,
            baseX,
            maxWidth,
            'right'
          );

          // Property: All right-aligned lines should end at the same X position
          const rightEdge = baseX + maxWidth / 2;
          results.forEach((result, index) => {
            const lineWidth = lines[index].length * fontSize * 0.6;
            const lineEndX = result.x + lineWidth;
            expect(lineEndX).toBeCloseTo(rightEdge, 5);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Center alignment consistency
   * All lines should be centered around the base X position
   */
  it('should center all lines around the base X position for center alignment', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
        fc.double({ min: 100, max: 500, noNaN: true }),
        fc.double({ min: 100, max: 400, noNaN: true }),
        fc.double({ min: 12, max: 48, noNaN: true }),
        (lines, baseX, maxWidth, fontSize) => {
          const mockCtx = {
            measureText: vi.fn((text: string) => ({
              width: text.length * fontSize * 0.6,
            })),
          } as unknown as CanvasRenderingContext2D;

          const results = AlignmentManager.alignMultipleLines(
            mockCtx,
            lines,
            baseX,
            maxWidth,
            'center'
          );

          // Property: All centered lines should have their center at baseX
          results.forEach((result, index) => {
            const lineWidth = lines[index].length * fontSize * 0.6;
            const lineCenterX = result.x + lineWidth / 2;
            expect(lineCenterX).toBeCloseTo(baseX, 5);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Justify alignment word spacing
   * Lines with multiple words should have positive word spacing
   */
  it('should add word spacing for justify alignment with multiple words', () => {
    fc.assert(
      fc.property(
        // Generate lines with multiple words
        fc.array(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 5 })
            .map(words => words.join(' ')),
          { minLength: 1, maxLength: 5 }
        ),
        fc.double({ min: 100, max: 500, noNaN: true }),
        fc.double({ min: 100, max: 400, noNaN: true }),
        fc.double({ min: 12, max: 48, noNaN: true }),
        (lines, baseX, maxWidth, fontSize) => {
          const mockCtx = {
            measureText: vi.fn((text: string) => ({
              width: text.length * fontSize * 0.6,
            })),
          } as unknown as CanvasRenderingContext2D;

          const results = AlignmentManager.alignMultipleLines(
            mockCtx,
            lines,
            baseX,
            maxWidth,
            'justify'
          );

          // Property: Lines with multiple words should have word spacing defined
          // unless the line is already close to maxWidth
          results.forEach((result, index) => {
            const line = lines[index];
            const lineWidth = line.length * fontSize * 0.6;
            const words = line.trim().split(/\s+/);
            
            if (words.length > 1 && lineWidth < maxWidth * 0.95) {
              // Multiple words and room to justify: should have word spacing
              expect(result.wordSpacing).toBeDefined();
              expect(result.wordSpacing).toBeGreaterThanOrEqual(0);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
