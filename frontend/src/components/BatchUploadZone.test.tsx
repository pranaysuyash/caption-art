/**
 * BatchUploadZone Component Tests
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchUploadZone } from './BatchUploadZone'

describe('BatchUploadZone', () => {
  const defaultProps = {
    onFilesAdded: vi.fn(),
    disabled: false,
    currentBatchSize: 0,
  }

  it('renders upload zone', () => {
    render(<BatchUploadZone {...defaultProps} />)
    
    expect(screen.getByText(/Upload Multiple Images/i)).toBeTruthy()
  })

  it('displays remaining slots - Requirement 1.1', () => {
    render(<BatchUploadZone {...defaultProps} currentBatchSize={10} />)
    
    expect(screen.getByText(/up to 40 more images/i)).toBeTruthy()
    expect(screen.getByText(/10\/50 images in batch/i)).toBeTruthy()
  })

  it('shows batch full message when at max capacity - Requirement 1.1', () => {
    render(<BatchUploadZone {...defaultProps} currentBatchSize={50} />)
    
    expect(screen.getByText(/Batch Full/i)).toBeTruthy()
    expect(screen.getByText(/Maximum 50 images reached/i)).toBeTruthy()
  })

  it('calls onFilesAdded when files selected', () => {
    const onFilesAdded = vi.fn()
    render(<BatchUploadZone {...defaultProps} onFilesAdded={onFilesAdded} />)
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
    
    Object.defineProperty(input, 'files', {
      value: [file1, file2],
      writable: false,
    })
    
    fireEvent.change(input)
    
    expect(onFilesAdded).toHaveBeenCalledWith([file1, file2])
  })

  it('calls onFilesAdded when files dropped', () => {
    const onFilesAdded = vi.fn()
    render(<BatchUploadZone {...defaultProps} onFilesAdded={onFilesAdded} />)
    
    const dropZone = screen.getByRole('button')
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
    
    const dropEvent = {
      dataTransfer: {
        files: [file1, file2],
      },
    }
    
    fireEvent.drop(dropZone, dropEvent)
    
    expect(onFilesAdded).toHaveBeenCalledWith([file1, file2])
  })

  it('does not call onFilesAdded when disabled', () => {
    const onFilesAdded = vi.fn()
    render(<BatchUploadZone {...defaultProps} disabled={true} onFilesAdded={onFilesAdded} />)
    
    const dropZone = screen.getByRole('button')
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    
    const dropEvent = {
      dataTransfer: {
        files: [file],
      },
    }
    
    fireEvent.drop(dropZone, dropEvent)
    
    expect(onFilesAdded).not.toHaveBeenCalled()
  })

  it('disables input when batch is full', () => {
    render(<BatchUploadZone {...defaultProps} currentBatchSize={50} />)
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it('disables input when disabled prop is true', () => {
    render(<BatchUploadZone {...defaultProps} disabled={true} />)
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it('accepts multiple files', () => {
    render(<BatchUploadZone {...defaultProps} />)
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.multiple).toBe(true)
  })

  it('accepts only image files', () => {
    render(<BatchUploadZone {...defaultProps} />)
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.accept).toBe('image/*')
  })

  it('resets input value after file selection', () => {
    const onFilesAdded = vi.fn()
    render(<BatchUploadZone {...defaultProps} onFilesAdded={onFilesAdded} />)
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    })
    
    // Set a value to simulate selection
    Object.defineProperty(input, 'value', {
      value: 'C:\\fakepath\\test.jpg',
      writable: true,
    })
    
    fireEvent.change(input)
    
    // Value should be reset to allow selecting the same file again
    expect(input.value).toBe('')
  })

  it('displays singular "image" when 1 slot remaining', () => {
    render(<BatchUploadZone {...defaultProps} currentBatchSize={49} />)
    
    expect(screen.getByText(/up to 1 more image$/i)).toBeTruthy()
  })

  it('displays plural "images" when multiple slots remaining', () => {
    render(<BatchUploadZone {...defaultProps} currentBatchSize={45} />)
    
    expect(screen.getByText(/up to 5 more images/i)).toBeTruthy()
  })

  it('applies disabled class when disabled', () => {
    const { container } = render(<BatchUploadZone {...defaultProps} disabled={true} />)
    
    const uploadZone = container.querySelector('.upload-zone')
    expect(uploadZone?.classList.contains('disabled')).toBe(true)
  })

  it('applies full class when batch is full', () => {
    const { container } = render(<BatchUploadZone {...defaultProps} currentBatchSize={50} />)
    
    const uploadZone = container.querySelector('.upload-zone')
    expect(uploadZone?.classList.contains('full')).toBe(true)
  })

  it('has correct accessibility attributes', () => {
    render(<BatchUploadZone {...defaultProps} />)
    
    const dropZone = screen.getByRole('button')
    expect(dropZone.getAttribute('aria-label')).toBe('Upload multiple images for batch processing')
    expect(dropZone.getAttribute('tabIndex')).toBe('0')
  })

  it('sets tabIndex to -1 when disabled', () => {
    render(<BatchUploadZone {...defaultProps} disabled={true} />)
    
    const dropZone = screen.getByRole('button')
    expect(dropZone.getAttribute('tabIndex')).toBe('-1')
  })

  it('does not call onFilesAdded when no files selected', () => {
    const onFilesAdded = vi.fn()
    render(<BatchUploadZone {...defaultProps} onFilesAdded={onFilesAdded} />)
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    
    Object.defineProperty(input, 'files', {
      value: [],
      writable: false,
    })
    
    fireEvent.change(input)
    
    expect(onFilesAdded).not.toHaveBeenCalled()
  })

  it('does not call onFilesAdded when no files dropped', () => {
    const onFilesAdded = vi.fn()
    render(<BatchUploadZone {...defaultProps} onFilesAdded={onFilesAdded} />)
    
    const dropZone = screen.getByRole('button')
    
    const dropEvent = {
      dataTransfer: {
        files: [],
      },
    }
    
    fireEvent.drop(dropZone, dropEvent)
    
    expect(onFilesAdded).not.toHaveBeenCalled()
  })
})
