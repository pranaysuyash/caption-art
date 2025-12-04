import apiFetch from '../api/httpClient';
import {
  WebVitalsTracker,
  APIMonitor,
  ErrorRateTracker,
  ResourceMonitor,
  ExecutionTracker,
  MemoryMonitor,
  BudgetEnforcer,
  DEFAULT_BUDGET,
  type PerformanceBudget,
} from './index';
import type {
  MonitoringService,
  APIMonitoringService,
  ErrorRateMonitoringService,
  ResourceMonitoringService,
  ExecutionMonitoringService,
  MemoryMonitoringService,
  WebVitalsMetric,
  APITimingMetric,
  ErrorMetric,
  ErrorRateStats,
  ResourceLoadMetric,
  ExecutionMetric,
  ExecutionStats,
  MemoryUsageMetric,
  MemoryStats,
  MemoryLeakIndicator,
  APIPercentiles,
} from './types';

/**
 * Configuration for the unified performance monitoring system
 */
export interface PerformanceMonitorConfig {
  enableWebVitals?: boolean;
  enableAPIMonitoring?: boolean;
  enableErrorTracking?: boolean;
  enableResourceMonitoring?: boolean;
  enableExecutionTracking?: boolean;
  enableMemoryMonitoring?: boolean;
  enableBudgetEnforcement?: boolean;
  budget?: PerformanceBudget;
  endpoint?: string; // Optional endpoint for sending metrics
}

/**
 * Unified monitoring service that implements all monitoring interfaces
 */
