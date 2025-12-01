/**
 * Social Post Preview Component
 * Displays platform-specific preview of social media posts
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useState, useEffect } from 'react';
import { ShareablePlatform } from '../lib/social/types';
import { PostPreviewData, postPreviewManager } from '../lib/social/postPreview';

export interface SocialPostPreviewProps {
  previewData: PostPreviewData;
  onCaptionEdit?: (caption: string) => void;
  onHashtagsEdit?: (hashtags: string[]) => void;
  editable?: boolean;
}

/**
 * Social Post Preview Component
 * Requirements: 4.1, 4.2, 4.3
 */
export function SocialPostPreview({
  previewData,
  onCaptionEdit,
  onHashtagsEdit,
  editable = true,
}: SocialPostPreviewProps) {
  const [caption, setCaption] = useState(previewData.caption);
  const [hashtags, setHashtags] = useState(previewData.hashtags);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [isEditingHashtags, setIsEditingHashtags] = useState(false);

  const style = postPreviewManager.getPlatformStyle(previewData.platform);
  const validation = postPreviewManager.validateCaptionLength(
    previewData.platform,
    caption,
    hashtags
  );

  // Update local state when preview data changes
  useEffect(() => {
    setCaption(previewData.caption);
    setHashtags(previewData.hashtags);
  }, [previewData.caption, previewData.hashtags]);

  /**
   * Handle caption edit
   * Requirements: 4.4, 4.5
   */
  const handleCaptionChange = (newCaption: string) => {
    setCaption(newCaption);
    if (onCaptionEdit) {
      onCaptionEdit(newCaption);
    }
  };

  /**
   * Handle hashtags edit
   * Requirements: 4.4, 4.5
   */
  const handleHashtagsChange = (newHashtagsString: string) => {
    const newHashtags = newHashtagsString
      .split(' ')
      .filter((tag) => tag.trim().length > 0)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

    setHashtags(newHashtags);
    if (onHashtagsEdit) {
      onHashtagsEdit(newHashtags);
    }
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor,
    color: style.textColor,
    fontFamily: style.fontFamily,
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    margin: '0 auto',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #dbdbdb',
        }}
      >
        {previewData.profilePicture ? (
          <img
            src={previewData.profilePicture}
            alt={previewData.username}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: style.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {previewData.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>
            {previewData.username}
          </div>
          {style.showTimestamp && (
            <div style={{ fontSize: '12px', color: '#8e8e8e' }}>
              {postPreviewManager.formatTimestamp(previewData.timestamp)}
            </div>
          )}
        </div>
        <div style={{ fontSize: '20px', cursor: 'pointer' }}>⋯</div>
      </div>

      {/* Image */}
      <div style={{ position: 'relative', width: '100%' }}>
        <img
          src={previewData.imageDataUrl}
          alt="Post preview"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>

      {/* Engagement (mock) */}
      {style.showEngagement && (
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            gap: '16px',
            borderBottom: '1px solid #dbdbdb',
          }}
        >
          <span style={{ cursor: 'pointer', fontSize: '24px' }}>♡</span>
          <span style={{ cursor: 'pointer', fontSize: '24px' }}>💬</span>
          <span style={{ cursor: 'pointer', fontSize: '24px' }}>📤</span>
        </div>
      )}

      {/* Caption and Hashtags */}
      <div style={{ padding: '12px 16px' }}>
        {/* Caption */}
        {isEditingCaption && editable ? (
          <div>
            <textarea
              value={caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              onBlur={() => setIsEditingCaption(false)}
              autoFocus
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '8px',
                border: '1px solid #dbdbdb',
                borderRadius: '4px',
                fontFamily: style.fontFamily,
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            {!validation.valid && (
              <div style={{ color: '#ed4956', fontSize: '12px', marginTop: '4px' }}>
                Caption too long: {validation.length}/{validation.maxLength} characters
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => editable && setIsEditingCaption(true)}
            style={{
              fontSize: '14px',
              lineHeight: '18px',
              cursor: editable ? 'pointer' : 'default',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontWeight: 600, marginRight: '4px' }}>
              {previewData.username}
            </span>
            {caption}
          </div>
        )}

        {/* Hashtags */}
        {isEditingHashtags && editable ? (
          <div>
            <input
              type="text"
              value={hashtags.join(' ')}
              onChange={(e) => handleHashtagsChange(e.target.value)}
              onBlur={() => setIsEditingHashtags(false)}
              autoFocus
              placeholder="Add hashtags..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dbdbdb',
                borderRadius: '4px',
                fontFamily: style.fontFamily,
                fontSize: '14px',
              }}
            />
          </div>
        ) : hashtags.length > 0 ? (
          <div
            onClick={() => editable && setIsEditingHashtags(true)}
            style={{
              fontSize: '14px',
              color: style.accentColor,
              cursor: editable ? 'pointer' : 'default',
              marginTop: '4px',
            }}
          >
            {hashtags.join(' ')}
          </div>
        ) : editable ? (
          <div
            onClick={() => setIsEditingHashtags(true)}
            style={{
              fontSize: '14px',
              color: '#8e8e8e',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            + Add hashtags
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Social Post Preview Dialog Component
 * Full dialog with preview and controls
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export interface SocialPostPreviewDialogProps {
  platform: ShareablePlatform;
  imageDataUrl: string;
  initialCaption?: string;
  initialHashtags?: string[];
  username?: string;
  profilePicture?: string;
  onClose: () => void;
  onPost: (caption: string, hashtags: string[]) => void;
}

export function SocialPostPreviewDialog({
  platform,
  imageDataUrl,
  initialCaption = '',
  initialHashtags = [],
  username,
  profilePicture,
  onClose,
  onPost,
}: SocialPostPreviewDialogProps) {
  const [previewData, setPreviewData] = useState<PostPreviewData>(() =>
    postPreviewManager.createPreview(
      platform,
      imageDataUrl,
      initialCaption,
      initialHashtags,
      username,
      profilePicture
    )
  );

  /**
   * Handle caption edit with real-time update
   * Requirements: 4.4, 4.5
   */
  const handleCaptionEdit = (caption: string) => {
    postPreviewManager.updatePreview({ caption });
    setPreviewData({ ...previewData, caption });
  };

  /**
   * Handle hashtags edit with real-time update
   * Requirements: 4.4, 4.5
   */
  const handleHashtagsEdit = (hashtags: string[]) => {
    postPreviewManager.updatePreview({ hashtags });
    setPreviewData({ ...previewData, hashtags });
  };

  const handlePost = () => {
    onPost(previewData.caption, previewData.hashtags);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            Preview Post - {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              color: '#8e8e8e',
            }}
          >
            ×
          </button>
        </div>

        <SocialPostPreview
          previewData={previewData}
          onCaptionEdit={handleCaptionEdit}
          onHashtagsEdit={handleHashtagsEdit}
          editable={true}
        />

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #dbdbdb',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#0095f6',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Post to {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </button>
        </div>
      </div>
    </div>
  );
}
