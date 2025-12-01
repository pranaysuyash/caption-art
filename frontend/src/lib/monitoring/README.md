# Performance Monitoring System

A comprehensive performance monitoring solution that tracks Core Web Vitals, API response times, error rates, resource loading, JavaScript execution, and memory usage.

## Features

- **Core Web Vitals Tracking**: Measures LCP, FID, and CLS
- **API Response Time Monitoring**: Tracks API performance with percentile calculations
- **Error Rate Tracking**: Monitors errors by type (network, API, client)
- **Resource Loading Monitoring**: Tracks images, scripts, stylesheets, and other resources
- **JavaScript Execution Tracking**: Measures function execution times and long tasks
- **Memory Usage Monitoring**: Detects memory leaks and tracks heap usage
- **Performance Budget Enforcement**: Validates metrics against defined budgets
- **Unified Monitoring Service**: Queues and sends metrics to a monitoring endpoint

## Quick Start

### Basic Usage

```typescript
import { initPerformanceMonitor } from './lib/monitoring';

// Initialize with default configuration
const monitor = initPerformanceMonitor();
```

### Custom Configuration

```typescript
import { initPerformanceMonitor } from './lib/monitoring';

const monitor = initPerformanceMonitor({
  // Enable/disable specific monitoring modules
  enableWebVitals: true,
  enableAPIMonitoring: true,
  enableErrorTracking: true,
  enableResourceMonitoring: true,
  enableExecutionTracking: true,
  enableMemoryMonitoring: true,
  enableBudgetEnforcement: true,
  
  // Optional: Send metrics to a monitoring endpoint
  endpoint: 'https://monitoring.example.com/metrics',
  
  // Optional: Custom performance budgets
  budget: {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    apiResponseTime: 3000,
    apiErrorRate: 5,
    resourceLoadTime: 2000,
    totalPageWeight: 5242880,
    functionExecutionTime: 50,
    heapSizeLimit: 90,
    domNodeCount: 1500,
  },
});
```

## Usage Examples

### Tracking API Requests

```typescript
import { getPerformanceMonitor } from './lib/monitoring';

const monitor = getPerformanceMonitor();
const apiMonitor = monitor?.getAPIMonitor();

// Start tracking a request
const requestId = apiMonitor?.startRequest('/api/users', 'GET');

// Make your API call
const response = await fetch('/api/users');

// End tracking
apiMonitor?.endRequest(requestId, '/api/users', 'GET', response.status);

// Get percentiles
const percentiles = apiMonitor?.calculatePercentiles();
console.log('API Performance:', percentiles);
```

### Tracking Function Execution

```typescript
import { getPerformanceMonitor } from './lib/monitoring';

const monitor = getPerformanceMonitor();
const executionTracker = monitor?.getExecutionTracker();

// Measure a function
const result = await executionTracker?.measureFunction('processData', async () => {
  // Your code here
  return processData();
});

// Or manually track
const measureId = executionTracker?.startMeasure('myFunction');
// ... do work ...
executionTracker?.endMeasure(measureId, 'myFunction');
```

### Recording Errors

```typescript
import { getPerformanceMonitor } from './lib/monitoring';

const monitor = getPerformanceMonitor();
const errorTracker = monitor?.getErrorRateTracker();

// Record successful request
errorTracker?.recordRequest();

// Record API error
errorTracker?.recordAPIError('/api/data', 500, 'Internal server error');

// Record network error
errorTracker?.recordNetworkError('/api/data', 'Network timeout');

// Record client-side error
errorTracker?.recordClientError('Validation failed');

// Get error statistics
const stats = errorTracker?.calculateErrorRate();
console.log('Error Rate:', stats);
```

### Enforcing Performance Budgets

```typescript
import { getPerformanceMonitor } from './lib/monitoring';

const monitor = getPerformanceMonitor();
const budgetEnforcer = monitor?.getBudgetEnforcer();

// Check a Web Vitals metric
const result = budgetEnforcer?.checkWebVitals({
  name: 'LCP',
  value: 3000,
  rating: 'needs-improvement',
  timestamp: Date.now(),
});

if (!result?.passed) {
  console.warn('Budget violations:', result?.violations);
}

// Check all metrics at once
const allResults = budgetEnforcer?.checkAll({
  webVitals: monitor.getWebVitalsTracker()?.getMetrics(),
  apiMetrics: monitor.getAPIMonitor()?.getMetrics(),
  errorStats: monitor.getErrorRateTracker()?.calculateErrorRate(),
  // ... other metrics
});
```