class UnifiedMonitoringService
  implements
    MonitoringService,
    APIMonitoringService,
    ErrorRateMonitoringService,
    ResourceMonitoringService,
    ExecutionMonitoringService,
    MemoryMonitoringService
{
  private endpoint: string | null;
  private metricsQueue: any[] = [];
  private flushInterval: number | null = null;
  private readonly FLUSH_INTERVAL_MS = 10000; // Flush every 10 seconds
  private readonly MAX_QUEUE_SIZE = 100;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || null;

    if (this.endpoint) {
      this.startAutoFlush();
    }
  }

  /**
   * Start automatic flushing of metrics
   */
  private startAutoFlush(): void {
    if (typeof window === 'undefined') return;

    this.flushInterval = window.setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Stop automatic flushing
   */
  public stopAutoFlush(): void {
    if (this.flushInterval !== null) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Add metric to queue
   */
  private queueMetric(type: string, data: any): void {
    this.metricsQueue.push({
      type,
      data,
      timestamp: Date.now(),
    });

    // Auto-flush if queue is full
    if (this.metricsQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  /**
   * Flush all queued metrics to the monitoring endpoint
   */
  public async flush(): Promise<void> {
    if (this.metricsQueue.length === 0 || !this.endpoint) {
      return;
    }

    const metricsToSend = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      await apiFetch(this.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: metricsToSend,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error('Failed to send metrics to monitoring service:', error);
      // Re-queue metrics on failure (up to max size)
      this.metricsQueue = [
        ...metricsToSend.slice(-this.MAX_QUEUE_SIZE),
        ...this.metricsQueue,
      ];
    }
  }

  // MonitoringService implementation (Web Vitals)
  reportMetric(metric: WebVitalsMetric): void {
    this.queueMetric('web-vitals', metric);
  }

  triggerAlert(metric: WebVitalsMetric): void {
    this.queueMetric('web-vitals-alert', {
      ...metric,
      severity: 'high',
      message: `${metric.name} exceeded threshold: ${metric.value}`,
    });
  }

  // APIMonitoringService implementation
  reportAPIMetric(metric: APITimingMetric): void {
    this.queueMetric('api-timing', metric);
  }

  reportPercentiles(percentiles: APIPercentiles): void {
    this.queueMetric('api-percentiles', percentiles);
  }

  // ErrorRateMonitoringService implementation
  reportError(error: ErrorMetric): void {
    this.queueMetric('error', error);
  }

  reportErrorRate(stats: ErrorRateStats): void {
    this.queueMetric('error-rate', stats);
  }

  triggerErrorAlert(stats: ErrorRateStats): void {
    this.queueMetric('error-alert', {
      ...stats,
      severity: 'high',
      message: `Error rate spiked to ${stats.errorRate.toFixed(2)}%`,
    });
  }

  // ResourceMonitoringService implementation
  reportResourceMetric(metric: ResourceLoadMetric): void {
    this.queueMetric('resource-load', metric);
  }

  // ExecutionMonitoringService implementation
  reportExecutionMetric(metric: ExecutionMetric): void {
    this.queueMetric('execution', metric);
  }

  reportExecutionStats(stats: ExecutionStats): void {
    this.queueMetric('execution-stats', stats);
  }

  triggerSlowFunctionAlert(metric: ExecutionMetric): void {
    this.queueMetric('slow-function-alert', {
      ...metric,
      severity: 'medium',
      message: `Function ${metric.functionName} took ${metric.duration}ms`,
    });
  }

  // MemoryMonitoringService implementation
  reportMemoryMetric(metric: MemoryUsageMetric): void {
    this.queueMetric('memory-usage', metric);
  }

  reportMemoryStats(stats: MemoryStats): void {
    this.queueMetric('memory-stats', stats);
  }

  triggerMemoryWarning(metric: MemoryUsageMetric): void {
    this.queueMetric('memory-warning', {
      ...metric,
      severity: 'medium',
      message: `Memory usage exceeded threshold`,
    });
  }

  triggerMemoryLeakAlert(indicator: MemoryLeakIndicator): void {
    this.queueMetric('memory-leak-alert', {
      ...indicator,
      severity: 'high',
      message: `Potential memory leak detected: ${(
        indicator.growthRate /
        1024 /
        1024
      ).toFixed(2)} MB/s growth`,
    });
  }

  /**
   * Get current queue size
   */
  public getQueueSize(): number {
    return this.metricsQueue.length;
  }

  /**
   * Clear the metrics queue
   */
  public clearQueue(): void {
    this.metricsQueue = [];
  }
}

/**
 * Main PerformanceMonitor class that orchestrates all monitoring modules
 */
export class PerformanceMonitor {
  private config: Omit<Required<PerformanceMonitorConfig>, 'endpoint'> & {
    endpoint?: string;
  };
  private monitoringService: UnifiedMonitoringService;
  private webVitalsTracker: WebVitalsTracker | null = null;
  private apiMonitor: APIMonitor | null = null;
  private errorRateTracker: ErrorRateTracker | null = null;
  private resourceMonitor: ResourceMonitor | null = null;
  private executionTracker: ExecutionTracker | null = null;
  private memoryMonitor: MemoryMonitor | null = null;
  private budgetEnforcer: BudgetEnforcer | null = null;

  constructor(config: PerformanceMonitorConfig = {}) {
    this.config = {
      enableWebVitals: true,
      enableAPIMonitoring: true,
      enableErrorTracking: true,
      enableResourceMonitoring: true,
      enableExecutionTracking: true,
      enableMemoryMonitoring: true,
      enableBudgetEnforcement: true,
      budget: DEFAULT_BUDGET,
      ...config,
    };

    this.monitoringService = new UnifiedMonitoringService(this.config.endpoint);
  }

  /**
   * Initialize all enabled monitoring modules
   */
  public initialize(): void {
    if (this.config.enableWebVitals) {
      this.webVitalsTracker = new WebVitalsTracker(this.monitoringService);
      this.webVitalsTracker.startTracking();
    }

    if (this.config.enableAPIMonitoring) {
      this.apiMonitor = new APIMonitor(this.monitoringService);
    }

    if (this.config.enableErrorTracking) {
      this.errorRateTracker = new ErrorRateTracker(this.monitoringService);
    }

    if (this.config.enableResourceMonitoring) {
      this.resourceMonitor = new ResourceMonitor(this.monitoringService);
      this.resourceMonitor.startMonitoring();
    }

    if (this.config.enableExecutionTracking) {
      this.executionTracker = new ExecutionTracker(this.monitoringService);
    }

    if (this.config.enableMemoryMonitoring) {
      this.memoryMonitor = new MemoryMonitor(this.monitoringService);
      this.memoryMonitor.startMonitoring();
    }

    if (this.config.enableBudgetEnforcement) {
      this.budgetEnforcer = new BudgetEnforcer(this.config.budget);
    }
  }

  /**
   * Get the Web Vitals tracker
   */
  public getWebVitalsTracker(): WebVitalsTracker | null {
    return this.webVitalsTracker;
  }

  /**
   * Get the API monitor
   */
  public getAPIMonitor(): APIMonitor | null {
    return this.apiMonitor;
  }

  /**
   * Get the error rate tracker
   */
  public getErrorRateTracker(): ErrorRateTracker | null {
    return this.errorRateTracker;
  }

  /**
   * Get the resource monitor
   */
  public getResourceMonitor(): ResourceMonitor | null {
    return this.resourceMonitor;
  }

  /**
   * Get the execution tracker
   */
  public getExecutionTracker(): ExecutionTracker | null {
    return this.executionTracker;
  }

  /**
   * Get the memory monitor
   */
  public getMemoryMonitor(): MemoryMonitor | null {
    return this.memoryMonitor;
  }

  /**
   * Get the budget enforcer
   */
  public getBudgetEnforcer(): BudgetEnforcer | null {
    return this.budgetEnforcer;
  }

  /**
   * Get the monitoring service
   */
  public getMonitoringService(): UnifiedMonitoringService {
    return this.monitoringService;
  }

  /**
   * Flush all queued metrics immediately
   */
  public async flush(): Promise<void> {
    await this.monitoringService.flush();
  }

  /**
   * Shutdown all monitoring and flush remaining metrics
   */
  public async shutdown(): Promise<void> {
    // Stop all monitoring
    if (this.resourceMonitor) {
      this.resourceMonitor.stopMonitoring();
    }

    if (this.memoryMonitor) {
      this.memoryMonitor.stopMonitoring();
    }

    if (this.executionTracker) {
      this.executionTracker.destroy();
    }

    // Flush remaining metrics
    await this.flush();

    // Stop auto-flush
    this.monitoringService.stopAutoFlush();
  }

  /**
   * Get a comprehensive performance report
   */
  public getPerformanceReport() {
    return {
      webVitals: this.webVitalsTracker?.getMetrics() || [],
      apiMetrics: this.apiMonitor?.getMetrics() || [],
      apiPercentiles: this.apiMonitor?.calculatePercentiles() || {
        p50: 0,
        p95: 0,
        p99: 0,
      },
      errorRate: this.errorRateTracker?.calculateErrorRate() || {
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
        errorsByType: { network: 0, api: 0, client: 0 },
      },
      resourceStats: this.resourceMonitor?.getResourceStats() || null,
      executionStats: this.executionTracker?.calculateStats() || null,
      memoryStats: this.memoryMonitor?.getMemoryStats() || null,
      budgetViolations: this.budgetEnforcer?.getViolations() || [],
      timestamp: Date.now(),
    };
  }
}

// Export singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * Initialize the global performance monitor
 */
export function initPerformanceMonitor(
  config?: PerformanceMonitorConfig
): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(config);
    performanceMonitorInstance.initialize();
  }
  return performanceMonitorInstance;
}

/**
 * Get the global performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitorInstance;
}
