/**
 * Text Module - Advanced text editing features
 * Exports all text-related functionality for easy importing
 */

// Multi-line text rendering
export { MultiLineRenderer } from './multiLineRenderer';
export type { MultiLineConfig, TextBounds } from './multiLineRenderer';

// Text alignment
export { AlignmentManager } from './alignmentManager';
export type { TextAlignment, AlignmentConfig, AlignmentResult } from './alignmentManager';

// Custom font loading
export { FontManager, loadCustomFont, validateFontFile } from './fontLoader';
export type { LoadedFont, FontLoadResult } from './fontLoader';

// Text effects
export { TextEffectsRenderer, createDefaultEffects } from './textEffects';
export type {
  GradientType,
  ColorStop,
  OutlineEffect,
  GradientEffect,
  PatternEffect,
  TextEffects,
  TextEffectBounds,
} from './textEffects';

// Preset management
export { PresetManager } from './presetManager';
export type { PresetData, Preset } from './presetManager';

// Advanced text renderer (integrates all features)
export { AdvancedTextRenderer } from './advancedTextRenderer';
export type { AdvancedTextConfig } from './advancedTextRenderer';
