import type { APITimingMetric, APIPercentiles, APIMonitoringService } from './types';

const SLOW_REQUEST_THRESHOLD = 3000; // 3 seconds in milliseconds

export class APIMonitor {
  private monitoringService: APIMonitoringService | null;
  private metrics: APITimingMetric[] = [];
  private activeRequests: Map<string, number> = new Map();

  constructor(monitoringService: APIMonitoringService | null = null) {
    this.monitoringService = monitoringService;
  }

  /**
   * Record the start time of an API request
   * Returns a unique request ID for tracking
   */
  public startRequest(endpoint: string, method: string): string {
    const requestId = `${method}-${endpoint}-${Date.now()}-${Math.random()}`;
    this.activeRequests.set(requestId, performance.now());
    return requestId;
  }

  /**
   * Record the completion of an API request and calculate duration
   */
  public endRequest(
    requestId: string,
    endpoint: string,
    method: string,
    statusCode: number
  ): APITimingMetric | null {
    const startTime = this.activeRequests.get(requestId);
    
    if (startTime === undefined) {
      console.warn(`No start time found for request ${requestId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const isSlow = duration > SLOW_REQUEST_THRESHOLD;

    const metric: APITimingMetric = {
      endpoint,
      method,
      statusCode,
      duration,
      timestamp: Date.now(),
      isSlow,
    };

    // Store metric
    this.metrics.push(metric);
    this.activeRequests.delete(requestId);

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportAPIMetric(metric);
    }

    return metric;
  }

  /**
   * Calculate percentiles (p50, p95, p99) for all recorded response times
   */
  public calculatePercentiles(): APIPercentiles {
    if (this.metrics.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    // Sort durations in ascending order
    const sortedDurations = this.metrics
      .map(m => m.duration)
      .sort((a, b) => a - b);

    const p50 = this.getPercentile(sortedDurations, 50);
    const p95 = this.getPercentile(sortedDurations, 95);
    const p99 = this.getPercentile(sortedDurations, 99);

    const percentiles: APIPercentiles = { p50, p95, p99 };

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportPercentiles(percentiles);
    }

    return percentiles;
  }

  /**
   * Calculate a specific percentile from sorted array
   */
  private getPercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedValues[lower];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Get all recorded metrics
   */
  public getMetrics(): APITimingMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics filtered by endpoint
   */
  public getMetricsByEndpoint(endpoint: string): APITimingMetric[] {
    return this.metrics.filter(m => m.endpoint === endpoint);
  }

  /**
   * Get slow requests (exceeding threshold)
   */
  public getSlowRequests(): APITimingMetric[] {
    return this.metrics.filter(m => m.isSlow);
  }

  /**
   * Clear all stored metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Add a metric directly (useful for testing)
   */
  public addMetric(metric: APITimingMetric): void {
    this.metrics.push(metric);
  }
}

// Export a singleton instance for easy use
let monitorInstance: APIMonitor | null = null;

export function initAPIMonitoring(monitoringService?: APIMonitoringService): APIMonitor {
  if (!monitorInstance) {
    monitorInstance = new APIMonitor(monitoringService || null);
  }
  return monitorInstance;
}

export function getAPIMonitor(): APIMonitor | null {
  return monitorInstance;
}
