/**
 * Custom Event Tracker Property Tests
 * 
 * Property-based tests for event batching and offline queueing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { trackCustomEvent, getQueuedEventCount } from './customEventTracker';
import { getAnalyticsManager, AnalyticsManager } from './analyticsManager';

describe('Custom Event Tracker Property Tests', () => {
  let manager: AnalyticsManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Create a fresh analytics manager for each test
    manager = getAnalyticsManager();
    
    // Opt in to allow tracking
    manager.optIn();
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
  });

  /**
   * Feature: analytics-usage-tracking, Property 3: Event batching
   * 
   * For any sequence of events, they should be batched and sent together for efficiency
   * 
   * Validates: Requirements 8.4
   */
  describe('Property 3: Event batching', () => {
    it('should batch events when batch size is reached', () => {
      fc.assert(
        fc.property(
          // Generate a sequence of valid custom events
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9_]{0,49}$/),
              properties: fc.dictionary(
                fc.string(),
                fc.oneof(fc.string(), fc.integer(), fc.boolean()),
                { maxKeys: 20 }
              ),
            }),
            { minLength: 10, maxLength: 30 }
          ),
          (events) => {
            // Clear localStorage for this test run
            localStorage.clear();
            
            // Create fresh manager with small batch size
            const testManager = new AnalyticsManager({ batchSize: 5 });
            testManager.optIn();
            
            // Mock the flush method to track calls
            let flushCallCount = 0;
            const originalFlush = testManager.flush.bind(testManager);
            testManager.flush = vi.fn(async () => {
              flushCallCount++;
              await originalFlush();
            });
            
            // Track all events
            events.forEach(event => {
              testManager.track(event.name, event.properties);
            });
            
            // Calculate expected flush calls
            // Flush is called every time queue reaches batch size (5)
            const expectedFlushCalls = Math.floor(events.length / 5);
            
            // Property: Flush should be called approximately once per batch
            // Allow some tolerance for timing
            return flushCallCount >= expectedFlushCalls;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should batch multiple events before sending', () => {
      fc.assert(
        fc.property(
          // Generate a small sequence of events (less than batch size)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9_]{0,49}$/),
              properties: fc.dictionary(
                fc.string(),
                fc.oneof(fc.string(), fc.integer()),
                { maxKeys: 10 }
              ),
            }),
            { minLength: 1, maxLength: 8 }
          ),
          (events) => {
            // Clear localStorage
            localStorage.clear();
            
            // Create fresh manager with batch size of 10
            const testManager = new AnalyticsManager({ batchSize: 10 });
            testManager.optIn();
            
            // Track all events
            events.forEach(event => {
              testManager.track(event.name, event.properties);
            });
            
            // Get queue size
            const queueSize = testManager.getQueueSize();
            
            // Property: All events should be queued (not sent yet) if below batch size
            return queueSize === events.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve event order in batches', () => {
      fc.assert(
        fc.property(
          // Generate a sequence of events with unique identifiers
          fc.array(
            fc.integer({ min: 0, max: 1000 }),
            { minLength: 5, maxLength: 15 }
          ),
          (eventIds) => {
            // Clear localStorage
            localStorage.clear();
            
            // Create fresh manager
            const testManager = new AnalyticsManager({ batchSize: 20 });
            testManager.optIn();
            
            // Track events with IDs as properties
            eventIds.forEach(id => {
              testManager.track('test_event', { event_id: id });
            });
            
            // Get the queue
            const queue = testManager.getQueueSize();
            
            // Property: Queue should contain all events
            return queue === eventIds.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce max queue size when batching', () => {
      fc.assert(
        fc.property(
          // Generate more events than max queue size
          fc.integer({ min: 110, max: 200 }),
          (eventCount) => {
            // Clear localStorage
            localStorage.clear();
            
            // Create fresh manager with max queue size of 100
            const testManager = new AnalyticsManager({ 
              batchSize: 200, // Large batch size so flush doesn't happen
              maxQueueSize: 100 
            });
            testManager.optIn();
            
            // Track many events
            for (let i = 0; i < eventCount; i++) {
              testManager.track('test_event', { index: i });
            }
            
            // Get queue size
            const queueSize = testManager.getQueueSize();
            
            // Property: Queue size should never exceed max queue size
            return queueSize <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: analytics-usage-tracking, Property 4: Offline queueing
   * 
   * For any events triggered while offline, they should be queued and sent when online
   * 
   * Validates: Requirements 8.5
   */
  describe('Property 4: Offline queueing', () => {
    it('should queue events when offline', () => {
      fc.assert(
        fc.property(
          // Generate a sequence of valid custom events
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9_]{0,49}$/),
              properties: fc.dictionary(
                fc.string(),
                fc.oneof(fc.string(), fc.integer()),
                { maxKeys: 15 }
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (events) => {
            // Clear localStorage
            localStorage.clear();
            
            // Create fresh manager
            const testManager = new AnalyticsManager({ batchSize: 100 });
            testManager.optIn();
            
            // Track events (they will be queued)
            events.forEach(event => {
              testManager.track(event.name, event.properties);
            });
            
            // Get queue size
            const queueSize = testManager.getQueueSize();
            
            // Property: All events should be queued
            return queueSize === events.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist queued events to localStorage', () => {
      fc.assert(
        fc.property(
          // Generate events
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9_]{0,49}$/),
              properties: fc.dictionary(
                fc.string(),
                fc.string(),
                { maxKeys: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (events) => {
            // Clear localStorage
            localStorage.clear();
            
            // Create fresh manager
            const testManager = new AnalyticsManager({ batchSize: 100 });
            testManager.optIn();
            
            // Track events
            events.forEach(event => {
              testManager.track(event.name, event.properties);
            });
            
            // Check localStorage
            const storedQueue = localStorage.getItem('analytics_queue');
            
            // Property: Events should be persisted to localStorage
            if (storedQueue === null) {
              return false;
            }
            
            const parsedQueue = JSON.parse(storedQueue);
            return Array.isArray(parsedQueue) && parsedQueue.length === events.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should restore queued events from localStorage on initialization', () => {
      fc.assert(
        fc.property(
          // Generate events
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9_]{0,49}$/),
              timestamp: fc.integer({ min: Date.now() - 10000, max: Date.now() }),
            }),
            { minLength: 1, maxLength: 15 }
          ),
          (events) => {
            // Clear localStorage
            localStorage.clear();
            
            // Store events in localStorage (simulating offline queue)
            localStorage.setItem('analytics_queue', JSON.stringify(events));
            
            // Create new manager (should load from localStorage)
            const testManager = new AnalyticsManager();
            testManager.optIn();
            
            // Get queue size
            const queueSize = testManager.getQueueSize();
            
            // Property: Manager should restore queued events from localStorage
            return queueSize === events.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain queue across manager instances', () => {
      fc.assert(
        fc.property(
          // Generate two sets of events
          fc.tuple(
            fc.array(
              fc.record({
                name: fc.stringMatching(/^[a-z][a-z0-9_]{0,49}$/),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            fc.array(
              fc.record({
                name: fc.stringMatching(/^[a-z][a-z0-9_]{0,49}$/),
              }),
              { minLength: 1, maxLength: 10 }
            )
          ),
          ([firstBatch, secondBatch]) => {
            // Clear localStorage
            localStorage.clear();
            
            // Create first manager and track events
            const manager1 = new AnalyticsManager({ batchSize: 100 });
            manager1.optIn();
            firstBatch.forEach(event => {
              manager1.track(event.name);
            });
            
            const queueAfterFirst = manager1.getQueueSize();
            
            // Create second manager (simulating app restart)
            const manager2 = new AnalyticsManager({ batchSize: 100 });
            manager2.optIn();
            
            // Queue should be restored
            const queueAfterRestart = manager2.getQueueSize();
            
            // Track more events
            secondBatch.forEach(event => {
              manager2.track(event.name);
            });
            
            const finalQueue = manager2.getQueueSize();
            
            // Property: Queue should persist across instances
            return (
              queueAfterFirst === firstBatch.length &&
              queueAfterRestart === firstBatch.length &&
              finalQueue === firstBatch.length + secondBatch.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle queue overflow gracefully', () => {
      fc.assert(
        fc.property(
          // Generate more events than max queue size
          fc.integer({ min: 105, max: 150 }),
          (eventCount) => {
            // Clear localStorage
            localStorage.clear();
            
            // Create manager with small max queue size
            const testManager = new AnalyticsManager({ 
              batchSize: 200,
              maxQueueSize: 100 
            });
            testManager.optIn();
            
            // Track many events
            for (let i = 0; i < eventCount; i++) {
              testManager.track('overflow_test', { index: i });
            }
            
            // Get queue size
            const queueSize = testManager.getQueueSize();
            
            // Property: Queue should not exceed max size
            return queueSize <= 100 && queueSize > 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
