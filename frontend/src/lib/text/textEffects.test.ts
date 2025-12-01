/**
 * Property-based tests for TextEffectsRenderer
 * Feature: text-editing-advanced
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  TextEffectsRenderer,
  TextEffects,
  OutlineEffect,
  GradientEffect,
  PatternEffect,
  createDefaultEffects,
  type ColorStop,
} from './textEffects';

describe('TextEffectsRenderer', () => {
  let mockCtx: CanvasRenderingContext2D;
  let strokeTextCalls: Array<{ text: string; x: number; y: number; order: number }>;
  let fillTextCalls: Array<{ text: string; x: number; y: number; order: number }>;
  let callOrder: number;

  beforeEach(() => {
    strokeTextCalls = [];
    fillTextCalls = [];
    callOrder = 0;

    // Create a mock canvas context that tracks call order
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      strokeText: vi.fn((text: string, x: number, y: number) => {
        strokeTextCalls.push({ text, x, y, order: callOrder++ });
      }),
      fillText: vi.fn((text: string, x: number, y: number) => {
        fillTextCalls.push({ text, x, y, order: callOrder++ });
      }),
      measureText: vi.fn((text: string) => ({
        width: text.length * 10,
      })),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createPattern: vi.fn(() => ({})),
      lineWidth: 0,
      strokeStyle: '',
      fillStyle: '',
      lineJoin: '',
      miterLimit: 0,
    } as unknown as CanvasRenderingContext2D;
  });

  /**
   * Feature: text-editing-advanced, Property 4: Effect layering order
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
   * 
   * For any combination of effects, they should render in the order: fill → outline → shadow
   * (Note: In canvas, stroke/outline is rendered BEFORE fill for proper layering)
   */
  it('should render effects in correct order: outline (stroke) before fill', () => {
    fc.assert(
      fc.property(
        // Generate random text
        fc.string({ minLength: 1, maxLength: 50 }),
        // Generate random position
        fc.double({ min: 0, max: 1000 }),
        fc.double({ min: 0, max: 1000 }),
        // Generate random outline configuration
        fc.record({
          enabled: fc.boolean(),
          width: fc.double({ min: 1, max: 10 }),
          color: fc.constantFrom('#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'),
        }),
        // Generate random fill color
        fc.constantFrom('#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'),
        (text, x, y, outline, fillColor) => {
          // Reset call tracking
          strokeTextCalls = [];
          fillTextCalls = [];
          callOrder = 0;

          const effects: TextEffects = {
            fillColor,
            outline: outline as OutlineEffect,
            gradient: {
              enabled: false,
              type: 'linear',
              colorStops: [],
              angle: 0,
            },
            pattern: {
              enabled: false,
              image: null,
              scale: 1.0,
            },
          };

          const bounds = {
            x: x - 50,
            y: y - 10,
            width: 100,
            height: 20,
          };

          TextEffectsRenderer.renderTextWithEffects(
            mockCtx,
            text,
            x,
            y,
            effects,
            bounds
          );

          // Property: When outline is enabled, stroke should be called before fill
          if (outline.enabled) {
            expect(strokeTextCalls.length).toBeGreaterThan(0);
            expect(fillTextCalls.length).toBeGreaterThan(0);
            
            // Verify stroke was called before fill
            const firstStrokeOrder = strokeTextCalls[0].order;
            const firstFillOrder = fillTextCalls[0].order;
            expect(firstStrokeOrder).toBeLessThan(firstFillOrder);
          } else {
            // When outline is disabled, only fill should be called
            expect(strokeTextCalls.length).toBe(0);
            expect(fillTextCalls.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test: Gradient and outline should both render when enabled
   * Validates: Requirement 7.2
   */
  it('should render both gradient and outline when both are enabled', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.double({ min: 0, max: 1000 }),
        fc.double({ min: 0, max: 1000 }),
        fc.double({ min: 1, max: 10 }), // outline width
        fc.double({ min: 0, max: 360 }), // gradient angle
        (text, x, y, outlineWidth, gradientAngle) => {
          strokeTextCalls = [];
          fillTextCalls = [];
          callOrder = 0;

          const effects: TextEffects = {
            fillColor: '#000000',
            outline: {
              enabled: true,
              width: outlineWidth,
              color: '#ffffff',
            },
            gradient: {
              enabled: true,
              type: 'linear',
              colorStops: [
                { color: '#ff0000', position: 0 },
                { color: '#0000ff', position: 1 },
              ],
              angle: gradientAngle,
            },
            pattern: {
              enabled: false,
              image: null,
              scale: 1.0,
            },
          };

          const bounds = {
            x: x - 50,
            y: y - 10,
            width: 100,
            height: 20,
          };

          TextEffectsRenderer.renderTextWithEffects(
            mockCtx,
            text,
            x,
            y,
            effects,
            bounds
          );

          // Property: Both stroke and fill should be called
          expect(strokeTextCalls.length).toBeGreaterThan(0);
          expect(fillTextCalls.length).toBeGreaterThan(0);
          
          // Stroke should come before fill
          expect(strokeTextCalls[0].order).toBeLessThan(fillTextCalls[0].order);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test: Pattern and outline should both render when enabled
   * Validates: Requirement 7.3
   * 
   * Note: Pattern rendering requires actual canvas/image elements, so we test
   * that the pattern is disabled gracefully when image is not available,
   * and that outline still renders correctly.
   */
  it('should render both pattern and outline when both are enabled', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.double({ min: 0, max: 1000 }),
        fc.double({ min: 0, max: 1000 }),
        fc.double({ min: 1, max: 10 }), // outline width
        fc.double({ min: 0.1, max: 2.0 }), // pattern scale
        (text, x, y, outlineWidth, patternScale) => {
          strokeTextCalls = [];
          fillTextCalls = [];
          callOrder = 0;

          // Pattern is disabled (null image) - this tests that outline still works
          // when pattern is configured but not available
          const effects: TextEffects = {
            fillColor: '#000000',
            outline: {
              enabled: true,
              width: outlineWidth,
              color: '#ffffff',
            },
            gradient: {
              enabled: false,
              type: 'linear',
              colorStops: [],
              angle: 0,
            },
            pattern: {
              enabled: true,
              image: null, // Pattern image not available
              scale: patternScale,
            },
          };

          const bounds = {
            x: x - 50,
            y: y - 10,
            width: 100,
            height: 20,
          };

          TextEffectsRenderer.renderTextWithEffects(
            mockCtx,
            text,
            x,
            y,
            effects,
            bounds
          );

          // Property: Both stroke and fill should be called
          // Even when pattern is not available, fill falls back to solid color
          expect(strokeTextCalls.length).toBeGreaterThan(0);
          expect(fillTextCalls.length).toBeGreaterThan(0);
          
          // Stroke should come before fill
          expect(strokeTextCalls[0].order).toBeLessThan(fillTextCalls[0].order);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test: Effect parameters should be validated and clamped
   */
  it('should validate and clamp effect parameters to valid ranges', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 100 }), // outline width (can be out of range)
        fc.double({ min: -1000, max: 1000 }), // gradient angle (can be out of range)
        fc.double({ min: -10, max: 10 }), // pattern scale (can be out of range)
        fc.array(
          fc.record({
            color: fc.constantFrom('#ff0000', '#00ff00', '#0000ff'),
            position: fc.double({ min: -2, max: 3 }), // can be out of range
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (outlineWidth, gradientAngle, patternScale, colorStops) => {
          const effects: TextEffects = {
            fillColor: '#000000',
            outline: {
              enabled: true,
              width: outlineWidth,
              color: '#ffffff',
            },
            gradient: {
              enabled: true,
              type: 'linear',
              colorStops: colorStops as ColorStop[],
              angle: gradientAngle,
            },
            pattern: {
              enabled: true,
              image: null,
              scale: patternScale,
            },
          };

          const validated = TextEffectsRenderer.validateEffects(effects);

          // Property: Outline width should be clamped to 1-10
          expect(validated.outline.width).toBeGreaterThanOrEqual(1);
          expect(validated.outline.width).toBeLessThanOrEqual(10);

          // Property: Gradient angle should be normalized to 0-360
          expect(validated.gradient.angle).toBeGreaterThanOrEqual(0);
          expect(validated.gradient.angle).toBeLessThan(360);

          // Property: Pattern scale should be clamped to 0.1-2.0
          expect(validated.pattern.scale).toBeGreaterThanOrEqual(0.1);
          expect(validated.pattern.scale).toBeLessThanOrEqual(2.0);

          // Property: Color stop positions should be clamped to 0-1
          validated.gradient.colorStops.forEach(stop => {
            expect(stop.position).toBeGreaterThanOrEqual(0);
            expect(stop.position).toBeLessThanOrEqual(1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit test: Default effects should have correct structure
   */
  it('should create default effects with correct structure', () => {
    const defaults = createDefaultEffects();

    expect(defaults.fillColor).toBe('#000000');
    expect(defaults.outline.enabled).toBe(false);
    expect(defaults.gradient.enabled).toBe(false);
    expect(defaults.pattern.enabled).toBe(false);
    expect(defaults.gradient.colorStops.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * Unit test: Gradient creation should handle linear gradients
   */
  it('should create linear gradient with correct parameters', () => {
    const gradient: GradientEffect = {
      enabled: true,
      type: 'linear',
      colorStops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 1 },
      ],
      angle: 45,
    };

    const bounds = {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    };

    const result = TextEffectsRenderer.createGradient(mockCtx, gradient, bounds);

    expect(result).toBeDefined();
    expect(mockCtx.createLinearGradient).toHaveBeenCalled();
  });

  /**
   * Unit test: Gradient creation should handle radial gradients
   */
  it('should create radial gradient with correct parameters', () => {
    const gradient: GradientEffect = {
      enabled: true,
      type: 'radial',
      colorStops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 1 },
      ],
      angle: 0,
    };

    const bounds = {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    };

    const result = TextEffectsRenderer.createGradient(mockCtx, gradient, bounds);

    expect(result).toBeDefined();
    expect(mockCtx.createRadialGradient).toHaveBeenCalled();
  });

  /**
   * Unit test: Pattern creation should return null when disabled
   */
  it('should return null when pattern is disabled', () => {
    const pattern: PatternEffect = {
      enabled: false,
      image: null,
      scale: 1.0,
    };

    const result = TextEffectsRenderer.createPattern(mockCtx, pattern);

    expect(result).toBeNull();
  });

  /**
   * Unit test: Outline application should set correct context properties
   */
  it('should set correct context properties for outline', () => {
    const outline: OutlineEffect = {
      enabled: true,
      width: 5,
      color: '#ff0000',
    };

    TextEffectsRenderer.applyOutline(mockCtx, outline);

    expect(mockCtx.lineWidth).toBe(5);
    expect(mockCtx.strokeStyle).toBe('#ff0000');
    expect(mockCtx.lineJoin).toBe('round');
  });
});
