/**
 * Canvas History and Undo/Redo System - History Manager Tests
 * 
 * Property-based tests for HistoryManager implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { HistoryManager } from './historyManager'
import { CanvasState, StylePreset } from './types'

/**
 * Arbitrary generator for StylePreset
 */
const stylePresetArbitrary = fc.constantFrom<StylePreset>('neon', 'magazine', 'brush', 'emboss')

/**
 * Arbitrary generator for CanvasState
 */
const canvasStateArbitrary = fc.record({
  imageObjUrl: fc.string(),
  maskUrl: fc.string(),
  text: fc.string(),
  preset: stylePresetArbitrary,
  fontSize: fc.integer({ min: 12, max: 200 }),
  captions: fc.array(fc.string(), { maxLength: 10 })
})

/**
 * Helper function to check if two canvas states are equal
 */
function statesEqual(state1: CanvasState, state2: CanvasState): boolean {
  return (
    state1.imageObjUrl === state2.imageObjUrl &&
    state1.maskUrl === state2.maskUrl &&
    state1.text === state2.text &&
    state1.preset === state2.preset &&
    state1.fontSize === state2.fontSize &&
    state1.captions.length === state2.captions.length &&
    state1.captions.every((caption, index) => caption === state2.captions[index])
  )
}

describe('HistoryManager', () => {
  describe('Property 1: Undo-redo round-trip', () => {
    /**
     * Feature: canvas-history-undo-redo, Property 1: Undo-redo round-trip
     * Validates: Requirements 1.1, 1.4, 2.1, 2.4
     * 
     * For any state S, after undo then redo, the state should equal S
     */
    it('should return to the same state after undo then redo', () => {
      fc.assert(
        fc.property(
          // Generate an initial state and a second state
          canvasStateArbitrary,
          canvasStateArbitrary,
          (initialState, secondState) => {
            const manager = new HistoryManager(50, false)
            
            // Save initial state
            manager.saveState('initial', initialState)
            
            // Save second state
            manager.saveState('second', secondState)
            
            // Undo to go back to initial state
            const undoneState = manager.undo()
            
            // Verify we got back to initial state
            expect(undoneState).not.toBeNull()
            expect(statesEqual(undoneState!, initialState)).toBe(true)
            
            // Redo to go forward to second state
            const redoneState = manager.redo()
            
            // Verify we got back to second state
            expect(redoneState).not.toBeNull()
            expect(statesEqual(redoneState!, secondState)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle multiple undo-redo cycles', () => {
      fc.assert(
        fc.property(
          // Generate an array of states (at least 2)
          fc.array(canvasStateArbitrary, { minLength: 2, maxLength: 10 }),
          (states) => {
            const manager = new HistoryManager(50, false)
            
            // Save all states
            states.forEach((state, index) => {
              manager.saveState(`action-${index}`, state)
            })
            
            // Undo all the way back
            const undoResults: (CanvasState | null)[] = []
            for (let i = 0; i < states.length - 1; i++) {
              undoResults.push(manager.undo())
            }
            
            // Redo all the way forward
            const redoResults: (CanvasState | null)[] = []
            for (let i = 0; i < states.length - 1; i++) {
              redoResults.push(manager.redo())
            }
            
            // After full undo-redo cycle, current state should be the last state
            const currentState = manager.getCurrentState()
            expect(currentState).not.toBeNull()
            expect(statesEqual(currentState!, states[states.length - 1])).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 3: Redo stack clearing', () => {
    /**
     * Feature: canvas-history-undo-redo, Property 3: Redo stack clearing
     * Validates: Requirements 2.5
     * 
     * For any new change after undo, the redo stack should be empty
     */
    it('should clear redo stack when a new change is made after undo', () => {
      fc.assert(
        fc.property(
          // Generate three different states
          canvasStateArbitrary,
          canvasStateArbitrary,
          canvasStateArbitrary,
          (state1, state2, state3) => {
            const manager = new HistoryManager(50, false)
            
            // Save first two states
            manager.saveState('action1', state1)
            manager.saveState('action2', state2)
            
            // Undo once
            manager.undo()
            
            // At this point, redo should be available
            expect(manager.canRedo()).toBe(true)
            
            // Make a new change
            manager.saveState('action3', state3)
            
            // Redo should no longer be available
            expect(manager.canRedo()).toBe(false)
            
            // Attempting to redo should return null
            expect(manager.redo()).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clear redo stack regardless of how many undos were performed', () => {
      fc.assert(
        fc.property(
          // Generate an array of states (at least 3)
          fc.array(canvasStateArbitrary, { minLength: 3, maxLength: 10 }),
          // Generate number of undos to perform (at least 1)
          fc.integer({ min: 1, max: 5 }),
          canvasStateArbitrary,
          (states, numUndos, newState) => {
            const manager = new HistoryManager(50, false)
            
            // Save all states
            states.forEach((state, index) => {
              manager.saveState(`action-${index}`, state)
            })
            
            // Perform multiple undos (but not more than available)
            const actualUndos = Math.min(numUndos, states.length - 1)
            for (let i = 0; i < actualUndos; i++) {
              manager.undo()
            }
            
            // Redo should be available
            expect(manager.canRedo()).toBe(true)
            
            // Make a new change
            manager.saveState('new-action', newState)
            
            // Redo should no longer be available
            expect(manager.canRedo()).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Basic operations', () => {
    it('should save and retrieve states', () => {
      const manager = new HistoryManager(50, false)
      const state: CanvasState = {
        imageObjUrl: 'test.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1']
      }
      
      manager.saveState('test', state)
      const current = manager.getCurrentState()
      
      expect(current).not.toBeNull()
      expect(statesEqual(current!, state)).toBe(true)
    })

    it('should return null when undoing with no history', () => {
      const manager = new HistoryManager(50, false)
      expect(manager.undo()).toBeNull()
      expect(manager.canUndo()).toBe(false)
    })

    it('should return null when redoing with no redo stack', () => {
      const manager = new HistoryManager(50, false)
      expect(manager.redo()).toBeNull()
      expect(manager.canRedo()).toBe(false)
    })

    it('should clear history correctly', () => {
      const manager = new HistoryManager(50, false)
      const state1: CanvasState = {
        imageObjUrl: 'test1.jpg',
        maskUrl: 'mask1.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
      const state2: CanvasState = {
        imageObjUrl: 'test2.jpg',
        maskUrl: 'mask2.png',
        text: 'World',
        preset: 'magazine',
        fontSize: 64,
        captions: []
      }
      const state3: CanvasState = {
        imageObjUrl: 'test3.jpg',
        maskUrl: 'mask3.png',
        text: 'Test',
        preset: 'brush',
        fontSize: 72,
        captions: []
      }
      
      manager.saveState('action1', state1)
      manager.saveState('action2', state2)
      manager.saveState('action3', state3)
      manager.undo()
      
      expect(manager.canUndo()).toBe(true)
      expect(manager.canRedo()).toBe(true)
      
      manager.clear()
      
      expect(manager.canUndo()).toBe(false)
      expect(manager.canRedo()).toBe(false)
    })

    it('should get history entries', () => {
      const manager = new HistoryManager(50, false)
      const state1: CanvasState = {
        imageObjUrl: 'test1.jpg',
        maskUrl: 'mask1.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
      const state2: CanvasState = {
        imageObjUrl: 'test2.jpg',
        maskUrl: 'mask2.png',
        text: 'World',
        preset: 'magazine',
        fontSize: 64,
        captions: []
      }
      
      manager.saveState('action1', state1)
      manager.saveState('action2', state2)
      
      const history = manager.getHistory()
      expect(history.length).toBe(1) // Only one entry in undo stack (state1)
      expect(history[0].action).toBe('action1')
    })

    it('should jump to a specific state', () => {
      const manager = new HistoryManager(50, false)
      const states: CanvasState[] = [
        {
          imageObjUrl: 'test1.jpg',
          maskUrl: 'mask1.png',
          text: 'State 1',
          preset: 'neon',
          fontSize: 48,
          captions: []
        },
        {
          imageObjUrl: 'test2.jpg',
          maskUrl: 'mask2.png',
          text: 'State 2',
          preset: 'magazine',
          fontSize: 64,
          captions: []
        },
        {
          imageObjUrl: 'test3.jpg',
          maskUrl: 'mask3.png',
          text: 'State 3',
          preset: 'brush',
          fontSize: 72,
          captions: []
        }
      ]
      
      manager.saveState('action1', states[0])
      manager.saveState('action2', states[1])
      manager.saveState('action3', states[2])
      
      const history = manager.getHistory()
      const targetId = history[0].id
      
      const jumpedState = manager.jumpTo(targetId)
      expect(jumpedState).not.toBeNull()
      expect(statesEqual(jumpedState!, states[0])).toBe(true)
    })

    it('should return null when jumping to non-existent entry', () => {
      const manager = new HistoryManager(50, false)
      const state: CanvasState = {
        imageObjUrl: 'test.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
      
      manager.saveState('action', state)
      
      const result = manager.jumpTo('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('State immutability', () => {
    it('should not allow modifications to saved state to affect history', () => {
      const manager = new HistoryManager(50, false) // Disable persistence for this test
      const state: CanvasState = {
        imageObjUrl: 'test.jpg',
        maskUrl: 'mask.png',
        text: 'Original',
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1']
      }
      
      manager.saveState('action1', state)
      
      // Modify the original state object
      state.text = 'Modified'
      state.fontSize = 100
      state.captions.push('caption2')
      
      // Save a new state
      manager.saveState('action2', state)
      
      // Undo should return the original unmodified state
      const undoneState = manager.undo()
      expect(undoneState).not.toBeNull()
      expect(undoneState!.text).toBe('Original')
      expect(undoneState!.fontSize).toBe(48)
      expect(undoneState!.captions).toEqual(['caption1'])
    })
  })

  describe('Persistence', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('should persist history to localStorage on save', () => {
      const manager = new HistoryManager(50, true)
      const state: CanvasState = {
        imageObjUrl: 'test.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1']
      }
      
      manager.saveState('test action', state)
      
      // Check that something was saved to localStorage
      const saved = localStorage.getItem('canvas-history')
      expect(saved).not.toBeNull()
    })

    it('should restore history from localStorage on initialization', () => {
      // Create first manager and save state
      const manager1 = new HistoryManager(50, true)
      const state: CanvasState = {
        imageObjUrl: 'test.jpg',
        maskUrl: 'mask.png',
        text: 'Persisted',
        preset: 'magazine',
        fontSize: 64,
        captions: ['caption1', 'caption2']
      }
      
      manager1.saveState('persisted action', state)
      
      // Create new manager - should load from localStorage
      const manager2 = new HistoryManager(50, true)
      const restored = manager2.getCurrentState()
      
      expect(restored).not.toBeNull()
      expect(statesEqual(restored!, state)).toBe(true)
    })

    it('should persist undo/redo stacks', () => {
      // Create first manager with multiple states
      const manager1 = new HistoryManager(50, true)
      const state1: CanvasState = {
        imageObjUrl: 'test1.jpg',
        maskUrl: 'mask1.png',
        text: 'State 1',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
      const state2: CanvasState = {
        imageObjUrl: 'test2.jpg',
        maskUrl: 'mask2.png',
        text: 'State 2',
        preset: 'magazine',
        fontSize: 64,
        captions: []
      }
      const state3: CanvasState = {
        imageObjUrl: 'test3.jpg',
        maskUrl: 'mask3.png',
        text: 'State 3',
        preset: 'brush',
        fontSize: 72,
        captions: []
      }
      
      manager1.saveState('action1', state1)
      manager1.saveState('action2', state2)
      manager1.saveState('action3', state3)
      manager1.undo() // Move state3 to redo stack
      
      // Create new manager - should restore both stacks
      const manager2 = new HistoryManager(50, true)
      
      expect(manager2.canUndo()).toBe(true)
      expect(manager2.canRedo()).toBe(true)
      
      const current = manager2.getCurrentState()
      expect(current).not.toBeNull()
      expect(statesEqual(current!, state2)).toBe(true)
    })

    it('should not persist when persistence is disabled', () => {
      const manager = new HistoryManager(50, false)
      const state: CanvasState = {
        imageObjUrl: 'test.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
      
      manager.saveState('test action', state)
      
      // Nothing should be saved to localStorage
      const saved = localStorage.getItem('canvas-history')
      expect(saved).toBeNull()
    })

    it('should clear localStorage when persistence is disabled', () => {
      // First enable persistence and save
      const manager1 = new HistoryManager(50, true)
      const state: CanvasState = {
        imageObjUrl: 'test.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
      manager1.saveState('test action', state)
      
      expect(localStorage.getItem('canvas-history')).not.toBeNull()
      
      // Disable persistence
      manager1.setPersistenceEnabled(false)
      
      // localStorage should be cleared
      expect(localStorage.getItem('canvas-history')).toBeNull()
    })

    it('should handle localStorage being unavailable', () => {
      // This test just ensures no errors are thrown
      const manager = new HistoryManager(50, true)
      const state: CanvasState = {
        imageObjUrl: 'test.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
      
      // Should not throw even if localStorage fails
      expect(() => manager.saveState('test', state)).not.toThrow()
    })

    it('should start with empty history if localStorage data is invalid', () => {
      // Put invalid data in localStorage
      localStorage.setItem('canvas-history', 'invalid json{')
      
      // Create manager - should start with empty history
      const manager = new HistoryManager(50, true)
      
      expect(manager.canUndo()).toBe(false)
      expect(manager.canRedo()).toBe(false)
      expect(manager.getCurrentState()).toBeNull()
    })
  })
})
