import type { ExecutionMetric, ExecutionStats, ExecutionMonitoringService } from './types';

const SLOW_FUNCTION_THRESHOLD = 50; // 50ms
const LONG_TASK_THRESHOLD = 50; // 50ms blocking main thread

export class ExecutionTracker {
  private monitoringService: ExecutionMonitoringService | null;
  private metrics: ExecutionMetric[] = [];
  private activeMeasures: Map<string, string> = new Map();
  private longTaskObserver: PerformanceObserver | null = null;

  constructor(monitoringService: ExecutionMonitoringService | null = null) {
    this.monitoringService = monitoringService;
    this.initializeLongTaskTracking();
  }

  /**
   * Initialize tracking for long tasks that block the main thread
   */
  private initializeLongTaskTracking(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          const metric: ExecutionMetric = {
            functionName: 'long-task',
            duration: entry.duration,
            timestamp: Date.now(),
            isSlow: entry.duration > SLOW_FUNCTION_THRESHOLD,
            isLongTask: true,
          };

          this.recordMetric(metric);
        }
      });

      // Observe long tasks (tasks that block main thread for > 50ms)
      this.longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (error) {
      // longtask type might not be supported in all browsers
      console.warn('Long task tracking not supported:', error);
    }
  }

  /**
   * Start measuring execution time for a critical function
   * Uses Performance API marks and measures
   */
  public startMeasure(functionName: string): string {
    const measureId = `${functionName}-${Date.now()}-${Math.random()}`;
    const markName = `${measureId}-start`;
    
    try {
      performance.mark(markName);
      this.activeMeasures.set(measureId, markName);
    } catch (error) {
      console.error(`Error starting measure for ${functionName}:`, error);
    }
    
    return measureId;
  }

  /**
   * End measuring execution time and record the metric
   */
  public endMeasure(measureId: string, functionName: string): ExecutionMetric | null {
    const startMarkName = this.activeMeasures.get(measureId);
    
    if (!startMarkName) {
      console.warn(`No start mark found for measure ${measureId}`);
      return null;
    }

    const endMarkName = `${measureId}-end`;
    const measureName = `${measureId}-measure`;

    try {
      performance.mark(endMarkName);
      performance.measure(measureName, startMarkName, endMarkName);
      
      const measure = performance.getEntriesByName(measureName)[0];
      const duration = measure ? measure.duration : 0;
      
      const isSlow = duration > SLOW_FUNCTION_THRESHOLD;
      // isLongTask is false for manually measured functions
      // Only the PerformanceObserver sets isLongTask to true
      const isLongTask = false;

      const metric: ExecutionMetric = {
        functionName,
        duration,
        timestamp: Date.now(),
        isSlow,
        isLongTask,
      };

      this.recordMetric(metric);
      
      // Clean up marks and measures
      performance.clearMarks(startMarkName);
      performance.clearMarks(endMarkName);
      performance.clearMeasures(measureName);
      this.activeMeasures.delete(measureId);

      return metric;
    } catch (error) {
      console.error(`Error ending measure for ${functionName}:`, error);
      return null;
    }
  }

  /**
   * Convenience method to measure a function execution
   */
  public async measureFunction<T>(
    functionName: string,
    fn: () => T | Promise<T>
  ): Promise<T> {
    const measureId = this.startMeasure(functionName);
    
    try {
      const result = await fn();
      this.endMeasure(measureId, functionName);
      return result;
    } catch (error) {
      this.endMeasure(measureId, functionName);
      throw error;
    }
  }

  /**
   * Record metric and report to monitoring service
   */
  private recordMetric(metric: ExecutionMetric): void {
    this.metrics.push(metric);

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportExecutionMetric(metric);

      // Trigger alert for slow functions (including long tasks)
      if (metric.isSlow) {
        this.monitoringService.triggerSlowFunctionAlert(metric);
      }
    }
  }

  /**
   * Get all recorded metrics
   */
  public getMetrics(): ExecutionMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific function
   */
  public getMetricsByFunction(functionName: string): ExecutionMetric[] {
    return this.metrics.filter(m => m.functionName === functionName);
  }

  /**
   * Get slow function executions (exceeding threshold)
   */
  public getSlowExecutions(): ExecutionMetric[] {
    return this.metrics.filter(m => m.isSlow && !m.isLongTask);
  }

  /**
   * Get long tasks that blocked the main thread
   */
  public getLongTasks(): ExecutionMetric[] {
    return this.metrics.filter(m => m.isLongTask);
  }

  /**
   * Identify the slowest operations
   */
  public getSlowestOperations(limit: number = 10): ExecutionMetric[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Calculate execution statistics
   */
  public calculateStats(): ExecutionStats {
    const totalExecutions = this.metrics.filter(m => !m.isLongTask).length;
    const slowExecutions = this.metrics.filter(m => m.isSlow && !m.isLongTask).length;
    const longTasks = this.metrics.filter(m => m.isLongTask).length;
    const slowestOperations = this.getSlowestOperations(10);

    const stats: ExecutionStats = {
      totalExecutions,
      slowExecutions,
      longTasks,
      slowestOperations,
    };

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportExecutionStats(stats);
    }

    return stats;
  }

  /**
   * Clear all stored metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Stop tracking and clean up
   */
  public destroy(): void {
    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
      this.longTaskObserver = null;
    }
    this.clearMetrics();
    this.activeMeasures.clear();
  }
}

// Export a singleton instance for easy use
let trackerInstance: ExecutionTracker | null = null;

export function initExecutionTracking(monitoringService?: ExecutionMonitoringService): ExecutionTracker {
  if (!trackerInstance) {
    trackerInstance = new ExecutionTracker(monitoringService || null);
  }
  return trackerInstance;
}

export function getExecutionTracker(): ExecutionTracker | null {
  return trackerInstance;
}
