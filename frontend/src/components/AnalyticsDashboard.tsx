/**
 * Analytics Dashboard Component
 * 
 * Displays analytics metrics and insights:
 * - Key metrics (DAU, MAU, retention)
 * - Feature usage trends
 * - Error rates
 * - Performance metrics
 * - Conversion funnel
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useState, useEffect } from 'react';
import { calculateConversionMetrics, getFreeTierUsageStats } from '../lib/analytics/conversionTracker';
import type { ConversionMetrics, FreeTierUsage } from '../lib/analytics/conversionTracker';

/**
 * Key metrics for the dashboard
 */
interface KeyMetrics {
  dau: number; // Daily Active Users
  mau: number; // Monthly Active Users
  retention: number; // Retention rate (percentage)
}

/**
 * Feature usage data
 */
interface FeatureUsage {
  feature: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Error metrics
 */
interface ErrorMetrics {
  totalErrors: number;
  errorRate: number; // Errors per session
  topErrors: Array<{ message: string; count: number }>;
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  avgPageLoadTime: number;
  avgApiResponseTime: number;
  avgProcessingTime: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Dashboard data structure
 */
interface DashboardData {
  keyMetrics: KeyMetrics;
  featureUsage: FeatureUsage[];
  errorMetrics: ErrorMetrics;
  performanceMetrics: PerformanceMetrics;
  conversionMetrics: ConversionMetrics;
  freeTierUsage: FreeTierUsage;
}

/**
 * Mock data generator for demonstration
 * In production, this would fetch from analytics service
 */
function generateMockDashboardData(): DashboardData {
  return {
    keyMetrics: {
      dau: Math.floor(Math.random() * 1000) + 500,
      mau: Math.floor(Math.random() * 5000) + 2000,
      retention: Math.random() * 30 + 60, // 60-90%
    },
    featureUsage: [
      { feature: 'image_upload', count: Math.floor(Math.random() * 500) + 100, trend: 'up' },
      { feature: 'caption_generate', count: Math.floor(Math.random() * 400) + 80, trend: 'up' },
      { feature: 'export', count: Math.floor(Math.random() * 300) + 50, trend: 'stable' },
      { feature: 'style_apply', count: Math.floor(Math.random() * 200) + 30, trend: 'down' },
    ],
    errorMetrics: {
      totalErrors: Math.floor(Math.random() * 50) + 10,
      errorRate: Math.random() * 0.05, // 0-5%
      topErrors: [
        { message: 'Network timeout', count: Math.floor(Math.random() * 20) + 5 },
        { message: 'Invalid image format', count: Math.floor(Math.random() * 15) + 3 },
        { message: 'API rate limit', count: Math.floor(Math.random() * 10) + 2 },
      ],
    },
    performanceMetrics: {
      avgPageLoadTime: Math.random() * 1000 + 500, // 500-1500ms
      avgApiResponseTime: Math.random() * 500 + 200, // 200-700ms
      avgProcessingTime: Math.random() * 2000 + 1000, // 1-3s
      p50: Math.random() * 500 + 300,
      p95: Math.random() * 1000 + 800,
      p99: Math.random() * 2000 + 1500,
    },
    conversionMetrics: calculateConversionMetrics(),
    freeTierUsage: getFreeTierUsageStats(),
  };
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Format percentage
 */
function formatPercentage(num: number): string {
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * Format milliseconds
 */
function formatMs(ms: number): string {
  return `${ms.toFixed(0)}ms`;
}

/**
 * Metric Card Component
 */
function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className='stat-card'>
      <div className='stat-label'>{title}</div>
      <div className='stat-value'>{value}</div>
      {subtitle && <div className='stat-change'>{subtitle}</div>}
    </div>
  );
}

/**
 * Feature Usage Chart Component
 */
function FeatureUsageChart({ features }: { features: FeatureUsage[] }) {
  const maxCount = Math.max(...features.map(f => f.count));
  
  return (
    <div className='panel'>
      <div className='panel-header'>
        <h3 className='panel-title'>Feature Usage</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {features.map((feature) => (
          <div key={feature.feature}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '14px' }}>{feature.feature}</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {formatNumber(feature.count)}
                {feature.trend === 'up' && ' ↑'}
                {feature.trend === 'down' && ' ↓'}
              </span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(feature.count / maxCount) * 100}%`,
                backgroundColor: feature.trend === 'up' ? '#4CAF50' : feature.trend === 'down' ? '#f44336' : '#2196F3',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Conversion Funnel Component
 */
function ConversionFunnel({ metrics }: { metrics: ConversionMetrics }) {
  const stages = [
    { label: 'Prompt Views', value: metrics.promptViews, width: 100 },
    { label: 'Upgrade Clicks', value: metrics.upgradeClicks, width: metrics.promptViews > 0 ? (metrics.upgradeClicks / metrics.promptViews) * 100 : 0 },
    { label: 'Conversions', value: metrics.conversions, width: metrics.promptViews > 0 ? (metrics.conversions / metrics.promptViews) * 100 : 0 },
  ];
  
  return (
    <div className='panel'>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
        Conversion Funnel
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        {stages.map((stage, index) => (
          <div key={stage.label} style={{ width: '100%' }}>
            <div style={{
              width: `${stage.width}%`,
              padding: '15px',
              backgroundColor: index === 0 ? '#2196F3' : index === 1 ? '#4CAF50' : '#FF9800',
              color: '#fff',
              textAlign: 'center',
              borderRadius: '4px',
              margin: '0 auto',
              transition: 'width 0.3s ease',
            }}>
              <div style={{ fontWeight: 'bold' }}>{stage.label}</div>
              <div style={{ fontSize: '20px', margin: '5px 0' }}>{formatNumber(stage.value)}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <div>Click-through Rate: {formatPercentage(metrics.clickThroughRate)}</div>
        <div>Conversion Rate: {formatPercentage(metrics.conversionRate)}</div>
        <div>Overall Conversion: {formatPercentage(metrics.overallConversionRate)}</div>
      </div>
    </div>
  );
}

/**
 * Analytics Dashboard Component
 */
export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Load initial data
    loadDashboardData();

    // Set up auto-refresh if enabled
    let interval: number | undefined;
    if (autoRefresh) {
      interval = window.setInterval(() => {
        loadDashboardData();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  const loadDashboardData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(generateMockDashboardData());
      setLoading(false);
    }, 500);
  };

  const renderSkeletonGrid = (count: number, minWidth: number = 200) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
        gap: 'var(--space-md)',
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className='card skeleton-card'
          style={{
            padding: '1.25rem',
            border: '1px solid var(--color-border, #1f2937)',
            background: 'var(--color-bg-secondary, #111827)',
          }}
        >
          <div
            className='skeleton-line'
            style={{ width: '60%', height: '16px', marginBottom: '0.6rem' }}
          />
          <div
            className='skeleton-line'
            style={{ width: '45%', height: '14px', marginBottom: '0.6rem' }}
          />
          <div
            className='skeleton-line'
            style={{ width: '35%', height: '12px' }}
          />
        </div>
      ))}
    </div>
  );

  if (loading && !data) {
    return (
      <div className='page-container'>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {renderSkeletonGrid(3, 220)}
          {renderSkeletonGrid(2, 320)}
          {renderSkeletonGrid(2, 320)}
          {renderSkeletonGrid(1, 320)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='page-container'>
        <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          Failed to load dashboard data
        </div>
      </div>
    );
  }

  return (
    <div className='page-container'>
      {/* Header */}
      <div className='page-header'>
        <h1 className='page-title'>Analytics Dashboard</h1>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button
            onClick={loadDashboardData}
            className='btn btn-ghost'
            aria-label="Refresh analytics data"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics - Requirement 7.1 */}
      <section style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Key Metrics</h2>
        <div className='stats-grid'>
          <MetricCard
            title="Daily Active Users"
            value={formatNumber(data.keyMetrics.dau)}
            subtitle="Last 24 hours"
          />
          <MetricCard
            title="Monthly Active Users"
            value={formatNumber(data.keyMetrics.mau)}
            subtitle="Last 30 days"
          />
          <MetricCard
            title="Retention Rate"
            value={formatPercentage(data.keyMetrics.retention / 100)}
            subtitle="30-day retention"
          />
          <MetricCard
            title="Free Tier Exports"
            value={formatNumber(data.freeTierUsage.exportsCount)}
            subtitle="Total exports"
          />
        </div>
      </section>

      {/* Feature Usage - Requirement 7.2 */}
      <section style={{ marginBottom: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          <FeatureUsageChart features={data.featureUsage} />
          
          {/* Error Metrics - Requirement 7.3 */}
          <div style={{
            padding: '20px',
            border: '2px solid #000',
            borderRadius: '8px',
            backgroundColor: '#fff',
            boxShadow: '4px 4px 0 #000',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Error Metrics
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <MetricCard
                title="Total Errors"
                value={formatNumber(data.errorMetrics.totalErrors)}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                Error Rate: {formatPercentage(data.errorMetrics.errorRate)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                Top Errors:
              </div>
              {data.errorMetrics.topErrors.map((error, index) => (
                <div key={index} style={{ fontSize: '12px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{error.message}</span>
                  <span style={{ fontWeight: 'bold' }}>{error.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Performance Metrics - Requirement 7.4 */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>Performance Metrics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <MetricCard
            title="Avg Page Load"
            value={formatMs(data.performanceMetrics.avgPageLoadTime)}
          />
          <MetricCard
            title="Avg API Response"
            value={formatMs(data.performanceMetrics.avgApiResponseTime)}
          />
          <MetricCard
            title="Avg Processing"
            value={formatMs(data.performanceMetrics.avgProcessingTime)}
          />
          <MetricCard
            title="P50"
            value={formatMs(data.performanceMetrics.p50)}
            subtitle="50th percentile"
          />
          <MetricCard
            title="P95"
            value={formatMs(data.performanceMetrics.p95)}
            subtitle="95th percentile"
          />
          <MetricCard
            title="P99"
            value={formatMs(data.performanceMetrics.p99)}
            subtitle="99th percentile"
          />
        </div>
      </section>

      {/* Conversion Funnel - Requirement 7.5 */}
      <section style={{ marginBottom: '30px' }}>
        <ConversionFunnel metrics={data.conversionMetrics} />
      </section>
    </div>
  );
}
