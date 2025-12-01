/**
 * Canvas History and Undo/Redo System - Auto Save Logic
 * 
 * Manages automatic state saving with debouncing for text and transform changes,
 * and immediate saving for preset, image upload, and mask generation.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { HistoryManager } from './historyManager'
import { CanvasState } from './types'

/**
 * Configuration for auto-save behavior
 */
export interface AutoSaveConfig {
  /** Debounce delay for text changes in milliseconds (default: 500ms) */
  textDebounceMs?: number
  /** Debounce delay for transform changes in milliseconds (default: 500ms) */
  transformDebounceMs?: number
  /** Whether to enable auto-save (default: true) */
  enabled?: boolean
}

/**
 * Manages automatic state saving with appropriate debouncing
 */
export class AutoSaveManager {
  private historyManager: HistoryManager
  private config: Required<AutoSaveConfig>
  private textDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private transformDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private lastSavedState: string | null = null

  /**
   * Creates a new AutoSaveManager
   * @param historyManager The history manager to save states to
   * @param config Configuration for auto-save behavior
   */
  constructor(historyManager: HistoryManager, config: AutoSaveConfig = {}) {
    this.historyManager = historyManager
    this.config = {
      textDebounceMs: config.textDebounceMs ?? 500,
      transformDebounceMs: config.transformDebounceMs ?? 500,
      enabled: config.enabled ?? true,
    }
  }

  /**
   * Saves state for text changes with debouncing.
   * Requirement 4.1: WHEN text content changes THEN the History System SHALL save a new state after 500ms of inactivity
   * 
   * @param state The current canvas state
   */
  saveTextChange(state: CanvasState): void {
    if (!this.config.enabled) return

    // Clear existing timer
    if (this.textDebounceTimer) {
      clearTimeout(this.textDebounceTimer)
    }

    // Set new timer to save after debounce period
    this.textDebounceTimer = setTimeout(() => {
      this.saveIfChanged(state, 'Text change')
      this.textDebounceTimer = null
    }, this.config.textDebounceMs)
  }

  /**
   * Saves state for preset changes immediately.
   * Requirement 4.2: WHEN a style preset changes THEN the History System SHALL save a new state immediately
   * 
   * @param state The current canvas state
   */
  savePresetChange(state: CanvasState): void {
    if (!this.config.enabled) return

    // Cancel any pending text/transform saves since preset change is more significant
    this.cancelPendingSaves()
    
    this.saveIfChanged(state, 'Preset change')
  }

  /**
   * Saves state for transform changes with debouncing.
   * Requirement 4.3: WHEN transform values change THEN the History System SHALL save a new state after 500ms of inactivity
   * 
   * @param state The current canvas state
   */
  saveTransformChange(state: CanvasState): void {
    if (!this.config.enabled) return

    // Clear existing timer
    if (this.transformDebounceTimer) {
      clearTimeout(this.transformDebounceTimer)
    }

    // Set new timer to save after debounce period
    this.transformDebounceTimer = setTimeout(() => {
      this.saveIfChanged(state, 'Transform change')
      this.transformDebounceTimer = null
    }, this.config.transformDebounceMs)
  }

  /**
   * Saves state for image upload immediately.
   * Requirement 4.4: WHEN an image is uploaded THEN the History System SHALL save a new state immediately
   * 
   * @param state The current canvas state
   */
  saveImageUpload(state: CanvasState): void {
    if (!this.config.enabled) return

    // Cancel any pending saves since image upload is a major change
    this.cancelPendingSaves()
    
    this.saveIfChanged(state, 'Image upload')
  }

  /**
   * Saves state for mask generation immediately.
   * Requirement 4.5: WHEN a mask is generated THEN the History System SHALL save a new state immediately
   * 
   * @param state The current canvas state
   */
  saveMaskGeneration(state: CanvasState): void {
    if (!this.config.enabled) return

    // Cancel any pending saves since mask generation is a major change
    this.cancelPendingSaves()
    
    this.saveIfChanged(state, 'Mask generation')
  }

  /**
   * Enables or disables auto-save
   * @param enabled Whether auto-save should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    
    if (!enabled) {
      this.cancelPendingSaves()
    }
  }

  /**
   * Cancels all pending debounced saves
   */
  cancelPendingSaves(): void {
    if (this.textDebounceTimer) {
      clearTimeout(this.textDebounceTimer)
      this.textDebounceTimer = null
    }
    
    if (this.transformDebounceTimer) {
      clearTimeout(this.transformDebounceTimer)
      this.transformDebounceTimer = null
    }
  }

  /**
   * Cleans up timers on destruction
   */
  destroy(): void {
    this.cancelPendingSaves()
  }

  /**
   * Saves state only if it has changed from the last saved state.
   * This prevents duplicate history entries for the same state.
   * 
   * @param state The current canvas state
   * @param action Description of the action
   */
  private saveIfChanged(state: CanvasState, action: string): void {
    // Serialize state to compare with last saved state
    const stateKey = this.serializeState(state)
    
    // Only save if state has actually changed
    if (stateKey !== this.lastSavedState) {
      this.historyManager.saveState(action, state)
      this.lastSavedState = stateKey
    }
  }

  /**
   * Serializes a canvas state to a string for comparison
   * @param state The state to serialize
   * @returns A string representation of the state
   */
  private serializeState(state: CanvasState): string {
    return JSON.stringify({
      imageObjUrl: state.imageObjUrl,
      maskUrl: state.maskUrl,
      text: state.text,
      preset: state.preset,
      fontSize: state.fontSize,
      captions: state.captions,
    })
  }
}
