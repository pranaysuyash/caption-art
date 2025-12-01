/**
 * Batch Processing System Types
 */

import { StylePreset, Transform } from '../canvas/types';

export interface BatchImage {
  id: string;
  file: File;
  thumbnail: string;
  status: 'pending' | 'valid' | 'invalid' | 'processing' | 'complete' | 'error';
  error?: string;
  validationResult?: {
    valid: boolean;
    error?: string;
    fileType?: string;
    fileSize?: number;
  };
  // Styling properties for individual customization
  caption?: string;
  style?: BatchStyle;
  transform?: Transform;
}

export interface BatchSummary {
  total: number;
  successful: number;
  failed: number;
  failedImages: Array<{
    filename: string;
    error: string;
  }>;
}

export interface BatchStyle {
  preset: StylePreset;
  fontSize: number;
}

export interface BatchStyleSettings {
  // Shared settings applied to all images
  sharedCaption?: string;
  sharedStyle?: BatchStyle;
  sharedTransform?: Transform;
  // Whether to allow per-image customization
  allowPerImageCustomization: boolean;
}

export interface BatchState {
  images: BatchImage[];
  summary: BatchSummary | null;
  isProcessing: boolean;
  styleSettings: BatchStyleSettings;
  // Cancellation support for batch operations
  isCancelled?: boolean;
}
