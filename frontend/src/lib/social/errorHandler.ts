/**
 * Error Handler for Social Media Integration
 * Handles posting errors including authentication, image size, rate limiting, network, and unknown errors
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import type { ShareablePlatform } from './types';

/**
 * Error types for social media posting
 */
export enum SocialMediaErrorType {
  AUTHENTICATION = 'authentication',
  IMAGE_SIZE = 'image_size',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

/**
 * Base error class for social media errors
 */
export class SocialMediaError extends Error {
  constructor(
    public type: SocialMediaErrorType,
    public platform: ShareablePlatform,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SocialMediaError';
  }
}

/**
 * Authentication error
 * Requirements: 8.1
 */
export class AuthenticationError extends SocialMediaError {
  constructor(platform: ShareablePlatform, message?: string) {
    super(
      SocialMediaErrorType.AUTHENTICATION,
      platform,
      message || `Authentication failed for ${platform}. Please reconnect your account.`
    );
    this.name = 'AuthenticationError';
  }
}

/**
 * Image size error
 * Requirements: 8.2
 */
export class ImageSizeError extends SocialMediaError {
  constructor(
    platform: ShareablePlatform,
    public currentSize: number,
    public maxSize: number
  ) {
    const currentMB = (currentSize / 1024 / 1024).toFixed(2);
    const maxMB = (maxSize / 1024 / 1024).toFixed(0);
    super(
      SocialMediaErrorType.IMAGE_SIZE,
      platform,
      `Image size (${currentMB}MB) exceeds ${platform} limit of ${maxMB}MB. Please resize your image.`
    );
    this.name = 'ImageSizeError';
  }
}

/**
 * Rate limit error
 * Requirements: 8.3
 */
export class RateLimitError extends SocialMediaError {
  constructor(
    platform: ShareablePlatform,
    public retryAfter: number // seconds
  ) {
    const minutes = Math.ceil(retryAfter / 60);
    super(
      SocialMediaErrorType.RATE_LIMIT,
      platform,
      `Rate limit exceeded for ${platform}. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Network error
 * Requirements: 8.4
 */
export class NetworkError extends SocialMediaError {
  constructor(platform: ShareablePlatform, originalError?: Error) {
    super(
      SocialMediaErrorType.NETWORK,
      platform,
      `Network error while posting to ${platform}. Please check your connection and try again.`,
      originalError
    );
    this.name = 'NetworkError';
  }
}

/**
 * Unknown error
 * Requirements: 8.5
 */
export class UnknownSocialMediaError extends SocialMediaError {
  constructor(platform: ShareablePlatform, message: string, originalError?: Error) {
    super(
      SocialMediaErrorType.UNKNOWN,
      platform,
      message || `An unexpected error occurred while posting to ${platform}.`,
      originalError
    );
    this.name = 'UnknownSocialMediaError';
  }
}

/**
 * Error action interface
 */
export interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  isPrimary?: boolean;
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult {
  type: SocialMediaErrorType;
  platform: ShareablePlatform;
  message: string;
  userMessage: string;
  actions: ErrorAction[];
  canRetry: boolean;
  retryDelay?: number; // milliseconds
  supportContact?: string;
}

/**
 * Error Handler class
 */
export class ErrorHandler {
  private supportEmail = 'support@example.com';
  private retryCallbacks: Map<string, () => Promise<void>> = new Map();

  /**
   * Handle posting error and return user-friendly result
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
   */
  handleError(
    error: Error | SocialMediaError,
    platform: ShareablePlatform,
    retryCallback?: () => Promise<void>
  ): ErrorHandlingResult {
    // Store retry callback if provided
    if (retryCallback) {
      const key = `${platform}_${Date.now()}`;
      this.retryCallbacks.set(key, retryCallback);
    }

    // Handle known error types
    if (error instanceof AuthenticationError) {
      return this.handleAuthenticationError(error);
    }

    if (error instanceof ImageSizeError) {
      return this.handleImageSizeError(error);
    }

    if (error instanceof RateLimitError) {
      return this.handleRateLimitError(error, retryCallback);
    }

    if (error instanceof NetworkError) {
      return this.handleNetworkError(error, retryCallback);
    }

    if (error instanceof UnknownSocialMediaError) {
      return this.handleUnknownError(error);
    }

    // Parse error to determine type
    return this.parseAndHandleError(error, platform, retryCallback);
  }

  /**
   * Handle authentication error
   * Requirements: 8.1
   */
  private handleAuthenticationError(error: AuthenticationError): ErrorHandlingResult {
    return {
      type: SocialMediaErrorType.AUTHENTICATION,
      platform: error.platform,
      message: error.message,
      userMessage: `Please reconnect your ${error.platform} account to continue posting.`,
      actions: [
        {
          label: 'Reconnect Account',
          action: () => this.promptReAuthentication(error.platform),
          isPrimary: true,
        },
        {
          label: 'Cancel',
          action: () => {},
        },
      ],
      canRetry: false,
    };
  }

  /**
   * Handle image size error
   * Requirements: 8.2
   */
  private handleImageSizeError(error: ImageSizeError): ErrorHandlingResult {
    const currentMB = (error.currentSize / 1024 / 1024).toFixed(2);
    const maxMB = (error.maxSize / 1024 / 1024).toFixed(0);

    return {
      type: SocialMediaErrorType.IMAGE_SIZE,
      platform: error.platform,
      message: error.message,
      userMessage: `Your image (${currentMB}MB) is too large for ${error.platform}. The maximum size is ${maxMB}MB.`,
      actions: [
        {
          label: 'Resize Image',
          action: () => this.suggestResize(error.platform, error.maxSize),
          isPrimary: true,
        },
        {
          label: 'Choose Different Platform',
          action: () => {},
        },
      ],
      canRetry: false,
    };
  }

  /**
   * Handle rate limit error
   * Requirements: 8.3
   */
  private handleRateLimitError(
    error: RateLimitError,
    retryCallback?: () => Promise<void>
  ): ErrorHandlingResult {
    const minutes = Math.ceil(error.retryAfter / 60);
    const retryDelayMs = error.retryAfter * 1000;

    const actions: ErrorAction[] = [
      {
        label: 'Cancel',
        action: () => {},
      },
    ];

    if (retryCallback) {
      actions.unshift({
        label: `Retry in ${minutes} minute${minutes > 1 ? 's' : ''}`,
        action: async () => {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          await retryCallback();
        },
        isPrimary: true,
      });
    }

    return {
      type: SocialMediaErrorType.RATE_LIMIT,
      platform: error.platform,
      message: error.message,
      userMessage: `You've reached the posting limit for ${error.platform}. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`,
      actions,
      canRetry: true,
      retryDelay: retryDelayMs,
    };
  }

