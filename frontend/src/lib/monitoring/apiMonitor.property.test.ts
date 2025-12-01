import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { APIMonitor } from './apiMonitor';

describe('APIMonitor - Property Tests', () => {
  let monitor: APIMonitor;

  beforeEach(() => {
    monitor = new APIMonitor();
  });

  /**
   * Property 2: API timing accuracy
   * **Validates: Requirements 2.1, 2.2**
   * 
   * For any API request, the measured duration should be within 10ms of the actual time
   */
  it('Property 2: measured duration should be within 10ms of actual elapsed time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // endpoint
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'), // method
        fc.integer({ min: 100, max: 599 }), // statusCode
        fc.integer({ min: 10, max: 500 }), // delay in ms
        async (endpoint, method, statusCode, delayMs) => {
          // Start tracking the request
          const requestId = monitor.startRequest(endpoint, method);

          // Wait for the specified delay
          const startTime = performance.now();
          await new Promise(resolve => setTimeout(resolve, delayMs));
          const actualElapsed = performance.now() - startTime;

          // End tracking the request
          const metric = monitor.endRequest(requestId, endpoint, method, statusCode);

          // Verify metric was recorded
          expect(metric).not.toBeNull();
          if (metric) {
            // The measured duration should be within 10ms of actual elapsed time
            const difference = Math.abs(metric.duration - actualElapsed);
            expect(difference).toBeLessThanOrEqual(10);

            // Verify other fields are correct
            expect(metric.endpoint).toBe(endpoint);
            expect(metric.method).toBe(method);
            expect(metric.statusCode).toBe(statusCode);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Percentile accuracy
   * **Validates: Requirements 2.5**
   * 
   * For any set of response times, p50 ≤ p95 ≤ p99
   */
  it('Property 5: percentiles should be ordered p50 <= p95 <= p99', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 10000 }), { minLength: 1, maxLength: 100 }), // array of durations
        (durations) => {
          // Clear previous metrics
          monitor.clearMetrics();

          // Add metrics with the specified durations
          durations.forEach((duration, index) => {
            const metric = {
              endpoint: `/api/test${index}`,
              method: 'GET',
              statusCode: 200,
              duration,
              timestamp: Date.now(),
              isSlow: duration > 3000,
            };
            monitor.addMetric(metric);
          });

          // Calculate percentiles
          const percentiles = monitor.calculatePercentiles();

          // Verify the ordering: p50 <= p95 <= p99
          expect(percentiles.p50).toBeLessThanOrEqual(percentiles.p95);
          expect(percentiles.p95).toBeLessThanOrEqual(percentiles.p99);
        }
      ),
      { numRuns: 100 }
    );
  });
});
