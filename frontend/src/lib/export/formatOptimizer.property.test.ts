/**
 * Property-Based Tests for FormatOptimizer
 * Feature: export-download-system
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { FormatOptimizer } from './formatOptimizer'

describe('FormatOptimizer - Property-Based Tests', () => {
  /**
   * Property 2: Quality parameter application
   * For any JPEG export with quality Q, the optimizeJPEG function should
   * clamp quality to valid range (0.5-1.0) and return it as actualQuality
   * 
   * Validates: Requirements 2.4, 3.4
   */
  it('should apply quality parameter correctly for JPEG optimization', () => {
    fc.assert(
      fc.property(
        // Generate quality values across full range including invalid values
        fc.double({ min: -1, max: 2, noNaN: true }),
        // Generate sample data URLs
        fc.constantFrom(
          'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        ),
        (quality, dataUrl) => {
          const result = FormatOptimizer.optimizeJPEG(dataUrl, quality)
          
          // Property: actualQuality should be clamped to valid range [0.5, 1.0]
          expect(result.actualQuality).toBeGreaterThanOrEqual(0.5)
          expect(result.actualQuality).toBeLessThanOrEqual(1.0)
          
          // If input quality is within valid range, it should be preserved
          if (quality >= 0.5 && quality <= 1.0) {
            expect(result.actualQuality).toBeCloseTo(quality, 5)
          }
          
          // If input quality is below 0.5, it should be clamped to 0.5
          if (quality < 0.5) {
            expect(result.actualQuality).toBe(0.5)
          }
          
          // If input quality is above 1.0, it should be clamped to 1.0
          if (quality > 1.0) {
            expect(result.actualQuality).toBe(1.0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property: File size estimation should be consistent
   * For any data URL, estimateFileSize should return a positive number
   */
  it('should estimate file size consistently', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          'data:image/png;base64,ABC123',
          'data:image/jpeg;base64,XYZ789'
        ),
        (dataUrl) => {
          const size = FormatOptimizer.estimateFileSize(dataUrl)
          
          // File size should be non-negative
          expect(size).toBeGreaterThanOrEqual(0)
          
          // File size should be deterministic (same input = same output)
          const size2 = FormatOptimizer.estimateFileSize(dataUrl)
          expect(size).toBe(size2)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property: PNG optimization should preserve data URL
   * For any PNG data URL, optimizePNG should return the same data URL
   */
  it('should preserve PNG data URL during optimization', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'data:image/png;base64,ABC123DEF456',
          'data:image/png;base64,XYZ789'
        ),
        (dataUrl) => {
          const result = FormatOptimizer.optimizePNG(dataUrl)
          
          // PNG optimization should preserve the data URL (lossless)
          expect(result.dataUrl).toBe(dataUrl)
          
          // PNG should have quality 1.0 (lossless)
          expect(result.actualQuality).toBe(1.0)
          
          // File size should be estimated
          expect(result.fileSize).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
