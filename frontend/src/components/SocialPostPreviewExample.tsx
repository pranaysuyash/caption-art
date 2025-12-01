/**
 * Example usage of Social Post Preview
 * This demonstrates how to integrate the preview functionality
 */

import React, { useState } from 'react';
import { SocialPostPreviewDialog } from './SocialPostPreview';
import { ShareablePlatform } from '../lib/social/types';
import { platformManager } from '../lib/social/platformManager';

export function SocialPostPreviewExample() {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<ShareablePlatform>('instagram');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  // Example: Create a sample canvas with content
  const createSampleCanvas = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw a gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sample Post', canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const handleOpenPreview = () => {
    const dataUrl = createSampleCanvas();
    setImageDataUrl(dataUrl);
    setShowPreview(true);
  };

  const handlePost = async (caption: string, hashtags: string[]) => {
    console.log('Posting to', selectedPlatform);
    console.log('Caption:', caption);
    console.log('Hashtags:', hashtags);

    // In a real app, you would use platformManager to post
    // const canvas = document.createElement('canvas');
    // const preparedImage = await platformManager.prepareImageForPosting(canvas, selectedPlatform);
    // const result = await platformManager.postToPlatform(selectedPlatform, preparedImage, caption, hashtags);

    setShowPreview(false);
    alert(`Post would be published to ${selectedPlatform}!`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Social Post Preview Example</h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
          Select Platform:
        </label>
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value as ShareablePlatform)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #dbdbdb',
            fontSize: '14px',
          }}
        >
          <option value="instagram">Instagram</option>
          <option value="twitter">Twitter</option>
          <option value="facebook">Facebook</option>
          <option value="pinterest">Pinterest</option>
        </select>
      </div>

      <button
        onClick={handleOpenPreview}
        style={{
          padding: '12px 24px',
          backgroundColor: '#0095f6',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Preview Post
      </button>

      {showPreview && (
        <SocialPostPreviewDialog
          platform={selectedPlatform}
          imageDataUrl={imageDataUrl}
          initialCaption="Check out this amazing caption art! 🎨✨"
          initialHashtags={['#captionart', '#design', '#creative']}
          username="demo_user"
          onClose={() => setShowPreview(false)}
          onPost={handlePost}
        />
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Features Demonstrated:</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ Platform-specific preview styling</li>
          <li>✅ Display image, caption, and hashtags</li>
          <li>✅ Editable caption and hashtags</li>
          <li>✅ Real-time preview updates</li>
          <li>✅ Platform selection</li>
          <li>✅ Post action handling</li>
        </ul>
      </div>
    </div>
  );
}
