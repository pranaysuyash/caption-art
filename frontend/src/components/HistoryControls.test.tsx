/**
 * HistoryControls Component Tests
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.2, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HistoryControls } from './HistoryControls'

describe('HistoryControls', () => {
  const defaultProps = {
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: true,
    canRedo: true,
  }

  it('renders undo and redo buttons', () => {
    render(<HistoryControls {...defaultProps} />)
    
    expect(screen.getByText('Undo')).toBeTruthy()
    expect(screen.getByText('Redo')).toBeTruthy()
  })

  it('calls onUndo when undo button is clicked - Requirement 1.2', () => {
    const onUndo = vi.fn()
    render(<HistoryControls {...defaultProps} onUndo={onUndo} />)
    
    const undoButton = screen.getByText('Undo').closest('button')!
    fireEvent.click(undoButton)
    
    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('calls onRedo when redo button is clicked - Requirement 2.2', () => {
    const onRedo = vi.fn()
    render(<HistoryControls {...defaultProps} onRedo={onRedo} />)
    
    const redoButton = screen.getByText('Redo').closest('button')!
    fireEvent.click(redoButton)
    
    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it('disables undo button when canUndo is false - Requirement 1.3', () => {
    render(<HistoryControls {...defaultProps} canUndo={false} />)
    
    const undoButton = screen.getByText('Undo').closest('button')!
    expect(undoButton.disabled).toBe(true)
  })

  it('disables redo button when canRedo is false - Requirement 2.3', () => {
    render(<HistoryControls {...defaultProps} canRedo={false} />)
    
    const redoButton = screen.getByText('Redo').closest('button')!
    expect(redoButton.disabled).toBe(true)
  })

  it('shows action name in tooltip - Requirement 3.2', () => {
    render(
      <HistoryControls
        {...defaultProps}
        undoActionName="Text change"
        redoActionName="Style change"
      />
    )
    
    const undoButton = screen.getByText('Undo').closest('button')!
    const redoButton = screen.getByText('Redo').closest('button')!
    
    expect(undoButton.title).toContain('Text change')
    expect(redoButton.title).toContain('Style change')
  })

  it('applies correct CSS classes when buttons are enabled', () => {
    render(<HistoryControls {...defaultProps} />)
    
    const undoButton = screen.getByText('Undo').closest('button')!
    const redoButton = screen.getByText('Redo').closest('button')!
    
    expect(undoButton.className).toContain('button-secondary')
    expect(redoButton.className).toContain('button-secondary')
  })

  it('does not call onUndo when button is disabled', () => {
    const onUndo = vi.fn()
    render(<HistoryControls {...defaultProps} onUndo={onUndo} canUndo={false} />)
    
    const undoButton = screen.getByText('Undo').closest('button')!
    fireEvent.click(undoButton)
    
    expect(onUndo).not.toHaveBeenCalled()
  })

  it('does not call onRedo when button is disabled', () => {
    const onRedo = vi.fn()
    render(<HistoryControls {...defaultProps} onRedo={onRedo} canRedo={false} />)
    
    const redoButton = screen.getByText('Redo').closest('button')!
    fireEvent.click(redoButton)
    
    expect(onRedo).not.toHaveBeenCalled()
  })

  describe('Clear History', () => {
    it('renders clear button when onClear is provided - Requirement 6.1', () => {
      const onClear = vi.fn()
      render(<HistoryControls {...defaultProps} onClear={onClear} />)
      
      expect(screen.getByText('Clear')).toBeTruthy()
    })

    it('does not render clear button when onClear is not provided', () => {
      render(<HistoryControls {...defaultProps} />)
      
      expect(screen.queryByText('Clear')).toBeNull()
    })

    it('disables clear button when no history exists - Requirement 6.3, 6.4', () => {
      const onClear = vi.fn()
      render(<HistoryControls {...defaultProps} onClear={onClear} canUndo={false} canRedo={false} />)
      
      const clearButton = screen.getByText('Clear').closest('button')!
      expect(clearButton.disabled).toBe(true)
    })

    it('shows confirmation dialog when clear button is clicked - Requirement 6.1', () => {
      const onClear = vi.fn()
      render(<HistoryControls {...defaultProps} onClear={onClear} />)
      
      const clearButton = screen.getByText('Clear').closest('button')!
      fireEvent.click(clearButton)
      
      expect(screen.getByText('Clear History?')).toBeTruthy()
      expect(screen.getByText(/This will remove all undo\/redo history/)).toBeTruthy()
    })

    it('calls onClear when confirmation is accepted - Requirement 6.2', () => {
      const onClear = vi.fn()
      render(<HistoryControls {...defaultProps} onClear={onClear} />)
      
      // Click clear button
      const clearButton = screen.getByText('Clear').closest('button')!
      fireEvent.click(clearButton)
      
      // Click confirm button
      const confirmButton = screen.getByText('Clear History').closest('button')!
      fireEvent.click(confirmButton)
      
      expect(onClear).toHaveBeenCalledTimes(1)
    })

    it('does not call onClear when confirmation is cancelled - Requirement 6.5', () => {
      const onClear = vi.fn()
      render(<HistoryControls {...defaultProps} onClear={onClear} />)
      
      // Click clear button
      const clearButton = screen.getByText('Clear').closest('button')!
      fireEvent.click(clearButton)
      
      // Click cancel button
      const cancelButton = screen.getByText('Cancel').closest('button')!
      fireEvent.click(cancelButton)
      
      expect(onClear).not.toHaveBeenCalled()
    })

    it('closes confirmation dialog after confirming - Requirement 6.2', () => {
      const onClear = vi.fn()
      render(<HistoryControls {...defaultProps} onClear={onClear} />)
      
      // Click clear button
      const clearButton = screen.getByText('Clear').closest('button')!
      fireEvent.click(clearButton)
      
      // Click confirm button
      const confirmButton = screen.getByText('Clear History').closest('button')!
      fireEvent.click(confirmButton)
      
      // Dialog should be closed
      expect(screen.queryByText('Clear History?')).toBeNull()
    })

    it('closes confirmation dialog after cancelling - Requirement 6.5', () => {
      const onClear = vi.fn()
      render(<HistoryControls {...defaultProps} onClear={onClear} />)
      
      // Click clear button
      const clearButton = screen.getByText('Clear').closest('button')!
      fireEvent.click(clearButton)
      
      // Click cancel button
      const cancelButton = screen.getByText('Cancel').closest('button')!
      fireEvent.click(cancelButton)
      
      // Dialog should be closed
      expect(screen.queryByText('Clear History?')).toBeNull()
    })

    it('closes confirmation dialog when clicking overlay - Requirement 6.5', () => {
      const onClear = vi.fn()
      render(<HistoryControls {...defaultProps} onClear={onClear} />)
      
      // Click clear button
      const clearButton = screen.getByText('Clear').closest('button')!
      fireEvent.click(clearButton)
      
      // Click overlay
      const overlay = document.querySelector('.history-confirmation-overlay')!
      fireEvent.click(overlay)
      
      // Dialog should be closed
      expect(screen.queryByText('Clear History?')).toBeNull()
      expect(onClear).not.toHaveBeenCalled()
    })
  })
})
