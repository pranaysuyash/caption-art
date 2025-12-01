/**
 * Canvas History and Undo/Redo System
 * 
 * This module provides history management for canvas state changes,
 * enabling undo/redo functionality with keyboard shortcuts and persistence.
 */

export type { CanvasState, HistoryEntry, StylePreset } from './types'
export { HistoryManager } from './historyManager'
export { HistoryStack } from './historyStack'
export { serialize, deserialize, calculateDiff, applyDiff } from './stateSerializer'
export type { StateDiff } from './stateSerializer'
export { AutoSaveManager } from './autoSave'
export type { AutoSaveConfig } from './autoSave'
export {
  isMac,
  isTextInput,
  isUndoShortcut,
  isRedoShortcut,
  registerKeyboardShortcuts,
  getShortcutText
} from './keyboardHandler'
export type { UndoRedoCallback, KeyboardHandlerOptions } from './keyboardHandler'
export {
  saveHistory,
  loadHistory,
  clearSavedHistory,
  getSavedHistorySize,
  isStorageAvailable
} from './persistence'
export type { SerializedHistory, SaveResult, LoadResult } from './persistence'
