/**
 * AlignmentManager - Handles text alignment (left, center, right, justify)
 */

/**
 * Text alignment options
 */
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

/**
 * Configuration for text alignment
 */
export interface AlignmentConfig {
  /** Alignment type */
  alignment: TextAlignment;
  /** Maximum width for text (used for justify alignment) */
  maxWidth?: number;
}

/**
 * Result of alignment calculation
 */
export interface AlignmentResult {
  /** X offset for the line */
  x: number;
  /** Word spacing adjustment (for justify) */
  wordSpacing?: number;
}

/**
 * AlignmentManager class for handling text alignment
 */
export class AlignmentManager {
  /**
   * Calculate X offset for a line based on alignment
   * @param ctx - Canvas rendering context
   * @param line - Text line to align
   * @param baseX - Base X position (typically center or left edge)
   * @param maxWidth - Maximum width available for text
   * @param alignment - Alignment type
   * @returns Alignment result with X offset and optional word spacing
   */
  static calculateAlignment(
    ctx: CanvasRenderingContext2D,
    line: string,
    baseX: number,
    maxWidth: number,
    alignment: TextAlignment
  ): AlignmentResult {
    const metrics = ctx.measureText(line);
    const lineWidth = metrics.width;

    switch (alignment) {
      case 'left':
        return this.alignLeft(baseX, maxWidth);
      
      case 'center':
        return this.alignCenter(baseX, lineWidth, maxWidth);
      
      case 'right':
        return this.alignRight(baseX, lineWidth, maxWidth);
      
      case 'justify':
        return this.alignJustify(ctx, line, baseX, lineWidth, maxWidth);
      
      default:
        return this.alignLeft(baseX, maxWidth);
    }
  }

  /**
   * Align text to the left
   * @param baseX - Base X position
   * @param maxWidth - Maximum width available
   * @returns Alignment result
   */
  private static alignLeft(baseX: number, maxWidth: number): AlignmentResult {
    // Left alignment: start at the left edge
    return {
      x: baseX - maxWidth / 2,
    };
  }

  /**
   * Align text to the center
   * @param baseX - Base X position
   * @param lineWidth - Width of the line
   * @param maxWidth - Maximum width available
   * @returns Alignment result
   */
  private static alignCenter(
    baseX: number,
    lineWidth: number,
    maxWidth: number
  ): AlignmentResult {
    // Center alignment: center the line within the max width
    return {
      x: baseX - lineWidth / 2,
    };
  }

  /**
   * Align text to the right
   * @param baseX - Base X position
   * @param lineWidth - Width of the line
   * @param maxWidth - Maximum width available
   * @returns Alignment result
   */
  private static alignRight(
    baseX: number,
    lineWidth: number,
    maxWidth: number
  ): AlignmentResult {
    // Right alignment: end at the right edge
    return {
      x: baseX + maxWidth / 2 - lineWidth,
    };
  }

  /**
   * Justify text (distribute words evenly across line width)
   * @param ctx - Canvas rendering context
   * @param line - Text line to justify
   * @param baseX - Base X position
   * @param lineWidth - Width of the line
   * @param maxWidth - Maximum width available
   * @returns Alignment result with word spacing adjustment
   */
  private static alignJustify(
    ctx: CanvasRenderingContext2D,
    line: string,
    baseX: number,
    lineWidth: number,
    maxWidth: number
  ): AlignmentResult {
    // Don't justify if line is too short or is the last line
    // For now, we'll justify all lines that have multiple words
    const words = line.trim().split(/\s+/);
    
    if (words.length <= 1) {
      // Single word or empty: align left
      return this.alignLeft(baseX, maxWidth);
    }

    // Don't justify if the line is already wider than maxWidth or very close to it
    // This prevents negative or very small word spacing
    if (lineWidth >= maxWidth * 0.95) {
      // Line is already close to full width, align left
      return this.alignLeft(baseX, maxWidth);
    }

    // Calculate word spacing needed to fill the line
    const gaps = words.length - 1;
    const totalWordWidth = words.reduce((sum, word) => {
      return sum + ctx.measureText(word).width;
    }, 0);
    
    const availableSpace = maxWidth;
    const extraSpace = availableSpace - totalWordWidth;
    const wordSpacing = extraSpace / gaps;

    return {
      x: baseX - maxWidth / 2,
      wordSpacing: Math.max(0, wordSpacing), // Ensure non-negative
    };
  }

  /**
   * Render a line with word spacing (for justify alignment)
   * @param ctx - Canvas rendering context
   * @param line - Text line to render
   * @param x - X position
   * @param y - Y position
   * @param wordSpacing - Additional spacing between words
   * @param fillStyle - Fill style for text
   */
  static renderWithWordSpacing(
    ctx: CanvasRenderingContext2D,
    line: string,
    x: number,
    y: number,
    wordSpacing: number,
    fillStyle: string
  ): void {
    const words = line.trim().split(/\s+/);
    let currentX = x;

    ctx.fillStyle = fillStyle;
    
    words.forEach((word, index) => {
      ctx.fillText(word, currentX, y);
      const wordWidth = ctx.measureText(word).width;
      currentX += wordWidth;
      
      // Add word spacing between words (not after the last word)
      if (index < words.length - 1) {
        currentX += wordSpacing;
      }
    });
  }

  /**
   * Apply alignment to multiple lines
   * @param ctx - Canvas rendering context
   * @param lines - Array of text lines
   * @param baseX - Base X position
   * @param maxWidth - Maximum width available
   * @param alignment - Alignment type
   * @returns Array of alignment results for each line
   */
  static alignMultipleLines(
    ctx: CanvasRenderingContext2D,
    lines: string[],
    baseX: number,
    maxWidth: number,
    alignment: TextAlignment
  ): AlignmentResult[] {
    return lines.map(line => 
      this.calculateAlignment(ctx, line, baseX, maxWidth, alignment)
    );
  }
}
