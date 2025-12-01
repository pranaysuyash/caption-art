import { useState, useEffect } from 'react';
import {
  getWebVitalsTracker,
  getAPIMonitor,
  getErrorRateTracker,
  getResourceMonitor,
  getExecutionTracker,
  getMemoryMonitor,
  type WebVitalsMetric,
  type APITimingMetric,
  type APIPercentiles,
  type ErrorRateStats,
  type ExecutionStats,
  type MemoryStats,
} from '../lib/monitoring';
import './PerformanceDashboard.css';

interface DashboardProps {
  refreshInterval?: number; // milliseconds
}

type TimeRange = 'hour' | 'day' | 'week';
type MetricView = 'overview' | 'webvitals' | 'api' | 'errors' | 'resources' | 'execution' | 'memory';

export function PerformanceDashboard({ refreshInterval = 5000 }: DashboardProps) {
  const [activeView, setActiveView] = useState<MetricView>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('hour');
  const [webVitals, setWebVitals] = useState<WebVitalsMetric[]>([]);
  const [apiMetrics, setApiMetrics] = useState<APITimingMetric[]>([]);
  const [apiPercentiles, setApiPercentiles] = useState<APIPercentiles | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorRateStats | null>(null);
  const [executionStats, setExecutionStats] = useState<ExecutionStats | null>(null);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [resourceStats, setResourceStats] = useState<any>(null);

  // Refresh metrics periodically
  useEffect(() => {
    const refreshMetrics = () => {
      const webVitalsTracker = getWebVitalsTracker();
      const apiMonitor = getAPIMonitor();
      const errorTracker = getErrorRateTracker();
      const resourceMonitor = getResourceMonitor();
      const executionTracker = getExecutionTracker();
      const memoryMonitor = getMemoryMonitor();

      if (webVitalsTracker) {
        setWebVitals(webVitalsTracker.getMetrics());
      }

      if (apiMonitor) {
        setApiMetrics(apiMonitor.getMetrics());
        setApiPercentiles(apiMonitor.calculatePercentiles());
      }

      if (errorTracker) {
        setErrorStats(errorTracker.calculateErrorRate());
      }

      if (resourceMonitor) {
        setResourceStats(resourceMonitor.getResourceStats());
      }

      if (executionTracker) {
        setExecutionStats(executionTracker.calculateStats());
      }

      if (memoryMonitor) {
        setMemoryStats(memoryMonitor.getMemoryStats());
      }
    };

    refreshMetrics();
    const interval = setInterval(refreshMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      timeRange,
      webVitals,
      apiMetrics: {
        metrics: apiMetrics,
        percentiles: apiPercentiles,
      },
      errorStats,
      resourceStats,
      executionStats,
      memoryStats,
      userAgent: navigator.userAgent,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h1>Performance Dashboard</h1>
        <div className="dashboard-controls">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRange)}>
            <option value="hour">Last Hour</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
          </select>
          <button onClick={exportReport}>Export Report</button>
        </div>
      </div>

      <div className="dashboard-nav">
        <button
          className={activeView === 'overview' ? 'active' : ''}
          onClick={() => setActiveView('overview')}
        >
          Overview
        </button>
        <button
          className={activeView === 'webvitals' ? 'active' : ''}
          onClick={() => setActiveView('webvitals')}
        >
          Web Vitals
        </button>
        <button
          className={activeView === 'api' ? 'active' : ''}
          onClick={() => setActiveView('api')}
        >
          API Performance
        </button>
        <button
          className={activeView === 'errors' ? 'active' : ''}
          onClick={() => setActiveView('errors')}
        >
          Errors
        </button>
        <button
          className={activeView === 'resources' ? 'active' : ''}
          onClick={() => setActiveView('resources')}
        >
          Resources
        </button>
        <button
          className={activeView === 'execution' ? 'active' : ''}
          onClick={() => setActiveView('execution')}
        >
          Execution
        </button>
        <button
          className={activeView === 'memory' ? 'active' : ''}
          onClick={() => setActiveView('memory')}
        >
          Memory
        </button>
      </div>

      <div className="dashboard-content">
        {activeView === 'overview' && (
          <OverviewView
            webVitals={webVitals}
            apiPercentiles={apiPercentiles}
            errorStats={errorStats}
            resourceStats={resourceStats}
            executionStats={executionStats}
            memoryStats={memoryStats}
          />
        )}
        {activeView === 'webvitals' && <WebVitalsView metrics={webVitals} timeRange={timeRange} />}
        {activeView === 'api' && (
          <APIView metrics={apiMetrics} percentiles={apiPercentiles} timeRange={timeRange} />
        )}
        {activeView === 'errors' && <ErrorsView stats={errorStats} timeRange={timeRange} />}
        {activeView === 'resources' && <ResourcesView stats={resourceStats} timeRange={timeRange} />}
        {activeView === 'execution' && <ExecutionView stats={executionStats} timeRange={timeRange} />}
        {activeView === 'memory' && <MemoryView stats={memoryStats} timeRange={timeRange} />}
      </div>
    </div>
  );
}

