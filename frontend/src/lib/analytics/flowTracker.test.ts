import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FlowTracker } from './flowTracker';
import { getAnalyticsManager } from './analyticsManager';

describe('FlowTracker', () => {
  let tracker: FlowTracker;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    
    // Opt in to analytics
    const manager = getAnalyticsManager();
    manager.optIn();
    
    tracker = new FlowTracker();
  });

  afterEach(() => {
    tracker.endSession();
    vi.useRealTimers();
  });

  describe('Session Management', () => {
    it('should generate a session ID on initialization', () => {
      const sessionId = tracker.getSessionId();
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session_/);
    });

    it('should persist session ID across instances', () => {
      const sessionId1 = tracker.getSessionId();
      const tracker2 = new FlowTracker();
      const sessionId2 = tracker2.getSessionId();
      
      expect(sessionId1).toBe(sessionId2);
      tracker2.endSession();
    });

    it('should track session duration', () => {
      const startDuration = tracker.getSessionDuration();
      expect(startDuration).toBeGreaterThanOrEqual(0);
      
      vi.advanceTimersByTime(5000);
      const endDuration = tracker.getSessionDuration();
      expect(endDuration).toBeGreaterThanOrEqual(5000);
    });

    it('should create new session after timeout', () => {
      const sessionId1 = tracker.getSessionId();
      
      // Simulate session timeout (30 minutes)
      vi.advanceTimersByTime(31 * 60 * 1000);
      
      // Trigger activity to check for timeout
      window.dispatchEvent(new Event('click'));
      
      const sessionId2 = tracker.getSessionId();
      expect(sessionId2).not.toBe(sessionId1);
    });
  });

  describe('Flow Tracking', () => {
    it('should start a new flow', () => {
      tracker.startFlow();
      const currentFlow = tracker.getCurrentFlow();
      
      expect(currentFlow).toBeDefined();
      expect(currentFlow?.steps).toEqual([]);
      expect(currentFlow?.completed).toBe(false);
    });

    it('should record steps in a flow', () => {
      tracker.startFlow();
      tracker.recordStep('upload_image');
      tracker.recordStep('generate_caption');
      
      const currentFlow = tracker.getCurrentFlow();
      expect(currentFlow?.steps).toHaveLength(2);
      expect(currentFlow?.steps[0].action).toBe('upload_image');
      expect(currentFlow?.steps[1].action).toBe('generate_caption');
    });

    it('should measure time per step', () => {
      tracker.startFlow();
      tracker.recordStep('step1');
      
      vi.advanceTimersByTime(1000);
      tracker.recordStep('step2');
      
      const currentFlow = tracker.getCurrentFlow();
      expect(currentFlow?.steps[1].duration).toBeGreaterThanOrEqual(1000);
    });

    it('should include metadata with steps', () => {
      tracker.startFlow();
      tracker.recordStep('upload_image', { fileSize: 1024, format: 'png' });
      
      const currentFlow = tracker.getCurrentFlow();
      expect(currentFlow?.steps[0].metadata).toEqual({
        fileSize: 1024,
        format: 'png',
      });
    });

    it('should complete a flow', () => {
      tracker.startFlow();
      tracker.recordStep('step1');
      tracker.recordStep('step2');
      tracker.completeFlow();
      
      const currentFlow = tracker.getCurrentFlow();
      expect(currentFlow).toBeNull();
      
      const history = tracker.getFlowHistory();
      expect(history).toHaveLength(1);
      expect(history[0].completed).toBe(true);
      expect(history[0].endTime).toBeDefined();
    });

    it('should track abandonment points', () => {
      tracker.startFlow();
      tracker.recordStep('step1');
      tracker.recordStep('step2');
      tracker.abandonFlow();
      
      const history = tracker.getFlowHistory();
      expect(history).toHaveLength(1);
      expect(history[0].completed).toBe(false);
      expect(history[0].abandonedAt).toBe('step2');
    });

    it('should auto-start flow when recording step without starting', () => {
      tracker.recordStep('step1');
      
      const currentFlow = tracker.getCurrentFlow();
      expect(currentFlow).toBeDefined();
      expect(currentFlow?.steps).toHaveLength(1);
    });

    it('should abandon previous flow when starting new one', () => {
      tracker.startFlow();
      tracker.recordStep('step1');
      
      tracker.startFlow();
      
      const history = tracker.getFlowHistory();
      expect(history).toHaveLength(1);
      expect(history[0].abandonedAt).toBe('step1');
    });
  });

  describe('Flow History', () => {
    it('should save completed flows to history', () => {
      tracker.startFlow();
      tracker.recordStep('step1');
      tracker.completeFlow();
      
      tracker.startFlow();
      tracker.recordStep('step2');
      tracker.completeFlow();
      
      const history = tracker.getFlowHistory();
      expect(history).toHaveLength(2);
    });

    it('should limit history to 100 flows', () => {
      for (let i = 0; i < 105; i++) {
        tracker.startFlow();
        tracker.recordStep(`step${i}`);
        tracker.completeFlow();
      }
      
      const history = tracker.getFlowHistory();
      expect(history).toHaveLength(100);
    });

    it('should clear flow history', () => {
      tracker.startFlow();
      tracker.recordStep('step1');
      tracker.completeFlow();
      
      tracker.clearHistory();
      
      const history = tracker.getFlowHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('Common Paths Analysis', () => {
    it('should identify common paths', () => {
      // Create multiple flows with same path
      for (let i = 0; i < 3; i++) {
        tracker.startFlow();
        tracker.recordStep('upload');
        tracker.recordStep('caption');
        tracker.recordStep('export');
        tracker.completeFlow();
      }
      
      // Create different path
      tracker.startFlow();
      tracker.recordStep('upload');
      tracker.recordStep('export');
      tracker.completeFlow();
      
      const commonPaths = tracker.getCommonPaths();
      expect(commonPaths).toHaveLength(2);
      expect(commonPaths[0].count).toBe(3);
      expect(commonPaths[0].path).toEqual(['upload', 'caption', 'export']);
    });

    it('should calculate average duration for paths', () => {
      tracker.startFlow();
      tracker.recordStep('step1');
      vi.advanceTimersByTime(1000);
      tracker.recordStep('step2');
      tracker.completeFlow();
      
      tracker.startFlow();
      tracker.recordStep('step1');
      vi.advanceTimersByTime(2000);
      tracker.recordStep('step2');
      tracker.completeFlow();
      
      const commonPaths = tracker.getCommonPaths();
      expect(commonPaths[0].averageDuration).toBeGreaterThan(0);
    });

    it('should sort paths by frequency', () => {
      // Path 1: 3 times
      for (let i = 0; i < 3; i++) {
        tracker.startFlow();
        tracker.recordStep('a');
        tracker.recordStep('b');
        tracker.completeFlow();
      }
      
      // Path 2: 5 times
      for (let i = 0; i < 5; i++) {
        tracker.startFlow();
        tracker.recordStep('x');
        tracker.recordStep('y');
        tracker.completeFlow();
      }
      
      const commonPaths = tracker.getCommonPaths();
      expect(commonPaths[0].count).toBe(5);
      expect(commonPaths[1].count).toBe(3);
    });
  });

  describe('Persistence', () => {
    it('should persist current flow to localStorage', () => {
      tracker.startFlow();
      tracker.recordStep('step1');
      
      const tracker2 = new FlowTracker();
      const currentFlow = tracker2.getCurrentFlow();
      
      expect(currentFlow).toBeDefined();
      expect(currentFlow?.steps).toHaveLength(1);
      tracker2.endSession();
    });

    it('should persist flow history to localStorage', () => {
      tracker.startFlow();
      tracker.recordStep('step1');
      tracker.completeFlow();
      
      const tracker2 = new FlowTracker();
      const history = tracker2.getFlowHistory();
      
      expect(history).toHaveLength(1);
      tracker2.endSession();
    });
  });

  describe('Analytics Integration', () => {
    it('should track flow steps as analytics events', () => {
      const manager = getAnalyticsManager();
      const trackSpy = vi.spyOn(manager, 'track');
      
      tracker.startFlow();
      tracker.recordStep('test_step');
      
      expect(trackSpy).toHaveBeenCalledWith('flow_step', expect.objectContaining({
        action: 'test_step',
        stepNumber: 1,
      }));
    });

    it('should track flow completion as analytics event', () => {
      const manager = getAnalyticsManager();
      const trackSpy = vi.spyOn(manager, 'track');
      
      tracker.startFlow();
      tracker.recordStep('step1');
      tracker.completeFlow();
      
      expect(trackSpy).toHaveBeenCalledWith('flow_completed', expect.objectContaining({
        totalSteps: 1,
      }));
    });

    it('should track flow abandonment as analytics event', () => {
      const manager = getAnalyticsManager();
      const trackSpy = vi.spyOn(manager, 'track');
      
      tracker.startFlow();
      tracker.recordStep('step1');
      tracker.abandonFlow();
      
      expect(trackSpy).toHaveBeenCalledWith('flow_abandoned', expect.objectContaining({
        abandonedAt: 'step1',
        stepsCompleted: 1,
      }));
    });

    it('should track session end as analytics event', () => {
      const manager = getAnalyticsManager();
      const trackSpy = vi.spyOn(manager, 'track');
      
      tracker.endSession();
      
      expect(trackSpy).toHaveBeenCalledWith('session_end', expect.objectContaining({
        duration: expect.any(Number),
      }));
    });
  });
});
