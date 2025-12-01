/**
 * Canvas History and Undo/Redo System - History Manager
 * 
 * Manages undo/redo stacks and provides operations for state management.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2
 */

import { HistoryStack } from './historyStack'
import { CanvasState, HistoryEntry } from './types'
import { saveHistory, loadHistory, clearSavedHistory } from './persistence'

/**
 * Manages canvas history with undo/redo functionality.
 * Maintains two stacks: one for undo operations and one for redo operations.
 */
export class HistoryManager {
  private undoStack: HistoryStack
  private redoStack: HistoryStack
  private currentState: CanvasState | null = null
  private currentAction: string = ''
  private persistenceEnabled: boolean = true

  /**
   * Creates a new HistoryManager with the specified maximum history size
   * @param maxSize Maximum number of states to store in each stack (default: 50)
   * @param enablePersistence Whether to enable localStorage persistence (default: true)
   */
  constructor(maxSize: number = 50, enablePersistence: boolean = true) {
    this.undoStack = new HistoryStack(maxSize)
    this.redoStack = new HistoryStack(maxSize)
    this.persistenceEnabled = enablePersistence
    
    // Requirement 8.2: Load history on initialization
    if (this.persistenceEnabled) {
      this.loadFromStorage()
    }
  }

  /**
   * Saves a new state to the history.
   * Clears the redo stack as per Requirement 2.5.
   * Requirements: 1.5, 2.5, 8.1
   * 
   * @param action Description of the action that created this state
   * @param state The canvas state to save
   */
  saveState(action: string, state: CanvasState): void {
    // Deep clone the state to ensure immutability (Requirement 4.1-4.5)
    const clonedState = this.cloneState(state)
    
    // If there's a current state, push it to the undo stack with its action
    if (this.currentState !== null) {
      const entry: HistoryEntry = {
        id: this.generateId(),
        timestamp: Date.now(),
        action: this.currentAction,
        state: this.currentState
      }
      this.undoStack.push(entry)
    }
    
    // Update current state and action
    this.currentState = clonedState
    this.currentAction = action
    
    // Clear redo stack when a new change is made (Requirement 2.5)
    this.redoStack.clear()
    
    // Requirement 8.1: Save to localStorage
    if (this.persistenceEnabled) {
      this.saveToStorage()
    }
  }

  /**
   * Reverts to the previous state.
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1
   * 
   * @returns The previous canvas state, or null if no previous state exists
   */
  undo(): CanvasState | null {
    // Requirement 1.3: Return null if no previous state exists
    if (this.undoStack.isEmpty()) {
      return null
    }

    // Move current state to redo stack (Requirement 1.5)
    if (this.currentState !== null) {
      const redoEntry: HistoryEntry = {
        id: this.generateId(),
        timestamp: Date.now(),
        action: this.currentAction,
        state: this.currentState
      }
      this.redoStack.push(redoEntry)
    }

    // Pop the previous state from undo stack
    const previousEntry = this.undoStack.pop()!
    
    // Requirement 1.4: Restore all canvas properties
    this.currentState = this.cloneState(previousEntry.state)
    this.currentAction = previousEntry.action
    
    // Requirement 8.1: Save to localStorage
    if (this.persistenceEnabled) {
      this.saveToStorage()
    }
    
    return this.currentState
  }

  /**
   * Reapplies a previously undone state.
   * Requirements: 2.1, 2.2, 2.3, 2.4, 8.1
   * 
   * @returns The next canvas state, or null if no redo state exists
   */
  redo(): CanvasState | null {
    // Requirement 2.3: Return null if no redo state exists
    if (this.redoStack.isEmpty()) {
      return null
    }

    // Move current state to undo stack
    if (this.currentState !== null) {
      const undoEntry: HistoryEntry = {
        id: this.generateId(),
        timestamp: Date.now(),
        action: this.currentAction,
        state: this.currentState
      }
      this.undoStack.push(undoEntry)
    }

    // Pop the next state from redo stack
    const nextEntry = this.redoStack.pop()!
    
    // Requirement 2.4: Restore all canvas properties
    this.currentState = this.cloneState(nextEntry.state)
    this.currentAction = nextEntry.action
    
    // Requirement 8.1: Save to localStorage
    if (this.persistenceEnabled) {
      this.saveToStorage()
    }
    
    return this.currentState
  }

