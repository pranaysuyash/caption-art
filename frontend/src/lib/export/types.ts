/**
 * Export and Download System - Core Types and Interfaces
 * 
 * This module defines the core types and interfaces for the export system
 * that converts canvas compositions to downloadable image files.
 */

/**
 * Configuration for export operations
 * Validates: Requirements 1.1, 2.1, 2.2, 2.3, 2.4, 2.5
 */
export interface ExportConfig {
  /** Image format: PNG (lossless) or JPEG (lossy) */
  format: 'png' | 'jpeg';
  
  /** Quality setting for JPEG exports (0-1 scale, default 0.92) */
  quality: number;
  
  /** Maximum dimension for exported images (default 1080px) */
  maxDimension: number;
  
  /** Whether to apply watermark (for free tier users) */
  watermark: boolean;
  
  /** Text to display in watermark */
  watermarkText: string;
}

/**
 * Result of an export operation
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */
export interface ExportResult {
  /** Whether the export completed successfully */
  success: boolean;
  
  /** Generated filename for the exported image */
  filename: string;
  
  /** Estimated file size in bytes */
  fileSize: number;
  
  /** Format of the exported image */
  format: string;
  
  /** Error message if export failed, null otherwise */
  error: string | null;
}

/**
 * Progress information during export
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */
export interface ExportProgress {
  /** Current stage of the export process */
  stage: 'preparing' | 'watermarking' | 'converting' | 'downloading' | 'complete';
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** User-friendly message describing current stage */
  message: string;
}

/**
 * State of the export system
 * Tracks current export operation and history
 */
export interface ExportState {
  /** Whether an export is currently in progress */
  isExporting: boolean;
  
  /** Current progress information, null if not exporting */
  progress: ExportProgress | null;
  
  /** Result of the last export operation, null if none */
  lastExport: ExportResult | null;
  
  /** Current error message, null if no error */
  error: string | null;
}

/**
 * Format-specific settings and capabilities
 * Defines supported formats and their constraints
 */
export interface FormatSettings {
  /** PNG format settings */
  png: {
    /** Whether PNG export is supported */
    supported: boolean;
    
    /** Maximum file size in bytes */
    maxSize: number;
    
    /** Compression type (browser default) */
    compression: 'default';
  };
  
  /** JPEG format settings */
  jpeg: {
    /** Whether JPEG export is supported */
    supported: boolean;
    
    /** Maximum file size in bytes */
    maxSize: number;
    
    /** Default quality setting (0-1) */
    quality: number;
    
    /** Minimum allowed quality (0-1) */
    minQuality: number;
    
    /** Maximum allowed quality (0-1) */
    maxQuality: number;
  };
}
