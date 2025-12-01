import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceMonitor } from './resourceMonitor';
import type { ResourceMonitoringService, ResourceLoadMetric } from './types';

describe('ResourceMonitor', () => {
  let monitor: ResourceMonitor;
  let mockService: ResourceMonitoringService;

  beforeEach(() => {
    mockService = {
      reportResourceMetric: vi.fn(),
    };
    monitor = new ResourceMonitor(mockService);
  });

  describe('getSlowResources', () => {
    it('should return resources exceeding threshold', () => {
      const slowMetric: ResourceLoadMetric = {
        url: 'https://example.com/slow-image.jpg',
        type: 'image',
        duration: 3500,
        size: 500000,
        cached: false,
        failed: false,
        isSlow: true,
        timestamp: Date.now(),
      };

      const fastMetric: ResourceLoadMetric = {
        url: 'https://example.com/fast-image.jpg',
        type: 'image',
        duration: 100,
        size: 50000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      };

      monitor.addMetric(slowMetric);
      monitor.addMetric(fastMetric);

      const slowResources = monitor.getSlowResources();
      expect(slowResources).toHaveLength(1);
      expect(slowResources[0].isSlow).toBe(true);
      expect(slowResources[0].url).toBe('https://example.com/slow-image.jpg');
    });

    it('should return empty array when no slow resources', () => {
      const fastMetric: ResourceLoadMetric = {
        url: 'https://example.com/fast.js',
        type: 'script',
        duration: 100,
        size: 10000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      };

      monitor.addMetric(fastMetric);

      const slowResources = monitor.getSlowResources();
      expect(slowResources).toHaveLength(0);
    });
  });

  describe('getFailedResources', () => {
    it('should return failed resource loads', () => {
      const failedMetric: ResourceLoadMetric = {
        url: 'https://example.com/missing.jpg',
        type: 'image',
        duration: 1000,
        size: 0,
        cached: false,
        failed: true,
        isSlow: false,
        timestamp: Date.now(),
      };

      const successMetric: ResourceLoadMetric = {
        url: 'https://example.com/success.jpg',
        type: 'image',
        duration: 100,
        size: 50000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      };

      monitor.addMetric(failedMetric);
      monitor.addMetric(successMetric);

      const failedResources = monitor.getFailedResources();
      expect(failedResources).toHaveLength(1);
      expect(failedResources[0].failed).toBe(true);
      expect(failedResources[0].url).toBe('https://example.com/missing.jpg');
    });
  });

  describe('getTotalPageWeight', () => {
    it('should calculate sum of all resource sizes', () => {
      monitor.addMetric({
        url: 'https://example.com/image1.jpg',
        type: 'image',
        duration: 100,
        size: 100000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      monitor.addMetric({
        url: 'https://example.com/script.js',
        type: 'script',
        duration: 50,
        size: 50000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      monitor.addMetric({
        url: 'https://example.com/style.css',
        type: 'stylesheet',
        duration: 30,
        size: 25000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      const totalWeight = monitor.getTotalPageWeight();
      expect(totalWeight).toBe(175000);
    });

    it('should return 0 for no resources', () => {
      const totalWeight = monitor.getTotalPageWeight();
      expect(totalWeight).toBe(0);
    });
  });

  describe('getCacheHitRate', () => {
    it('should calculate cache hit rate correctly', () => {
      // Add 3 cached resources
      for (let i = 0; i < 3; i++) {
        monitor.addMetric({
          url: `https://example.com/cached${i}.jpg`,
          type: 'image',
          duration: 10,
          size: 50000,
          cached: true,
          failed: false,
          isSlow: false,
          timestamp: Date.now(),
        });
      }

      // Add 1 non-cached resource
      monitor.addMetric({
        url: 'https://example.com/fresh.jpg',
        type: 'image',
        duration: 100,
        size: 50000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      const cacheHitRate = monitor.getCacheHitRate();
      expect(cacheHitRate).toBe(75); // 3 out of 4 = 75%
    });

    it('should return 0 for no resources', () => {
      const cacheHitRate = monitor.getCacheHitRate();
      expect(cacheHitRate).toBe(0);
    });

    it('should return 100 when all resources are cached', () => {
      monitor.addMetric({
        url: 'https://example.com/cached.jpg',
        type: 'image',
        duration: 10,
        size: 50000,
        cached: true,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      const cacheHitRate = monitor.getCacheHitRate();
      expect(cacheHitRate).toBe(100);
    });
  });

  describe('getMetricsByType', () => {
    it('should filter metrics by resource type', () => {
      monitor.addMetric({
        url: 'https://example.com/image.jpg',
        type: 'image',
        duration: 100,
        size: 50000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      monitor.addMetric({
        url: 'https://example.com/script.js',
        type: 'script',
        duration: 50,
        size: 25000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      monitor.addMetric({
        url: 'https://example.com/style.css',
        type: 'stylesheet',
        duration: 30,
        size: 15000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      const imageMetrics = monitor.getMetricsByType('image');
      expect(imageMetrics).toHaveLength(1);
      expect(imageMetrics[0].type).toBe('image');

      const scriptMetrics = monitor.getMetricsByType('script');
      expect(scriptMetrics).toHaveLength(1);
      expect(scriptMetrics[0].type).toBe('script');
    });
  });

  describe('getResourceStats', () => {
    it('should return comprehensive statistics', () => {
      monitor.addMetric({
        url: 'https://example.com/image1.jpg',
        type: 'image',
        duration: 100,
        size: 100000,
        cached: true,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      monitor.addMetric({
        url: 'https://example.com/image2.jpg',
        type: 'image',
        duration: 3500,
        size: 200000,
        cached: false,
        failed: false,
        isSlow: true,
        timestamp: Date.now(),
      });

      monitor.addMetric({
        url: 'https://example.com/script.js',
        type: 'script',
        duration: 50,
        size: 50000,
        cached: false,
        failed: true,
        isSlow: false,
        timestamp: Date.now(),
      });

      const stats = monitor.getResourceStats();

      expect(stats.totalResources).toBe(3);
      expect(stats.totalPageWeight).toBe(350000);
      expect(stats.cacheHitRate).toBeCloseTo(33.33, 1);
      expect(stats.slowResources).toBe(1);
      expect(stats.failedResources).toBe(1);
      expect(stats.byType.image.count).toBe(2);
      expect(stats.byType.script.count).toBe(1);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all stored metrics', () => {
      monitor.addMetric({
        url: 'https://example.com/test.jpg',
        type: 'image',
        duration: 100,
        size: 50000,
        cached: false,
        failed: false,
        isSlow: false,
        timestamp: Date.now(),
      });

      expect(monitor.getMetrics()).toHaveLength(1);

      monitor.clearMetrics();

      expect(monitor.getMetrics()).toHaveLength(0);
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring without errors', () => {
      expect(() => monitor.stopMonitoring()).not.toThrow();
    });
  });
});
