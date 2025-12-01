/**
 * LayerManager - Manages compositing of multiple canvas layers
 * Handles background, text, and mask layers with proper blend modes
 */

/**
 * Layer type definition
 */
export interface Layer {
  /** Type of layer */
  type: 'background' | 'text' | 'mask';
  /** Canvas element containing the layer content */
  canvas: HTMLCanvasElement;
  /** Optional blend mode for compositing */
  blendMode?: GlobalCompositeOperation;
}

/**
 * LayerManager class for managing and compositing canvas layers
 */
export class LayerManager {
  private layers: Map<Layer['type'], Layer>;

  constructor() {
    this.layers = new Map();
  }

  /**
   * Add a layer to the manager
   * @param layer - Layer to add
   */
  addLayer(layer: Layer): void {
    this.layers.set(layer.type, layer);
  }

  /**
   * Remove a layer from the manager
   * @param type - Type of layer to remove
   */
  removeLayer(type: Layer['type']): void {
    this.layers.delete(type);
  }

  /**
   * Clear all layers from the manager
   */
  clear(): void {
    this.layers.clear();
  }

  /**
   * Composite all layers onto the target canvas
   * Layers are composited in order: background → text → mask
   * @param targetCanvas - Canvas to composite layers onto
   */
  composite(targetCanvas: HTMLCanvasElement): void {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from target canvas');
    }

    // Clear the target canvas
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    // Step 1: Draw background layer
    const backgroundLayer = this.layers.get('background');
    if (backgroundLayer) {
      ctx.save();
      if (backgroundLayer.blendMode) {
        ctx.globalCompositeOperation = backgroundLayer.blendMode;
      }
      ctx.drawImage(backgroundLayer.canvas, 0, 0);
      ctx.restore();
    }

    // Step 2: Draw text layer
    const textLayer = this.layers.get('text');
    if (textLayer) {
      ctx.save();
      if (textLayer.blendMode) {
        ctx.globalCompositeOperation = textLayer.blendMode;
      }
      ctx.drawImage(textLayer.canvas, 0, 0);
      ctx.restore();
    }

    // Step 3: Apply mask layer with destination-out blend mode
    // This cuts out the subject area, making text appear behind it
    const maskLayer = this.layers.get('mask');
    if (maskLayer) {
      ctx.save();
      // Use destination-out to cut out the subject
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(maskLayer.canvas, 0, 0);
      ctx.restore();
    }
  }
}
