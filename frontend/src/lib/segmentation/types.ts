/**
 * Core types and interfaces for the Image Segmentation and Masking System
 */

/**
 * Result of mask generation
 */
export interface MaskResult {
  maskUrl: string;
  maskImage: HTMLImageElement;
  generationTime: number;
  quality: 'high' | 'medium' | 'low';
}

/**
 * State of mask generation and display
 */
export interface MaskState {
  status: 'idle' | 'generating' | 'complete' | 'error';
  maskUrl: string | null;
  maskImage: HTMLImageElement | null;
  quality: 'high' | 'medium' | 'low' | null;
  error: string | null;
  progress: number; // 0-100
  previewEnabled: boolean;
  textBehindEnabled: boolean;
}

/**
 * Validation result for mask images
 */
export interface MaskValidation {
  isValid: boolean;
  hasAlphaChannel: boolean;
  dimensions: { width: number; height: number };
  quality: 'high' | 'medium' | 'low';
  errors: string[];
}

/**
 * Segmentation error types and details
 */
export interface SegmentationError {
  type: 'replicate' | 'download' | 'validation' | 'network' | 'timeout';
  message: string;
  retryable: boolean;
  retryAfter?: number;
}
