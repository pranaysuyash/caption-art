import { StylePreset, Transform } from '../canvas/types';

/**
 * Template configuration defining layout and style
 */
export interface TemplateConfig {
  /** Style preset to apply */
  preset: StylePreset;
  /** Font size in pixels (base size, might be scaled) */
  fontSize: number;
  /** Transform properties (position, rotation, scale) */
  transform: Transform;
  /** Optional default text to show (e.g. "VOGUE") */
  text?: string;
}

/**
 * Template definition
 */
export interface Template {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Optional thumbnail URL */
  thumbnailUrl?: string;
  /** Template configuration */
  config: TemplateConfig;
}
