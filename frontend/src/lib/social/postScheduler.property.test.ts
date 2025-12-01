/**
 * Property-based tests for PostScheduler
 * Feature: social-media-integration, Property 5: Schedule validation
 * Validates: Requirements 5.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { PostScheduler } from './postScheduler';
import type { ShareablePlatform, PreparedImage } from './types';

describe('PostScheduler - Property Tests', () => {
  let scheduler: PostScheduler;

  beforeEach(() => {
    scheduler = new PostScheduler();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    scheduler.cleanup();
    localStorage.clear();
  });

  /**
   * Property 5: Schedule validation
   * For any scheduled post, the scheduled time should be in the future
   * Validates: Requirements 5.2
   */
  describe('Property 5: Schedule validation', () => {
    it('should validate that all scheduled times are in the future', () => {
      fc.assert(
        fc.property(
          // Generate future dates (from 1 second to 30 days in the future)
          fc.integer({ min: 1000, max: 30 * 24 * 60 * 60 * 1000 }),
          fc.constantFrom<ShareablePlatform>('instagram', 'twitter', 'facebook', 'pinterest'),
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.array(fc.string({ minLength: 2, maxLength: 30 }), { maxLength: 10 }),
          (futureOffset, platform, caption, hashtags) => {
            const now = new Date();
            const scheduledTime = new Date(now.getTime() + futureOffset);

            // Create mock image
            const mockImage: PreparedImage = {
              blob: new Blob(['test'], { type: 'image/png' }),
              dataUrl: 'data:image/png;base64,test',
              width: 1080,
              height: 1080,
              format: 'png',
            };

            // Validate the scheduled time
            const validation = scheduler.validateScheduledTime(scheduledTime);

            // Property: All future times should be valid
            expect(validation.isValid).toBe(true);
            expect(validation.error).toBeUndefined();

            // Schedule the post
            const result = scheduler.schedulePost(
              platform,
              mockImage,
              caption,
              hashtags,
              scheduledTime
            );

            // Property: Scheduling with a future time should succeed
            expect(result.success).toBe(true);
            expect(result.postId).toBeDefined();
            expect(result.error).toBeUndefined();

            // Property: The scheduled post should have the correct scheduled time
            if (result.postId) {
              const post = scheduler.getScheduledPost(result.postId);
              expect(post).toBeDefined();
              expect(post!.scheduledTime.getTime()).toBe(scheduledTime.getTime());
              expect(post!.status).toBe('pending');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject past times', () => {
      fc.assert(
        fc.property(
          // Generate past dates (from 1 second to 30 days in the past)
          fc.integer({ min: 1000, max: 30 * 24 * 60 * 60 * 1000 }),
          fc.constantFrom<ShareablePlatform>('instagram', 'twitter', 'facebook', 'pinterest'),
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.array(fc.string({ minLength: 2, maxLength: 30 }), { maxLength: 10 }),
          (pastOffset, platform, caption, hashtags) => {
            const now = new Date();
            const scheduledTime = new Date(now.getTime() - pastOffset);

            // Create mock image
            const mockImage: PreparedImage = {
              blob: new Blob(['test'], { type: 'image/png' }),
              dataUrl: 'data:image/png;base64,test',
              width: 1080,
              height: 1080,
              format: 'png',
            };

            // Validate the scheduled time
            const validation = scheduler.validateScheduledTime(scheduledTime);

            // Property: All past times should be invalid
            expect(validation.isValid).toBe(false);
            expect(validation.error).toBeDefined();
            expect(validation.error).toContain('future');

            // Schedule the post
            const result = scheduler.schedulePost(
              platform,
              mockImage,
              caption,
              hashtags,
              scheduledTime
            );

            // Property: Scheduling with a past time should fail
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.postId).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid date objects', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ShareablePlatform>('instagram', 'twitter', 'facebook', 'pinterest'),
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.array(fc.string({ minLength: 2, maxLength: 30 }), { maxLength: 10 }),
          (platform, caption, hashtags) => {
            // Create invalid date
            const invalidDate = new Date('invalid');

            // Create mock image
            const mockImage: PreparedImage = {
              blob: new Blob(['test'], { type: 'image/png' }),
              dataUrl: 'data:image/png;base64,test',
              width: 1080,
              height: 1080,
              format: 'png',
            };

            // Validate the scheduled time
            const validation = scheduler.validateScheduledTime(invalidDate);

            // Property: Invalid dates should be rejected
            expect(validation.isValid).toBe(false);
            expect(validation.error).toBeDefined();

            // Schedule the post
            const result = scheduler.schedulePost(
              platform,
              mockImage,
              caption,
              hashtags,
              invalidDate
            );

            // Property: Scheduling with invalid date should fail
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.postId).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain schedule validation across multiple posts', () => {
      fc.assert(
        fc.property(
          // Generate array of future offsets
          fc.array(
            fc.record({
              offset: fc.integer({ min: 1000, max: 30 * 24 * 60 * 60 * 1000 }),
              platform: fc.constantFrom<ShareablePlatform>('instagram', 'twitter', 'facebook', 'pinterest'),
              caption: fc.string({ minLength: 1, maxLength: 500 }),
              hashtags: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { maxLength: 10 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (posts) => {
            const now = new Date();
            const scheduledPostIds: string[] = [];

            // Create mock image
            const mockImage: PreparedImage = {
              blob: new Blob(['test'], { type: 'image/png' }),
              dataUrl: 'data:image/png;base64,test',
              width: 1080,
              height: 1080,
              format: 'png',
            };

            // Schedule all posts
            posts.forEach(({ offset, platform, caption, hashtags }) => {
              const scheduledTime = new Date(now.getTime() + offset);
              const result = scheduler.schedulePost(
                platform,
                mockImage,
                caption,
                hashtags,
                scheduledTime
              );

              // Property: All future times should schedule successfully
              expect(result.success).toBe(true);
              expect(result.postId).toBeDefined();
              
              if (result.postId) {
                scheduledPostIds.push(result.postId);
              }
            });

            // Property: All scheduled posts should have future times
            const allScheduledPosts = scheduler.getScheduledPosts();
            expect(allScheduledPosts.length).toBe(posts.length);

            allScheduledPosts.forEach(post => {
              expect(post.scheduledTime.getTime()).toBeGreaterThan(now.getTime());
              expect(post.status).toBe('pending');
            });

            // Clean up
            scheduledPostIds.forEach(id => scheduler.cancelScheduledPost(id));
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
