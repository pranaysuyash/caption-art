/**
 * Advanced Text Renderer
 * Integrates multi-line text, alignment, custom fonts, and effects with canvas rendering
 * Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.5, 6.1-6.5, 7.1-7.5
 */

import { MultiLineRenderer, type MultiLineConfig } from './multiLineRenderer';
import { AlignmentManager, type TextAlignment } from './alignmentManager';
import { TextEffectsRenderer, type TextEffects } from './textEffects';
import type { Transform } from '../canvas/types';

/**
 * Configuration for advanced text rendering
 */
export interface AdvancedTextConfig {
  /** Text content (may contain line breaks) */
  text: string;
  /** Font family (including custom fonts) */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Line spacing multiplier (1.0 = normal) */
  lineSpacing: number;
  /** Text alignment */
  alignment: TextAlignment;
  /** Text effects (outline, gradient, pattern) */
  effects: TextEffects;
  /** Transform properties */
  transform: Transform;
}

/**
 * Advanced Text Renderer class
 * Integrates all advanced text editing features with canvas rendering
 */
export class AdvancedTextRenderer {
  /**
   * Render text with all advanced features
   * Requirements: 1.1-1.5 (multi-line), 2.1-2.5 (alignment), 3.4 (custom fonts),
   * 4.1-4.5 (outline), 5.1-5.5 (gradient), 6.1-6.5 (pattern), 7.1-7.5 (effects)
   */
  static render(
    ctx: CanvasRenderingContext2D,
    config: AdvancedTextConfig,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    // Save context state
    ctx.save();

    try {
      // Requirement 3.4: Apply custom font
      ctx.font = `${config.fontSize}px ${config.fontFamily}`;
      ctx.textAlign = 'left'; // We'll handle alignment manually
      ctx.textBaseline = 'middle';

      // Split text into lines (Requirements: 1.1, 1.2)
      const lines = MultiLineRenderer.splitLines(config.text);

      // Calculate multi-line configuration (Requirements: 1.3, 1.4)
      const multiLineConfig: MultiLineConfig = {
        lineSpacing: config.lineSpacing,
        fontSize: config.fontSize,
      };

      // Calculate bounds for effects
      const bounds = MultiLineRenderer.calculateBounds(
        ctx,
        config.text,
        multiLineConfig
      );

      // Calculate maximum width for alignment
      const maxWidth = bounds.width;

      // Convert normalized transform to pixel coordinates
      const baseX = config.transform.x * canvasWidth;
      const baseY = config.transform.y * canvasHeight;

      // Calculate line height
      const lineHeight = MultiLineRenderer.getLineSpacing(
        config.fontSize,
        config.lineSpacing
      );

      // Calculate starting Y position (centered around baseY)
      const totalHeight = lineHeight * lines.length;
      const startY = baseY - (totalHeight / 2) + (lineHeight / 2);

      // Render each line with alignment and effects
      lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);

        // Calculate alignment for this line (Requirements: 2.1-2.5)
        const alignmentResult = AlignmentManager.calculateAlignment(
          ctx,
          line,
          baseX,
          maxWidth,
          config.alignment
        );

        // Calculate text bounds for effects
        const lineMetrics = ctx.measureText(line);
        const effectBounds = {
          x: alignmentResult.x,
          y: y - config.fontSize / 2,
          width: lineMetrics.width,
          height: config.fontSize,
        };

        // Render with effects (Requirements: 4.1-4.5, 5.1-5.5, 6.1-6.5, 7.1-7.5)
        if (alignmentResult.wordSpacing !== undefined) {
          // Justify alignment: render with word spacing
          this.renderLineWithEffectsAndWordSpacing(
            ctx,
            line,
            alignmentResult.x,
            y,
            alignmentResult.wordSpacing,
            config.effects,
            effectBounds
          );
        } else {
          // Other alignments: render normally
          TextEffectsRenderer.renderTextWithEffects(
            ctx,
            line,
            alignmentResult.x + lineMetrics.width / 2, // Center for effects
            y,
            config.effects,
            effectBounds
          );
        }
      });
    } finally {
      // Restore context state
      ctx.restore();
    }
  }

  /**
   * Render a line with word spacing (for justify alignment) and effects
   * @private
   */
  private static renderLineWithEffectsAndWordSpacing(
    ctx: CanvasRenderingContext2D,
    line: string,
    x: number,
    y: number,
    wordSpacing: number,
    effects: TextEffects,
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    const words = line.trim().split(/\s+/);
    let currentX = x;

    // Apply outline if enabled (Requirement 7.1: outline before fill)
    if (effects.outline.enabled) {
      TextEffectsRenderer.applyOutline(ctx, effects.outline);
      
      words.forEach((word, index) => {
        ctx.strokeText(word, currentX, y);
        const wordWidth = ctx.measureText(word).width;
        currentX += wordWidth;
        
        if (index < words.length - 1) {
          currentX += wordSpacing;
        }
      });
    }

    // Reset currentX for fill pass
    currentX = x;

    // Apply fill (gradient, pattern, or solid color)
    TextEffectsRenderer.applyFill(ctx, effects, bounds);

    words.forEach((word, index) => {
      ctx.fillText(word, currentX, y);
      const wordWidth = ctx.measureText(word).width;
      currentX += wordWidth;
      
      if (index < words.length - 1) {
        currentX += wordSpacing;
      }
    });
  }

  /**
   * Calculate bounds for advanced text rendering
   * Useful for positioning and layout calculations
   */
  static calculateBounds(
    ctx: CanvasRenderingContext2D,
    config: AdvancedTextConfig
  ): { width: number; height: number; lineCount: number } {
    // Save and restore context state
    ctx.save();
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;

    const multiLineConfig: MultiLineConfig = {
      lineSpacing: config.lineSpacing,
      fontSize: config.fontSize,
    };

    const bounds = MultiLineRenderer.calculateBounds(
      ctx,
      config.text,
      multiLineConfig
    );

    ctx.restore();

    return bounds;
  }

  /**
   * Create default advanced text configuration
   */
  static createDefaultConfig(): Omit<AdvancedTextConfig, 'text' | 'transform'> {
    return {
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      lineSpacing: 1.2,
      alignment: 'center',
      effects: {
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
    };
  }
}
