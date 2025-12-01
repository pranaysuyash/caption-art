export interface WebVitalsMetric {
  name: 'LCP' | 'FID' | 'CLS';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface PerformanceThresholds {
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
}

export interface MonitoringService {
  reportMetric(metric: WebVitalsMetric): void;
  triggerAlert(metric: WebVitalsMetric): void;
}

export interface APITimingMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  isSlow: boolean;
}

export interface APIPercentiles {
  p50: number;
  p95: number;
  p99: number;
}

export interface APIMonitoringService {
  reportAPIMetric(metric: APITimingMetric): void;
  reportPercentiles(percentiles: APIPercentiles): void;
}

export type ErrorType = 'network' | 'api' | 'client';

export interface ErrorMetric {
  type: ErrorType;
  message: string;
  timestamp: number;
  endpoint?: string;
  statusCode?: number;
}

export interface ErrorRateStats {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  errorsByType: Record<ErrorType, number>;
}

export interface ErrorRateMonitoringService {
  reportError(error: ErrorMetric): void;
  reportErrorRate(stats: ErrorRateStats): void;
  triggerErrorAlert(stats: ErrorRateStats): void;
}

export interface ResourceLoadMetric {
  url: string;
  type: 'image' | 'script' | 'stylesheet' | 'font' | 'other';
  duration: number;
  size: number;
  cached: boolean;
  failed: boolean;
  isSlow: boolean;
  timestamp: number;
}

export interface ResourceMonitoringService {
  reportResourceMetric(metric: ResourceLoadMetric): void;
}

export interface ExecutionMetric {
  functionName: string;
  duration: number;
  timestamp: number;
  isSlow: boolean;
  isLongTask: boolean;
}

export interface ExecutionStats {
  totalExecutions: number;
  slowExecutions: number;
  longTasks: number;
  slowestOperations: ExecutionMetric[];
}

export interface ExecutionMonitoringService {
  reportExecutionMetric(metric: ExecutionMetric): void;
  reportExecutionStats(stats: ExecutionStats): void;
  triggerSlowFunctionAlert(metric: ExecutionMetric): void;
}

export interface MemoryUsageMetric {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  domNodeCount: number;
  timestamp: number;
  exceedsThreshold: boolean;
}

export interface MemoryLeakIndicator {
  detected: boolean;
  growthRate: number; // bytes per second
  consecutiveIncreases: number;
  timestamp: number;
}

export interface MemoryThresholds {
  heapSizeWarning: number; // percentage of limit
  heapSizeCritical: number; // percentage of limit
  domNodeWarning: number; // absolute count
  domNodeCritical: number; // absolute count
  leakGrowthRate: number; // bytes per second indicating leak
}

export interface ComponentMemoryUsage {
  componentName: string;
  estimatedSize: number;
  timestamp: number;
}

export interface MemoryStats {
  currentUsage: MemoryUsageMetric;
  averageUsage: number;
  peakUsage: number;
  leakIndicator: MemoryLeakIndicator;
  highMemoryComponents: ComponentMemoryUsage[];
}

export interface MemoryMonitoringService {
  reportMemoryMetric(metric: MemoryUsageMetric): void;
  reportMemoryStats(stats: MemoryStats): void;
  triggerMemoryWarning(metric: MemoryUsageMetric): void;
  triggerMemoryLeakAlert(indicator: MemoryLeakIndicator): void;
}
