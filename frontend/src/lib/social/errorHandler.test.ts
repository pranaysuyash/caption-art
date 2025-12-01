/**
 * Unit tests for Error Handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ErrorHandler,
  AuthenticationError,
  ImageSizeError,
  RateLimitError,
  NetworkError,
  UnknownSocialMediaError,
  SocialMediaErrorType,
} from './errorHandler';
import type { ShareablePlatform } from './types';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  const platform: ShareablePlatform = 'instagram';

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with correct properties', () => {
      const error = new AuthenticationError(platform);

      expect(error.type).toBe(SocialMediaErrorType.AUTHENTICATION);
      expect(error.platform).toBe(platform);
      expect(error.message).toContain('Authentication failed');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should handle authentication error correctly', () => {
      const error = new AuthenticationError(platform);
      const result = errorHandler.handleError(error, platform);

      expect(result.type).toBe(SocialMediaErrorType.AUTHENTICATION);
      expect(result.platform).toBe(platform);
      expect(result.canRetry).toBe(false);
      expect(result.actions).toHaveLength(2);
      expect(result.actions[0].label).toBe('Reconnect Account');
      expect(result.actions[0].isPrimary).toBe(true);
    });
  });

  describe('ImageSizeError', () => {
    it('should create image size error with correct properties', () => {
      const currentSize = 10 * 1024 * 1024; // 10MB
      const maxSize = 8 * 1024 * 1024; // 8MB
      const error = new ImageSizeError(platform, currentSize, maxSize);

      expect(error.type).toBe(SocialMediaErrorType.IMAGE_SIZE);
      expect(error.platform).toBe(platform);
      expect(error.currentSize).toBe(currentSize);
      expect(error.maxSize).toBe(maxSize);
      expect(error.message).toContain('10.00MB');
      expect(error.message).toContain('8MB');
    });

    it('should handle image size error correctly', () => {
      const currentSize = 10 * 1024 * 1024;
      const maxSize = 8 * 1024 * 1024;
      const error = new ImageSizeError(platform, currentSize, maxSize);
      const result = errorHandler.handleError(error, platform);

      expect(result.type).toBe(SocialMediaErrorType.IMAGE_SIZE);
      expect(result.canRetry).toBe(false);
      expect(result.actions).toHaveLength(2);
      expect(result.actions[0].label).toBe('Resize Image');
      expect(result.userMessage).toContain('too large');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with correct properties', () => {
      const retryAfter = 300; // 5 minutes
      const error = new RateLimitError(platform, retryAfter);

      expect(error.type).toBe(SocialMediaErrorType.RATE_LIMIT);
      expect(error.platform).toBe(platform);
      expect(error.retryAfter).toBe(retryAfter);
      expect(error.message).toContain('5 minutes');
    });

    it('should handle rate limit error without retry callback', () => {
      const error = new RateLimitError(platform, 300);
      const result = errorHandler.handleError(error, platform);

      expect(result.type).toBe(SocialMediaErrorType.RATE_LIMIT);
      expect(result.canRetry).toBe(true);
      expect(result.retryDelay).toBe(300000); // 300 seconds in ms
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].label).toBe('Cancel');
    });

    it('should handle rate limit error with retry callback', () => {
      const retryCallback = vi.fn();
      const error = new RateLimitError(platform, 60);
      const result = errorHandler.handleError(error, platform, retryCallback);

      expect(result.actions).toHaveLength(2);
      expect(result.actions[0].label).toContain('Retry');
      expect(result.actions[0].isPrimary).toBe(true);
    });

    it('should format retry time correctly for different durations', () => {
      const error1 = new RateLimitError(platform, 60); // 1 minute
      expect(error1.message).toContain('1 minute');

      const error2 = new RateLimitError(platform, 300); // 5 minutes
      expect(error2.message).toContain('5 minutes');
    });
  });

  describe('NetworkError', () => {
    it('should create network error with correct properties', () => {
      const originalError = new Error('Connection timeout');
      const error = new NetworkError(platform, originalError);

      expect(error.type).toBe(SocialMediaErrorType.NETWORK);
      expect(error.platform).toBe(platform);
      expect(error.originalError).toBe(originalError);
      expect(error.message).toContain('Network error');
    });

    it('should handle network error with retry callback', () => {
      const retryCallback = vi.fn();
      const error = new NetworkError(platform);
      const result = errorHandler.handleError(error, platform, retryCallback);

      expect(result.type).toBe(SocialMediaErrorType.NETWORK);
      expect(result.canRetry).toBe(true);
      expect(result.retryDelay).toBe(0);
      expect(result.actions).toHaveLength(2);
      expect(result.actions[0].label).toBe('Retry Now');
      expect(result.actions[0].isPrimary).toBe(true);
    });
  });

  describe('UnknownSocialMediaError', () => {
    it('should create unknown error with correct properties', () => {
      const message = 'Something went wrong';
      const error = new UnknownSocialMediaError(platform, message);

      expect(error.type).toBe(SocialMediaErrorType.UNKNOWN);
      expect(error.platform).toBe(platform);
      expect(error.message).toBe(message);
    });

    it('should handle unknown error correctly', () => {
      const error = new UnknownSocialMediaError(platform, 'Unexpected error');
      const result = errorHandler.handleError(error, platform);

      expect(result.type).toBe(SocialMediaErrorType.UNKNOWN);
      expect(result.canRetry).toBe(false);
      expect(result.supportContact).toBeDefined();
      expect(result.actions).toHaveLength(2);
      expect(result.actions[0].label).toBe('Contact Support');
    });
  });

  describe('Error parsing', () => {
    it('should parse authentication errors from generic errors', () => {
      const error = new Error('Unauthorized access - 401');
      const result = errorHandler.handleError(error, platform);

      expect(result.type).toBe(SocialMediaErrorType.AUTHENTICATION);
    });

    it('should parse image size errors from generic errors', () => {
      const error = new Error('Image size exceeds limit');
      const result = errorHandler.handleError(error, platform);

      expect(result.type).toBe(SocialMediaErrorType.IMAGE_SIZE);
    });

    it('should parse rate limit errors from generic errors', () => {
      const error = new Error('Rate limit exceeded - 429');
      const result = errorHandler.handleError(error, platform);

      expect(result.type).toBe(SocialMediaErrorType.RATE_LIMIT);
    });

    it('should parse network errors from generic errors', () => {
      const error = new Error('Network connection failed');
      const result = errorHandler.handleError(error, platform);

      expect(result.type).toBe(SocialMediaErrorType.NETWORK);
    });

    it('should treat unrecognized errors as unknown', () => {
      const error = new Error('Some random error');
      const result = errorHandler.handleError(error, platform);

      expect(result.type).toBe(SocialMediaErrorType.UNKNOWN);
    });
  });

  describe('fromApiResponse', () => {
    it('should create authentication error for 401 status', () => {
      const response = { status: 401, statusText: 'Unauthorized' };
      const error = ErrorHandler.fromApiResponse(response, platform);

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.platform).toBe(platform);
    });

    it('should create authentication error for 403 status', () => {
      const response = { status: 403, statusText: 'Forbidden' };
      const error = ErrorHandler.fromApiResponse(response, platform);

      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('should create rate limit error for 429 status', () => {
      const response = {
        status: 429,
        statusText: 'Too Many Requests',
        data: { retryAfter: 600 },
      };
      const error = ErrorHandler.fromApiResponse(response, platform);

      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfter).toBe(600);
    });

    it('should create image size error for 413 status', () => {
      const response = {
        status: 413,
        statusText: 'Payload Too Large',
        data: { currentSize: 10485760, maxSize: 8388608 },
      };
      const error = ErrorHandler.fromApiResponse(response, platform);

      expect(error).toBeInstanceOf(ImageSizeError);
    });

    it('should create network error for 500+ status', () => {
      const response = { status: 500, statusText: 'Internal Server Error' };
      const error = ErrorHandler.fromApiResponse(response, platform);

      expect(error).toBeInstanceOf(NetworkError);
    });

    it('should create unknown error for other statuses', () => {
      const response = { status: 400, statusText: 'Bad Request' };
      const error = ErrorHandler.fromApiResponse(response, platform);

      expect(error).toBeInstanceOf(UnknownSocialMediaError);
    });
  });

  describe('formatErrorForLogging', () => {
    it('should format social media error correctly', () => {
      const error = new AuthenticationError(platform);
      const formatted = ErrorHandler.formatErrorForLogging(error);

      expect(formatted.type).toBe(SocialMediaErrorType.AUTHENTICATION);
      expect(formatted.platform).toBe(platform);
      expect(formatted.message).toBeDefined();
      expect(formatted.name).toBe('AuthenticationError');
    });

    it('should format generic error correctly', () => {
      const error = new Error('Generic error');
      const formatted = ErrorHandler.formatErrorForLogging(error);

      expect(formatted.type).toBe('unknown');
      expect(formatted.message).toBe('Generic error');
      expect(formatted.name).toBe('Error');
    });

    it('should include original error in formatted output', () => {
      const originalError = new Error('Original error');
      const error = new NetworkError(platform, originalError);
      const formatted = ErrorHandler.formatErrorForLogging(error);

      expect(formatted.originalError).toBeDefined();
      expect(formatted.originalError.message).toBe('Original error');
    });
  });
});
