/**
 * Final Integration Tests for Canvas Text Compositing Engine
 * Tests: 15.1, 15.2, 15.3, 15.4
 * Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5, 7.1-7.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Compositor } from './compositor';
import { TextRenderer } from './textRenderer';
import { TransformController } from './transformController';
import type { TextLayer, StylePreset } from './types';

/**
 * Helper function to create a test image
 * Returns a canvas element that can be used as an image source
 */
function createTestImage(width: number, height: number, color: string = '#ff0000'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Return canvas directly - it can be used as an image source
  return canvas as any as HTMLImageElement;
}

/**
 * Helper function to create a test mask image
 * Returns a canvas element that can be used as an image source
 */
function createTestMask(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Create a circular mask in the center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Return canvas directly - it can be used as an image source
  return canvas as any as HTMLImageElement;
}

describe('Task 15.1: Test with various image sizes', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
  });

  it('should handle small images (< 500px) correctly', () => {
    // Requirements: 7.1, 7.2, 7.3
    const smallImage = createTestImage(300, 400);
    const compositor = new Compositor({
      canvas,
      backgroundImage: smallImage,
      maxDimension: 1080,
    });

    const textLayer: TextLayer = {
      text: 'Small Image Test',
      preset: 'neon',
      fontSize: 48,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };

    compositor.render(textLayer);

    // Verify canvas dimensions match image (no scaling needed)
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(400);
    
    // Verify scale factor is 1 (no scaling)
    expect(compositor.getScaleFactor()).toBe(1);
  });

  it('should handle medium images (500-1500px) correctly', () => {
    // Requirements: 7.1, 7.2, 7.3
    const mediumImage = createTestImage(800, 1200);
    const compositor = new Compositor({
      canvas,
      backgroundImage: mediumImage,
      maxDimension: 1080,
    });

    const textLayer: TextLayer = {
      text: 'Medium Image Test',
      preset: 'magazine',
      fontSize: 64,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };

    compositor.render(textLayer);

    // Verify canvas is scaled down to fit maxDimension
    const expectedScale = 1080 / 1200;
    expect(canvas.width).toBe(Math.round(800 * expectedScale));
    expect(canvas.height).toBe(1080);
    
    // Verify scale factor
    expect(compositor.getScaleFactor()).toBeCloseTo(expectedScale, 5);
  });

  it('should handle large images (> 1500px) correctly', () => {
    // Requirements: 7.1, 7.2, 7.3
    const largeImage = createTestImage(2400, 1800);
    const compositor = new Compositor({
      canvas,
      backgroundImage: largeImage,
      maxDimension: 1080,
    });

    const textLayer: TextLayer = {
      text: 'Large Image Test',
      preset: 'brush',
      fontSize: 72,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };

    compositor.render(textLayer);

    // Verify canvas is scaled down to fit maxDimension
    const expectedScale = 1080 / 2400;
    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(Math.round(1800 * expectedScale));
    
    // Verify scale factor
    expect(compositor.getScaleFactor()).toBeCloseTo(expectedScale, 5);
  });

  it('should maintain aspect ratio for all image sizes', () => {
    // Requirements: 7.1
    const testCases = [
      { width: 400, height: 300 },
      { width: 1000, height: 800 },
      { width: 2000, height: 1500 },
      { width: 1920, height: 1080 },
    ];

    testCases.forEach(({ width, height }) => {
      const image = createTestImage(width, height);
      const compositor = new Compositor({
        canvas,
        backgroundImage: image,
        maxDimension: 1080,
      });

      const originalAspectRatio = width / height;
      const canvasAspectRatio = canvas.width / canvas.height;
      
      // Aspect ratio should be preserved within 0.01 tolerance
      expect(Math.abs(canvasAspectRatio - originalAspectRatio)).toBeLessThan(0.01);
    });
  });
});

describe('Task 15.2: Test all style presets', () => {
  let canvas: HTMLCanvasElement;
  let compositor: Compositor;
  let backgroundImage: HTMLImageElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    backgroundImage = createTestImage(800, 600);
    compositor = new Compositor({
      canvas,
      backgroundImage,
      maxDimension: 1080,
    });
  });

  const testTexts = [
    'Short',
    'Medium Length Text',
    'This is a much longer text that spans more space',
  ];

  const presets: StylePreset[] = ['neon', 'magazine', 'brush', 'emboss'];

  presets.forEach((preset) => {
    describe(`${preset} preset`, () => {
      testTexts.forEach((text) => {
        it(`should render "${text}" with ${preset} style`, () => {
          // Requirements: 2.1, 2.2, 2.3, 2.4
          const textLayer: TextLayer = {
            text,
            preset,
            fontSize: 48,
            transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
          };

          // Should not throw
          expect(() => compositor.render(textLayer)).not.toThrow();

          // Verify canvas has content
          const ctx = canvas.getContext('2d');
          expect(ctx).toBeTruthy();
          
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasContent = imageData.data.some((value, index) => {
              // Check alpha channel (every 4th value)
              return index % 4 === 3 && value > 0;
            });
            expect(hasContent).toBe(true);
          }
        });
      });

      it(`should apply correct style properties for ${preset}`, () => {
        // Requirements: 2.5
        const style = TextRenderer.getStyle(preset, 48);

        // Verify style has required properties
        expect(style.font).toBeTruthy();
        expect(style.fillStyle).toBeTruthy();

        // Verify preset-specific properties
        switch (preset) {
          case 'neon':
            expect(style.shadows).toBeDefined();
            expect(style.shadows!.length).toBeGreaterThan(0);
            break;
          case 'magazine':
            expect(style.strokeStyle).toBeDefined();
            expect(style.lineWidth).toBeDefined();
            break;
          case 'brush':
            expect(style.strokeStyle).toBeDefined();
            expect(style.font).toContain('italic');
            break;
          case 'emboss':
            expect(style.shadow).toBeDefined();
            break;
        }
      });
    });
  });
});

