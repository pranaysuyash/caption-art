import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorRateTracker } from './errorRateTracker';
import type { ErrorRateMonitoringService } from './types';

describe('ErrorRateTracker', () => {
  let tracker: ErrorRateTracker;
  let mockService: ErrorRateMonitoringService;

  beforeEach(() => {
    mockService = {
      reportError: vi.fn(),
      reportErrorRate: vi.fn(),
      triggerErrorAlert: vi.fn(),
    };
    tracker = new ErrorRateTracker(mockService);
  });

  describe('recordRequest', () => {
    it('should increment total request count', () => {
      tracker.recordRequest();
      tracker.recordRequest();
      tracker.recordRequest();

      expect(tracker.getTotalRequests()).toBe(3);
    });
  });

  describe('recordAPIError', () => {
    it('should record API error with correct details', () => {
      tracker.recordAPIError('/api/users', 500, 'Internal Server Error');

      const errors = tracker.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: 'api',
        message: 'Internal Server Error',
        endpoint: '/api/users',
        statusCode: 500,
      });
    });

    it('should increment total request count', () => {
      tracker.recordAPIError('/api/users', 500, 'Error');
      expect(tracker.getTotalRequests()).toBe(1);
    });

    it('should report error to monitoring service', () => {
      tracker.recordAPIError('/api/users', 500, 'Error');
      expect(mockService.reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api',
          message: 'Error',
          endpoint: '/api/users',
          statusCode: 500,
        })
      );
    });
  });

  describe('recordNetworkError', () => {
    it('should record network error with correct details', () => {
      tracker.recordNetworkError('/api/data', 'Network timeout');

      const errors = tracker.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: 'network',
        message: 'Network timeout',
        endpoint: '/api/data',
      });
    });

    it('should increment total request count', () => {
      tracker.recordNetworkError('/api/data', 'Error');
      expect(tracker.getTotalRequests()).toBe(1);
    });
  });

  describe('recordClientError', () => {
    it('should record client error with correct details', () => {
      tracker.recordClientError('Undefined variable');

      const errors = tracker.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: 'client',
        message: 'Undefined variable',
      });
    });

    it('should not increment total request count', () => {
      tracker.recordClientError('Error');
      expect(tracker.getTotalRequests()).toBe(0);
    });
  });

  describe('calculateErrorRate', () => {
    it('should calculate correct error rate', () => {
      // 7 successful requests
      for (let i = 0; i < 7; i++) {
        tracker.recordRequest();
      }

      // 3 errors (API + network)
      tracker.recordAPIError('/api/test', 500, 'Error 1');
      tracker.recordNetworkError('/api/test', 'Error 2');
      tracker.recordAPIError('/api/test', 404, 'Error 3');

      const stats = tracker.calculateErrorRate();

      // Total requests = 7 + 3 = 10
      // Total errors = 3
      // Error rate = (3 / 10) * 100 = 30%
      expect(stats.totalRequests).toBe(10);
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorRate).toBe(30);
    });

    it('should return 0% error rate when no requests', () => {
      const stats = tracker.calculateErrorRate();
      expect(stats.errorRate).toBe(0);
    });

    it('should categorize errors by type', () => {
      tracker.recordAPIError('/api/test', 500, 'API Error');
      tracker.recordNetworkError('/api/test', 'Network Error');
      tracker.recordClientError('Client Error');

      const stats = tracker.calculateErrorRate();

      expect(stats.errorsByType.api).toBe(1);
      expect(stats.errorsByType.network).toBe(1);
      expect(stats.errorsByType.client).toBe(1);
    });

    it('should report error rate to monitoring service', () => {
      tracker.recordRequest();
      tracker.recordAPIError('/api/test', 500, 'Error');

      tracker.calculateErrorRate();

      expect(mockService.reportErrorRate).toHaveBeenCalledWith(
        expect.objectContaining({
          totalRequests: 2,
          totalErrors: 1,
          errorRate: 50,
        })
      );
    });
  });

  describe('spike detection', () => {
    it('should trigger alert when error rate exceeds threshold', () => {
      const trackerWithThreshold = new ErrorRateTracker(mockService, 20);

      // Create 30% error rate (3 errors out of 10 requests)
      for (let i = 0; i < 7; i++) {
        trackerWithThreshold.recordRequest();
      }
      for (let i = 0; i < 3; i++) {
        trackerWithThreshold.recordAPIError('/api/test', 500, 'Error');
      }

      // Alert should have been triggered
      expect(mockService.triggerErrorAlert).toHaveBeenCalled();
    });

    it('should not trigger alert when error rate is below threshold', () => {
      const trackerWithThreshold = new ErrorRateTracker(mockService, 50);

      // Create 30% error rate
      for (let i = 0; i < 7; i++) {
        trackerWithThreshold.recordRequest();
      }
      for (let i = 0; i < 3; i++) {
        trackerWithThreshold.recordAPIError('/api/test', 500, 'Error');
      }

      // Alert should not be triggered
      expect(mockService.triggerErrorAlert).not.toHaveBeenCalled();
    });
  });

  describe('getErrorsByType', () => {
    it('should filter errors by type', () => {
      tracker.recordAPIError('/api/test', 500, 'API Error 1');
      tracker.recordNetworkError('/api/test', 'Network Error');
      tracker.recordAPIError('/api/test', 404, 'API Error 2');
      tracker.recordClientError('Client Error');

      const apiErrors = tracker.getErrorsByType('api');
      const networkErrors = tracker.getErrorsByType('network');
      const clientErrors = tracker.getErrorsByType('client');

      expect(apiErrors).toHaveLength(2);
      expect(networkErrors).toHaveLength(1);
      expect(clientErrors).toHaveLength(1);
    });
  });

  describe('getRecentErrors', () => {
    it('should return errors within time window', () => {
      // Record an error
      tracker.recordAPIError('/api/test', 500, 'Recent error');

      // Get errors from last 10 seconds (should include the error)
      const recentErrors = tracker.getRecentErrors(10000);
      expect(recentErrors).toHaveLength(1);
    });

    it('should exclude errors outside time window', async () => {
      // Record an error
      tracker.recordAPIError('/api/test', 500, 'Old error');

      // Wait a bit to ensure time has passed
      await new Promise(resolve => setTimeout(resolve, 10));

      // Get errors from last 1ms (should be empty since more time has passed)
      const recentErrors = tracker.getRecentErrors(1);
      expect(recentErrors).toHaveLength(0);
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors and reset counters', () => {
      tracker.recordRequest();
      tracker.recordAPIError('/api/test', 500, 'Error');
      tracker.recordClientError('Client Error');

      tracker.clearErrors();

      expect(tracker.getErrors()).toHaveLength(0);
      expect(tracker.getTotalRequests()).toBe(0);
    });
  });
});
