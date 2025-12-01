/**
 * Unit tests for MaskPreview
 * Tests mask visualization rendering in different modes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MaskPreview, PreviewOptions } from './maskPreview';

describe('MaskPreview', () => {
  let canvas: HTMLCanvasElement;
  let originalImage: HTMLImageElement;
  let maskImage: HTMLImageElement;

  beforeEach(() => {
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    // Create original image
    originalImage = new Image();
    originalImage.width = 100;
    originalImage.height = 100;
    // Mark as complete for test environment
    Object.defineProperty(originalImage, 'complete', { value: true, writable: false });

    // Create mask image
    maskImage = new Image();
    maskImage.width = 100;
    maskImage.height = 100;
    // Mark as complete for test environment
    Object.defineProperty(maskImage, 'complete', { value: true, writable: false });
  });

  /**
   * Helper to create an image with specific content
   */
  const createImageWithContent = (width: number, height: number, fillColor: string): HTMLImageElement => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, width, height);
    }

    const img = new Image();
    img.width = width;
    img.height = height;
    img.src = tempCanvas.toDataURL();
    // Mark image as complete for test environment
    Object.defineProperty(img, 'complete', { value: true, writable: false });
    
    return img;
  };

  describe('renderOverlay', () => {
    it('should render overlay without throwing', () => {
      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
      }).not.toThrow();
    });

    it('should set canvas dimensions to match original image', () => {
      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);

      expect(canvas.width).toBe(originalImage.width);
      expect(canvas.height).toBe(originalImage.height);
    });

    it('should handle different opacity values', () => {
      const options1: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.3,
        colorize: true
      };

      const options2: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.8,
        colorize: true
      };

      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, options1);
      }).not.toThrow();

      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, options2);
      }).not.toThrow();
    });

    it('should handle colorize option', () => {
      const optionsColorized: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      const optionsNotColorized: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: false
      };

      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, optionsColorized);
      }).not.toThrow();

      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, optionsNotColorized);
      }).not.toThrow();
    });

    it('should throw error if canvas context is not available', () => {
      // Create a canvas that will fail to get context
      const badCanvas = {
        getContext: () => null,
        width: 100,
        height: 100
      } as unknown as HTMLCanvasElement;

      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      expect(() => {
        MaskPreview.renderOverlay(badCanvas, originalImage, maskImage, options);
      }).toThrow('Failed to get canvas context');
    });

    it('should handle images with different dimensions', () => {
      const largeImage = createImageWithContent(200, 200, '#ff0000');
      const smallMask = createImageWithContent(50, 50, '#00ff00');

      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      expect(() => {
        MaskPreview.renderOverlay(canvas, largeImage, smallMask, options);
      }).not.toThrow();

      // Canvas should match original image dimensions
      expect(canvas.width).toBe(largeImage.width);
      expect(canvas.height).toBe(largeImage.height);
    });
  });

  describe('renderSideBySide', () => {
    it('should render side-by-side without throwing', () => {
      expect(() => {
        MaskPreview.renderSideBySide(canvas, originalImage, maskImage);
      }).not.toThrow();
    });

    it('should set canvas width to double the original image width', () => {
      MaskPreview.renderSideBySide(canvas, originalImage, maskImage);

      expect(canvas.width).toBe(originalImage.width * 2);
      expect(canvas.height).toBe(originalImage.height);
    });

    it('should handle images with different dimensions', () => {
      const wideImage = createImageWithContent(200, 100, '#ff0000');
      const tallMask = createImageWithContent(100, 200, '#00ff00');

      expect(() => {
        MaskPreview.renderSideBySide(canvas, wideImage, tallMask);
      }).not.toThrow();

      // Canvas should be double the width of original
      expect(canvas.width).toBe(wideImage.width * 2);
      expect(canvas.height).toBe(wideImage.height);
    });

    it('should throw error if canvas context is not available', () => {
      const badCanvas = {
        getContext: () => null,
        width: 100,
        height: 100
      } as unknown as HTMLCanvasElement;

      expect(() => {
        MaskPreview.renderSideBySide(badCanvas, originalImage, maskImage);
      }).toThrow('Failed to get canvas context');
    });

    it('should handle very small images', () => {
      const tinyImage = createImageWithContent(10, 10, '#ff0000');
      const tinyMask = createImageWithContent(10, 10, '#00ff00');

      expect(() => {
        MaskPreview.renderSideBySide(canvas, tinyImage, tinyMask);
      }).not.toThrow();

      expect(canvas.width).toBe(20);
      expect(canvas.height).toBe(10);
    });

    it('should handle very large images', () => {
      const largeImage = createImageWithContent(1000, 1000, '#ff0000');
      const largeMask = createImageWithContent(1000, 1000, '#00ff00');

      expect(() => {
        MaskPreview.renderSideBySide(canvas, largeImage, largeMask);
      }).not.toThrow();

      expect(canvas.width).toBe(2000);
      expect(canvas.height).toBe(1000);
    });
  });

  describe('renderCheckerboard', () => {
    it('should render checkerboard without throwing', () => {
      expect(() => {
        MaskPreview.renderCheckerboard(canvas, maskImage);
      }).not.toThrow();
    });

    it('should set canvas dimensions to match mask image', () => {
      MaskPreview.renderCheckerboard(canvas, maskImage);

      expect(canvas.width).toBe(maskImage.width);
      expect(canvas.height).toBe(maskImage.height);
    });

    it('should handle masks with different dimensions', () => {
      const wideMask = createImageWithContent(200, 100, '#ff0000');

      expect(() => {
        MaskPreview.renderCheckerboard(canvas, wideMask);
      }).not.toThrow();

      expect(canvas.width).toBe(200);
      expect(canvas.height).toBe(100);
    });

    it('should throw error if canvas context is not available', () => {
      const badCanvas = {
        getContext: () => null,
        width: 100,
        height: 100
      } as unknown as HTMLCanvasElement;

      expect(() => {
        MaskPreview.renderCheckerboard(badCanvas, maskImage);
      }).toThrow('Failed to get canvas context');
    });

    it('should handle very small masks', () => {
      const tinyMask = createImageWithContent(5, 5, '#ff0000');

      expect(() => {
        MaskPreview.renderCheckerboard(canvas, tinyMask);
      }).not.toThrow();

      expect(canvas.width).toBe(5);
      expect(canvas.height).toBe(5);
    });

    it('should handle very large masks', () => {
      const largeMask = createImageWithContent(1000, 1000, '#ff0000');

      expect(() => {
        MaskPreview.renderCheckerboard(canvas, largeMask);
      }).not.toThrow();

      expect(canvas.width).toBe(1000);
      expect(canvas.height).toBe(1000);
    });

    it('should create checkerboard pattern', () => {
      MaskPreview.renderCheckerboard(canvas, maskImage);

      const ctx = canvas.getContext('2d');
      expect(ctx).not.toBeNull();

      // Verify canvas has been drawn to
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      
      // Check that not all pixels are the same (checkerboard has variation)
      const firstPixelColor = `${imageData.data[0]},${imageData.data[1]},${imageData.data[2]}`;
      let hasDifferentColor = false;

      for (let i = 0; i < imageData.data.length; i += 4) {
        const pixelColor = `${imageData.data[i]},${imageData.data[i + 1]},${imageData.data[i + 2]}`;
        if (pixelColor !== firstPixelColor) {
          hasDifferentColor = true;
          break;
        }
      }

      // Checkerboard should have at least two different colors
      expect(hasDifferentColor).toBe(true);
    });
  });

  describe('Opacity control', () => {
    it('should handle opacity of 0', () => {
      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0,
        colorize: true
      };

      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
      }).not.toThrow();
    });

    it('should handle opacity of 1', () => {
      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 1,
        colorize: true
      };

      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
      }).not.toThrow();
    });

    it('should handle fractional opacity values', () => {
      const opacities = [0.1, 0.25, 0.5, 0.75, 0.9];

      for (const opacity of opacities) {
        const options: PreviewOptions = {
          mode: 'overlay',
          opacity,
          colorize: true
        };

        expect(() => {
          MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
        }).not.toThrow();
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle zero-dimension images gracefully', () => {
      const zeroImage = new Image();
      zeroImage.width = 0;
      zeroImage.height = 0;

      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      // Should not throw, but canvas will have zero dimensions
      expect(() => {
        MaskPreview.renderOverlay(canvas, zeroImage, maskImage, options);
      }).not.toThrow();
    });

    it('should handle non-square images', () => {
      const wideImage = createImageWithContent(300, 100, '#ff0000');
      const tallMask = createImageWithContent(100, 300, '#00ff00');

      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      expect(() => {
        MaskPreview.renderOverlay(canvas, wideImage, tallMask, options);
      }).not.toThrow();
    });

    it('should handle images with extreme aspect ratios', () => {
      const veryWideImage = createImageWithContent(1000, 10, '#ff0000');
      const veryTallMask = createImageWithContent(10, 1000, '#00ff00');

      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      expect(() => {
        MaskPreview.renderOverlay(canvas, veryWideImage, veryTallMask, options);
      }).not.toThrow();
    });
  });

  describe('Integration between modes', () => {
    it('should be able to switch between different preview modes', () => {
      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      // Render overlay
      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
      }).not.toThrow();

      // Switch to side-by-side
      expect(() => {
        MaskPreview.renderSideBySide(canvas, originalImage, maskImage);
      }).not.toThrow();

      // Switch to checkerboard
      expect(() => {
        MaskPreview.renderCheckerboard(canvas, maskImage);
      }).not.toThrow();

      // Back to overlay
      expect(() => {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
      }).not.toThrow();
    });

    it('should handle rapid mode switching', () => {
      const options: PreviewOptions = {
        mode: 'overlay',
        opacity: 0.5,
        colorize: true
      };

      for (let i = 0; i < 10; i++) {
        MaskPreview.renderOverlay(canvas, originalImage, maskImage, options);
        MaskPreview.renderSideBySide(canvas, originalImage, maskImage);
        MaskPreview.renderCheckerboard(canvas, maskImage);
      }

      // Should complete without errors
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });
  });
});
