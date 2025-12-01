/**
 * TransformController manages text position, scale, and rotation transformations
 * for the Canvas Text Compositing Engine.
 */

import { Transform } from './types';

/**
 * Controller for managing and applying canvas transformations
 */
export class TransformController {
  private transform: Transform;

  /**
   * Creates a new TransformController with initial transform values
   * @param initialTransform - Initial transform configuration
   */
  constructor(initialTransform: Transform) {
    this.transform = { ...initialTransform };
    this.normalizeTransform();
  }

  /**
   * Sets the position of the text
   * Normalizes coordinates to 0-1 range
   * @param x - X coordinate (will be clamped to 0-1)
   * @param y - Y coordinate (will be clamped to 0-1)
   */
  setPosition(x: number, y: number): void {
    this.transform.x = Math.max(0, Math.min(1, x));
    this.transform.y = Math.max(0, Math.min(1, y));
  }

  /**
   * Sets the scale factor for the text
   * Clamps scale to valid range (0.5-3.0)
   * @param scale - Scale factor (will be clamped to 0.5-3.0)
   */
  setScale(scale: number): void {
    this.transform.scale = Math.max(0.5, Math.min(3.0, scale));
  }

  /**
   * Sets the rotation angle for the text
   * Normalizes rotation to 0-360 degree range
   * @param degrees - Rotation angle in degrees (will be normalized to 0-360)
   */
  setRotation(degrees: number): void {
    // Normalize to 0-360 range
    let normalized = degrees % 360;
    if (normalized < 0) {
      normalized += 360;
    }
    this.transform.rotation = normalized;
  }

  /**
   * Gets the current transform values
   * @returns A copy of the current transform
   */
  getTransform(): Transform {
    return { ...this.transform };
  }

  /**
   * Applies the current transform to a canvas context
   * Transformations are applied in order: translate → rotate → scale
   * @param ctx - Canvas 2D rendering context
   * @param canvasWidth - Width of the canvas in pixels
   * @param canvasHeight - Height of the canvas in pixels
   */
  applyToContext(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    // Convert normalized position to pixel coordinates
    const pixelX = this.transform.x * canvasWidth;
    const pixelY = this.transform.y * canvasHeight;

    // Apply transformations in order: translate → rotate → scale
    ctx.translate(pixelX, pixelY);
    ctx.rotate((this.transform.rotation * Math.PI) / 180);
    ctx.scale(this.transform.scale, this.transform.scale);
  }

  /**
   * Normalizes all transform values to their valid ranges
   * @private
   */
  private normalizeTransform(): void {
    this.setPosition(this.transform.x, this.transform.y);
    this.setScale(this.transform.scale);
    this.setRotation(this.transform.rotation);
  }
}
