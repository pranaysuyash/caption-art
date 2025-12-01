/**
 * Text Effects
 * Handles advanced text effects: outlines, gradients, and pattern fills
 * Requirements: 4.1-4.5, 5.1-5.5, 6.1-6.5, 7.1-7.5
 */

/**
 * Gradient type options
 */
export type GradientType = 'linear' | 'radial';

/**
 * Color stop for gradients
 */
export interface ColorStop {
  /** Color value (hex, rgb, rgba) */
  color: string;
  /** Position along gradient (0-1) */
  position: number;
}

/**
 * Outline effect configuration
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export interface OutlineEffect {
  /** Enable outline effect */
  enabled: boolean;
  /** Stroke width in pixels (1-10) */
  width: number;
  /** Stroke color */
  color: string;
}

/**
 * Gradient fill configuration
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export interface GradientEffect {
  /** Enable gradient effect */
  enabled: boolean;
  /** Gradient type (linear or radial) */
  type: GradientType;
  /** Color stops (minimum 2) */
  colorStops: ColorStop[];
  /** Gradient angle in degrees (0-360, for linear gradients) */
  angle: number;
}

/**
 * Pattern fill configuration
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export interface PatternEffect {
  /** Enable pattern effect */
  enabled: boolean;
  /** Pattern image */
  image: HTMLImageElement | null;
  /** Pattern scale (0.1-2.0, representing 10%-200%) */
  scale: number;
}

/**
 * Combined text effects configuration
 * Requirement 7.1: Effects applied in order: fill, outline, shadow
 */
export interface TextEffects {
  /** Base fill color (used when gradient/pattern not enabled) */
  fillColor: string;
  /** Outline effect */
  outline: OutlineEffect;
  /** Gradient fill effect */
  gradient: GradientEffect;
  /** Pattern fill effect */
  pattern: PatternEffect;
}

/**
 * Text bounds for effect rendering
 */
export interface TextEffectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * TextEffectsRenderer class for applying text effects
 */
export class TextEffectsRenderer {
  /**
   * Apply outline effect to text
   * Requirements: 4.1, 4.2, 4.3, 4.4
   * Requirement 7.1: Outline rendered before fill
   */
  static applyOutline(
    ctx: CanvasRenderingContext2D,
    outline: OutlineEffect
  ): void {
    if (!outline.enabled) {
      return;
    }

    // Requirement 4.2: Adjust outline width (1-10px)
    ctx.lineWidth = Math.max(1, Math.min(10, outline.width));
    // Requirement 4.3: Apply outline color
    ctx.strokeStyle = outline.color;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
  }

  /**
   * Create gradient fill for text
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  static createGradient(
    ctx: CanvasRenderingContext2D,
    gradient: GradientEffect,
    bounds: TextEffectBounds
  ): CanvasGradient | null {
    if (!gradient.enabled || gradient.colorStops.length < 2) {
      return null;
    }

    let canvasGradient: CanvasGradient;

    // Requirement 5.2: Support linear and radial gradients
    if (gradient.type === 'linear') {
      // Requirement 5.4: Adjust gradient angle (0-360 degrees)
      const angleRad = (gradient.angle * Math.PI) / 180;
      
      // Calculate gradient line endpoints based on angle
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const length = Math.max(bounds.width, bounds.height);
      
      const x1 = centerX - (Math.cos(angleRad) * length) / 2;
      const y1 = centerY - (Math.sin(angleRad) * length) / 2;
      const x2 = centerX + (Math.cos(angleRad) * length) / 2;
      const y2 = centerY + (Math.sin(angleRad) * length) / 2;
      
      canvasGradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      // Radial gradient
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const radius = Math.max(bounds.width, bounds.height) / 2;
      
      canvasGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
    }

    // Requirement 5.3: Add color stops with adjustable positions
    gradient.colorStops.forEach(stop => {
      const position = Math.max(0, Math.min(1, stop.position));
      canvasGradient.addColorStop(position, stop.color);
    });

    return canvasGradient;
  }

  /**
   * Create pattern fill for text
   * Requirements: 6.1, 6.2, 6.3, 6.4
   */
  static createPattern(
    ctx: CanvasRenderingContext2D,
    pattern: PatternEffect
  ): CanvasPattern | null {
    // Requirement 6.1, 6.2: Validate pattern image
    if (!pattern.enabled || !pattern.image) {
      return null;
    }

    // Requirement 6.4: Adjust pattern scale (10%-200%)
    const scale = Math.max(0.1, Math.min(2.0, pattern.scale));
    
    // Create a temporary canvas for scaled pattern
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    if (!patternCtx) {
      return null;
    }

    // Scale the pattern image
    patternCanvas.width = pattern.image.width * scale;
    patternCanvas.height = pattern.image.height * scale;
    
    patternCtx.drawImage(
      pattern.image,
      0, 0,
      patternCanvas.width,
      patternCanvas.height
    );

    // Requirement 6.3: Create repeating pattern
    const canvasPattern = ctx.createPattern(patternCanvas, 'repeat');
    
    return canvasPattern;
  }

