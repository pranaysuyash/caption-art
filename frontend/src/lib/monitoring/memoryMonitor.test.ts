import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryMonitor } from './memoryMonitor';
import type { MemoryUsageMetric, MemoryMonitoringService } from './types';

describe('MemoryMonitor', () => {
  let monitor: MemoryMonitor;
  let mockService: MemoryMonitoringService;

  beforeEach(() => {
    mockService = {
      reportMemoryMetric: vi.fn(),
      reportMemoryStats: vi.fn(),
      triggerMemoryWarning: vi.fn(),
      triggerMemoryLeakAlert: vi.fn(),
    };
    monitor = new MemoryMonitor(mockService);
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('Memory Sampling', () => {
    it('should record memory metrics', () => {
      const metric: MemoryUsageMetric = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: Date.now(),
        exceedsThreshold: false,
      };

      monitor.addMetric(metric);

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metric);
    });

    it('should get current memory usage', () => {
      const metric1: MemoryUsageMetric = {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: Date.now(),
        exceedsThreshold: false,
      };

      const metric2: MemoryUsageMetric = {
        usedJSHeapSize: 12000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 600,
        timestamp: Date.now(),
        exceedsThreshold: false,
      };

      monitor.addMetric(metric1);
      monitor.addMetric(metric2);

      const current = monitor.getCurrentUsage();
      expect(current).toEqual(metric2);
    });

    it('should calculate average memory usage', () => {
      monitor.addMetric({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: Date.now(),
        exceedsThreshold: false,
      });

      monitor.addMetric({
        usedJSHeapSize: 20000000,
        totalJSHeapSize: 25000000,
        jsHeapSizeLimit: 30000000,
        domNodeCount: 600,
        timestamp: Date.now(),
        exceedsThreshold: false,
      });

      const average = monitor.getAverageUsage();
      expect(average).toBe(15000000);
    });

    it('should get peak memory usage', () => {
      monitor.addMetric({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: Date.now(),
        exceedsThreshold: false,
      });

      monitor.addMetric({
        usedJSHeapSize: 25000000,
        totalJSHeapSize: 30000000,
        jsHeapSizeLimit: 40000000,
        domNodeCount: 600,
        timestamp: Date.now(),
        exceedsThreshold: false,
      });

      monitor.addMetric({
        usedJSHeapSize: 15000000,
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 30000000,
        domNodeCount: 550,
        timestamp: Date.now(),
        exceedsThreshold: false,
      });

      const peak = monitor.getPeakUsage();
      expect(peak).toBe(25000000);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not detect leak with insufficient samples', () => {
      monitor.addMetric({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: Date.now(),
        exceedsThreshold: false,
      });

      const indicator = monitor.detectMemoryLeak();
      expect(indicator.detected).toBe(false);
    });

    it('should detect leak with consecutive increases', () => {
      const baseTime = Date.now();
      
      // Add 5 samples with increasing memory usage
      // Growth rate needs to exceed 1MB/s (1048576 bytes/s)
      // Over 20 seconds (4 intervals of 5s), we need > 20MB growth
      for (let i = 0; i < 5; i++) {
        monitor.addMetric({
          usedJSHeapSize: 10000000 + (i * 6000000), // Increase by 6MB each time
          totalJSHeapSize: 15000000,
          jsHeapSizeLimit: 50000000,
          domNodeCount: 500,
          timestamp: baseTime + (i * 5000), // 5 seconds apart
          exceedsThreshold: false,
        });
      }

      const indicator = monitor.detectMemoryLeak();
      expect(indicator.detected).toBe(true);
      expect(indicator.consecutiveIncreases).toBe(4);
      expect(indicator.growthRate).toBeGreaterThan(1000000); // > 1MB/s
    });

    it('should not detect leak with fluctuating memory', () => {
      const baseTime = Date.now();
      
      monitor.addMetric({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: baseTime,
        exceedsThreshold: false,
      });

      monitor.addMetric({
        usedJSHeapSize: 12000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: baseTime + 5000,
        exceedsThreshold: false,
      });

      monitor.addMetric({
        usedJSHeapSize: 11000000, // Decrease
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: baseTime + 10000,
        exceedsThreshold: false,
      });

      monitor.addMetric({
        usedJSHeapSize: 13000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: baseTime + 15000,
        exceedsThreshold: false,
      });

      monitor.addMetric({
        usedJSHeapSize: 14000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: baseTime + 20000,
        exceedsThreshold: false,
      });

      const indicator = monitor.detectMemoryLeak();
      expect(indicator.detected).toBe(false);
    });
  });

  describe('Component Memory Tracking', () => {
    it('should register components', () => {
      monitor.registerComponent('ComponentA', 5000000);
      monitor.registerComponent('ComponentB', 3000000);

      const highMemory = monitor.getHighMemoryComponents(1000000);
      expect(highMemory).toHaveLength(2);
      expect(highMemory[0].componentName).toBe('ComponentA');
      expect(highMemory[0].estimatedSize).toBe(5000000);
    });

    it('should unregister components', () => {
      monitor.registerComponent('ComponentA', 5000000);
      monitor.registerComponent('ComponentB', 3000000);
      monitor.unregisterComponent('ComponentA');

      const highMemory = monitor.getHighMemoryComponents(1000000);
      expect(highMemory).toHaveLength(1);
      expect(highMemory[0].componentName).toBe('ComponentB');
    });

    it('should filter components by threshold', () => {
      monitor.registerComponent('ComponentA', 5000000);
      monitor.registerComponent('ComponentB', 3000000);
      monitor.registerComponent('ComponentC', 500000);

      const highMemory = monitor.getHighMemoryComponents(2000000);
      expect(highMemory).toHaveLength(2);
      expect(highMemory.map(c => c.componentName)).toEqual(['ComponentA', 'ComponentB']);
    });

    it('should sort components by size descending', () => {
      monitor.registerComponent('ComponentA', 3000000);
      monitor.registerComponent('ComponentB', 5000000);
      monitor.registerComponent('ComponentC', 1000000);

      const highMemory = monitor.getHighMemoryComponents(0);
      expect(highMemory[0].componentName).toBe('ComponentB');
      expect(highMemory[1].componentName).toBe('ComponentA');
      expect(highMemory[2].componentName).toBe('ComponentC');
    });
  });

  describe('Threshold Checking', () => {
    it('should detect heap warning threshold', () => {
      monitor.addMetric({
        usedJSHeapSize: 16000000, // 80% of 20MB limit
        totalJSHeapSize: 18000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: Date.now(),
        exceedsThreshold: true,
      });

      const thresholds = monitor.checkThresholds();
      expect(thresholds.heapWarning).toBe(true);
      expect(thresholds.heapCritical).toBe(false);
    });

    it('should detect heap critical threshold', () => {
      monitor.addMetric({
        usedJSHeapSize: 19000000, // 95% of 20MB limit
        totalJSHeapSize: 19500000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: Date.now(),
        exceedsThreshold: true,
      });

      const thresholds = monitor.checkThresholds();
      expect(thresholds.heapWarning).toBe(true);
      expect(thresholds.heapCritical).toBe(true);
    });

    it('should detect DOM node warning threshold', () => {
      monitor.addMetric({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 1600, // Above 1500 warning
        timestamp: Date.now(),
        exceedsThreshold: true,
      });

      const thresholds = monitor.checkThresholds();
      expect(thresholds.domWarning).toBe(true);
      expect(thresholds.domCritical).toBe(false);
    });

    it('should detect DOM node critical threshold', () => {
      monitor.addMetric({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 3500, // Above 3000 critical
        timestamp: Date.now(),
        exceedsThreshold: true,
      });

      const thresholds = monitor.checkThresholds();
      expect(thresholds.domWarning).toBe(true);
      expect(thresholds.domCritical).toBe(true);
    });
  });

  describe('Memory Statistics', () => {
    it('should return comprehensive memory stats', () => {
      const baseTime = Date.now();
      
      monitor.addMetric({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: baseTime,
        exceedsThreshold: false,
      });

      monitor.addMetric({
        usedJSHeapSize: 15000000,
        totalJSHeapSize: 18000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 600,
        timestamp: baseTime + 5000,
        exceedsThreshold: false,
      });

      monitor.registerComponent('ComponentA', 5000000);

      const stats = monitor.getMemoryStats();
      expect(stats).not.toBeNull();
      expect(stats!.currentUsage.usedJSHeapSize).toBe(15000000);
      expect(stats!.averageUsage).toBe(12500000);
      expect(stats!.peakUsage).toBe(15000000);
      expect(stats!.leakIndicator).toBeDefined();
      expect(stats!.highMemoryComponents).toHaveLength(1);
    });

    it('should return null stats when no metrics', () => {
      const stats = monitor.getMemoryStats();
      expect(stats).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    it('should clear metrics', () => {
      monitor.addMetric({
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 15000000,
        jsHeapSizeLimit: 20000000,
        domNodeCount: 500,
        timestamp: Date.now(),
        exceedsThreshold: false,
      });

      expect(monitor.getMetrics()).toHaveLength(1);
      
      monitor.clearMetrics();
      
      expect(monitor.getMetrics()).toHaveLength(0);
    });

    it('should return empty array when no metrics', () => {
      const metrics = monitor.getMetrics();
      expect(metrics).toEqual([]);
    });

    it('should return 0 for average when no metrics', () => {
      const average = monitor.getAverageUsage();
      expect(average).toBe(0);
    });

    it('should return 0 for peak when no metrics', () => {
      const peak = monitor.getPeakUsage();
      expect(peak).toBe(0);
    });
  });
});
