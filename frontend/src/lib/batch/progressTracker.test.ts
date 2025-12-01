/**
 * Progress Tracker Tests
 * 
 * Property-based tests for progress tracking functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ProgressTracker, ProgressState } from './progressTracker';

describe('ProgressTracker', () => {
  /**
   * Feature: batch-processing, Property 4: Progress monotonicity
   * 
   * For any batch operation, progress percentage should never decrease
   * Validates: Requirements 6.1, 6.2
   */
  it('should never decrease progress percentage during processing', () => {
    fc.assert(
      fc.property(
        // Generate a random number of items to process (1-100)
        fc.integer({ min: 1, max: 100 }),
        // Generate a random sequence of operations (success/failure)
        fc.array(fc.boolean(), { minLength: 1, maxLength: 100 }),
        (total, operations) => {
          const progressStates: ProgressState[] = [];
          
          // Create progress tracker with callback to capture states
          const tracker = new ProgressTracker({
            total,
            onProgress: (state) => {
              progressStates.push({ ...state });
            },
          });

          // Start tracking
          tracker.start();

          // Process items up to the total or operations length
          const itemsToProcess = Math.min(total, operations.length);
          
          for (let i = 0; i < itemsToProcess; i++) {
            tracker.updateCurrent(`file${i}.jpg`);
            
            // Mark as success or failure based on operation
            if (operations[i]) {
              tracker.markSuccess();
            } else {
              tracker.markFailure();
            }
          }

          // Complete if we processed all items
          if (itemsToProcess === total) {
            tracker.complete();
          }

          // Property: Progress percentage should never decrease
          for (let i = 1; i < progressStates.length; i++) {
            const prevPercentage = progressStates[i - 1].percentage;
            const currPercentage = progressStates[i].percentage;
            
            expect(currPercentage).toBeGreaterThanOrEqual(prevPercentage);
          }

          // Property: Progress percentage should be between 0 and 100
          for (const state of progressStates) {
            expect(state.percentage).toBeGreaterThanOrEqual(0);
            expect(state.percentage).toBeLessThanOrEqual(100);
          }

          // Property: Final percentage should be 100 if all items processed
          if (itemsToProcess === total && progressStates.length > 0) {
            const finalState = progressStates[progressStates.length - 1];
            expect(finalState.percentage).toBe(100);
            expect(finalState.isComplete).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Current index should never decrease
   */
  it('should never decrease current index during processing', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 50 }),
        (total, operations) => {
          const progressStates: ProgressState[] = [];
          
          const tracker = new ProgressTracker({
            total,
            onProgress: (state) => {
              progressStates.push({ ...state });
            },
          });

          tracker.start();

          const itemsToProcess = Math.min(total, operations.length);
          
          for (let i = 0; i < itemsToProcess; i++) {
            tracker.updateCurrent(`file${i}.jpg`);
            
            if (operations[i]) {
              tracker.markSuccess();
            } else {
              tracker.markFailure();
            }
          }

          // Property: Current index should never decrease
          for (let i = 1; i < progressStates.length; i++) {
            const prevIndex = progressStates[i - 1].currentIndex;
            const currIndex = progressStates[i].currentIndex;
            
            expect(currIndex).toBeGreaterThanOrEqual(prevIndex);
          }

          // Property: Current index should never exceed total
          for (const state of progressStates) {
            expect(state.currentIndex).toBeLessThanOrEqual(total);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Success + failed should equal current index
   */
  it('should maintain invariant: successful + failed = currentIndex', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 50 }),
        (total, operations) => {
          const tracker = new ProgressTracker({ total });

          tracker.start();

          const itemsToProcess = Math.min(total, operations.length);
          
          for (let i = 0; i < itemsToProcess; i++) {
            tracker.updateCurrent(`file${i}.jpg`);
            
            if (operations[i]) {
              tracker.markSuccess();
            } else {
              tracker.markFailure();
            }

            const state = tracker.getState();
            
            // Property: successful + failed should equal currentIndex
            expect(state.successful + state.failed).toBe(state.currentIndex);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit test: Basic progress tracking
   */
  it('should track progress correctly for simple case', () => {
    const states: ProgressState[] = [];
    const tracker = new ProgressTracker({
      total: 3,
      onProgress: (state) => states.push({ ...state }),
    });

    tracker.start();
    expect(states[states.length - 1].percentage).toBe(0);

    tracker.updateCurrent('file1.jpg');
    tracker.markSuccess();
    expect(states[states.length - 1].percentage).toBe(33);
    expect(states[states.length - 1].successful).toBe(1);

    tracker.updateCurrent('file2.jpg');
    tracker.markFailure();
    expect(states[states.length - 1].percentage).toBe(67);
    expect(states[states.length - 1].failed).toBe(1);

    tracker.updateCurrent('file3.jpg');
    tracker.markSuccess();
    expect(states[states.length - 1].percentage).toBe(100);
    expect(states[states.length - 1].successful).toBe(2);
  });

  /**
   * Unit test: Time estimation
   */
  it('should estimate time remaining', () => {
    vi.useFakeTimers();
    
    const tracker = new ProgressTracker({ total: 10 });
    tracker.start();

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);
    tracker.updateCurrent('file1.jpg');
    tracker.markSuccess();

    const state = tracker.getState();
    
    // After 1 item in 1 second, should estimate 9 seconds remaining
    expect(state.estimatedTimeRemaining).toBeGreaterThan(0);
    expect(state.estimatedTimeRemaining).toBeLessThanOrEqual(10000);

    vi.useRealTimers();
  });

  /**
   * Unit test: Format time utility
   */
  it('should format time correctly', () => {
    expect(ProgressTracker.formatTime(500)).toBe('less than 1s');
    expect(ProgressTracker.formatTime(5000)).toBe('5s');
    expect(ProgressTracker.formatTime(65000)).toBe('1m 5s');
    expect(ProgressTracker.formatTime(125000)).toBe('2m 5s');
  });

  /**
   * Unit test: Reset functionality
   */
  it('should reset to initial state', () => {
    const tracker = new ProgressTracker({ total: 5 });
    
    tracker.start();
    tracker.updateCurrent('file1.jpg');
    tracker.markSuccess();
    
    let state = tracker.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.successful).toBe(1);

    tracker.reset();
    
    state = tracker.getState();
    expect(state.currentIndex).toBe(0);
    expect(state.successful).toBe(0);
    expect(state.failed).toBe(0);
    expect(state.percentage).toBe(0);
  });

  /**
   * Unit test: Complete functionality
   */
  it('should mark as complete', () => {
    const tracker = new ProgressTracker({ total: 5 });
    
    tracker.start();
    tracker.updateCurrent('file1.jpg');
    tracker.markSuccess();
    
    tracker.complete();
    
    const state = tracker.getState();
    expect(state.isComplete).toBe(true);
    expect(state.percentage).toBe(100);
    expect(state.currentIndex).toBe(5);
  });

  /**
   * Unit test: Zero total edge case
   */
  it('should handle zero total gracefully', () => {
    const tracker = new ProgressTracker({ total: 0 });
    
    tracker.start();
    
    const state = tracker.getState();
    expect(state.percentage).toBe(0);
    expect(state.estimatedTimeRemaining).toBe(0);
  });
});
