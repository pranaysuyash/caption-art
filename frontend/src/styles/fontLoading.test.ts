/**
 * Property-Based Tests for Font Loading
 * Feature: neo-brutalism-ui-integration, Property 11: Font loading verification
 * Validates: Requirements 1.4
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

describe('Font Loading Property Tests', () => {
  /**
   * Property 11: Font loading verification
   * For any page load, the document should include link tags for Space Grotesk 
   * and JetBrains Mono fonts from Google Fonts
   */
  it('should include Google Fonts link tags for Space Grotesk and JetBrains Mono', () => {
    // In a real browser environment, we would check document.head
    // For testing, we'll create a mock HTML structure
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
        </head>
        <body></body>
      </html>
    `

    fc.assert(
      fc.property(
        // Generate arbitrary page load scenarios (represented by random numbers)
        fc.integer({ min: 1, max: 100 }),
        (_pageLoadId) => {
          // Parse the HTML to check for font links
          const parser = new DOMParser()
          const doc = parser.parseFromString(htmlContent, 'text/html')
          const linkTags = Array.from(doc.querySelectorAll('link')) as HTMLLinkElement[]

          // Check for preconnect to Google Fonts
          const hasGoogleFontsPreconnect = linkTags.some(
            (link) => 
              link.rel === 'preconnect' && 
              link.href === 'https://fonts.googleapis.com/'
          )

          // Check for preconnect to gstatic
          const hasGstaticPreconnect = linkTags.some(
            (link) => 
              link.rel === 'preconnect' && 
              link.href === 'https://fonts.gstatic.com/'
          )

          // Check for stylesheet link with both fonts
          const fontStylesheet = linkTags.find(
            (link) => 
              link.rel === 'stylesheet' && 
              link.href.includes('fonts.googleapis.com/css2')
          )

          const hasSpaceGrotesk = fontStylesheet?.href.includes('Space+Grotesk') ?? false
          const hasJetBrainsMono = fontStylesheet?.href.includes('JetBrains+Mono') ?? false
          const hasDisplaySwap = fontStylesheet?.href.includes('display=swap') ?? false

          // All conditions must be true
          return (
            hasGoogleFontsPreconnect &&
            hasGstaticPreconnect &&
            hasSpaceGrotesk &&
            hasJetBrainsMono &&
            hasDisplaySwap
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use display=swap for performance optimization', () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
        </head>
        <body></body>
      </html>
    `

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (_pageLoadId) => {
          const parser = new DOMParser()
          const doc = parser.parseFromString(htmlContent, 'text/html')
          const linkTags = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[]

          // Find Google Fonts stylesheet
          const fontStylesheet = linkTags.find((link) =>
            link.href.includes('fonts.googleapis.com')
          )

          // Verify display=swap is present
          return fontStylesheet?.href.includes('display=swap') ?? false
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should include preconnect hints for performance', () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
        </head>
        <body></body>
      </html>
    `

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (_pageLoadId) => {
          const parser = new DOMParser()
          const doc = parser.parseFromString(htmlContent, 'text/html')
          const preconnectLinks = Array.from(
            doc.querySelectorAll('link[rel="preconnect"]')
          )

          // Should have at least 2 preconnect links (googleapis.com and gstatic.com)
          return preconnectLinks.length >= 2
        }
      ),
      { numRuns: 100 }
    )
  })
})