  /**
   * Apply fill effect (solid color, gradient, or pattern)
   * Requirement 7.1: Fill rendered after outline
   */
  static applyFill(
    ctx: CanvasRenderingContext2D,
    effects: TextEffects,
    bounds: TextEffectBounds
  ): void {
    // Priority: pattern > gradient > solid color
    if (effects.pattern.enabled && effects.pattern.image) {
      const pattern = this.createPattern(ctx, effects.pattern);
      if (pattern) {
        ctx.fillStyle = pattern;
        return;
      }
    }

    if (effects.gradient.enabled && effects.gradient.colorStops.length >= 2) {
      const gradient = this.createGradient(ctx, effects.gradient, bounds);
      if (gradient) {
        ctx.fillStyle = gradient;
        return;
      }
    }

    // Default to solid fill color
    ctx.fillStyle = effects.fillColor;
  }

  /**
   * Render text with all effects applied
   * Requirements: 7.1, 7.2, 7.3, 7.5
   * Requirement 7.1: Apply effects in correct order (fill, outline, shadow)
   */
  static renderTextWithEffects(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    effects: TextEffects,
    bounds: TextEffectBounds
  ): void {
    // Save context state
    ctx.save();

    // Requirement 7.1, 4.4: Render outline before fill
    if (effects.outline.enabled) {
      this.applyOutline(ctx, effects.outline);
      ctx.strokeText(text, x, y);
    }

    // Apply fill (gradient, pattern, or solid color)
    this.applyFill(ctx, effects, bounds);
    ctx.fillText(text, x, y);

    // Restore context state
    ctx.restore();
  }

  /**
   * Calculate text bounds for effect rendering
   */
  static calculateTextBounds(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fontSize: number
  ): TextEffectBounds {
    const metrics = ctx.measureText(text);
    const width = metrics.width;
    const height = fontSize;

    return {
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
    };
  }

  /**
   * Validate effect configuration
   * Ensures all effect parameters are within valid ranges
   */
  static validateEffects(effects: TextEffects): TextEffects {
    return {
      fillColor: effects.fillColor,
      outline: {
        enabled: effects.outline.enabled,
        width: isNaN(effects.outline.width) ? 2 : Math.max(1, Math.min(10, effects.outline.width)),
        color: effects.outline.color,
      },
      gradient: {
        enabled: effects.gradient.enabled,
        type: effects.gradient.type,
        colorStops: effects.gradient.colorStops.map(stop => ({
          color: stop.color,
          position: isNaN(stop.position) ? 0 : Math.max(0, Math.min(1, stop.position)),
        })),
        angle: isNaN(effects.gradient.angle) ? 0 : ((effects.gradient.angle % 360) + 360) % 360, // Normalize to 0-360
      },
      pattern: {
        enabled: effects.pattern.enabled,
        image: effects.pattern.image,
        scale: isNaN(effects.pattern.scale) ? 1.0 : Math.max(0.1, Math.min(2.0, effects.pattern.scale)),
      },
    };
  }
}

/**
 * Create default text effects configuration
 */
export function createDefaultEffects(): TextEffects {
  return {
    fillColor: '#000000',
    outline: {
      enabled: false,
      width: 2,
      color: '#ffffff',
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
  };
}
