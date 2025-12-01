/**
 * Property-based tests for WebVitalsTracker
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { WebVitalsTracker } from './webVitalsTracker';
import type { MonitoringService, WebVitalsMetric } from './types';

/**
 * Mock monitoring service for testing
 */
class MockMonitoringService implements MonitoringService {
  public reportedMetrics: WebVitalsMetric[] = [];
  public alerts: WebVitalsMetric[] = [];

  reportMetric(metric: WebVitalsMetric): void {
    this.reportedMetrics.push(metric);
  }

  triggerAlert(metric: WebVitalsMetric): void {
    this.alerts.push(metric);
  }

  reset(): void {
    this.reportedMetrics = [];
    this.alerts = [];
  }
}

/**
 * Arbitrary generator for LCP values (in milliseconds)
 * Range: 0-10000ms (0-10 seconds)
 */
const lcpArbitrary = fc.double({ min: 0, max: 10000, noNaN: true });

/**
 * Arbitrary generator for FID values (in milliseconds)
 * Range: 0-1000ms (0-1 second)
 */
const fidArbitrary = fc.double({ min: 0, max: 1000, noNaN: true });

/**
 * Arbitrary generator for CLS values (unitless)
 * Range: 0-1 (typical CLS scores)
 */
const clsArbitrary = fc.double({ min: 0, max: 1, noNaN: true });

