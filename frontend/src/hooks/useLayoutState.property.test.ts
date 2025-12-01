import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLayoutState } from './useLayoutState'
import fc from 'fast-check'

/**
 * Property-Based Tests for useLayoutState Hook
 * Feature: app-layout-restructure
 * Property 7: Sidebar Collapse State Persistence
 * Property 9: Keyboard Shortcut Consistency
 * Validates: Requirements 3.6, 9.5
 */

describe('useLayoutState - Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Mock matchMedia for useMediaQuery
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Property 7: Sidebar Collapse State Persistence
   * Feature: app-layout-restructure, Property 7
   * Validates: Requirements 9.5
   * 
   * For any sidebar toggle action, the new collapsed state should be persisted to localStorage
   * and restored on next page load
   */
  describe('Property 7: Sidebar Collapse State Persistence', () => {
    it('property: sidebar state persists to localStorage on toggle', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Initial sidebar collapsed state
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }), // Sequence of toggle actions
          (initialCollapsed, toggleSequence) => {
            // Set initial state in localStorage
            localStorage.setItem(
              'caption-art:sidebar-collapsed',
              JSON.stringify(initialCollapsed)
            )

            const { result, unmount } = renderHook(() => useLayoutState())

            // Verify initial state is loaded from localStorage
            expect(result.current.state.sidebarCollapsed).toBe(initialCollapsed)

            let expectedState = initialCollapsed

            // Perform each toggle action
            toggleSequence.forEach(() => {
              act(() => {
                result.current.toggleSidebar()
              })

              // Toggle expected state
              expectedState = !expectedState

              // Verify state matches expected
              expect(result.current.state.sidebarCollapsed).toBe(expectedState)

              // Verify state is persisted to localStorage
              const storedValue = localStorage.getItem('caption-art:sidebar-collapsed')
              expect(storedValue).not.toBeNull()
              expect(JSON.parse(storedValue!)).toBe(expectedState)
            })

            unmount()

            // Verify state persists after unmount by creating new hook instance
            const { result: result2, unmount: unmount2 } = renderHook(() =>
              useLayoutState()
            )

            // New instance should load the final state from localStorage
            expect(result2.current.state.sidebarCollapsed).toBe(expectedState)

            unmount2()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('property: fullscreen state persists to localStorage on toggle', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Initial fullscreen state
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }), // Sequence of toggle actions
          (initialFullscreen, toggleSequence) => {
            // Set initial state in localStorage
            localStorage.setItem(
              'caption-art:fullscreen-mode',
              JSON.stringify(initialFullscreen)
            )

            const { result, unmount } = renderHook(() => useLayoutState())

            // Verify initial state is loaded from localStorage
            expect(result.current.state.fullscreenMode).toBe(initialFullscreen)

            let expectedState = initialFullscreen

            // Perform each toggle action
            toggleSequence.forEach(() => {
              act(() => {
                result.current.toggleFullscreen()
              })

              // Toggle expected state
              expectedState = !expectedState

              // Verify state matches expected
              expect(result.current.state.fullscreenMode).toBe(expectedState)

              // Verify state is persisted to localStorage
              const storedValue = localStorage.getItem('caption-art:fullscreen-mode')
              expect(storedValue).not.toBeNull()
              expect(JSON.parse(storedValue!)).toBe(expectedState)
            })

            unmount()

            // Verify state persists after unmount by creating new hook instance
            const { result: result2, unmount: unmount2 } = renderHook(() =>
              useLayoutState()
            )

            // New instance should load the final state from localStorage
            expect(result2.current.state.fullscreenMode).toBe(expectedState)

            unmount2()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('property: handles localStorage unavailable gracefully', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Initial sidebar state
          fc.integer({ min: 1, max: 5 }), // Number of toggles
          (initialState, numToggles) => {
            // Mock localStorage to throw errors
            const originalSetItem = Storage.prototype.setItem
            const originalGetItem = Storage.prototype.getItem
            
            let getItemCallCount = 0
            Storage.prototype.getItem = vi.fn(() => {
              getItemCallCount++
              // Allow initial load, then throw
              if (getItemCallCount <= 2) {
                return JSON.stringify(initialState)
              }
              throw new Error('localStorage unavailable')
            })
            
            Storage.prototype.setItem = vi.fn(() => {
              throw new Error('localStorage unavailable')
            })

            const { result, unmount } = renderHook(() => useLayoutState())

            // Should still work with in-memory state
            let expectedState = initialState

            for (let i = 0; i < numToggles; i++) {
              act(() => {
                result.current.toggleSidebar()
              })

              expectedState = !expectedState
              expect(result.current.state.sidebarCollapsed).toBe(expectedState)
            }

            unmount()

            // Restore original localStorage methods
            Storage.prototype.setItem = originalSetItem
            Storage.prototype.getItem = originalGetItem
          }
        ),
        { numRuns: 100 }
      )
    })

    it('property: setSidebarCollapsed directly persists state', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Initial state
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }), // Sequence of states to set
          (initialState, stateSequence) => {
            localStorage.setItem(
              'caption-art:sidebar-collapsed',
              JSON.stringify(initialState)
            )

            const { result, unmount } = renderHook(() => useLayoutState())

            expect(result.current.state.sidebarCollapsed).toBe(initialState)

            // Set each state directly
            stateSequence.forEach((newState) => {
              act(() => {
                result.current.setSidebarCollapsed(newState)
              })

              // Verify state matches
              expect(result.current.state.sidebarCollapsed).toBe(newState)

              // Verify state is persisted to localStorage
              const storedValue = localStorage.getItem('caption-art:sidebar-collapsed')
              expect(storedValue).not.toBeNull()
              expect(JSON.parse(storedValue!)).toBe(newState)
            })

            unmount()

            // Verify final state persists
            const { result: result2, unmount: unmount2 } = renderHook(() =>
              useLayoutState()
            )

            const finalState = stateSequence[stateSequence.length - 1]
            expect(result2.current.state.sidebarCollapsed).toBe(finalState)

            unmount2()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 9: Keyboard Shortcut Consistency
   * For any keyboard event matching Ctrl+B (or Cmd+B), the sidebar collapsed state should toggle
   */
  it('property: Ctrl+B (or Cmd+B) consistently toggles sidebar state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Initial sidebar collapsed state
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }), // Sequence of Ctrl (true) or Cmd (false) key presses
        (initialCollapsed, keySequence) => {
          // Set initial state in localStorage
          localStorage.setItem(
            'caption-art:sidebar-collapsed',
            JSON.stringify(initialCollapsed)
          )

          const { result, unmount } = renderHook(() => useLayoutState())

          // Verify initial state
          expect(result.current.state.sidebarCollapsed).toBe(initialCollapsed)

          let expectedState = initialCollapsed

          // Simulate each keyboard event in the sequence
          keySequence.forEach((useCtrl) => {
            const event = new KeyboardEvent('keydown', {
              key: 'b',
              ctrlKey: useCtrl,
              metaKey: !useCtrl,
              bubbles: true,
              cancelable: true,
            })

            act(() => {
              window.dispatchEvent(event)
            })

            // Toggle expected state
            expectedState = !expectedState

            // Verify state matches expected
            expect(result.current.state.sidebarCollapsed).toBe(expectedState)
          })

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: F key consistently toggles fullscreen mode
   * For any keyboard event with F key (not in input field), fullscreen mode should toggle
   */
  it('property: F key consistently toggles fullscreen mode', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Initial fullscreen state
        fc.integer({ min: 1, max: 10 }), // Number of F key presses
        (initialFullscreen, numPresses) => {
          // Set initial state in localStorage
          localStorage.setItem(
            'caption-art:fullscreen-mode',
            JSON.stringify(initialFullscreen)
          )

          const { result, unmount } = renderHook(() => useLayoutState())

          // Verify initial state
          expect(result.current.state.fullscreenMode).toBe(initialFullscreen)

          let expectedState = initialFullscreen

          // Simulate F key presses
          for (let i = 0; i < numPresses; i++) {
            const event = new KeyboardEvent('keydown', {
              key: 'f',
              bubbles: true,
              cancelable: true,
            })

            // Mock event target as non-input element
            Object.defineProperty(event, 'target', {
              value: document.createElement('div'),
              writable: false,
            })

            act(() => {
              window.dispatchEvent(event)
            })

            // Toggle expected state
            expectedState = !expectedState

            // Verify state matches expected
            expect(result.current.state.fullscreenMode).toBe(expectedState)
          }

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: F key in input fields does not toggle fullscreen
   * For any F key press in an input or textarea, fullscreen mode should not change
   */
  it('property: F key in input fields does not affect fullscreen mode', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Initial fullscreen state
        fc.constantFrom('INPUT', 'TEXTAREA'), // Input element types
        fc.integer({ min: 1, max: 5 }), // Number of F key presses
        (initialFullscreen, tagName, numPresses) => {
          localStorage.setItem(
            'caption-art:fullscreen-mode',
            JSON.stringify(initialFullscreen)
          )

          const { result, unmount } = renderHook(() => useLayoutState())

          expect(result.current.state.fullscreenMode).toBe(initialFullscreen)

          // Simulate F key presses in input field
          for (let i = 0; i < numPresses; i++) {
            const event = new KeyboardEvent('keydown', {
              key: 'f',
              bubbles: true,
              cancelable: true,
            })

            // Mock event target as input element
            Object.defineProperty(event, 'target', {
              value: { tagName },
              writable: false,
            })

            act(() => {
              window.dispatchEvent(event)
            })

            // State should remain unchanged
            expect(result.current.state.fullscreenMode).toBe(initialFullscreen)
          }

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Sidebar state is restored when exiting fullscreen
   * For any sidebar state before entering fullscreen, that state should be restored on exit
   */
  it('property: sidebar state is restored when exiting fullscreen', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Initial sidebar collapsed state
        fc.boolean(), // Whether to change sidebar state while in fullscreen
        (initialSidebarCollapsed, changeDuringFullscreen) => {
          localStorage.setItem(
            'caption-art:sidebar-collapsed',
            JSON.stringify(initialSidebarCollapsed)
          )
          localStorage.setItem('caption-art:fullscreen-mode', JSON.stringify(false))

          const { result, unmount } = renderHook(() => useLayoutState())

          // Verify initial state
          expect(result.current.state.sidebarCollapsed).toBe(initialSidebarCollapsed)
          expect(result.current.state.fullscreenMode).toBe(false)

          // Enter fullscreen
          act(() => {
            result.current.toggleFullscreen()
          })

          expect(result.current.state.fullscreenMode).toBe(true)

          // Optionally change sidebar state while in fullscreen
          if (changeDuringFullscreen) {
            act(() => {
              result.current.toggleSidebar()
            })
          }

          // Exit fullscreen
          act(() => {
            result.current.toggleFullscreen()
          })

          expect(result.current.state.fullscreenMode).toBe(false)
          // Sidebar state should be restored to initial state
          expect(result.current.state.sidebarCollapsed).toBe(initialSidebarCollapsed)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Keyboard shortcuts respect defaultPrevented
   * For any keyboard event that is already handled (defaultPrevented), shortcuts should not trigger
   */
  it('property: keyboard shortcuts respect defaultPrevented flag', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Initial sidebar state
        fc.boolean(), // Initial fullscreen state
        (initialSidebar, initialFullscreen) => {
          localStorage.setItem(
            'caption-art:sidebar-collapsed',
            JSON.stringify(initialSidebar)
          )
          localStorage.setItem(
            'caption-art:fullscreen-mode',
            JSON.stringify(initialFullscreen)
          )

          const { result, unmount } = renderHook(() => useLayoutState())

          // Create events with defaultPrevented = true
          const ctrlBEvent = new KeyboardEvent('keydown', {
            key: 'b',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          })
          ctrlBEvent.preventDefault() // Mark as already handled

          const fEvent = new KeyboardEvent('keydown', {
            key: 'f',
            bubbles: true,
            cancelable: true,
          })
          Object.defineProperty(fEvent, 'target', {
            value: document.createElement('div'),
            writable: false,
          })
          fEvent.preventDefault() // Mark as already handled

          act(() => {
            window.dispatchEvent(ctrlBEvent)
            window.dispatchEvent(fEvent)
          })

          // States should remain unchanged
          expect(result.current.state.sidebarCollapsed).toBe(initialSidebar)
          expect(result.current.state.fullscreenMode).toBe(initialFullscreen)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})
