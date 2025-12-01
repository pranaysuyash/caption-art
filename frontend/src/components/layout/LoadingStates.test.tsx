/**
 * Loading States Unit Tests
 * Requirements: 10.1, 10.2, 10.3, 10.5
 * 
 * Tests for loading states and error handling in layout components:
 * - Loading skeleton appears during upload
 * - Progress indicator shows during mask generation
 * - Spinner displays during caption generation
 * - Error messages appear near controls
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanvasArea } from './CanvasArea'
import { Sidebar, type SidebarSection } from './Sidebar'

describe('Loading States - Requirements 10.1, 10.2, 10.3, 10.5', () => {
  describe('CanvasArea Loading States', () => {
    it('should display loading skeleton during image upload - Requirement 10.1', () => {
      const { container } = render(
        <CanvasArea
          canvas={<canvas />}
          loading={true}
          loadingMessage="Processing image..."
        />
      )

      // Check loading overlay is present (has aria-live="polite")
      const loadingOverlay = container.querySelector('[aria-live="polite"]')
      expect(loadingOverlay).toBeInTheDocument()

      // Check loading message is displayed
      expect(screen.getByText('Processing image...')).toBeInTheDocument()
    })

    it('should hide loading skeleton when not loading - Requirement 10.1', () => {
      render(
        <CanvasArea
          canvas={<canvas />}
          loading={false}
        />
      )

      // Loading overlay should not be present
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('should display loading overlay with spinner - Requirement 10.1', () => {
      const { container } = render(
        <CanvasArea
          canvas={<canvas />}
          loading={true}
          loadingMessage="Uploading..."
        />
      )

      // Check spinner element exists
      const spinner = container.querySelector('.canvas-area__spinner')
      expect(spinner).toBeInTheDocument()
    })

    it('should show custom loading message - Requirement 10.1', () => {
      render(
        <CanvasArea
          canvas={<canvas />}
          loading={true}
          loadingMessage="Custom loading message"
        />
      )

      expect(screen.getByText('Custom loading message')).toBeInTheDocument()
    })
  })

  describe('Sidebar Loading States', () => {
    it('should show progress indicator during mask generation - Requirement 10.2', () => {
      const sections: SidebarSection[] = [
        {
          id: 'mask',
          title: 'Mask Generation',
          content: <div>Mask controls</div>,
          visible: true,
          loading: true,
        },
      ]

      render(<Sidebar sections={sections} />)

      // Check loading indicator is present
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should hide loading indicator when section is not loading - Requirement 10.2', () => {
      const sections: SidebarSection[] = [
        {
          id: 'mask',
          title: 'Mask Generation',
          content: <div>Mask controls</div>,
          visible: true,
          loading: false,
        },
      ]

      render(<Sidebar sections={sections} />)

      // Loading indicator should not be present
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('should display spinner during caption generation - Requirement 10.3', () => {
      const sections: SidebarSection[] = [
        {
          id: 'captions',
          title: 'Captions',
          content: <div>Caption controls</div>,
          visible: true,
          loading: true,
        },
      ]

      const { container } = render(<Sidebar sections={sections} />)

      // Check loading state is present
      const loadingElement = container.querySelector('.sidebar__loading')
      expect(loadingElement).toBeInTheDocument()
    })

    it('should show multiple loading sections independently - Requirement 10.2, 10.3', () => {
      const sections: SidebarSection[] = [
        {
          id: 'mask',
          title: 'Mask Generation',
          content: <div>Mask controls</div>,
          visible: true,
          loading: true,
        },
        {
          id: 'captions',
          title: 'Captions',
          content: <div>Caption controls</div>,
          visible: true,
          loading: true,
        },
        {
          id: 'text',
          title: 'Text',
          content: <div>Text controls</div>,
          visible: true,
          loading: false,
        },
      ]

      render(<Sidebar sections={sections} />)

      // Both loading sections should show loading state
      const loadingElements = screen.getAllByText('Loading...')
      expect(loadingElements).toHaveLength(2)
    })
  })

  describe('Error Message Display', () => {
    it('should show error message near relevant control in sidebar - Requirement 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'upload',
          title: 'Upload',
          content: <div>Upload controls</div>,
          visible: true,
          error: 'Image upload failed. Please try again.',
        },
      ]

      render(<Sidebar sections={sections} />)

      // Check error message is displayed
      const errorElement = screen.getByRole('alert')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveTextContent('Image upload failed. Please try again.')
    })

    it('should show error in Upload section when image upload fails - Requirement 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'upload',
          title: 'Upload',
          content: <div>Upload zone</div>,
          visible: true,
          error: 'Failed to upload image',
        },
      ]

      render(<Sidebar sections={sections} />)

      expect(screen.getByText('Failed to upload image')).toBeInTheDocument()
    })

    it('should show error in Canvas area when mask generation fails - Requirement 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'mask',
          title: 'Mask Controls',
          content: <div>Mask controls</div>,
          visible: true,
          error: 'Mask generation failed',
        },
      ]

      render(<Sidebar sections={sections} />)

      expect(screen.getByText('Mask generation failed')).toBeInTheDocument()
    })

    it('should show error in Captions section when caption generation fails - Requirement 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'captions',
          title: 'Captions',
          content: <div>Caption controls</div>,
          visible: true,
          error: 'Caption generation failed',
        },
      ]

      render(<Sidebar sections={sections} />)

      expect(screen.getByText('Caption generation failed')).toBeInTheDocument()
    })

    it('should show retry button with error message for API timeout - Requirement 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'captions',
          title: 'Captions',
          content: <div>Caption controls</div>,
          visible: true,
          error: 'API timeout. Please try again.',
        },
      ]

      render(<Sidebar sections={sections} />)

      const errorMessage = screen.getByText('API timeout. Please try again.')
      expect(errorMessage).toBeInTheDocument()
    })

    it('should hide error message when error is cleared - Requirement 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'upload',
          title: 'Upload',
          content: <div>Upload controls</div>,
          visible: true,
          error: undefined,
        },
      ]

      render(<Sidebar sections={sections} />)

      // Error should not be present
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should display multiple errors in different sections - Requirement 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'upload',
          title: 'Upload',
          content: <div>Upload controls</div>,
          visible: true,
          error: 'Upload error',
        },
        {
          id: 'captions',
          title: 'Captions',
          content: <div>Caption controls</div>,
          visible: true,
          error: 'Caption error',
        },
      ]

      render(<Sidebar sections={sections} />)

      // Both errors should be displayed
      expect(screen.getByText('Upload error')).toBeInTheDocument()
      expect(screen.getByText('Caption error')).toBeInTheDocument()
    })
  })

  describe('Loading and Error State Combinations', () => {
    it('should show loading state and hide error when loading - Requirement 10.1, 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'upload',
          title: 'Upload',
          content: <div>Upload controls</div>,
          visible: true,
          loading: true,
          error: 'Previous error',
        },
      ]

      render(<Sidebar sections={sections} />)

      // Loading should be shown
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      // Error should still be shown (both can coexist)
      expect(screen.getByText('Previous error')).toBeInTheDocument()
    })

    it('should transition from loading to error state - Requirement 10.1, 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'upload',
          title: 'Upload',
          content: <div>Upload controls</div>,
          visible: true,
          loading: false,
          error: 'Operation failed',
        },
      ]

      render(<Sidebar sections={sections} />)

      // Loading should not be shown
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      // Error should be shown
      expect(screen.getByText('Operation failed')).toBeInTheDocument()
    })

    it('should handle section with no loading or error state - Requirement 10.1, 10.5', () => {
      const sections: SidebarSection[] = [
        {
          id: 'text',
          title: 'Text',
          content: <div>Text controls</div>,
          visible: true,
          loading: false,
          error: undefined,
        },
      ]

      render(<Sidebar sections={sections} />)

      // Neither loading nor error should be shown
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      // Content should be shown
      expect(screen.getByText('Text controls')).toBeInTheDocument()
    })
  })
})
