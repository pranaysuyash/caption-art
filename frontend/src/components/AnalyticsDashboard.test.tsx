/**
 * Analytics Dashboard Component Tests
 * 
 * Tests the analytics dashboard integration with analytics system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateConversionMetrics, getFreeTierUsageStats } from '../lib/analytics/conversionTracker';

describe('AnalyticsDashboard Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should integrate with conversion tracker for metrics', () => {
    const metrics = calculateConversionMetrics();
    
    expect(metrics).toHaveProperty('promptViews');
    expect(metrics).toHaveProperty('upgradeClicks');
    expect(metrics).toHaveProperty('conversions');
    expect(metrics).toHaveProperty('clickThroughRate');
    expect(metrics).toHaveProperty('conversionRate');
    expect(metrics).toHaveProperty('overallConversionRate');
  });

  it('should integrate with free tier usage tracker', () => {
    const usage = getFreeTierUsageStats();
    
    expect(usage).toHaveProperty('exportsCount');
    expect(usage).toHaveProperty('captionsCount');
    expect(typeof usage.exportsCount).toBe('number');
    expect(typeof usage.captionsCount).toBe('number');
  });

  it('should format numbers correctly', () => {
    const formatNumber = (num: number): string => {
      return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
    };
    
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(42)).toBe('42');
  });

  it('should format percentages correctly', () => {
    const formatPercentage = (num: number): string => {
      return `${(num * 100).toFixed(1)}%`;
    };
    
    expect(formatPercentage(0.25)).toBe('25.0%');
    expect(formatPercentage(0.5)).toBe('50.0%');
    expect(formatPercentage(0.123)).toBe('12.3%');
  });

  it('should format milliseconds correctly', () => {
    const formatMs = (ms: number): string => {
      return `${ms.toFixed(0)}ms`;
    };
    
    expect(formatMs(123.456)).toBe('123ms');
    expect(formatMs(1000)).toBe('1000ms');
    expect(formatMs(500.9)).toBe('501ms');
  });

  it('should calculate conversion funnel widths correctly', () => {
    const promptViews = 100;
    const upgradeClicks = 20;
    const conversions = 5;
    
    const clickWidth = (upgradeClicks / promptViews) * 100;
    const conversionWidth = (conversions / promptViews) * 100;
    
    expect(clickWidth).toBe(20);
    expect(conversionWidth).toBe(5);
  });

  it('should handle zero prompt views in funnel', () => {
    const promptViews = 0;
    const upgradeClicks = 0;
    const conversions = 0;
    
    const clickWidth = promptViews > 0 ? (upgradeClicks / promptViews) * 100 : 0;
    const conversionWidth = promptViews > 0 ? (conversions / promptViews) * 100 : 0;
    
    expect(clickWidth).toBe(0);
    expect(conversionWidth).toBe(0);
  });

  it('should calculate max count for feature usage bars', () => {
    const features = [
      { feature: 'upload', count: 100, trend: 'up' as const },
      { feature: 'caption', count: 80, trend: 'up' as const },
      { feature: 'export', count: 50, trend: 'stable' as const },
    ];
    
    const maxCount = Math.max(...features.map(f => f.count));
    expect(maxCount).toBe(100);
    
    // Verify bar widths are calculated correctly
    features.forEach(feature => {
      const width = (feature.count / maxCount) * 100;
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(100);
    });
  });

  it('should generate trend indicators correctly', () => {
    const getTrendIndicator = (trend: 'up' | 'down' | 'stable'): string => {
      if (trend === 'up') return ' ↑';
      if (trend === 'down') return ' ↓';
      return '';
    };
    
    expect(getTrendIndicator('up')).toBe(' ↑');
    expect(getTrendIndicator('down')).toBe(' ↓');
    expect(getTrendIndicator('stable')).toBe('');
  });

  it('should assign correct colors to trend types', () => {
    const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
      if (trend === 'up') return '#4CAF50';
      if (trend === 'down') return '#f44336';
      return '#2196F3';
    };
    
    expect(getTrendColor('up')).toBe('#4CAF50');
    expect(getTrendColor('down')).toBe('#f44336');
    expect(getTrendColor('stable')).toBe('#2196F3');
  });

  it('should assign correct colors to funnel stages', () => {
    const getFunnelColor = (index: number): string => {
      if (index === 0) return '#2196F3';
      if (index === 1) return '#4CAF50';
      return '#FF9800';
    };
    
    expect(getFunnelColor(0)).toBe('#2196F3');
    expect(getFunnelColor(1)).toBe('#4CAF50');
    expect(getFunnelColor(2)).toBe('#FF9800');
  });
});
