/**
 * MaskingEngine - Advanced masking algorithms for text-behind-subject effects
 * Implements 6 different masking modes for creative text-image interactions
 * Requirements: 7.1-7.8
 */

export type MaskingMode =
  | 'full-behind'
  | 'weave-through'
  | 'horizontal-split'
  | 'vertical-split'
  | 'character-by-character'
  | 'partial-overlap';

export interface MaskingConfig {
  /** Masking mode to apply */
  mode: MaskingMode;
  /** Threshold for split modes (0-1, default: 0.5) */
  threshold?: number;
  /** Number of bands for weave-through mode (default: 5) */
  bandCount?: number;
  /** Overlap percentage for partial-overlap mode (0-1, default: 0.3) */
  overlapAmount?: number;
}

export interface MaskingResult {
  /** Resulting canvas with masked text */
  canvas: HTMLCanvasElement;
  /** Preview thumbnail for mode selector */
  thumbnail?: HTMLCanvasElement;
}

/**
 * MaskingEngine class - applies advanced masking algorithms to text layers
 */
export class MaskingEngine {
  private static instance: MaskingEngine;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): MaskingEngine {
    if (!MaskingEngine.instance) {
      MaskingEngine.instance = new MaskingEngine();
    }
    return MaskingEngine.instance;
  }

  /**
   * Apply masking to text layer based on configuration
   * @param textCanvas - Canvas containing rendered text
   * @param maskCanvas - Canvas containing subject mask
   * @param config - Masking configuration
   * @returns Masked text canvas
   */
  applyMask(
    textCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement,
    config: MaskingConfig
  ): HTMLCanvasElement {
    // Validate inputs
    if (!textCanvas || !maskCanvas) {
      throw new Error('Text canvas and mask canvas are required');
    }

    if (textCanvas.width !== maskCanvas.width || textCanvas.height !== maskCanvas.height) {
      throw new Error('Text and mask canvases must have the same dimensions');
    }

    // Apply the appropriate masking algorithm
    switch (config.mode) {
      case 'full-behind':
        return this.applyFullBehind(textCanvas, maskCanvas);
      case 'weave-through':
        return this.applyWeaveThrough(textCanvas, maskCanvas, config.bandCount ?? 5);
      case 'horizontal-split':
        return this.applyHorizontalSplit(textCanvas, maskCanvas, config.threshold ?? 0.5);
      case 'vertical-split':
        return this.applyVerticalSplit(textCanvas, maskCanvas, config.threshold ?? 0.5);
      case 'character-by-character':
        return this.applyCharacterByCharacter(textCanvas, maskCanvas);
      case 'partial-overlap':
        return this.applyPartialOverlap(textCanvas, maskCanvas, config.overlapAmount ?? 0.3);
      default:
        throw new Error(`Unknown masking mode: ${config.mode}`);
    }
  }

  /**
   * Generate preview thumbnail for a masking mode
   * @param textCanvas - Canvas containing rendered text
   * @param maskCanvas - Canvas containing subject mask
   * @param config - Masking configuration
   * @param thumbnailSize - Size of thumbnail (default: 120px)
   * @returns Thumbnail canvas
   */
  generatePreview(
    textCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement,
    config: MaskingConfig,
    thumbnailSize: number = 120
  ): HTMLCanvasElement {
    // Apply masking
    const maskedCanvas = this.applyMask(textCanvas, maskCanvas, config);

    // Create thumbnail
    const thumbnail = document.createElement('canvas');
    thumbnail.width = thumbnailSize;
    thumbnail.height = thumbnailSize;

    const ctx = thumbnail.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for thumbnail');
    }

    // Calculate scale to fit
    const scale = Math.min(
      thumbnailSize / maskedCanvas.width,
      thumbnailSize / maskedCanvas.height
    );

    const scaledWidth = maskedCanvas.width * scale;
    const scaledHeight = maskedCanvas.height * scale;

    // Center in thumbnail
    const offsetX = (thumbnailSize - scaledWidth) / 2;
    const offsetY = (thumbnailSize - scaledHeight) / 2;

    // Draw scaled masked canvas
    ctx.drawImage(maskedCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

    return thumbnail;
  }

  /**
   * Full-behind masking: All text behind subject
   * Requirement: 7.2
   * For each text pixel, if mask alpha > 0, set text alpha = 0
   */
  private applyFullBehind(
    textCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement
  ): HTMLCanvasElement {
    const result = document.createElement('canvas');
    result.width = textCanvas.width;
    result.height = textCanvas.height;

    const ctx = result.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Get image data
    const textCtx = textCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!textCtx || !maskCtx) {
      throw new Error('Failed to get 2D contexts');
    }

    const textData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const pixels = textData.data;
    const maskPixels = maskData.data;

    // For each pixel, if mask alpha > 0, hide text
    for (let i = 0; i < pixels.length; i += 4) {
      const maskAlpha = maskPixels[i + 3];

      if (maskAlpha > 0) {
        // Subject is present - hide text
        pixels[i + 3] = 0;
      }
    }

    // Put modified image data
    ctx.putImageData(textData, 0, 0);

    return result;
  }

  /**
   * Weave-through masking: Alternate horizontal bands between behind and in front
   * Requirement: 7.3
   */
  private applyWeaveThrough(
    textCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement,
    bandCount: number
  ): HTMLCanvasElement {
    const result = document.createElement('canvas');
    result.width = textCanvas.width;
    result.height = textCanvas.height;

    const ctx = result.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Get image data
    const textCtx = textCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!textCtx || !maskCtx) {
      throw new Error('Failed to get 2D contexts');
    }

    const textData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const pixels = textData.data;
    const maskPixels = maskData.data;

    const bandHeight = textCanvas.height / bandCount;

    // For each pixel
    for (let y = 0; y < textCanvas.height; y++) {
      const bandIndex = Math.floor(y / bandHeight);
      const isBehind = bandIndex % 2 === 0;

      for (let x = 0; x < textCanvas.width; x++) {
        const i = (y * textCanvas.width + x) * 4;
        const maskAlpha = maskPixels[i + 3];

        if (isBehind && maskAlpha > 0) {
          // This band is behind - hide text where subject is present
          pixels[i + 3] = 0;
        }
        // If not behind, text stays visible (in front)
      }
    }

    // Put modified image data
    ctx.putImageData(textData, 0, 0);

    return result;
  }

  /**
   * Horizontal-split masking: Text behind subject only below threshold
   * Requirement: 7.4
   */
  private applyHorizontalSplit(
    textCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement,
    threshold: number
  ): HTMLCanvasElement {
    const result = document.createElement('canvas');
    result.width = textCanvas.width;
    result.height = textCanvas.height;

    const ctx = result.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Get image data
    const textCtx = textCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!textCtx || !maskCtx) {
      throw new Error('Failed to get 2D contexts');
    }

    const textData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const pixels = textData.data;
    const maskPixels = maskData.data;

    const splitY = textCanvas.height * threshold;

    // For each pixel
    for (let y = 0; y < textCanvas.height; y++) {
      const applyMask = y >= splitY; // Only apply mask below threshold

      for (let x = 0; x < textCanvas.width; x++) {
        const i = (y * textCanvas.width + x) * 4;
        const maskAlpha = maskPixels[i + 3];

        if (applyMask && maskAlpha > 0) {
          // Below threshold - hide text where subject is present
          pixels[i + 3] = 0;
        }
        // Above threshold, text stays visible
      }
    }

    // Put modified image data
    ctx.putImageData(textData, 0, 0);

    return result;
  }

  /**
   * Vertical-split masking: Text behind subject only to one side of threshold
   * Requirement: 7.5
   */
  private applyVerticalSplit(
    textCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement,
    threshold: number
  ): HTMLCanvasElement {
    const result = document.createElement('canvas');
    result.width = textCanvas.width;
    result.height = textCanvas.height;

    const ctx = result.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Get image data
    const textCtx = textCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!textCtx || !maskCtx) {
      throw new Error('Failed to get 2D contexts');
    }

    const textData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const pixels = textData.data;
    const maskPixels = maskData.data;

    const splitX = textCanvas.width * threshold;

    // For each pixel
    for (let y = 0; y < textCanvas.height; y++) {
      for (let x = 0; x < textCanvas.width; x++) {
        const i = (y * textCanvas.width + x) * 4;
        const maskAlpha = maskPixels[i + 3];

        const applyMask = x >= splitX; // Only apply mask to the right of threshold

        if (applyMask && maskAlpha > 0) {
          // Right of threshold - hide text where subject is present
          pixels[i + 3] = 0;
        }
        // Left of threshold, text stays visible
      }
    }

    // Put modified image data
    ctx.putImageData(textData, 0, 0);

    return result;
  }

  /**
   * Character-by-character masking: Apply masking independently to each character
   * Requirement: 7.6
   * Note: This is a simplified implementation that treats the text as a whole
   * A full implementation would require re-rendering each character separately
   */
  private applyCharacterByCharacter(
    textCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement
  ): HTMLCanvasElement {
    // For now, use a gradient-based approach that creates a character-like effect
    // A full implementation would require access to the original text and font info
    const result = document.createElement('canvas');
    result.width = textCanvas.width;
    result.height = textCanvas.height;

    const ctx = result.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Get image data
    const textCtx = textCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!textCtx || !maskCtx) {
      throw new Error('Failed to get 2D contexts');
    }

    const textData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const pixels = textData.data;
    const maskPixels = maskData.data;

    // Detect character boundaries by finding vertical gaps in text
    const charBoundaries = this.detectCharacterBoundaries(textData, textCanvas.width, textCanvas.height);

    // Apply masking with alternating pattern per character
    for (let y = 0; y < textCanvas.height; y++) {
      for (let x = 0; x < textCanvas.width; x++) {
        const i = (y * textCanvas.width + x) * 4;
        const maskAlpha = maskPixels[i + 3];
        const textAlpha = pixels[i + 3];

        if (textAlpha === 0) continue; // Skip transparent pixels

        // Find which character this pixel belongs to
        const charIndex = charBoundaries.findIndex((boundary, idx) => {
          const nextBoundary = charBoundaries[idx + 1] ?? textCanvas.width;
          return x >= boundary && x < nextBoundary;
        });

        // Alternate masking per character
        const applyMask = charIndex % 2 === 0;

        if (applyMask && maskAlpha > 0) {
          pixels[i + 3] = 0;
        }
      }
    }

    // Put modified image data
    ctx.putImageData(textData, 0, 0);

    return result;
  }

  /**
   * Detect character boundaries in text by finding vertical gaps
   * @private
   */
  private detectCharacterBoundaries(
    imageData: ImageData,
    width: number,
    height: number
  ): number[] {
    const boundaries: number[] = [0];
    const pixels = imageData.data;

    let inCharacter = false;

    for (let x = 0; x < width; x++) {
      let hasPixel = false;

      // Check if this column has any text pixels
      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 4;
        if (pixels[i + 3] > 0) {
          hasPixel = true;
          break;
        }
      }

      // Detect transitions
      if (hasPixel && !inCharacter) {
        // Start of character
        boundaries.push(x);
        inCharacter = true;
      } else if (!hasPixel && inCharacter) {
        // End of character
        inCharacter = false;
      }
    }

    return boundaries;
  }

  /**
   * Partial-overlap masking: Blend text and subject with partial transparency
   * Requirement: 7.1 (6th mode)
   */
  private applyPartialOverlap(
    textCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement,
    overlapAmount: number
  ): HTMLCanvasElement {
    const result = document.createElement('canvas');
    result.width = textCanvas.width;
    result.height = textCanvas.height;

    const ctx = result.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Get image data
    const textCtx = textCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!textCtx || !maskCtx) {
      throw new Error('Failed to get 2D contexts');
    }

    const textData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const pixels = textData.data;
    const maskPixels = maskData.data;

    // For each pixel, reduce text alpha based on mask presence and overlap amount
    for (let i = 0; i < pixels.length; i += 4) {
      const maskAlpha = maskPixels[i + 3];
      const textAlpha = pixels[i + 3];

      if (maskAlpha > 0 && textAlpha > 0) {
        // Subject is present - reduce text alpha by overlap amount
        const reduction = (maskAlpha / 255) * overlapAmount;
        pixels[i + 3] = Math.floor(textAlpha * (1 - reduction));
      }
    }

    // Put modified image data
    ctx.putImageData(textData, 0, 0);

    return result;
  }

  /**
   * Get all available masking modes with descriptions
   */
  static getModes(): Array<{ mode: MaskingMode; name: string; description: string }> {
    return [
      {
        mode: 'full-behind',
        name: 'Full Behind',
        description: 'All text appears behind the subject',
      },
      {
        mode: 'weave-through',
        name: 'Weave Through',
        description: 'Text alternates between behind and in front in horizontal bands',
      },
      {
        mode: 'horizontal-split',
        name: 'Horizontal Split',
        description: 'Text behind subject only below a horizontal line',
      },
      {
        mode: 'vertical-split',
        name: 'Vertical Split',
        description: 'Text behind subject only to one side of a vertical line',
      },
      {
        mode: 'character-by-character',
        name: 'Character by Character',
        description: 'Masking applied independently to each character',
      },
      {
        mode: 'partial-overlap',
        name: 'Partial Overlap',
        description: 'Text partially transparent where subject is present',
      },
    ];
  }
}
