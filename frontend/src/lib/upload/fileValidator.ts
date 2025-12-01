/**
 * File Validator
 * 
 * Validates uploaded files for type and size constraints.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2
 */

import { ValidationResult } from './types';

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export class FileValidator {
  /**
   * Validates a file for type and size constraints
   * @param file - The file to validate
   * @returns ValidationResult with valid flag and optional error message
   */
  static validate(file: File): ValidationResult {
    // Check file type first
    if (!this.isValidImageType(file)) {
      return {
        valid: false,
        error: 'Unsupported file type. Please use JPG, PNG, or WebP.',
        fileType: file.type,
        fileSize: file.size,
      };
    }

    // Check file size
    if (!this.isValidSize(file, MAX_FILE_SIZE)) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 10MB.',
        fileType: file.type,
        fileSize: file.size,
      };
    }

    // File is valid
    return {
      valid: true,
      fileType: file.type,
      fileSize: file.size,
    };
  }

  /**
   * Checks if the file is a valid image type (JPG, PNG, WebP)
   * @param file - The file to check
   * @returns true if the file type is supported
   */
  static isValidImageType(file: File): boolean {
    // Check MIME type
    if (SUPPORTED_FORMATS.includes(file.type)) {
      return true;
    }

    // Fallback: check file extension if MIME type is not set or generic
    const fileName = file.name.toLowerCase();
    return SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  }

  /**
   * Checks if the file size is within the allowed limit
   * @param file - The file to check
   * @param maxSize - Maximum allowed size in bytes
   * @returns true if the file size is within the limit
   */
  static isValidSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * Returns the list of supported image formats
   * @returns Array of supported MIME types
   */
  static getSupportedFormats(): string[] {
    return [...SUPPORTED_FORMATS];
  }
}
