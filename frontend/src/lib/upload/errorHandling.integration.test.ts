/**
 * Error Handling Integration Tests
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * Tests the complete error handling flow from validation through display
 */

import { describe, it, expect } from 'vitest'
import { FileValidator } from './fileValidator'
import { BatchUploader } from './batchUploader'

describe('Error Handling Integration', () => {
  // Helper to create a mock file
  const createMockFile = (
    name: string,
    size: number,
    type: string
  ): File => {
    const blob = new Blob(['x'.repeat(size)], { type })
    return new File([blob], name, { type })
  }

  // Requirement 8.1: Invalid file type error
  it('should reject invalid file types with clear error message', () => {
    const pdfFile = createMockFile('document.pdf', 1024, 'application/pdf')
    const result = FileValidator.validate(pdfFile)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Unsupported file type. Please use JPG, PNG, or WebP.')
  })

  // Requirement 8.2: Oversized file error
  it('should reject oversized files with clear error message', () => {
    const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg')
    const result = FileValidator.validate(largeFile)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('File too large. Maximum size is 10MB.')
    expect(result.fileSize).toBe(15 * 1024 * 1024)
  })

  // Requirement 8.4: Too many files error
  it('should reject batch uploads exceeding maximum file count', async () => {
    const files = Array.from({ length: 15 }, (_, i) =>
      createMockFile(`image${i}.jpg`, 1024, 'image/jpeg')
    )

    await expect(
      BatchUploader.processFiles(files)
    ).rejects.toThrow('Too many files. Maximum 10 files per upload.')
  })

  // Requirement 8.1: Valid file types should pass
  it('should accept valid JPG files', () => {
    const jpgFile = createMockFile('photo.jpg', 1024, 'image/jpeg')
    const result = FileValidator.validate(jpgFile)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  // Requirement 8.1: Valid file types should pass
  it('should accept valid PNG files', () => {
    const pngFile = createMockFile('photo.png', 1024, 'image/png')
    const result = FileValidator.validate(pngFile)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  // Requirement 8.1: Valid file types should pass
  it('should accept valid WebP files', () => {
    const webpFile = createMockFile('photo.webp', 1024, 'image/webp')
    const result = FileValidator.validate(webpFile)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  // Requirement 8.2: Files under size limit should pass
  it('should accept files under 10MB', () => {
    const validFile = createMockFile('photo.jpg', 5 * 1024 * 1024, 'image/jpeg')
    const result = FileValidator.validate(validFile)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  // Requirement 8.2: Files at exactly 10MB should pass
  it('should accept files at exactly 10MB', () => {
    const validFile = createMockFile('photo.jpg', 10 * 1024 * 1024, 'image/jpeg')
    const result = FileValidator.validate(validFile)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  // Requirement 8.1: Multiple invalid file types
  it('should reject various invalid file types', () => {
    const invalidFiles = [
      createMockFile('doc.pdf', 1024, 'application/pdf'),
      createMockFile('video.mp4', 1024, 'video/mp4'),
      createMockFile('audio.mp3', 1024, 'audio/mp3'),
      createMockFile('text.txt', 1024, 'text/plain'),
    ]

    invalidFiles.forEach(file => {
      const result = FileValidator.validate(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Unsupported file type. Please use JPG, PNG, or WebP.')
    })
  })

  // Requirement 8.4: Batch processing with valid file count
  it('should accept batch uploads within maximum file count', async () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      createMockFile(`image${i}.jpg`, 1024, 'image/jpeg')
    )

    // This will fail during actual processing since we don't have real image data,
    // but it should not throw the "too many files" error
    const result = await BatchUploader.processFiles(files)
    
    expect(result.totalProcessed).toBe(5)
    // Files will fail validation/processing but not due to count
  })

  // Requirement 8.3: Batch processing continues after individual file failure
  it('should continue processing remaining files after one fails', async () => {
    const files = [
      createMockFile('invalid.pdf', 1024, 'application/pdf'), // Will fail validation
      createMockFile('valid.jpg', 1024, 'image/jpeg'),        // Will pass validation
      createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg'), // Will fail size check
    ]

    const result = await BatchUploader.processFiles(files)

    expect(result.totalProcessed).toBe(3)
    expect(result.failureCount).toBeGreaterThan(0)
    // At least the invalid.pdf and large.jpg should fail
    expect(result.results[0].success).toBe(false)
    expect(result.results[2].success).toBe(false)
  })

  // Requirement 8.5: Error messages should be descriptive
  it('should provide descriptive error messages for each error type', () => {
    const testCases = [
      {
        file: createMockFile('doc.pdf', 1024, 'application/pdf'),
        expectedError: 'Unsupported file type. Please use JPG, PNG, or WebP.',
      },
      {
        file: createMockFile('huge.jpg', 20 * 1024 * 1024, 'image/jpeg'),
        expectedError: 'File too large. Maximum size is 10MB.',
      },
    ]

    testCases.forEach(({ file, expectedError }) => {
      const result = FileValidator.validate(file)
      expect(result.error).toBe(expectedError)
    })
  })
})
