/**
 * Canvas History and Undo/Redo System - Auto Save Tests
 * 
 * Tests for AutoSaveManager implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AutoSaveManager } from './autoSave'
import { HistoryManager } from './historyManager'
import { CanvasState } from './types'

describe('AutoSaveManager', () => {
  let historyManager: HistoryManager
  let autoSaveManager: AutoSaveManager
  
  const createTestState = (text: string = 'test'): CanvasState => ({
    imageObjUrl: 'test.jpg',
    maskUrl: 'mask.png',
    text,
    preset: 'neon',
    fontSize: 48,
    captions: []
  })

  beforeEach(() => {
    localStorage.clear()
    historyManager = new HistoryManager(50, false) // Disable persistence for tests
    autoSaveManager = new AutoSaveManager(historyManager, {
      textDebounceMs: 100, // Shorter for testing
      transformDebounceMs: 100,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    autoSaveManager.destroy()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('Text change debouncing - Requirement 4.1', () => {
    it('should debounce text changes and save after 500ms of inactivity', () => {
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
      expect(historyManager.canUndo()).toBe(false)
      
      // Advance past debounce period
      vi.advanceTimersByTime(100)
      
      // Should have saved the last state
      expect(historyManager.canUndo()).toBe(false) // No undo because this is the first save
      const currentState = historyManager.getCurrentState()
      expect(currentState?.text).toBe('Hello World!')
    })

    it('should not save duplicate states', () => {
      const state = createTestState('Same text')
      
      // Save same state multiple times
      autoSaveManager.saveTextChange(state)
      vi.advanceTimersByTime(100)
      
      autoSaveManager.saveTextChange(state)
      vi.advanceTimersByTime(100)
      
      // Should only have one state saved
      expect(historyManager.getHistory().length).toBeLessThanOrEqual(1)
    })
  })

  describe('Preset change immediate save - Requirement 4.2', () => {
    it('should save preset changes immediately without debouncing', () => {
      const state = createTestState()
      
      autoSaveManager.savePresetChange(state)
      
      // Should save immediately without waiting
      const currentState = historyManager.getCurrentState()
      expect(currentState).not.toBeNull()
      expect(currentState?.preset).toBe('neon')
    })

    it('should cancel pending text saves when preset changes', () => {
      const textState = createTestState('Text')
      const presetState = createTestState('Preset')
      
      // Start a text change
      autoSaveManager.saveTextChange(textState)
      
      // Immediately change preset
      autoSaveManager.savePresetChange(presetState)
      
      // Advance timers
      vi.advanceTimersByTime(200)
      
      // Should only have the preset change saved
      const currentState = historyManager.getCurrentState()
      expect(currentState?.text).toBe('Preset')
    })
  })

  describe('Transform change debouncing - Requirement 4.3', () => {
    it('should debounce transform changes and save after 500ms of inactivity', () => {
      const state1 = createTestState('Transform 1')
      const state2 = createTestState('Transform 2')
      const state3 = createTestState('Transform 3')
      
      // Rapid transform changes
      autoSaveManager.saveTransformChange(state1)
      vi.advanceTimersByTime(50)
      autoSaveManager.saveTransformChange(state2)
      vi.advanceTimersByTime(50)
      autoSaveManager.saveTransformChange(state3)
      
      // Should not have saved yet
      expect(historyManager.getCurrentState()).toBeNull()
      
      // Advance past debounce period
      vi.advanceTimersByTime(100)
      
      // Should have saved the last state
      const currentState = historyManager.getCurrentState()
      expect(currentState?.text).toBe('Transform 3')
    })
  })

  describe('Image upload immediate save - Requirement 4.4', () => {
    it('should save image upload immediately without debouncing', () => {
      const state = createTestState()
      state.imageObjUrl = 'new-image.jpg'
      
      autoSaveManager.saveImageUpload(state)
      
      // Should save immediately
      const currentState = historyManager.getCurrentState()
      expect(currentState).not.toBeNull()
      expect(currentState?.imageObjUrl).toBe('new-image.jpg')
    })

    it('should cancel pending saves when image is uploaded', () => {
      const textState = createTestState('Text')
      const imageState = createTestState('Image')
      imageState.imageObjUrl = 'uploaded.jpg'
      
      // Start a text change
      autoSaveManager.saveTextChange(textState)
      
      // Immediately upload image
      autoSaveManager.saveImageUpload(imageState)
      
      // Advance timers
      vi.advanceTimersByTime(200)
      
      // Should only have the image upload saved
      const currentState = historyManager.getCurrentState()
      expect(currentState?.imageObjUrl).toBe('uploaded.jpg')
    })
  })

  describe('Mask generation immediate save - Requirement 4.5', () => {
    it('should save mask generation immediately without debouncing', () => {
      const state = createTestState()
      state.maskUrl = 'new-mask.png'
      
      autoSaveManager.saveMaskGeneration(state)
      
      // Should save immediately
      const currentState = historyManager.getCurrentState()
      expect(currentState).not.toBeNull()
      expect(currentState?.maskUrl).toBe('new-mask.png')
    })

    it('should cancel pending saves when mask is generated', () => {
      const transformState = createTestState('Transform')
      const maskState = createTestState('Mask')
      maskState.maskUrl = 'generated-mask.png'
      
      // Start a transform change
      autoSaveManager.saveTransformChange(transformState)
      
      // Immediately generate mask
      autoSaveManager.saveMaskGeneration(maskState)
      
      // Advance timers
      vi.advanceTimersByTime(200)
      
      // Should only have the mask generation saved
      const currentState = historyManager.getCurrentState()
      expect(currentState?.maskUrl).toBe('generated-mask.png')
    })
  })

  describe('Enable/disable functionality', () => {
    it('should not save when disabled', () => {
      autoSaveManager.setEnabled(false)
      
      const state = createTestState()
      autoSaveManager.savePresetChange(state)
      
      expect(historyManager.getCurrentState()).toBeNull()
    })

    it('should cancel pending saves when disabled', () => {
      const state = createTestState()
      
      autoSaveManager.saveTextChange(state)
      autoSaveManager.setEnabled(false)
      
      vi.advanceTimersByTime(200)
      
      expect(historyManager.getCurrentState()).toBeNull()
    })

    it('should resume saving when re-enabled', () => {
      autoSaveManager.setEnabled(false)
      autoSaveManager.setEnabled(true)
      
      const state = createTestState()
      autoSaveManager.savePresetChange(state)
      
      expect(historyManager.getCurrentState()).not.toBeNull()
    })
  })

  describe('Cleanup', () => {
    it('should cancel all pending saves on destroy', () => {
      const state = createTestState()
      
      autoSaveManager.saveTextChange(state)
      autoSaveManager.saveTransformChange(state)
      autoSaveManager.destroy()
      
      vi.advanceTimersByTime(200)
      
      expect(historyManager.getCurrentState()).toBeNull()
    })
  })

  describe('Custom configuration', () => {
    it('should respect custom debounce times', () => {
      const customManager = new AutoSaveManager(historyManager, {
        textDebounceMs: 50,
        transformDebounceMs: 50,
      })
      
      const state = createTestState()
      customManager.saveTextChange(state)
      
      // Should not save before custom debounce time
      vi.advanceTimersByTime(25)
      expect(historyManager.getCurrentState()).toBeNull()
      
      // Should save after custom debounce time
      vi.advanceTimersByTime(25)
      expect(historyManager.getCurrentState()).not.toBeNull()
      
      customManager.destroy()
    })
  })
})
