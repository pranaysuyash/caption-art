/**
 * UploadError Component Tests
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadError } from './UploadError'

describe('UploadError', () => {
  // Requirement 8.1: Display error messages for invalid types
  it('should display error message for invalid file type', () => {
    render(
      <UploadError
        error="Unsupported file type. Please use JPG, PNG, or WebP."
        filename="document.pdf"
      />
    )

    expect(screen.getByText('Upload Failed')).toBeInTheDocument()
    expect(screen.getByText('Unsupported file type. Please use JPG, PNG, or WebP.')).toBeInTheDocument()
    expect(screen.getByText('File: document.pdf')).toBeInTheDocument()
  })

  // Requirement 8.2: Display error messages for oversized files
  it('should display error message for oversized file with size details', () => {
    const fileSize = 15 * 1024 * 1024 // 15MB
    render(
      <UploadError
        error="File too large. Maximum size is 10MB."
        fileSize={fileSize}
      />
    )

    expect(screen.getByText('Upload Failed')).toBeInTheDocument()
    expect(screen.getByText('File too large. Maximum size is 10MB.')).toBeInTheDocument()
    expect(screen.getByText(/File size: 15 MB \(Maximum: 10MB\)/)).toBeInTheDocument()
  })

  // Requirement 8.3: Display error messages for corrupted images
  it('should display error message for corrupted image', () => {
    render(
      <UploadError
        error="Unable to read image file. Please try another file."
        filename="corrupted.jpg"
      />
    )

    expect(screen.getByText('Upload Failed')).toBeInTheDocument()
    expect(screen.getByText('Unable to read image file. Please try another file.')).toBeInTheDocument()
  })

  // Requirement 8.4: Display error messages for too many files
  it('should display error message for too many files', () => {
    render(
      <UploadError
        error="Too many files. Maximum 10 files per upload."
      />
    )

    expect(screen.getByText('Upload Failed')).toBeInTheDocument()
    expect(screen.getByText('Too many files. Maximum 10 files per upload.')).toBeInTheDocument()
    expect(screen.getByText('Please select 10 or fewer files')).toBeInTheDocument()
  })

  // Requirement 8.5: Display unknown errors with retry option
  it('should display retry button for unknown errors', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <UploadError
        error="Network error occurred"
        onRetry={onRetry}
      />
    )

    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()

    await user.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  // Requirement 8.5: Display dismiss button
  it('should display dismiss button when provided', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(
      <UploadError
        error="Some error occurred"
        onDismiss={onDismiss}
      />
    )

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    expect(dismissButton).toBeInTheDocument()

    await user.click(dismissButton)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  // Accessibility: Error should have proper ARIA attributes
  it('should have proper accessibility attributes', () => {
    render(
      <UploadError
        error="Test error"
      />
    )

    const errorElement = screen.getByRole('alert')
    expect(errorElement).toHaveAttribute('aria-live', 'assertive')
  })

  // File size formatting
  it('should format file sizes correctly', () => {
    const testCases = [
      { bytes: 0, expected: '0 Bytes' },
      { bytes: 1024, expected: '1 KB' },
      { bytes: 1024 * 1024, expected: '1 MB' },
      { bytes: 5.5 * 1024 * 1024, expected: '5.5 MB' },
    ]

    testCases.forEach(({ bytes, expected }) => {
      const { unmount } = render(
        <UploadError
          error="File too large. Maximum size is 10MB."
          fileSize={bytes}
        />
      )

      if (bytes > 0) {
        expect(screen.getByText(new RegExp(`File size: ${expected}`))).toBeInTheDocument()
      }

      unmount()
    })
  })
})
