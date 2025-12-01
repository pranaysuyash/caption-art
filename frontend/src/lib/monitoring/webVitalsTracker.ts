import type { WebVitalsMetric, PerformanceThresholds, MonitoringService } from './types';

// Default thresholds based on Google's Core Web Vitals recommendations
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  LCP: { good: 2500, poor: 4000 },  // Largest Contentful Paint in ms
  FID: { good: 100, poor: 300 },    // First Input Delay in ms
  CLS: { good: 0.1, poor: 0.25 },   // Cumulative Layout Shift (unitless)
};

export class WebVitalsTracker {
  private thresholds: PerformanceThresholds;
  private monitoringService: MonitoringService | null;
  private metrics: Map<string, WebVitalsMetric> = new Map();

  constructor(
    monitoringService: MonitoringService | null = null,
    thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
  ) {
    this.monitoringService = monitoringService;
    this.thresholds = thresholds;
  }

  /**
   * Initialize tracking for all Core Web Vitals
   */
  public startTracking(): void {
    this.trackLCP();
    this.trackFID();
    this.trackCLS();
  }

  /**
   * Measure Largest Contentful Paint (LCP)
   * LCP measures loading performance - marks the point when the largest content element is rendered
   */
  private trackLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        
        // LCP is the renderTime or loadTime of the largest contentful paint
        const value = lastEntry.renderTime || lastEntry.loadTime || 0;
        
        const metric: WebVitalsMetric = {
          name: 'LCP',
          value,
          rating: this.getRating('LCP', value),
          timestamp: Date.now(),
        };

        this.recordMetric(metric);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.error('Error tracking LCP:', error);
    }
  }

  /**
   * Measure First Input Delay (FID)
   * FID measures interactivity - time from when user first interacts to when browser responds
   */
  private trackFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          // FID is the delay between input and processing
          const value = fidEntry.processingStart ? fidEntry.processingStart - entry.startTime : 0;
          
          const metric: WebVitalsMetric = {
            name: 'FID',
            value,
            rating: this.getRating('FID', value),
            timestamp: Date.now(),
          };

          this.recordMetric(metric);
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.error('Error tracking FID:', error);
    }
  }

  /**
   * Measure Cumulative Layout Shift (CLS)
   * CLS measures visual stability - sum of all unexpected layout shifts
   */
  private trackCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          const layoutShiftEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          
          // Only count layout shifts without recent user input
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            sessionValue += layoutShiftEntry.value;
            sessionEntries.push(entry);
          }
        }

        // Update CLS value (use session value for more accurate measurement)
        if (sessionValue > clsValue) {
          clsValue = sessionValue;
          
          const metric: WebVitalsMetric = {
            name: 'CLS',
            value: clsValue,
            rating: this.getRating('CLS', clsValue),
            timestamp: Date.now(),
          };

          this.recordMetric(metric);
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.error('Error tracking CLS:', error);
    }
  }

  /**
   * Determine rating based on thresholds
   */
  private getRating(metricName: 'LCP' | 'FID' | 'CLS', value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[metricName];
    
    if (value <= threshold.good) {
      return 'good';
    } else if (value <= threshold.poor) {
      return 'needs-improvement';
    } else {
      return 'poor';
    }
  }

  /**
   * Record metric and report to monitoring service
   */
  private recordMetric(metric: WebVitalsMetric): void {
    this.metrics.set(metric.name, metric);

    // Report to monitoring service
    if (this.monitoringService) {
      this.monitoringService.reportMetric(metric);

      // Trigger alert if metric exceeds threshold
      if (metric.rating === 'poor') {
        this.monitoringService.triggerAlert(metric);
      }
    }
  }

  /**
   * Get all collected metrics
   */
  public getMetrics(): WebVitalsMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get a specific metric by name
   */
  public getMetric(name: 'LCP' | 'FID' | 'CLS'): WebVitalsMetric | undefined {
    return this.metrics.get(name);
  }
}

// Export a singleton instance for easy use
let trackerInstance: WebVitalsTracker | null = null;

export function initWebVitalsTracking(monitoringService?: MonitoringService): WebVitalsTracker {
  if (!trackerInstance) {
    trackerInstance = new WebVitalsTracker(monitoringService || null);
    trackerInstance.startTracking();
  }
  return trackerInstance;
}

export function getWebVitalsTracker(): WebVitalsTracker | null {
  return trackerInstance;
}
