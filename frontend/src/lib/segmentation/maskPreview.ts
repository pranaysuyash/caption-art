/**
 * Mask Preview Utilities
 * 
 * Provides visualization utilities for mask preview in different modes:
 * - Overlay: Show mask as colored overlay on original
 * - Side-by-side: Original on left, mask on right
 * - Checkerboard: Mask on transparent checkerboard background
 */

/**
 * Options for preview rendering
 */
export interface PreviewOptions {
  mode: 'overlay' | 'side-by-side' | 'checkerboard';
  opacity: number;
  colorize: boolean;
}

/**
 * MaskPreview class provides static methods for rendering mask visualizations
 */
export class MaskPreview {
  /**
   * Render mask as colored overlay on original image
   * 
   * @param canvas - Target canvas element
   * @param originalImage - Original image
   * @param maskImage - Mask image with alpha channel
   * @param options - Preview options
   */
  static renderOverlay(
    canvas: HTMLCanvasElement,
    originalImage: HTMLImageElement,
    maskImage: HTMLImageElement,
    options: PreviewOptions
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas dimensions to match original image
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    // Draw original image
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // Create temporary canvas for mask processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      throw new Error('Failed to get temporary canvas context');
    }

    // Draw mask to temporary canvas
    tempCtx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
    
    // Extract alpha from mask and colorize if requested
    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    
    if (options.colorize) {
      // Colorize: red for subject, transparent for background
      for (let i = 0; i < imageData.data.length; i += 4) {
        const alpha = imageData.data[i + 3];
        imageData.data[i] = 255;     // R
        imageData.data[i + 1] = 0;   // G
        imageData.data[i + 2] = 0;   // B
        imageData.data[i + 3] = alpha;
      }
    }
    
    tempCtx.putImageData(imageData, 0, 0);

    // Draw mask overlay with opacity
    ctx.globalAlpha = options.opacity;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Reset context state
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Render original and mask side-by-side
   * 
   * @param canvas - Target canvas element
   * @param originalImage - Original image
   * @param maskImage - Mask image with alpha channel
   */
  static renderSideBySide(
    canvas: HTMLCanvasElement,
    originalImage: HTMLImageElement,
    maskImage: HTMLImageElement
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas dimensions to fit both images side by side
    canvas.width = originalImage.width * 2;
    canvas.height = originalImage.height;

    // Draw original on left half
    ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);

    // Draw mask on right half
    ctx.drawImage(
      maskImage,
      originalImage.width,
      0,
      originalImage.width,
      originalImage.height
    );
  }

  /**
   * Render mask on checkerboard background
   * 
   * @param canvas - Target canvas element
   * @param maskImage - Mask image with alpha channel
   */
  static renderCheckerboard(
    canvas: HTMLCanvasElement,
    maskImage: HTMLImageElement
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas dimensions to match mask
    canvas.width = maskImage.width;
    canvas.height = maskImage.height;

    // Create checkerboard pattern
    const checkerSize = 10; // Size of each checker square
    const lightColor = '#ffffff';
    const darkColor = '#cccccc';

    for (let y = 0; y < canvas.height; y += checkerSize) {
      for (let x = 0; x < canvas.width; x += checkerSize) {
        // Alternate colors in checkerboard pattern
        const isLight = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0;
        ctx.fillStyle = isLight ? lightColor : darkColor;
        ctx.fillRect(x, y, checkerSize, checkerSize);
      }
    }

    // Draw mask with transparency on top of checkerboard
    ctx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
  }
}
