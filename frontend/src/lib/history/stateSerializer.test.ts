/**
 * Canvas History and Undo/Redo System - State Serializer Tests
 * 
 * Property-based tests for state serialization and immutability
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { serialize, deserialize, calculateDiff, applyDiff } from './stateSerializer'
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

describe('stateSerializer', () => {
  describe('Property 4: State immutability', () => {
    /**
     * Feature: canvas-history-undo-redo, Property 4: State immutability
     * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
     * 
     * For any saved state, modifying the current state should not affect the saved state
     */
    it('should ensure serialized state is independent from original', () => {
      fc.assert(
        fc.property(
          canvasStateArbitrary,
          (originalState) => {
            // Serialize the state
            const serializedState = serialize(originalState)
            
            // Modify the original state's mutable properties
            originalState.text = 'MODIFIED'
            originalState.fontSize = 999
            originalState.captions.push('NEW_CAPTION')
            
            // The serialized state should remain unchanged
            expect(serializedState.text).not.toBe('MODIFIED')
            expect(serializedState.fontSize).not.toBe(999)
            expect(serializedState.captions).not.toContain('NEW_CAPTION')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should ensure deserialized state is independent from serialized', () => {
      fc.assert(
        fc.property(
          canvasStateArbitrary,
          (originalState) => {
            // Serialize then deserialize
            const serializedState = serialize(originalState)
            const deserializedState = deserialize(serializedState)
            
            // Modify the serialized state's mutable properties
            serializedState.text = 'MODIFIED'
            serializedState.fontSize = 999
            serializedState.captions.push('NEW_CAPTION')
            
            // The deserialized state should remain unchanged
            expect(deserializedState.text).not.toBe('MODIFIED')
            expect(deserializedState.fontSize).not.toBe(999)
            expect(deserializedState.captions).not.toContain('NEW_CAPTION')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should ensure round-trip serialization preserves state', () => {
      fc.assert(
        fc.property(
          canvasStateArbitrary,
          (originalState) => {
            // Serialize then deserialize
            const serializedState = serialize(originalState)
            const deserializedState = deserialize(serializedState)
            
            // The deserialized state should equal the original
            expect(statesEqual(deserializedState, originalState)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should ensure modifications to returned state do not affect saved state', () => {
      fc.assert(
        fc.property(
          canvasStateArbitrary,
          (originalState) => {
            // Create a copy of the original for comparison
            const originalCopy = serialize(originalState)
            
            // Serialize the state
            const serializedState = serialize(originalState)
            
            // Modify the returned serialized state
            serializedState.text = 'MODIFIED'
            serializedState.fontSize = 999
            serializedState.captions.push('NEW_CAPTION')
            
            // Serialize the original again - it should be unchanged
            const secondSerialization = serialize(originalState)
            
            // The second serialization should match the original copy
            expect(statesEqual(secondSerialization, originalCopy)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('calculateDiff', () => {
    it('should return empty diff for identical states', () => {
      fc.assert(
        fc.property(
          canvasStateArbitrary,
          (state) => {
            const diff = calculateDiff(state, state)
            
            // Diff should be empty (no properties)
            expect(Object.keys(diff).length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect all changed properties', () => {
      const state1: CanvasState = {
        imageObjUrl: 'image1.jpg',
        maskUrl: 'mask1.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1']
      }
      
      const state2: CanvasState = {
        imageObjUrl: 'image2.jpg',
        maskUrl: 'mask2.png',
        text: 'World',
        preset: 'magazine',
        fontSize: 64,
        captions: ['caption2']
      }
      
      const diff = calculateDiff(state1, state2)
      
      expect(diff.imageObjUrl).toBe('image2.jpg')
      expect(diff.maskUrl).toBe('mask2.png')
      expect(diff.text).toBe('World')
      expect(diff.preset).toBe('magazine')
      expect(diff.fontSize).toBe(64)
      expect(diff.captions).toEqual(['caption2'])
    })

    it('should only include changed properties in diff', () => {
      const state1: CanvasState = {
        imageObjUrl: 'image.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1']
      }
      
      const state2: CanvasState = {
        imageObjUrl: 'image.jpg',
        maskUrl: 'mask.png',
        text: 'World', // Only this changed
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1']
      }
      
      const diff = calculateDiff(state1, state2)
      
      expect(Object.keys(diff)).toEqual(['text'])
      expect(diff.text).toBe('World')
    })

    it('should detect caption array changes', () => {
      const state1: CanvasState = {
        imageObjUrl: 'image.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1', 'caption2']
      }
      
      const state2: CanvasState = {
        imageObjUrl: 'image.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1', 'caption2', 'caption3']
      }
      
      const diff = calculateDiff(state1, state2)
      
      expect(diff.captions).toEqual(['caption1', 'caption2', 'caption3'])
    })
  })

  describe('applyDiff', () => {
    it('should correctly apply diff to base state', () => {
      const baseState: CanvasState = {
        imageObjUrl: 'image1.jpg',
        maskUrl: 'mask1.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1']
      }
      
      const diff = {
        text: 'World',
        fontSize: 64
      }
      
      const result = applyDiff(baseState, diff)
      
      expect(result.imageObjUrl).toBe('image1.jpg')
      expect(result.maskUrl).toBe('mask1.png')
      expect(result.text).toBe('World')
      expect(result.preset).toBe('neon')
      expect(result.fontSize).toBe(64)
      expect(result.captions).toEqual(['caption1'])
    })

    it('should not modify base state when applying diff', () => {
      fc.assert(
        fc.property(
          canvasStateArbitrary,
          canvasStateArbitrary,
          (baseState, targetState) => {
            // Create a copy of base state for comparison
            const baseStateCopy = serialize(baseState)
            
            // Calculate diff and apply it
            const diff = calculateDiff(baseState, targetState)
            applyDiff(baseState, diff)
            
            // Base state should remain unchanged
            expect(statesEqual(baseState, baseStateCopy)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should produce equivalent state when applying full diff', () => {
      fc.assert(
        fc.property(
          canvasStateArbitrary,
          canvasStateArbitrary,
          (state1, state2) => {
            // Calculate diff from state1 to state2
            const diff = calculateDiff(state1, state2)
            
            // Apply diff to state1
            const result = applyDiff(state1, diff)
            
            // Result should equal state2
            expect(statesEqual(result, state2)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('serialize and deserialize', () => {
    it('should create independent copies', () => {
      const original: CanvasState = {
        imageObjUrl: 'image.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: ['caption1', 'caption2']
      }
      
      const serialized = serialize(original)
      
      // Modify original
      original.text = 'Modified'
      original.captions.push('caption3')
      
      // Serialized should be unchanged
      expect(serialized.text).toBe('Hello')
      expect(serialized.captions).toEqual(['caption1', 'caption2'])
    })

    it('should handle empty captions array', () => {
      const state: CanvasState = {
        imageObjUrl: 'image.jpg',
        maskUrl: 'mask.png',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
      
      const serialized = serialize(state)
      expect(serialized.captions).toEqual([])
      
      // Modifying original should not affect serialized
      state.captions.push('new')
      expect(serialized.captions).toEqual([])
    })
  })
})