// Overview View
function OverviewView({
  webVitals,
  apiPercentiles,
  errorStats,
  resourceStats,
  executionStats,
  memoryStats,
}: {
  webVitals: WebVitalsMetric[];
  apiPercentiles: APIPercentiles | null;
  errorStats: ErrorRateStats | null;
  resourceStats: any;
  executionStats: ExecutionStats | null;
  memoryStats: MemoryStats | null;
}) {
  return (
    <div className="overview-grid">
      <div className="metric-card">
        <h3>Core Web Vitals</h3>
        {webVitals.map((metric) => (
          <div key={metric.name} className={`metric-item ${metric.rating}`}>
            <span className="metric-name">{metric.name}</span>
            <span className="metric-value">
              {metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}
              {metric.name !== 'CLS' && 'ms'}
            </span>
            <span className={`metric-rating ${metric.rating}`}>{metric.rating}</span>
          </div>
        ))}
      </div>

      <div className="metric-card">
        <h3>API Performance</h3>
        {apiPercentiles && (
          <>
            <div className="metric-item">
              <span className="metric-name">p50</span>
              <span className="metric-value">{apiPercentiles.p50.toFixed(0)}ms</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">p95</span>
              <span className="metric-value">{apiPercentiles.p95.toFixed(0)}ms</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">p99</span>
              <span className="metric-value">{apiPercentiles.p99.toFixed(0)}ms</span>
            </div>
          </>
        )}
      </div>

      <div className="metric-card">
        <h3>Error Rate</h3>
        {errorStats && (
          <>
            <div className="metric-item">
              <span className="metric-name">Total Requests</span>
              <span className="metric-value">{errorStats.totalRequests}</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Total Errors</span>
              <span className="metric-value">{errorStats.totalErrors}</span>
            </div>
            <div className={`metric-item ${errorStats.errorRate > 5 ? 'poor' : 'good'}`}>
              <span className="metric-name">Error Rate</span>
              <span className="metric-value">{errorStats.errorRate.toFixed(2)}%</span>
            </div>
          </>
        )}
      </div>

      <div className="metric-card">
        <h3>Resources</h3>
        {resourceStats && (
          <>
            <div className="metric-item">
              <span className="metric-name">Total Resources</span>
              <span className="metric-value">{resourceStats.totalResources}</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Page Weight</span>
              <span className="metric-value">
                {(resourceStats.totalPageWeight / 1024 / 1024).toFixed(2)}MB
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Cache Hit Rate</span>
              <span className="metric-value">{resourceStats.cacheHitRate.toFixed(1)}%</span>
            </div>
          </>
        )}
      </div>

      <div className="metric-card">
        <h3>Execution</h3>
        {executionStats && (
          <>
            <div className="metric-item">
              <span className="metric-name">Total Executions</span>
              <span className="metric-value">{executionStats.totalExecutions}</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Slow Executions</span>
              <span className="metric-value">{executionStats.slowExecutions}</span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Long Tasks</span>
              <span className="metric-value">{executionStats.longTasks}</span>
            </div>
          </>
        )}
      </div>

      <div className="metric-card">
        <h3>Memory</h3>
        {memoryStats && (
          <>
            <div className="metric-item">
              <span className="metric-name">Current Usage</span>
              <span className="metric-value">
                {(memoryStats.currentUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Peak Usage</span>
              <span className="metric-value">
                {(memoryStats.peakUsage / 1024 / 1024).toFixed(2)}MB
              </span>
            </div>
            <div className={`metric-item ${memoryStats.leakIndicator.detected ? 'poor' : 'good'}`}>
              <span className="metric-name">Leak Detected</span>
              <span className="metric-value">
                {memoryStats.leakIndicator.detected ? 'Yes' : 'No'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Web Vitals Detail View
function WebVitalsView({ metrics, timeRange }: { metrics: WebVitalsMetric[]; timeRange: TimeRange }) {
  return (
    <div className="detail-view">
      <h2>Core Web Vitals - {timeRange}</h2>
      <div className="metrics-list">
        {metrics.map((metric) => (
          <div key={metric.name} className="metric-detail-card">
            <h3>{metric.name}</h3>
            <div className="metric-detail-content">
              <div className="metric-value-large">
                {metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}
                {metric.name !== 'CLS' && 'ms'}
              </div>
              <div className={`metric-rating-badge ${metric.rating}`}>{metric.rating}</div>
              <div className="metric-timestamp">
                {new Date(metric.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="metric-info">
        <h3>About Core Web Vitals</h3>
        <ul>
          <li>
            <strong>LCP (Largest Contentful Paint):</strong> Measures loading performance. Good: &lt;
            2.5s
          </li>
          <li>
            <strong>FID (First Input Delay):</strong> Measures interactivity. Good: &lt; 100ms
          </li>
          <li>
            <strong>CLS (Cumulative Layout Shift):</strong> Measures visual stability. Good: &lt; 0.1
          </li>
        </ul>
      </div>
    </div>
  );
}

// API Performance Detail View
function APIView({
  metrics,
  percentiles,
  timeRange,
}: {
  metrics: APITimingMetric[];
  percentiles: APIPercentiles | null;
  timeRange: TimeRange;
}) {
  const slowRequests = metrics.filter((m) => m.isSlow);
  const byEndpoint = metrics.reduce((acc, m) => {
    if (!acc[m.endpoint]) {
      acc[m.endpoint] = [];
    }
    acc[m.endpoint].push(m);
    return acc;
  }, {} as Record<string, APITimingMetric[]>);

  return (
    <div className="detail-view">
      <h2>API Performance - {timeRange}</h2>

      <div className="percentiles-section">
        <h3>Response Time Percentiles</h3>
        {percentiles && (
          <div className="percentiles-grid">
            <div className="percentile-card">
              <div className="percentile-label">p50 (Median)</div>
              <div className="percentile-value">{percentiles.p50.toFixed(0)}ms</div>
            </div>
            <div className="percentile-card">
              <div className="percentile-label">p95</div>
              <div className="percentile-value">{percentiles.p95.toFixed(0)}ms</div>
            </div>
            <div className="percentile-card">
              <div className="percentile-label">p99</div>
              <div className="percentile-value">{percentiles.p99.toFixed(0)}ms</div>
            </div>
          </div>
        )}
      </div>

      <div className="slow-requests-section">
        <h3>Slow Requests (&gt; 3s)</h3>
        <div className="requests-table">
          {slowRequests.length === 0 ? (
            <p>No slow requests detected</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {slowRequests.map((req, idx) => (
                  <tr key={idx}>
                    <td>{req.endpoint}</td>
                    <td>{req.method}</td>
                    <td>{req.duration.toFixed(0)}ms</td>
                    <td>{req.statusCode}</td>
                    <td>{new Date(req.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="endpoints-section">
        <h3>By Endpoint</h3>
        {Object.entries(byEndpoint).map(([endpoint, endpointMetrics]) => {
          const avgDuration =
            endpointMetrics.reduce((sum, m) => sum + m.duration, 0) / endpointMetrics.length;
          return (
            <div key={endpoint} className="endpoint-card">
              <div className="endpoint-name">{endpoint}</div>
              <div className="endpoint-stats">
                <span>Requests: {endpointMetrics.length}</span>
                <span>Avg: {avgDuration.toFixed(0)}ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Errors Detail View
function ErrorsView({ stats, timeRange }: { stats: ErrorRateStats | null; timeRange: TimeRange }) {
  if (!stats) {
    return <div className="detail-view">No error data available</div>;
  }

  return (
    <div className="detail-view">
      <h2>Error Tracking - {timeRange}</h2>

      <div className="error-summary">
        <div className="error-stat-card">
          <div className="stat-label">Total Requests</div>
          <div className="stat-value">{stats.totalRequests}</div>
        </div>
        <div className="error-stat-card">
          <div className="stat-label">Total Errors</div>
          <div className="stat-value">{stats.totalErrors}</div>
        </div>
        <div className={`error-stat-card ${stats.errorRate > 5 ? 'critical' : ''}`}>
          <div className="stat-label">Error Rate</div>
          <div className="stat-value">{stats.errorRate.toFixed(2)}%</div>
        </div>
      </div>

      <div className="errors-by-type">
        <h3>Errors by Type</h3>
        <div className="error-type-grid">
          {Object.entries(stats.errorsByType).map(([type, count]) => (
            <div key={type} className="error-type-card">
              <div className="error-type-label">{type}</div>
              <div className="error-type-count">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Resources Detail View
function ResourcesView({ stats, timeRange }: { stats: any; timeRange: TimeRange }) {
  if (!stats) {
    return <div className="detail-view">No resource data available</div>;
  }

  return (
    <div className="detail-view">
      <h2>Resource Loading - {timeRange}</h2>

      <div className="resource-summary">
        <div className="resource-stat-card">
          <div className="stat-label">Total Resources</div>
          <div className="stat-value">{stats.totalResources}</div>
        </div>
        <div className="resource-stat-card">
          <div className="stat-label">Page Weight</div>
          <div className="stat-value">{(stats.totalPageWeight / 1024 / 1024).toFixed(2)}MB</div>
        </div>
        <div className="resource-stat-card">
          <div className="stat-label">Cache Hit Rate</div>
          <div className="stat-value">{stats.cacheHitRate.toFixed(1)}%</div>
        </div>
        <div className="resource-stat-card">
          <div className="stat-label">Slow Resources</div>
          <div className="stat-value">{stats.slowResources}</div>
        </div>
        <div className="resource-stat-card">
          <div className="stat-label">Failed Resources</div>
          <div className="stat-value">{stats.failedResources}</div>
        </div>
      </div>

      <div className="resources-by-type">
        <h3>By Resource Type</h3>
        <div className="resource-type-grid">
          {Object.entries(stats.byType).map(([type, typeStats]: [string, any]) => (
            <div key={type} className="resource-type-card">
              <h4>{type}</h4>
              <div className="type-stats">
                <div>Count: {typeStats.count}</div>
                <div>Size: {(typeStats.totalSize / 1024).toFixed(2)}KB</div>
                <div>Avg Duration: {typeStats.avgDuration.toFixed(0)}ms</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Execution Detail View
function ExecutionView({ stats, timeRange }: { stats: ExecutionStats | null; timeRange: TimeRange }) {
  if (!stats) {
    return <div className="detail-view">No execution data available</div>;
  }

  return (
    <div className="detail-view">
      <h2>JavaScript Execution - {timeRange}</h2>

      <div className="execution-summary">
        <div className="execution-stat-card">
          <div className="stat-label">Total Executions</div>
          <div className="stat-value">{stats.totalExecutions}</div>
        </div>
        <div className="execution-stat-card">
          <div className="stat-label">Slow Executions</div>
          <div className="stat-value">{stats.slowExecutions}</div>
        </div>
        <div className="execution-stat-card">
          <div className="stat-label">Long Tasks</div>
          <div className="stat-value">{stats.longTasks}</div>
        </div>
      </div>

      <div className="slowest-operations">
        <h3>Slowest Operations</h3>
        <div className="operations-table">
          {stats.slowestOperations.length === 0 ? (
            <p>No operations recorded</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Function</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.slowestOperations.map((op, idx) => (
                  <tr key={idx}>
                    <td>{op.functionName}</td>
                    <td>{op.duration.toFixed(2)}ms</td>
                    <td>{op.isLongTask ? 'Long Task' : 'Function'}</td>
                    <td>{new Date(op.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// Memory Detail View
function MemoryView({ stats, timeRange }: { stats: MemoryStats | null; timeRange: TimeRange }) {
  if (!stats) {
    return <div className="detail-view">No memory data available</div>;
  }

  const heapUsagePercent =
    (stats.currentUsage.usedJSHeapSize / stats.currentUsage.jsHeapSizeLimit) * 100;

  return (
    <div className="detail-view">
      <h2>Memory Usage - {timeRange}</h2>

      <div className="memory-summary">
        <div className="memory-stat-card">
          <div className="stat-label">Current Usage</div>
          <div className="stat-value">
            {(stats.currentUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB
          </div>
        </div>
        <div className="memory-stat-card">
          <div className="stat-label">Average Usage</div>
          <div className="stat-value">{(stats.averageUsage / 1024 / 1024).toFixed(2)}MB</div>
        </div>
        <div className="memory-stat-card">
          <div className="stat-label">Peak Usage</div>
          <div className="stat-value">{(stats.peakUsage / 1024 / 1024).toFixed(2)}MB</div>
        </div>
        <div className="memory-stat-card">
          <div className="stat-label">Heap Usage</div>
          <div className="stat-value">{heapUsagePercent.toFixed(1)}%</div>
        </div>
        <div className="memory-stat-card">
          <div className="stat-label">DOM Nodes</div>
          <div className="stat-value">{stats.currentUsage.domNodeCount}</div>
        </div>
      </div>

      <div className="memory-leak-section">
        <h3>Memory Leak Detection</h3>
        <div className={`leak-indicator ${stats.leakIndicator.detected ? 'detected' : 'clear'}`}>
          <div className="leak-status">
            {stats.leakIndicator.detected ? '⚠️ Leak Detected' : '✓ No Leak Detected'}
          </div>
          <div className="leak-details">
            <div>Growth Rate: {(stats.leakIndicator.growthRate / 1024).toFixed(2)}KB/s</div>
            <div>Consecutive Increases: {stats.leakIndicator.consecutiveIncreases}</div>
          </div>
        </div>
      </div>

      {stats.highMemoryComponents.length > 0 && (
        <div className="high-memory-components">
          <h3>High Memory Components</h3>
          <div className="components-list">
            {stats.highMemoryComponents.map((component, idx) => (
              <div key={idx} className="component-card">
                <div className="component-name">{component.componentName}</div>
                <div className="component-size">
                  {(component.estimatedSize / 1024 / 1024).toFixed(2)}MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
