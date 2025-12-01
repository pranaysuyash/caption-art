/**
 * Platform Manager for Social Media Integration
 * Handles platform-specific operations for Instagram, Twitter, Facebook, and Pinterest
 */

import {
  errorHandler,
  AuthenticationError,
  ImageSizeError,
  NetworkError,
  type ErrorHandlingResult,
} from './errorHandler';

export type ShareablePlatform = 'instagram' | 'twitter' | 'facebook' | 'pinterest';

export interface PlatformConfig {
  name: string;
  displayName: string;
  maxImageSize: number; // in bytes
  supportedFormats: string[];
  requiresAuth: boolean;
}

export interface AuthStatus {
  platform: ShareablePlatform;
  isAuthenticated: boolean;
  username?: string;
  profilePicture?: string;
  tokenExpiry?: Date;
}

export interface PreparedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  format: string;
}

export interface PostResult {
  success: boolean;
  platform: ShareablePlatform;
  postUrl?: string;
  error?: string;
  errorDetails?: ErrorHandlingResult;
}

export interface MultiPlatformResult {
  results: PostResult[];
  successCount: number;
  failureCount: number;
  totalPlatforms: number;
}

/**
 * Platform configurations for each supported social media platform
 */
const PLATFORM_CONFIGS: Record<ShareablePlatform, PlatformConfig> = {
  instagram: {
    name: 'instagram',
    displayName: 'Instagram',
    maxImageSize: 8 * 1024 * 1024, // 8MB
    supportedFormats: ['image/jpeg', 'image/png'],
    requiresAuth: true,
  },
  twitter: {
    name: 'twitter',
    displayName: 'Twitter',
    maxImageSize: 5 * 1024 * 1024, // 5MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    requiresAuth: true,
  },
  facebook: {
    name: 'facebook',
    displayName: 'Facebook',
    maxImageSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif'],
    requiresAuth: true,
  },
  pinterest: {
    name: 'pinterest',
    displayName: 'Pinterest',
    maxImageSize: 32 * 1024 * 1024, // 32MB
    supportedFormats: ['image/jpeg', 'image/png'],
    requiresAuth: true,
  },
};

/**
 * Platform Manager class for handling social media operations
 */
export class PlatformManager {
  private authStatuses: Map<ShareablePlatform, AuthStatus> = new Map();

  /**
   * Get list of available platforms
   */
  getAvailablePlatforms(): ShareablePlatform[] {
    return ['instagram', 'twitter', 'facebook', 'pinterest'];
  }

  /**
   * Get platform configuration
   */
  getPlatformConfig(platform: ShareablePlatform): PlatformConfig {
    return PLATFORM_CONFIGS[platform];
  }

  /**
   * Check authentication status for a platform
   * Requirements: 1.2
   */
  async checkAuthStatus(platform: ShareablePlatform): Promise<AuthStatus> {
    // Check if we have cached auth status
    const cached = this.authStatuses.get(platform);
    if (cached) {
      // Check if token is still valid
      if (cached.tokenExpiry && cached.tokenExpiry > new Date()) {
        return cached;
      }
    }

    // In a real implementation, this would check with the OAuth handler
    // For now, we'll check localStorage for stored tokens
    const tokenKey = `${platform}_auth_token`;
    const token = localStorage.getItem(tokenKey);
    const username = localStorage.getItem(`${platform}_username`);
    const profilePicture = localStorage.getItem(`${platform}_profile_picture`);
    const tokenExpiry = localStorage.getItem(`${platform}_token_expiry`);

    const authStatus: AuthStatus = {
      platform,
      isAuthenticated: !!token,
      username: username || undefined,
      profilePicture: profilePicture || undefined,
      tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : undefined,
    };

    this.authStatuses.set(platform, authStatus);
    return authStatus;
  }

