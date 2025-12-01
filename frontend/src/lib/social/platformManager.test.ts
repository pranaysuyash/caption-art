import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformManager, type ShareablePlatform } from './platformManager';

describe('PlatformManager', () => {
  let manager: PlatformManager;

  beforeEach(() => {
    manager = new PlatformManager();
    localStorage.clear();
  });

  describe('getAvailablePlatforms', () => {
    it('should return all supported platforms', () => {
      const platforms = manager.getAvailablePlatforms();
      expect(platforms).toEqual(['instagram', 'twitter', 'facebook', 'pinterest']);
    });
  });

  describe('getPlatformConfig', () => {
    it('should return correct config for Instagram', () => {
      const config = manager.getPlatformConfig('instagram');
      expect(config.displayName).toBe('Instagram');
      expect(config.maxImageSize).toBe(8 * 1024 * 1024);
      expect(config.supportedFormats).toContain('image/jpeg');
    });

    it('should return correct config for Twitter', () => {
      const config = manager.getPlatformConfig('twitter');
      expect(config.displayName).toBe('Twitter');
      expect(config.maxImageSize).toBe(5 * 1024 * 1024);
    });

    it('should return correct config for Facebook', () => {
      const config = manager.getPlatformConfig('facebook');
      expect(config.displayName).toBe('Facebook');
      expect(config.maxImageSize).toBe(10 * 1024 * 1024);
    });

    it('should return correct config for Pinterest', () => {
      const config = manager.getPlatformConfig('pinterest');
      expect(config.displayName).toBe('Pinterest');
      expect(config.maxImageSize).toBe(32 * 1024 * 1024);
    });
  });

  describe('checkAuthStatus', () => {
    it('should return unauthenticated status when no token exists', async () => {
      const status = await manager.checkAuthStatus('instagram');
      expect(status.isAuthenticated).toBe(false);
      expect(status.platform).toBe('instagram');
    });

    it('should return authenticated status when token exists', async () => {
      localStorage.setItem('instagram_auth_token', 'test-token');
      localStorage.setItem('instagram_username', 'testuser');

      const status = await manager.checkAuthStatus('instagram');
      expect(status.isAuthenticated).toBe(true);
      expect(status.username).toBe('testuser');
    });

    it('should check token expiry', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      localStorage.setItem('twitter_auth_token', 'test-token');
      localStorage.setItem('twitter_token_expiry', futureDate);

      const status = await manager.checkAuthStatus('twitter');
      expect(status.isAuthenticated).toBe(true);
      expect(status.tokenExpiry).toBeDefined();
    });
  });

  describe('prepareImageForPosting', () => {
    it('should prepare image with correct format', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 1080, 1080);
      }

      const prepared = await manager.prepareImageForPosting(canvas, 'instagram');
      expect(prepared.width).toBe(1080);
      expect(prepared.height).toBe(1080);
      expect(prepared.blob).toBeInstanceOf(Blob);
      expect(prepared.dataUrl).toMatch(/^data:image/);
    });

    it('should throw error if image exceeds size limit', async () => {
      // Create a canvas with complex content that will exceed Instagram's 8MB limit
      const canvas = document.createElement('canvas');
      canvas.width = 5000;
      canvas.height = 5000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fill with random noise to make it incompressible
        const imageData = ctx.createImageData(5000, 5000);
        for (let i = 0; i < imageData.data.length; i++) {
          imageData.data[i] = Math.random() * 255;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      await expect(
        manager.prepareImageForPosting(canvas, 'instagram')
      ).rejects.toThrow(/exceeds.*limit/);
    });
  });

  describe('postToPlatform', () => {
    it('should fail if not authenticated', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const prepared = await manager.prepareImageForPosting(canvas, 'instagram');

      const result = await manager.postToPlatform('instagram', prepared, 'Test caption');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });

    it('should succeed when authenticated', async () => {
      localStorage.setItem('instagram_auth_token', 'test-token');

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const prepared = await manager.prepareImageForPosting(canvas, 'instagram');

      const result = await manager.postToPlatform('instagram', prepared, 'Test caption');
      expect(result.success).toBe(true);
      expect(result.postUrl).toBeDefined();
    });

    it('should include hashtags in post', async () => {
      localStorage.setItem('twitter_auth_token', 'test-token');

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const prepared = await manager.prepareImageForPosting(canvas, 'twitter');

      const result = await manager.postToPlatform(
        'twitter',
        prepared,
        'Test caption',
        ['#test', '#hashtag']
      );
      expect(result.success).toBe(true);
    });
  });

  describe('handlePostCompletion', () => {
    it('should store successful post in history', () => {
      const result = {
        success: true,
        platform: 'instagram' as ShareablePlatform,
        postUrl: 'https://instagram.com/p/test123',
      };

      manager.handlePostCompletion(result);

      const history = JSON.parse(localStorage.getItem('post_history') || '[]');
      expect(history).toHaveLength(1);
      expect(history[0].platform).toBe('instagram');
      expect(history[0].postUrl).toBe('https://instagram.com/p/test123');
    });

    it('should not store failed posts', () => {
      const result = {
        success: false,
        platform: 'instagram' as ShareablePlatform,
        error: 'Test error',
      };

      manager.handlePostCompletion(result);

      const history = JSON.parse(localStorage.getItem('post_history') || '[]');
      expect(history).toHaveLength(0);
    });

    it('should limit history to 50 posts', () => {
      // Add 51 posts
      for (let i = 0; i < 51; i++) {
        const result = {
          success: true,
          platform: 'instagram' as ShareablePlatform,
          postUrl: `https://instagram.com/p/test${i}`,
        };
        manager.handlePostCompletion(result);
      }

      const history = JSON.parse(localStorage.getItem('post_history') || '[]');
      expect(history).toHaveLength(50);
    });
  });

  describe('clearAuth', () => {
    it('should remove all auth data for platform', () => {
      localStorage.setItem('facebook_auth_token', 'test-token');
      localStorage.setItem('facebook_username', 'testuser');
      localStorage.setItem('facebook_profile_picture', 'pic.jpg');
      localStorage.setItem('facebook_token_expiry', new Date().toISOString());

      manager.clearAuth('facebook');

      expect(localStorage.getItem('facebook_auth_token')).toBeNull();
      expect(localStorage.getItem('facebook_username')).toBeNull();
      expect(localStorage.getItem('facebook_profile_picture')).toBeNull();
      expect(localStorage.getItem('facebook_token_expiry')).toBeNull();
    });
  });

  describe('validateImageForPlatforms', () => {
    it('should validate image meets all platform requirements', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const prepared = await manager.prepareImageForPosting(canvas, 'instagram');

      const validation = manager.validateImageForPlatforms(prepared, [
        'instagram',
        'twitter',
        'facebook',
      ]);

      expect(validation.valid).toBe(true);
      expect(Object.keys(validation.errors)).toHaveLength(0);
    });

    it('should detect size violations for specific platforms', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const prepared = await manager.prepareImageForPosting(canvas, 'instagram');

      // Mock a large blob that exceeds Twitter's limit
      const largeBlobSize = 6 * 1024 * 1024; // 6MB (exceeds Twitter's 5MB)
      Object.defineProperty(prepared.blob, 'size', { value: largeBlobSize });

      const validation = manager.validateImageForPlatforms(prepared, [
        'instagram',
        'twitter',
      ]);

      expect(validation.valid).toBe(false);
      expect(validation.errors.twitter).toContain('exceeds');
      expect(validation.errors.instagram).toBeUndefined();
    });
  });

  describe('postToMultiplePlatforms', () => {
    it('should post to all platforms sequentially', async () => {
      // Authenticate all platforms
      localStorage.setItem('instagram_auth_token', 'test-token');
      localStorage.setItem('twitter_auth_token', 'test-token');
      localStorage.setItem('facebook_auth_token', 'test-token');

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const prepared = await manager.prepareImageForPosting(canvas, 'instagram');

      const result = await manager.postToMultiplePlatforms(
        ['instagram', 'twitter', 'facebook'],
        prepared,
        'Test caption',
        ['#test']
      );

      expect(result.totalPlatforms).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(3);
    });

    it('should continue posting even when one platform fails', async () => {
      // Only authenticate Instagram and Facebook, not Twitter
      localStorage.setItem('instagram_auth_token', 'test-token');
      localStorage.setItem('facebook_auth_token', 'test-token');

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const prepared = await manager.prepareImageForPosting(canvas, 'instagram');

      const result = await manager.postToMultiplePlatforms(
        ['instagram', 'twitter', 'facebook'],
        prepared,
        'Test caption'
      );

      expect(result.totalPlatforms).toBe(3);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);

      // Check that Instagram and Facebook succeeded
      const instagramResult = result.results.find((r) => r.platform === 'instagram');
      const facebookResult = result.results.find((r) => r.platform === 'facebook');
      const twitterResult = result.results.find((r) => r.platform === 'twitter');

      expect(instagramResult?.success).toBe(true);
      expect(facebookResult?.success).toBe(true);
      expect(twitterResult?.success).toBe(false);
      expect(twitterResult?.error).toContain('Authentication failed');
    });

    it('should display summary of successes and failures', async () => {
      localStorage.setItem('instagram_auth_token', 'test-token');

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const prepared = await manager.prepareImageForPosting(canvas, 'instagram');

      const result = await manager.postToMultiplePlatforms(
        ['instagram', 'twitter', 'facebook', 'pinterest'],
        prepared,
        'Test caption'
      );

      expect(result.totalPlatforms).toBe(4);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(3);
      expect(result.results).toHaveLength(4);
    });

    it('should handle post completion for successful posts', async () => {
      localStorage.setItem('instagram_auth_token', 'test-token');
      localStorage.setItem('twitter_auth_token', 'test-token');

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const prepared = await manager.prepareImageForPosting(canvas, 'instagram');

      await manager.postToMultiplePlatforms(
        ['instagram', 'twitter'],
        prepared,
        'Test caption'
      );

      const history = JSON.parse(localStorage.getItem('post_history') || '[]');
      expect(history).toHaveLength(2);
    });
  });
});
