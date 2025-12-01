/**
 * Compositor - Main compositing engine for the Canvas Text Compositing Engine
 * Orchestrates rendering of background, text, and mask layers
 */

import { LayerManager, Layer } from './layerManager';
import { TextRenderer, type AdvancedTextLayer } from './textRenderer';
import { TransformController } from './transformController';
import type { TextLayer, Transform } from './types';
import {
  imageToGrayscale,
  calculateGradientMagnitude,
  scoreGridCells,
  findContiguousRegions,
} from './autoPlacement';

/**
 * Configuration for the Compositor
 */
export interface CompositorConfig {
  /** Canvas element to render to */
  canvas: HTMLCanvasElement;
  /** Background image element (can be HTMLImageElement or HTMLCanvasElement) */
  backgroundImage: HTMLImageElement | HTMLCanvasElement;
  /** Optional mask image for text-behind effect (can be HTMLImageElement or HTMLCanvasElement) */
  maskImage?: HTMLImageElement | HTMLCanvasElement;
  /** Whether text-behind effect is enabled (default: true) */
  textBehindEnabled?: boolean;
  /** Maximum dimension for scaling (default: 1080px) */
  maxDimension: number;
}

/**
 * Compositor class - orchestrates the rendering of all layers onto the canvas
 */
export class Compositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private backgroundImage: HTMLImageElement | HTMLCanvasElement;
  private maskImage?: HTMLImageElement | HTMLCanvasElement;
  private textBehindEnabled: boolean;
  private maxDimension: number;
  private layerManager: LayerManager;
  private scaleFactor: number;
  
  // Layer caching for performance - Requirements: 8.3
  private cachedBackgroundLayer: HTMLCanvasElement | null = null;
  private cachedMaskLayer: HTMLCanvasElement | null = null;
  private cachedTextLayer: HTMLCanvasElement | null = null;
  private lastTextLayerKey: string | null = null; // Cache key for text layer
  
  // Render cancellation token to prevent race conditions
  private renderToken: number = 0;
  
  // Previous state for fallback on error
  private lastSuccessfulRender: {
    textLayer: TextLayer | null;
    canvasData: ImageData | null;
  } = {
    textLayer: null,
    canvasData: null,
  };

  /**
   * Creates a new Compositor instance
   * @param config - Compositor configuration
   * @throws {Error} If canvas context cannot be obtained or images are invalid
   */
  constructor(config: CompositorConfig) {
    // Validate canvas
    if (!config.canvas) {
      throw new Error('Canvas element is required');
    }
    
    // Validate background image
    if (!config.backgroundImage) {
      throw new Error('Background image is required');
    }
    
    // Check if background image is loaded (handle both HTMLImageElement and HTMLCanvasElement)
    const isCanvas = config.backgroundImage instanceof HTMLCanvasElement;
    const isImage = config.backgroundImage instanceof HTMLImageElement;
    
    if (!isCanvas && !isImage) {
      throw new Error('Background image must be an HTMLImageElement or HTMLCanvasElement');
    }
    
    if (isImage && (!config.backgroundImage.complete || config.backgroundImage.naturalWidth === 0)) {
      throw new Error('Background image is not loaded or is invalid');
    }
    
    if (isCanvas && (config.backgroundImage.width === 0 || config.backgroundImage.height === 0)) {
      throw new Error('Background canvas has invalid dimensions');
    }
    
    // Validate mask image if provided
    if (config.maskImage) {
      const isMaskCanvas = config.maskImage instanceof HTMLCanvasElement;
      const isMaskImage = config.maskImage instanceof HTMLImageElement;
      
      if (!isMaskCanvas && !isMaskImage) {
        throw new Error('Mask image must be an HTMLImageElement or HTMLCanvasElement');
      }
      
      if (isMaskImage && (!config.maskImage.complete || config.maskImage.naturalWidth === 0)) {
        throw new Error('Mask image is not loaded or is invalid');
      }
      
      if (isMaskCanvas && (config.maskImage.width === 0 || config.maskImage.height === 0)) {
        throw new Error('Mask canvas has invalid dimensions');
      }
    }
    
    this.canvas = config.canvas;
    this.backgroundImage = config.backgroundImage;
    this.maskImage = config.maskImage;
    this.textBehindEnabled = config.textBehindEnabled ?? true;
    this.maxDimension = config.maxDimension;
    this.layerManager = new LayerManager();

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;

    // Calculate scale factor for viewport
    this.scaleFactor = this.calculateScaleFactor();
    
    // Set canvas dimensions based on scaled image size
    this.updateCanvasDimensions();
  }

  /**
   * Calculate scale factor based on maxDimension
   * @private
   */
  private calculateScaleFactor(): number {
    const imgWidth = this.backgroundImage.width;
    const imgHeight = this.backgroundImage.height;
    const maxDim = Math.max(imgWidth, imgHeight);

    if (maxDim > this.maxDimension) {
      return this.maxDimension / maxDim;
    }

    return 1;
  }

  /**
   * Update canvas dimensions based on scaled image size
   * @private
   */
  private updateCanvasDimensions(): void {
    // Use Math.round to ensure consistent rounding and better aspect ratio preservation
    this.canvas.width = Math.round(this.backgroundImage.width * this.scaleFactor);
    this.canvas.height = Math.round(this.backgroundImage.height * this.scaleFactor);
  }

  /**
   * Render the complete composition with text layer
   * Uses cached layers when possible for performance - Requirements: 8.3
   * Implements cancellation token to prevent race conditions
   * Falls back to previous state on error
   * @param textLayer - Text layer configuration
   * @throws {Error} If rendering fails and no previous state is available
   */
  render(textLayer: TextLayer): void {
    // Increment render token to cancel any in-progress renders
    const currentToken = ++this.renderToken;
    
    try {
      // Save current canvas state before clearing (for fallback)
      const canvasBackup = this.saveCanvasState();
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Clear layer manager
      this.layerManager.clear();

      // Use cached background layer or create new one
      let backgroundCanvas = this.cachedBackgroundLayer;
      if (!backgroundCanvas) {
        backgroundCanvas = this.createBackgroundLayer();
        this.cachedBackgroundLayer = backgroundCanvas;
      }
      this.layerManager.addLayer({
        type: 'background',
        canvas: backgroundCanvas,
      });

      // Create text layer if text is provided
      // Cache text layer when possible - Requirements: 8.3
      if (textLayer.text.trim()) {
        // Generate cache key from text layer properties
        const textLayerKey = this.generateTextLayerKey(textLayer);
        
        // Use cached text layer if available and unchanged
        let textCanvas = this.cachedTextLayer;
        if (!textCanvas || this.lastTextLayerKey !== textLayerKey) {
          textCanvas = this.createTextLayer(textLayer);
          this.cachedTextLayer = textCanvas;
          this.lastTextLayerKey = textLayerKey;
        }
        
        this.layerManager.addLayer({
          type: 'text',
          canvas: textCanvas,
        });
      }

      // Use cached mask layer or create new one if available and text-behind effect is enabled
      // Requirements: 1.5, 8.1, 8.2, 8.3, 8.5
      if (this.maskImage && this.textBehindEnabled) {
        let maskCanvas = this.cachedMaskLayer;
        if (!maskCanvas) {
          maskCanvas = this.createMaskLayer();
          this.cachedMaskLayer = maskCanvas;
        }
        this.layerManager.addLayer({
          type: 'mask',
          canvas: maskCanvas,
        });
      }

      // Check if this render was cancelled by a newer render call
      if (currentToken !== this.renderToken) {
        // Restore canvas state if cancelled
        if (canvasBackup) {
          this.restoreCanvasState(canvasBackup);
        }
        return; // Cancelled - don't composite
      }
      
      // Composite all layers onto the main canvas
      // If no mask or text-behind disabled, text renders on top (Requirements: 8.1, 8.2, 8.5)
      this.layerManager.composite(this.canvas);
      
      // Save successful render state
      this.lastSuccessfulRender = {
        textLayer: { ...textLayer },
        canvasData: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
      };
    } catch (error) {
      console.error('Render failed:', error);
      
      // Attempt to restore previous successful state
      if (this.lastSuccessfulRender.canvasData) {
        try {
          this.restoreCanvasState(this.lastSuccessfulRender.canvasData);
          console.warn('Restored previous canvas state after render failure');
        } catch (restoreError) {
          console.error('Failed to restore previous state:', restoreError);
        }
      }
      
      // Re-throw error for caller to handle
      throw new Error(`Canvas rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Save current canvas state
   * @private
   */
  private saveCanvasState(): ImageData | null {
    try {
      return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    } catch (error) {
      console.warn('Failed to save canvas state:', error);
      return null;
    }
  }
  
  /**
   * Restore canvas state from ImageData
   * @private
   */
  private restoreCanvasState(imageData: ImageData): void {
    try {
      this.ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error('Failed to restore canvas state:', error);
      throw error;
    }
  }

  /**
   * Generate a cache key for text layer based on its properties
   * @private
   */
  private generateTextLayerKey(textLayer: TextLayer): string {
    return JSON.stringify({
      text: textLayer.text,
      preset: textLayer.preset,
      fontSize: textLayer.fontSize,
      transform: textLayer.transform,
    });
  }

  /**
   * Create background layer canvas
   * @private
   * @throws {Error} If layer creation fails
   */
  private createBackgroundLayer(): HTMLCanvasElement {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context for background layer');
      }

      // Draw scaled background image
      ctx.drawImage(
        this.backgroundImage,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      return canvas;
    } catch (error) {
      console.error('Failed to create background layer:', error);
      throw new Error(`Background layer creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Render with advanced text features (multi-line, alignment, custom fonts, effects)
   * @param textLayer - Advanced text layer configuration
   */
  renderAdvanced(textLayer: AdvancedTextLayer): void {
    // Increment render token to cancel any in-progress renders
    const currentToken = ++this.renderToken;
    
    try {
      // Save current canvas state before clearing (for fallback)
      const canvasBackup = this.saveCanvasState();
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Clear layer manager
      this.layerManager.clear();

      // Use cached background layer or create new one
      let backgroundCanvas = this.cachedBackgroundLayer;
      if (!backgroundCanvas) {
        backgroundCanvas = this.createBackgroundLayer();
        this.cachedBackgroundLayer = backgroundCanvas;
      }
      this.layerManager.addLayer({
        type: 'background',
        canvas: backgroundCanvas,
      });

      // Create advanced text layer if text is provided
      if (textLayer.text.trim()) {
        // Generate cache key from text layer properties
        const textLayerKey = this.generateAdvancedTextLayerKey(textLayer);
        
        // Use cached text layer if available and unchanged
        let textCanvas = this.cachedTextLayer;
        if (!textCanvas || this.lastTextLayerKey !== textLayerKey) {
          textCanvas = this.createAdvancedTextLayer(textLayer);
          this.cachedTextLayer = textCanvas;
          this.lastTextLayerKey = textLayerKey;
        }
        
        this.layerManager.addLayer({
          type: 'text',
          canvas: textCanvas,
        });
      }

      // Use cached mask layer or create new one if available and text-behind effect is enabled
      if (this.maskImage && this.textBehindEnabled) {
        let maskCanvas = this.cachedMaskLayer;
        if (!maskCanvas) {
          maskCanvas = this.createMaskLayer();
          this.cachedMaskLayer = maskCanvas;
        }
        this.layerManager.addLayer({
          type: 'mask',
          canvas: maskCanvas,
        });
      }

      // Check if this render was cancelled by a newer render call
      if (currentToken !== this.renderToken) {
        // Restore canvas state if cancelled
        if (canvasBackup) {
          this.restoreCanvasState(canvasBackup);
        }
        return; // Cancelled - don't composite
      }
      
      // Composite all layers onto the main canvas
      this.layerManager.composite(this.canvas);
      
      // Save successful render state (convert to basic TextLayer for compatibility)
      this.lastSuccessfulRender = {
        textLayer: null, // Advanced text layer doesn't fit the old format
        canvasData: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
      };
    } catch (error) {
      console.error('Advanced render failed:', error);
      
      // Attempt to restore previous successful state
      if (this.lastSuccessfulRender.canvasData) {
        try {
          this.restoreCanvasState(this.lastSuccessfulRender.canvasData);
          console.warn('Restored previous canvas state after render failure');
        } catch (restoreError) {
          console.error('Failed to restore previous state:', restoreError);
        }
      }
      
      // Re-throw error for caller to handle
      throw new Error(`Canvas rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a cache key for advanced text layer
   * @private
   */
  private generateAdvancedTextLayerKey(textLayer: AdvancedTextLayer): string {
    return JSON.stringify({
      text: textLayer.text,
      fontFamily: textLayer.fontFamily,
      fontSize: textLayer.fontSize,
      lineSpacing: textLayer.lineSpacing,
      alignment: textLayer.alignment,
      effects: textLayer.effects,
      transform: textLayer.transform,
    });
  }

  /**
   * Create advanced text layer canvas
   * @private
   * @throws {Error} If layer creation fails
   */
  private createAdvancedTextLayer(textLayer: AdvancedTextLayer): HTMLCanvasElement {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context for advanced text layer');
      }

      // Render using advanced text renderer
      TextRenderer.renderAdvanced(ctx, textLayer, canvas.width, canvas.height);

      return canvas;
    } catch (error) {
      console.error('Failed to create advanced text layer:', error);
      throw new Error(`Advanced text layer creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create text layer canvas
   * @private
   * @throws {Error} If layer creation fails
   */
  private createTextLayer(textLayer: TextLayer): HTMLCanvasElement {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context for text layer');
      }

      // Get text style for the preset
      const style = TextRenderer.getStyle(textLayer.preset, textLayer.fontSize);

      // Create transform controller
      const transformController = new TransformController(textLayer.transform);

      // Save context state
      ctx.save();

      // Apply transformations
      transformController.applyToContext(ctx, canvas.width, canvas.height);

      // Render text at origin (0, 0) since transform already positioned it
      TextRenderer.renderText(ctx, textLayer.text, style, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
      });

      // Restore context state
      ctx.restore();

      return canvas;
    } catch (error) {
      console.error('Failed to create text layer:', error);
      throw new Error(`Text layer creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create mask layer canvas
   * @private
   * @throws {Error} If layer creation fails
   */
  private createMaskLayer(): HTMLCanvasElement {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context for mask layer');
      }

      // Draw scaled mask image
      if (this.maskImage) {
        ctx.drawImage(
          this.maskImage,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
      }

      return canvas;
    } catch (error) {
      console.error('Failed to create mask layer:', error);
      throw new Error(`Mask layer creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear the canvas and reset layer manager
   * Also clears cached layers - Requirements: 8.5
   */
  clear(): void {
    // Clear canvas content
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Reset layer manager
    this.layerManager.clear();

    // Clear cached layers
    this.clearCache();
  }

  /**
   * Clear all cached layers to free memory
   * Requirements: 8.5
   */
  clearCache(): void {
    this.cachedBackgroundLayer = null;
    this.cachedMaskLayer = null;
    this.cachedTextLayer = null;
    this.lastTextLayerKey = null;
  }

  /**
   * Get data URL from canvas
   * @param format - Image format ('png' or 'jpeg')
   * @param quality - Quality parameter for JPEG (0-1, default: 0.92)
   * @returns Data URL string
   */
  getDataURL(format: 'png' | 'jpeg' = 'png', quality: number = 0.92): string {
    if (format === 'jpeg') {
      return this.canvas.toDataURL('image/jpeg', quality);
    }
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Get the current scale factor
   * @returns Scale factor for coordinate conversion
   */
  getScaleFactor(): number {
    return this.scaleFactor;
  }

  /**
   * Update the mask image
   * Invalidates cached mask layer - Requirements: 8.3
   * @param maskImage - New mask image or null to remove
   */
  setMaskImage(maskImage: HTMLImageElement | HTMLCanvasElement | null): void {
    this.maskImage = maskImage || undefined;
    // Invalidate cached mask layer when mask changes
    this.cachedMaskLayer = null;
  }

  /**
   * Update the text-behind enabled state
   * @param enabled - Whether text-behind effect should be enabled
   */
  setTextBehindEnabled(enabled: boolean): void {
    this.textBehindEnabled = enabled;
  }

  /**
   * Get the current text-behind enabled state
   * @returns Whether text-behind effect is enabled
   */
  getTextBehindEnabled(): boolean {
    return this.textBehindEnabled;
  }

  /**
   * Calculate optimal text position using auto-placement algorithm
   * Analyzes the image to find the largest empty area for text placement
   * @param gridSize - Size of grid cells for analysis (default: 50px)
   * @returns Optimal transform with calculated position (x, y in 0-1 range)
   */
  autoPlace(gridSize: number = 50): Transform {
    // Get image data from background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      // Fallback to center if context creation fails
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    // Draw background image to temporary canvas
    tempCtx.drawImage(
      this.backgroundImage,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // Get image data
    const imageData = tempCtx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // Convert to grayscale
    const grayscale = imageToGrayscale(imageData);

    // Calculate gradient magnitude (edge detection)
    const gradient = calculateGradientMagnitude(
      grayscale,
      this.canvas.width,
      this.canvas.height
    );

    // Score grid cells
    const cells = scoreGridCells(
      gradient,
      this.canvas.width,
      this.canvas.height,
      gridSize
    );

    // Find contiguous regions
    const cols = Math.floor(this.canvas.width / gridSize);
    const rows = Math.floor(this.canvas.height / gridSize);
    const regions = findContiguousRegions(cells, cols, rows);

    // If no suitable region found, default to center
    if (regions.length === 0) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    // Use the largest region
    const largestRegion = regions[0];

    // Convert grid coordinates to normalized canvas coordinates (0-1)
    // Add 0.5 to center within the grid cell
    const normalizedX = (largestRegion.centerX + 0.5) * gridSize / this.canvas.width;
    const normalizedY = (largestRegion.centerY + 0.5) * gridSize / this.canvas.height;

    return {
      x: normalizedX,
      y: normalizedY,
      scale: 1,
      rotation: 0,
    };
  }
}
