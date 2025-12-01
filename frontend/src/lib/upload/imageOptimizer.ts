/**
 * Image Optimizer
 * 
 * Handles image optimization including resizing and compression.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { OptimizationOptions, OptimizationResult } from './types';

export class ImageOptimizer {
  /**
   * Optimizes an image by resizing and compressing it
   * @param file - The image file to optimize
   * @param options - Optimization options (maxDimension, quality, format)
   * @returns OptimizationResult with optimized image and metadata
   */
  static async optimize(
    file: File,
    options: OptimizationOptions
  ): Promise<OptimizationResult> {
    // Load the image
    const image = await this.loadImage(file);
    
    // Resize if needed
    const canvas = await this.resize(image, options.maxDimension);
    
    // Compress the image
    const format = options.format || this.getFormatFromFile(file);
    const optimizedImage = await this.compress(canvas, options.quality, format);
    
    return {
      optimizedImage,
      originalSize: file.size,
      optimizedSize: optimizedImage.size,
      dimensions: {
        width: canvas.width,
        height: canvas.height,
      },
    };
  }

  /**
   * Resizes an image to fit within maxDimension while preserving aspect ratio
   * @param image - The HTMLImageElement to resize
   * @param maxDimension - Maximum width or height in pixels
   * @returns Canvas with resized image
   */
  static async resize(
    image: HTMLImageElement,
    maxDimension: number
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Unable to get canvas context');
    }

    // Calculate new dimensions while preserving aspect ratio
    let width = image.width;
    let height = image.height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = (height / width) * maxDimension;
        width = maxDimension;
      } else {
        width = (width / height) * maxDimension;
        height = maxDimension;
      }
    }

    // Round dimensions to integers (canvas dimensions must be integers)
    width = Math.round(width);
    height = Math.round(height);
    
    // Ensure minimum dimension of 1 pixel
    width = Math.max(1, width);
    height = Math.max(1, height);

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Use high-quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the resized image
    ctx.drawImage(image, 0, 0, width, height);

    return canvas;
  }

  /**
   * Compresses a canvas to a Blob with specified quality
   * @param canvas - The canvas to compress
   * @param quality - Compression quality (0-1)
   * @param format - Output format ('jpeg', 'png', or 'webp')
   * @returns Compressed image as Blob
   */
  static async compress(
    canvas: HTMLCanvasElement,
    quality: number,
    format: 'jpeg' | 'png' | 'webp' = 'jpeg'
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = `image/${format}`;
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Loads an image file into an HTMLImageElement
   * @param file - The image file to load
   * @returns Promise that resolves to HTMLImageElement
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Determines the output format based on the input file
   * @param file - The input file
   * @returns Format string ('jpeg', 'png', or 'webp')
   */
  private static getFormatFromFile(file: File): 'jpeg' | 'png' | 'webp' {
    if (file.type === 'image/png') {
      return 'png';
    } else if (file.type === 'image/webp') {
      return 'webp';
    }
    return 'jpeg';
  }
}