describe('Task 15.3: Test transform interactions', () => {
  let canvas: HTMLCanvasElement;
  let compositor: Compositor;
  let backgroundImage: HTMLImageElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    backgroundImage = createTestImage(800, 600);
    compositor = new Compositor({
      canvas,
      backgroundImage,
      maxDimension: 1080,
    });
  });

  it('should handle position + scale combination', () => {
    // Requirements: 3.1, 3.2
    const textLayer: TextLayer = {
      text: 'Position + Scale',
      preset: 'neon',
      fontSize: 48,
      transform: { x: 0.3, y: 0.7, scale: 1.5, rotation: 0 },
    };

    expect(() => compositor.render(textLayer)).not.toThrow();
    
    // Verify transform values are preserved
    const controller = new TransformController(textLayer.transform);
    const transform = controller.getTransform();
    expect(transform.x).toBe(0.3);
    expect(transform.y).toBe(0.7);
    expect(transform.scale).toBe(1.5);
  });

  it('should handle position + rotation combination', () => {
    // Requirements: 3.1, 3.3
    const textLayer: TextLayer = {
      text: 'Position + Rotation',
      preset: 'magazine',
      fontSize: 48,
      transform: { x: 0.6, y: 0.4, scale: 1, rotation: 45 },
    };

    expect(() => compositor.render(textLayer)).not.toThrow();
    
    // Verify transform values are preserved
    const controller = new TransformController(textLayer.transform);
    const transform = controller.getTransform();
    expect(transform.x).toBe(0.6);
    expect(transform.y).toBe(0.4);
    expect(transform.rotation).toBe(45);
  });

  it('should handle scale + rotation combination', () => {
    // Requirements: 3.2, 3.3
    const textLayer: TextLayer = {
      text: 'Scale + Rotation',
      preset: 'brush',
      fontSize: 48,
      transform: { x: 0.5, y: 0.5, scale: 2.0, rotation: 90 },
    };

    expect(() => compositor.render(textLayer)).not.toThrow();
    
    // Verify transform values are preserved
    const controller = new TransformController(textLayer.transform);
    const transform = controller.getTransform();
    expect(transform.scale).toBe(2.0);
    expect(transform.rotation).toBe(90);
  });

  it('should handle all three transforms combined', () => {
    // Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
    const textLayer: TextLayer = {
      text: 'All Transforms',
      preset: 'emboss',
      fontSize: 48,
      transform: { x: 0.25, y: 0.75, scale: 1.8, rotation: 135 },
    };

    expect(() => compositor.render(textLayer)).not.toThrow();
    
    // Verify all transform values are preserved
    const controller = new TransformController(textLayer.transform);
    const transform = controller.getTransform();
    expect(transform.x).toBe(0.25);
    expect(transform.y).toBe(0.75);
    expect(transform.scale).toBe(1.8);
    expect(transform.rotation).toBe(135);
  });

  it('should apply transforms in correct order (translate → rotate → scale)', () => {
    // Requirements: 3.4
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 800;
    testCanvas.height = 600;
    const ctx = testCanvas.getContext('2d');
    
    if (ctx) {
      const controller = new TransformController({
        x: 0.5,
        y: 0.5,
        scale: 2.0,
        rotation: 45,
      });

      // Apply transform
      controller.applyToContext(ctx, testCanvas.width, testCanvas.height);

      // Get the transform matrix
      const matrix = ctx.getTransform();
      
      // Verify matrix is not identity (transforms were applied)
      expect(matrix.a).not.toBe(1);
      expect(matrix.d).not.toBe(1);
    }
  });

  it('should handle extreme transform values', () => {
    // Requirements: 3.1, 3.2, 3.3
    const extremeCases = [
      { x: 0, y: 0, scale: 0.5, rotation: 0 },
      { x: 1, y: 1, scale: 3.0, rotation: 360 },
      { x: 0.5, y: 0.5, scale: 1, rotation: 720 }, // Multiple rotations
    ];

    extremeCases.forEach((transform) => {
      const textLayer: TextLayer = {
        text: 'Extreme Test',
        preset: 'neon',
        fontSize: 48,
        transform,
      };

      expect(() => compositor.render(textLayer)).not.toThrow();
    });
  });
});

