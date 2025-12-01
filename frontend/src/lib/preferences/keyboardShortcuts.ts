/**
 * Keyboard Shortcut Management
 * 
 * Manages keyboard shortcuts including:
 * - Available shortcuts definition
 * - Shortcut registration
 * - Conflict detection
 * - Shortcut execution
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { DEFAULT_KEYBOARD_SHORTCUTS } from './defaults';

/**
 * Action that can be triggered by a keyboard shortcut
 */
export type ShortcutAction = 
  | 'export' | 'save'
  | 'undo' | 'redo' | 'copy' | 'paste' | 'delete'
  | 'zoomIn' | 'zoomOut' | 'resetZoom' | 'fitToScreen'
  | 'bold' | 'italic' | 'alignLeft' | 'alignCenter' | 'alignRight'
  | 'toggleSettings' | 'toggleHelp' | 'search';

/**
 * Shortcut handler function
 */
export type ShortcutHandler = (event?: KeyboardEvent) => void;

/**
 * Shortcut conflict information
 */
export interface ShortcutConflict {
  action: ShortcutAction;
  existingShortcut: string;
  newShortcut: string;
}

/**
 * Keyboard Shortcuts Manager
 * 
 * Manages keyboard shortcut registration, conflict detection, and execution.
 */
export class KeyboardShortcutsManager {
  private shortcuts: Map<ShortcutAction, string>;
  private handlers: Map<ShortcutAction, ShortcutHandler>;
  private listener: ((e: KeyboardEvent) => void) | null = null;

  constructor(initialShortcuts?: Record<string, string>) {
    this.shortcuts = new Map();
    this.handlers = new Map();
    
    // Initialize with provided shortcuts or defaults
    const shortcuts = initialShortcuts || DEFAULT_KEYBOARD_SHORTCUTS;
    for (const [action, shortcut] of Object.entries(shortcuts)) {
      this.shortcuts.set(action as ShortcutAction, shortcut);
    }
  }

  /**
   * Get all available shortcuts
   * Requirement 3.1: Display all available shortcuts
   */
  getAvailableShortcuts(): Record<ShortcutAction, string> {
    const result: Partial<Record<ShortcutAction, string>> = {};
    for (const [action, shortcut] of this.shortcuts.entries()) {
      result[action] = shortcut;
    }
    return result as Record<ShortcutAction, string>;
  }

  /**
   * Get shortcut for a specific action
   */
  getShortcut(action: ShortcutAction): string | undefined {
    return this.shortcuts.get(action);
  }

  /**
   * Register a new shortcut for an action
   * Requirement 3.2: Allow recording a new key combination
   * Requirement 3.3: Warn about conflicts and prevent assignment
   * Requirement 3.4: Update binding immediately
   * 
   * @returns null if successful, conflict information if there's a conflict
   */
  registerShortcut(action: ShortcutAction, shortcut: string): ShortcutConflict | null {
    // Check for conflicts
    const conflict = this.detectConflict(action, shortcut);
    if (conflict) {
      return conflict;
    }

    // Update the shortcut
    this.shortcuts.set(action, shortcut);
    
    return null;
  }

  /**
   * Detect if a shortcut conflicts with existing shortcuts
   * Requirement 3.3: Conflict detection
   * 
   * @returns conflict information if there's a conflict, null otherwise
   */
  detectConflict(action: ShortcutAction, shortcut: string): ShortcutConflict | null {
    // Normalize the shortcut for comparison
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    
    // Check if any other action uses this shortcut
    for (const [existingAction, existingShortcut] of this.shortcuts.entries()) {
      if (existingAction !== action && 
          this.normalizeShortcut(existingShortcut) === normalizedShortcut) {
        return {
          action: existingAction,
          existingShortcut,
          newShortcut: shortcut,
        };
      }
    }
    
    return null;
  }

  /**
   * Register a handler for a shortcut action
   * Requirement 3.5: Shortcut execution
   */
  registerHandler(action: ShortcutAction, handler: ShortcutHandler): void {
    this.handlers.set(action, handler);
  }

  /**
   * Unregister a handler for a shortcut action
   */
  unregisterHandler(action: ShortcutAction): void {
    this.handlers.delete(action);
  }

  /**
   * Start listening for keyboard events
   * Requirement 3.5: Shortcut execution
   */
  startListening(): void {
    if (this.listener) {
      return; // Already listening
    }

    this.listener = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (except for specific allowed shortcuts)
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow certain shortcuts even in inputs
        const allowedInInputs: ShortcutAction[] = ['undo', 'redo', 'save', 'copy', 'paste'];
        const action = this.findActionForEvent(event);
        if (!action || !allowedInInputs.includes(action)) {
          return;
        }
      }

      // Find the action for this keyboard event
      const action = this.findActionForEvent(event);
      if (action) {
        const handler = this.handlers.get(action);
        if (handler) {
          event.preventDefault();
          handler(event);
        }
      }
    };

    window.addEventListener('keydown', this.listener);
  }

  /**
   * Stop listening for keyboard events
   */
  stopListening(): void {
    if (this.listener) {
      window.removeEventListener('keydown', this.listener);
      this.listener = null;
    }
  }

  /**
   * Reset shortcuts to defaults
   * Requirement 3.5: Reset to default key bindings
   */
  resetToDefaults(): void {
    this.shortcuts.clear();
    for (const [action, shortcut] of Object.entries(DEFAULT_KEYBOARD_SHORTCUTS)) {
      this.shortcuts.set(action as ShortcutAction, shortcut);
    }
  }

  /**
   * Find the action that matches a keyboard event
   */
  private findActionForEvent(event: KeyboardEvent): ShortcutAction | null {
    const eventShortcut = this.buildShortcutFromEvent(event);
    const normalizedEvent = this.normalizeShortcut(eventShortcut);

    for (const [action, shortcut] of this.shortcuts.entries()) {
      if (this.normalizeShortcut(shortcut) === normalizedEvent) {
        return action;
      }
    }

    return null;
  }

  /**
   * Build a shortcut string from a keyboard event
   */
  private buildShortcutFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];

    // Use Ctrl for both Ctrl and Cmd (Mac)
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');

    // Add the key
    parts.push(event.key);

    return parts.join('+');
  }

  /**
   * Normalize a shortcut string for comparison
   * Handles case-insensitivity and modifier order
   */
  private normalizeShortcut(shortcut: string): string {
    const parts = shortcut.split('+').map(p => p.trim());
    
    // Separate modifiers and key
    const modifiers: string[] = [];
    let key = '';
    
    for (const part of parts) {
      const upper = part.toUpperCase();
      if (upper === 'CTRL' || upper === 'SHIFT' || upper === 'ALT' || upper === 'META') {
        // Normalize Meta to Ctrl for consistency
        modifiers.push(upper === 'META' ? 'CTRL' : upper);
      } else {
        key = upper;
      }
    }
    
    // Sort modifiers for consistent comparison
    modifiers.sort();
    
    // Rebuild the shortcut
    return [...modifiers, key].join('+');
  }

  /**
   * Export shortcuts as a plain object
   */
  exportShortcuts(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [action, shortcut] of this.shortcuts.entries()) {
      result[action] = shortcut;
    }
    return result;
  }
}

/**
 * Create a keyboard shortcuts manager instance
 */
export function createKeyboardShortcutsManager(
  shortcuts?: Record<string, string>
): KeyboardShortcutsManager {
  return new KeyboardShortcutsManager(shortcuts);
}
