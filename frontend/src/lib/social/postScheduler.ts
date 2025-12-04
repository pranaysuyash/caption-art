/**
 * Post Scheduler
 * Handles scheduling posts for future publication
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import type { ShareablePlatform, PreparedImage } from './types';
import { safeLocalStorage } from '../storage/safeLocalStorage';

export interface ScheduledPost {
  id: string;
  platform: ShareablePlatform;
  image: PreparedImage;
  caption: string;
  hashtags: string[];
  scheduledTime: Date;
  status: 'pending' | 'posted' | 'failed';
  createdAt: Date;
  postedAt?: Date;
  error?: string;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  error?: string;
}

export class PostScheduler {
  private scheduledPosts: Map<string, ScheduledPost> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private storageKey = 'social_scheduled_posts';

  constructor() {
    this.loadScheduledPosts();
    this.setupScheduledPosts();
  }

  /**
   * Validate that a scheduled time is in the future
   * Requirement 5.2: WHEN a time is selected THEN the Social Media Integration SHALL validate it is in the future
   */
  validateScheduledTime(scheduledTime: Date): ScheduleValidationResult {
    const now = new Date();

    if (!(scheduledTime instanceof Date) || isNaN(scheduledTime.getTime())) {
      return {
        isValid: false,
        error: 'Invalid date format',
      };
    }

    if (scheduledTime <= now) {
      return {
        isValid: false,
        error: 'Scheduled time must be in the future',
      };
    }

    return { isValid: true };
  }

  /**
   * Schedule a post for future publication
   * Requirement 5.3: WHEN scheduling a post THEN the Social Media Integration SHALL save the post data and schedule
   */
  schedulePost(
    platform: ShareablePlatform,
    image: PreparedImage,
    caption: string,
    hashtags: string[],
    scheduledTime: Date
  ): { success: boolean; postId?: string; error?: string } {
    // Validate scheduled time
    const validation = this.validateScheduledTime(scheduledTime);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Create scheduled post
    const postId = this.generatePostId();
    const scheduledPost: ScheduledPost = {
      id: postId,
      platform,
      image,
      caption,
      hashtags,
      scheduledTime,
      status: 'pending',
      createdAt: new Date(),
    };

    // Save to memory and storage
    this.scheduledPosts.set(postId, scheduledPost);
    this.saveScheduledPosts();

    // Set up timer for automatic posting
    this.setupTimer(postId, scheduledPost);

    return {
      success: true,
      postId,
    };
  }

  /**
   * Get all scheduled posts
   */
  getScheduledPosts(): ScheduledPost[] {
    return Array.from(this.scheduledPosts.values());
  }

  /**
   * Get a specific scheduled post
   */
  getScheduledPost(postId: string): ScheduledPost | undefined {
    return this.scheduledPosts.get(postId);
  }

  /**
   * Cancel a scheduled post
   */
  cancelScheduledPost(postId: string): boolean {
    const post = this.scheduledPosts.get(postId);
    if (!post) {
      return false;
    }

    // Clear timer
    const timer = this.timers.get(postId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(postId);
    }

    // Remove from storage
    this.scheduledPosts.delete(postId);
    this.saveScheduledPosts();

    return true;
  }

  /**
   * Requirement 5.4: WHEN the scheduled time arrives THEN the Social Media Integration SHALL post automatically
   */
  private setupTimer(postId: string, post: ScheduledPost): void {
    const now = new Date();
    const delay = post.scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      // Time has already passed, post immediately
      this.executeScheduledPost(postId);
      return;
    }

    const timer = setTimeout(() => {
      this.executeScheduledPost(postId);
    }, delay);

    this.timers.set(postId, timer);
  }

  /**
   * Execute a scheduled post
   * Requirement 5.5: WHEN a scheduled post fails THEN the Social Media Integration SHALL notify the user and offer to retry
   */
  private async executeScheduledPost(postId: string): Promise<void> {
    const post = this.scheduledPosts.get(postId);
    if (!post) {
      return;
    }

    try {
      // In a real implementation, this would call the platform API
      // For now, we'll simulate the posting
      await this.simulatePosting(post);

      // Update post status
      post.status = 'posted';
      post.postedAt = new Date();
      this.scheduledPosts.set(postId, post);
      this.saveScheduledPosts();

      // Clean up timer
      this.timers.delete(postId);

      // Notify success (in real app, would trigger UI notification)
      this.notifyPostSuccess(post);
    } catch (error) {
      // Requirement 5.5: Handle failures
      post.status = 'failed';
      post.error = error instanceof Error ? error.message : 'Unknown error';
      this.scheduledPosts.set(postId, post);
      this.saveScheduledPosts();

      // Clean up timer
      this.timers.delete(postId);

      // Notify failure and offer retry
      this.notifyPostFailure(post);
    }
  }

  /**
   * Retry a failed scheduled post
   */
  async retryFailedPost(
    postId: string
  ): Promise<{ success: boolean; error?: string }> {
    const post = this.scheduledPosts.get(postId);
    if (!post) {
      return {
        success: false,
        error: 'Post not found',
      };
    }

    if (post.status !== 'failed') {
      return {
        success: false,
        error: 'Post is not in failed state',
      };
    }

    try {
      await this.simulatePosting(post);

      post.status = 'posted';
      post.postedAt = new Date();
      post.error = undefined;
      this.scheduledPosts.set(postId, post);
      this.saveScheduledPosts();

      this.notifyPostSuccess(post);

      return { success: true };
    } catch (error) {
      post.error = error instanceof Error ? error.message : 'Unknown error';
      this.scheduledPosts.set(postId, post);
      this.saveScheduledPosts();

      return {
        success: false,
        error: post.error,
      };
    }
  }

  /**
   * Simulate posting to platform (placeholder for actual API calls)
   */
  private async simulatePosting(post: ScheduledPost): Promise<void> {
    // In a real implementation, this would:
    // 1. Check authentication status
    // 2. Call the platform API
    // 3. Handle platform-specific errors

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate random failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Network error');
    }
  }

  /**
   * Notify user of successful post
   */
  private notifyPostSuccess(post: ScheduledPost): void {
    // In a real implementation, this would trigger a UI notification
    console.log(`Post to ${post.platform} succeeded at ${post.postedAt}`);
  }

  /**
   * Notify user of failed post and offer retry
   */
  private notifyPostFailure(post: ScheduledPost): void {
    // In a real implementation, this would trigger a UI notification with retry option
    console.error(`Post to ${post.platform} failed: ${post.error}`);
  }

  /**
   * Load scheduled posts from storage
   */
  private loadScheduledPosts(): void {
    try {
      const stored = safeLocalStorage.getItem(this.storageKey);
      if (stored) {
        const posts: ScheduledPost[] = JSON.parse(stored);
        posts.forEach((post) => {
          // Convert date strings back to Date objects
          post.scheduledTime = new Date(post.scheduledTime);
          post.createdAt = new Date(post.createdAt);
          if (post.postedAt) {
            post.postedAt = new Date(post.postedAt);
          }
          this.scheduledPosts.set(post.id, post);
        });
      }
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
    }
  }

  /**
   * Save scheduled posts to storage
   */
  private saveScheduledPosts(): void {
    try {
      const posts = Array.from(this.scheduledPosts.values());
      safeLocalStorage.setItem(this.storageKey, JSON.stringify(posts));
    } catch (error) {
      console.error('Failed to save scheduled posts:', error);
    }
  }

  /**
   * Set up timers for all pending scheduled posts
   */
  private setupScheduledPosts(): void {
    this.scheduledPosts.forEach((post, postId) => {
      if (post.status === 'pending') {
        this.setupTimer(postId, post);
      }
    });
  }

  /**
   * Generate unique post ID
   */
  private generatePostId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up timers (call when component unmounts)
   */
  cleanup(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}

// Singleton instance
export const postScheduler = new PostScheduler();