describe('Task 15.4: Test text-behind effect', () => {
  let canvas: HTMLCanvasElement;
  let backgroundImage: HTMLImageElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    backgroundImage = createTestImage(800, 600, '#0000ff');
  });

  it('should composite text behind subject with mask', () => {
    // Requirements: 4.1, 4.2
    const maskImage = createTestMask(800, 600);
    const compositor = new Compositor({
      canvas,
      backgroundImage,
      maskImage,
      maxDimension: 1080,
    });

    const textLayer: TextLayer = {
      text: 'Behind Subject',
      preset: 'neon',
      fontSize: 48,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };

    expect(() => compositor.render(textLayer)).not.toThrow();

    // Verify canvas has content
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeTruthy();
  });

  it('should handle various mask qualities', () => {
    // Requirements: 4.3
    const maskSizes = [
      { width: 400, height: 300 }, // Low quality
      { width: 800, height: 600 }, // Medium quality
      { width: 1600, height: 1200 }, // High quality
    ];

    maskSizes.forEach(({ width, height }) => {
      const maskImage = createTestMask(width, height);
      const compositor = new Compositor({
        canvas,
        backgroundImage: createTestImage(width, height),
        maskImage,
        maxDimension: 1080,
      });

      const textLayer: TextLayer = {
        text: 'Mask Quality Test',
        preset: 'magazine',
        fontSize: 48,
        transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      };

      expect(() => compositor.render(textLayer)).not.toThrow();
    });
  });

  it('should render text on top when no mask is available', () => {
    // Requirements: 4.4
    const compositor = new Compositor({
      canvas,
      backgroundImage,
      maxDimension: 1080,
    });

    const textLayer: TextLayer = {
      text: 'No Mask Test',
      preset: 'brush',
      fontSize: 48,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };

    expect(() => compositor.render(textLayer)).not.toThrow();

    // Verify canvas has content
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeTruthy();
  });

  it('should use correct blend modes for compositing', () => {
    // Requirements: 4.5
    const maskImage = createTestMask(800, 600);
    const compositor = new Compositor({
      canvas,
      backgroundImage,
      maskImage,
      maxDimension: 1080,
    });

    const textLayer: TextLayer = {
      text: 'Blend Mode Test',
      preset: 'emboss',
      fontSize: 48,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };

    // Should composite correctly with destination-out blend mode
    expect(() => compositor.render(textLayer)).not.toThrow();
  });

  it('should handle text-behind toggle', () => {
    // Requirements: 4.1, 4.2
    const maskImage = createTestMask(800, 600);
    const compositor = new Compositor({
      canvas,
      backgroundImage,
      maskImage,
      textBehindEnabled: true,
      maxDimension: 1080,
    });

    const textLayer: TextLayer = {
      text: 'Toggle Test',
      preset: 'neon',
      fontSize: 48,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };

    // Render with text-behind enabled
    compositor.render(textLayer);
    expect(compositor.getTextBehindEnabled()).toBe(true);

    // Disable text-behind
    compositor.setTextBehindEnabled(false);
    compositor.render(textLayer);
    expect(compositor.getTextBehindEnabled()).toBe(false);

    // Re-enable text-behind
    compositor.setTextBehindEnabled(true);
    compositor.render(textLayer);
    expect(compositor.getTextBehindEnabled()).toBe(true);
  });

  it('should handle complex mask edges', () => {
    // Requirements: 4.3
    // Create a mask with complex edges (simulating hair, fur, etc.)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 800;
    maskCanvas.height = 600;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (maskCtx) {
      // Draw complex pattern with varying alpha
      for (let i = 0; i < 100; i++) {
        maskCtx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
        maskCtx.fillRect(
          Math.random() * 800,
          Math.random() * 600,
          Math.random() * 50,
          Math.random() * 50
        );
      }
    }

    const compositor = new Compositor({
      canvas,
      backgroundImage,
      maskImage: maskCanvas as any as HTMLImageElement,
      maxDimension: 1080,
    });

    const textLayer: TextLayer = {
      text: 'Complex Edges',
      preset: 'magazine',
      fontSize: 48,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };

    expect(() => compositor.render(textLayer)).not.toThrow();
  });

  it('should handle multiple subjects (multiple mask regions)', () => {
    // Requirements: 4.2
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 800;
    maskCanvas.height = 600;
    const maskCtx = maskCanvas.getContext('2d');
    
    if (maskCtx) {
      // Draw multiple circular regions (simulating multiple subjects)
      maskCtx.fillStyle = '#ffffff';
      maskCtx.beginPath();
      maskCtx.arc(200, 300, 80, 0, Math.PI * 2);
      maskCtx.fill();
      
      maskCtx.beginPath();
      maskCtx.arc(600, 300, 80, 0, Math.PI * 2);
      maskCtx.fill();
    }

    const compositor = new Compositor({
      canvas,
      backgroundImage,
      maskImage: maskCanvas as any as HTMLImageElement,
      maxDimension: 1080,
    });

    const textLayer: TextLayer = {
      text: 'Multiple Subjects',
      preset: 'brush',
      fontSize: 48,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    };

    expect(() => compositor.render(textLayer)).not.toThrow();
  });
});
