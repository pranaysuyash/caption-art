import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ErrorRateTracker } from './errorRateTracker';
import type { ErrorType } from './types';

describe('ErrorRateTracker - Property Tests', () => {
  let tracker: ErrorRateTracker;

  beforeEach(() => {
    tracker = new ErrorRateTracker();
  });

  /**
   * Property 3: Error rate calculation
   * **Feature: performance-monitoring, Property 3: Error rate calculation**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * For any set of requests, error rate should equal (failed requests / total requests) × 100
   */
  it('Property 3: error rate should equal (errors / total requests) × 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // number of successful requests
        fc.integer({ min: 0, max: 100 }), // number of API errors
        fc.integer({ min: 0, max: 100 }), // number of network errors
        fc.integer({ min: 0, max: 100 }), // number of client errors
        (successfulRequests, apiErrors, networkErrors, clientErrors) => {
          // Clear previous data
          tracker.clearErrors();

          // Record successful requests
          for (let i = 0; i < successfulRequests; i++) {
            tracker.recordRequest();
          }

          // Record API errors
          for (let i = 0; i < apiErrors; i++) {
            tracker.recordAPIError(`/api/endpoint${i}`, 500, `API error ${i}`);
          }

          // Record network errors
          for (let i = 0; i < networkErrors; i++) {
            tracker.recordNetworkError(`/api/endpoint${i}`, `Network error ${i}`);
          }

          // Record client errors (these don't increment total requests)
          for (let i = 0; i < clientErrors; i++) {
            tracker.recordClientError(`Client error ${i}`);
          }

          // Calculate error rate
          const stats = tracker.calculateErrorRate();

          // Total errors should be sum of all error types
          const expectedTotalErrors = apiErrors + networkErrors + clientErrors;
          expect(stats.totalErrors).toBe(expectedTotalErrors);

          // Total requests should be successful + API errors + network errors
          // (client errors don't count as requests)
          const expectedTotalRequests = successfulRequests + apiErrors + networkErrors;
          expect(stats.totalRequests).toBe(expectedTotalRequests);

          // Calculate expected error rate
          const expectedErrorRate = expectedTotalRequests > 0
            ? (expectedTotalErrors / expectedTotalRequests) * 100
            : 0;

          // Error rate should match the formula: (errors / total requests) × 100
          expect(stats.errorRate).toBeCloseTo(expectedErrorRate, 10);

          // Verify error categorization
          expect(stats.errorsByType.api).toBe(apiErrors);
          expect(stats.errorsByType.network).toBe(networkErrors);
          expect(stats.errorsByType.client).toBe(clientErrors);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Error rate should be between 0 and 100
   */
  it('error rate should always be between 0 and 100 percent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (successfulRequests, errors) => {
          tracker.clearErrors();

          for (let i = 0; i < successfulRequests; i++) {
            tracker.recordRequest();
          }

          for (let i = 0; i < errors; i++) {
            tracker.recordAPIError(`/api/test${i}`, 500, 'Error');
          }

          const stats = tracker.calculateErrorRate();

          expect(stats.errorRate).toBeGreaterThanOrEqual(0);
          expect(stats.errorRate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Error filtering by type should preserve total count
   */
  it('sum of errors by type should equal total errors', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom<ErrorType>('api', 'network', 'client'),
            endpoint: fc.string({ minLength: 1, maxLength: 20 }),
            message: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (errorRecords) => {
          tracker.clearErrors();

          // Record each error based on its type
          for (const record of errorRecords) {
            if (record.type === 'api') {
              tracker.recordAPIError(record.endpoint, 500, record.message);
            } else if (record.type === 'network') {
              tracker.recordNetworkError(record.endpoint, record.message);
            } else {
              tracker.recordClientError(record.message);
            }
          }

          const stats = tracker.calculateErrorRate();

          // Sum of errors by type should equal total errors
          const sumByType = stats.errorsByType.api + 
                           stats.errorsByType.network + 
                           stats.errorsByType.client;
          
          expect(sumByType).toBe(stats.totalErrors);
          expect(stats.totalErrors).toBe(errorRecords.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
