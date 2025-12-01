import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { BudgetEnforcer, DEFAULT_BUDGET } from './budgetEnforcer';
import type { 
  WebVitalsMetric, 
  APITimingMetric, 
  ErrorRateStats,
  ResourceLoadMetric,
  ExecutionMetric,
  MemoryUsageMetric 
} from './types';

describe('BudgetEnforcer - Property Tests', () => {
  let enforcer: BudgetEnforcer;

  beforeEach(() => {
    enforcer = new BudgetEnforcer();
  });

  /**
   * Property 4: Budget enforcement
   * **Feature: performance-monitoring, Property 4: Budget enforcement**
   * **Validates: Requirements 7.2, 7.4**
   * 
   * For any metric exceeding its budget, the performance check should fail
   */
  it('Property 4: any metric exceeding its budget should fail the performance check', () => {
    fc.assert(
      fc.property(
        // Generate a metric value and whether it should exceed the budget
        fc.constantFrom<'LCP' | 'FID' | 'CLS'>('LCP', 'FID', 'CLS'),
        fc.boolean(), // shouldExceedBudget
        fc.float({ min: 0, max: 10000 }), // multiplier for budget value
        (metricName, shouldExceedBudget, multiplier) => {
          const budget = DEFAULT_BUDGET[metricName];
          
          // Calculate metric value based on whether it should exceed budget
          const metricValue = shouldExceedBudget 
            ? budget * (1 + Math.abs(multiplier) / 1000) // Exceeds budget
            : budget * Math.abs(multiplier) / 10000; // Within budget

          const metric: WebVitalsMetric = {
            name: metricName,
            value: metricValue,
            rating: 'good',
            timestamp: Date.now(),
          };

          const result = enforcer.checkWebVitals(metric);

          // If metric exceeds budget, check should fail
          if (metricValue > budget) {
            expect(result.passed).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
            expect(result.violations[0].metric).toBe(metricName);
            expect(result.violations[0].actualValue).toBe(metricValue);
            expect(result.violations[0].budgetValue).toBe(budget);
          } else {
            // If metric is within budget, check should pass
            expect(result.passed).toBe(true);
            expect(result.violations.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: API response time exceeding budget should fail
   */
  it('API response time exceeding budget should fail the check', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // duration in ms
        fc.string({ minLength: 1, maxLength: 50 }), // endpoint
        (duration, endpoint) => {
          const metric: APITimingMetric = {
            endpoint,
            method: 'GET',
            statusCode: 200,
            duration,
            timestamp: Date.now(),
            isSlow: duration > 3000,
          };

          const result = enforcer.checkAPIResponseTime(metric);

          if (duration > DEFAULT_BUDGET.apiResponseTime) {
            expect(result.passed).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
          } else {
            expect(result.passed).toBe(true);
            expect(result.violations.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Error rate exceeding budget should fail
   */
  it('error rate exceeding budget should fail the check', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100 }), // error rate percentage
        fc.integer({ min: 1, max: 1000 }), // total requests
        (errorRate, totalRequests) => {
          const totalErrors = Math.floor((errorRate / 100) * totalRequests);
          
          const stats: ErrorRateStats = {
            totalRequests,
            totalErrors,
            errorRate,
            errorsByType: {
              api: totalErrors,
              network: 0,
              client: 0,
            },
          };

          const result = enforcer.checkErrorRate(stats);

          if (errorRate > DEFAULT_BUDGET.apiErrorRate) {
            expect(result.passed).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
          } else {
            expect(result.passed).toBe(true);
            expect(result.violations.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Resource load time exceeding budget should fail
   */
  it('resource load time exceeding budget should fail the check', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // duration in ms
        fc.constantFrom<'image' | 'script' | 'stylesheet' | 'font' | 'other'>('image', 'script', 'stylesheet', 'font', 'other'),
        (duration, type) => {
          const metric: ResourceLoadMetric = {
            url: `https://example.com/resource.${type}`,
            type,
            duration,
            size: 1024,
            cached: false,
            failed: false,
            isSlow: duration > 2000,
            timestamp: Date.now(),
          };

          const result = enforcer.checkResourceLoadTime(metric);

          if (duration > DEFAULT_BUDGET.resourceLoadTime) {
            expect(result.passed).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
          } else {
            expect(result.passed).toBe(true);
            expect(result.violations.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Function execution time exceeding budget should fail
   */
  it('function execution time exceeding budget should fail the check', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }), // duration in ms
        fc.string({ minLength: 1, maxLength: 30 }), // function name
        (duration, functionName) => {
          const metric: ExecutionMetric = {
            functionName,
            duration,
            timestamp: Date.now(),
            isSlow: duration > 50,
            isLongTask: duration > 50,
          };

          const result = enforcer.checkExecutionTime(metric);

          if (duration > DEFAULT_BUDGET.functionExecutionTime) {
            expect(result.passed).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
          } else {
            expect(result.passed).toBe(true);
            expect(result.violations.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Memory usage exceeding budget should fail
   */
  it('memory usage exceeding budget should fail the check', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000, max: 100000000 }), // heap size limit
        fc.float({ min: 0, max: 1.5 }), // usage ratio (0-150% of limit)
        fc.integer({ min: 100, max: 5000 }), // DOM node count
        (heapSizeLimit, usageRatio, domNodeCount) => {
          const usedJSHeapSize = Math.floor(heapSizeLimit * usageRatio);
          const heapPercentage = (usedJSHeapSize / heapSizeLimit) * 100;

          const metric: MemoryUsageMetric = {
            usedJSHeapSize,
            totalJSHeapSize: usedJSHeapSize,
            jsHeapSizeLimit: heapSizeLimit,
            domNodeCount,
            timestamp: Date.now(),
            exceedsThreshold: heapPercentage > 90 || domNodeCount > 1500,
          };

          const result = enforcer.checkMemoryUsage(metric);

          const shouldFailHeap = heapPercentage > DEFAULT_BUDGET.heapSizeLimit;
          const shouldFailDOM = domNodeCount > DEFAULT_BUDGET.domNodeCount;

          if (shouldFailHeap || shouldFailDOM) {
            expect(result.passed).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
          } else {
            expect(result.passed).toBe(true);
            expect(result.violations.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Multiple violations should all be reported
   */
  it('all violations should be reported when multiple metrics exceed budgets', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.constantFrom<'LCP' | 'FID' | 'CLS'>('LCP', 'FID', 'CLS'),
            exceedsBudget: fc.boolean(),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (metricConfigs) => {
          const metrics: WebVitalsMetric[] = metricConfigs.map(config => {
            const budget = DEFAULT_BUDGET[config.name];
            const value = config.exceedsBudget ? budget * 2 : budget * 0.5;
            
            return {
              name: config.name,
              value,
              rating: 'good',
              timestamp: Date.now(),
            };
          });

          const result = enforcer.checkAll({ webVitals: metrics });

          const expectedViolations = metricConfigs.filter(c => c.exceedsBudget).length;

          if (expectedViolations > 0) {
            expect(result.passed).toBe(false);
            expect(result.violations.length).toBe(expectedViolations);
          } else {
            expect(result.passed).toBe(true);
            expect(result.violations.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Violations should have correct severity
   */
  it('violations should be marked as critical when exceeding budget by >50%', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'LCP' | 'FID' | 'CLS'>('LCP', 'FID', 'CLS'),
        fc.float({ min: Math.fround(1.01), max: Math.fround(3) }), // exceedance multiplier
        (metricName, multiplier) => {
          const budget = DEFAULT_BUDGET[metricName];
          const value = budget * multiplier;

          const metric: WebVitalsMetric = {
            name: metricName,
            value,
            rating: 'poor',
            timestamp: Date.now(),
          };

          const result = enforcer.checkWebVitals(metric);

          expect(result.passed).toBe(false);
          expect(result.violations.length).toBe(1);

          const violation = result.violations[0];
          
          // If exceeds by more than 50%, should be critical
          if (multiplier > 1.5) {
            expect(violation.severity).toBe('critical');
          } else {
            expect(violation.severity).toBe('warning');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Budget updates should affect subsequent checks
   */
  it('updating budget should affect subsequent checks', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 5000 }), // new LCP budget
        fc.integer({ min: 1500, max: 4000 }), // LCP value
        (newBudget, lcpValue) => {
          // Update budget
          enforcer.updateBudget({ LCP: newBudget });

          const metric: WebVitalsMetric = {
            name: 'LCP',
            value: lcpValue,
            rating: 'good',
            timestamp: Date.now(),
          };

          const result = enforcer.checkWebVitals(metric);

          // Check should use the new budget
          if (lcpValue > newBudget) {
            expect(result.passed).toBe(false);
            expect(result.violations[0].budgetValue).toBe(newBudget);
          } else {
            expect(result.passed).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