  /**
   * Prepare image for posting to a specific platform
   * Requirements: 1.4
   */
  async prepareImageForPosting(
    canvas: HTMLCanvasElement,
    platform: ShareablePlatform
  ): Promise<PreparedImage> {
    const config = this.getPlatformConfig(platform);

    // Determine the best format for the platform
    let format = 'image/jpeg';
    if (config.supportedFormats.includes('image/png')) {
      format = 'image/png';
    }

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        format,
        0.95 // quality for JPEG
      );
    });

    // Check if image size exceeds platform limit
    if (blob.size > config.maxImageSize) {
      throw new Error(
        `Image size (${(blob.size / 1024 / 1024).toFixed(2)}MB) exceeds ${config.displayName} limit of ${(config.maxImageSize / 1024 / 1024).toFixed(0)}MB`
      );
    }

    // Create data URL for preview
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return {
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      format,
    };
  }

  /**
   * Post image to platform
   * Requirements: 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 8.5
   */
  async postToPlatform(
    platform: ShareablePlatform,
    image: PreparedImage,
    caption: string,
    hashtags: string[] = []
  ): Promise<PostResult> {
    try {
      // Check authentication
      const authStatus = await this.checkAuthStatus(platform);
      if (!authStatus.isAuthenticated) {
        const authError = new AuthenticationError(platform);
        const errorDetails = errorHandler.handleError(authError, platform, () =>
          this.postToPlatform(platform, image, caption, hashtags)
        );
        return {
          success: false,
          platform,
          error: authError.message,
          errorDetails,
        };
      }

      // Validate image size
      const config = this.getPlatformConfig(platform);
      if (image.blob.size > config.maxImageSize) {
        const sizeError = new ImageSizeError(platform, image.blob.size, config.maxImageSize);
        const errorDetails = errorHandler.handleError(sizeError, platform);
        return {
          success: false,
          platform,
          error: sizeError.message,
          errorDetails,
        };
      }

      // In a real implementation, this would call the platform's API
      // For now, we'll simulate the post
      const fullCaption = this.buildCaption(caption, hashtags);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate success
      const postUrl = this.generateMockPostUrl(platform);

      return {
        success: true,
        platform,
        postUrl,
      };
    } catch (error) {
      // Handle network and unknown errors
      const socialError =
        error instanceof Error ? error : new Error('Unknown error occurred');
      const errorDetails = errorHandler.handleError(socialError, platform, () =>
        this.postToPlatform(platform, image, caption, hashtags)
      );

      return {
        success: false,
        platform,
        error: socialError.message,
        errorDetails,
      };
    }
  }

  /**
   * Build full caption with hashtags
   */
  private buildCaption(caption: string, hashtags: string[]): string {
    if (hashtags.length === 0) {
      return caption;
    }

    const hashtagString = hashtags.join(' ');
    return `${caption}\n\n${hashtagString}`;
  }

  /**
   * Generate mock post URL for testing
   */
  private generateMockPostUrl(platform: ShareablePlatform): string {
    const postId = Math.random().toString(36).substring(7);
    const urls: Record<ShareablePlatform, string> = {
      instagram: `https://instagram.com/p/${postId}`,
      twitter: `https://twitter.com/user/status/${postId}`,
      facebook: `https://facebook.com/posts/${postId}`,
      pinterest: `https://pinterest.com/pin/${postId}`,
    };
    return urls[platform];
  }

  /**
   * Handle post completion
   * Requirements: 1.5
   */
  handlePostCompletion(result: PostResult): void {
    if (result.success) {
      // Store successful post in history
      const history = this.getPostHistory();
      history.unshift({
        platform: result.platform,
        postUrl: result.postUrl!,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 50 posts
      if (history.length > 50) {
        history.splice(50);
      }

      localStorage.setItem('post_history', JSON.stringify(history));
    }
  }

  /**
   * Get post history
   */
  private getPostHistory(): Array<{
    platform: ShareablePlatform;
    postUrl: string;
    timestamp: string;
  }> {
    const historyJson = localStorage.getItem('post_history');
    if (!historyJson) {
      return [];
    }

    try {
      return JSON.parse(historyJson);
    } catch {
      return [];
    }
  }

  /**
   * Clear authentication for a platform
   */
  clearAuth(platform: ShareablePlatform): void {
    localStorage.removeItem(`${platform}_auth_token`);
    localStorage.removeItem(`${platform}_username`);
    localStorage.removeItem(`${platform}_profile_picture`);
    localStorage.removeItem(`${platform}_token_expiry`);
    this.authStatuses.delete(platform);
  }

  /**
   * Validate image meets requirements for all selected platforms
   * Requirements: 7.2
   */
  validateImageForPlatforms(
    image: PreparedImage,
    platforms: ShareablePlatform[]
  ): { valid: boolean; errors: Record<ShareablePlatform, string> } {
    const errors: Record<ShareablePlatform, string> = {} as Record<
      ShareablePlatform,
      string
    >;

    for (const platform of platforms) {
      const config = this.getPlatformConfig(platform);

      // Check image size
      if (image.blob.size > config.maxImageSize) {
        errors[platform] = `Image size (${(image.blob.size / 1024 / 1024).toFixed(2)}MB) exceeds ${config.displayName} limit of ${(config.maxImageSize / 1024 / 1024).toFixed(0)}MB`;
        continue;
      }

      // Check format
      if (!config.supportedFormats.includes(image.format)) {
        errors[platform] = `Format ${image.format} not supported by ${config.displayName}`;
        continue;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Post to multiple platforms sequentially
   * Requirements: 7.1, 7.3, 7.4, 7.5
   */
  async postToMultiplePlatforms(
    platforms: ShareablePlatform[],
    image: PreparedImage,
    caption: string,
    hashtags: string[] = []
  ): Promise<MultiPlatformResult> {
    const results: PostResult[] = [];

    // Post to each platform sequentially
    for (const platform of platforms) {
      try {
        const result = await this.postToPlatform(platform, image, caption, hashtags);
        results.push(result);

        // Handle post completion for successful posts
        if (result.success) {
          this.handlePostCompletion(result);
        }

        // Continue to next platform even if this one failed (Requirement 7.4)
      } catch (error) {
        // If an unexpected error occurs, record it and continue
        results.push({
          success: false,
          platform,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    // Calculate summary
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      results,
      successCount,
      failureCount,
      totalPlatforms: platforms.length,
    };
  }
}

// Export singleton instance
export const platformManager = new PlatformManager();
