/**
 * Keyboard Shortcuts Hook
 * Provides keyboard shortcut functionality for power users
 */

import { useEffect } from 'react'

interface ShortcutMap {
  [key: string]: (e?: KeyboardEvent) => void
}

/**
 * Hook to register keyboard shortcuts
 * @param shortcuts - Map of shortcut keys to handler functions
 * 
 * @example
 * useKeyboardShortcuts({
 *   'Ctrl+Z': handleUndo,
 *   'Ctrl+Shift+Z': handleRedo,
 *   'Ctrl+S': handleSave
 * })
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Ctrl+Z, Ctrl+Shift+Z, Ctrl+S even in inputs
        const allowedInInputs = ['Ctrl+Z', 'Ctrl+SHIFT+Z', 'Ctrl+S']
        const shortcutKey = buildShortcutKey(e)
        if (!allowedInInputs.includes(shortcutKey)) {
          return
        }
      }

      const shortcutKey = buildShortcutKey(e)
      
      // Check if shortcut exists
      if (shortcuts[shortcutKey]) {
        e.preventDefault()
        shortcuts[shortcutKey](e)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Build shortcut key string from keyboard event
 */
function buildShortcutKey(e: KeyboardEvent): string {
  const parts: string[] = []
  
  // Use Ctrl for both Ctrl and Cmd (Mac)
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')
  
  // Normalize key
  const key = e.key.toUpperCase()
  parts.push(key)
  
  return parts.join('+')
}
