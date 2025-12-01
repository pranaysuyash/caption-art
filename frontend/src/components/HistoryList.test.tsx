/**
 * HistoryList Component Tests
 * Requirements: 3.1, 3.3, 3.4, 3.5
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HistoryList } from './HistoryList'
import { HistoryEntry } from '../lib/history/types'

describe('HistoryList', () => {
  const mockHistory: HistoryEntry[] = [
    {
      id: '1',
      timestamp: Date.now() - 180000, // 3 minutes ago (oldest)
      action: 'Image upload',
      state: {
        imageObjUrl: 'blob:test',
        maskUrl: '',
        text: '',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
    },
    {
      id: '2',
      timestamp: Date.now() - 120000, // 2 minutes ago
      action: 'Style change',
      state: {
        imageObjUrl: '',
        maskUrl: '',
        text: 'Hello',
        preset: 'magazine',
        fontSize: 48,
        captions: []
      }
    },
    {
      id: '3',
      timestamp: Date.now() - 60000, // 1 minute ago (most recent)
      action: 'Text change',
      state: {
        imageObjUrl: '',
        maskUrl: '',
        text: 'Hello',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
    }
  ]

  const defaultProps = {
    history: mockHistory,
    onJumpTo: vi.fn(),
  }

  it('displays list of recent actions - Requirement 3.1', () => {
    render(<HistoryList {...defaultProps} />)
    
    expect(screen.getByText('History')).toBeTruthy()
    expect(screen.getByText('Text change')).toBeTruthy()
    expect(screen.getByText('Style change')).toBeTruthy()
    expect(screen.getByText('Image upload')).toBeTruthy()
  })

  it('shows empty state when no history', () => {
    render(<HistoryList {...defaultProps} history={[]} />)
    
    expect(screen.getByText('No history yet')).toBeTruthy()
  })

  it('highlights current state - Requirement 3.4', () => {
    render(<HistoryList {...defaultProps} currentStateId="2" />)
    
    const currentBadge = screen.getByText('Current')
    expect(currentBadge).toBeTruthy()
  })

  it('calls onJumpTo when clicking a history entry - Requirement 3.5', () => {
    const onJumpTo = vi.fn()
    render(<HistoryList {...defaultProps} onJumpTo={onJumpTo} />)
    
    const textChangeButton = screen.getByText('Text change').closest('button')!
    fireEvent.click(textChangeButton)
    
    expect(onJumpTo).toHaveBeenCalledWith('3')
  })

  it('disables button for current state', () => {
    render(<HistoryList {...defaultProps} currentStateId="2" />)
    
    const styleChangeButton = screen.getByText('Style change').closest('button')!
    expect(styleChangeButton.disabled).toBe(true)
  })

  it('displays most recent entries first', () => {
    render(<HistoryList {...defaultProps} />)
    
    const buttons = screen.getAllByRole('button')
    const firstAction = buttons[0].textContent
    
    // First button should be the most recent action (id: '1' has the most recent timestamp)
    // The component reverses the array, so the first item in the original array appears first
    expect(firstAction).toContain('Text change')
  })

  it('limits displayed entries to maxEntries', () => {
    const manyEntries: HistoryEntry[] = Array.from({ length: 30 }, (_, i) => ({
      id: `${i}`,
      timestamp: Date.now() - i * 60000,
      action: `Action ${i}`,
      state: {
        imageObjUrl: '',
        maskUrl: '',
        text: '',
        preset: 'neon',
        fontSize: 48,
        captions: []
      }
    }))

    render(<HistoryList {...defaultProps} history={manyEntries} maxEntries={10} />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(10)
  })

  it('formats timestamps correctly', () => {
    render(<HistoryList {...defaultProps} />)
    
    // Should show relative time like "1m ago", "2m ago", etc.
    const timeElements = screen.getAllByText(/ago/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(
      <HistoryList {...defaultProps} className="custom-class" />
    )
    
    const historyList = container.querySelector('.history-list')
    expect(historyList?.className).toContain('custom-class')
  })
})
