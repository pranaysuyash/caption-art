/**
 * BatchControls Component Tests
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 5.1, 8.1, 8.2
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchControls } from './BatchControls'
import { StylePreset } from '../lib/canvas/types'

describe('BatchControls', () => {
  const defaultProps = {
    onApplyCaption: vi.fn(),
    onApplyStyle: vi.fn(),
    onExportAll: vi.fn(),
    onCancel: vi.fn(),
    isProcessing: false,
    batchSize: 5,
    currentCaption: '',
    currentPreset: 'neon' as StylePreset,
    currentFontSize: 48,
  }

  it('renders batch controls with correct batch size', () => {
    render(<BatchControls {...defaultProps} />)
    
    expect(screen.getByText('Batch Controls')).toBeTruthy()
    expect(screen.getByText('5 images')).toBeTruthy()
  })

  it('calls onApplyCaption when caption changes - Requirement 2.2', () => {
    const onApplyCaption = vi.fn()
    render(<BatchControls {...defaultProps} onApplyCaption={onApplyCaption} />)
    
    const input = screen.getByLabelText(/Caption/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'New caption' } })
    
    expect(onApplyCaption).toHaveBeenCalledWith('New caption')
  })

  it('calls onApplyStyle when preset changes - Requirement 3.1', () => {
    const onApplyStyle = vi.fn()
    render(<BatchControls {...defaultProps} onApplyStyle={onApplyStyle} />)
    
    const select = screen.getByLabelText(/Style Preset/i) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'retro' } })
    
    expect(onApplyStyle).toHaveBeenCalledWith('retro', 48)
  })

  it('calls onApplyStyle when font size changes - Requirement 3.2', () => {
    const onApplyStyle = vi.fn()
    render(<BatchControls {...defaultProps} onApplyStyle={onApplyStyle} />)
    
    const slider = screen.getByLabelText(/Font Size/i) as HTMLInputElement
    fireEvent.change(slider, { target: { value: '72' } })
    
    expect(onApplyStyle).toHaveBeenCalledWith('neon', 72)
  })

  it('calls onExportAll when export button clicked - Requirement 5.1', () => {
    const onExportAll = vi.fn()
    render(<BatchControls {...defaultProps} onExportAll={onExportAll} />)
    
    const exportButton = screen.getByText(/Export All/i)
    fireEvent.click(exportButton)
    
    expect(onExportAll).toHaveBeenCalledTimes(1)
  })

  it('disables controls when processing', () => {
    render(<BatchControls {...defaultProps} isProcessing={true} />)
    
    const captionInput = screen.getByLabelText(/Caption/i) as HTMLInputElement
    const presetSelect = screen.getByLabelText(/Style Preset/i) as HTMLSelectElement
    const fontSizeSlider = screen.getByLabelText(/Font Size/i) as HTMLInputElement
    const exportButton = screen.getByText(/Processing/i) as HTMLButtonElement
    
    expect(captionInput.disabled).toBe(true)
    expect(presetSelect.disabled).toBe(true)
    expect(fontSizeSlider.disabled).toBe(true)
    expect(exportButton.disabled).toBe(true)
  })

  it('shows cancel button when processing - Requirement 8.1', () => {
    const { rerender } = render(<BatchControls {...defaultProps} isProcessing={false} />)
    
    expect(screen.queryByText(/Cancel/i)).toBeNull()
    
    rerender(<BatchControls {...defaultProps} isProcessing={true} />)
    
    expect(screen.getByText(/Cancel/i)).toBeTruthy()
  })

  it('calls onCancel when cancel button clicked - Requirement 8.1', () => {
    const onCancel = vi.fn()
    render(<BatchControls {...defaultProps} isProcessing={true} onCancel={onCancel} />)
    
    const cancelButton = screen.getByText(/Cancel/i)
    fireEvent.click(cancelButton)
    
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables export button when batch is empty', () => {
    render(<BatchControls {...defaultProps} batchSize={0} />)
    
    const exportButton = screen.getByText(/Export All/i) as HTMLButtonElement
    expect(exportButton.disabled).toBe(true)
  })

  it('displays current caption value', () => {
    render(<BatchControls {...defaultProps} currentCaption="Test caption" />)
    
    const input = screen.getByLabelText(/Caption/i) as HTMLInputElement
    expect(input.value).toBe('Test caption')
  })

  it('displays current preset value', () => {
    render(<BatchControls {...defaultProps} currentPreset="bold" />)
    
    const select = screen.getByLabelText(/Style Preset/i) as HTMLSelectElement
    expect(select.value).toBe('bold')
  })

  it('displays current font size value', () => {
    render(<BatchControls {...defaultProps} currentFontSize={96} />)
    
    expect(screen.getByText(/Font Size: 96px/i)).toBeTruthy()
    const slider = screen.getByLabelText(/Font Size/i) as HTMLInputElement
    expect(slider.value).toBe('96')
  })
})
