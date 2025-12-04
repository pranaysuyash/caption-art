/**
 * Preset Manager
 * Manages saving, loading, and deleting text effect presets
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import type { TextEffects } from './textEffects';
import { safeLocalStorage } from '../storage/safeLocalStorage';

/**
 * Serializable preset data (excludes HTMLImageElement)
 * Requirement 8.2: Store all current text effect settings
 */
export interface PresetData {
  name: string;
  fillColor: string;
  outline: {
    enabled: boolean;
    width: number;
    color: string;
  };
  gradient: {
    enabled: boolean;
    type: 'linear' | 'radial';
    colorStops: Array<{ color: string; position: number }>;
    angle: number;
  };
  pattern: {
    enabled: boolean;
    imageDataUrl: string | null;
    scale: number;
  };
}

/**
 * Preset with runtime image
 */
export interface Preset {
  name: string;
  effects: TextEffects;
}

const STORAGE_KEY = 'text-effect-presets';

/**
 * PresetManager class for managing text effect presets
 */
export class PresetManager {
  /**
   * Save a preset with a given name
   * Requirements: 8.1, 8.2, 8.5
   * Requirement 8.1: Prompt for preset name (handled by caller)
   * Requirement 8.2: Store all current text effect settings
   * Requirement 8.5: Persist to localStorage
   */
  static async savePreset(name: string, effects: TextEffects): Promise<void> {
    if (!name || name.trim() === '') {
      throw new Error('Preset name cannot be empty');
    }

    const presets = await this.loadAllPresets();

    // Convert effects to serializable format
    const presetData: PresetData = {
      name: name.trim(),
      fillColor: effects.fillColor,
      outline: {
        enabled: effects.outline.enabled,
        width: effects.outline.width,
        color: effects.outline.color,
      },
      gradient: {
        enabled: effects.gradient.enabled,
        type: effects.gradient.type,
        colorStops: effects.gradient.colorStops.map((stop) => ({
          color: stop.color,
          position: stop.position,
        })),
        angle: effects.gradient.angle,
      },
      pattern: {
        enabled: effects.pattern.enabled,
        imageDataUrl: effects.pattern.image
          ? await this.imageToDataUrl(effects.pattern.image)
          : null,
        scale: effects.pattern.scale,
      },
    };

    // Replace existing preset with same name or add new
    const existingIndex = presets.findIndex((p) => p.name === presetData.name);
    if (existingIndex >= 0) {
      presets[existingIndex] = presetData;
    } else {
      presets.push(presetData);
    }

    // Requirement 8.5: Persist to localStorage
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }

  /**
   * Load a preset by name
   * Requirement 8.3: Apply all stored settings
   */
  static async loadPreset(name: string): Promise<TextEffects | null> {
    const presets = await this.loadAllPresets();
    const preset = presets.find((p) => p.name === name);

    if (!preset) {
      return null;
    }

    return this.presetDataToEffects(preset);
  }

  /**
   * Load all saved presets
   * Requirement 8.5: Load from localStorage
   */
  static async loadAllPresets(): Promise<PresetData[]> {
    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const presets = JSON.parse(stored);
      return Array.isArray(presets) ? presets : [];
    } catch (error) {
      console.error('Failed to load presets:', error);
      return [];
    }
  }

  /**
   * Get list of preset names
   */
  static async getPresetNames(): Promise<string[]> {
    const presets = await this.loadAllPresets();
    return presets.map((p) => p.name);
  }

  /**
   * Delete a preset by name
   * Requirement 8.4: Remove from saved presets list
   */
  static async deletePreset(name: string): Promise<void> {
    const presets = await this.loadAllPresets();
    const filtered = presets.filter((p) => p.name !== name);

    // Requirement 8.5: Persist to localStorage
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Check if a preset exists
   */
  static async presetExists(name: string): Promise<boolean> {
    const presets = await this.loadAllPresets();
    return presets.some((p) => p.name === name);
  }

  /**
   * Clear all presets
   */
  static clearAllPresets(): void {
    safeLocalStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Convert HTMLImageElement to data URL for storage
   */
  private static async imageToDataUrl(
    image: HTMLImageElement
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(image, 0, 0);
    return canvas.toDataURL('image/png');
  }

  /**
   * Convert data URL to HTMLImageElement
   */
  private static async dataUrlToImage(
    dataUrl: string
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error('Failed to load image from data URL'));
      img.src = dataUrl;
    });
  }

  /**
   * Convert PresetData to TextEffects
   */
  private static async presetDataToEffects(
    preset: PresetData
  ): Promise<TextEffects> {
    let patternImage: HTMLImageElement | null = null;

    if (preset.pattern.imageDataUrl) {
      try {
        patternImage = await this.dataUrlToImage(preset.pattern.imageDataUrl);
      } catch (error) {
        console.error('Failed to load pattern image:', error);
      }
    }

    return {
      fillColor: preset.fillColor,
      outline: {
        enabled: preset.outline.enabled,
        width: preset.outline.width,
        color: preset.outline.color,
      },
      gradient: {
        enabled: preset.gradient.enabled,
        type: preset.gradient.type,
        colorStops: preset.gradient.colorStops.map((stop) => ({
          color: stop.color,
          position: stop.position,
        })),
        angle: preset.gradient.angle,
      },
      pattern: {
        enabled: preset.pattern.enabled,
        image: patternImage,
        scale: preset.pattern.scale,
      },
    };
  }
}
