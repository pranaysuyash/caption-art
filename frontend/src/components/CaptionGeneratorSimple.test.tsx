import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CaptionGenerator } from './CaptionGeneratorSimple'
import * as captionClient from '../lib/api/captionClient'

// Mock the caption client
vi.mock('../lib/api/captionClient', () => ({
  captionClient: {
    generate: vi.fn()
  }
}))

describe('CaptionGenerator - Sidebar Optimization', () => {
  it('should limit visible captions to 3 by default', async () => {
    // Mock caption generation with 5 captions (1 base + 4 variants)
    vi.mocked(captionClient.captionClient.generate).mockResolvedValue({
      baseCaption: 'Base caption',
      variants: ['Variant 1', 'Variant 2', 'Variant 3', 'Variant 4'],
      generationTime: 1000
    })

    const onCaptionSelect = vi.fn()
    render(
      <CaptionGenerator
        imageDataUrl="data:image/png;base64,test"
        onCaptionSelect={onCaptionSelect}
      />
    )

    // Wait for captions to load
    await waitFor(() => {
      expect(screen.getByText('Base caption')).toBeInTheDocument()
    })

    // Should show 3 captions (base + 2 variants)
    const captionCards = screen.getAllByRole('button', { name: /Select.*caption/ })
    expect(captionCards).toHaveLength(3)
    expect(screen.getByRole('button', { name: /Select Original Description caption/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Select Variant 1 caption/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Select Variant 2 caption/ })).toBeInTheDocument()

    // Should NOT show variants 3 and 4 initially
    expect(screen.queryByRole('button', { name: /Select Variant 3 caption/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Select Variant 4 caption/ })).not.toBeInTheDocument()

    // Should show "Show More" button
    expect(screen.getByText(/Show More/)).toBeInTheDocument()
  })

  it('should show all captions when "Show More" is clicked', async () => {
    vi.mocked(captionClient.captionClient.generate).mockResolvedValue({
      baseCaption: 'Base caption',
      variants: ['Variant 1', 'Variant 2', 'Variant 3', 'Variant 4'],
      generationTime: 1000
    })

    const onCaptionSelect = vi.fn()
    const user = userEvent.setup()
    
    render(
      <CaptionGenerator
        imageDataUrl="data:image/png;base64,test"
        onCaptionSelect={onCaptionSelect}
      />
    )

    // Wait for captions to load
    await waitFor(() => {
      expect(screen.getByText('Base caption')).toBeInTheDocument()
    })

    // Click "Show More"
    const showMoreButton = screen.getByText(/Show More/)
    await user.click(showMoreButton)

    // Should now show all captions
    const allCaptionCards = screen.getAllByRole('button', { name: /Select.*caption/ })
    expect(allCaptionCards).toHaveLength(5)
    expect(screen.getByRole('button', { name: /Select Variant 3 caption/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Select Variant 4 caption/ })).toBeInTheDocument()

    // Should show "Show Less" button
    expect(screen.getByText('Show Less')).toBeInTheDocument()
  })

  it('should hide extra captions when "Show Less" is clicked', async () => {
    vi.mocked(captionClient.captionClient.generate).mockResolvedValue({
      baseCaption: 'Base caption',
      variants: ['Variant 1', 'Variant 2', 'Variant 3', 'Variant 4'],
      generationTime: 1000
    })

    const onCaptionSelect = vi.fn()
    const user = userEvent.setup()
    
    render(
      <CaptionGenerator
        imageDataUrl="data:image/png;base64,test"
        onCaptionSelect={onCaptionSelect}
      />
    )

    // Wait for captions to load
    await waitFor(() => {
      expect(screen.getByText('Base caption')).toBeInTheDocument()
    })

    // Click "Show More"
    await user.click(screen.getByText(/Show More/))

    // Verify all captions are visible
    expect(screen.getByRole('button', { name: /Select Variant 3 caption/ })).toBeInTheDocument()

    // Click "Show Less"
    await user.click(screen.getByText('Show Less'))

    // Should hide variants 3 and 4 again
    const reducedCaptionCards = screen.getAllByRole('button', { name: /Select.*caption/ })
    expect(reducedCaptionCards).toHaveLength(3)
    expect(screen.queryByRole('button', { name: /Select Variant 3 caption/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Select Variant 4 caption/ })).not.toBeInTheDocument()
  })

  it('should not show "Show More" button when there are 3 or fewer captions', async () => {
    vi.mocked(captionClient.captionClient.generate).mockResolvedValue({
      baseCaption: 'Base caption',
      variants: ['Variant 1', 'Variant 2'],
      generationTime: 1000
    })

    const onCaptionSelect = vi.fn()
    
    render(
      <CaptionGenerator
        imageDataUrl="data:image/png;base64,test"
        onCaptionSelect={onCaptionSelect}
      />
    )

    // Wait for captions to load
    await waitFor(() => {
      expect(screen.getByText('Base caption')).toBeInTheDocument()
    })

    // Should NOT show "Show More" button
    expect(screen.queryByText(/Show More/)).not.toBeInTheDocument()
  })

  it('should reset showAll state when new image is uploaded', async () => {
    let callCount = 0
    vi.mocked(captionClient.captionClient.generate).mockImplementation(async () => {
      callCount++
      return {
        baseCaption: `Base caption ${callCount}`,
        variants: [`Variant 1-${callCount}`, `Variant 2-${callCount}`, `Variant 3-${callCount}`, `Variant 4-${callCount}`],
        generationTime: 1000
      }
    })

    const onCaptionSelect = vi.fn()
    const user = userEvent.setup()
    
    const { rerender } = render(
      <CaptionGenerator
        imageDataUrl="data:image/png;base64,test1"
        onCaptionSelect={onCaptionSelect}
      />
    )

    // Wait for captions to load
    await waitFor(() => {
      const cards = screen.getAllByRole('button', { name: /Select.*caption/ })
      expect(cards).toHaveLength(3)
    })

    // Click "Show More"
    await user.click(screen.getByText(/Show More/))
    
    // Verify all 5 captions are shown
    await waitFor(() => {
      const allCards = screen.getAllByRole('button', { name: /Select.*caption/ })
      expect(allCards).toHaveLength(5)
    })

    // Upload new image
    rerender(
      <CaptionGenerator
        imageDataUrl="data:image/png;base64,test2"
        onCaptionSelect={onCaptionSelect}
      />
    )

    // Wait for new captions to load and verify only 3 are shown
    await waitFor(() => {
      const resetCaptionCards = screen.getAllByRole('button', { name: /Select.*caption/ })
      expect(resetCaptionCards).toHaveLength(3)
    }, { timeout: 3000 })
    
    // Verify "Show More" button is present
    expect(screen.getByText(/Show More/)).toBeInTheDocument()
  })
})
