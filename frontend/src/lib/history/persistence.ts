/**
 * Canvas History and Undo/Redo System - Persistence Module
 *
 * Handles saving and loading history to/from localStorage.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { HistoryEntry, CanvasState } from './types';
import { safeLocalStorage } from '../storage/safeLocalStorage';

const STORAGE_KEY = 'canvas-history';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

/**
 * Serialized history data structure for localStorage
 */
export interface SerializedHistory {
  version: number;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  currentState: CanvasState | null;
  currentAction: string;
  timestamp: number;
}

/**
 * Result of a save operation
 */
export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * Result of a load operation
 */
export interface LoadResult {
  success: boolean;
  data?: SerializedHistory;
  error?: string;
}

/**
 * Saves history data to localStorage.
 * Requirement 8.1: Save history stack on changes
 * Requirement 8.3: Limit history to fit available space
 *
 * @param undoStack Array of undo history entries
 * @param redoStack Array of redo history entries
 * @param currentState Current canvas state
 * @param currentAction Current action description
 * @returns SaveResult indicating success or failure
 */
export function saveHistory(
  undoStack: HistoryEntry[],
  redoStack: HistoryEntry[],
  currentState: CanvasState | null,
  currentAction: string
): SaveResult {
  try {
    const data: SerializedHistory = {
      version: 1,
      undoStack,
      redoStack,
      currentState,
      currentAction,
      timestamp: Date.now(),
    };

    const serialized = JSON.stringify(data);

    // Requirement 8.3: Check if data fits in storage
    if (serialized.length > MAX_STORAGE_SIZE) {
      // Try to trim history to fit
      const trimmedData = trimHistoryToFit(data, MAX_STORAGE_SIZE);
      const trimmedSerialized = JSON.stringify(trimmedData);

      if (trimmedSerialized.length > MAX_STORAGE_SIZE) {
        return {
          success: false,
          error: 'History too large to store even after trimming',
        };
      }

      safeLocalStorage.setItem(STORAGE_KEY, trimmedSerialized);
      return { success: true };
    }

    // Requirement 8.1: Save to localStorage
    safeLocalStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (error) {
    // Handle QuotaExceededError and other storage errors
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Unknown error saving history',
    };
  }
}

/**
 * Loads history data from localStorage.
 * Requirement 8.2: Restore history stack from localStorage
 * Requirement 8.4: Validate all entries are still valid
 * Requirement 8.5: Start with empty history if invalid
 *
 * @returns LoadResult with history data or error
 */
export function loadHistory(): LoadResult {
  try {
    const serialized = safeLocalStorage.getItem(STORAGE_KEY);

    if (!serialized) {
      return {
        success: false,
        error: 'No saved history found',
      };
    }

    const data = JSON.parse(serialized) as SerializedHistory;

    // Requirement 8.4: Validate restored entries
    if (!isValidHistory(data)) {
      // Requirement 8.5: Start with empty history if invalid
      return {
        success: false,
        error: 'Invalid history data',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    // Requirement 8.5: Start with empty history on error
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Unknown error loading history',
    };
  }
}

/**
 * Clears saved history from localStorage.
 *
 * @returns true if successful
 */
export function clearSavedHistory(): boolean {
  try {
    safeLocalStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates that history data has the correct structure.
 * Requirement 8.4: Validate all entries are still valid
 *
 * @param data The deserialized history data
 * @returns true if data is valid
 */
function isValidHistory(data: any): data is SerializedHistory {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check version
  if (typeof data.version !== 'number' || data.version !== 1) {
    return false;
  }

  // Check stacks are arrays
  if (!Array.isArray(data.undoStack) || !Array.isArray(data.redoStack)) {
    return false;
  }

  // Check timestamp
  if (typeof data.timestamp !== 'number') {
    return false;
  }

  // Check current action
  if (typeof data.currentAction !== 'string') {
    return false;
  }

  // Validate current state (can be null)
  if (data.currentState !== null && !isValidCanvasState(data.currentState)) {
    return false;
  }

  // Validate all entries in both stacks
  for (const entry of data.undoStack) {
    if (!isValidHistoryEntry(entry)) {
      return false;
    }
  }

  for (const entry of data.redoStack) {
    if (!isValidHistoryEntry(entry)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a single history entry.
 *
 * @param entry The entry to validate
 * @returns true if entry is valid
 */
function isValidHistoryEntry(entry: any): entry is HistoryEntry {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  if (typeof entry.id !== 'string' || !entry.id) {
    return false;
  }

  if (typeof entry.timestamp !== 'number') {
    return false;
  }

  if (typeof entry.action !== 'string') {
    return false;
  }

  if (!isValidCanvasState(entry.state)) {
    return false;
  }

  return true;
}

/**
 * Validates a canvas state object.
 *
 * @param state The state to validate
 * @returns true if state is valid
 */
function isValidCanvasState(state: any): state is CanvasState {
  if (!state || typeof state !== 'object') {
    return false;
  }

  if (typeof state.imageObjUrl !== 'string') {
    return false;
  }

  if (typeof state.maskUrl !== 'string') {
    return false;
  }

  if (typeof state.text !== 'string') {
    return false;
  }

  if (typeof state.preset !== 'string') {
    return false;
  }

  if (typeof state.fontSize !== 'number') {
    return false;
  }

  if (!Array.isArray(state.captions)) {
    return false;
  }

  // Validate all captions are strings
  for (const caption of state.captions) {
    if (typeof caption !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Trims history data to fit within size limit.
 * Removes oldest entries first.
 * Requirement 8.3: Limit history to fit available space
 *
 * @param data The history data to trim
 * @param maxSize Maximum size in bytes
 * @returns Trimmed history data
 */
function trimHistoryToFit(
  data: SerializedHistory,
  maxSize: number
): SerializedHistory {
  const trimmed = { ...data };

  // Keep removing oldest entries until we fit
  while (JSON.stringify(trimmed).length > maxSize) {
    // Remove from undo stack first (oldest entries)
    if (trimmed.undoStack.length > 0) {
      trimmed.undoStack.shift();
    } else if (trimmed.redoStack.length > 0) {
      // If undo stack is empty, remove from redo stack
      trimmed.redoStack.shift();
    } else {
      // If both stacks are empty, we can't trim further
      break;
    }
  }

  return trimmed;
}

/**
 * Gets the size of saved history in bytes.
 *
 * @returns Size in bytes, or 0 if no history saved
 */
export function getSavedHistorySize(): number {
  try {
    const serialized = safeLocalStorage.getItem(STORAGE_KEY);
    return serialized ? serialized.length : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Checks if localStorage is available and working.
 *
 * @returns true if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    safeLocalStorage.setItem(test, test);
    safeLocalStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}
