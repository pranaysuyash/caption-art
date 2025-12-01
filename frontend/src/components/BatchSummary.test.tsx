/**
 * BatchSummary Component Tests
 * Requirements: 1.5, 6.5, 8.3
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchSummary } from './BatchSummary'
import { BatchSummary as BatchSummaryType } from '../lib/batch/types'

describe('BatchSummary', () => {
  const createSummary = (overrides: Partial<BatchSummaryType> = {}): BatchSummaryType => ({
    total: 10,
    successful: 8,
    failed: 2,
    failedImages: [
      { filename: 'image1.jpg', error: 'File too large' },
      { filename: 'image2.jpg', error: 'Invalid format' },
    ],
    ...overrides,
  })

  it('renders nothing when not visible', () => {
    const { container } = render(
      <BatchSummary summary={createSummary()} visible={false} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when summary is null', () => {
    const { container } = render(
      <BatchSummary summary={null} visible={true} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('displays summary stats - Requirement 1.5', () => {
    render(<BatchSummary summary={createSummary()} visible={true} />)
    
    expect(screen.getByText(/Total:/i)).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy()
    expect(screen.getByText(/Successful:/i)).toBeTruthy()
    expect(screen.getByText('8')).toBeTruthy()
    expect(screen.getByText(/Failed:/i)).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('displays failed images list - Requirement 1.5', () => {
    render(<BatchSummary summary={createSummary()} visible={true} />)
    
    expect(screen.getByText(/Failed Images:/i)).toBeTruthy()
    expect(screen.getByText('image1.jpg')).toBeTruthy()
    expect(screen.getByText('File too large')).toBeTruthy()
    expect(screen.getByText('image2.jpg')).toBeTruthy()
    expect(screen.getByText('Invalid format')).toBeTruthy()
  })

  it('hides failed section when no failures', () => {
    const summary = createSummary({
      failed: 0,
      failedImages: [],
    })
    
    render(<BatchSummary summary={summary} visible={true} />)
    
    expect(screen.queryByText(/Failed:/i)).toBeNull()
    expect(screen.queryByText(/Failed Images:/i)).toBeNull()
  })

  it('shows success message when all images successful', () => {
    const summary = createSummary({
      total: 10,
      successful: 10,
      failed: 0,
      failedImages: [],
    })
    
    render(<BatchSummary summary={summary} visible={true} />)
    
    expect(screen.getByText(/All images processed successfully!/i)).toBeTruthy()
  })

  it('displays custom title when provided', () => {
    render(
      <BatchSummary
        summary={createSummary()}
        visible={true}
        title="Upload Results"
      />
    )
    
    expect(screen.getByText('Upload Results')).toBeTruthy()
  })

  it('displays default title when not provided', () => {
    render(<BatchSummary summary={createSummary()} visible={true} />)
    
    expect(screen.getByText('Batch Summary')).toBeTruthy()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <BatchSummary
        summary={createSummary()}
        visible={true}
        onClose={onClose}
      />
    )
    
    const closeButton = screen.getByLabelText(/Close summary/i)
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('hides close button when onClose not provided', () => {
    render(<BatchSummary summary={createSummary()} visible={true} />)
    
    expect(screen.queryByLabelText(/Close summary/i)).toBeNull()
  })

  it('displays completion summary after processing - Requirement 6.5', () => {
    const summary = createSummary({
      total: 20,
      successful: 18,
      failed: 2,
    })
    
    render(<BatchSummary summary={summary} visible={true} />)
    
    expect(screen.getByText('20')).toBeTruthy()
    expect(screen.getByText('18')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('shows which images were completed - Requirement 8.3', () => {
    const summary = createSummary({
      total: 5,
      successful: 3,
      failed: 2,
      failedImages: [
        { filename: 'failed1.jpg', error: 'Error 1' },
        { filename: 'failed2.jpg', error: 'Error 2' },
      ],
    })
    
    render(<BatchSummary summary={summary} visible={true} />)
    
    // Shows successful count (implicitly shows which were completed)
    expect(screen.getByText('3')).toBeTruthy()
    
    // Shows which failed (implicitly shows which were not completed)
    expect(screen.getByText('failed1.jpg')).toBeTruthy()
    expect(screen.getByText('failed2.jpg')).toBeTruthy()
  })

  it('handles empty failed images array', () => {
    const summary = createSummary({
      failed: 2,
      failedImages: [],
    })
    
    render(<BatchSummary summary={summary} visible={true} />)
    
    expect(screen.getByText(/Failed:/i)).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    // Should not show failed images list if array is empty
    expect(screen.queryByText(/Failed Images:/i)).toBeNull()
  })
})