describe('WebVitalsTracker', () => {
  let mockService: MockMonitoringService;

  beforeEach(() => {
    mockService = new MockMonitoringService();
  });

  describe('Property 1: Core Web Vitals measurement', () => {
    /**
     * **Feature: performance-monitoring, Property 1: Core Web Vitals measurement**
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
     * 
     * For any page load, LCP, FID, and CLS should all be measured and reported
     * 
     * Note: Since we cannot simulate actual browser performance events in a test environment,
     * we test the tracker's ability to record and report metrics when they are provided.
     * This validates the measurement and reporting logic.
     */
    it('should measure and report all three Core Web Vitals metrics', () => {
      fc.assert(
        fc.property(
          lcpArbitrary,
          fidArbitrary,
          clsArbitrary,
          (lcpValue, fidValue, clsValue) => {
            // Create a fresh tracker and mock service for each test
            const service = new MockMonitoringService();
            const tracker = new WebVitalsTracker(service);

            // Simulate recording all three metrics
            // In a real browser, these would be captured by PerformanceObserver
            const lcpMetric: WebVitalsMetric = {
              name: 'LCP',
              value: lcpValue,
              rating: lcpValue <= 2500 ? 'good' : lcpValue <= 4000 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            };

            const fidMetric: WebVitalsMetric = {
              name: 'FID',
              value: fidValue,
              rating: fidValue <= 100 ? 'good' : fidValue <= 300 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            };

            const clsMetric: WebVitalsMetric = {
              name: 'CLS',
              value: clsValue,
              rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            };

            // Use the private recordMetric method via reflection to simulate metric collection
            // This tests the core measurement and reporting logic
            (tracker as any).recordMetric(lcpMetric);
            (tracker as any).recordMetric(fidMetric);
            (tracker as any).recordMetric(clsMetric);

            // Verify all three metrics were measured
            const metrics = tracker.getMetrics();
            expect(metrics).toHaveLength(3);

            // Verify each metric type is present
            const metricNames = metrics.map(m => m.name);
            expect(metricNames).toContain('LCP');
            expect(metricNames).toContain('FID');
            expect(metricNames).toContain('CLS');

            // Verify all metrics were reported to the monitoring service
            expect(service.reportedMetrics).toHaveLength(3);
            const reportedNames = service.reportedMetrics.map(m => m.name);
            expect(reportedNames).toContain('LCP');
            expect(reportedNames).toContain('FID');
            expect(reportedNames).toContain('CLS');

            // Verify metrics can be retrieved individually
            expect(tracker.getMetric('LCP')).toBeDefined();
            expect(tracker.getMetric('FID')).toBeDefined();
            expect(tracker.getMetric('CLS')).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly rate metrics based on thresholds', () => {
      fc.assert(
        fc.property(
          fc.record({
            lcp: lcpArbitrary,
            fid: fidArbitrary,
            cls: clsArbitrary,
          }),
          ({ lcp, fid, cls }) => {
            const service = new MockMonitoringService();
            const tracker = new WebVitalsTracker(service);

            // Record metrics
            (tracker as any).recordMetric({
              name: 'LCP',
              value: lcp,
              rating: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            });

            (tracker as any).recordMetric({
              name: 'FID',
              value: fid,
              rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            });

            (tracker as any).recordMetric({
              name: 'CLS',
              value: cls,
              rating: cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            });

            // Verify ratings are correct
            const lcpMetric = tracker.getMetric('LCP');
            const fidMetric = tracker.getMetric('FID');
            const clsMetric = tracker.getMetric('CLS');

            // LCP thresholds: good <= 2500ms, poor > 4000ms
            if (lcp <= 2500) {
              expect(lcpMetric?.rating).toBe('good');
            } else if (lcp > 4000) {
              expect(lcpMetric?.rating).toBe('poor');
            } else {
              expect(lcpMetric?.rating).toBe('needs-improvement');
            }

            // FID thresholds: good <= 100ms, poor > 300ms
            if (fid <= 100) {
              expect(fidMetric?.rating).toBe('good');
            } else if (fid > 300) {
              expect(fidMetric?.rating).toBe('poor');
            } else {
              expect(fidMetric?.rating).toBe('needs-improvement');
            }

            // CLS thresholds: good <= 0.1, poor > 0.25
            if (cls <= 0.1) {
              expect(clsMetric?.rating).toBe('good');
            } else if (cls > 0.25) {
              expect(clsMetric?.rating).toBe('poor');
            } else {
              expect(clsMetric?.rating).toBe('needs-improvement');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger alerts for poor-rated metrics', () => {
      fc.assert(
        fc.property(
          fc.record({
            lcp: fc.double({ min: 4001, max: 10000, noNaN: true }), // Poor LCP
            fid: fc.double({ min: 301, max: 1000, noNaN: true }),   // Poor FID
            cls: fc.double({ min: 0.26, max: 1, noNaN: true }),     // Poor CLS
          }),
          ({ lcp, fid, cls }) => {
            const service = new MockMonitoringService();
            const tracker = new WebVitalsTracker(service);

            // Record poor metrics
            (tracker as any).recordMetric({
              name: 'LCP',
              value: lcp,
              rating: 'poor',
              timestamp: Date.now(),
            });

            (tracker as any).recordMetric({
              name: 'FID',
              value: fid,
              rating: 'poor',
              timestamp: Date.now(),
            });

            (tracker as any).recordMetric({
              name: 'CLS',
              value: cls,
              rating: 'poor',
              timestamp: Date.now(),
            });

            // Verify alerts were triggered for all poor metrics
            expect(service.alerts).toHaveLength(3);
            const alertNames = service.alerts.map(a => a.name);
            expect(alertNames).toContain('LCP');
            expect(alertNames).toContain('FID');
            expect(alertNames).toContain('CLS');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger alerts for good or needs-improvement metrics', () => {
      fc.assert(
        fc.property(
          fc.record({
            lcp: fc.double({ min: 0, max: 4000, noNaN: true }),    // Good or needs-improvement
            fid: fc.double({ min: 0, max: 300, noNaN: true }),     // Good or needs-improvement
            cls: fc.double({ min: 0, max: 0.25, noNaN: true }),    // Good or needs-improvement
          }),
          ({ lcp, fid, cls }) => {
            const service = new MockMonitoringService();
            const tracker = new WebVitalsTracker(service);

            // Determine ratings
            const lcpRating = lcp <= 2500 ? 'good' : 'needs-improvement';
            const fidRating = fid <= 100 ? 'good' : 'needs-improvement';
            const clsRating = cls <= 0.1 ? 'good' : 'needs-improvement';

            // Record metrics
            (tracker as any).recordMetric({
              name: 'LCP',
              value: lcp,
              rating: lcpRating,
              timestamp: Date.now(),
            });

            (tracker as any).recordMetric({
              name: 'FID',
              value: fid,
              rating: fidRating,
              timestamp: Date.now(),
            });

            (tracker as any).recordMetric({
              name: 'CLS',
              value: cls,
              rating: clsRating,
              timestamp: Date.now(),
            });

            // Verify no alerts were triggered
            expect(service.alerts).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Metric retrieval', () => {
    it('should return undefined for metrics that have not been recorded', () => {
      const tracker = new WebVitalsTracker(mockService);

      expect(tracker.getMetric('LCP')).toBeUndefined();
      expect(tracker.getMetric('FID')).toBeUndefined();
      expect(tracker.getMetric('CLS')).toBeUndefined();
    });

    it('should update metrics when recorded multiple times', () => {
      fc.assert(
        fc.property(
          fc.array(lcpArbitrary, { minLength: 2, maxLength: 5 }),
          (lcpValues) => {
            const service = new MockMonitoringService();
            const tracker = new WebVitalsTracker(service);

            // Record multiple LCP values
            for (const value of lcpValues) {
              (tracker as any).recordMetric({
                name: 'LCP',
                value,
                rating: value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor',
                timestamp: Date.now(),
              });
            }

            // Verify only one LCP metric is stored (latest)
            const metrics = tracker.getMetrics();
            const lcpMetrics = metrics.filter(m => m.name === 'LCP');
            expect(lcpMetrics).toHaveLength(1);

            // Verify the latest value is stored
            const lastValue = lcpValues[lcpValues.length - 1];
            expect(tracker.getMetric('LCP')?.value).toBe(lastValue);

            // Verify all values were reported
            expect(service.reportedMetrics.filter(m => m.name === 'LCP')).toHaveLength(lcpValues.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
