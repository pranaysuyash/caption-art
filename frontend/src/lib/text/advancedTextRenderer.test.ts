/**
 * Tests for Advanced Text Renderer integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedTextRenderer } from './advancedTextRenderer';
import type { AdvancedTextConfig } from './advancedTextRenderer';

describe('AdvancedTextRenderer', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    ctx = context;
  });

  describe('render', () => {
    it('should render single-line text', () => {
      const config: AdvancedTextConfig = {
        text: 'Hello World',
        fontFamily: 'Arial',
        fontSize: 48,
        lineSpacing: 1.2,
        alignment: 'center',
        effects: {
          fillColor: '#000000',
          outline: { enabled: false, width: 2, color: '#ffffff' },
          gradient: {
            enabled: false,
            type: 'linear',
            colorStops: [],
            angle: 0,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        AdvancedTextRenderer.render(ctx, config, canvas.width, canvas.height);
      }).not.toThrow();
    });

    it('should render multi-line text', () => {
      const config: AdvancedTextConfig = {
        text: 'Line 1\nLine 2\nLine 3',
        fontFamily: 'Arial',
        fontSize: 48,
        lineSpacing: 1.5,
        alignment: 'center',
        effects: {
          fillColor: '#000000',
          outline: { enabled: false, width: 2, color: '#ffffff' },
          gradient: {
            enabled: false,
            type: 'linear',
            colorStops: [],
            angle: 0,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        AdvancedTextRenderer.render(ctx, config, canvas.width, canvas.height);
      }).not.toThrow();
    });

    it('should render text with left alignment', () => {
      const config: AdvancedTextConfig = {
        text: 'Left aligned text',
        fontFamily: 'Arial',
        fontSize: 48,
        lineSpacing: 1.2,
        alignment: 'left',
        effects: {
          fillColor: '#000000',
          outline: { enabled: false, width: 2, color: '#ffffff' },
          gradient: {
            enabled: false,
            type: 'linear',
            colorStops: [],
            angle: 0,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        AdvancedTextRenderer.render(ctx, config, canvas.width, canvas.height);
      }).not.toThrow();
    });

    it('should render text with outline effect', () => {
      const config: AdvancedTextConfig = {
        text: 'Outlined text',
        fontFamily: 'Arial',
        fontSize: 48,
        lineSpacing: 1.2,
        alignment: 'center',
        effects: {
          fillColor: '#ffffff',
          outline: { enabled: true, width: 3, color: '#000000' },
          gradient: {
            enabled: false,
            type: 'linear',
            colorStops: [],
            angle: 0,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        AdvancedTextRenderer.render(ctx, config, canvas.width, canvas.height);
      }).not.toThrow();
    });

    it('should render text with gradient effect', () => {
      const config: AdvancedTextConfig = {
        text: 'Gradient text',
        fontFamily: 'Arial',
        fontSize: 48,
        lineSpacing: 1.2,
        alignment: 'center',
        effects: {
          fillColor: '#000000',
          outline: { enabled: false, width: 2, color: '#ffffff' },
          gradient: {
            enabled: true,
            type: 'linear',
            colorStops: [
              { color: '#ff0000', position: 0 },
              { color: '#0000ff', position: 1 },
            ],
            angle: 45,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        AdvancedTextRenderer.render(ctx, config, canvas.width, canvas.height);
      }).not.toThrow();
    });

    it('should render text with justify alignment', () => {
      const config: AdvancedTextConfig = {
        text: 'This is a long line of text that should be justified',
        fontFamily: 'Arial',
        fontSize: 24,
        lineSpacing: 1.2,
        alignment: 'justify',
        effects: {
          fillColor: '#000000',
          outline: { enabled: false, width: 2, color: '#ffffff' },
          gradient: {
            enabled: false,
            type: 'linear',
            colorStops: [],
            angle: 0,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        AdvancedTextRenderer.render(ctx, config, canvas.width, canvas.height);
      }).not.toThrow();
    });
  });

  describe('calculateBounds', () => {
    it('should calculate bounds for single-line text', () => {
      const config: AdvancedTextConfig = {
        text: 'Hello',
        fontFamily: 'Arial',
        fontSize: 48,
        lineSpacing: 1.2,
        alignment: 'center',
        effects: {
          fillColor: '#000000',
          outline: { enabled: false, width: 2, color: '#ffffff' },
          gradient: {
            enabled: false,
            type: 'linear',
            colorStops: [],
            angle: 0,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      const bounds = AdvancedTextRenderer.calculateBounds(ctx, config);

      expect(bounds.lineCount).toBe(1);
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });

    it('should calculate bounds for multi-line text', () => {
      const config: AdvancedTextConfig = {
        text: 'Line 1\nLine 2\nLine 3',
        fontFamily: 'Arial',
        fontSize: 48,
        lineSpacing: 1.5,
        alignment: 'center',
        effects: {
          fillColor: '#000000',
          outline: { enabled: false, width: 2, color: '#ffffff' },
          gradient: {
            enabled: false,
            type: 'linear',
            colorStops: [],
            angle: 0,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      const bounds = AdvancedTextRenderer.calculateBounds(ctx, config);

      expect(bounds.lineCount).toBe(3);
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
      // Height should be approximately fontSize * lineSpacing * lineCount
      expect(bounds.height).toBeCloseTo(48 * 1.5 * 3, -1);
    });
  });

  describe('createDefaultConfig', () => {
    it('should create valid default configuration', () => {
      const defaults = AdvancedTextRenderer.createDefaultConfig();

      expect(defaults.fontFamily).toBe('Arial, sans-serif');
      expect(defaults.fontSize).toBe(48);
      expect(defaults.lineSpacing).toBe(1.2);
      expect(defaults.alignment).toBe('center');
      expect(defaults.effects).toBeDefined();
      expect(defaults.effects.fillColor).toBe('#ffffff');
      expect(defaults.effects.outline.enabled).toBe(false);
      expect(defaults.effects.gradient.enabled).toBe(false);
      expect(defaults.effects.pattern.enabled).toBe(false);
    });
  });
});