  /**
   * Handle network error
   * Requirements: 8.4
   */
  private handleNetworkError(
    error: NetworkError,
    retryCallback?: () => Promise<void>
  ): ErrorHandlingResult {
    const actions: ErrorAction[] = [
      {
        label: 'Cancel',
        action: () => {},
      },
    ];

    if (retryCallback) {
      actions.unshift({
        label: 'Retry Now',
        action: retryCallback,
        isPrimary: true,
      });
    }

    return {
      type: SocialMediaErrorType.NETWORK,
      platform: error.platform,
      message: error.message,
      userMessage: `Unable to connect to ${error.platform}. Please check your internet connection and try again.`,
      actions,
      canRetry: true,
      retryDelay: 0,
    };
  }

  /**
   * Handle unknown error
   * Requirements: 8.5
   */
  private handleUnknownError(error: UnknownSocialMediaError): ErrorHandlingResult {
    return {
      type: SocialMediaErrorType.UNKNOWN,
      platform: error.platform,
      message: error.message,
      userMessage: `An unexpected error occurred while posting to ${error.platform}. Our team has been notified.`,
      actions: [
        {
          label: 'Contact Support',
          action: () => this.contactSupport(error),
          isPrimary: true,
        },
        {
          label: 'Close',
          action: () => {},
        },
      ],
      canRetry: false,
      supportContact: this.supportEmail,
    };
  }

  /**
   * Parse generic error and determine type
   */
  private parseAndHandleError(
    error: Error,
    platform: ShareablePlatform,
    retryCallback?: () => Promise<void>
  ): ErrorHandlingResult {
    const message = error.message.toLowerCase();

    // Check for authentication errors
    if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('401') ||
      message.includes('403')
    ) {
      return this.handleAuthenticationError(new AuthenticationError(platform));
    }

