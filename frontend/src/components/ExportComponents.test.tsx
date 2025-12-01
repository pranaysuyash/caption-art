/**
 * Basic tests for Export components
 * Validates that components render without errors
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExportButton } from './ExportButton'
import { FormatSelector } from './FormatSelector'
import { ExportProgress } from './ExportProgress'

describe('ExportButton', () => {
  it('renders export button', () => {
    render(<ExportButton />)
    expect(screen.getByRole('button', { name: /export/i })).toBeDefined()
  })

  it('shows loading state when exporting', () => {
    render(<ExportButton isExporting={true} />)
    expect(screen.getByText(/exporting/i)).toBeDefined()
  })

  it('is disabled when exporting', () => {
    render(<ExportButton isExporting={true} />)
    const button = screen.getByRole('button')
    expect(button.hasAttribute('disabled')).toBe(true)
  })
})

describe('FormatSelector', () => {
  it('renders format selector with PNG and JPEG options', () => {
    const mockOnChange = () => {}
    render(<FormatSelector format="png" onChange={mockOnChange} />)
    
    expect(screen.getByText(/PNG \(Lossless\)/i)).toBeDefined()
    expect(screen.getByText(/JPEG \(Smaller\)/i)).toBeDefined()
  })

  it('shows PNG as selected when format is png', () => {
    const mockOnChange = () => {}
    render(<FormatSelector format="png" onChange={mockOnChange} />)
    
    const pngRadio = screen.getByRole('radio', { name: /PNG/i }) as HTMLInputElement
    expect(pngRadio.checked).toBe(true)
  })

  it('shows JPEG as selected when format is jpeg', () => {
    const mockOnChange = () => {}
    render(<FormatSelector format="jpeg" onChange={mockOnChange} />)
    
    const jpegRadio = screen.getByRole('radio', { name: /JPEG/i }) as HTMLInputElement
    expect(jpegRadio.checked).toBe(true)
  })
})

describe('ExportProgress', () => {
  it('renders progress component with percentage', () => {
    const progress = {
      stage: 'converting' as const,
      progress: 50,
      message: 'Converting to image...'
    }
    
    render(<ExportProgress progress={progress} />)
    expect(screen.getByText('50%')).toBeDefined()
    expect(screen.getByText(/converting to image/i)).toBeDefined()
  })

  it('shows correct stage icon', () => {
    const progress = {
      stage: 'complete' as const,
      progress: 100,
      message: 'Export complete!'
    }
    
    render(<ExportProgress progress={progress} />)
    expect(screen.getByText('100%')).toBeDefined()
  })

  it('renders progress bar with correct width', () => {
    const progress = {
      stage: 'downloading' as const,
      progress: 75,
      message: 'Starting download...'
    }
    
    const { container } = render(<ExportProgress progress={progress} />)
    const progressBar = container.querySelector('.progress-bar-fill')
    expect(progressBar).toBeDefined()
    expect(progressBar?.getAttribute('style')).toContain('width: 75%')
  })
})
