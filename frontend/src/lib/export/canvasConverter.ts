/**
 * Canvas Converter
 * Converts HTML5 Canvas to various image formats with scaling support
 */

export interface ConversionOptions {
  format: 'png' | 'jpeg'
  quality?: number // 0-1 for JPEG
  maxDimension?: number
}

export class CanvasConverter {
  /**
   * Convert canvas to data URL
   * @param canvas - The canvas element to convert
   * @param options - Conversion options
   * @returns Data URL string
   */
  static toDataURL(
    canvas: HTMLCanvasElement,
    options: ConversionOptions
  ): string {
    // Validate format (9.5)
    const validFormat = this.validateFormat(options.format);
    
    // Clamp quality to valid range (9.5)
    const quality = this.clampQuality(options.quality ?? 0.92);
    
    const { maxDimension } = options;

    try {
      // Scale canvas if needed
      const processedCanvas = maxDimension
        ? this.scaleCanvas(canvas, maxDimension)
        : canvas;

      // Convert based on format (9.2)
      if (validFormat === 'png') {
        return processedCanvas.toDataURL('image/png');
      } else {
        return processedCanvas.toDataURL('image/jpeg', quality);
      }
    } catch (error) {
      // Handle conversion errors (9.2)
      if (error instanceof Error) {
        if (error.message.includes('tainted') || error.message.includes('cross-origin')) {
          throw new Error('Failed to generate image. Canvas contains cross-origin data.');
        }
        if (error.message.includes('memory') || error.message.includes('allocation')) {
          throw new Error('Image too large to export. Try reducing size.');
        }
      }
      throw new Error('Failed to generate image. Please try again.');
    }
  }

  /**
   * Convert canvas to Blob
   * @param canvas - The canvas element to convert
   * @param options - Conversion options
   * @returns Promise resolving to Blob
   */
  static async toBlob(
    canvas: HTMLCanvasElement,
    options: ConversionOptions
  ): Promise<Blob> {
    // Validate format (9.5)
    const validFormat = this.validateFormat(options.format);
    
    // Clamp quality to valid range (9.5)
    const quality = this.clampQuality(options.quality ?? 0.92);
    
    const { maxDimension } = options;

    try {
      // Scale canvas if needed
      const processedCanvas = maxDimension
        ? this.scaleCanvas(canvas, maxDimension)
        : canvas;

      return new Promise<Blob>((resolve, reject) => {
        const mimeType = validFormat === 'png' ? 'image/png' : 'image/jpeg';
        const qualityParam = validFormat === 'jpeg' ? quality : undefined;

        processedCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fall back to toDataURL method (9.2)
              try {
                const dataUrl = this.toDataURL(canvas, { format: validFormat, quality, maxDimension });
                const blobFromDataUrl = this.dataUrlToBlob(dataUrl);
                resolve(blobFromDataUrl);
              } catch (fallbackError) {
                reject(new Error('Failed to convert canvas to blob'));
              }
            }
          },
          mimeType,
          qualityParam
        );
      });
    } catch (error) {
      // Handle conversion errors (9.2)
      if (error instanceof Error) {
        if (error.message.includes('tainted') || error.message.includes('cross-origin')) {
          throw new Error('Failed to generate image. Canvas contains cross-origin data.');
        }
        if (error.message.includes('memory') || error.message.includes('allocation')) {
          throw new Error('Image too large to export. Try reducing size.');
        }
      }
      throw new Error('Failed to generate image. Please try again.');
    }
  }

  /**
   * Scale canvas to fit within maximum dimension while preserving aspect ratio
   * @param canvas - The canvas to scale
   * @param maxDimension - Maximum width or height
   * @returns Scaled canvas or original if no scaling needed
   */
  static scaleCanvas(
    canvas: HTMLCanvasElement,
    maxDimension: number
  ): HTMLCanvasElement {
    const { width, height } = canvas;

    // Check for memory issues with very large canvases (9.3)
    // Only check BEFORE scaling - after scaling it will be within limits
    const pixelCount = width * height;
    const maxPixels = 33554432; // 8192 x 4096, reasonable limit for modern browsers
    
    if (pixelCount > maxPixels) {
      throw new Error('Image too large to export. Try reducing size.');
    }

    // Check if scaling needed
    if (width <= maxDimension && height <= maxDimension) {
      return canvas;
    }

    // Calculate new dimensions while preserving aspect ratio
    let newWidth: number;
    let newHeight: number;
    
    if (width > height) {
      // Width is the limiting dimension
      newWidth = maxDimension;
      newHeight = Math.round((height / width) * maxDimension);
    } else {
      // Height is the limiting dimension
      newHeight = maxDimension;
      newWidth = Math.round((width / height) * maxDimension);
    }

    try {
      // Create scaled canvas
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = newWidth;
      scaledCanvas.height = newHeight;

      const ctx = scaledCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas error. Please refresh and try again.');
      }

      // Use high quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw scaled image
      ctx.drawImage(canvas, 0, 0, newWidth, newHeight);

      return scaledCanvas;
    } catch (error) {
      // Handle memory errors during scaling (9.3)
      if (error instanceof Error) {
        if (error.message.includes('memory') || error.message.includes('allocation')) {
          throw new Error('Image too large to export. Try reducing size.');
        }
        if (error.message.includes('context')) {
          throw error; // Re-throw context errors
        }
      }
      throw new Error('Failed to scale image. Please try again.');
    }
  }

  /**
   * Validate and normalize format
   * Falls back to PNG if invalid (9.5)
   * @param format - Format to validate
   * @returns Valid format
   */
  private static validateFormat(format: string): 'png' | 'jpeg' {
    if (format === 'png' || format === 'jpeg') {
      return format;
    }
    
    console.warn(`Unsupported format "${format}". Using PNG.`);
    return 'png';
  }

  /**
   * Clamp quality to valid range (0.5-1.0)
   * @param quality - Quality value to clamp
   * @returns Clamped quality
   */
  private static clampQuality(quality: number): number {
    const clamped = Math.max(0.5, Math.min(1.0, quality));
    
    if (clamped !== quality) {
      console.warn(`Quality ${quality} out of range. Clamped to ${clamped}.`);
    }
    
    return clamped;
  }

  /**
   * Convert data URL to Blob
   * Helper for fallback conversion
   * @param dataUrl - Data URL to convert
   * @returns Blob
   */
  private static dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    
    return new Blob([u8arr], { type: mime });
  }
}
