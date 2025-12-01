/**
 * Integration tests for Compositor with advanced text features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Compositor } from './compositor';
import type { AdvancedTextLayer } from './textRenderer';

describe('Compositor - Advanced Text Integration', () => {
  let canvas: HTMLCanvasElement;
  let backgroundImage: HTMLCanvasElement;
  let compositor: Compositor;

  beforeEach(() => {
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Create background image (using canvas as image source)
    backgroundImage = document.createElement('canvas');
    backgroundImage.width = 800;
    backgroundImage.height = 600;
    const bgCtx = backgroundImage.getContext('2d');
    if (bgCtx) {
      bgCtx.fillStyle = '#cccccc';
      bgCtx.fillRect(0, 0, 800, 600);
    }

    // Create compositor
    compositor = new Compositor({
      canvas,
      backgroundImage,
      maxDimension: 1080,
    });
  });

  describe('renderAdvanced', () => {
    it('should render single-line text with advanced features', () => {
      const textLayer: AdvancedTextLayer = {
        text: 'Hello World',
        fontFamily: 'Arial',
        fontSize: 48,
        lineSpacing: 1.2,
        alignment: 'center',
        effects: {
          fillColor: '#ffffff',
          outline: { enabled: false, width: 2, color: '#000000' },
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
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should render multi-line text', () => {
      const textLayer: AdvancedTextLayer = {
        text: 'Line 1\nLine 2\nLine 3',
        fontFamily: 'Arial',
        fontSize: 48,
        lineSpacing: 1.5,
        alignment: 'center',
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should render text with left alignment', () => {
      const textLayer: AdvancedTextLayer = {
        text: 'Left aligned',
        fontFamily: 'Arial',
        fontSize: 48,
        alignment: 'left',
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should render text with right alignment', () => {
      const textLayer: AdvancedTextLayer = {
        text: 'Right aligned',
        fontFamily: 'Arial',
        fontSize: 48,
        alignment: 'right',
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should render text with justify alignment', () => {
      const textLayer: AdvancedTextLayer = {
        text: 'This is a long line of text that should be justified across the width',
        fontFamily: 'Arial',
        fontSize: 24,
        alignment: 'justify',
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should render text with outline effect', () => {
      const textLayer: AdvancedTextLayer = {
        text: 'Outlined',
        fontFamily: 'Arial',
        fontSize: 48,
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
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should render text with gradient effect', () => {
      const textLayer: AdvancedTextLayer = {
        text: 'Gradient',
        fontFamily: 'Arial',
        fontSize: 48,
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
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should render text with radial gradient', () => {
      const textLayer: AdvancedTextLayer = {
        text: 'Radial',
        fontFamily: 'Arial',
        fontSize: 48,
        effects: {
          fillColor: '#000000',
          outline: { enabled: false, width: 2, color: '#ffffff' },
          gradient: {
            enabled: true,
            type: 'radial',
            colorStops: [
              { color: '#ffff00', position: 0 },
              { color: '#ff00ff', position: 1 },
            ],
            angle: 0,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should render multi-line text with all effects', () => {
      const textLayer: AdvancedTextLayer = {
        text: 'Line 1\nLine 2\nLine 3',
        fontFamily: 'Arial',
        fontSize: 36,
        lineSpacing: 1.4,
        alignment: 'center',
        effects: {
          fillColor: '#ffffff',
          outline: { enabled: true, width: 2, color: '#000000' },
          gradient: {
            enabled: true,
            type: 'linear',
            colorStops: [
              { color: '#ff0000', position: 0 },
              { color: '#00ff00', position: 0.5 },
              { color: '#0000ff', position: 1 },
            ],
            angle: 90,
          },
          pattern: { enabled: false, image: null, scale: 1.0 },
        },
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should handle empty text gracefully', () => {
      const textLayer: AdvancedTextLayer = {
        text: '',
        fontFamily: 'Arial',
        fontSize: 48,
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });

    it('should handle whitespace-only text gracefully', () => {
      const textLayer: AdvancedTextLayer = {
        text: '   ',
        fontFamily: 'Arial',
        fontSize: 48,
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        compositor.renderAdvanced(textLayer);
      }).not.toThrow();
    });
  });

  describe('backward compatibility', () => {
    it('should still support original render method', () => {
      const textLayer = {
        text: 'Classic',
        preset: 'neon' as const,
        fontSize: 48,
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => {
        compositor.render(textLayer);
      }).not.toThrow();
    });
  });
});
