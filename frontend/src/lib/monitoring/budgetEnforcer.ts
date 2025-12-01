import type { 
  WebVitalsMetric, 
  APITimingMetric, 
  ErrorRateStats,
  ResourceLoadMetric,
  ExecutionMetric,
  MemoryUsageMetric 
} from './types';

/**
 * Performance budget thresholds for various metrics
 */
export interface PerformanceBudget {
  // Core Web Vitals budgets (in milliseconds, except CLS which is unitless)
  LCP: number;  // Largest Contentful Paint - should be < 2500ms
  FID: number;  // First Input Delay - should be < 100ms
  CLS: number;  // Cumulative Layout Shift - should be < 0.1
  
  // API performance budgets
  apiResponseTime: number;  // Maximum acceptable API response time in ms
  apiErrorRate: number;     // Maximum acceptable error rate as percentage (0-100)
  
  // Resource loading budgets
  resourceLoadTime: number; // Maximum acceptable resource load time in ms
  totalPageWeight: number;  // Maximum total page weight in bytes
  
  // JavaScript execution budgets
  functionExecutionTime: number; // Maximum acceptable function execution time in ms
  
  // Memory budgets
  heapSizeLimit: number;    // Maximum heap size as percentage of limit (0-100)
  domNodeCount: number;     // Maximum DOM node count
}

/**
 * Default performance budgets based on industry best practices
 */
export const DEFAULT_BUDGET: PerformanceBudget = {
  LCP: 2500,           // 2.5 seconds
  FID: 100,            // 100 milliseconds
  CLS: 0.1,            // 0.1 unitless
  apiResponseTime: 3000,     // 3 seconds
  apiErrorRate: 5,           // 5% error rate
  resourceLoadTime: 2000,    // 2 seconds
  totalPageWeight: 5242880,  // 5 MB
  functionExecutionTime: 50, // 50 milliseconds
  heapSizeLimit: 90,         // 90% of heap limit
  domNodeCount: 1500,        // 1500 nodes
};

/**
 * Result of a budget check
 */
export interface BudgetCheckResult {
  passed: boolean;
  violations: BudgetViolation[];
  timestamp: number;
}

/**
 * Details of a budget violation
 */
export interface BudgetViolation {
  metric: string;
  budgetValue: number;
  actualValue: number;
  severity: 'warning' | 'critical';
  message: string;
}

/**
 * Options for budget enforcement
 */
export interface BudgetEnforcementOptions {
  blockOnViolation?: boolean;  // Whether to block deployment on violation
  alertOnViolation?: boolean;  // Whether to send alerts on violation
  onViolation?: (violations: BudgetViolation[]) => void;  // Custom violation handler
}

/**
 * BudgetEnforcer validates performance metrics against defined budgets
 */
export class BudgetEnforcer {
  private budget: PerformanceBudget;
  private options: BudgetEnforcementOptions;
  private violations: BudgetViolation[] = [];

  constructor(
    budget: PerformanceBudget = DEFAULT_BUDGET,
    options: BudgetEnforcementOptions = {}
  ) {
    this.budget = budget;
    this.options = {
      blockOnViolation: false,
      alertOnViolation: true,
      ...options,
    };
  }

  /**
   * Check if a Core Web Vitals metric exceeds its budget
   */
  public checkWebVitals(metric: WebVitalsMetric): BudgetCheckResult {
    const violations: BudgetViolation[] = [];
    const budgetValue = this.budget[metric.name];

    if (metric.value > budgetValue) {
      const violation: BudgetViolation = {
        metric: metric.name,
        budgetValue,
        actualValue: metric.value,
        severity: this.getSeverity(metric.name, metric.value, budgetValue),
        message: `${metric.name} (${metric.value.toFixed(2)}) exceeds budget of ${budgetValue}`,
      };
      violations.push(violation);
      this.violations.push(violation);
    }

    return this.createCheckResult(violations);
  }

