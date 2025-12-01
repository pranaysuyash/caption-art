/**
 * Canvas History and Undo/Redo System - Type Definitions
 */

/**
 * Style preset options for text rendering
 */
export type StylePreset = 'neon' | 'magazine' | 'brush' | 'emboss'

import { Transform } from '../canvas/types'

/**
 * Complete snapshot of the canvas state at a point in time
 */
export interface CanvasState {
  /** The uploaded image object URL */
  imageObjUrl: string
  /** The generated mask URL for text-behind-subject effect */
  maskUrl: string
  /** The text content displayed on the canvas */
  text: string
  /** The selected style preset */
  preset: StylePreset
  /** The font size for the text */
  fontSize: number
  /** Generated caption suggestions */
  captions: string[]
  /** Text transform properties */
  transform?: Transform
}

/**
 * A single entry in the history stack
 */
export interface HistoryEntry {
  /** Unique identifier for this history entry */
  id: string
  /** Timestamp when this state was saved */
  timestamp: number
  /** Description of the action that created this state */
  action: string
  /** The canvas state at this point in history */
  state: CanvasState
}
