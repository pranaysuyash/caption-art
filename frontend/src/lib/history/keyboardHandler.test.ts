/**
 * Canvas History and Undo/Redo System - Keyboard Handler Tests
 * 
 * Property-based tests for keyboard shortcut handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import {
  isMac,
  isTextInput,
  isUndoShortcut,
  isRedoShortcut,
  registerKeyboardShortcuts,
  getShortcutText
} from './keyboardHandler'

describe('KeyboardHandler', () => {
  describe('Property 5: Keyboard shortcut consistency', () => {
    /**
     * Feature: canvas-history-undo-redo, Property 5: Keyboard shortcut consistency
     * Validates: Requirements 7.1, 7.2
     * 
     * For any platform (Windows/Mac), the appropriate keyboard shortcuts should be registered
     */
    it('should use correct modifier keys for each platform', () => {
      fc.assert(
        fc.property(
          // Generate random key combinations
          fc.record({
            key: fc.constantFrom('z', 'Z', 'y', 'Y'),
            ctrlKey: fc.boolean(),
            metaKey: fc.boolean(),
            shiftKey: fc.boolean(),
            altKey: fc.boolean()
          }),
          (keyConfig) => {
            // Create a mock keyboard event
            const event = new KeyboardEvent('keydown', keyConfig)
            
            const mac = isMac()
            
            // Test undo shortcut detection
            const isUndo = isUndoShortcut(event)
            
            if (mac) {
              // On Mac: Cmd+Z (no shift)
              const expectedUndo = event.metaKey && event.key.toLowerCase() === 'z' && !event.shiftKey
              expect(isUndo).toBe(expectedUndo)
            } else {
              // On Windows/Linux: Ctrl+Z (no shift)
              const expectedUndo = event.ctrlKey && event.key.toLowerCase() === 'z' && !event.shiftKey
              expect(isUndo).toBe(expectedUndo)
            }
            
            // Test redo shortcut detection
            const isRedo = isRedoShortcut(event)
            
            if (mac) {
              // On Mac: Cmd+Shift+Z
              const expectedRedo = event.metaKey && event.shiftKey && event.key.toLowerCase() === 'z'
              expect(isRedo).toBe(expectedRedo)
            } else {
              // On Windows/Linux: Ctrl+Y (no shift)
              const expectedRedo = event.ctrlKey && event.key.toLowerCase() === 'y' && !event.shiftKey
              expect(isRedo).toBe(expectedRedo)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return consistent shortcut text for the platform', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('undo', 'redo' as const),
          (action) => {
            const shortcutText = getShortcutText(action)
            const mac = isMac()
            
            if (action === 'undo') {
              if (mac) {
                expect(shortcutText).toBe('⌘Z')
              } else {
                expect(shortcutText).toBe('Ctrl+Z')
              }
            } else {
              if (mac) {
                expect(shortcutText).toBe('⌘⇧Z')
              } else {
                expect(shortcutText).toBe('Ctrl+Y')
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Platform detection', () => {
    it('should detect Mac platform correctly', () => {
      // This test depends on the actual platform
      const result = isMac()
      expect(typeof result).toBe('boolean')
      
      // Verify it matches the navigator platform
      if (typeof navigator !== 'undefined') {
        const expectedMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
        expect(result).toBe(expectedMac)
      }
    })
  })

  describe('Text input detection', () => {
    it('should detect text input elements', () => {
      // Test various input types
      const textInput = document.createElement('input')
      textInput.type = 'text'
      expect(isTextInput(textInput)).toBe(true)
      
      const passwordInput = document.createElement('input')
      passwordInput.type = 'password'
      expect(isTextInput(passwordInput)).toBe(true)
      
      const emailInput = document.createElement('input')
      emailInput.type = 'email'
      expect(isTextInput(emailInput)).toBe(true)
      
      const textarea = document.createElement('textarea')
      expect(isTextInput(textarea)).toBe(true)
    })

    it('should not detect non-text input elements', () => {
      const button = document.createElement('button')
      expect(isTextInput(button)).toBe(false)
      
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      expect(isTextInput(checkbox)).toBe(false)
      
      const radio = document.createElement('input')
      radio.type = 'radio'
      expect(isTextInput(radio)).toBe(false)
      
      const div = document.createElement('div')
      expect(isTextInput(div)).toBe(false)
    })

    it('should detect contenteditable elements', () => {
      const div = document.createElement('div')
      div.contentEditable = 'true'
      expect(isTextInput(div)).toBe(true)
    })

    it('should handle null element', () => {
      expect(isTextInput(null)).toBe(false)
    })
  })

  describe('Shortcut detection', () => {
    it('should detect undo shortcuts correctly', () => {
      const mac = isMac()
      
      if (mac) {
        // Mac: Cmd+Z
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true,
          shiftKey: false
        })
        expect(isUndoShortcut(event)).toBe(true)
      } else {
        // Windows/Linux: Ctrl+Z
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          shiftKey: false
        })
        expect(isUndoShortcut(event)).toBe(true)
      }
    })

    it('should detect redo shortcuts correctly', () => {
      const mac = isMac()
      
      if (mac) {
        // Mac: Cmd+Shift+Z
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true,
          shiftKey: true
        })
        expect(isRedoShortcut(event)).toBe(true)
      } else {
        // Windows/Linux: Ctrl+Y
        const event = new KeyboardEvent('keydown', {
          key: 'y',
          ctrlKey: true,
          shiftKey: false
        })
        expect(isRedoShortcut(event)).toBe(true)
      }
    })

    it('should not detect undo with shift key', () => {
      const mac = isMac()
      
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: true
      })
      
      expect(isUndoShortcut(event)).toBe(false)
    })

    it('should handle case-insensitive key detection', () => {
      const mac = isMac()
      
      // Test uppercase Z for undo
      const undoEvent = new KeyboardEvent('keydown', {
        key: 'Z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: false
      })
      expect(isUndoShortcut(undoEvent)).toBe(true)
      
      // Test uppercase Y for redo (Windows/Linux only)
      if (!mac) {
        const redoEvent = new KeyboardEvent('keydown', {
          key: 'Y',
          ctrlKey: true,
          shiftKey: false
        })
        expect(isRedoShortcut(redoEvent)).toBe(true)
      }
    })
  })

  describe('Keyboard shortcut registration', () => {
    let cleanup: (() => void) | null = null

    afterEach(() => {
      if (cleanup) {
        cleanup()
        cleanup = null
      }
    })

    it('should call onUndo when undo shortcut is pressed', () => {
      const onUndo = vi.fn()
      const onRedo = vi.fn()
      
      cleanup = registerKeyboardShortcuts({ onUndo, onRedo })
      
      const mac = isMac()
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: false,
        bubbles: true
      })
      
      window.dispatchEvent(event)
      
      expect(onUndo).toHaveBeenCalledTimes(1)
      expect(onRedo).not.toHaveBeenCalled()
    })

    it('should call onRedo when redo shortcut is pressed', () => {
      const onUndo = vi.fn()
      const onRedo = vi.fn()
      
      cleanup = registerKeyboardShortcuts({ onUndo, onRedo })
      
      const mac = isMac()
      const event = new KeyboardEvent('keydown', {
        key: mac ? 'z' : 'y',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: mac,
        bubbles: true
      })
      
      window.dispatchEvent(event)
      
      expect(onRedo).toHaveBeenCalledTimes(1)
      expect(onUndo).not.toHaveBeenCalled()
    })

    it('should not intercept shortcuts in text inputs', () => {
      const onUndo = vi.fn()
      const onRedo = vi.fn()
      
      cleanup = registerKeyboardShortcuts({ onUndo, onRedo })
      
      const input = document.createElement('input')
      input.type = 'text'
      document.body.appendChild(input)
      
      const mac = isMac()
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: false,
        bubbles: true
      })
      
      // Dispatch event with input as target
      Object.defineProperty(event, 'target', { value: input, enumerable: true })
      window.dispatchEvent(event)
      
      expect(onUndo).not.toHaveBeenCalled()
      
      document.body.removeChild(input)
    })

    it('should prevent default behavior when preventDefault is true', () => {
      const onUndo = vi.fn()
      const onRedo = vi.fn()
      
      cleanup = registerKeyboardShortcuts({ onUndo, onRedo, preventDefault: true })
      
      const mac = isMac()
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: false,
        bubbles: true,
        cancelable: true
      })
      
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      window.dispatchEvent(event)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should not prevent default behavior when preventDefault is false', () => {
      const onUndo = vi.fn()
      const onRedo = vi.fn()
      
      cleanup = registerKeyboardShortcuts({ onUndo, onRedo, preventDefault: false })
      
      const mac = isMac()
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: false,
        bubbles: true,
        cancelable: true
      })
      
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      window.dispatchEvent(event)
      
      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })

    it('should cleanup event listeners when cleanup function is called', () => {
      const onUndo = vi.fn()
      const onRedo = vi.fn()
      
      const cleanupFn = registerKeyboardShortcuts({ onUndo, onRedo })
      
      // Call cleanup
      cleanupFn()
      
      const mac = isMac()
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: false,
        bubbles: true
      })
      
      window.dispatchEvent(event)
      
      // Should not be called after cleanup
      expect(onUndo).not.toHaveBeenCalled()
      
      cleanup = null // Already cleaned up
    })
  })
})
