/**
 * Property-based tests for PresetManager
 * Feature: text-editing-advanced
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { PresetManager } from './presetManager';
import type { TextEffects } from './textEffects';

describe('PresetManager', () => {
  // Clear localStorage before and after each test
  beforeEach(() => {
    PresetManager.clearAllPresets();
  });

  afterEach(() => {
    PresetManager.clearAllPresets();
  });

  /**
   * Feature: text-editing-advanced, Property 5: Preset persistence
   * Validates: Requirements 8.1, 8.2, 8.3, 8.5
   * 
   * For any saved preset, loading it should restore all effect settings exactly
   */
  it('should persist and restore all effect settings exactly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate preset name
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate fill color
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`),
        // Generate outline settings
        fc.boolean(),
        fc.integer({ min: 1, max: 10 }),
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`),
        // Generate gradient settings
        fc.boolean(),
        fc.constantFrom('linear' as const, 'radial' as const),
        fc.array(
          fc.record({
            color: fc.tuple(
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 })
            ).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`),
            position: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        fc.integer({ min: 0, max: 360 }),
        // Generate pattern settings (without image for simplicity)
        fc.boolean(),
        fc.double({ min: 0.1, max: 2.0, noNaN: true }),
        async (
          presetName,
          fillColor,
          outlineEnabled,
          outlineWidth,
          outlineColor,
          gradientEnabled,
          gradientType,
          colorStops,
          gradientAngle,
          patternEnabled,
          patternScale
        ) => {
          // Create text effects
          const effects: TextEffects = {
            fillColor,
            outline: {
              enabled: outlineEnabled,
              width: outlineWidth,
              color: outlineColor,
            },
            gradient: {
              enabled: gradientEnabled,
              type: gradientType,
              colorStops,
              angle: gradientAngle,
            },
            pattern: {
              enabled: patternEnabled,
              image: null, // Skip image for property test
              scale: patternScale,
            },
          };

          // Save preset
          await PresetManager.savePreset(presetName, effects);

          // Load preset using trimmed name (since savePreset trims)
          const trimmedName = presetName.trim();
          const loadedEffects = await PresetManager.loadPreset(trimmedName);

          // Property: loaded effects should match saved effects exactly
          expect(loadedEffects).not.toBeNull();
          expect(loadedEffects!.fillColor).toBe(effects.fillColor);
          
          // Outline settings
          expect(loadedEffects!.outline.enabled).toBe(effects.outline.enabled);
          expect(loadedEffects!.outline.width).toBe(effects.outline.width);
          expect(loadedEffects!.outline.color).toBe(effects.outline.color);
          
          // Gradient settings
          expect(loadedEffects!.gradient.enabled).toBe(effects.gradient.enabled);
          expect(loadedEffects!.gradient.type).toBe(effects.gradient.type);
          expect(loadedEffects!.gradient.angle).toBe(effects.gradient.angle);
          expect(loadedEffects!.gradient.colorStops.length).toBe(effects.gradient.colorStops.length);
          
          // Check each color stop
          effects.gradient.colorStops.forEach((stop, index) => {
            expect(loadedEffects!.gradient.colorStops[index].color).toBe(stop.color);
            expect(loadedEffects!.gradient.colorStops[index].position).toBe(stop.position);
          });
          
          // Pattern settings
          expect(loadedEffects!.pattern.enabled).toBe(effects.pattern.enabled);
          expect(loadedEffects!.pattern.scale).toBe(effects.pattern.scale);
          expect(loadedEffects!.pattern.image).toBe(effects.pattern.image); // Both null
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Saving multiple presets should preserve all of them
   */
  it('should save and load multiple presets independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            fillColor: fc.tuple(
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 })
            ).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`),
            outlineWidth: fc.integer({ min: 1, max: 10 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (presetConfigs) => {
          // Clear any existing presets first
          PresetManager.clearAllPresets();
          
          // Remove duplicates by name
          const uniquePresets = Array.from(
            new Map(presetConfigs.map(p => [p.name, p])).values()
          );

          // Save all presets
          for (const config of uniquePresets) {
            const effects: TextEffects = {
              fillColor: config.fillColor,
              outline: {
                enabled: true,
                width: config.outlineWidth,
                color: '#000000',
              },
              gradient: {
                enabled: false,
                type: 'linear',
                colorStops: [
                  { color: '#ff0000', position: 0 },
                  { color: '#0000ff', position: 1 },
                ],
                angle: 0,
              },
              pattern: {
                enabled: false,
                image: null,
                scale: 1.0,
              },
            };
            await PresetManager.savePreset(config.name, effects);
          }

          // Load and verify each preset
          for (const config of uniquePresets) {
            const trimmedName = config.name.trim();
            const loaded = await PresetManager.loadPreset(trimmedName);
            
            expect(loaded).not.toBeNull();
            expect(loaded!.fillColor).toBe(config.fillColor);
            expect(loaded!.outline.width).toBe(config.outlineWidth);
          }

          // Verify preset count
          const names = await PresetManager.getPresetNames();
          expect(names.length).toBe(uniquePresets.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Deleting a preset should remove it completely
   */
  it('should delete presets correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          { minLength: 2, maxLength: 10 }
        ),
        fc.integer({ min: 0, max: 9 }),
        async (presetNames, deleteIndex) => {
          // Clear any existing presets first
          PresetManager.clearAllPresets();
          
          // Remove duplicates after trimming (since savePreset trims names)
          const trimmedNames = presetNames.map(n => n.trim());
          const uniqueNames = Array.from(new Set(trimmedNames));
          
          if (uniqueNames.length < 2) {
            return; // Skip if not enough unique names
          }

          const actualDeleteIndex = deleteIndex % uniqueNames.length;
          const nameToDelete = uniqueNames[actualDeleteIndex];

          // Save all presets
          for (const name of uniqueNames) {
            const effects: TextEffects = {
              fillColor: '#000000',
              outline: { enabled: false, width: 2, color: '#ffffff' },
              gradient: {
                enabled: false,
                type: 'linear',
                colorStops: [
                  { color: '#ff0000', position: 0 },
                  { color: '#0000ff', position: 1 },
                ],
                angle: 0,
              },
              pattern: { enabled: false, image: null, scale: 1.0 },
            };
            await PresetManager.savePreset(name, effects);
          }

          // Delete one preset
          await PresetManager.deletePreset(nameToDelete);

          // Property: deleted preset should not exist
          const exists = await PresetManager.presetExists(nameToDelete);
          expect(exists).toBe(false);

          // Property: other presets should still exist
          const remainingNames = await PresetManager.getPresetNames();
          expect(remainingNames.length).toBe(uniqueNames.length - 1);
          expect(remainingNames).not.toContain(nameToDelete);

          // Verify each remaining preset can be loaded
          for (const name of uniqueNames) {
            if (name !== nameToDelete) {
              const loaded = await PresetManager.loadPreset(name);
              expect(loaded).not.toBeNull();
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Overwriting a preset should replace the old one
   */
  it('should overwrite existing preset with same name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`),
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`),
        async (presetName, firstColor, secondColor) => {
          // Clear any existing presets first
          PresetManager.clearAllPresets();
          
          // Ensure colors are different
          if (firstColor === secondColor) {
            return;
          }

          // Save first version
          const firstEffects: TextEffects = {
            fillColor: firstColor,
            outline: { enabled: false, width: 2, color: '#ffffff' },
            gradient: {
              enabled: false,
              type: 'linear',
              colorStops: [
                { color: '#ff0000', position: 0 },
                { color: '#0000ff', position: 1 },
              ],
              angle: 0,
            },
            pattern: { enabled: false, image: null, scale: 1.0 },
          };
          await PresetManager.savePreset(presetName, firstEffects);

          // Save second version with same name
          const secondEffects: TextEffects = {
            fillColor: secondColor,
            outline: { enabled: true, width: 5, color: '#000000' },
            gradient: {
              enabled: false,
              type: 'linear',
              colorStops: [
                { color: '#ff0000', position: 0 },
                { color: '#0000ff', position: 1 },
              ],
              angle: 0,
            },
            pattern: { enabled: false, image: null, scale: 1.0 },
          };
          await PresetManager.savePreset(presetName, secondEffects);

          // Property: should only have one preset with this name
          const trimmedName = presetName.trim();
          const names = await PresetManager.getPresetNames();
          const matchingNames = names.filter(n => n === trimmedName);
          expect(matchingNames.length).toBe(1);

          // Property: loaded preset should have second version's settings
          const loaded = await PresetManager.loadPreset(trimmedName);
          expect(loaded).not.toBeNull();
          expect(loaded!.fillColor).toBe(secondColor);
          expect(loaded!.outline.enabled).toBe(true);
          expect(loaded!.outline.width).toBe(5);
        }
      ),
      { numRuns: 50 }
    );
  });
});
