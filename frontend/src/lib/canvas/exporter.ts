/**
 * Exporter - Converts canvas to downloadable image files
 * Handles PNG/JPEG export, watermarking, and browser downloads
 */

/**
 * Export options configuration
 */
export interface ExportOptions {
  /** Image format ('png' or 'jpeg') */
  format: 'png' | 'jpeg';
  /** Quality parameter for JPEG (0-1, default: 0.92) */
  quality?: number;
  /** Whether to apply watermark (for free tier) */
  watermark?: boolean;
  /** Watermark text to display */
  watermarkText?: string;
}

/**
 * Export error types
 */
export enum ExportErrorType {
  CANVAS_TO_BLOB_FAILED = 'CANVAS_TO_BLOB_FAILED',
  CANVAS_TO_DATA_URL_FAILED = 'CANVAS_TO_DATA_URL_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  WATERMARK_FAILED = 'WATERMARK_FAILED',
  INVALID_CANVAS = 'INVALID_CANVAS',
}

/**
 * Export error class
 */
export class ExportError extends Error {
  constructor(
    public type: ExportErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

/**
 * Exporter class - handles canvas-to-image conversion and downloads
 */
export class Exporter {
  /**
   * Export canvas to downloadable image file
   * Attempts multiple export methods if primary method fails
   * @param canvas - Canvas element to export
   * @param options - Export options
   * @throws {ExportError} If all export methods fail
   */
  static async export(canvas: HTMLCanvasElement, options: ExportOptions): Promise<void> {
    try {
      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new ExportError(
          ExportErrorType.INVALID_CANVAS,
          'Canvas is invalid or has zero dimensions'
        );
      }

      // Create a copy of the canvas if watermark is needed
      let exportCanvas = canvas;
      
      if (options.watermark && options.watermarkText) {
        try {
          exportCanvas = this.createCanvasWithWatermark(canvas, options.watermarkText);
        } catch (error) {
          console.warn('Watermark application failed, exporting without watermark:', error);
          // Continue with original canvas if watermark fails
          exportCanvas = canvas;
        }
      }

      // Generate filename
      const filename = this.generateFilename(options.format, options.watermark || false);

      // Try primary export method (toBlob - more reliable for large canvases)
      try {
        await this.exportViaBlob(exportCanvas, options, filename);
        return;
      } catch (blobError) {
        console.warn('Blob export failed, trying data URL method:', blobError);
      }

      // Fallback to data URL method
      try {
        await this.exportViaDataURL(exportCanvas, options, filename);
        return;
      } catch (dataUrlError) {
        console.error('Data URL export failed:', dataUrlError);
        throw new ExportError(
          ExportErrorType.CANVAS_TO_DATA_URL_FAILED,
          'All export methods failed. The image may be too large or the browser may have insufficient memory.',
          dataUrlError instanceof Error ? dataUrlError : undefined
        );
      }

    } catch (error) {
      console.error('Export failed:', error);
      
      if (error instanceof ExportError) {
        throw error;
      }
      
      throw new ExportError(
        ExportErrorType.CANVAS_TO_DATA_URL_FAILED,
        `Failed to export image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Export canvas using Blob API (preferred method)
   * @private
   */
  private static async exportViaBlob(
    canvas: HTMLCanvasElement,
    options: ExportOptions,
    filename: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const quality = options.format === 'jpeg' ? (options.quality || 0.92) : undefined;
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new ExportError(
                ExportErrorType.CANVAS_TO_BLOB_FAILED,
                'Canvas toBlob returned null'
              ));
              return;
            }
            
            try {
              // Create object URL from blob
              const url = URL.createObjectURL(blob);
              
              // Trigger download
              this.triggerDownloadFromURL(url, filename);
              
              // Clean up object URL after a delay
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              
              resolve();
            } catch (error) {
              reject(new ExportError(
                ExportErrorType.DOWNLOAD_FAILED,
                'Failed to trigger download from blob',
                error instanceof Error ? error : undefined
              ));
            }
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(new ExportError(
          ExportErrorType.CANVAS_TO_BLOB_FAILED,
          'Canvas toBlob failed',
          error instanceof Error ? error : undefined
        ));
      }
    });
  }
  
  /**
   * Export canvas using data URL (fallback method)
   * @private
   */
  private static async exportViaDataURL(
    canvas: HTMLCanvasElement,
    options: ExportOptions,
    filename: string
  ): Promise<void> {
    try {
      // Convert canvas to data URL
      const dataURL = this.canvasToDataURL(canvas, options.format, options.quality);

      // Trigger download
      this.triggerDownloadFromURL(dataURL, filename);
    } catch (error) {
      throw new ExportError(
        ExportErrorType.CANVAS_TO_DATA_URL_FAILED,
        'Failed to convert canvas to data URL',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create a copy of canvas with watermark applied
   * @param canvas - Original canvas
   * @param watermarkText - Text to use as watermark
   * @returns New canvas with watermark
   * @throws {ExportError} If watermark creation fails
   * @private
   */
  private static createCanvasWithWatermark(
    canvas: HTMLCanvasElement,
    watermarkText: string
  ): HTMLCanvasElement {
    try {
      // Create a new canvas with same dimensions
      const watermarkedCanvas = document.createElement('canvas');
      watermarkedCanvas.width = canvas.width;
      watermarkedCanvas.height = canvas.height;

      const ctx = watermarkedCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context for watermarked canvas');
      }

      // Draw original canvas content
      ctx.drawImage(canvas, 0, 0);

      // Apply watermark
      this.applyWatermark(watermarkedCanvas, watermarkText);

      return watermarkedCanvas;
    } catch (error) {
      throw new ExportError(
        ExportErrorType.WATERMARK_FAILED,
        'Failed to create watermarked canvas',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Apply watermark to canvas
   * @param canvas - Canvas to apply watermark to
   * @param text - Watermark text
   * @throws {ExportError} If watermark application fails
   */
  static applyWatermark(canvas: HTMLCanvasElement, text: string): void {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context for watermark');
      }

      // Calculate font size based on canvas dimensions (responsive sizing)
      const fontSize = Math.max(12, Math.min(24, canvas.width / 40));

      // Configure watermark style
      ctx.save();
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;

      // Measure text to calculate position
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      // Position at bottom-right with 20px padding
      const x = canvas.width - textWidth - 20;
      const y = canvas.height - 20;

      // Draw watermark with stroke for better visibility
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);

      ctx.restore();
    } catch (error) {
      throw new ExportError(
        ExportErrorType.WATERMARK_FAILED,
        'Failed to apply watermark',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Convert canvas to data URL
   * @param canvas - Canvas to convert
   * @param format - Image format
   * @param quality - Quality parameter for JPEG
   * @returns Data URL string
   * @throws {ExportError} If conversion fails
   * @private
   */
  private static canvasToDataURL(
    canvas: HTMLCanvasElement,
    format: 'png' | 'jpeg',
    quality?: number
  ): string {
    try {
      if (format === 'jpeg') {
        return canvas.toDataURL('image/jpeg', quality || 0.92);
      }
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Canvas to data URL conversion failed:', error);
      
      // Check for common error causes
      if (error instanceof Error) {
        if (error.message.includes('tainted') || error.message.includes('cross-origin')) {
          throw new ExportError(
            ExportErrorType.CANVAS_TO_DATA_URL_FAILED,
            'Canvas is tainted by cross-origin data. Cannot export.',
            error
          );
        }
        
        if (error.message.includes('memory') || error.message.includes('quota')) {
          throw new ExportError(
            ExportErrorType.CANVAS_TO_DATA_URL_FAILED,
            'Insufficient memory to export image. Try reducing image size.',
            error
          );
        }
      }
      
      throw new ExportError(
        ExportErrorType.CANVAS_TO_DATA_URL_FAILED,
        'Failed to convert canvas to image data',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate filename with timestamp
   * @param format - Image format
   * @param watermarked - Whether image is watermarked
   * @returns Generated filename
   */
  static generateFilename(format: string, watermarked: boolean): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const suffix = watermarked ? '-watermarked' : '';
    return `caption-art-${timestamp}${suffix}.${format}`;
  }

  /**
   * Trigger browser download from URL (data URL or blob URL)
   * @param url - URL to download from
   * @param filename - Filename for download
   * @throws {ExportError} If download trigger fails
   * @private
   */
  private static triggerDownloadFromURL(url: string, filename: string): void {
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

    } catch (error) {
      console.error('Download trigger failed:', error);
      throw new ExportError(
        ExportErrorType.DOWNLOAD_FAILED,
        'Failed to trigger download. Your browser may have blocked the download.',
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Get user-friendly error message for export errors
   * @param error - The error that occurred
   * @returns User-friendly error message
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof ExportError) {
      switch (error.type) {
        case ExportErrorType.INVALID_CANVAS:
          return 'Cannot export: No image to export or canvas is invalid.';
        case ExportErrorType.CANVAS_TO_BLOB_FAILED:
        case ExportErrorType.CANVAS_TO_DATA_URL_FAILED:
          if (error.message.includes('tainted') || error.message.includes('cross-origin')) {
            return 'Cannot export: Image contains cross-origin data.';
          }
          if (error.message.includes('memory') || error.message.includes('quota')) {
            return 'Cannot export: Image is too large. Try reducing the size.';
          }
          return 'Failed to convert image for export. Please try again.';
        case ExportErrorType.DOWNLOAD_FAILED:
          return 'Failed to download image. Please check your browser settings.';
        case ExportErrorType.WATERMARK_FAILED:
          return 'Failed to apply watermark. Exporting without watermark.';
        default:
          return error.message;
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'Failed to export image. Please try again.';
  }
}
