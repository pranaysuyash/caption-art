/**
 * Core types and interfaces for the Image Upload and Preprocessing System
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fileType?: string;
  fileSize?: number;
}

export interface OptimizationOptions {
  maxDimension: number;
  quality: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface OptimizationResult {
  optimizedImage: Blob;
  originalSize: number;
  optimizedSize: number;
  dimensions: { width: number; height: number };
}

export interface EXIFData {
  orientation: number;
  make?: string;
  model?: string;
  dateTime?: string;
}

export interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'validating' | 'optimizing' | 'complete' | 'error';
  progress: number;
  error?: string;
  optimizedSize?: number;
}

export interface UploadState {
  files: UploadFile[];
  isUploading: boolean;
  progress: number;
  error: string | null;
}
