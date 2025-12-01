/**
 * Property-Based Tests for Batch Styler
 * 
 * Tests style consistency across batch operations using fast-check
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { BatchStyler } from './batchStyler';
import { BatchImage, BatchStyle } from './types';
import { StylePreset, Transform } from '../canvas/types';

describe('BatchStyler', () => {
  let styler: BatchStyler;

  beforeEach(() => {
    styler = new BatchStyler();
  });

  // Generators for property-based testing
  const stylePresetArb = fc.constantFrom<StylePreset>('neon', 'magazine', 'brush', 'emboss');
  
  const batchStyleArb = fc.record({
    preset: stylePresetArb,
    fontSize: fc.integer({ min: 12, max: 72 }),
  });

  const transformArb = fc.record({
    x: fc.double({ min: 0, max: 1, noNaN: true }),
    y: fc.double({ min: 0, max: 1, noNaN: true }),
    scale: fc.double({ min: 0.5, max: 3.0, noNaN: true }),
    rotation: fc.integer({ min: 0, max: 360 }),
  });

  const batchImageArb = fc.record({
    id: fc.uuid(),
    file: fc.constant(new File([''], 'test.jpg', { type: 'image/jpeg' })),
    thumbnail: fc.constant('data:image/jpeg;base64,test'),
    status: fc.constantFrom('valid', 'invalid', 'processing', 'complete') as fc.Arbitrary<'valid' | 'invalid' | 'processing' | 'complete'>,
  });

  const batchImagesArb = fc.array(batchImageArb, { minLength: 1, maxLength: 50 });

  /**
   * **Feature: batch-processing, Property 2: Style consistency**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * Property: For any batch with shared styling, all images should have identical style settings
   * 
   * This property verifies that when a style is applied to a batch:
   * - All images receive the same style preset (Requirement 3.1)
   * - All images receive the same font size (Requirement 3.2)
   * - All images receive the same transform/position (Requirement 3.3)
   */
  describe('Property 2: Style consistency', () => {
    it('should apply the same style preset to all images', () => {
      fc.assert(
        fc.property(batchImagesArb, batchStyleArb, (images, style) => {
          // Apply style to all images
          const styledImages = styler.applyStyle(images, style);

          // Verify all images have the same style
          const allHaveSameStyle = styledImages.every(img => 
            img.style?.preset === style.preset &&
            img.style?.fontSize === style.fontSize
          );

          expect(allHaveSameStyle).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply the same font size to all images', () => {
      fc.assert(
        fc.property(batchImagesArb, batchStyleArb, (images, style) => {
          // Apply style to all images
          const styledImages = styler.applyStyle(images, style);

          // Extract all font sizes
          const fontSizes = styledImages
            .map(img => img.style?.fontSize)
            .filter((size): size is number => size !== undefined);

          // Verify all font sizes are identical
          const allSame = fontSizes.every(size => size === style.fontSize);
          expect(allSame).toBe(true);
          expect(fontSizes.length).toBe(images.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply the same transform to all images', () => {
      fc.assert(
        fc.property(batchImagesArb, transformArb, (images, transform) => {
          // Apply transform to all images
          const transformedImages = styler.applyTransform(images, transform);

          // Verify all images have the same transform
          const allHaveSameTransform = transformedImages.every(img =>
            img.transform?.x === transform.x &&
            img.transform?.y === transform.y &&
            img.transform?.scale === transform.scale &&
            img.transform?.rotation === transform.rotation
          );

          expect(allHaveSameTransform).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply the same caption to all images', () => {
      fc.assert(
        fc.property(batchImagesArb, fc.string({ minLength: 1, maxLength: 200 }), (images, caption) => {
          // Apply caption to all images
          const captionedImages = styler.applyCaption(images, caption);

          // Verify all images have the same caption
          const allHaveSameCaption = captionedImages.every(img => img.caption === caption);
          expect(allHaveSameCaption).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain style consistency when applying multiple style changes', () => {
      fc.assert(
        fc.property(
          batchImagesArb,
          batchStyleArb,
          batchStyleArb,
          (images, style1, style2) => {
            // Apply first style
            let styledImages = styler.applyStyle(images, style1);
            
            // Verify consistency after first application
            const allHaveStyle1 = styledImages.every(img =>
              img.style?.preset === style1.preset &&
              img.style?.fontSize === style1.fontSize
            );
            expect(allHaveStyle1).toBe(true);

            // Apply second style
            styledImages = styler.applyStyle(styledImages, style2);
            
            // Verify consistency after second application
            const allHaveStyle2 = styledImages.every(img =>
              img.style?.preset === style2.preset &&
              img.style?.fontSize === style2.fontSize
            );
            expect(allHaveStyle2).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve per-image customization when enabled', () => {
      fc.assert(
        fc.property(
          batchImagesArb,
          batchStyleArb,
          batchStyleArb,
          fc.integer({ min: 0, max: 49 }),
          (images, sharedStyle, customStyle, customIndex) => {
            // Skip if batch is empty or index is out of bounds
            if (images.length === 0 || customIndex >= images.length) {
              return true;
            }

            // Enable per-image customization
            styler.setPerImageCustomization(true);

            // Apply shared style to all
            let styledImages = styler.applyStyle(images, sharedStyle);

            // Customize one specific image
            const customImageId = styledImages[customIndex].id;
            styledImages = styler.updateImageStyle(styledImages, customImageId, customStyle);

            // Apply shared style again
            styledImages = styler.applyStyle(styledImages, sharedStyle);

            // Verify the customized image kept its custom style
            const customizedImage = styledImages.find(img => img.id === customImageId);
            expect(customizedImage?.style).toEqual(customStyle);

            // Verify other images have the shared style
            const otherImages = styledImages.filter(img => img.id !== customImageId);
            const othersHaveSharedStyle = otherImages.every(img =>
              img.style?.preset === sharedStyle.preset &&
              img.style?.fontSize === sharedStyle.fontSize
            );
            expect(othersHaveSharedStyle).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific behaviors
  describe('Unit Tests', () => {
    it('should update a single image caption', () => {
      const images: BatchImage[] = [
        {
          id: '1',
          file: new File([''], 'test1.jpg'),
          thumbnail: 'thumb1',
          status: 'valid',
        },
        {
          id: '2',
          file: new File([''], 'test2.jpg'),
          thumbnail: 'thumb2',
          status: 'valid',
        },
      ];

      const updated = styler.updateImageCaption(images, '1', 'Custom caption');
      
      expect(updated[0].caption).toBe('Custom caption');
      expect(updated[1].caption).toBeUndefined();
    });

    it('should reset style settings', () => {
      const style: BatchStyle = { preset: 'neon', fontSize: 24 };
      styler.applyStyle([], style);
      styler.setPerImageCustomization(true);

      styler.reset();

      const settings = styler.getStyleSettings();
      expect(settings.sharedStyle).toBeUndefined();
      expect(settings.allowPerImageCustomization).toBe(false);
    });

    it('should identify customized images', () => {
      const images: BatchImage[] = [
        {
          id: '1',
          file: new File([''], 'test1.jpg'),
          thumbnail: 'thumb1',
          status: 'valid',
          caption: 'Custom',
        },
        {
          id: '2',
          file: new File([''], 'test2.jpg'),
          thumbnail: 'thumb2',
          status: 'valid',
        },
      ];

      styler.applyCaption(images, 'Shared');
      const customized = styler.getCustomizedImages(images);
      
      expect(customized).toContain('1');
      expect(customized).not.toContain('2');
    });

    it('should apply shared settings to all images, overriding customs', () => {
      const images: BatchImage[] = [
        {
          id: '1',
          file: new File([''], 'test1.jpg'),
          thumbnail: 'thumb1',
          status: 'valid',
          caption: 'Custom 1',
        },
        {
          id: '2',
          file: new File([''], 'test2.jpg'),
          thumbnail: 'thumb2',
          status: 'valid',
          caption: 'Custom 2',
        },
      ];

      const sharedCaption = 'Shared caption';
      styler.applyCaption(images, sharedCaption);
      const result = styler.applySharedToAll(images);

      expect(result.every(img => img.caption === sharedCaption)).toBe(true);
    });
  });
});
