/**
 * Performance Tracker
 *
 * Tracks performance metrics:
 * - Page load times
 * - API response times
 * - Processing times
 * - Identifies slow operations
 * - Aggregates metrics
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { getAnalyticsManager } from './analyticsManager';
import { safeLocalStorage } from '../storage/safeLocalStorage';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AggregatedMetrics {
  count: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

const SLOW_OPERATION_THRESHOLD = 3000; // 3 seconds
const METRICS_STORAGE_KEY = 'performance_metrics';
const MAX_STORED_METRICS = 1000;

class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();
  private pageLoadStartTime: number | null = null;

  constructor() {
    this.loadMetrics();
    this.initPageLoadTracking();
  }

  /**
   * Load stored metrics from localStorage
   */
  private loadMetrics(): void {
    try {
      const stored = safeLocalStorage.getItem(METRICS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  }

  /**
   * Save metrics to localStorage
   */
  private saveMetrics(): void {
    try {
      const data = Object.fromEntries(this.metrics);
      safeLocalStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }

  /**
   * Initialize page load tracking
   * Requirement 5.1: Record page load time
   */
  private initPageLoadTracking(): void {
    if (typeof window === 'undefined') return;

    // Track when page load starts
    this.pageLoadStartTime = performance.now();

    // Record page load time when page is fully loaded
    if (document.readyState === 'complete') {
      this.recordPageLoad();
    } else {
      window.addEventListener('load', () => {
        this.recordPageLoad();
      });
    }
  }

  /**
   * Record page load time
   */
  private recordPageLoad(): void {
    if (this.pageLoadStartTime === null) return;

    const loadTime = performance.now() - this.pageLoadStartTime;
    this.recordMetric('page_load', loadTime);

    // Also use Navigation Timing API if available
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        this.recordMetric(
          'page_load_navigation',
          nav.loadEventEnd - nav.fetchStart
        );
        this.recordMetric(
          'dom_content_loaded',
          nav.domContentLoadedEventEnd - nav.fetchStart
        );
        this.recordMetric(
          'dom_interactive',
          nav.domInteractive - nav.fetchStart
        );
      }
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(
    name: string,
    value: number,
    metadata?: Record<string, unknown>
  ): void {
    // Store in local metrics map
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Limit stored values
    if (values.length > MAX_STORED_METRICS) {
      values.shift();
    }

    this.saveMetrics();

    // Track in analytics
    const manager = getAnalyticsManager();
    manager.track('performance_metric', {
      metricName: name,
      value,
      ...metadata,
    });

    // Check if operation is slow
    // Requirement 5.4: Identify slow operations
    if (value > SLOW_OPERATION_THRESHOLD) {
      manager.track('slow_operation', {
        operation: name,
        duration: value,
        threshold: SLOW_OPERATION_THRESHOLD,
        ...metadata,
      });
    }
  }

  /**
   * Track API response time
   * Requirement 5.2: Record API response time
   */
  public trackApiCall(
    endpoint: string,
    startTime: number,
    metadata?: Record<string, unknown>
  ): void {
    const duration = performance.now() - startTime;
    this.recordMetric(`api_${endpoint}`, duration, {
      endpoint,
      ...metadata,
    });
  }

  /**
   * Track processing time
   * Requirement 5.3: Record processing time
   */
  public trackProcessing(
    operation: string,
    startTime: number,
    metadata?: Record<string, unknown>
  ): void {
    const duration = performance.now() - startTime;
    this.recordMetric(`processing_${operation}`, duration, {
      operation,
      ...metadata,
    });
  }

  /**
   * Start timing an operation
   */
  public startTiming(operationName: string): () => void {
    const startTime = performance.now();
    return () => {
      this.trackProcessing(operationName, startTime);
    };
  }

  /**
   * Get aggregated metrics for a specific metric name
   * Requirement 5.5: Aggregate metrics for analysis
   */
  public getAggregatedMetrics(metricName: string): AggregatedMetrics | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;

    return {
      count,
      sum,
      min: sorted[0],
      max: sorted[count - 1],
      mean,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Get all metric names
   */
  public getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get all aggregated metrics
   */
  public getAllAggregatedMetrics(): Record<string, AggregatedMetrics> {
    const result: Record<string, AggregatedMetrics> = {};

    for (const name of this.getMetricNames()) {
      const aggregated = this.getAggregatedMetrics(name);
      if (aggregated) {
        result[name] = aggregated;
      }
    }

    return result;
  }

  /**
   * Clear all stored metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
    try {
      safeLocalStorage.removeItem(METRICS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear performance metrics:', error);
    }
  }

  /**
   * Get slow operations (operations exceeding threshold)
   */
  public getSlowOperations(): Array<{
    name: string;
    metrics: AggregatedMetrics;
  }> {
    const slowOps: Array<{ name: string; metrics: AggregatedMetrics }> = [];

    for (const name of this.getMetricNames()) {
      const aggregated = this.getAggregatedMetrics(name);
      if (aggregated && aggregated.mean > SLOW_OPERATION_THRESHOLD) {
        slowOps.push({ name, metrics: aggregated });
      }
    }

    return slowOps.sort((a, b) => b.metrics.mean - a.metrics.mean);
  }
}

// Singleton instance
let performanceTrackerInstance: PerformanceTracker | null = null;

/**
 * Initialize the performance tracker
 */
export function initPerformanceTracker(): PerformanceTracker {
  if (!performanceTrackerInstance) {
    performanceTrackerInstance = new PerformanceTracker();
  }
  return performanceTrackerInstance;
}

/**
 * Get the performance tracker instance
 */
export function getPerformanceTracker(): PerformanceTracker {
  if (!performanceTrackerInstance) {
    performanceTrackerInstance = new PerformanceTracker();
  }
  return performanceTrackerInstance;
}

/**
 * Helper function to track API calls
 */
export function trackApiCall(
  endpoint: string,
  startTime: number,
  metadata?: Record<string, unknown>
): void {
  const tracker = getPerformanceTracker();
  tracker.trackApiCall(endpoint, startTime, metadata);
}

/**
 * Helper function to track processing operations
 */
export function trackProcessing(
  operation: string,
  startTime: number,
  metadata?: Record<string, unknown>
): void {
  const tracker = getPerformanceTracker();
  tracker.trackProcessing(operation, startTime, metadata);
}

/**
 * Helper function to start timing an operation
 */
export function startTiming(operationName: string): () => void {
  const tracker = getPerformanceTracker();
  return tracker.startTiming(operationName);
}