### Getting Performance Reports

```typescript
import { getPerformanceMonitor } from './lib/monitoring';

const monitor = getPerformanceMonitor();

// Get comprehensive performance report
const report = monitor?.getPerformanceReport();

console.log('Performance Report:', {
  webVitals: report.webVitals,
  apiPercentiles: report.apiPercentiles,
  errorRate: report.errorRate,
  resourceStats: report.resourceStats,
  executionStats: report.executionStats,
  memoryStats: report.memoryStats,
  budgetViolations: report.budgetViolations,
});
```

### Flushing Metrics

```typescript
import { getPerformanceMonitor } from './lib/monitoring';

const monitor = getPerformanceMonitor();

// Manually flush metrics to the monitoring endpoint
await monitor?.flush();

// Shutdown and flush on app exit
window.addEventListener('beforeunload', async () => {
  await monitor?.shutdown();
});
```

## Integration with React

```typescript
import { useEffect } from 'react';
import { initPerformanceMonitor } from './lib/monitoring';

function App() {
  useEffect(() => {
    // Initialize monitoring on app mount
    const monitor = initPerformanceMonitor({
      endpoint: process.env.REACT_APP_MONITORING_ENDPOINT,
    });

    // Cleanup on unmount
    return () => {
      monitor.shutdown();
    };
  }, []);

  return <div>Your App</div>;
}
```

## Monitoring Service Integration

The monitoring system automatically queues metrics and sends them to a configured endpoint. The payload format is:

```json
{
  "metrics": [
    {
      "type": "web-vitals",
      "data": {
        "name": "LCP",
        "value": 2000,
        "rating": "good",
        "timestamp": 1234567890
      },
      "timestamp": 1234567890
    },
    {
      "type": "api-timing",
      "data": {
        "endpoint": "/api/users",
        "method": "GET",
        "statusCode": 200,
        "duration": 150,
        "timestamp": 1234567890,
        "isSlow": false
      },
      "timestamp": 1234567890
    }
  ],
  "userAgent": "Mozilla/5.0...",
  "url": "https://example.com/page"
}
```

## Performance Budget Configuration

Default budgets are based on industry best practices:

- **LCP**: < 2.5 seconds
- **FID**: < 100 milliseconds
- **CLS**: < 0.1
- **API Response Time**: < 3 seconds
- **API Error Rate**: < 5%
- **Resource Load Time**: < 2 seconds
- **Total Page Weight**: < 5 MB
- **Function Execution Time**: < 50 milliseconds
- **Heap Size Limit**: < 90% of available heap
- **DOM Node Count**: < 1500 nodes

## API Reference

### PerformanceMonitor

Main class that orchestrates all monitoring modules.

#### Methods

- `initialize()`: Initialize all enabled monitoring modules
- `getWebVitalsTracker()`: Get the Web Vitals tracker instance
- `getAPIMonitor()`: Get the API monitor instance
- `getErrorRateTracker()`: Get the error rate tracker instance
- `getResourceMonitor()`: Get the resource monitor instance
- `getExecutionTracker()`: Get the execution tracker instance
- `getMemoryMonitor()`: Get the memory monitor instance
- `getBudgetEnforcer()`: Get the budget enforcer instance
- `getMonitoringService()`: Get the monitoring service instance
- `getPerformanceReport()`: Get comprehensive performance report
- `flush()`: Flush all queued metrics immediately
- `shutdown()`: Stop all monitoring and flush remaining metrics

### Individual Monitors

Each monitoring module can also be used independently:

```typescript
import {
  initWebVitalsTracking,
  initAPIMonitoring,
  initErrorRateTracking,
  initResourceMonitoring,
  initExecutionTracking,
  initMemoryMonitoring,
  initBudgetEnforcer,
} from './lib/monitoring';
```

## Testing

The monitoring system includes comprehensive unit tests and integration tests:

```bash
npm test -- src/lib/monitoring/performanceMonitor.test.ts
npm test -- src/lib/monitoring/integration.test.ts
```

## License

MIT