  /**
   * Check if API response time exceeds budget
   */
  public checkAPIResponseTime(metric: APITimingMetric): BudgetCheckResult {
    const violations: BudgetViolation[] = [];

    if (metric.duration > this.budget.apiResponseTime) {
      const violation: BudgetViolation = {
        metric: 'apiResponseTime',
        budgetValue: this.budget.apiResponseTime,
        actualValue: metric.duration,
        severity: this.getSeverity('apiResponseTime', metric.duration, this.budget.apiResponseTime),
        message: `API response time (${metric.duration}ms) for ${metric.endpoint} exceeds budget of ${this.budget.apiResponseTime}ms`,
      };
      violations.push(violation);
      this.violations.push(violation);
    }

    return this.createCheckResult(violations);
  }

  /**
   * Check if error rate exceeds budget
   */
  public checkErrorRate(stats: ErrorRateStats): BudgetCheckResult {
    const violations: BudgetViolation[] = [];

    if (stats.errorRate > this.budget.apiErrorRate) {
      const violation: BudgetViolation = {
        metric: 'apiErrorRate',
        budgetValue: this.budget.apiErrorRate,
        actualValue: stats.errorRate,
        severity: this.getSeverity('apiErrorRate', stats.errorRate, this.budget.apiErrorRate),
        message: `Error rate (${stats.errorRate.toFixed(2)}%) exceeds budget of ${this.budget.apiErrorRate}%`,
      };
      violations.push(violation);
      this.violations.push(violation);
    }

    return this.createCheckResult(violations);
  }

  /**
   * Check if resource load time exceeds budget
   */
  public checkResourceLoadTime(metric: ResourceLoadMetric): BudgetCheckResult {
    const violations: BudgetViolation[] = [];

    if (metric.duration > this.budget.resourceLoadTime) {
      const violation: BudgetViolation = {
        metric: 'resourceLoadTime',
        budgetValue: this.budget.resourceLoadTime,
        actualValue: metric.duration,
        severity: this.getSeverity('resourceLoadTime', metric.duration, this.budget.resourceLoadTime),
        message: `Resource load time (${metric.duration}ms) for ${metric.url} exceeds budget of ${this.budget.resourceLoadTime}ms`,
      };
      violations.push(violation);
      this.violations.push(violation);
    }

    return this.createCheckResult(violations);
  }

  /**
   * Check if function execution time exceeds budget
   */
  public checkExecutionTime(metric: ExecutionMetric): BudgetCheckResult {
    const violations: BudgetViolation[] = [];

    if (metric.duration > this.budget.functionExecutionTime) {
      const violation: BudgetViolation = {
        metric: 'functionExecutionTime',
        budgetValue: this.budget.functionExecutionTime,
        actualValue: metric.duration,
        severity: this.getSeverity('functionExecutionTime', metric.duration, this.budget.functionExecutionTime),
        message: `Function execution time (${metric.duration}ms) for ${metric.functionName} exceeds budget of ${this.budget.functionExecutionTime}ms`,
      };
      violations.push(violation);
      this.violations.push(violation);
    }

    return this.createCheckResult(violations);
  }

  /**
   * Check if memory usage exceeds budget
   */
  public checkMemoryUsage(metric: MemoryUsageMetric): BudgetCheckResult {
    const violations: BudgetViolation[] = [];

    // Check heap size percentage
    const heapPercentage = (metric.usedJSHeapSize / metric.jsHeapSizeLimit) * 100;
    if (heapPercentage > this.budget.heapSizeLimit) {
      const violation: BudgetViolation = {
        metric: 'heapSizeLimit',
        budgetValue: this.budget.heapSizeLimit,
        actualValue: heapPercentage,
        severity: this.getSeverity('heapSizeLimit', heapPercentage, this.budget.heapSizeLimit),
        message: `Heap size (${heapPercentage.toFixed(2)}%) exceeds budget of ${this.budget.heapSizeLimit}%`,
      };
      violations.push(violation);
      this.violations.push(violation);
    }

    // Check DOM node count
    if (metric.domNodeCount > this.budget.domNodeCount) {
      const violation: BudgetViolation = {
        metric: 'domNodeCount',
        budgetValue: this.budget.domNodeCount,
        actualValue: metric.domNodeCount,
        severity: this.getSeverity('domNodeCount', metric.domNodeCount, this.budget.domNodeCount),
        message: `DOM node count (${metric.domNodeCount}) exceeds budget of ${this.budget.domNodeCount}`,
      };
      violations.push(violation);
      this.violations.push(violation);
    }

    return this.createCheckResult(violations);
  }

