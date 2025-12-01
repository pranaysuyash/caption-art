/**
 * Tests for Social Post Preview Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialPostPreview, SocialPostPreviewDialog } from './SocialPostPreview';
import { PostPreviewData } from '../lib/social/postPreview';

describe('SocialPostPreview', () => {
  const mockPreviewData: PostPreviewData = {
    platform: 'instagram',
    imageDataUrl: 'data:image/png;base64,test',
    caption: 'Test caption',
    hashtags: ['#test', '#preview'],
    username: 'testuser',
    timestamp: new Date(),
  };

  it('should render preview with image', () => {
    render(<SocialPostPreview previewData={mockPreviewData} />);

    const image = screen.getByAltText('Post preview');
    expect(image).toBeDefined();
    expect(image.getAttribute('src')).toBe('data:image/png;base64,test');
  });

  it('should display username', () => {
    render(<SocialPostPreview previewData={mockPreviewData} />);

    // Username appears twice (header and caption), so use getAllByText
    const usernames = screen.getAllByText('testuser');
    expect(usernames.length).toBeGreaterThan(0);
  });

  it('should display caption', () => {
    render(<SocialPostPreview previewData={mockPreviewData} />);

    expect(screen.getByText('Test caption')).toBeDefined();
  });

  it('should display hashtags', () => {
    render(<SocialPostPreview previewData={mockPreviewData} />);

    expect(screen.getByText('#test #preview')).toBeDefined();
  });

  it('should show profile picture if provided', () => {
    const dataWithPicture = {
      ...mockPreviewData,
      profilePicture: 'https://example.com/avatar.jpg',
    };

    render(<SocialPostPreview previewData={dataWithPicture} />);

    const avatar = screen.getByAltText('testuser');
    expect(avatar.getAttribute('src')).toBe('https://example.com/avatar.jpg');
  });

  it('should show default avatar if no profile picture', () => {
    render(<SocialPostPreview previewData={mockPreviewData} />);

    expect(screen.getByText('T')).toBeDefined(); // First letter of username
  });

  it('should allow caption editing when editable', () => {
    const onCaptionEdit = vi.fn();

    render(
      <SocialPostPreview
        previewData={mockPreviewData}
        onCaptionEdit={onCaptionEdit}
        editable={true}
      />
    );

    const captionElement = screen.getByText('Test caption');
    fireEvent.click(captionElement);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeDefined();
    expect(textarea.value).toBe('Test caption');
  });

  it('should call onCaptionEdit when caption changes', () => {
    const onCaptionEdit = vi.fn();

    render(
      <SocialPostPreview
        previewData={mockPreviewData}
        onCaptionEdit={onCaptionEdit}
        editable={true}
      />
    );

    const captionElement = screen.getByText('Test caption');
    fireEvent.click(captionElement);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Updated caption' } });

    expect(onCaptionEdit).toHaveBeenCalledWith('Updated caption');
  });

  it('should allow hashtag editing when editable', () => {
    const onHashtagsEdit = vi.fn();

    render(
      <SocialPostPreview
        previewData={mockPreviewData}
        onHashtagsEdit={onHashtagsEdit}
        editable={true}
      />
    );

    const hashtagsElement = screen.getByText('#test #preview');
    fireEvent.click(hashtagsElement);

    const input = screen.getByDisplayValue('#test #preview');
    expect(input).toBeDefined();
  });

  it('should not allow editing when editable is false', () => {
    render(<SocialPostPreview previewData={mockPreviewData} editable={false} />);

    const captionElement = screen.getByText('Test caption');
    fireEvent.click(captionElement);

    // Should not show textarea
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('should show "Add hashtags" prompt when no hashtags and editable', () => {
    const dataWithoutHashtags = {
      ...mockPreviewData,
      hashtags: [],
    };

    render(<SocialPostPreview previewData={dataWithoutHashtags} editable={true} />);

    expect(screen.getByText('+ Add hashtags')).toBeDefined();
  });
});

describe('SocialPostPreviewDialog', () => {
  const mockProps = {
    platform: 'instagram' as const,
    imageDataUrl: 'data:image/png;base64,test',
    initialCaption: 'Test caption',
    initialHashtags: ['#test'],
    username: 'testuser',
    onClose: vi.fn(),
    onPost: vi.fn(),
  };

  it('should render dialog with preview', () => {
    render(<SocialPostPreviewDialog {...mockProps} />);

    expect(screen.getByText('Preview Post - Instagram')).toBeDefined();
    expect(screen.getByAltText('Post preview')).toBeDefined();
  });

  it('should call onClose when cancel button clicked', () => {
    const onClose = vi.fn();

    render(<SocialPostPreviewDialog {...mockProps} onClose={onClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onPost when post button clicked', () => {
    const onPost = vi.fn();

    render(<SocialPostPreviewDialog {...mockProps} onPost={onPost} />);

    const postButton = screen.getByText('Post to Instagram');
    fireEvent.click(postButton);

    expect(onPost).toHaveBeenCalledWith('Test caption', ['#test']);
  });

  it('should call onClose when overlay clicked', () => {
    const onClose = vi.fn();

    const { container } = render(
      <SocialPostPreviewDialog {...mockProps} onClose={onClose} />
    );

    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close when dialog content clicked', () => {
    const onClose = vi.fn();

    render(<SocialPostPreviewDialog {...mockProps} onClose={onClose} />);

    const dialog = screen.getByText('Preview Post - Instagram').parentElement;
    if (dialog) {
      fireEvent.click(dialog);
    }

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should display platform name in title', () => {
    render(<SocialPostPreviewDialog {...mockProps} platform="twitter" />);

    expect(screen.getByText('Preview Post - Twitter')).toBeDefined();
  });

  it('should display platform name in post button', () => {
    render(<SocialPostPreviewDialog {...mockProps} platform="facebook" />);

    expect(screen.getByText('Post to Facebook')).toBeDefined();
  });
});
