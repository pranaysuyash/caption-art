import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalyticsManager } from './analyticsManager';

describe('AnalyticsManager', () => {
  let manager: AnalyticsManager;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    manager = new AnalyticsManager({ flushInterval: 1000 });
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  describe('Consent Management', () => {
    it('should not have consent initially', () => {
      expect(manager.hasConsent()).toBe(false);
    });

    it('should show consent banner when no consent is set', () => {
      expect(manager.shouldShowConsentBanner()).toBe(true);
    });

    it('should allow user to opt in', () => {
      manager.optIn();
      expect(manager.hasConsent()).toBe(true);
      expect(manager.shouldShowConsentBanner()).toBe(false);
    });

    it('should allow user to opt out', () => {
      manager.optIn();
      manager.optOut();
      expect(manager.hasConsent()).toBe(false);
    });

    it('should persist consent preference', () => {
      manager.optIn();
      const newManager = new AnalyticsManager();
      expect(newManager.hasConsent()).toBe(true);
      newManager.destroy();
    });
  });

  describe('Event Tracking', () => {
    it('should not track events without consent', () => {
      manager.track('test_event');
      expect(manager.getQueueSize()).toBe(0);
    });

    it('should track events with consent', () => {
      manager.optIn();
      manager.track('test_event');
      expect(manager.getQueueSize()).toBe(1);
    });

    it('should track events with properties', () => {
      manager.optIn();
      manager.track('test_event', { foo: 'bar' });
      expect(manager.getQueueSize()).toBe(1);
    });

    it('should enforce max queue size', () => {
      const smallManager = new AnalyticsManager({ maxQueueSize: 5 });
      smallManager.optIn();
      
      for (let i = 0; i < 10; i++) {
        smallManager.track('test_event');
      }
      
      expect(smallManager.getQueueSize()).toBe(5);
      smallManager.destroy();
    });
  });

  describe('Event Batching', () => {
    it('should flush when batch size is reached', async () => {
      manager.optIn();
      
      const batchManager = new AnalyticsManager({ batchSize: 3 });
      batchManager.optIn();
      
      batchManager.track('event1');
      batchManager.track('event2');
      expect(batchManager.getQueueSize()).toBe(2);
      
      batchManager.track('event3');
      await vi.waitFor(() => expect(batchManager.getQueueSize()).toBe(0));
      
      batchManager.destroy();
    });

    it('should flush on timer interval', async () => {
      manager.optIn();
      manager.track('test_event');
      
      expect(manager.getQueueSize()).toBe(1);
      
      vi.advanceTimersByTime(1000);
      await vi.waitFor(() => expect(manager.getQueueSize()).toBe(0));
    });
  });

  describe('Queue Management', () => {
    it('should persist queue to localStorage', () => {
      manager.optIn();
      manager.track('test_event');
      
      const newManager = new AnalyticsManager();
      newManager.optIn();
      expect(newManager.getQueueSize()).toBe(1);
      newManager.destroy();
    });

    it('should clear queue on opt-out', () => {
      manager.optIn();
      manager.track('test_event');
      expect(manager.getQueueSize()).toBe(1);
      
      manager.optOut();
      expect(manager.getQueueSize()).toBe(0);
    });

    it('should manually clear queue', () => {
      manager.optIn();
      manager.track('test_event');
      expect(manager.getQueueSize()).toBe(1);
      
      manager.clearQueue();
      expect(manager.getQueueSize()).toBe(0);
    });
  });
});
