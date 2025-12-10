/**
 * useTextStyle hook - Manages text style state and presets
 * Requirements: 8.1-8.8
 */

import { useState, useEffect, useCallback } from 'react';
import type { TextStyle, TextStylePreset } from '../components/ProfessionalTextEditor';
import type { TextEffects } from '../lib/text/textEffects';

const STORAGE_KEY = 'caption-art-text-style';
const PRESETS_STORAGE_KEY = 'caption-art-text-presets';

/**
 * Default text style
 */
const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 48,
  fontWeight: 'bold',
  fontStyle: 'normal',
  color: '#ffffff',
  letterSpacing: 0,
  lineHeight: 1.2,
  rotation: 0,
  alignment: 'center',
  effects: {
    fillColor: '#ffffff',
    outline: {
      enabled: false,
      width: 2,
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
  },
};

export interface UseTextStyleOptions {
  /** Initial text style */
  initialStyle?: Partial<TextStyle>;
  /** Callback when style changes (for real-time preview) */
  onStyleChange?: (style: TextStyle) => void;
  /** Whether to persist style to localStorage */
  persist?: boolean;
}

export interface UseTextStyleReturn {
  /** Current text style */
  style: TextStyle;
  /** Update text style */
  setStyle: (style: TextStyle) => void;
  /** Update partial text style */
  updateStyle: (updates: Partial<TextStyle>) => void;
  /** Reset to default style */
  resetStyle: () => void;
  /** Custom presets */
  customPresets: TextStylePreset[];
  /** Save current style as preset */
  savePreset: (name: string) => void;
  /** Delete custom preset */
  deletePreset: (id: string) => void;
  /** Apply preset */
  applyPreset: (preset: TextStylePreset) => void;
}

/**
 * Hook for managing text style state
 */
export function useTextStyle(options: UseTextStyleOptions = {}): UseTextStyleReturn {
  const { initialStyle, onStyleChange, persist = true } = options;

  // Load initial style from localStorage or use default
  const [style, setStyleState] = useState<TextStyle>(() => {
    if (persist) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_TEXT_STYLE, ...parsed, ...initialStyle };
        }
      } catch (error) {
        console.error('Failed to load text style from localStorage:', error);
      }
    }
    return { ...DEFAULT_TEXT_STYLE, ...initialStyle };
  });

  // Load custom presets from localStorage
  const [customPresets, setCustomPresets] = useState<TextStylePreset[]>(() => {
    if (persist) {
      try {
        const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load custom presets from localStorage:', error);
      }
    }
    return [];
  });

  // Persist style to localStorage
  useEffect(() => {
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(style));
      } catch (error) {
        console.error('Failed to save text style to localStorage:', error);
      }
    }
  }, [style, persist]);

  // Persist custom presets to localStorage
  useEffect(() => {
    if (persist) {
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
      } catch (error) {
        console.error('Failed to save custom presets to localStorage:', error);
      }
    }
  }, [customPresets, persist]);

  // Call onStyleChange callback (Requirement: 8.5 - real-time updates)
  useEffect(() => {
    if (onStyleChange) {
      onStyleChange(style);
    }
  }, [style, onStyleChange]);

  const setStyle = useCallback((newStyle: TextStyle) => {
    setStyleState(newStyle);
  }, []);

  const updateStyle = useCallback((updates: Partial<TextStyle>) => {
    setStyleState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetStyle = useCallback(() => {
    setStyleState({ ...DEFAULT_TEXT_STYLE, ...initialStyle });
  }, [initialStyle]);

  const savePreset = useCallback(
    (name: string) => {
      const newPreset: TextStylePreset = {
        id: `custom-${Date.now()}`,
        name,
        style: { ...style },
        isCustom: true,
      };

      setCustomPresets((prev) => [...prev, newPreset]);
    },
    [style]
  );

  const deletePreset = useCallback((id: string) => {
    setCustomPresets((prev) => prev.filter((preset) => preset.id !== id));
  }, []);

  const applyPreset = useCallback((preset: TextStylePreset) => {
    setStyleState((prev) => ({ ...prev, ...preset.style }));
  }, []);

  return {
    style,
    setStyle,
    updateStyle,
    resetStyle,
    customPresets,
    savePreset,
    deletePreset,
    applyPreset,
  };
}
