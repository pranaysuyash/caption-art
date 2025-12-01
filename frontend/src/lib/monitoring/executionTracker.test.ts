import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionTracker } from './executionTracker';
import type { ExecutionMonitoringService } from './types';

describe('ExecutionTracker', () => {
  let tracker: ExecutionTracker;
  let mockService: ExecutionMonitoringService;

  beforeEach(() => {
    mockService = {
      reportExecutionMetric: vi.fn(),
      reportExecutionStats: vi.fn(),
      triggerSlowFunctionAlert: vi.fn(),
    };
    tracker = new ExecutionTracker(mockService);
  });

  describe('startMeasure and endMeasure', () => {
    it('should measure function execution time', () => {
      const measureId = tracker.startMeasure('testFunction');
      expect(measureId).toBeTruthy();
      
      const metric = tracker.endMeasure(measureId, 'testFunction');
      
      expect(metric).toBeTruthy();
      expect(metric?.functionName).toBe('testFunction');
      expect(metric?.duration).toBeGreaterThanOrEqual(0);
      expect(metric?.timestamp).toBeGreaterThan(0);
    });

    it('should flag slow functions exceeding 50ms threshold', async () => {
      const measureId = tracker.startMeasure('slowFunction');
      
      // Simulate slow execution
      await new Promise(resolve => setTimeout(resolve, 60));
      
      const metric = tracker.endMeasure(measureId, 'slowFunction');
      
      expect(metric?.isSlow).toBe(true);
      expect(metric?.duration).toBeGreaterThan(50);
    });

    it('should not flag fast functions', () => {
      const measureId = tracker.startMeasure('fastFunction');
      const metric = tracker.endMeasure(measureId, 'fastFunction');
      
      expect(metric?.isSlow).toBe(false);
      expect(metric?.duration).toBeLessThan(50);
    });

    it('should return null for invalid measure ID', () => {
      const metric = tracker.endMeasure('invalid-id', 'testFunction');
      expect(metric).toBeNull();
    });
  });

  describe('measureFunction', () => {
    it('should measure synchronous function execution', async () => {
      const result = await tracker.measureFunction('syncFunc', () => {
        return 42;
      });
      
      expect(result).toBe(42);
      
      const metrics = tracker.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].functionName).toBe('syncFunc');
    });

    it('should measure asynchronous function execution', async () => {
      const result = await tracker.measureFunction('asyncFunc', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });
      
      expect(result).toBe('done');
      
      const metrics = tracker.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].functionName).toBe('asyncFunc');
    });

    it('should measure function even if it throws', async () => {
      await expect(
        tracker.measureFunction('errorFunc', () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');
      
      const metrics = tracker.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].functionName).toBe('errorFunc');
    });
  });

  describe('getMetrics', () => {
    it('should return all recorded metrics', () => {
      const id1 = tracker.startMeasure('func1');
      tracker.endMeasure(id1, 'func1');
      
      const id2 = tracker.startMeasure('func2');
      tracker.endMeasure(id2, 'func2');
      
      const metrics = tracker.getMetrics();
      expect(metrics.length).toBe(2);
    });

    it('should return copy of metrics array', () => {
      const id = tracker.startMeasure('func');
      tracker.endMeasure(id, 'func');
      
      const metrics1 = tracker.getMetrics();
      const metrics2 = tracker.getMetrics();
      
      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('getMetricsByFunction', () => {
    it('should filter metrics by function name', () => {
      const id1 = tracker.startMeasure('funcA');
      tracker.endMeasure(id1, 'funcA');
      
      const id2 = tracker.startMeasure('funcB');
      tracker.endMeasure(id2, 'funcB');
      
      const id3 = tracker.startMeasure('funcA');
      tracker.endMeasure(id3, 'funcA');
      
      const metricsA = tracker.getMetricsByFunction('funcA');
      expect(metricsA.length).toBe(2);
      expect(metricsA.every(m => m.functionName === 'funcA')).toBe(true);
    });
  });

  describe('getSlowExecutions', () => {
    it('should return only slow executions excluding long tasks', async () => {
      // Create a fresh tracker without long task observer interference
      const freshTracker = new ExecutionTracker(null);
      
      // Fast execution
      const id1 = freshTracker.startMeasure('fast');
      freshTracker.endMeasure(id1, 'fast');
      
      // Slow execution
      const id2 = freshTracker.startMeasure('slow');
      await new Promise(resolve => setTimeout(resolve, 60));
      const metric = freshTracker.endMeasure(id2, 'slow');
      
      // Verify the metric was recorded as slow
      expect(metric?.isSlow).toBe(true);
      expect(metric?.isLongTask).toBe(false);
      
      const slowMetrics = freshTracker.getSlowExecutions();
      // Should have at least one slow execution (excluding any long tasks)
      expect(slowMetrics.length).toBeGreaterThanOrEqual(1);
      expect(slowMetrics[0].isSlow).toBe(true);
      expect(slowMetrics[0].isLongTask).toBe(false);
      
      freshTracker.destroy();
    });
  });

  describe('getSlowestOperations', () => {
    it('should return operations sorted by duration', async () => {
      const id1 = tracker.startMeasure('func1');
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.endMeasure(id1, 'func1');
      
      const id2 = tracker.startMeasure('func2');
      await new Promise(resolve => setTimeout(resolve, 30));
      tracker.endMeasure(id2, 'func2');
      
      const id3 = tracker.startMeasure('func3');
      await new Promise(resolve => setTimeout(resolve, 20));
      tracker.endMeasure(id3, 'func3');
      
      const slowest = tracker.getSlowestOperations(2);
      expect(slowest.length).toBe(2);
      expect(slowest[0].duration).toBeGreaterThan(slowest[1].duration);
    });

    it('should limit results to specified count', async () => {
      for (let i = 0; i < 5; i++) {
        const id = tracker.startMeasure(`func${i}`);
        tracker.endMeasure(id, `func${i}`);
      }
      
      const slowest = tracker.getSlowestOperations(3);
      expect(slowest.length).toBe(3);
    });
  });

  describe('calculateStats', () => {
    it('should calculate execution statistics', async () => {
      // Create a fresh tracker to avoid long task observer interference
      const freshTracker = new ExecutionTracker(null);
      
      // Add some metrics
      const id1 = freshTracker.startMeasure('fast');
      freshTracker.endMeasure(id1, 'fast');
      
      const id2 = freshTracker.startMeasure('slow');
      await new Promise(resolve => setTimeout(resolve, 60));
      freshTracker.endMeasure(id2, 'slow');
      
      const stats = freshTracker.calculateStats();
      
      // Should have at least 2 executions (excluding long tasks)
      expect(stats.totalExecutions).toBeGreaterThanOrEqual(2);
      expect(stats.slowExecutions).toBeGreaterThanOrEqual(1);
      expect(stats.slowestOperations).toBeTruthy();
      expect(Array.isArray(stats.slowestOperations)).toBe(true);
      
      freshTracker.destroy();
    });

    it('should report stats to monitoring service', () => {
      tracker.calculateStats();
      expect(mockService.reportExecutionStats).toHaveBeenCalled();
    });
  });

  describe('monitoring service integration', () => {
    it('should report metrics to monitoring service', () => {
      const id = tracker.startMeasure('testFunc');
      tracker.endMeasure(id, 'testFunc');
      
      expect(mockService.reportExecutionMetric).toHaveBeenCalled();
    });

    it('should trigger alert for slow functions', async () => {
      // Create a fresh tracker to avoid interference from long task observer
      const freshMockService = {
        reportExecutionMetric: vi.fn(),
        reportExecutionStats: vi.fn(),
        triggerSlowFunctionAlert: vi.fn(),
      };
      const freshTracker = new ExecutionTracker(freshMockService);
      
      const id = freshTracker.startMeasure('slowFunc');
      await new Promise(resolve => setTimeout(resolve, 60));
      freshTracker.endMeasure(id, 'slowFunc');
      
      expect(freshMockService.triggerSlowFunctionAlert).toHaveBeenCalled();
      
      freshTracker.destroy();
    });

    it('should work without monitoring service', () => {
      const trackerNoService = new ExecutionTracker(null);
      
      const id = trackerNoService.startMeasure('func');
      const metric = trackerNoService.endMeasure(id, 'func');
      
      expect(metric).toBeTruthy();
      
      trackerNoService.destroy();
    });
  });

  describe('clearMetrics', () => {
    it('should clear all stored metrics', () => {
      const id = tracker.startMeasure('func');
      tracker.endMeasure(id, 'func');
      
      expect(tracker.getMetrics().length).toBeGreaterThan(0);
      
      tracker.clearMetrics();
      
      expect(tracker.getMetrics().length).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const id = tracker.startMeasure('func');
      tracker.endMeasure(id, 'func');
      
      tracker.destroy();
      
      expect(tracker.getMetrics().length).toBe(0);
    });
  });
});
