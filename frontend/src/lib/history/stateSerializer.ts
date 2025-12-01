/**
 * Canvas History and Undo/Redo System - State Serialization
 * 
 * Provides functions for serializing, deserializing, and calculating diffs
 * for canvas states to optimize memory usage.
 * Requirements: 5.2, 5.4
 */

import { CanvasState } from './types'

/**
 * Represents a partial state containing only changed properties
 */
export type StateDiff = Partial<CanvasState>

/**
 * Deep clones a canvas state to ensure immutability.
 * Requirement: 5.2 - Store states efficiently
 * 
 * @param state The state to serialize (deep clone)
 * @returns A deep copy of the state
 */
export function serialize(state: CanvasState): CanvasState {
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
 * Deserializes a state (currently just returns a deep clone).
 * This function exists for symmetry and future extensibility.
 * 
 * @param state The state to deserialize
 * @returns A deep copy of the state
 */
export function deserialize(state: CanvasState): CanvasState {
  return serialize(state)
}

/**
 * Calculates the difference between two states, returning only changed properties.
 * This enables storing only changes rather than full states.
 * Requirement: 5.2 - Only store changed properties
 * 
 * @param previousState The previous canvas state
 * @param currentState The current canvas state
 * @returns An object containing only the properties that changed
 */
export function calculateDiff(
  previousState: CanvasState,
  currentState: CanvasState
): StateDiff {
  const diff: StateDiff = {}

  // Check each property for changes
  if (previousState.imageObjUrl !== currentState.imageObjUrl) {
    diff.imageObjUrl = currentState.imageObjUrl
  }

  if (previousState.maskUrl !== currentState.maskUrl) {
    diff.maskUrl = currentState.maskUrl
  }

  if (previousState.text !== currentState.text) {
    diff.text = currentState.text
  }

  if (previousState.preset !== currentState.preset) {
    diff.preset = currentState.preset
  }

  if (previousState.fontSize !== currentState.fontSize) {
    diff.fontSize = currentState.fontSize
  }

  // Check if captions array changed
  if (!arraysEqual(previousState.captions, currentState.captions)) {
    diff.captions = [...currentState.captions]
  }

  return diff
}

/**
 * Applies a diff to a base state, creating a new state.
 * 
 * @param baseState The base state to apply changes to
 * @param diff The changes to apply
 * @returns A new state with the diff applied
 */
export function applyDiff(baseState: CanvasState, diff: StateDiff): CanvasState {
  return {
    imageObjUrl: diff.imageObjUrl ?? baseState.imageObjUrl,
    maskUrl: diff.maskUrl ?? baseState.maskUrl,
    text: diff.text ?? baseState.text,
    preset: diff.preset ?? baseState.preset,
    fontSize: diff.fontSize ?? baseState.fontSize,
    captions: diff.captions ? [...diff.captions] : [...baseState.captions]
  }
}

/**
 * Helper function to compare two arrays for equality.
 * 
 * @param arr1 First array
 * @param arr2 Second array
 * @returns true if arrays have the same elements in the same order
 */
function arraysEqual(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }
  
  return true
}
