/**
 * MultiLineRenderer - Handles multi-line text rendering with line breaks
 */

import type { Transform } from '../canvas/types';

/**
 * Configuration for multi-line text rendering
 */
export interface MultiLineConfig {
  /** Line spacing multiplier (1.0 = normal, 1.5 = 1.5x spacing) */
  lineSpacing: number;
  /** Font size in pixels */
  fontSize: number;
}

/**
 * Bounds of rendered multi-line text
 */
export interface TextBounds {
  /** Width of the widest line */
  width: number;
  /** Total height including all lines and spacing */
  height: number;
  /** Number of lines */
  lineCount: number;
}

/**
 * MultiLineRenderer class for handling multi-line text
 */
export class MultiLineRenderer {
  /**
   * Split text into lines based on line breaks
   * @param text - Text content with potential line breaks
   * @returns Array of individual lines
   */
  static splitLines(text: string): string[] {
    // Handle different line break formats: \n, \r\n, \r
    // Split on \r\n first, then on remaining \n or \r
    return text.split(/\r\n|\r|\n/);
  }

  /**
   * Calculate bounds for multi-line text
   * @param ctx - Canvas rendering context
   * @param text - Text content with potential line breaks
   * @param config - Multi-line configuration
   * @returns Bounds of the rendered text
   */
  static calculateBounds(
    ctx: CanvasRenderingContext2D,
    text: string,
    config: MultiLineConfig
  ): TextBounds {
    const lines = this.splitLines(text);
    const lineCount = lines.length;
    
    // Calculate width (widest line)
    let maxWidth = 0;
    for (const line of lines) {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }
    
    // Calculate height
    const lineHeight = config.fontSize * config.lineSpacing;
    const totalHeight = lineHeight * lineCount;
    
    return {
      width: maxWidth,
      height: totalHeight,
      lineCount,
    };
  }

  /**
   * Render multi-line text with proper line spacing
   * @param ctx - Canvas rendering context
   * @param text - Text content with potential line breaks
   * @param config - Multi-line configuration
   * @param transform - Transform properties (position, scale, rotation)
   * @param renderLine - Function to render a single line
   */
  static renderMultiLine(
    ctx: CanvasRenderingContext2D,
    text: string,
    config: MultiLineConfig,
    transform: Transform,
    renderLine: (ctx: CanvasRenderingContext2D, line: string, x: number, y: number) => void
  ): void {
    const lines = this.splitLines(text);
    const lineHeight = config.fontSize * config.lineSpacing;
    
    // Calculate starting Y position (centered around transform.y)
    const totalHeight = lineHeight * lines.length;
    const startY = transform.y - (totalHeight / 2) + (lineHeight / 2);
    
    // Render each line
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      renderLine(ctx, line, transform.x, y);
    });
  }

  /**
   * Get line spacing in pixels
   * @param fontSize - Font size in pixels
   * @param lineSpacing - Line spacing multiplier
   * @returns Line spacing in pixels
   */
  static getLineSpacing(fontSize: number, lineSpacing: number): number {
    return fontSize * lineSpacing;
  }
}
