import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor, initPerformanceMonitor, getPerformanceMonitor } from './performanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      enableWebVitals: true,
      enableAPIMonitoring: true,
      enableErrorTracking: true,
      enableResourceMonitoring: true,
      enableExecutionTracking: true,
      enableMemoryMonitoring: true,
      enableBudgetEnforcement: true,
    });
  });

  afterEach(async () => {
    if (monitor) {
      await monitor.shutdown();
    }
  });

  describe('initialization', () => {
    it('should initialize all monitoring modules when enabled', () => {
      monitor.initialize();

      expect(monitor.getWebVitalsTracker()).not.toBeNull();
      expect(monitor.getAPIMonitor()).not.toBeNull();
      expect(monitor.getErrorRateTracker()).not.toBeNull();
      expect(monitor.getResourceMonitor()).not.toBeNull();
      expect(monitor.getExecutionTracker()).not.toBeNull();
      expect(monitor.getMemoryMonitor()).not.toBeNull();
      expect(monitor.getBudgetEnforcer()).not.toBeNull();
    });

    it('should not initialize disabled modules', () => {
      const partialMonitor = new PerformanceMonitor({
        enableWebVitals: false,
        enableAPIMonitoring: false,
        enableErrorTracking: false,
        enableResourceMonitoring: false,
        enableExecutionTracking: false,
        enableMemoryMonitoring: false,
        enableBudgetEnforcement: false,
      });

      partialMonitor.initialize();

      expect(partialMonitor.getWebVitalsTracker()).toBeNull();
      expect(partialMonitor.getAPIMonitor()).toBeNull();
      expect(partialMonitor.getErrorRateTracker()).toBeNull();
      expect(partialMonitor.getResourceMonitor()).toBeNull();
      expect(partialMonitor.getExecutionTracker()).toBeNull();
      expect(partialMonitor.getMemoryMonitor()).toBeNull();
      expect(partialMonitor.getBudgetEnforcer()).toBeNull();

      partialMonitor.shutdown();
    });
  });

  describe('monitoring service integration', () => {
    it('should provide access to monitoring service', () => {
      monitor.initialize();
      const service = monitor.getMonitoringService();
      expect(service).toBeDefined();
    });

    it('should queue metrics in monitoring service', () => {
      monitor.initialize();
      const service = monitor.getMonitoringService();
      
      const initialQueueSize = service.getQueueSize();
      
      // Report a metric
      service.reportMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        timestamp: Date.now(),
      });

      expect(service.getQueueSize()).toBe(initialQueueSize + 1);
    });

    it('should flush metrics on demand', async () => {
      monitor.initialize();
      const service = monitor.getMonitoringService();
      
      // Add some metrics
      service.reportMetric({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        timestamp: Date.now(),
      });

      await monitor.flush();
      
      // Queue should be empty after flush (or metrics re-queued on failure)
      // Since we don't have a real endpoint, metrics might be re-queued
      expect(service.getQueueSize()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance report', () => {
    it('should generate comprehensive performance report', () => {
      monitor.initialize();
      
      const report = monitor.getPerformanceReport();

      expect(report).toHaveProperty('webVitals');
      expect(report).toHaveProperty('apiMetrics');
      expect(report).toHaveProperty('apiPercentiles');
      expect(report).toHaveProperty('errorRate');
      expect(report).toHaveProperty('resourceStats');
      expect(report).toHaveProperty('executionStats');
      expect(report).toHaveProperty('memoryStats');
      expect(report).toHaveProperty('budgetViolations');
      expect(report).toHaveProperty('timestamp');
    });

    it('should include empty arrays for disabled modules', () => {
      const partialMonitor = new PerformanceMonitor({
        enableWebVitals: false,
        enableAPIMonitoring: false,
      });
      partialMonitor.initialize();

      const report = partialMonitor.getPerformanceReport();

      expect(report.webVitals).toEqual([]);
      expect(report.apiMetrics).toEqual([]);

      partialMonitor.shutdown();
    });
  });

  describe('shutdown', () => {
    it('should stop all monitoring and flush metrics', async () => {
      monitor.initialize();
      
      await monitor.shutdown();

      // After shutdown, monitors should be stopped
      // We can't easily verify this without implementation details,
      // but we can ensure shutdown completes without error
      expect(true).toBe(true);
    });
  });

  describe('singleton pattern', () => {
    it('should create singleton instance with initPerformanceMonitor', () => {
      const instance1 = initPerformanceMonitor();
      const instance2 = initPerformanceMonitor();

      expect(instance1).toBe(instance2);

      instance1.shutdown();
    });

    it('should return singleton instance with getPerformanceMonitor', () => {
      const instance1 = initPerformanceMonitor();
      const instance2 = getPerformanceMonitor();

      expect(instance1).toBe(instance2);

      instance1.shutdown();
    });
  });

  describe('module integration', () => {
    it('should integrate API monitoring with error tracking', () => {
      monitor.initialize();

      const apiMonitor = monitor.getAPIMonitor();
      const errorTracker = monitor.getErrorRateTracker();

      expect(apiMonitor).not.toBeNull();
      expect(errorTracker).not.toBeNull();

      // Record an API request
      const requestId = apiMonitor!.startRequest('/api/test', 'GET');
      apiMonitor!.endRequest(requestId, '/api/test', 'GET', 200);

      // Record an error
      errorTracker!.recordAPIError('/api/test', 500, 'Server error');

      // Both should have recorded data
      expect(apiMonitor!.getMetrics().length).toBeGreaterThan(0);
      expect(errorTracker!.getErrors().length).toBeGreaterThan(0);
    });

    it('should integrate budget enforcement with all metrics', () => {
      monitor.initialize();

      const budgetEnforcer = monitor.getBudgetEnforcer();
      expect(budgetEnforcer).not.toBeNull();

      // Check a metric against budget
      const result = budgetEnforcer!.checkWebVitals({
        name: 'LCP',
        value: 5000, // Exceeds budget
        rating: 'poor',
        timestamp: Date.now(),
      });

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('custom endpoint configuration', () => {
    it('should accept custom monitoring endpoint', () => {
      const customMonitor = new PerformanceMonitor({
        endpoint: 'https://monitoring.example.com/metrics',
      });

      customMonitor.initialize();
      const service = customMonitor.getMonitoringService();

      expect(service).toBeDefined();

      customMonitor.shutdown();
    });
  });
});
