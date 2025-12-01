/**
 * Privacy Manager Property Tests
 * 
 * Property-based tests for privacy controls and opt-out enforcement
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { PrivacyManager, getPrivacyManager } from './privacyManager';
import { AnalyticsManager, getAnalyticsManager } from './analyticsManager';

describe('PrivacyManager Property Tests', () => {
  let privacyManager: PrivacyManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Create a fresh privacy manager for each test
    privacyManager = new PrivacyManager();
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
  });

  /**
   * Feature: analytics-usage-tracking, Property 2: Opt-out enforcement
   * 
   * For any user who has opted out, no analytics events should be sent
   * 
   * Validates: Requirements 4.2, 4.4
   */
  describe('Property 2: Opt-out enforcement', () => {
    it('should never send events after opt-out for any event sequence', () => {
      fc.assert(
        fc.property(
          // Generate a sequence of random events
          fc.array(
            fc.record({
              name: fc.oneof(
                fc.constant('image_upload'),
                fc.constant('caption_generate'),
                fc.constant('export'),
                fc.constant('style_apply'),
                fc.string(),
              ),
              properties: fc.dictionary(
                fc.string(),
                fc.oneof(fc.string(), fc.integer(), fc.boolean()),
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (events) => {
            // Clear localStorage for this test run
            localStorage.clear();
            
            // Create fresh instances
            const manager = getAnalyticsManager();
            const privacy = new PrivacyManager();
            
            // User opts in first
            privacy.optIn();
            expect(privacy.hasConsent()).toBe(true);
            
            // Track some events while opted in
            const halfPoint = Math.floor(events.length / 2);
            for (let i = 0; i < halfPoint; i++) {
              manager.track(events[i].name, events[i].properties);
            }
            
            // Get queue size before opt-out
            const queueBeforeOptOut = manager.getQueueSize();
            
            // User opts out
            privacy.optOut();
            expect(privacy.hasConsent()).toBe(false);
            
            // Queue should be cleared after opt-out
            const queueAfterOptOut = manager.getQueueSize();
            expect(queueAfterOptOut).toBe(0);
            
            // Try to track more events after opt-out
            for (let i = halfPoint; i < events.length; i++) {
              manager.track(events[i].name, events[i].properties);
            }
            
            // Queue should still be empty (events not tracked)
            const finalQueueSize = manager.getQueueSize();
            
            // Property: After opt-out, no events should be queued
            return finalQueueSize === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear all analytics data on opt-out', () => {
      fc.assert(
        fc.property(
          // Generate random analytics data
          fc.record({
            events: fc.array(fc.record({
              name: fc.string(),
              timestamp: fc.integer(),
            })),
            flowData: fc.dictionary(fc.string(), fc.anything()),
            conversionData: fc.dictionary(fc.string(), fc.integer()),
          }),
          (analyticsData) => {
            // Clear localStorage
            localStorage.clear();
            
            // Store some analytics data
            localStorage.setItem('analytics_queue', JSON.stringify(analyticsData.events));
            localStorage.setItem('analytics_flow', JSON.stringify(analyticsData.flowData));
            localStorage.setItem('analytics_conversion', JSON.stringify(analyticsData.conversionData));
            localStorage.setItem('analytics_free_tier', JSON.stringify({ count: 5 }));
            
            // Create privacy manager and opt out
            const privacy = new PrivacyManager();
            privacy.optOut();
            
            // Check that all analytics data is cleared
            const queueCleared = localStorage.getItem('analytics_queue') === null;
            const flowCleared = localStorage.getItem('analytics_flow') === null;
            const conversionCleared = localStorage.getItem('analytics_conversion') === null;
            const freeTierCleared = localStorage.getItem('analytics_free_tier') === null;
            
            // Property: All analytics data should be deleted on opt-out
            return queueCleared && flowCleared && conversionCleared && freeTierCleared;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist opt-out preference across sessions', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Random initial consent state
          (initialConsent) => {
            // Clear localStorage
            localStorage.clear();
            
            // Create privacy manager
            const privacy1 = new PrivacyManager();
            
            // Set consent based on random value
            if (initialConsent) {
              privacy1.optIn();
            } else {
              privacy1.optOut();
            }
            
            // Create a new privacy manager instance (simulating new session)
            const privacy2 = new PrivacyManager();
            
            // Property: Consent preference should persist
            return privacy2.hasConsent() === initialConsent;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not track events if user never gave consent', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string(),
              properties: fc.dictionary(fc.string(), fc.string()),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (events) => {
            // Clear ALL localStorage keys to ensure clean state
            localStorage.clear();
            
            // Verify localStorage is actually empty
            expect(localStorage.length).toBe(0);
            
            // Create fresh manager instance after clearing localStorage
            // This ensures it loads the cleared consent state
            const manager = new AnalyticsManager();
            
            // Verify manager has no consent
            expect(manager.hasConsent()).toBe(false);
            
            // Verify queue starts empty
            expect(manager.getQueueSize()).toBe(0);
            
            // Try to track events
            events.forEach(event => {
              manager.track(event.name, event.properties);
            });
            
            // Property: No events should be queued without consent
            const queueSize = manager.getQueueSize();
            if (queueSize !== 0) {
              console.error('Queue size is not 0:', queueSize);
              console.error('Events attempted:', events);
              console.error('Has consent:', manager.hasConsent());
            }
            return queueSize === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow tracking after opt-in following opt-out', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string(),
            properties: fc.dictionary(fc.string(), fc.string()),
          }),
          (event) => {
            // Clear localStorage
            localStorage.clear();
            
            // Create fresh instances
            const manager = getAnalyticsManager();
            const privacy = new PrivacyManager();
            
            // Opt in, then opt out, then opt in again
            privacy.optIn();
            privacy.optOut();
            privacy.optIn();
            
            // Should have consent now
            expect(privacy.hasConsent()).toBe(true);
            
            // Track an event
            manager.track(event.name, event.properties);
            
            // Property: Event should be tracked after re-opting in
            return manager.getQueueSize() > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should delete all analytics data keys on opt-out except consent', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && s !== 'consent'),
              fc.string({ minLength: 1 })
            ),
            { minLength: 1, maxLength: 10 }
          ),
          (keyValuePairs) => {
            // Clear localStorage
            localStorage.clear();
            
            // Store analytics data keys (not consent) and some non-analytics keys
            keyValuePairs.forEach(([suffix, value]) => {
              localStorage.setItem(`analytics_${suffix}`, value);
              localStorage.setItem(`other_${suffix}`, value);
            });
            
            // Create privacy manager and opt out
            const privacy = new PrivacyManager();
            privacy.optOut();
            
            // Check that analytics data keys are removed (except consent which stores the opt-out preference)
            let hasAnalyticsDataKeys = false;
            let hasOtherKeys = false;
            let hasConsentKey = false;
            
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key === 'analytics_consent') {
                hasConsentKey = true;
              } else if (key?.startsWith('analytics_')) {
                hasAnalyticsDataKeys = true;
              }
              if (key?.startsWith('other_')) {
                hasOtherKeys = true;
              }
            }
            
            // Property: All analytics data keys should be removed, consent key should remain, other keys should remain
            return !hasAnalyticsDataKeys && hasConsentKey && hasOtherKeys;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Privacy Manager Unit Tests', () => {
    beforeEach(() => {
      // Ensure clean state for unit tests
      localStorage.clear();
    });

    it('should export user data', () => {
      const privacy = new PrivacyManager();
      privacy.optIn();
      
      // Add some data
      localStorage.setItem('analytics_queue', JSON.stringify([{ name: 'test' }]));
      
      const exported = privacy.exportUserData();
      expect(exported).toHaveProperty('consent');
      expect(exported).toHaveProperty('queuedEvents');
    });

    it('should get consent timestamp', () => {
      const privacy = new PrivacyManager();
      
      expect(privacy.getConsentTimestamp()).toBeNull();
      
      privacy.optIn();
      const timestamp = privacy.getConsentTimestamp();
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should handle opt-in and opt-out', () => {
      const privacy = new PrivacyManager();
      
      // Opt in
      privacy.optIn();
      expect(privacy.hasConsent()).toBe(true);
      
      // Opt out
      privacy.optOut();
      expect(privacy.hasConsent()).toBe(false);
      
      // Opt in again
      privacy.optIn();
      expect(privacy.hasConsent()).toBe(true);
    });

    it('should delete data on opt-out', () => {
      const privacy = new PrivacyManager();
      
      // Add some analytics data
      localStorage.setItem('analytics_queue', JSON.stringify([{ name: 'test' }]));
      localStorage.setItem('analytics_flow', JSON.stringify({ flow: 'data' }));
      
      // Opt out should delete data
      privacy.optOut();
      
      expect(localStorage.getItem('analytics_queue')).toBeNull();
      expect(localStorage.getItem('analytics_flow')).toBeNull();
    });
  });
});
