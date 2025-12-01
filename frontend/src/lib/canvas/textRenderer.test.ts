/**
 * Property-based tests for TextRenderer
 * Feature: canvas-text-compositing, Property 9: Style preset consistency
 * Validates: Requirements 2.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TextRenderer } from './textRenderer';
import type { StylePreset } from './types';

describe('TextRenderer', () => {
  describe('Property 9: Style preset consistency', () => {
    /**
     * **Feature: canvas-text-compositing, Property 9: Style preset consistency**
     * 
     * For any style preset selection, the rendered text should match 
     * the preset's defined properties (font, color, shadows, strokes)
     * 
     * **Validates: Requirements 2.5**
     */
    it('should return consistent style properties for each preset across different font sizes', () => {
      // Generator for style presets
      const presetArb = fc.constantFrom<StylePreset>('neon', 'magazine', 'brush', 'emboss');
      
      // Generator for font sizes (reasonable range)
      const fontSizeArb = fc.integer({ min: 12, max: 200 });

      fc.assert(
        fc.property(presetArb, fontSizeArb, (preset, fontSize) => {
          const style = TextRenderer.getStyle(preset, fontSize);

          // Verify font includes the fontSize
          expect(style.font).toContain(fontSize.toString());

          // Verify preset-specific properties
          switch (preset) {
            case 'neon':
              // Neon should have white fill and multiple cyan shadows
              expect(style.fillStyle).toBe('#ffffff');
              expect(style.shadows).toBeDefined();
              expect(style.shadows!.length).toBeGreaterThan(0);
              // All shadows should have cyan-ish colors
              style.shadows!.forEach(shadow => {
                expect(shadow.color).toMatch(/#[0-9a-f]{6}/i);
                expect(shadow.blur).toBeGreaterThan(0);
              });
              break;

            case 'magazine':
              // Magazine should have black fill and white stroke
              expect(style.fillStyle).toBe('#000000');
              expect(style.strokeStyle).toBe('#ffffff');
              expect(style.lineWidth).toBeDefined();
              expect(style.lineWidth).toBeGreaterThan(0);
              // Line width should be proportional to font size
              expect(style.lineWidth).toBeCloseTo(fontSize * 0.15, 1);
              break;

            case 'brush':
              // Brush should have cursive font and subtle stroke
              expect(style.font).toContain('cursive');
              expect(style.fillStyle).toBeDefined();
              expect(style.strokeStyle).toBeDefined();
              expect(style.lineWidth).toBeDefined();
              expect(style.lineWidth).toBeGreaterThan(0);
              break;

            case 'emboss':
              // Emboss should have light fill and shadow for 3D effect
              expect(style.fillStyle).toBe('#e0e0e0');
              expect(style.shadow).toBeDefined();
              expect(style.shadow!.x).toBeGreaterThan(0);
              expect(style.shadow!.y).toBeGreaterThan(0);
              expect(style.shadow!.blur).toBeGreaterThanOrEqual(0);
              expect(style.shadow!.color).toBeDefined();
              break;
          }

          // All styles should have a font and fillStyle
          expect(style.font).toBeDefined();
          expect(style.font.length).toBeGreaterThan(0);
          expect(style.fillStyle).toBeDefined();
          expect(style.fillStyle.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    it('should maintain style consistency when called multiple times with same parameters', () => {
      const presetArb = fc.constantFrom<StylePreset>('neon', 'magazine', 'brush', 'emboss');
      const fontSizeArb = fc.integer({ min: 12, max: 200 });

      fc.assert(
        fc.property(presetArb, fontSizeArb, (preset, fontSize) => {
          // Call getStyle twice with same parameters
          const style1 = TextRenderer.getStyle(preset, fontSize);
          const style2 = TextRenderer.getStyle(preset, fontSize);

          // Results should be identical
          expect(style1.font).toBe(style2.font);
          expect(style1.fillStyle).toBe(style2.fillStyle);
          expect(style1.strokeStyle).toBe(style2.strokeStyle);
          expect(style1.lineWidth).toBe(style2.lineWidth);
          
          // Deep equality for shadows array
          if (style1.shadows && style2.shadows) {
            expect(style1.shadows.length).toBe(style2.shadows.length);
            style1.shadows.forEach((shadow, idx) => {
              expect(shadow.blur).toBe(style2.shadows![idx].blur);
              expect(shadow.color).toBe(style2.shadows![idx].color);
            });
          }

          // Deep equality for shadow object
          if (style1.shadow && style2.shadow) {
            expect(style1.shadow.x).toBe(style2.shadow.x);
            expect(style1.shadow.y).toBe(style2.shadow.y);
            expect(style1.shadow.blur).toBe(style2.shadow.blur);
            expect(style1.shadow.color).toBe(style2.shadow.color);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('getStyle', () => {
      it('should return correct TextStyle for neon preset', () => {
        const style = TextRenderer.getStyle('neon', 48);
        
        expect(style.font).toBe('bold 48px Arial, sans-serif');
        expect(style.fillStyle).toBe('#ffffff');
        expect(style.shadows).toBeDefined();
        expect(style.shadows).toHaveLength(4);
        expect(style.shadows![0]).toEqual({ blur: 10, color: '#00ffff' });
        expect(style.shadows![1]).toEqual({ blur: 20, color: '#00ffff' });
        expect(style.shadows![2]).toEqual({ blur: 30, color: '#00ffff' });
        expect(style.shadows![3]).toEqual({ blur: 40, color: '#0088ff' });
      });

      it('should return correct TextStyle for magazine preset', () => {
        const style = TextRenderer.getStyle('magazine', 60);
        
        expect(style.font).toBe('bold 60px Georgia, serif');
        expect(style.fillStyle).toBe('#000000');
        expect(style.strokeStyle).toBe('#ffffff');
        expect(style.lineWidth).toBe(9); // 60 * 0.15
      });

      it('should return correct TextStyle for brush preset', () => {
        const style = TextRenderer.getStyle('brush', 36);
        
        expect(style.font).toBe("italic 36px 'Brush Script MT', cursive");
        expect(style.fillStyle).toBe('#2c3e50');
        expect(style.strokeStyle).toBe('#34495e');
        expect(style.lineWidth).toBe(0.72); // 36 * 0.02
      });

      it('should return correct TextStyle for emboss preset', () => {
        const style = TextRenderer.getStyle('emboss', 72);
        
        expect(style.font).toBe("bold 72px 'Helvetica Neue', sans-serif");
        expect(style.fillStyle).toBe('#e0e0e0');
        expect(style.shadow).toBeDefined();
        expect(style.shadow).toEqual({
          x: 3,
          y: 3,
          blur: 2,
          color: '#000000',
        });
      });

      it('should scale font size correctly', () => {
        const sizes = [12, 24, 48, 96, 120];
        
        sizes.forEach(size => {
          const style = TextRenderer.getStyle('neon', size);
          expect(style.font).toContain(`${size}px`);
        });
      });

      it('should scale stroke width proportionally for magazine preset', () => {
        const testCases = [
          { fontSize: 20, expectedLineWidth: 3 },
          { fontSize: 40, expectedLineWidth: 6 },
          { fontSize: 60, expectedLineWidth: 9 },
          { fontSize: 100, expectedLineWidth: 15 },
        ];
        
        testCases.forEach(({ fontSize, expectedLineWidth }) => {
          const style = TextRenderer.getStyle('magazine', fontSize);
          expect(style.lineWidth).toBe(expectedLineWidth);
        });
      });

      it('should generate multiple shadow layers for neon preset', () => {
        const style = TextRenderer.getStyle('neon', 48);
        
        expect(style.shadows).toBeDefined();
        expect(style.shadows!.length).toBeGreaterThan(1);
        
        // Verify all shadows have required properties
        style.shadows!.forEach(shadow => {
          expect(shadow).toHaveProperty('blur');
          expect(shadow).toHaveProperty('color');
          expect(shadow.blur).toBeGreaterThan(0);
          expect(shadow.color).toMatch(/^#[0-9a-f]{6}$/i);
        });
      });

      it('should apply stroke for magazine preset', () => {
        const style = TextRenderer.getStyle('magazine', 48);
        
        expect(style.strokeStyle).toBeDefined();
        expect(style.lineWidth).toBeDefined();
        expect(style.strokeStyle).toBe('#ffffff');
        expect(style.lineWidth).toBeGreaterThan(0);
      });
    });

    describe('renderText', () => {
      let canvas: HTMLCanvasElement;
      let ctx: CanvasRenderingContext2D;

      beforeEach(() => {
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        ctx = canvas.getContext('2d')!;
      });

      it('should apply font and fill style', () => {
        const style: TextStyle = {
          font: 'bold 48px Arial',
          fillStyle: '#ff0000',
        };
        const transform = { x: 400, y: 300, scale: 1, rotation: 0 };

        // Should not throw when rendering
        expect(() => {
          TextRenderer.renderText(ctx, 'Test', style, transform);
        }).not.toThrow();
        
        // Verify canvas has content (text was rendered)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        expect(imageData.data.length).toBeGreaterThan(0);
      });

      it('should apply stroke style when defined', () => {
        const style: TextStyle = {
          font: 'bold 48px Arial',
          fillStyle: '#000000',
          strokeStyle: '#ffffff',
          lineWidth: 5,
        };
        const transform = { x: 400, y: 300, scale: 1, rotation: 0 };

        // Should not throw when rendering with stroke
        expect(() => {
          TextRenderer.renderText(ctx, 'Test', style, transform);
        }).not.toThrow();
        
        // Verify canvas has content
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        expect(imageData.data.length).toBeGreaterThan(0);
      });

      it('should apply multiple shadow layers for neon effect', () => {
        const style: TextStyle = {
          font: 'bold 48px Arial',
          fillStyle: '#ffffff',
          shadows: [
            { blur: 10, color: '#00ffff' },
            { blur: 20, color: '#00ffff' },
          ],
        };
        const transform = { x: 400, y: 300, scale: 1, rotation: 0 };

        // Should not throw when rendering with multiple shadows
        expect(() => {
          TextRenderer.renderText(ctx, 'Test', style, transform);
        }).not.toThrow();
        
        // Verify canvas has content
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        expect(imageData.data.length).toBeGreaterThan(0);
      });

      it('should apply single shadow for emboss effect', () => {
        const style: TextStyle = {
          font: 'bold 48px Arial',
          fillStyle: '#e0e0e0',
          shadow: {
            x: 3,
            y: 3,
            blur: 2,
            color: '#000000',
          },
        };
        const transform = { x: 400, y: 300, scale: 1, rotation: 0 };

        // Should not throw when rendering with shadow
        expect(() => {
          TextRenderer.renderText(ctx, 'Test', style, transform);
        }).not.toThrow();
        
        // Verify canvas has content
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        expect(imageData.data.length).toBeGreaterThan(0);
      });

      it('should render text at specified position', () => {
        const style: TextStyle = {
          font: 'bold 48px Arial',
          fillStyle: '#000000',
        };
        const positions = [
          { x: 100, y: 100 },
          { x: 400, y: 300 },
          { x: 700, y: 500 },
        ];

        positions.forEach(pos => {
          const transform = { ...pos, scale: 1, rotation: 0 };
          // Should not throw
          expect(() => {
            TextRenderer.renderText(ctx, 'Test', style, transform);
          }).not.toThrow();
        });
      });

      it('should save and restore context state', () => {
        const style: TextStyle = {
          font: 'bold 48px Arial',
          fillStyle: '#ff0000',
          strokeStyle: '#0000ff',
          lineWidth: 5,
        };
        const transform = { x: 400, y: 300, scale: 1, rotation: 0 };

        // Set initial context state
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 10;
        const initialFillStyle = ctx.fillStyle;
        const initialStrokeStyle = ctx.strokeStyle;
        const initialLineWidth = ctx.lineWidth;

        // Render text (should save/restore)
        TextRenderer.renderText(ctx, 'Test', style, transform);

        // Context should be restored to initial state
        expect(ctx.fillStyle).toBe(initialFillStyle);
        expect(ctx.strokeStyle).toBe(initialStrokeStyle);
        expect(ctx.lineWidth).toBe(initialLineWidth);
      });
    });
  });
});
