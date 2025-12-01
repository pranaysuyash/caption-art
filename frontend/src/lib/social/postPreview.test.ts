/**
 * Tests for Post Preview functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PostPreviewManager } from './postPreview';

describe('PostPreviewManager', () => {
  let manager: PostPreviewManager;

  beforeEach(() => {
    manager = new PostPreviewManager();
  });

  describe('createPreview', () => {
    it('should create a preview with all data', () => {
      const preview = manager.createPreview(
        'instagram',
        'data:image/png;base64,test',
        'Test caption',
        ['#test', '#preview'],
        'testuser',
        'https://example.com/avatar.jpg'
      );

      expect(preview.platform).toBe('instagram');
      expect(preview.imageDataUrl).toBe('data:image/png;base64,test');
      expect(preview.caption).toBe('Test caption');
      expect(preview.hashtags).toEqual(['#test', '#preview']);
      expect(preview.username).toBe('testuser');
      expect(preview.profilePicture).toBe('https://example.com/avatar.jpg');
      expect(preview.timestamp).toBeInstanceOf(Date);
    });

    it('should use default username if not provided', () => {
      const preview = manager.createPreview(
        'twitter',
        'data:image/png;base64,test',
        'Test caption',
        []
      );

      expect(preview.username).toBe('user');
    });

    it('should store preview data', () => {
      manager.createPreview(
        'facebook',
        'data:image/png;base64,test',
        'Test caption',
        []
      );

      const stored = manager.getPreview();
      expect(stored).not.toBeNull();
      expect(stored?.platform).toBe('facebook');
    });
  });

  describe('updatePreview', () => {
    it('should update caption', () => {
      manager.createPreview(
        'instagram',
        'data:image/png;base64,test',
        'Original caption',
        []
      );

      manager.updatePreview({ caption: 'Updated caption' });

      const preview = manager.getPreview();
      expect(preview?.caption).toBe('Updated caption');
    });

    it('should update hashtags', () => {
      manager.createPreview(
        'instagram',
        'data:image/png;base64,test',
        'Caption',
        ['#old']
      );

      manager.updatePreview({ hashtags: ['#new', '#updated'] });

      const preview = manager.getPreview();
      expect(preview?.hashtags).toEqual(['#new', '#updated']);
    });

    it('should update timestamp on edit', () => {
      manager.createPreview(
        'instagram',
        'data:image/png;base64,test',
        'Caption',
        []
      );

      const originalTimestamp = manager.getPreview()?.timestamp;

      // Wait a bit
      setTimeout(() => {
        manager.updatePreview({ caption: 'Updated' });
        const newTimestamp = manager.getPreview()?.timestamp;

        expect(newTimestamp).not.toEqual(originalTimestamp);
      }, 10);
    });

    it('should do nothing if no preview exists', () => {
      manager.updatePreview({ caption: 'Test' });
      expect(manager.getPreview()).toBeNull();
    });
  });

  describe('getPlatformStyle', () => {
    it('should return Instagram style', () => {
      const style = manager.getPlatformStyle('instagram');

      expect(style.backgroundColor).toBe('#ffffff');
      expect(style.accentColor).toBe('#0095f6');
      expect(style.captionMaxLength).toBe(2200);
      expect(style.showTimestamp).toBe(true);
    });

    it('should return Twitter style', () => {
      const style = manager.getPlatformStyle('twitter');

      expect(style.accentColor).toBe('#1d9bf0');
      expect(style.captionMaxLength).toBe(280);
    });

    it('should return Facebook style', () => {
      const style = manager.getPlatformStyle('facebook');

      expect(style.accentColor).toBe('#1877f2');
      expect(style.captionMaxLength).toBe(63206);
    });

    it('should return Pinterest style', () => {
      const style = manager.getPlatformStyle('pinterest');

      expect(style.accentColor).toBe('#e60023');
      expect(style.captionMaxLength).toBe(500);
      expect(style.showTimestamp).toBe(false);
    });
  });

  describe('formatCaptionWithHashtags', () => {
    it('should format caption with hashtags', () => {
      const result = manager.formatCaptionWithHashtags(
        'My caption',
        ['#test', '#preview']
      );

      expect(result).toBe('My caption\n\n#test #preview');
    });

    it('should return caption only if no hashtags', () => {
      const result = manager.formatCaptionWithHashtags('My caption', []);

      expect(result).toBe('My caption');
    });
  });

  describe('validateCaptionLength', () => {
    it('should validate caption within limit', () => {
      const result = manager.validateCaptionLength(
        'twitter',
        'Short caption',
        ['#test']
      );

      expect(result.valid).toBe(true);
      expect(result.length).toBeLessThan(result.maxLength);
    });

    it('should invalidate caption exceeding limit', () => {
      const longCaption = 'a'.repeat(300);
      const result = manager.validateCaptionLength('twitter', longCaption, []);

      expect(result.valid).toBe(false);
      expect(result.length).toBeGreaterThan(result.maxLength);
      expect(result.maxLength).toBe(280);
    });

    it('should include hashtags in length calculation', () => {
      const caption = 'a'.repeat(250);
      const hashtags = ['#test', '#long', '#hashtags'];
      const result = manager.validateCaptionLength('twitter', caption, hashtags);

      // Caption (250) + newlines (2) + hashtags (~25) = ~277, which is under 280
      // Let's use a longer caption to exceed the limit
      const longCaption = 'a'.repeat(260);
      const result2 = manager.validateCaptionLength('twitter', longCaption, hashtags);

      expect(result2.valid).toBe(false);
      expect(result2.length).toBeGreaterThan(280);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on preview creation', () => {
      let notified = false;
      let receivedData = null;

      manager.subscribe((data) => {
        notified = true;
        receivedData = data;
      });

      manager.createPreview(
        'instagram',
        'data:image/png;base64,test',
        'Caption',
        []
      );

      expect(notified).toBe(true);
      expect(receivedData).not.toBeNull();
    });

    it('should notify listeners on preview update', () => {
      let notificationCount = 0;

      manager.subscribe(() => {
        notificationCount++;
      });

      manager.createPreview(
        'instagram',
        'data:image/png;base64,test',
        'Caption',
        []
      );
      manager.updatePreview({ caption: 'Updated' });

      expect(notificationCount).toBe(2);
    });

    it('should allow unsubscribing', () => {
      let notificationCount = 0;

      const unsubscribe = manager.subscribe(() => {
        notificationCount++;
      });

      manager.createPreview(
        'instagram',
        'data:image/png;base64,test',
        'Caption',
        []
      );

      unsubscribe();

      manager.updatePreview({ caption: 'Updated' });

      expect(notificationCount).toBe(1);
    });
  });

  describe('clearPreview', () => {
    it('should clear preview data', () => {
      manager.createPreview(
        'instagram',
        'data:image/png;base64,test',
        'Caption',
        []
      );

      manager.clearPreview();

      expect(manager.getPreview()).toBeNull();
    });

    it('should notify listeners on clear', () => {
      let lastData = null;

      manager.subscribe((data) => {
        lastData = data;
      });

      manager.createPreview(
        'instagram',
        'data:image/png;base64,test',
        'Caption',
        []
      );
      manager.clearPreview();

      expect(lastData).toBeNull();
    });
  });

  describe('formatTimestamp', () => {
    it('should format recent timestamp as "Just now"', () => {
      const now = new Date();
      const result = manager.formatTimestamp(now);

      expect(result).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = manager.formatTimestamp(date);

      expect(result).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const result = manager.formatTimestamp(date);

      expect(result).toBe('2h ago');
    });

    it('should format days ago', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const result = manager.formatTimestamp(date);

      expect(result).toBe('3d ago');
    });
  });
});
