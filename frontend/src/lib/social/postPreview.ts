/**
 * Post Preview for Social Media Integration
 * Handles preview generation and real-time updates
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { ShareablePlatform } from './types';

export interface PostPreviewData {
  platform: ShareablePlatform;
  imageDataUrl: string;
  caption: string;
  hashtags: string[];
  username?: string;
  profilePicture?: string;
  timestamp: Date;
}

export interface PlatformStyle {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  captionMaxLength: number;
  showTimestamp: boolean;
  showEngagement: boolean;
}

/**
 * Platform-specific styling configurations
 * Requirements: 4.3
 */
const PLATFORM_STYLES: Record<ShareablePlatform, PlatformStyle> = {
  instagram: {
    backgroundColor: '#ffffff',
    textColor: '#262626',
    accentColor: '#0095f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    captionMaxLength: 2200,
    showTimestamp: true,
    showEngagement: true,
  },
  twitter: {
    backgroundColor: '#ffffff',
    textColor: '#0f1419',
    accentColor: '#1d9bf0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    captionMaxLength: 280,
    showTimestamp: true,
    showEngagement: true,
  },
  facebook: {
    backgroundColor: '#ffffff',
    textColor: '#050505',
    accentColor: '#1877f2',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    captionMaxLength: 63206,
    showTimestamp: true,
    showEngagement: true,
  },
  pinterest: {
    backgroundColor: '#ffffff',
    textColor: '#211922',
    accentColor: '#e60023',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    captionMaxLength: 500,
    showTimestamp: false,
    showEngagement: true,
  },
};

/**
 * Post Preview Manager
 */
export class PostPreviewManager {
  private previewData: PostPreviewData | null = null;
  private listeners: Set<(data: PostPreviewData | null) => void> = new Set();

  /**
   * Create a preview for a post
   * Requirements: 4.1, 4.2
   */
  createPreview(
    platform: ShareablePlatform,
    imageDataUrl: string,
    caption: string,
    hashtags: string[],
    username?: string,
    profilePicture?: string
  ): PostPreviewData {
    const previewData: PostPreviewData = {
      platform,
      imageDataUrl,
      caption,
      hashtags,
      username: username || 'user',
      profilePicture,
      timestamp: new Date(),
    };

    this.previewData = previewData;
    this.notifyListeners();

    return previewData;
  }

  /**
   * Update preview with new data
   * Requirements: 4.4, 4.5
   */
  updatePreview(updates: Partial<Omit<PostPreviewData, 'platform' | 'timestamp'>>): void {
    if (!this.previewData) {
      return;
    }

    this.previewData = {
      ...this.previewData,
      ...updates,
      timestamp: new Date(), // Update timestamp on edit
    };

    this.notifyListeners();
  }

  /**
   * Get current preview data
   */
  getPreview(): PostPreviewData | null {
    return this.previewData;
  }

  /**
   * Clear preview
   */
  clearPreview(): void {
    this.previewData = null;
    this.notifyListeners();
  }

  /**
   * Get platform-specific styling
   * Requirements: 4.3
   */
  getPlatformStyle(platform: ShareablePlatform): PlatformStyle {
    return PLATFORM_STYLES[platform];
  }

  /**
   * Format caption with hashtags for display
   * Requirements: 4.2
   */
  formatCaptionWithHashtags(caption: string, hashtags: string[]): string {
    if (hashtags.length === 0) {
      return caption;
    }

    const hashtagString = hashtags.join(' ');
    return `${caption}\n\n${hashtagString}`;
  }

  /**
   * Validate caption length for platform
   */
  validateCaptionLength(platform: ShareablePlatform, caption: string, hashtags: string[]): {
    valid: boolean;
    length: number;
    maxLength: number;
  } {
    const style = this.getPlatformStyle(platform);
    const fullCaption = this.formatCaptionWithHashtags(caption, hashtags);
    const length = fullCaption.length;

    return {
      valid: length <= style.captionMaxLength,
      length,
      maxLength: style.captionMaxLength,
    };
  }

  /**
   * Subscribe to preview updates
   * Requirements: 4.5
   */
  subscribe(listener: (data: PostPreviewData | null) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of preview changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.previewData);
    });
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days}d ago`;
    }
  }
}

// Export singleton instance
export const postPreviewManager = new PostPreviewManager();
