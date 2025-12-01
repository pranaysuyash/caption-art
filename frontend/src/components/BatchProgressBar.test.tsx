/**
 * BatchProgressBar Component Tests
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BatchProgressBar } from './BatchProgressBar'
import { ProgressState } from '../lib/batch/progressTracker'

describe('BatchProgressBar', () => {
  const createProgressState = (overrides: Partial<ProgressState> = {}): ProgressState => ({
    currentIndex: 5,
    total: 10,
    successful: 4,
    failed: 1,
    currentFilename: 'test.jpg',
    percentage: 50,
    estimatedTimeRemaining: 5000,
    isComplete: false,
    ...overrides,
  })

  it('renders nothing when not visible', () => {
    const { container } = render(
      <BatchProgressBar progressState={createProgressState()} visible={false} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when progressState is null', () => {
    const { container } = render(
      <BatchProgressBar progressState={null} visible={true} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('displays progress bar - Requirement 6.1', () => {
    render(<BatchProgressBar progressState={createProgressState()} visible={true} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeTruthy()
  })

  it('displays correct percentage - Requirement 6.2', () => {
    render(<BatchProgressBar progressState={createProgressState({ percentage: 75 })} visible={true} />)
    
    expect(screen.getByText('75%')).toBeTruthy()
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar.getAttribute('aria-valuenow')).toBe('75')
  })

  it('displays current filename - Requirement 6.3', () => {
    render(
      <BatchProgressBar
        progressState={createProgressState({ currentFilename: 'image-123.jpg' })}
        visible={true}
      />
    )
    
    expect(screen.getByText('image-123.jpg')).toBeTruthy()
    expect(screen.getByText(/Processing:/i)).toBeTruthy()
  })

  it('displays progress count', () => {
    render(
      <BatchProgressBar
        progressState={createProgressState({ currentIndex: 7, total: 15 })}
        visible={true}
      />
    )
    
    expect(screen.getByText('7 / 15 images')).toBeTruthy()
  })

  it('displays time remaining - Requirement 6.4', () => {
    render(
      <BatchProgressBar
        progressState={createProgressState({ estimatedTimeRemaining: 65000 })}
        visible={true}
      />
    )
    
    expect(screen.getByText(/Time remaining:/i)).toBeTruthy()
    expect(screen.getByText(/1m 5s/i)).toBeTruthy()
  })

  it('hides time remaining when zero', () => {
    render(
      <BatchProgressBar
        progressState={createProgressState({ estimatedTimeRemaining: 0 })}
        visible={true}
      />
    )
    
    expect(screen.queryByText(/Time remaining:/i)).toBeNull()
  })

  it('displays completion summary - Requirement 6.5', () => {
    render(
      <BatchProgressBar
        progressState={createProgressState({
          isComplete: true,
          percentage: 100,
          successful: 8,
          failed: 2,
        })}
        visible={true}
      />
    )
    
    expect(screen.getByText(/Batch Complete/i)).toBeTruthy()
    expect(screen.getByText(/8 successful/i)).toBeTruthy()
    expect(screen.getByText(/2 failed/i)).toBeTruthy()
  })

  it('hides current filename when complete', () => {
    render(
      <BatchProgressBar
        progressState={createProgressState({
          isComplete: true,
          currentFilename: 'test.jpg',
        })}
        visible={true}
      />
    )
    
    expect(screen.queryByText('test.jpg')).toBeNull()
    expect(screen.queryByText(/Processing:/i)).toBeNull()
  })

  it('hides time remaining when complete', () => {
    render(
      <BatchProgressBar
        progressState={createProgressState({
          isComplete: true,
          estimatedTimeRemaining: 5000,
        })}
        visible={true}
      />
    )
    
    expect(screen.queryByText(/Time remaining:/i)).toBeNull()
  })

  it('shows only successful count when no failures', () => {
    render(
      <BatchProgressBar
        progressState={createProgressState({
          isComplete: true,
          successful: 10,
          failed: 0,
        })}
        visible={true}
      />
    )
    
    expect(screen.getByText(/10 successful/i)).toBeTruthy()
    expect(screen.queryByText(/failed/i)).toBeNull()
  })

  it('sets correct progress bar width', () => {
    const { container } = render(
      <BatchProgressBar
        progressState={createProgressState({ percentage: 33 })}
        visible={true}
      />
    )
    
    const progressFill = container.querySelector('.batch-progress-bar-fill') as HTMLElement
    expect(progressFill.style.width).toBe('33%')
  })

  it('displays processing header when not complete', () => {
    render(
      <BatchProgressBar
        progressState={createProgressState({ isComplete: false })}
        visible={true}
      />
    )
    
    expect(screen.getByText(/Processing Batch/i)).toBeTruthy()
  })
})
