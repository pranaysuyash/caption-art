/**
 * Image Segmentation and Masking System
 * 
 * Exports the main components for mask generation
 */

export { MaskGenerator, type MaskGeneratorConfig } from './maskGenerator';
export { RembgClient, type RembgPrediction } from './clients/rembgClient';
export { MaskCache, type MaskCacheEntry, type CacheStats } from './maskCache';
export { MaskProcessor } from './maskProcessor';
export { MaskPreview, type PreviewOptions } from './maskPreview';
export { WorkerManager } from './workerManager';
export type { MaskResult, MaskState, MaskValidation, SegmentationError } from './types';
