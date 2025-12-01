/**
 * Canvas History and Undo/Redo System - Integration Tests
 * 
 * End-to-end integration tests for the complete history system
 * Tests: 13.1, 13.2, 13.3, 13.4, 13.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HistoryManager } from './historyManager'
import { AutoSaveManager } from './autoSave'
import { registerKeyboardShortcuts, isMac } from './keyboardHandler'
import { CanvasState } from './types'

describe('History System Integration Tests', () => {
  let historyManager: HistoryManager
  let autoSaveManager: AutoSaveManager
  let keyboardCleanup: (() => void) | null = null

  const createTestState = (text: string = 'test', preset: CanvasState['preset'] = 'neon'): CanvasState => ({
    imageObjUrl: `image-${text}.jpg`,
    maskUrl: `mask-${text}.png`,
    text,
    preset,
    fontSize: 48,
    captions: []
  })

  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (autoSaveManager) {
      autoSaveManager.destroy()
    }
    if (keyboardCleanup) {
      keyboardCleanup()
      keyboardCleanup = null
    }
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('13.1 Test undo/redo functionality', () => {
    it('should perform complete undo/redo cycle with multiple states', () => {
      historyManager = new HistoryManager(50, false)
      
      const state1 = createTestState('First')
      const state2 = createTestState('Second')
      const state3 = createTestState('Third')
      
      // Save states
      historyManager.saveState('Initial state', state1)
      historyManager.saveState('Second state', state2)
      historyManager.saveState('Third state', state3)
      
      // Verify current state
      expect(historyManager.getCurrentState()?.text).toBe('Third')
      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(false)
      
      // Undo to second state
      const undone1 = historyManager.undo()
      expect(undone1?.text).toBe('Second')
      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(true)
      
      // Undo to first state
      const undone2 = historyManager.undo()
      expect(undone2?.text).toBe('First')
      expect(historyManager.canUndo()).toBe(false)
      expect(historyManager.canRedo()).toBe(true)
      
      // Redo to second state
      const redone1 = historyManager.redo()
      expect(redone1?.text).toBe('Second')
      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(true)
      
      // Redo to third state
      const redone2 = historyManager.redo()
      expect(redone2?.text).toBe('Third')
      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(false)
    })

    it('should clear redo stack when making new change after undo', () => {
      historyManager = new HistoryManager(50, false)
      
      const state1 = createTestState('First')
      const state2 = createTestState('Second')
      const state3 = createTestState('Third')
      const state4 = createTestState('Fourth')
      
      // Save initial states
      historyManager.saveState('state1', state1)
      historyManager.saveState('state2', state2)
      historyManager.saveState('state3', state3)
      
      // Undo twice
      historyManager.undo()
      historyManager.undo()
      
      expect(historyManager.canRedo()).toBe(true)
      
      // Make new change
      historyManager.saveState('state4', state4)
      
      // Redo should no longer be available
      expect(historyManager.canRedo()).toBe(false)
      expect(historyManager.redo()).toBeNull()
    })

    it('should handle undo/redo at boundaries', () => {
      historyManager = new HistoryManager(50, false)
      
      const state = createTestState('Only state')
      historyManager.saveState('single', state)
      
      // Cannot undo from initial state
      expect(historyManager.canUndo()).toBe(false)
      expect(historyManager.undo()).toBeNull()
      
      // Cannot redo when no redo stack
      expect(historyManager.canRedo()).toBe(false)
      expect(historyManager.redo()).toBeNull()
    })

    it('should maintain state integrity through multiple undo/redo cycles', () => {
      historyManager = new HistoryManager(50, false)
      
      const states = [
        createTestState('State 1', 'neon'),
        createTestState('State 2', 'magazine'),
        createTestState('State 3', 'brush'),
        createTestState('State 4', 'emboss'),
      ]
      
      // Save all states
      states.forEach((state, i) => {
        historyManager.saveState(`action-${i}`, state)
      })
      
      // Undo all
      for (let i = 0; i < 3; i++) {
        historyManager.undo()
      }
      
      // Redo all
      for (let i = 0; i < 3; i++) {
        historyManager.redo()
      }
      
      // Should be back at the last state
      const current = historyManager.getCurrentState()
      expect(current?.text).toBe('State 4')
      expect(current?.preset).toBe('emboss')
    })
  })

  describe('13.2 Test keyboard shortcuts', () => {
    it('should trigger undo on keyboard shortcut', () => {
      historyManager = new HistoryManager(50, false)
      const onUndo = vi.fn()
      const onRedo = vi.fn()
      
      keyboardCleanup = registerKeyboardShortcuts({ onUndo, onRedo, preventDefault: true })
      
      const mac = isMac()
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: false,
        bubbles: true,
        cancelable: true
      })
      
      window.dispatchEvent(event)
      
      expect(onUndo).toHaveBeenCalledTimes(1)
      expect(onRedo).not.toHaveBeenCalled()
    })

    it('should trigger redo on keyboard shortcut', () => {
      historyManager = new HistoryManager(50, false)
      const onUndo = vi.fn()
      const onRedo = vi.fn()
      
      keyboardCleanup = registerKeyboardShortcuts({ onUndo, onRedo, preventDefault: true })
      
      const mac = isMac()
      const event = new KeyboardEvent('keydown', {
        key: mac ? 'z' : 'y',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: mac,
        bubbles: true,
        cancelable: true
      })
      
      window.dispatchEvent(event)
      
      expect(onRedo).toHaveBeenCalledTimes(1)
      expect(onUndo).not.toHaveBeenCalled()
    })

    it('should not trigger shortcuts in text inputs', () => {
      historyManager = new HistoryManager(50, false)
      const onUndo = vi.fn()
      const onRedo = vi.fn()
      
      keyboardCleanup = registerKeyboardShortcuts({ onUndo, onRedo })
      
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
      
      Object.defineProperty(event, 'target', { value: input, enumerable: true })
      window.dispatchEvent(event)
      
      expect(onUndo).not.toHaveBeenCalled()
      
      document.body.removeChild(input)
    })

    it('should integrate keyboard shortcuts with history manager', () => {
      historyManager = new HistoryManager(50, false)
      
      const state1 = createTestState('First')
      const state2 = createTestState('Second')
      
      historyManager.saveState('state1', state1)
      historyManager.saveState('state2', state2)
      
      const onUndo = vi.fn(() => {
        historyManager.undo()
      })
      const onRedo = vi.fn(() => {
        historyManager.redo()
      })
      
      keyboardCleanup = registerKeyboardShortcuts({ onUndo, onRedo })
      
      // Trigger undo via keyboard
      const mac = isMac()
      const undoEvent = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: false,
        bubbles: true
      })
      
      window.dispatchEvent(undoEvent)
      
      expect(onUndo).toHaveBeenCalled()
      expect(historyManager.getCurrentState()?.text).toBe('First')
      
      // Trigger redo via keyboard
      const redoEvent = new KeyboardEvent('keydown', {
        key: mac ? 'z' : 'y',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: mac,
        bubbles: true
      })
      
      window.dispatchEvent(redoEvent)
      
      expect(onRedo).toHaveBeenCalled()
      expect(historyManager.getCurrentState()?.text).toBe('Second')
    })
  })

  describe('13.3 Test history persistence', () => {
    it('should persist history across manager instances', () => {
      // Create first manager with persistence enabled
      const manager1 = new HistoryManager(50, true)
      
      const state1 = createTestState('Persisted 1')
      const state2 = createTestState('Persisted 2')
      
      manager1.saveState('action1', state1)
      manager1.saveState('action2', state2)
      manager1.undo()
      
      // Verify state before creating new manager
      expect(manager1.getCurrentState()?.text).toBe('Persisted 1')
      expect(manager1.canRedo()).toBe(true)
      
      // Create new manager - should load from localStorage
      const manager2 = new HistoryManager(50, true)
      
      // Should have restored the state
      expect(manager2.getCurrentState()?.text).toBe('Persisted 1')
      expect(manager2.canUndo()).toBe(false)
      expect(manager2.canRedo()).toBe(true)
      
      // Redo should work
      const redone = manager2.redo()
      expect(redone?.text).toBe('Persisted 2')
    })

    it('should handle localStorage being full', () => {
      const manager = new HistoryManager(50, true)
      
      // Create very large states
      const largeStates = Array.from({ length: 100 }, (_, i) => {
        const state = createTestState(`Large ${i}`)
        state.text = 'x'.repeat(10000) // Large text
        return state
      })
      
      // Save all states - should handle gracefully
      largeStates.forEach((state, i) => {
        manager.saveState(`action-${i}`, state)
      })
      
      // Manager should still function
      expect(manager.canUndo()).toBe(true)
      const undone = manager.undo()
      expect(undone).not.toBeNull()
    })

    it('should clear localStorage when persistence is disabled', () => {
      // Enable persistence and save
      const manager = new HistoryManager(50, true)
      const state = createTestState('Test')
      manager.saveState('action', state)
      
      expect(localStorage.getItem('canvas-history')).not.toBeNull()
      
      // Disable persistence
      manager.setPersistenceEnabled(false)
      
      // localStorage should be cleared
      expect(localStorage.getItem('canvas-history')).toBeNull()
    })

    it('should handle corrupted localStorage data', () => {
      // Put invalid data in localStorage
      localStorage.setItem('canvas-history', 'invalid json{')
      
      // Create manager - should start fresh
      const manager = new HistoryManager(50, true)
      
      expect(manager.canUndo()).toBe(false)
      expect(manager.getCurrentState()).toBeNull()
      
      // Should still be able to save new states
      const state = createTestState('New')
      manager.saveState('action', state)
      expect(manager.getCurrentState()?.text).toBe('New')
    })
  })

  describe('13.4 Test auto-save triggers', () => {
    beforeEach(() => {
      historyManager = new HistoryManager(50, false)
      autoSaveManager = new AutoSaveManager(historyManager, {
        textDebounceMs: 100,
        transformDebounceMs: 100,
      })
    })

    it('should debounce text changes and save after inactivity', () => {
      const state1 = createTestState('Hello')
      const state2 = createTestState('Hello World')
      const state3 = createTestState('Hello World!')
      
      // Rapid text changes
      autoSaveManager.saveTextChange(state1)
      vi.advanceTimersByTime(50)
      autoSaveManager.saveTextChange(state2)
      vi.advanceTimersByTime(50)
      autoSaveManager.saveTextChange(state3)
      
      // Should not have saved yet
      expect(historyManager.getCurrentState()).toBeNull()
      
      // Advance past debounce period
      vi.advanceTimersByTime(100)
      
      // Should have saved the last state
      expect(historyManager.getCurrentState()?.text).toBe('Hello World!')
    })

    it('should save preset changes immediately', () => {
      const state = createTestState('Test', 'magazine')
      
      autoSaveManager.savePresetChange(state)
      
      // Should save immediately without waiting
      expect(historyManager.getCurrentState()?.preset).toBe('magazine')
    })

    it('should debounce transform changes', () => {
      const state1 = createTestState('Transform 1')
      const state2 = createTestState('Transform 2')
      
      autoSaveManager.saveTransformChange(state1)
      vi.advanceTimersByTime(50)
      autoSaveManager.saveTransformChange(state2)
      
      // Should not have saved yet
      expect(historyManager.getCurrentState()).toBeNull()
      
      // Advance past debounce
      vi.advanceTimersByTime(100)
      
      // Should have saved
      expect(historyManager.getCurrentState()?.text).toBe('Transform 2')
    })

    it('should save image upload immediately', () => {
      const state = createTestState('Image')
      state.imageObjUrl = 'new-image.jpg'
      
      autoSaveManager.saveImageUpload(state)
      
      // Should save immediately
      expect(historyManager.getCurrentState()?.imageObjUrl).toBe('new-image.jpg')
    })

    it('should save mask generation immediately', () => {
      const state = createTestState('Mask')
      state.maskUrl = 'new-mask.png'
      
      autoSaveManager.saveMaskGeneration(state)
      
      // Should save immediately
      expect(historyManager.getCurrentState()?.maskUrl).toBe('new-mask.png')
    })

    it('should cancel pending saves when immediate save occurs', () => {
      const textState = createTestState('Text')
      const presetState = createTestState('Preset', 'brush')
      
      // Start text change
      autoSaveManager.saveTextChange(textState)
      
      // Immediately change preset
      autoSaveManager.savePresetChange(presetState)
      
      // Advance timers
      vi.advanceTimersByTime(200)
      
      // Should only have preset change
      expect(historyManager.getCurrentState()?.preset).toBe('brush')
      expect(historyManager.canUndo()).toBe(false) // Only one save occurred
    })

    it('should integrate auto-save with undo/redo', () => {
      // Save via auto-save
      const state1 = createTestState('Auto 1')
      autoSaveManager.savePresetChange(state1)
      
      const state2 = createTestState('Auto 2')
      autoSaveManager.savePresetChange(state2)
      
      // Should be able to undo
      expect(historyManager.canUndo()).toBe(true)
      const undone = historyManager.undo()
      expect(undone?.text).toBe('Auto 1')
      
      // Should be able to redo
      expect(historyManager.canRedo()).toBe(true)
      const redone = historyManager.redo()
      expect(redone?.text).toBe('Auto 2')
    })
  })

  describe('13.5 Test clear history', () => {
    it('should clear all history and disable undo/redo', () => {
      historyManager = new HistoryManager(50, false)
      
      const state1 = createTestState('First')
      const state2 = createTestState('Second')
      const state3 = createTestState('Third')
      
      historyManager.saveState('state1', state1)
      historyManager.saveState('state2', state2)
      historyManager.saveState('state3', state3)
      historyManager.undo()
      
      // Verify history exists
      expect(historyManager.canUndo()).toBe(true)
      expect(historyManager.canRedo()).toBe(true)
      
      // Clear history
      historyManager.clear()
      
      // Should have no undo/redo available
      expect(historyManager.canUndo()).toBe(false)
      expect(historyManager.canRedo()).toBe(false)
      expect(historyManager.undo()).toBeNull()
      expect(historyManager.redo()).toBeNull()
    })

    it('should keep current state after clearing', () => {
      historyManager = new HistoryManager(50, false)
      
      const state1 = createTestState('First')
      const state2 = createTestState('Second')
      
      historyManager.saveState('state1', state1)
      historyManager.saveState('state2', state2)
      
      const currentBefore = historyManager.getCurrentState()
      
      historyManager.clear()
      
      const currentAfter = historyManager.getCurrentState()
      
      // Current state should be preserved
      expect(currentAfter?.text).toBe(currentBefore?.text)
    })

    it('should allow new saves after clearing', () => {
      historyManager = new HistoryManager(50, false)
      
      const state1 = createTestState('Before clear')
      historyManager.saveState('state1', state1)
      
      historyManager.clear()
      
      // Current state is preserved after clear
      expect(historyManager.getCurrentState()?.text).toBe('Before clear')
      
      // Should be able to save new states
      const state2 = createTestState('After clear')
      historyManager.saveState('state2', state2)
      
      expect(historyManager.getCurrentState()?.text).toBe('After clear')
      // After clear, the preserved state becomes the first undo entry when we save a new state
      expect(historyManager.canUndo()).toBe(true)
      
      // Undo should go back to the state that was current when we cleared
      const undone = historyManager.undo()
      expect(undone?.text).toBe('Before clear')
    })

    it('should clear persisted history', () => {
      const manager = new HistoryManager(50, true)
      
      const state = createTestState('Persisted')
      manager.saveState('action', state)
      
      expect(localStorage.getItem('canvas-history')).not.toBeNull()
      
      manager.clear()
      
      // Should still have localStorage entry but with empty history
      const saved = localStorage.getItem('canvas-history')
      if (saved) {
        const parsed = JSON.parse(saved)
        expect(parsed.undoStack).toEqual([])
        expect(parsed.redoStack).toEqual([])
      }
    })
  })

  describe('Complete workflow integration', () => {
    it('should handle complete user workflow with all features', () => {
      // Initialize with persistence
      historyManager = new HistoryManager(50, true)
      autoSaveManager = new AutoSaveManager(historyManager, {
        textDebounceMs: 100,
        transformDebounceMs: 100,
      })
      
      const onUndo = vi.fn(() => historyManager.undo())
      const onRedo = vi.fn(() => historyManager.redo())
      keyboardCleanup = registerKeyboardShortcuts({ onUndo, onRedo })
      
      // User uploads image
      const state1 = createTestState('Initial')
      state1.imageObjUrl = 'uploaded.jpg'
      autoSaveManager.saveImageUpload(state1)
      
      expect(historyManager.getCurrentState()?.imageObjUrl).toBe('uploaded.jpg')
      
      // User changes text (debounced)
      const state2 = createTestState('Hello')
      autoSaveManager.saveTextChange(state2)
      vi.advanceTimersByTime(100)
      
      expect(historyManager.getCurrentState()?.text).toBe('Hello')
      
      // User changes preset (immediate)
      const state3 = createTestState('Hello', 'magazine')
      autoSaveManager.savePresetChange(state3)
      
      expect(historyManager.getCurrentState()?.preset).toBe('magazine')
      
      // User generates mask (immediate)
      const state4 = createTestState('Hello', 'magazine')
      state4.maskUrl = 'generated-mask.png'
      autoSaveManager.saveMaskGeneration(state4)
      
      expect(historyManager.getCurrentState()?.maskUrl).toBe('generated-mask.png')
      
      // User presses undo via keyboard
      const mac = isMac()
      const undoEvent = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: false,
        bubbles: true
      })
      window.dispatchEvent(undoEvent)
      
      expect(onUndo).toHaveBeenCalled()
      expect(historyManager.getCurrentState()?.maskUrl).not.toBe('generated-mask.png')
      
      // User presses redo via keyboard
      const redoEvent = new KeyboardEvent('keydown', {
        key: mac ? 'z' : 'y',
        metaKey: mac,
        ctrlKey: !mac,
        shiftKey: mac,
        bubbles: true
      })
      window.dispatchEvent(redoEvent)
      
      expect(onRedo).toHaveBeenCalled()
      expect(historyManager.getCurrentState()?.maskUrl).toBe('generated-mask.png')
      
      // Verify persistence
      const manager2 = new HistoryManager(50, true)
      expect(manager2.getCurrentState()?.maskUrl).toBe('generated-mask.png')
      expect(manager2.canUndo()).toBe(true)
    })
  })
})
