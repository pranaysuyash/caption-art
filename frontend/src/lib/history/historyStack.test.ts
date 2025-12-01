/**
 * Canvas History and Undo/Redo System - History Stack Tests
 * 
 * Property-based tests for HistoryStack implementation
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { HistoryStack } from './historyStack'
import { HistoryEntry, CanvasState } from './types'

/**
 * Helper function to create a mock HistoryEntry
 */
function createMockEntry(id: string, action: string = 'test'): HistoryEntry {
  const mockState: CanvasState = {
    imageObjUrl: '',
    maskUrl: '',
    text: '',
    preset: 'neon',
    fontSize: 48,
    captions: []
  }

  return {
    id,
    timestamp: Date.now(),
    action,
    state: mockState
  }
}

describe('HistoryStack', () => {
  describe('Property 2: History stack limit', () => {
    /**
     * Feature: canvas-history-undo-redo, Property 2: History stack limit
     * Validates: Requirements 5.1, 5.3
     * 
     * For any history stack, the size should never exceed 50 entries
     */
    it('should never exceed the maximum size limit', () => {
      fc.assert(
        fc.property(
          // Generate an array of actions to push (between 0 and 200 entries)
          fc.array(fc.string(), { minLength: 0, maxLength: 200 }),
          (actions) => {
            const stack = new HistoryStack(50)
            
            // Push all entries
            actions.forEach((action, index) => {
              const entry = createMockEntry(`entry-${index}`, action)
              stack.push(entry)
            })
            
            // The stack size should never exceed 50
            expect(stack.size()).toBeLessThanOrEqual(50)
            
            // If we pushed more than 50, size should be exactly 50
            if (actions.length > 50) {
              expect(stack.size()).toBe(50)
            } else {
              // Otherwise, size should match the number of pushes
              expect(stack.size()).toBe(actions.length)
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      )
    })

    it('should maintain the rolling window of most recent entries', () => {
      fc.assert(
        fc.property(
          // Generate a number of entries to push (between 51 and 150)
          fc.integer({ min: 51, max: 150 }),
          (numEntries) => {
            const stack = new HistoryStack(50)
            
            // Push entries with sequential IDs
            for (let i = 0; i < numEntries; i++) {
              const entry = createMockEntry(`entry-${i}`, `action-${i}`)
              stack.push(entry)
            }
            
            // Stack should have exactly 50 entries
            expect(stack.size()).toBe(50)
            
            // The oldest entry should be the (numEntries - 50)th entry
            const allEntries = stack.getAll()
            const oldestEntry = allEntries[0]
            const expectedOldestId = `entry-${numEntries - 50}`
            
            expect(oldestEntry.id).toBe(expectedOldestId)
            
            // The newest entry should be the last one we pushed
            const newestEntry = allEntries[allEntries.length - 1]
            const expectedNewestId = `entry-${numEntries - 1}`
            
            expect(newestEntry.id).toBe(expectedNewestId)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should work correctly with different max sizes', () => {
      fc.assert(
        fc.property(
          // Generate a max size between 1 and 100
          fc.integer({ min: 1, max: 100 }),
          // Generate number of entries to push
          fc.integer({ min: 0, max: 200 }),
          (maxSize, numEntries) => {
            const stack = new HistoryStack(maxSize)
            
            // Push entries
            for (let i = 0; i < numEntries; i++) {
              const entry = createMockEntry(`entry-${i}`)
              stack.push(entry)
            }
            
            // Size should never exceed maxSize
            expect(stack.size()).toBeLessThanOrEqual(maxSize)
            
            // Size should be min(numEntries, maxSize)
            expect(stack.size()).toBe(Math.min(numEntries, maxSize))
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Basic operations', () => {
    it('should push and pop entries correctly', () => {
      const stack = new HistoryStack()
      const entry = createMockEntry('test-1')
      
      stack.push(entry)
      expect(stack.size()).toBe(1)
      
      const popped = stack.pop()
      expect(popped).toEqual(entry)
      expect(stack.size()).toBe(0)
    })

    it('should return undefined when popping from empty stack', () => {
      const stack = new HistoryStack()
      expect(stack.pop()).toBeUndefined()
    })

    it('should peek without removing entry', () => {
      const stack = new HistoryStack()
      const entry = createMockEntry('test-1')
      
      stack.push(entry)
      expect(stack.peek()).toEqual(entry)
      expect(stack.size()).toBe(1)
    })

    it('should clear all entries', () => {
      const stack = new HistoryStack()
      
      for (let i = 0; i < 10; i++) {
        stack.push(createMockEntry(`entry-${i}`))
      }
      
      expect(stack.size()).toBe(10)
      
      stack.clear()
      expect(stack.size()).toBe(0)
      expect(stack.isEmpty()).toBe(true)
    })

    it('should throw error for invalid max size', () => {
      expect(() => new HistoryStack(0)).toThrow('maxSize must be greater than 0')
      expect(() => new HistoryStack(-1)).toThrow('maxSize must be greater than 0')
    })
  })
})
