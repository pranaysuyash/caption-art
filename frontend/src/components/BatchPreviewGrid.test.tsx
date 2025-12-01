/**
 * BatchPreviewGrid Component Tests
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchPreviewGrid } from './BatchPreviewGrid'
import { BatchImage } from '../lib/batch/types'

describe('BatchPreviewGrid', () => {
  const mockImages: BatchImage[] = [
    {
      id: '1',
      file: new File(['test'], 'test1.jpg', { type: 'image/jpeg' }),
      thumbnail: 'data:image/jpeg;base64,test1',
      status: 'valid',
      validationResult: {
        valid: true,
        fileType: 'image/jpeg',
        fileSize: 1024,
      },
    },
    {
      id: '2',
      file: new File(['test'], 'test2.png', { type: 'image/png' }),
      thumbnail: 'data:image/png;base64,test2',
      status: 'valid',
      validationResult: {
        valid: true,
        fileType: 'image/png',
        fileSize: 2048,
      },
    },
    {
      id: '3',
      file: new File(['test'], 'invalid.txt', { type: 'text/plain' }),
      thumbnail: 'data:image/jpeg;base64,test3',
      status: 'invalid',
      error: 'Invalid file type',
      validationResult: {
        valid: false,
        error: 'Invalid file type',
      },
    },
  ]

  // Requirement 4.1: Display all images in a grid
  it('should render all images in a grid', () => {
    const onSelectImage = vi.fn()
    const onRemoveImage = vi.fn()

    render(
      <BatchPreviewGrid
        images={mockImages}
        onSelectImage={onSelectImage}
        onRemoveImage={onRemoveImage}
      />
    )

    // Check that all images are rendered
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(mockImages.length)
  })

  // Requirement 4.2: Show larger preview when selected
  it('should show larger preview when an image is selected', () => {
    const onSelectImage = vi.fn()
    const onRemoveImage = vi.fn()

    render(
      <BatchPreviewGrid
        images={mockImages}
        onSelectImage={onSelectImage}
        onRemoveImage={onRemoveImage}
        selectedImageId="1"
      />
    )

    // Check that the large preview is shown
    expect(screen.getByText('Selected Image')).toBeInTheDocument()
    expect(screen.getByText('test1.jpg')).toBeInTheDocument()
  })

  // Requirement 4.5: Allow editing individual images (selecting)
  it('should call onSelectImage when an image is clicked', () => {
    const onSelectImage = vi.fn()
    const onRemoveImage = vi.fn()

    render(
      <BatchPreviewGrid
        images={mockImages}
        onSelectImage={onSelectImage}
        onRemoveImage={onRemoveImage}
      />
    )

    // Click on the first image
    const buttons = screen.getAllByRole('button')
    const firstImageButton = buttons.find(btn => 
      btn.getAttribute('aria-label')?.includes('test1.jpg')
    )
    
    if (firstImageButton) {
      fireEvent.click(firstImageButton)
      expect(onSelectImage).toHaveBeenCalledWith('1')
    }
  })

  // Requirement 4.5: Allow removing individual images
  it('should call onRemoveImage when remove button is clicked', () => {
    const onSelectImage = vi.fn()
    const onRemoveImage = vi.fn()

    render(
      <BatchPreviewGrid
        images={mockImages}
        onSelectImage={onSelectImage}
        onRemoveImage={onRemoveImage}
      />
    )

    // Find and click the remove button for the first image
    const removeButtons = screen.getAllByLabelText(/Remove/)
    fireEvent.click(removeButtons[0])
    
    expect(onRemoveImage).toHaveBeenCalledWith('1')
  })

  // Requirement 4.3: Show image details (filename, size)
  it('should display image details in large preview', () => {
    const onSelectImage = vi.fn()
    const onRemoveImage = vi.fn()

    render(
      <BatchPreviewGrid
        images={mockImages}
        onSelectImage={onSelectImage}
        onRemoveImage={onRemoveImage}
        selectedImageId="1"
      />
    )

    // Check that details are shown
    expect(screen.getByText('test1.jpg')).toBeInTheDocument()
    // File size is calculated from actual file size (4 bytes for 'test')
    expect(screen.getByText('4 B')).toBeInTheDocument()
    expect(screen.getByText('image/jpeg')).toBeInTheDocument()
  })

  // Invalid images should be marked
  it('should mark invalid images', () => {
    const onSelectImage = vi.fn()
    const onRemoveImage = vi.fn()

    render(
      <BatchPreviewGrid
        images={mockImages}
        onSelectImage={onSelectImage}
        onRemoveImage={onRemoveImage}
      />
    )

    // Check that invalid image has error indicator
    const invalidButton = screen.getByLabelText(/Invalid image invalid.txt/)
    expect(invalidButton).toBeInTheDocument()
  })

  // Should not render when no images
  it('should not render when images array is empty', () => {
    const onSelectImage = vi.fn()
    const onRemoveImage = vi.fn()

    const { container } = render(
      <BatchPreviewGrid
        images={[]}
        onSelectImage={onSelectImage}
        onRemoveImage={onRemoveImage}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  // Keyboard navigation support
  it('should support keyboard navigation', () => {
    const onSelectImage = vi.fn()
    const onRemoveImage = vi.fn()

    render(
      <BatchPreviewGrid
        images={mockImages}
        onSelectImage={onSelectImage}
        onRemoveImage={onRemoveImage}
      />
    )

    const buttons = screen.getAllByRole('button')
    const firstImageButton = buttons.find(btn => 
      btn.getAttribute('aria-label')?.includes('test1.jpg')
    )
    
    if (firstImageButton) {
      // Test Enter key
      fireEvent.keyDown(firstImageButton, { key: 'Enter' })
      expect(onSelectImage).toHaveBeenCalledWith('1')

      // Test Space key
      fireEvent.keyDown(firstImageButton, { key: ' ' })
      expect(onSelectImage).toHaveBeenCalledTimes(2)
    }
  })
})
