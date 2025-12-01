/**
 * Canvas History and Undo/Redo System - Keyboard Handler
 * 
 * Manages keyboard shortcuts for undo/redo operations.
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

/**
 * Detects the current platform (Mac or Windows/Linux)
 * Requirement: 7.1, 7.2
 * 
 * @returns true if running on Mac, false otherwise
 */
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

/**
 * Checks if an element is a text input where shortcuts should be disabled
 * Requirement: 7.3
 * 
 * @param element The element to check
 * @returns true if the element is a text input
 */
export function isTextInput(element: Element | null): boolean {
  if (!element || !element.tagName) return false
  
  const tagName = element.tagName.toLowerCase()
  
  // Check for input elements (except buttons, checkboxes, etc.)
  if (tagName === 'input') {
    const inputType = (element as HTMLInputElement).type.toLowerCase()
    const textInputTypes = ['text', 'password', 'email', 'search', 'tel', 'url', 'number']
    return textInputTypes.includes(inputType)
  }
  
  // Check for textarea and contenteditable elements
  if (tagName === 'textarea') return true
  
  // Check if element is contenteditable
  const htmlElement = element as HTMLElement
  if (htmlElement.contentEditable === 'true' || htmlElement.isContentEditable) {
    return true
  }
  
  return false
}

/**
 * Checks if a keyboard event is an undo shortcut
 * Requirement: 7.1, 7.2
 * 
 * @param event The keyboard event
 * @returns true if the event is an undo shortcut
 */
export function isUndoShortcut(event: KeyboardEvent): boolean {
  const mac = isMac()
  const modifierKey = mac ? event.metaKey : event.ctrlKey
  
  // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
  return modifierKey && event.key.toLowerCase() === 'z' && !event.shiftKey
}

/**
 * Checks if a keyboard event is a redo shortcut
 * Requirement: 7.1, 7.2
 * 
 * @param event The keyboard event
 * @returns true if the event is a redo shortcut
 */
export function isRedoShortcut(event: KeyboardEvent): boolean {
  const mac = isMac()
  const modifierKey = mac ? event.metaKey : event.ctrlKey
  
  if (mac) {
    // Redo on Mac: Cmd+Shift+Z
    return modifierKey && event.shiftKey && event.key.toLowerCase() === 'z'
  } else {
    // Redo on Windows/Linux: Ctrl+Y
    return modifierKey && event.key.toLowerCase() === 'y' && !event.shiftKey
  }
}

/**
 * Callback function type for undo/redo operations
 */
export type UndoRedoCallback = () => void

/**
 * Options for keyboard shortcut registration
 */
export interface KeyboardHandlerOptions {
  /** Callback function to execute on undo */
  onUndo: UndoRedoCallback
  /** Callback function to execute on redo */
  onRedo: UndoRedoCallback
  /** Whether to prevent default browser behavior (default: true) */
  preventDefault?: boolean
}

/**
 * Registers keyboard shortcuts for undo/redo operations
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * @param options Configuration options for the keyboard handler
 * @returns A cleanup function to unregister the shortcuts
 */
export function registerKeyboardShortcuts(options: KeyboardHandlerOptions): () => void {
  const { onUndo, onRedo, preventDefault = true } = options
  
  const handleKeyDown = (event: KeyboardEvent) => {
    // Requirement 7.3: Don't intercept shortcuts in text inputs
    if (isTextInput(event.target as Element)) {
      return
    }
    
    // Check for undo shortcut
    if (isUndoShortcut(event)) {
      // Requirement 7.4: Prevent default browser behavior
      if (preventDefault) {
        event.preventDefault()
      }
      onUndo()
      return
    }
    
    // Check for redo shortcut
    if (isRedoShortcut(event)) {
      // Requirement 7.4: Prevent default browser behavior
      if (preventDefault) {
        event.preventDefault()
      }
      onRedo()
      return
    }
  }
  
  // Register the event listener
  window.addEventListener('keydown', handleKeyDown)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Gets the keyboard shortcut text for display in UI
 * Requirement: 7.1, 7.2
 * 
 * @param action The action ('undo' or 'redo')
 * @returns The keyboard shortcut text (e.g., "Ctrl+Z" or "Cmd+Z")
 */
export function getShortcutText(action: 'undo' | 'redo'): string {
  const mac = isMac()
  
  if (action === 'undo') {
    return mac ? '⌘Z' : 'Ctrl+Z'
  } else {
    return mac ? '⌘⇧Z' : 'Ctrl+Y'
  }
}
