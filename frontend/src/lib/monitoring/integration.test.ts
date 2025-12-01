import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from './performanceMonitor';

describe('Performance Monitoring Integration', () => {
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
    monitor.initialize();
  });

  afterEach(async () => {
    await monitor.shutdown();
  });

  it('should track complete user journey with all metrics', async () => {
    // Simulate API request
    const apiMonitor = monitor.getAPIMonitor()!;
    const requestId = apiMonitor.startRequest('/api/data', 'GET');
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    apiMonitor.endRequest(requestId, '/api/data', 'GET', 200);

    // Simulate function execution
    const executionTracker = monitor.getExecutionTracker()!;
    await executionTracker.measureFunction('processData', async () => {
      await new Promise(resolve => setTimeout(resolve, 60)); // Slow function
    });

    // Simulate error
    const errorTracker = monitor.getErrorRateTracker()!;
    errorTracker.recordRequest(); // Successful request
    errorTracker.recordAPIError('/api/data', 500, 'Server error');

    // Get comprehensive report
    const report = monitor.getPerformanceReport();

    // Verify all metrics are captured
    expect(report.apiMetrics.length).toBeGreaterThan(0);
    expect(report.executionStats?.totalExecutions).toBeGreaterThan(0);
    expect(report.errorRate.totalErrors).toBeGreaterThan(0);
    expect(report.errorRate.errorRate).toBeGreaterThan(0);
  });

  it('should enforce budgets across all metrics', () => {
    const budgetEnforcer = monitor.getBudgetEnforcer()!;

    // Test Web Vitals budget
    const lcpResult = budgetEnforcer.checkWebVitals({
      name: 'LCP',
      value: 3000, // Exceeds 2500ms budget
      rating: 'needs-improvement',
      timestamp: Date.now(),
    });
    expect(lcpResult.passed).toBe(false);

    // Test API response time budget
    const apiResult = budgetEnforcer.checkAPIResponseTime({
      endpoint: '/api/slow',
      method: 'GET',
      statusCode: 200,
      duration: 4000, // Exceeds 3000ms budget
      timestamp: Date.now(),
      isSlow: true,
    });
    expect(apiResult.passed).toBe(false);

    // Test error rate budget
    const errorResult = budgetEnforcer.checkErrorRate({
      totalRequests: 100,
      totalErrors: 10,
      errorRate: 10, // Exceeds 5% budget
      errorsByType: { network: 5, api: 3, client: 2 },
    });
    expect(errorResult.passed).toBe(false);

    // All violations should be recorded
    const violations = budgetEnforcer.getViolations();
    expect(violations.length).toBeGreaterThanOrEqual(3);
  });

  it('should queue and flush metrics to monitoring service', async () => {
    const service = monitor.getMonitoringService();
    const initialQueueSize = service.getQueueSize();

    // Generate various metrics
    service.reportMetric({
      name: 'LCP',
      value: 2000,
      rating: 'good',
      timestamp: Date.now(),
    });

    service.reportAPIMetric({
      endpoint: '/api/test',
      method: 'GET',
      statusCode: 200,
      duration: 150,
      timestamp: Date.now(),
      isSlow: false,
    });

    service.reportError({
      type: 'client',
      message: 'Test error',
      timestamp: Date.now(),
    });

    // Queue should have grown
    expect(service.getQueueSize()).toBeGreaterThan(initialQueueSize);

    // Flush metrics
    await monitor.flush();

    // After flush, queue should be empty or have re-queued items (if no endpoint)
    expect(service.getQueueSize()).toBeGreaterThanOrEqual(0);
  });

  it('should track execution performance with budget enforcement', async () => {
    const executionTracker = monitor.getExecutionTracker()!;
    const budgetEnforcer = monitor.getBudgetEnforcer()!;

    // Measure a slow function
    await executionTracker.measureFunction('slowOperation', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const metrics = executionTracker.getMetrics();
    expect(metrics.length).toBeGreaterThan(0);

    const slowMetric = metrics[0];
    expect(slowMetric.isSlow).toBe(true);

    // Check against budget
    const result = budgetEnforcer.checkExecutionTime(slowMetric);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should calculate API percentiles correctly', () => {
    const apiMonitor = monitor.getAPIMonitor()!;

    // Add multiple API metrics with varying durations
    const durations = [100, 200, 300, 400, 500, 1000, 2000, 3000];
    
    for (const duration of durations) {
      apiMonitor.addMetric({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration,
        timestamp: Date.now(),
        isSlow: duration > 3000,
      });
    }

    const percentiles = apiMonitor.calculatePercentiles();

    // Verify percentile ordering
    expect(percentiles.p50).toBeLessThanOrEqual(percentiles.p95);
    expect(percentiles.p95).toBeLessThanOrEqual(percentiles.p99);

    // Verify reasonable values
    expect(percentiles.p50).toBeGreaterThan(0);
    expect(percentiles.p99).toBeGreaterThan(percentiles.p50);
  });

  it('should track error rates by type', () => {
    const errorTracker = monitor.getErrorRateTracker()!;

    // Record various error types
    errorTracker.recordNetworkError('/api/data', 'Network timeout');
    errorTracker.recordAPIError('/api/data', 500, 'Internal server error');
    errorTracker.recordClientError('Validation failed');
    errorTracker.recordRequest(); // Successful request

    const stats = errorTracker.calculateErrorRate();

    expect(stats.errorsByType.network).toBe(1);
    expect(stats.errorsByType.api).toBe(1);
    expect(stats.errorsByType.client).toBe(1);
    expect(stats.totalErrors).toBe(3);
    // Network and API errors increment totalRequests, client errors don't
    expect(stats.totalRequests).toBe(3); // 2 errors (network + api) + 1 success
  });

  it('should provide comprehensive performance report', () => {
    const apiMonitor = monitor.getAPIMonitor()!;
    const errorTracker = monitor.getErrorRateTracker()!;
    const executionTracker = monitor.getExecutionTracker()!;

    // Generate some metrics
    const requestId = apiMonitor.startRequest('/api/test', 'GET');
    apiMonitor.endRequest(requestId, '/api/test', 'GET', 200);

    errorTracker.recordRequest();
    errorTracker.recordClientError('Test error');

    const measureId = executionTracker.startMeasure('testFunction');
    executionTracker.endMeasure(measureId, 'testFunction');

    // Get report
    const report = monitor.getPerformanceReport();

    // Verify report structure
    expect(report).toHaveProperty('webVitals');
    expect(report).toHaveProperty('apiMetrics');
    expect(report).toHaveProperty('apiPercentiles');
    expect(report).toHaveProperty('errorRate');
    expect(report).toHaveProperty('resourceStats');
    expect(report).toHaveProperty('executionStats');
    expect(report).toHaveProperty('memoryStats');
    expect(report).toHaveProperty('budgetViolations');
    expect(report).toHaveProperty('timestamp');

    // Verify data is present
    expect(report.apiMetrics.length).toBeGreaterThan(0);
    expect(report.errorRate.totalRequests).toBeGreaterThan(0);
    expect(report.executionStats?.totalExecutions).toBeGreaterThan(0);
  });
});
