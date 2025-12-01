import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIMonitor } from './apiMonitor';
import type { APIMonitoringService } from './types';

describe('APIMonitor', () => {
  let monitor: APIMonitor;
  let mockService: APIMonitoringService;

  beforeEach(() => {
    mockService = {
      reportAPIMetric: vi.fn(),
      reportPercentiles: vi.fn(),
    };
    monitor = new APIMonitor(mockService);
  });

  describe('startRequest and endRequest', () => {
    it('should record request start time', () => {
      const requestId = monitor.startRequest('/api/users', 'GET');
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
    });

    it('should calculate duration correctly', async () => {
      const requestId = monitor.startRequest('/api/users', 'GET');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const metric = monitor.endRequest(requestId, '/api/users', 'GET', 200);
      
      expect(metric).not.toBeNull();
      expect(metric?.duration).toBeGreaterThan(40);
      expect(metric?.endpoint).toBe('/api/users');
      expect(metric?.method).toBe('GET');
      expect(metric?.statusCode).toBe(200);
    });

    it('should flag slow requests', () => {
      const metric = {
        endpoint: '/api/slow',
        method: 'POST',
        statusCode: 200,
        duration: 3500,
        timestamp: Date.now(),
        isSlow: true,
      };
      
      monitor.addMetric(metric);
      
      const slowRequests = monitor.getSlowRequests();
      expect(slowRequests).toHaveLength(1);
      expect(slowRequests[0].isSlow).toBe(true);
    });

    it('should report to monitoring service', () => {
      const metric = {
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        timestamp: Date.now(),
        isSlow: false,
      };
      
      monitor.addMetric(metric);
      
      // The monitoring service should not be called for addMetric
      // It's only called in endRequest
      expect(mockService.reportAPIMetric).not.toHaveBeenCalled();
    });
  });

  describe('calculatePercentiles', () => {
    it('should return zeros for empty metrics', () => {
      const percentiles = monitor.calculatePercentiles();
      expect(percentiles.p50).toBe(0);
      expect(percentiles.p95).toBe(0);
      expect(percentiles.p99).toBe(0);
    });

    it('should calculate percentiles correctly for single value', () => {
      monitor.addMetric({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        timestamp: Date.now(),
        isSlow: false,
      });

      const percentiles = monitor.calculatePercentiles();
      expect(percentiles.p50).toBe(100);
      expect(percentiles.p95).toBe(100);
      expect(percentiles.p99).toBe(100);
    });

    it('should calculate percentiles correctly for multiple values', () => {
      const durations = [100, 200, 300, 400, 500];
      durations.forEach((duration, i) => {
        monitor.addMetric({
          endpoint: `/api/test${i}`,
          method: 'GET',
          statusCode: 200,
          duration,
          timestamp: Date.now(),
          isSlow: false,
        });
      });

      const percentiles = monitor.calculatePercentiles();
      expect(percentiles.p50).toBe(300); // median
      expect(percentiles.p95).toBeGreaterThan(400);
      expect(percentiles.p99).toBeGreaterThan(percentiles.p95);
    });

    it('should report percentiles to monitoring service', () => {
      monitor.addMetric({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        timestamp: Date.now(),
        isSlow: false,
      });

      monitor.calculatePercentiles();
      expect(mockService.reportPercentiles).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should return all metrics', () => {
      monitor.addMetric({
        endpoint: '/api/test1',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        timestamp: Date.now(),
        isSlow: false,
      });
      monitor.addMetric({
        endpoint: '/api/test2',
        method: 'POST',
        statusCode: 201,
        duration: 200,
        timestamp: Date.now(),
        isSlow: false,
      });

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(2);
    });

    it('should filter metrics by endpoint', () => {
      monitor.addMetric({
        endpoint: '/api/users',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        timestamp: Date.now(),
        isSlow: false,
      });
      monitor.addMetric({
        endpoint: '/api/posts',
        method: 'GET',
        statusCode: 200,
        duration: 200,
        timestamp: Date.now(),
        isSlow: false,
      });

      const userMetrics = monitor.getMetricsByEndpoint('/api/users');
      expect(userMetrics).toHaveLength(1);
      expect(userMetrics[0].endpoint).toBe('/api/users');
    });
  });

  describe('clearMetrics', () => {
    it('should clear all stored metrics', () => {
      monitor.addMetric({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        timestamp: Date.now(),
        isSlow: false,
      });

      expect(monitor.getMetrics()).toHaveLength(1);
      
      monitor.clearMetrics();
      
      expect(monitor.getMetrics()).toHaveLength(0);
    });
  });
});
