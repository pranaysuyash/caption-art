/**
 * Property-based tests for TransformController
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TransformController } from './transformController';
import type { Transform } from './types';

describe('TransformController', () => {
  describe('Property 2: Transform preservation', () => {
    /**
     * **Feature: canvas-text-compositing, Property 2: Transform preservation**
     * 
     * For any transform values (position, scale, rotation), after applying to 
     * the canvas context and then reading back the transform matrix, the values 
     * should match the original within floating-point precision
     * 
     * **Validates: Requirements 3.4**
     */
    it('should preserve transform values when applied to canvas context', () => {
      // Generators for transform values
      const xArb = fc.double({ min: 0, max: 1, noNaN: true });
      const yArb = fc.double({ min: 0, max: 1, noNaN: true });
      const scaleArb = fc.double({ min: 0.5, max: 3.0, noNaN: true });
      const rotationArb = fc.double({ min: 0, max: 360, noNaN: true });

      fc.assert(
        fc.property(xArb, yArb, scaleArb, rotationArb, (x, y, scale, rotation) => {
          // Create transform controller with random values
          const controller = new TransformController({ x, y, scale, rotation });

          // Create a mock canvas context
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 600;
          const ctx = canvas.getContext('2d')!;

          // Save the initial state
          ctx.save();

          // Apply the transform
          controller.applyToContext(ctx, canvas.width, canvas.height);

          // Get the transform matrix
          const matrix = ctx.getTransform();

          // Calculate expected values
          const pixelX = x * canvas.width;
          const pixelY = y * canvas.height;
          const radians = (rotation * Math.PI) / 180;

          // The transform matrix should match our applied transformations
          // Matrix format: [a, b, c, d, e, f] where:
          // a = scale * cos(rotation)
          // b = scale * sin(rotation)
          // c = -scale * sin(rotation)
          // d = scale * cos(rotation)
          // e = translateX
          // f = translateY

          const expectedA = scale * Math.cos(radians);
          const expectedB = scale * Math.sin(radians);
          const expectedC = -scale * Math.sin(radians);
          const expectedD = scale * Math.cos(radians);
          const expectedE = pixelX;
          const expectedF = pixelY;

          // Use a reasonable epsilon for floating-point comparison
          const epsilon = 1e-10;

          expect(Math.abs(matrix.a - expectedA)).toBeLessThan(epsilon);
          expect(Math.abs(matrix.b - expectedB)).toBeLessThan(epsilon);
          expect(Math.abs(matrix.c - expectedC)).toBeLessThan(epsilon);
          expect(Math.abs(matrix.d - expectedD)).toBeLessThan(epsilon);
          expect(Math.abs(matrix.e - expectedE)).toBeLessThan(epsilon);
          expect(Math.abs(matrix.f - expectedF)).toBeLessThan(epsilon);

          // Restore context
          ctx.restore();
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain transform values through get/set operations', () => {
      const xArb = fc.double({ min: 0, max: 1, noNaN: true });
      const yArb = fc.double({ min: 0, max: 1, noNaN: true });
      const scaleArb = fc.double({ min: 0.5, max: 3.0, noNaN: true });
      const rotationArb = fc.double({ min: 0, max: 360, noNaN: true });

      fc.assert(
        fc.property(xArb, yArb, scaleArb, rotationArb, (x, y, scale, rotation) => {
          const controller = new TransformController({ x, y, scale, rotation });

          // Get the transform
          const retrieved = controller.getTransform();

          // Values should match within floating-point precision
          const epsilon = 1e-10;
          expect(Math.abs(retrieved.x - x)).toBeLessThan(epsilon);
          expect(Math.abs(retrieved.y - y)).toBeLessThan(epsilon);
          expect(Math.abs(retrieved.scale - scale)).toBeLessThan(epsilon);
          
          // Rotation might be normalized, so check modulo 360
          const normalizedRotation = rotation % 360;
          const expectedRotation = normalizedRotation < 0 ? normalizedRotation + 360 : normalizedRotation;
          expect(Math.abs(retrieved.rotation - expectedRotation)).toBeLessThan(epsilon);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Resolution independence', () => {
    /**
     * **Feature: canvas-text-compositing, Property 3: Resolution independence**
     * 
     * For any canvas size and text position specified in normalized coordinates (0-1),
     * the text should appear at the same relative position regardless of canvas dimensions
     * 
     * **Validates: Requirements 7.4**
     */
    it('should maintain relative position across different canvas sizes', () => {
      // Generators
      const xArb = fc.double({ min: 0, max: 1, noNaN: true });
      const yArb = fc.double({ min: 0, max: 1, noNaN: true });
      const scaleArb = fc.double({ min: 0.5, max: 3.0, noNaN: true });
      const rotationArb = fc.double({ min: 0, max: 360, noNaN: true });
      const canvasWidthArb = fc.integer({ min: 100, max: 2000 });
      const canvasHeightArb = fc.integer({ min: 100, max: 2000 });

      fc.assert(
        fc.property(
          xArb,
          yArb,
          scaleArb,
          rotationArb,
          canvasWidthArb,
          canvasHeightArb,
          (x, y, scale, rotation, width1, height1) => {
            // Create controller with normalized coordinates
            const controller = new TransformController({ x, y, scale, rotation });

            // Apply to first canvas size
            const canvas1 = document.createElement('canvas');
            canvas1.width = width1;
            canvas1.height = height1;
            const ctx1 = canvas1.getContext('2d')!;
            ctx1.save();
            controller.applyToContext(ctx1, canvas1.width, canvas1.height);
            const matrix1 = ctx1.getTransform();
            ctx1.restore();

            // Apply to second canvas size (different dimensions)
            const width2 = width1 * 2;
            const height2 = height1 * 2;
            const canvas2 = document.createElement('canvas');
            canvas2.width = width2;
            canvas2.height = height2;
            const ctx2 = canvas2.getContext('2d')!;
            ctx2.save();
            controller.applyToContext(ctx2, canvas2.width, canvas2.height);
            const matrix2 = ctx2.getTransform();
            ctx2.restore();

            // The relative position should be the same
            // matrix.e / canvasWidth should be equal for both
            // matrix.f / canvasHeight should be equal for both
            const relativeX1 = matrix1.e / width1;
            const relativeY1 = matrix1.f / height1;
            const relativeX2 = matrix2.e / width2;
            const relativeY2 = matrix2.f / height2;

            const epsilon = 1e-10;
            expect(Math.abs(relativeX1 - relativeX2)).toBeLessThan(epsilon);
            expect(Math.abs(relativeY1 - relativeY2)).toBeLessThan(epsilon);

            // Both should equal the original normalized coordinates
            expect(Math.abs(relativeX1 - x)).toBeLessThan(epsilon);
            expect(Math.abs(relativeY1 - y)).toBeLessThan(epsilon);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Scale proportionality', () => {
    /**
     * **Feature: canvas-text-compositing, Property 12: Scale proportionality**
     * 
     * For any scale factor S applied to text, the rendered text width and height 
     * should both scale by factor S within 2% tolerance
     * 
     * **Validates: Requirements 3.2**
     */
    it('should scale both dimensions proportionally', () => {
      const scaleArb = fc.double({ min: 0.5, max: 3.0, noNaN: true });
      const xArb = fc.double({ min: 0, max: 1, noNaN: true });
      const yArb = fc.double({ min: 0, max: 1, noNaN: true });
      const rotationArb = fc.double({ min: 0, max: 360, noNaN: true });

      fc.assert(
        fc.property(scaleArb, xArb, yArb, rotationArb, (scale, x, y, rotation) => {
          const controller = new TransformController({ x, y, scale, rotation });

          // Create canvas and context
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 600;
          const ctx = canvas.getContext('2d')!;

          // Apply transform
          ctx.save();
          controller.applyToContext(ctx, canvas.width, canvas.height);

          // Get the transform matrix
          const matrix = ctx.getTransform();

          // The scale is encoded in the matrix
          // For a rotation + scale transform:
          // scaleX = sqrt(a^2 + b^2)
          // scaleY = sqrt(c^2 + d^2)
          const scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
          const scaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d);

          // Both scales should equal the applied scale
          const epsilon = 1e-10;
          expect(Math.abs(scaleX - scale)).toBeLessThan(epsilon);
          expect(Math.abs(scaleY - scale)).toBeLessThan(epsilon);

          // The ratio of scaleX to scaleY should be 1 (proportional scaling)
          // Allow 2% tolerance as specified in the property
          const ratio = scaleX / scaleY;
          expect(Math.abs(ratio - 1.0)).toBeLessThan(0.02);

          ctx.restore();
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain proportionality when scale changes', () => {
      const scale1Arb = fc.double({ min: 0.5, max: 3.0, noNaN: true });
      const scale2Arb = fc.double({ min: 0.5, max: 3.0, noNaN: true });
      const xArb = fc.double({ min: 0, max: 1, noNaN: true });
      const yArb = fc.double({ min: 0, max: 1, noNaN: true });
      const rotationArb = fc.double({ min: 0, max: 360, noNaN: true });

      fc.assert(
        fc.property(scale1Arb, scale2Arb, xArb, yArb, rotationArb, (scale1, scale2, x, y, rotation) => {
          // Create controller with first scale
          const controller = new TransformController({ x, y, scale: scale1, rotation });

          // Change to second scale
          controller.setScale(scale2);

          // Get the transform
          const transform = controller.getTransform();

          // The scale should be updated
          const epsilon = 1e-10;
          expect(Math.abs(transform.scale - scale2)).toBeLessThan(epsilon);

          // Apply to canvas and verify proportionality
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 600;
          const ctx = canvas.getContext('2d')!;
          ctx.save();
          controller.applyToContext(ctx, canvas.width, canvas.height);
          const matrix = ctx.getTransform();

          const scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
          const scaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d);

          // Verify proportional scaling with 2% tolerance
          const ratio = scaleX / scaleY;
          expect(Math.abs(ratio - 1.0)).toBeLessThan(0.02);

          ctx.restore();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit tests for edge cases', () => {
    it('should clamp position values to 0-1 range', () => {
      const controller = new TransformController({ x: 0.5, y: 0.5, scale: 1, rotation: 0 });

      // Test values outside range
      controller.setPosition(-0.5, 1.5);
      const transform = controller.getTransform();

      expect(transform.x).toBe(0);
      expect(transform.y).toBe(1);
    });

    it('should clamp scale values to 0.5-3.0 range', () => {
      const controller = new TransformController({ x: 0.5, y: 0.5, scale: 1, rotation: 0 });

      // Test values outside range
      controller.setScale(0.1);
      expect(controller.getTransform().scale).toBe(0.5);

      controller.setScale(5.0);
      expect(controller.getTransform().scale).toBe(3.0);
    });

    it('should normalize rotation to 0-360 range', () => {
      const controller = new TransformController({ x: 0.5, y: 0.5, scale: 1, rotation: 0 });

      // Test values outside range
      controller.setRotation(450);
      expect(controller.getTransform().rotation).toBe(90);

      controller.setRotation(-90);
      expect(controller.getTransform().rotation).toBe(270);

      controller.setRotation(720);
      expect(controller.getTransform().rotation).toBe(0);
    });

    it('should handle zero rotation', () => {
      const controller = new TransformController({ x: 0.5, y: 0.5, scale: 1, rotation: 0 });

      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;

      ctx.save();
      controller.applyToContext(ctx, canvas.width, canvas.height);
      const matrix = ctx.getTransform();

      // With zero rotation, a and d should equal scale, b and c should be ~0
      expect(Math.abs(matrix.a - 1)).toBeLessThan(1e-10);
      expect(Math.abs(matrix.d - 1)).toBeLessThan(1e-10);
      expect(Math.abs(matrix.b)).toBeLessThan(1e-10);
      expect(Math.abs(matrix.c)).toBeLessThan(1e-10);

      ctx.restore();
    });

    it('should handle 90 degree rotation', () => {
      const controller = new TransformController({ x: 0.5, y: 0.5, scale: 1, rotation: 90 });

      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;

      ctx.save();
      controller.applyToContext(ctx, canvas.width, canvas.height);
      const matrix = ctx.getTransform();

      // With 90 degree rotation: a ≈ 0, b ≈ 1, c ≈ -1, d ≈ 0
      expect(Math.abs(matrix.a)).toBeLessThan(1e-10);
      expect(Math.abs(matrix.b - 1)).toBeLessThan(1e-10);
      expect(Math.abs(matrix.c + 1)).toBeLessThan(1e-10);
      expect(Math.abs(matrix.d)).toBeLessThan(1e-10);

      ctx.restore();
    });
  });
});