  /**
   * Check all metrics against budgets
   */
  public checkAll(metrics: {
    webVitals?: WebVitalsMetric[];
    apiMetrics?: APITimingMetric[];
    errorStats?: ErrorRateStats;
    resourceMetrics?: ResourceLoadMetric[];
    executionMetrics?: ExecutionMetric[];
    memoryMetrics?: MemoryUsageMetric[];
  }): BudgetCheckResult {
    const allViolations: BudgetViolation[] = [];

    // Check Web Vitals
    if (metrics.webVitals) {
      for (const metric of metrics.webVitals) {
        const result = this.checkWebVitals(metric);
        allViolations.push(...result.violations);
      }
    }

    // Check API metrics
    if (metrics.apiMetrics) {
      for (const metric of metrics.apiMetrics) {
        const result = this.checkAPIResponseTime(metric);
        allViolations.push(...result.violations);
      }
    }

    // Check error rate
    if (metrics.errorStats) {
      const result = this.checkErrorRate(metrics.errorStats);
      allViolations.push(...result.violations);
    }

    // Check resource metrics
    if (metrics.resourceMetrics) {
      for (const metric of metrics.resourceMetrics) {
        const result = this.checkResourceLoadTime(metric);
        allViolations.push(...result.violations);
      }
    }

    // Check execution metrics
    if (metrics.executionMetrics) {
      for (const metric of metrics.executionMetrics) {
        const result = this.checkExecutionTime(metric);
        allViolations.push(...result.violations);
      }
    }

    // Check memory metrics
    if (metrics.memoryMetrics) {
      for (const metric of metrics.memoryMetrics) {
        const result = this.checkMemoryUsage(metric);
        allViolations.push(...result.violations);
      }
    }

    return this.createCheckResult(allViolations);
  }

  /**
   * Get all recorded violations
   */
  public getViolations(): BudgetViolation[] {
    return [...this.violations];
  }

  /**
   * Clear all recorded violations
   */
  public clearViolations(): void {
    this.violations = [];
  }

  /**
   * Get current budget configuration
   */
  public getBudget(): PerformanceBudget {
    return { ...this.budget };
  }

  /**
   * Update budget configuration
   */
  public updateBudget(budget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  /**
   * Determine severity of a violation
   */
  private getSeverity(
    metric: string,
    actualValue: number,
    budgetValue: number
  ): 'warning' | 'critical' {
    const exceedanceRatio = actualValue / budgetValue;
    
    // If value exceeds budget by more than 50%, it's critical
    return exceedanceRatio > 1.5 ? 'critical' : 'warning';
  }

  /**
   * Create a check result and handle violations
   */
  private createCheckResult(violations: BudgetViolation[]): BudgetCheckResult {
    const result: BudgetCheckResult = {
      passed: violations.length === 0,
      violations,
      timestamp: Date.now(),
    };

    // Handle violations if any
    if (!result.passed) {
      if (this.options.alertOnViolation) {
        this.sendAlert(violations);
      }

      if (this.options.onViolation) {
        this.options.onViolation(violations);
      }

      if (this.options.blockOnViolation) {
        throw new Error(
          `Performance budget violated: ${violations.map(v => v.message).join(', ')}`
        );
      }
    }

    return result;
  }

  /**
   * Send alert for violations
   */
  private sendAlert(violations: BudgetViolation[]): void {
    // In a real implementation, this would send alerts to a monitoring service
    console.warn('Performance budget violations detected:', violations);
  }
}

// Export singleton instance
let enforcerInstance: BudgetEnforcer | null = null;

export function initBudgetEnforcer(
  budget?: PerformanceBudget,
  options?: BudgetEnforcementOptions
): BudgetEnforcer {
  if (!enforcerInstance) {
    enforcerInstance = new BudgetEnforcer(budget, options);
  }
  return enforcerInstance;
}

export function getBudgetEnforcer(): BudgetEnforcer | null {
  return enforcerInstance;
}
