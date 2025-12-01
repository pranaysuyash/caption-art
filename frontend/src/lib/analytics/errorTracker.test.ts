/**
 * Error Tracker Tests
 * 
 * Tests for error tracking functionality and context completeness
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  trackError,
  getErrorContext,
  generateErrorGroupKey,
  isCriticalError,
  setupGlobalErrorHandlers,
} from './errorTracker';
import { getAnalyticsManager } from './analyticsManager';

// Mock the analytics manager
vi.mock('./analyticsManager', () => {
  const mockTrack = vi.fn();
  return {
    getAnalyticsManager: vi.fn(() => ({
      track: mockTrack,
    })),
  };
});

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn();
Object.defineProperty(navigator, 'sendBeacon', {
  writable: true,
  value: mockSendBeacon,
});

describe('errorTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getErrorContext', () => {
    it('should return context with all required fields', () => {
      const context = getErrorContext();
      
      expect(context).toHaveProperty('browser');
      expect(context.browser).toHaveProperty('name');
      expect(context.browser).toHaveProperty('version');
      expect(context.browser).toHaveProperty('userAgent');
      
      expect(context).toHaveProperty('os');
      expect(context.os).toHaveProperty('name');
      expect(context.os).toHaveProperty('version');
      
      expect(context).toHaveProperty('appVersion');
      expect(context).toHaveProperty('url');
      expect(context).toHaveProperty('timestamp');
    });

    it('should include current URL', () => {
      const context = getErrorContext();
      expect(context.url).toBe(window.location.href);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const context = getErrorContext();
      const after = Date.now();
      
      expect(context.timestamp).toBeGreaterThanOrEqual(before);
      expect(context.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('generateErrorGroupKey', () => {
    it('should generate consistent keys for same error', () => {
      const message = 'Test error';
      const stack = 'at testFunction (test.js:10:5)';
      
      const key1 = generateErrorGroupKey(message, stack);
      const key2 = generateErrorGroupKey(message, stack);
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different errors', () => {
      const key1 = generateErrorGroupKey('Error A', 'at funcA (a.js:1:1)');
      const key2 = generateErrorGroupKey('Error B', 'at funcB (b.js:2:2)');
      
      expect(key1).not.toBe(key2);
    });

    it('should handle errors without stack traces', () => {
      const key = generateErrorGroupKey('Test error');
      expect(key).toMatch(/^error_\d+$/);
    });

    it('should group errors with same message and function', () => {
      const message = 'Network error';
      const stack1 = 'at fetchData (api.js:10:5)\nat caller (app.js:20:10)';
      const stack2 = 'at fetchData (api.js:15:8)\nat caller (app.js:25:12)';
      
      const key1 = generateErrorGroupKey(message, stack1);
      const key2 = generateErrorGroupKey(message, stack2);
      
      expect(key1).toBe(key2);
    });
  });

  describe('isCriticalError', () => {
    it('should identify network errors as critical', () => {
      const error = new Error('Network request failed');
      expect(isCriticalError(error)).toBe(true);
    });

    it('should identify API errors as critical', () => {
      const error = new Error('API endpoint returned 500');
      expect(isCriticalError(error)).toBe(true);
    });

    it('should identify fetch failures as critical', () => {
      const error = new Error('Fetch failed');
      expect(isCriticalError(error)).toBe(true);
    });

    it('should identify CORS errors as critical', () => {
      const error = new Error('CORS policy blocked request');
      expect(isCriticalError(error)).toBe(true);
    });

    it('should identify unauthorized errors as critical', () => {
      const error = new Error('Unauthorized access');
      expect(isCriticalError(error)).toBe(true);
    });

    it('should identify security errors as critical', () => {
      const error = new Error('Security violation detected');
      expect(isCriticalError(error)).toBe(true);
    });

    it('should not identify minor errors as critical', () => {
      const error = new Error('Invalid input');
      expect(isCriticalError(error)).toBe(false);
    });

    it('should not identify validation errors as critical', () => {
      const error = new Error('Validation failed');
      expect(isCriticalError(error)).toBe(false);
    });
  });

  describe('trackError', () => {
    it('should track error with context', () => {
      const manager = getAnalyticsManager();
      const error = new Error('Test error');
      
      trackError(error);
      
      expect(manager.track).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          message: 'Test error',
          context: expect.objectContaining({
            browser: expect.any(Object),
            os: expect.any(Object),
            appVersion: expect.any(String),
            url: expect.any(String),
            timestamp: expect.any(Number),
          }),
          groupKey: expect.stringMatching(/^error_\d+$/),
          isCritical: expect.any(Boolean),
        })
      );
    });

    it('should sanitize sensitive data from error messages', () => {
      const manager = getAnalyticsManager();
      const error = new Error('Failed with api_key=secret123');
      
      trackError(error);
      
      const call = (manager.track as any).mock.calls[0];
      expect(call[1].message).toContain('[APIKEY_REDACTED]');
      expect(call[1].message).not.toContain('secret123');
    });

    it('should sanitize tokens from error messages', () => {
      const manager = getAnalyticsManager();
      const error = new Error('Auth failed: token=abc.def.ghi');
      
      trackError(error);
      
      const call = (manager.track as any).mock.calls[0];
      expect(call[1].message).toContain('[TOKEN_REDACTED]');
      expect(call[1].message).not.toContain('abc.def.ghi');
    });

    it('should include additional context if provided', () => {
      const manager = getAnalyticsManager();
      const error = new Error('Test error');
      const additionalContext = { userId: 123, action: 'upload' };
      
      trackError(error, additionalContext);
      
      expect(manager.track).toHaveBeenCalledWith(
        'error',
        expect.objectContaining(additionalContext)
      );
    });

    it('should send alert for critical errors', () => {
      const error = new Error('Network failure');
      
      trackError(error);
      
      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/critical-error',
        expect.any(Blob)
      );
    });

    it('should not send alert for non-critical errors', () => {
      const error = new Error('Minor issue');
      
      trackError(error);
      
      expect(mockSendBeacon).not.toHaveBeenCalled();
    });
  });

  describe('setupGlobalErrorHandlers', () => {
    it('should set up error event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      setupGlobalErrorHandlers();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
  });

  /**
   * Feature: analytics-usage-tracking, Property 5: Error context completeness
   * 
   * For any captured error, the context should include browser, OS, and app version
   * 
   * Validates: Requirements 3.2
   */
  describe('Property 5: Error context completeness', () => {
    it('should always include complete context for any error', () => {
      fc.assert(
        fc.property(
          // Generate random error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          // Generate random stack traces (optional)
          fc.option(
            fc.array(
              fc.string({ minLength: 10, maxLength: 100 }),
              { minLength: 1, maxLength: 10 }
            ).map(lines => lines.join('\n'))
          ),
          (errorMessage, stackTrace) => {
            const manager = getAnalyticsManager();
            (manager.track as any).mockClear();
            
            // Create error with random message
            const error = new Error(errorMessage);
            if (stackTrace) {
              error.stack = stackTrace;
            }
            
            // Track the error
            trackError(error);
            
            // Verify track was called
            expect(manager.track).toHaveBeenCalled();
            
            // Get the tracked error data
            const call = (manager.track as any).mock.calls[0];
            const trackedData = call[1];
            
            // Verify context completeness
            const hasContext = trackedData.context !== undefined;
            const hasBrowser = trackedData.context?.browser !== undefined;
            const hasBrowserName = typeof trackedData.context?.browser?.name === 'string';
            const hasBrowserVersion = typeof trackedData.context?.browser?.version === 'string';
            const hasBrowserUA = typeof trackedData.context?.browser?.userAgent === 'string';
            
            const hasOS = trackedData.context?.os !== undefined;
            const hasOSName = typeof trackedData.context?.os?.name === 'string';
            const hasOSVersion = typeof trackedData.context?.os?.version === 'string';
            
            const hasAppVersion = typeof trackedData.context?.appVersion === 'string';
            const hasURL = typeof trackedData.context?.url === 'string';
            const hasTimestamp = typeof trackedData.context?.timestamp === 'number';
            
            // All context fields must be present
            return (
              hasContext &&
              hasBrowser &&
              hasBrowserName &&
              hasBrowserVersion &&
              hasBrowserUA &&
              hasOS &&
              hasOSName &&
              hasOSVersion &&
              hasAppVersion &&
              hasURL &&
              hasTimestamp
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include non-empty browser information for any error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (errorMessage) => {
            const manager = getAnalyticsManager();
            (manager.track as any).mockClear();
            
            const error = new Error(errorMessage);
            trackError(error);
            
            const call = (manager.track as any).mock.calls[0];
            const context = call[1].context;
            
            // Browser info should be non-empty strings
            return (
              context.browser.name.length > 0 &&
              context.browser.version.length > 0 &&
              context.browser.userAgent.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include non-empty OS information for any error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (errorMessage) => {
            const manager = getAnalyticsManager();
            (manager.track as any).mockClear();
            
            const error = new Error(errorMessage);
            trackError(error);
            
            const call = (manager.track as any).mock.calls[0];
            const context = call[1].context;
            
            // OS info should be non-empty strings
            return (
              context.os.name.length > 0 &&
              context.os.version.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include valid app version for any error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (errorMessage) => {
            const manager = getAnalyticsManager();
            (manager.track as any).mockClear();
            
            const error = new Error(errorMessage);
            trackError(error);
            
            const call = (manager.track as any).mock.calls[0];
            const context = call[1].context;
            
            // App version should be a non-empty string
            return (
              typeof context.appVersion === 'string' &&
              context.appVersion.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include valid timestamp for any error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (errorMessage) => {
            const manager = getAnalyticsManager();
            (manager.track as any).mockClear();
            
            const before = Date.now();
            const error = new Error(errorMessage);
            trackError(error);
            const after = Date.now();
            
            const call = (manager.track as any).mock.calls[0];
            const context = call[1].context;
            
            // Timestamp should be within reasonable range
            return (
              typeof context.timestamp === 'number' &&
              context.timestamp >= before &&
              context.timestamp <= after
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include valid URL for any error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (errorMessage) => {
            const manager = getAnalyticsManager();
            (manager.track as any).mockClear();
            
            const error = new Error(errorMessage);
            trackError(error);
            
            const call = (manager.track as any).mock.calls[0];
            const context = call[1].context;
            
            // URL should match current location
            return (
              typeof context.url === 'string' &&
              context.url === window.location.href
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
