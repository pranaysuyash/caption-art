import type { ResourceLoadMetric, ResourceMonitoringService } from './types';

const SLOW_RESOURCE_THRESHOLD = 3000; // 3 seconds in milliseconds

export class ResourceMonitor {
  private monitoringService: ResourceMonitoringService | null;
  private metrics: ResourceLoadMetric[] = [];
  private observer: PerformanceObserver | null = null;

  constructor(monitoringService: ResourceMonitoringService | null = null) {
    this.monitoringService = monitoringService;
  }

  /**
   * Start monitoring resource loading using PerformanceObserver
   */
  public startMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not available');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry as PerformanceResourceTiming);
          }
        }
      });

      this.observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.error('Failed to start resource monitoring:', error);
    }
  }

  /**
   * Stop monitoring resource loading
   */
  public stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Process a resource timing entry
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name, entry.initiatorType);
    const duration = entry.responseEnd - entry.startTime;
    const isSlow = duration > SLOW_RESOURCE_THRESHOLD;
    const failed = entry.transferSize === 0 && entry.decodedBodySize === 0 && duration > 0;
    const cached = entry.transferSize === 0 && entry.decodedBodySize > 0;

    const metric: ResourceLoadMetric = {
      url: entry.name,
      type: resourceType,
      duration,
      size: entry.transferSize || entry.decodedBodySize || 0,
      cached,
      failed,
      isSlow,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportResourceMetric(metric);
    }
  }

  /**
   * Determine resource type from URL and initiator
   */
  private getResourceType(url: string, initiatorType: string): ResourceLoadMetric['type'] {
    // Check initiator type first
    if (initiatorType === 'img') return 'image';
    if (initiatorType === 'script') return 'script';
    if (initiatorType === 'link' || initiatorType === 'css') return 'stylesheet';

    // Fallback to URL extension
    const urlLower = url.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico)(\?|$)/.test(urlLower)) return 'image';
    if (/\.(js|mjs)(\?|$)/.test(urlLower)) return 'script';
    if (/\.css(\?|$)/.test(urlLower)) return 'stylesheet';
    if (/\.(woff|woff2|ttf|otf|eot)(\?|$)/.test(urlLower)) return 'font';

    return 'other';
  }

  /**
   * Get all slow-loading resources
   */
  public getSlowResources(): ResourceLoadMetric[] {
    return this.metrics.filter(m => m.isSlow);
  }

  /**
   * Get all failed resource loads
   */
  public getFailedResources(): ResourceLoadMetric[] {
    return this.metrics.filter(m => m.failed);
  }

  /**
   * Calculate total page weight (sum of all resource sizes)
   */
  public getTotalPageWeight(): number {
    return this.metrics.reduce((total, metric) => total + metric.size, 0);
  }

  /**
   * Calculate cache hit rate
   */
  public getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const cachedCount = this.metrics.filter(m => m.cached).length;
    return (cachedCount / this.metrics.length) * 100;
  }

  /**
   * Get metrics by resource type
   */
  public getMetricsByType(type: ResourceLoadMetric['type']): ResourceLoadMetric[] {
    return this.metrics.filter(m => m.type === type);
  }

  /**
   * Get all recorded metrics
   */
  public getMetrics(): ResourceLoadMetric[] {
    return [...this.metrics];
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
  public addMetric(metric: ResourceLoadMetric): void {
    this.metrics.push(metric);
  }

  /**
   * Get resource statistics summary
   */
  public getResourceStats() {
    const byType: Record<string, { count: number; totalSize: number; avgDuration: number }> = {};
    
    for (const metric of this.metrics) {
      if (!byType[metric.type]) {
        byType[metric.type] = { count: 0, totalSize: 0, avgDuration: 0 };
      }
      byType[metric.type].count++;
      byType[metric.type].totalSize += metric.size;
      byType[metric.type].avgDuration += metric.duration;
    }

    // Calculate averages
    for (const type in byType) {
      byType[type].avgDuration = byType[type].avgDuration / byType[type].count;
    }

    return {
      totalResources: this.metrics.length,
      totalPageWeight: this.getTotalPageWeight(),
      cacheHitRate: this.getCacheHitRate(),
      slowResources: this.getSlowResources().length,
      failedResources: this.getFailedResources().length,
      byType,
    };
  }
}

// Export a singleton instance for easy use
let monitorInstance: ResourceMonitor | null = null;

export function initResourceMonitoring(monitoringService?: ResourceMonitoringService): ResourceMonitor {
  if (!monitorInstance) {
    monitorInstance = new ResourceMonitor(monitoringService || null);
    monitorInstance.startMonitoring();
  }
  return monitorInstance;
}

export function getResourceMonitor(): ResourceMonitor | null {
  return monitorInstance;
}
