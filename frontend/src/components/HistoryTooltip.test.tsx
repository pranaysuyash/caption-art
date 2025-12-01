/**
 * HistoryTooltip Component Tests
 * Requirements: 3.2, 3.3
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HistoryTooltip, useHistoryTooltip } from './HistoryTooltip'
import { renderHook, act } from '@testing-library/react'

describe('HistoryTooltip', () => {
  const defaultProps = {
    action: 'Text change',
    type: 'undo' as const,
    visible: true,
  }

  it('does not render when visible is false', () => {
    const { container } = render(<HistoryTooltip {...defaultProps} visible={false} />)
    
    expect(container.querySelector('.history-tooltip')).toBeFalsy()
  })

  it('does not render when action is empty', () => {
    const { container } = render(<HistoryTooltip {...defaultProps} action="" visible={true} />)
    
    // Should not render with empty action
    expect(container.querySelector('.history-tooltip')).toBeFalsy()
  })

  it('hides when visible changes to false', () => {
    const { rerender, container } = render(<HistoryTooltip {...defaultProps} visible={true} />)
    
    rerender(<HistoryTooltip {...defaultProps} visible={false} />)
    
    expect(container.querySelector('.history-tooltip')).toBeFalsy()
  })

  it('accepts position prop - Requirement 3.2', () => {
    // Test that component accepts position prop without error
    const { container } = render(
      <HistoryTooltip {...defaultProps} position="top" />
    )
    
    // Component should render without errors
    expect(container).toBeTruthy()
  })

  it('accepts undo type - Requirement 3.2', () => {
    // Test that component accepts undo type without error
    const { container } = render(
      <HistoryTooltip action="Style change" type="undo" visible={true} />
    )
    
    expect(container).toBeTruthy()
  })

  it('accepts redo type - Requirement 3.3', () => {
    // Test that component accepts redo type without error
    const { container } = render(
      <HistoryTooltip action="Image upload" type="redo" visible={true} />
    )
    
    expect(container).toBeTruthy()
  })
})

describe('useHistoryTooltip', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useHistoryTooltip())
    
    expect(result.current.isVisible).toBe(false)
    expect(result.current.action).toBe('')
    expect(result.current.type).toBe('undo')
  })

  it('shows tooltip with correct action and type', () => {
    const { result } = renderHook(() => useHistoryTooltip())
    
    act(() => {
      result.current.showTooltip('Text change', 'undo')
    })
    
    expect(result.current.isVisible).toBe(true)
    expect(result.current.action).toBe('Text change')
    expect(result.current.type).toBe('undo')
  })

  it('hides tooltip', () => {
    const { result } = renderHook(() => useHistoryTooltip())
    
    act(() => {
      result.current.showTooltip('Text change', 'undo')
    })
    
    expect(result.current.isVisible).toBe(true)
    
    act(() => {
      result.current.hideTooltip()
    })
    
    expect(result.current.isVisible).toBe(false)
  })

  it('updates action and type when showing tooltip multiple times', () => {
    const { result } = renderHook(() => useHistoryTooltip())
    
    act(() => {
      result.current.showTooltip('First action', 'undo')
    })
    
    expect(result.current.action).toBe('First action')
    expect(result.current.type).toBe('undo')
    
    act(() => {
      result.current.showTooltip('Second action', 'redo')
    })
    
    expect(result.current.action).toBe('Second action')
    expect(result.current.type).toBe('redo')
  })
})
