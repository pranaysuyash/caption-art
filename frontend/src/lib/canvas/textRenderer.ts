/**
 * TextRenderer - Handles text styling and rendering with preset styles
 * Now supports advanced text features via AdvancedTextRenderer
 */

import type { StylePreset, Transform } from './types';
import { AdvancedTextRenderer, type AdvancedTextConfig } from '../text/advancedTextRenderer';
import type { TextAlignment } from '../text/alignmentManager';
import type { TextEffects } from '../text/textEffects';

/**
 * Text style configuration
 */
export interface TextStyle {
  /** Font family and size */
  font: string;
  /** Fill color */
  fillStyle: string;
  /** Stroke color (optional) */
  strokeStyle?: string;
  /** Stroke width (optional) */
  lineWidth?: number;
  /** Multiple shadow layers (for neon effect) */
  shadows?: Array<{ blur: number; color: string }>;
  /** Single shadow (for emboss effect) */
  shadow?: { x: number; y: number; blur: number; color: string };
}

/**
 * Extended text layer configuration with advanced features
 */
export interface AdvancedTextLayer {
  /** Text content (may contain line breaks) */
  text: string;
  /** Font family (including custom fonts) */
  fontFamily?: string;
  /** Font size in pixels */
  fontSize: number;
  /** Line spacing multiplier (1.0 = normal, default: 1.2) */
  lineSpacing?: number;
  /** Text alignment (default: 'center') */
  alignment?: TextAlignment;
  /** Text effects (outline, gradient, pattern) */
  effects?: TextEffects;
  /** Transform properties */
  transform: Transform;
}

/**
 * TextRenderer class for rendering styled text on canvas
 */
export class TextRenderer {
  /**
   * Get the text style configuration for a given preset
   * @param preset - The style preset to apply
   * @param fontSize - Base font size in pixels
   * @returns TextStyle configuration
   */
  static getStyle(preset: StylePreset, fontSize: number): TextStyle {
    switch (preset) {
      case 'neon':
        return {
          font: `bold ${fontSize}px Arial, sans-serif`,
          fillStyle: '#ffffff',
          shadows: [
            { blur: 10, color: '#00ffff' },
            { blur: 20, color: '#00ffff' },
            { blur: 30, color: '#00ffff' },
            { blur: 40, color: '#0088ff' },
          ],
        };

      case 'magazine':
        return {
          font: `bold ${fontSize}px Georgia, serif`,
          fillStyle: '#000000',
          strokeStyle: '#ffffff',
          lineWidth: fontSize * 0.15, // 15% of font size for thick stroke
        };

      case 'brush':
        return {
          font: `italic ${fontSize}px 'Brush Script MT', cursive`,
          fillStyle: '#2c3e50',
          strokeStyle: '#34495e',
          lineWidth: fontSize * 0.02, // Subtle stroke for texture
        };

      case 'emboss':
        return {
          font: `bold ${fontSize}px 'Helvetica Neue', sans-serif`,
          fillStyle: '#e0e0e0',
          shadow: {
            x: 3,
            y: 3,
            blur: 2,
            color: '#000000',
          },
        };

      default:
        // Fallback to neon style
        return TextRenderer.getStyle('neon', fontSize);
    }
  }

  /**
   * Render text with the specified style and transform
   * @param ctx - Canvas rendering context
   * @param text - Text content to render
   * @param style - Text style configuration
   * @param transform - Transform properties (position, scale, rotation)
   */
  static renderText(
    ctx: CanvasRenderingContext2D,
    text: string,
    style: TextStyle,
    transform: Transform
  ): void {
    // Save the current context state
    ctx.save();

    // Apply font
    ctx.font = style.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Apply fill style
    ctx.fillStyle = style.fillStyle;

    // Apply stroke style if defined
    if (style.strokeStyle && style.lineWidth) {
      ctx.strokeStyle = style.strokeStyle;
      ctx.lineWidth = style.lineWidth;
    }

    // Apply multiple shadow layers (for neon effect)
    if (style.shadows && style.shadows.length > 0) {
      // Render each shadow layer
      style.shadows.forEach((shadow) => {
        ctx.shadowBlur = shadow.blur;
        ctx.shadowColor = shadow.color;
        ctx.fillText(text, transform.x, transform.y);
      });
      
      // Reset shadow for final text render
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }

    // Apply single shadow (for emboss effect)
    if (style.shadow) {
      ctx.shadowOffsetX = style.shadow.x;
      ctx.shadowOffsetY = style.shadow.y;
      ctx.shadowBlur = style.shadow.blur;
      ctx.shadowColor = style.shadow.color;
    }

    // Render stroke first (if defined) so fill appears on top
    if (style.strokeStyle && style.lineWidth) {
      ctx.strokeText(text, transform.x, transform.y);
    }

    // Render fill text
    ctx.fillText(text, transform.x, transform.y);

    // Restore the context state
    ctx.restore();
  }

  /**
   * Render text with advanced features (multi-line, alignment, custom fonts, effects)
   * @param ctx - Canvas rendering context
   * @param config - Advanced text configuration
   * @param canvasWidth - Canvas width in pixels
   * @param canvasHeight - Canvas height in pixels
   */
  static renderAdvanced(
    ctx: CanvasRenderingContext2D,
    config: AdvancedTextLayer,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    // Build advanced text config with defaults
    const advancedConfig: AdvancedTextConfig = {
      text: config.text,
      fontFamily: config.fontFamily || 'Arial, sans-serif',
      fontSize: config.fontSize,
      lineSpacing: config.lineSpacing ?? 1.2,
      alignment: config.alignment ?? 'center',
      effects: config.effects ?? {
        fillColor: '#ffffff',
        outline: {
          enabled: false,
          width: 2,
          color: '#000000',
        },
        gradient: {
          enabled: false,
          type: 'linear',
          colorStops: [
            { color: '#ff0000', position: 0 },
            { color: '#0000ff', position: 1 },
          ],
          angle: 0,
        },
        pattern: {
          enabled: false,
          image: null,
          scale: 1.0,
        },
      },
      transform: config.transform,
    };

    // Delegate to AdvancedTextRenderer
    AdvancedTextRenderer.render(ctx, advancedConfig, canvasWidth, canvasHeight);
  }

  /**
   * Calculate bounds for advanced text
   * @param ctx - Canvas rendering context
   * @param config - Advanced text configuration
   * @returns Bounds of the text
   */
  static calculateAdvancedBounds(
    ctx: CanvasRenderingContext2D,
    config: AdvancedTextLayer
  ): { width: number; height: number; lineCount: number } {
    const advancedConfig: AdvancedTextConfig = {
      text: config.text,
      fontFamily: config.fontFamily || 'Arial, sans-serif',
      fontSize: config.fontSize,
      lineSpacing: config.lineSpacing ?? 1.2,
      alignment: config.alignment ?? 'center',
      effects: config.effects ?? {
        fillColor: '#ffffff',
        outline: { enabled: false, width: 2, color: '#000000' },
        gradient: {
          enabled: false,
          type: 'linear',
          colorStops: [
            { color: '#ff0000', position: 0 },
            { color: '#0000ff', position: 1 },
          ],
          angle: 0,
        },
        pattern: { enabled: false, image: null, scale: 1.0 },
      },
      transform: config.transform,
    };

    return AdvancedTextRenderer.calculateBounds(ctx, advancedConfig);
  }
}
