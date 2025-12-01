/**
 * Core types and interfaces for the Canvas Text Compositing Engine
 */

/**
 * Available text style presets
 */
export type StylePreset = 'neon' | 'magazine' | 'brush' | 'emboss';

/**
 * Transform properties for text positioning and manipulation
 */
export interface Transform {
  /** Position X coordinate (0-1 normalized) */
  x: number;
  /** Position Y coordinate (0-1 normalized) */
  y: number;
  /** Scale factor (0.5-3.0) */
  scale: number;
  /** Rotation in degrees (0-360) */
  rotation: number;
}

/**
 * Text layer configuration
 */
export interface TextLayer {
  /** Text content to render */
  text: string;
  /** Style preset to apply */
  preset: StylePreset;
  /** Font size in pixels */
  fontSize: number;
  /** Transform properties */
  transform: Transform;
}

/**
 * Canvas state management
 */
export interface CanvasState {
  /** Background image element */
  backgroundImage: HTMLImageElement | null;
  /** Subject mask image element (optional) */
  maskImage: HTMLImageElement | null;
  /** Text layer configuration */
  textLayer: TextLayer;
  /** Canvas element reference */
  canvasRef: HTMLCanvasElement | null;
  /** Loading state indicator */
  loading: boolean;
}