  /**
   * Checks if undo operation is available.
   * Requirement: 1.3
   * 
   * @returns true if there are states to undo
   */
  canUndo(): boolean {
    return !this.undoStack.isEmpty()
  }

  /**
   * Checks if redo operation is available.
   * Requirement: 2.3
   * 
   * @returns true if there are states to redo
   */
  canRedo(): boolean {
    return !this.redoStack.isEmpty()
  }

  /**
   * Clears all history except the current state.
   * Requirements: 6.2, 6.3, 6.4, 8.1
   * 
   * @returns void
   */
  clear(): void {
    this.undoStack.clear()
    this.redoStack.clear()
    
    // Requirement 8.1: Save to localStorage
    if (this.persistenceEnabled) {
      this.saveToStorage()
    }
  }

  /**
   * Returns the complete history of actions.
   * Requirement: 3.1
   * 
   * @returns Array of all history entries from the undo stack
   */
  getHistory(): HistoryEntry[] {
    return this.undoStack.getAll()
  }

  /**
   * Jumps to a specific state in the history.
   * Requirement: 3.5
   * 
   * @param entryId The ID of the history entry to jump to
   * @returns The canvas state at that point, or null if not found
   */
  jumpTo(entryId: string): CanvasState | null {
    const history = this.undoStack.getAll()
    const targetIndex = history.findIndex(entry => entry.id === entryId)
    
    if (targetIndex === -1) {
      return null
    }

    // Clear both stacks
    this.undoStack.clear()
    this.redoStack.clear()

    // Rebuild undo stack up to target
    for (let i = 0; i <= targetIndex; i++) {
      if (i < targetIndex) {
        this.undoStack.push(history[i])
      } else {
        // Set the target as current state
        this.currentState = this.cloneState(history[i].state)
      }
    }

    // Add remaining entries to redo stack (in reverse order)
    for (let i = history.length - 1; i > targetIndex; i--) {
      this.redoStack.push(history[i])
    }

    return this.currentState
  }

  /**
   * Gets the current canvas state.
   * 
   * @returns The current state, or null if no state has been saved
   */
  getCurrentState(): CanvasState | null {
    return this.currentState ? this.cloneState(this.currentState) : null
  }

  /**
   * Deep clones a canvas state to ensure immutability.
   * 
   * @param state The state to clone
   * @returns A deep copy of the state
   */
  private cloneState(state: CanvasState): CanvasState {
    return {
      imageObjUrl: state.imageObjUrl,
      maskUrl: state.maskUrl,
      text: state.text,
      preset: state.preset,
      fontSize: state.fontSize,
      captions: [...state.captions]
    }
  }

  /**
   * Generates a unique ID for history entries.
   * 
   * @returns A unique identifier string
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Saves the current history to localStorage.
   * Requirement 8.1: Save history stack on changes
   * 
   * @returns true if save was successful
   */
  private saveToStorage(): boolean {
    const result = saveHistory(
      this.undoStack.getAll(),
      this.redoStack.getAll(),
      this.currentState,
      this.currentAction
    )
    return result.success
  }

  /**
   * Loads history from localStorage.
   * Requirements: 8.2, 8.3, 8.4, 8.5
   * 
   * @returns true if load was successful
   */
  private loadFromStorage(): boolean {
    const result = loadHistory()
    
    if (!result.success || !result.data) {
      // Requirement 8.5: Start with empty history if invalid
      return false
    }

    // Requirement 8.4: Validate restored entries (done in loadHistory)
    // Restore the stacks
    this.undoStack.clear()
    this.redoStack.clear()
    
    for (const entry of result.data.undoStack) {
      this.undoStack.push(entry)
    }
    
    for (const entry of result.data.redoStack) {
      this.redoStack.push(entry)
    }
    
    this.currentState = result.data.currentState
    this.currentAction = result.data.currentAction
    
    return true
  }

  /**
   * Clears saved history from localStorage.
   * 
   * @returns true if clear was successful
   */
  clearStorage(): boolean {
    return clearSavedHistory()
  }

  /**
   * Enables or disables persistence.
   * 
   * @param enabled Whether persistence should be enabled
   */
  setPersistenceEnabled(enabled: boolean): void {
    this.persistenceEnabled = enabled
    
    if (!enabled) {
      // Clear storage when disabling persistence
      this.clearStorage()
    }
  }

  /**
   * Checks if persistence is enabled.
   * 
   * @returns true if persistence is enabled
   */
  isPersistenceEnabled(): boolean {
    return this.persistenceEnabled
  }
}
