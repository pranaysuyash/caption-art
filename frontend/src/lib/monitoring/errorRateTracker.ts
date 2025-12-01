import type { ErrorMetric, ErrorRateStats, ErrorRateMonitoringService, ErrorType } from './types';

const ERROR_RATE_SPIKE_THRESHOLD = 10; // Alert if error rate exceeds 10%

export class ErrorRateTracker {
  private monitoringService: ErrorRateMonitoringService | null;
  private errors: ErrorMetric[] = [];
  private totalRequests: number = 0;
  private spikeThreshold: number;

  constructor(
    monitoringService: ErrorRateMonitoringService | null = null,
    spikeThreshold: number = ERROR_RATE_SPIKE_THRESHOLD
  ) {
    this.monitoringService = monitoringService;
    this.spikeThreshold = spikeThreshold;
  }

  /**
   * Record a successful request (increments total request count)
   */
  public recordRequest(): void {
    this.totalRequests++;
  }

  /**
   * Record an API error
   */
  public recordAPIError(endpoint: string, statusCode: number, message: string): void {
    const error: ErrorMetric = {
      type: 'api',
      message,
      timestamp: Date.now(),
      endpoint,
      statusCode,
    };

    this.errors.push(error);
    this.totalRequests++;

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportError(error);
    }

    // Check for spike
    this.checkForSpike();
  }

  /**
   * Record a network error
   */
  public recordNetworkError(endpoint: string, message: string): void {
    const error: ErrorMetric = {
      type: 'network',
      message,
      timestamp: Date.now(),
      endpoint,
    };

    this.errors.push(error);
    this.totalRequests++;

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportError(error);
    }

    // Check for spike
    this.checkForSpike();
  }

  /**
   * Record a client-side error
   */
  public recordClientError(message: string): void {
    const error: ErrorMetric = {
      type: 'client',
      message,
      timestamp: Date.now(),
    };

    this.errors.push(error);

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportError(error);
    }
  }

  /**
   * Calculate current error rate statistics
   */
  public calculateErrorRate(): ErrorRateStats {
    const totalErrors = this.errors.length;
    const errorRate = this.totalRequests > 0 
      ? (totalErrors / this.totalRequests) * 100 
      : 0;

    // Count errors by type
    const errorsByType: Record<ErrorType, number> = {
      network: 0,
      api: 0,
      client: 0,
    };

    for (const error of this.errors) {
      errorsByType[error.type]++;
    }

    const stats: ErrorRateStats = {
      totalRequests: this.totalRequests,
      totalErrors,
      errorRate,
      errorsByType,
    };

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportErrorRate(stats);
    }

    return stats;
  }

  /**
   * Check if error rate has spiked above threshold
   */
  private checkForSpike(): void {
    const stats = this.calculateErrorRate();
    
    if (stats.errorRate > this.spikeThreshold && this.monitoringService) {
      this.monitoringService.triggerErrorAlert(stats);
    }
  }

  /**
   * Get all recorded errors
   */
  public getErrors(): ErrorMetric[] {
    return [...this.errors];
  }

  /**
   * Get errors filtered by type
   */
  public getErrorsByType(type: ErrorType): ErrorMetric[] {
    return this.errors.filter(e => e.type === type);
  }

  /**
   * Get total request count
   */
  public getTotalRequests(): number {
    return this.totalRequests;
  }

  /**
   * Clear all stored errors and reset counters
   */
  public clearErrors(): void {
    this.errors = [];
    this.totalRequests = 0;
  }

  /**
   * Get errors within a time window (in milliseconds)
   */
  public getRecentErrors(windowMs: number): ErrorMetric[] {
    const cutoffTime = Date.now() - windowMs;
    return this.errors.filter(e => e.timestamp >= cutoffTime);
  }
}

// Export a singleton instance for easy use
let trackerInstance: ErrorRateTracker | null = null;

export function initErrorRateTracking(
  monitoringService?: ErrorRateMonitoringService,
  spikeThreshold?: number
): ErrorRateTracker {
  if (!trackerInstance) {
    trackerInstance = new ErrorRateTracker(monitoringService || null, spikeThreshold);
  }
  return trackerInstance;
}

export function getErrorRateTracker(): ErrorRateTracker | null {
  return trackerInstance;
}
