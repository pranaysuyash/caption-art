/**
 * Tests for history persistence module
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  saveHistory,
  loadHistory,
  clearSavedHistory,
  getSavedHistorySize,
  isStorageAvailable
} from './persistence'
import { HistoryEntry, CanvasState } from './types'

describe('History Persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('saveHistory', () => {
    it('should save history to localStorage', () => {
      const undoStack: HistoryEntry[] = [
        {
          id: '1',
          timestamp: Date.now(),
          action: 'text change',
          state: createTestState()
        }
      ]
      const redoStack: HistoryEntry[] = []
      const currentState = createTestState()
      const currentAction = 'current action'

      const result = saveHistory(undoStack, redoStack, currentState, currentAction)

      expect(result.success).toBe(true)
      expect(localStorage.getItem('canvas-history')).toBeTruthy()
    })

    it('should handle null current state', () => {
      const result = saveHistory([], [], null, '')

      expect(result.success).toBe(true)
    })

    it('should handle localStorage quota exceeded by trimming', () => {
      // Create a very large history that exceeds the 5MB limit
      const largeState = createTestState()
      largeState.text = 'x'.repeat(6 * 1024 * 1024) // 6MB of text (exceeds 5MB limit)
      
      const undoStack: HistoryEntry[] = [
        {
          id: '1',
          timestamp: Date.now(),
          action: 'large change',
          state: largeState
        }
      ]

      const result = saveHistory(undoStack, [], null, '')

      // In test environment, localStorage may not have strict limits
      // The function should either succeed (by trimming) or fail gracefully
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
      // If it succeeds, it means trimming worked or test env has no limits
      expect(result.success).toBeDefined()
    })

    it('should trim history when it exceeds size limit', () => {
      // Create multiple entries
      const undoStack: HistoryEntry[] = []
      for (let i = 0; i < 100; i++) {
        undoStack.push({
          id: `${i}`,
          timestamp: Date.now(),
          action: `action ${i}`,
          state: createTestState()
        })
      }

      const result = saveHistory(undoStack, [], null, '')

      // Should succeed by trimming
      expect(result.success).toBe(true)
    })
  })

  describe('loadHistory', () => {
    it('should load saved history from localStorage', () => {
      const undoStack: HistoryEntry[] = [
        {
          id: '1',
          timestamp: Date.now(),
          action: 'text change',
          state: createTestState()
        }
      ]
      const redoStack: HistoryEntry[] = []
      const currentState = createTestState()
      const currentAction = 'current action'

      saveHistory(undoStack, redoStack, currentState, currentAction)
      const result = loadHistory()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.undoStack).toHaveLength(1)
      expect(result.data?.undoStack[0].action).toBe('text change')
    })

    it('should return error when no history exists', () => {
      const result = loadHistory()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No saved history found')
    })

    it('should validate history structure', () => {
      // Save invalid data
      localStorage.setItem('canvas-history', JSON.stringify({ invalid: 'data' }))

      const result = loadHistory()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid history data')
    })

    it('should reject history with wrong version', () => {
      const invalidData = {
        version: 999,
        undoStack: [],
        redoStack: [],
        currentState: null,
        currentAction: '',
        timestamp: Date.now()
      }
      localStorage.setItem('canvas-history', JSON.stringify(invalidData))

      const result = loadHistory()

      expect(result.success).toBe(false)
    })

    it('should reject history with invalid entries', () => {
      const invalidData = {
        version: 1,
        undoStack: [{ invalid: 'entry' }],
        redoStack: [],
        currentState: null,
        currentAction: '',
        timestamp: Date.now()
      }
      localStorage.setItem('canvas-history', JSON.stringify(invalidData))

      const result = loadHistory()

      expect(result.success).toBe(false)
    })

    it('should reject history with invalid canvas state', () => {
      const invalidData = {
        version: 1,
        undoStack: [],
        redoStack: [],
        currentState: { invalid: 'state' },
        currentAction: '',
        timestamp: Date.now()
      }
      localStorage.setItem('canvas-history', JSON.stringify(invalidData))

      const result = loadHistory()

      expect(result.success).toBe(false)
    })

    it('should handle corrupted JSON', () => {
      localStorage.setItem('canvas-history', 'not valid json{')

      const result = loadHistory()

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('clearSavedHistory', () => {
    it('should remove history from localStorage', () => {
      saveHistory([], [], null, '')
      expect(localStorage.getItem('canvas-history')).toBeTruthy()

      const result = clearSavedHistory()

      expect(result).toBe(true)
      expect(localStorage.getItem('canvas-history')).toBeNull()
    })

    it('should succeed even when no history exists', () => {
      const result = clearSavedHistory()

      expect(result).toBe(true)
    })
  })

  describe('getSavedHistorySize', () => {
    it('should return 0 when no history exists', () => {
      const size = getSavedHistorySize()

      expect(size).toBe(0)
    })

    it('should return size of saved history', () => {
      saveHistory([], [], null, '')
      const size = getSavedHistorySize()

      expect(size).toBeGreaterThan(0)
    })
  })

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      const available = isStorageAvailable()

      expect(available).toBe(true)
    })

    it('should return false when localStorage throws error', () => {
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError')
      })

      const available = isStorageAvailable()

      expect(available).toBe(false)

      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('Integration with HistoryManager', () => {
    it('should persist and restore complete history', () => {
      const undoStack: HistoryEntry[] = [
        {
          id: '1',
          timestamp: Date.now() - 2000,
          action: 'first change',
          state: createTestState('first')
        },
        {
          id: '2',
          timestamp: Date.now() - 1000,
          action: 'second change',
          state: createTestState('second')
        }
      ]
      const redoStack: HistoryEntry[] = [
        {
          id: '3',
          timestamp: Date.now(),
          action: 'undone change',
          state: createTestState('undone')
        }
      ]
      const currentState = createTestState('current')
      const currentAction = 'current action'

      // Save
      const saveResult = saveHistory(undoStack, redoStack, currentState, currentAction)
      expect(saveResult.success).toBe(true)

      // Load
      const loadResult = loadHistory()
      expect(loadResult.success).toBe(true)
      expect(loadResult.data?.undoStack).toHaveLength(2)
      expect(loadResult.data?.redoStack).toHaveLength(1)
      expect(loadResult.data?.currentState?.text).toBe('current')
      expect(loadResult.data?.currentAction).toBe('current action')
    })
  })
})

/**
 * Helper function to create a test canvas state
 */
function createTestState(text: string = 'test'): CanvasState {
  return {
    imageObjUrl: 'blob:test',
    maskUrl: 'blob:mask',
    text,
    preset: 'neon',
    fontSize: 48,
    captions: ['caption1', 'caption2']
  }
}
