import type {
  MemoryUsageMetric,
  MemoryLeakIndicator,
  MemoryThresholds,
  ComponentMemoryUsage,
  MemoryStats,
  MemoryMonitoringService,
} from './types';

const DEFAULT_THRESHOLDS: MemoryThresholds = {
  heapSizeWarning: 75, // 75% of heap limit
  heapSizeCritical: 90, // 90% of heap limit
  domNodeWarning: 1500,
  domNodeCritical: 3000,
  leakGrowthRate: 1048576, // 1MB per second
};

const SAMPLE_INTERVAL = 5000; // 5 seconds
const LEAK_DETECTION_SAMPLES = 5; // Number of consecutive increases to detect leak

export class MemoryMonitor {
  private monitoringService: MemoryMonitoringService | null;
  private metrics: MemoryUsageMetric[] = [];
  private intervalId: number | null = null;
  private thresholds: MemoryThresholds;
  private componentRegistry: Map<string, ComponentMemoryUsage> = new Map();

  constructor(
    monitoringService: MemoryMonitoringService | null = null,
    thresholds: Partial<MemoryThresholds> = {}
  ) {
    this.monitoringService = monitoringService;
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Start periodic memory sampling
   */
  public startMonitoring(): void {
    if (typeof window === 'undefined') {
      console.warn('Memory monitoring not available in non-browser environment');
      return;
    }

    // Take initial sample
    this.sampleMemory();

    // Set up periodic sampling
    this.intervalId = window.setInterval(() => {
      this.sampleMemory();
    }, SAMPLE_INTERVAL);
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Sample current memory usage
   */
  private sampleMemory(): void {
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) return;

    const domNodeCount = this.getDOMNodeCount();
    const heapUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
    const exceedsThreshold =
      heapUsagePercent >= this.thresholds.heapSizeWarning ||
      domNodeCount >= this.thresholds.domNodeWarning;

    const metric: MemoryUsageMetric = {
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      domNodeCount,
      timestamp: Date.now(),
      exceedsThreshold,
    };

    this.metrics.push(metric);

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportMemoryMetric(metric);

      // Check for warnings
      if (exceedsThreshold) {
        this.monitoringService.triggerMemoryWarning(metric);
      }
    }

    // Check for memory leaks
    const leakIndicator = this.detectMemoryLeak();
    if (leakIndicator.detected && this.monitoringService) {
      this.monitoringService.triggerMemoryLeakAlert(leakIndicator);
    }
  }

  /**
   * Get memory information from performance API
   */
  private getMemoryInfo(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null {
    // Check if memory API is available (Chrome/Edge)
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }

    return null;
  }

  /**
   * Count DOM nodes in the document
   */
  private getDOMNodeCount(): number {
    if (typeof document === 'undefined') return 0;
    return document.getElementsByTagName('*').length;
  }

  /**
   * Detect potential memory leaks by analyzing growth patterns
   */
  public detectMemoryLeak(): MemoryLeakIndicator {
    if (this.metrics.length < LEAK_DETECTION_SAMPLES) {
      return {
        detected: false,
        growthRate: 0,
        consecutiveIncreases: 0,
        timestamp: Date.now(),
      };
    }

    // Get recent samples
    const recentSamples = this.metrics.slice(-LEAK_DETECTION_SAMPLES);
    
    // Count consecutive increases
    let consecutiveIncreases = 0;
    for (let i = 1; i < recentSamples.length; i++) {
      if (recentSamples[i].usedJSHeapSize > recentSamples[i - 1].usedJSHeapSize) {
        consecutiveIncreases++;
      } else {
        consecutiveIncreases = 0;
      }
    }

    // Calculate growth rate (bytes per second)
    const firstSample = recentSamples[0];
    const lastSample = recentSamples[recentSamples.length - 1];
    const timeDiff = (lastSample.timestamp - firstSample.timestamp) / 1000; // seconds
    const memoryDiff = lastSample.usedJSHeapSize - firstSample.usedJSHeapSize;
    const growthRate = timeDiff > 0 ? memoryDiff / timeDiff : 0;

    const detected =
      consecutiveIncreases >= LEAK_DETECTION_SAMPLES - 1 &&
      growthRate >= this.thresholds.leakGrowthRate;

    return {
      detected,
      growthRate,
      consecutiveIncreases,
      timestamp: Date.now(),
    };
  }

  /**
   * Register a component with estimated memory usage
   */
  public registerComponent(componentName: string, estimatedSize: number): void {
    this.componentRegistry.set(componentName, {
      componentName,
      estimatedSize,
      timestamp: Date.now(),
    });
  }

  /**
   * Unregister a component
   */
  public unregisterComponent(componentName: string): void {
    this.componentRegistry.delete(componentName);
  }

  /**
   * Get components with high memory usage
   */
  public getHighMemoryComponents(threshold: number = 1048576): ComponentMemoryUsage[] {
    return Array.from(this.componentRegistry.values())
      .filter(c => c.estimatedSize >= threshold)
      .sort((a, b) => b.estimatedSize - a.estimatedSize);
  }

  /**
   * Get current memory usage
   */
  public getCurrentUsage(): MemoryUsageMetric | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get average memory usage
   */
  public getAverageUsage(): number {
    if (this.metrics.length === 0) return 0;
    
    const sum = this.metrics.reduce((acc, m) => acc + m.usedJSHeapSize, 0);
    return sum / this.metrics.length;
  }

  /**
   * Get peak memory usage
   */
  public getPeakUsage(): number {
    if (this.metrics.length === 0) return 0;
    
    return Math.max(...this.metrics.map(m => m.usedJSHeapSize));
  }

  /**
   * Get comprehensive memory statistics
   */
  public getMemoryStats(): MemoryStats | null {
    const currentUsage = this.getCurrentUsage();
    if (!currentUsage) return null;

    return {
      currentUsage,
      averageUsage: this.getAverageUsage(),
      peakUsage: this.getPeakUsage(),
      leakIndicator: this.detectMemoryLeak(),
      highMemoryComponents: this.getHighMemoryComponents(),
    };
  }

  /**
   * Get all recorded metrics
   */
  public getMetrics(): MemoryUsageMetric[] {
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
  public addMetric(metric: MemoryUsageMetric): void {
    this.metrics.push(metric);
  }

  /**
   * Check if current usage exceeds thresholds
   */
  public checkThresholds(): {
    heapWarning: boolean;
    heapCritical: boolean;
    domWarning: boolean;
    domCritical: boolean;
  } {
    const current = this.getCurrentUsage();
    if (!current) {
      return {
        heapWarning: false,
        heapCritical: false,
        domWarning: false,
        domCritical: false,
      };
    }

    const heapUsagePercent = (current.usedJSHeapSize / current.jsHeapSizeLimit) * 100;

    return {
      heapWarning: heapUsagePercent >= this.thresholds.heapSizeWarning,
      heapCritical: heapUsagePercent >= this.thresholds.heapSizeCritical,
      domWarning: current.domNodeCount >= this.thresholds.domNodeWarning,
      domCritical: current.domNodeCount >= this.thresholds.domNodeCritical,
    };
  }
}

// Export a singleton instance for easy use
let monitorInstance: MemoryMonitor | null = null;

export function initMemoryMonitoring(
  monitoringService?: MemoryMonitoringService,
  thresholds?: Partial<MemoryThresholds>
): MemoryMonitor {
  if (!monitorInstance) {
    monitorInstance = new MemoryMonitor(monitoringService || null, thresholds);
    monitorInstance.startMonitoring();
  }
  return monitorInstance;
}

export function getMemoryMonitor(): MemoryMonitor | null {
  return monitorInstance;
}
