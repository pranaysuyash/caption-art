/**
 * Batch Style Applicator
 * 
 * Applies captions, styles, and transforms to multiple images in a batch.
 * Supports both shared styling and per-image customization.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { Transform } from '../canvas/types';
import { BatchImage, BatchStyle, BatchStyleSettings } from './types';

export class BatchStyler {
  private styleSettings: BatchStyleSettings;

  constructor() {
    this.styleSettings = {
      allowPerImageCustomization: false,
    };
  }

  /**
   * Applies a caption to all images in the batch
   * Requirement 2.1: Apply same caption to all images
   * Requirement 2.2: Update all images immediately when caption changes
   * 
   * @param images - Array of batch images
   * @param caption - Caption text to apply
   * @returns Updated array of batch images
   */
  applyCaption(images: BatchImage[], caption: string): BatchImage[] {
    // Requirement 2.1: Apply caption to all images
    this.styleSettings.sharedCaption = caption;
    
    return images.map(img => {
      // Requirement 2.3: Only override if per-image customization is disabled
      // or if the image doesn't have a custom caption
      if (!this.styleSettings.allowPerImageCustomization || !img.caption) {
        return {
          ...img,
          caption,
        };
      }
      return img;
    });
  }

  /**
   * Applies a style to all images in the batch
   * Requirement 3.1: Apply same style preset to all images
   * Requirement 3.2: Update all images with new font size
   * 
   * @param images - Array of batch images
   * @param style - Style settings to apply
   * @returns Updated array of batch images
   */
  applyStyle(images: BatchImage[], style: BatchStyle): BatchImage[] {
    // Requirement 3.1: Apply style to all images
    this.styleSettings.sharedStyle = style;
    
    return images.map(img => {
      // Requirement 3.4: Only override if per-image customization is disabled
      // or if the image doesn't have a custom style
      if (!this.styleSettings.allowPerImageCustomization || !img.style) {
        return {
          ...img,
          style,
        };
      }
      return img;
    });
  }

  /**
   * Applies a transform to all images in the batch
   * Requirement 3.3: Apply same text position to all images
   * 
   * @param images - Array of batch images
   * @param transform - Transform settings to apply
   * @returns Updated array of batch images
   */
  applyTransform(images: BatchImage[], transform: Transform): BatchImage[] {
    // Requirement 3.3: Apply transform to all images
    this.styleSettings.sharedTransform = transform;
    
    return images.map(img => {
      // Requirement 3.4: Only override if per-image customization is disabled
      // or if the image doesn't have a custom transform
      if (!this.styleSettings.allowPerImageCustomization || !img.transform) {
        return {
          ...img,
          transform,
        };
      }
      return img;
    });
  }

  /**
   * Updates caption for a specific image
   * Requirement 2.3: Allow editing each image's caption individually
   * Requirement 2.4: Offer to generate unique captions for each image
   * 
   * @param images - Array of batch images
   * @param imageId - ID of the image to update
   * @param caption - Caption text to apply
   * @returns Updated array of batch images
   */
  updateImageCaption(images: BatchImage[], imageId: string, caption: string): BatchImage[] {
    return images.map(img => {
      if (img.id === imageId) {
        return {
          ...img,
          caption,
        };
      }
      return img;
    });
  }

  /**
   * Updates style for a specific image
   * Requirement 3.4: Allow customizing each image individually
   * 
   * @param images - Array of batch images
   * @param imageId - ID of the image to update
   * @param style - Style settings to apply
   * @returns Updated array of batch images
   */
  updateImageStyle(images: BatchImage[], imageId: string, style: BatchStyle): BatchImage[] {
    return images.map(img => {
      if (img.id === imageId) {
        return {
          ...img,
          style,
        };
      }
      return img;
    });
  }

  /**
   * Updates transform for a specific image
   * Requirement 3.4: Allow customizing each image individually
   * 
   * @param images - Array of batch images
   * @param imageId - ID of the image to update
   * @param transform - Transform settings to apply
   * @returns Updated array of batch images
   */
  updateImageTransform(images: BatchImage[], imageId: string, transform: Transform): BatchImage[] {
    return images.map(img => {
      if (img.id === imageId) {
        return {
          ...img,
          transform,
        };
      }
      return img;
    });
  }

  /**
   * Enables or disables per-image customization
   * Requirement 2.3: Enable per-image captions
   * Requirement 3.4: Enable per-image styling
   * 
   * @param enabled - Whether to allow per-image customization
   */
  setPerImageCustomization(enabled: boolean): void {
    this.styleSettings.allowPerImageCustomization = enabled;
  }

  /**
   * Gets the current style settings
   * @returns Current batch style settings
   */
  getStyleSettings(): BatchStyleSettings {
    return { ...this.styleSettings };
  }

  /**
   * Resets all style settings to defaults
   */
  reset(): void {
    this.styleSettings = {
      allowPerImageCustomization: false,
    };
  }

  /**
   * Gets all images that have custom styling
   * @param images - Array of batch images
   * @returns Array of image IDs with custom styling
   */
  getCustomizedImages(images: BatchImage[]): string[] {
    return images
      .filter(img => 
        (img.caption && img.caption !== this.styleSettings.sharedCaption) ||
        (img.style && img.style !== this.styleSettings.sharedStyle) ||
        (img.transform && img.transform !== this.styleSettings.sharedTransform)
      )
      .map(img => img.id);
  }

  /**
   * Applies shared settings to all images, overriding any custom settings
   * Requirement 3.5: Update all image previews when styles are applied
   * 
   * @param images - Array of batch images
   * @returns Updated array of batch images with shared settings applied
   */
  applySharedToAll(images: BatchImage[]): BatchImage[] {
    return images.map(img => ({
      ...img,
      caption: this.styleSettings.sharedCaption,
      style: this.styleSettings.sharedStyle,
      transform: this.styleSettings.sharedTransform,
    }));
  }
}