    // Check for image size errors
    if (message.includes('size') || message.includes('too large') || message.includes('exceeds')) {
      // Try to extract size information
      const sizeMatch = message.match(/(\d+\.?\d*)\s*mb/i);
      const currentSize = sizeMatch ? parseFloat(sizeMatch[1]) * 1024 * 1024 : 10 * 1024 * 1024;
      return this.handleImageSizeError(new ImageSizeError(platform, currentSize, 8 * 1024 * 1024));
    }

    // Check for rate limit errors
    if (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')
    ) {
      // Try to extract retry-after time
      const retryMatch = message.match(/(\d+)\s*(second|minute|hour)/i);
      let retryAfter = 300; // default 5 minutes

      if (retryMatch) {
        const value = parseInt(retryMatch[1]);
        const unit = retryMatch[2].toLowerCase();
        if (unit.startsWith('second')) {
          retryAfter = value;
        } else if (unit.startsWith('minute')) {
          retryAfter = value * 60;
        } else if (unit.startsWith('hour')) {
          retryAfter = value * 3600;
        }
      }

      return this.handleRateLimitError(new RateLimitError(platform, retryAfter), retryCallback);
    }

    // Check for network errors
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    ) {
      return this.handleNetworkError(new NetworkError(platform, error), retryCallback);
    }

    // Unknown error
    return this.handleUnknownError(
      new UnknownSocialMediaError(platform, error.message, error)
    );
  }

  /**
   * Prompt user to re-authenticate
   */
  private promptReAuthentication(platform: ShareablePlatform): void {
    // This would trigger the OAuth flow
    // Implementation depends on the app's authentication system
    console.log(`Prompting re-authentication for ${platform}`);
    
    // Dispatch custom event that the app can listen to
    window.dispatchEvent(
      new CustomEvent('social-media-reauth', {
        detail: { platform },
      })
    );
  }

  /**
   * Suggest image resize
   */
  private suggestResize(platform: ShareablePlatform, maxSize: number): void {
    const maxMB = (maxSize / 1024 / 1024).toFixed(0);
    console.log(`Suggesting resize for ${platform} to ${maxMB}MB`);
    
    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('social-media-resize', {
        detail: { platform, maxSize },
      })
    );
  }

  /**
   * Contact support
   */
  private contactSupport(error: UnknownSocialMediaError): void {
    const subject = encodeURIComponent(`Error posting to ${error.platform}`);
    const body = encodeURIComponent(
      `Platform: ${error.platform}\nError: ${error.message}\n\nPlease describe what you were trying to do:`
    );
    window.open(`mailto:${this.supportEmail}?subject=${subject}&body=${body}`);
  }

  /**
   * Create error from API response
   */
  static fromApiResponse(
    response: { status: number; statusText: string; data?: any },
    platform: ShareablePlatform
  ): SocialMediaError {
    const { status, statusText, data } = response;

    // Authentication errors
    if (status === 401 || status === 403) {
      return new AuthenticationError(platform);
    }

    // Rate limit errors
    if (status === 429) {
      const retryAfter = data?.retryAfter || 300;
      return new RateLimitError(platform, retryAfter);
    }

    // Image size errors
    if (status === 413 || (data?.error && data.error.includes('size'))) {
      const currentSize = data?.currentSize || 10 * 1024 * 1024;
      const maxSize = data?.maxSize || 8 * 1024 * 1024;
      return new ImageSizeError(platform, currentSize, maxSize);
    }

    // Network errors
    if (status === 0 || status >= 500) {
      return new NetworkError(platform);
    }

    // Unknown errors
    const message = data?.error || data?.message || statusText || 'Unknown error occurred';
    return new UnknownSocialMediaError(platform, message);
  }

  /**
   * Format error for logging
   */
  static formatErrorForLogging(error: Error | SocialMediaError): Record<string, any> {
    if (error instanceof SocialMediaError) {
      return {
        type: error.type,
        platform: error.platform,
        message: error.message,
        name: error.name,
        stack: error.stack,
        originalError: error.originalError
          ? {
              message: error.originalError.message,
              name: error.originalError.name,
              stack: error.originalError.stack,
            }
          : undefined,
      };
    }

    return {
      type: 'unknown',
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
