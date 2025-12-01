/**
 * Event Tracker Tests
 * 
 * Tests for event tracking functionality and PII exclusion
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  trackImageUpload,
  trackCaptionGenerate,
  trackExport,
  trackStyleApply,
  sanitizeProperties,
} from './eventTracker';
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

describe('eventTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackImageUpload', () => {
    it('should track image upload event', () => {
      const manager = getAnalyticsManager();
      trackImageUpload({ size: 1024 });
      expect(manager.track).toHaveBeenCalledWith('image_upload', { size: 1024 });
    });

    it('should sanitize properties', () => {
      const manager = getAnalyticsManager();
      trackImageUpload({ email: 'test@example.com', size: 1024 });
      expect(manager.track).toHaveBeenCalledWith('image_upload', { size: 1024 });
    });
  });

  describe('trackCaptionGenerate', () => {
    it('should track caption generation event', () => {
      const manager = getAnalyticsManager();
      trackCaptionGenerate({ style: 'funny' });
      expect(manager.track).toHaveBeenCalledWith('caption_generate', { style: 'funny' });
    });
  });

  describe('trackExport', () => {
    it('should track export event with format', () => {
      const manager = getAnalyticsManager();
      trackExport('png', { quality: 0.9 });
      expect(manager.track).toHaveBeenCalledWith('export', { quality: 0.9, format: 'png' });
    });
  });

  describe('trackStyleApply', () => {
    it('should track style apply event with preset name', () => {
      const manager = getAnalyticsManager();
      trackStyleApply('vintage', { intensity: 0.8 });
      expect(manager.track).toHaveBeenCalledWith('style_apply', { intensity: 0.8, presetName: 'vintage' });
    });
  });

  describe('sanitizeProperties', () => {
    it('should remove email keys', () => {
      const result = sanitizeProperties({ email: 'test@example.com', count: 5 });
      expect(result).toEqual({ count: 5 });
      expect(result).not.toHaveProperty('email');
    });

    it('should remove name keys', () => {
      const result = sanitizeProperties({ userName: 'John Doe', count: 5 });
      expect(result).toEqual({ count: 5 });
      expect(result).not.toHaveProperty('userName');
    });

    it('should remove phone keys', () => {
      const result = sanitizeProperties({ phoneNumber: '555-1234', count: 5 });
      expect(result).toEqual({ count: 5 });
      expect(result).not.toHaveProperty('phoneNumber');
    });

    it('should sanitize email addresses in string values', () => {
      const result = sanitizeProperties({ message: 'Contact me at test@example.com' });
      expect(result.message).toBe('Contact me at [EMAIL_REDACTED]');
    });

    it('should sanitize phone numbers in string values', () => {
      const result = sanitizeProperties({ message: 'Call me at 555-123-4567' });
      expect(result.message).toBe('Call me at [PHONE_REDACTED]');
    });

    it('should sanitize SSNs in string values', () => {
      const result = sanitizeProperties({ message: 'SSN: 123-45-6789' });
      expect(result.message).toBe('SSN: [SSN_REDACTED]');
    });

    it('should sanitize credit card numbers in string values', () => {
      const result = sanitizeProperties({ message: 'Card: 1234-5678-9012-3456' });
      expect(result.message).toBe('Card: [CC_REDACTED]');
    });

    it('should handle nested objects', () => {
      const result = sanitizeProperties({
        user: { email: 'test@example.com', id: 123 },
        count: 5,
      });
      expect(result).toEqual({ user: { id: 123 }, count: 5 });
    });

    it('should handle arrays', () => {
      const result = sanitizeProperties({
        messages: ['Hello', 'Email: test@example.com'],
        count: 2,
      });
      expect(result.messages).toEqual(['Hello', 'Email: [EMAIL_REDACTED]']);
    });
  });

  /**
   * Feature: analytics-usage-tracking, Property 1: PII exclusion
   * 
   * For any tracked event, the event data should not contain email addresses,
   * names, or other PII
   * 
   * Validates: Requirements 1.5
   */
  describe('Property 1: PII exclusion', () => {
    it('should never contain email addresses in sanitized properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Generate random properties that might contain emails
            field1: fc.oneof(
              fc.string(),
              fc.emailAddress(),
              fc.constant('test@example.com'),
            ),
            field2: fc.oneof(
              fc.integer(),
              fc.string(),
            ),
            field3: fc.oneof(
              fc.string(),
              fc.constant('Contact: user@domain.org for info'),
            ),
          }),
          (properties) => {
            const sanitized = sanitizeProperties(properties);
            const jsonString = JSON.stringify(sanitized);
            
            // Check that no email pattern exists in the sanitized output
            const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            return !emailPattern.test(jsonString);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never contain phone numbers in sanitized properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            message: fc.oneof(
              fc.string(),
              fc.constant('Call 555-123-4567'),
              fc.constant('Phone: (555) 123-4567'),
              fc.constant('+1-555-123-4567'),
            ),
            data: fc.string(),
          }),
          (properties) => {
            const sanitized = sanitizeProperties(properties);
            const jsonString = JSON.stringify(sanitized);
            
            // Check that no phone pattern exists in the sanitized output
            const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
            return !phonePattern.test(jsonString);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never contain SSNs in sanitized properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            info: fc.oneof(
              fc.string(),
              fc.constant('SSN: 123-45-6789'),
              fc.constant('Social Security: 987-65-4321'),
            ),
            other: fc.integer(),
          }),
          (properties) => {
            const sanitized = sanitizeProperties(properties);
            const jsonString = JSON.stringify(sanitized);
            
            // Check that no SSN pattern exists in the sanitized output
            const ssnPattern = /\d{3}-\d{2}-\d{4}/;
            return !ssnPattern.test(jsonString);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never contain credit card numbers in sanitized properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            payment: fc.oneof(
              fc.string(),
              fc.constant('Card: 1234-5678-9012-3456'),
              fc.constant('CC: 1234 5678 9012 3456'),
            ),
            amount: fc.integer(),
          }),
          (properties) => {
            const sanitized = sanitizeProperties(properties);
            const jsonString = JSON.stringify(sanitized);
            
            // Check that no credit card pattern exists in the sanitized output
            const ccPattern = /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/;
            return !ccPattern.test(jsonString);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exclude keys containing PII-related terms', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.string(),
            userName: fc.string(),
            phoneNumber: fc.string(),
            address: fc.string(),
            password: fc.string(),
            token: fc.string(),
            safeData: fc.integer(),
          }),
          (properties) => {
            const sanitized = sanitizeProperties(properties);
            
            // Verify PII keys are removed
            return (
              !('email' in sanitized) &&
              !('userName' in sanitized) &&
              !('phoneNumber' in sanitized) &&
              !('address' in sanitized) &&
              !('password' in sanitized) &&
              !('token' in sanitized) &&
              'safeData' in sanitized
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
