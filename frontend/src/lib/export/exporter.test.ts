/**
 * Unit tests for Exporter class
 * Tests full export pipeline, progress reporting, abort functionality, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Exporter } from './exporter';
import type { ExportConfig, ExportProgress } from './types';

// Mock the dependencies
vi.mock('./canvasConverter', () => ({
  CanvasConverter: {
    toDataURL: vi.fn((canvas: HTMLCanvasElement, options: any) => {
      return `data:image/${options.format};base64,mockBase64Data`;
    }),
    toBlob: vi.fn(),
    scaleCanvas: vi.fn((canvas: HTMLCanvasElement) => canvas)
  }
}));

vi.mock('./formatOptimizer', () => ({
  FormatOptimizer: {
    optimizePNG: vi.fn((dataUrl: string) => ({
      dataUrl,
      fileSize: 1024,
      dimensions: { width: 100, height: 100 },
      actualQuality: 1.0
    })),
    optimizeJPEG: vi.fn((dataUrl: string, quality: number) => ({
      dataUrl,
      fileSize: 512,
      dimensions: { width: 100, height: 100 },
      actualQuality: quality
    })),
    estimateFileSize: vi.fn(() => 1024)
  }
}));

vi.mock('./filenameGenerator', () => ({
  FilenameGenerator: {
    generate: vi.fn(() => 'caption-art-20250127-143022.png')
  }
}));

vi.mock('./downloadTrigger', () => ({
  DownloadTrigger: {
    trigger: vi.fn()
  }
}));

vi.mock('./workerManager', () => ({
  WorkerManager: vi.fn().mockImplementation(() => ({
    isSupported: () => false,
    initialize: () => Promise.resolve(),
    scaleCanvas: vi.fn(),
    terminate: vi.fn()
  }))
}));

describe('Exporter', () => {
  let exporter: Exporter;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create a mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    
    // Mock the context
    mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([255, 255, 255, 255]) // Non-transparent pixel
      })),
      fillText: vi.fn(),
      fillStyle: '',
      font: '',
      textAlign: 'left' as CanvasTextAlign,
      textBaseline: 'alphabetic' as CanvasTextBaseline
    } as any;
    
    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
    vi.spyOn(mockCanvas, 'toDataURL').mockReturnValue('data:image/png;base64,mockData');
    
    // Create fresh exporter instance
    exporter = new Exporter();
  });

  describe('Full Export Pipeline', () => {
    it('should successfully export a canvas as PNG', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(mockCanvas, config);

      expect(result.success).toBe(true);
      expect(result.filename).toBe('caption-art-20250127-143022.png');
      expect(result.format).toBe('png');
      expect(result.error).toBeNull();
    });

    it('should successfully export a canvas as JPEG', async () => {
      const config: ExportConfig = {
        format: 'jpeg',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(mockCanvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
      expect(result.error).toBeNull();
    });

    it('should apply watermark when requested', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: true,
        watermarkText: 'Test Watermark'
      };

      const result = await exporter.export(mockCanvas, config);

      expect(result.success).toBe(true);
      // Watermark is applied by drawing text on canvas
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('should include file size in result', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(mockCanvas, config);

      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('Progress Reporting', () => {
    it('should report all progress stages in order', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const progressStages: string[] = [];
      const onProgress = (progress: ExportProgress) => {
        progressStages.push(progress.stage);
      };

      await exporter.export(mockCanvas, config, onProgress);

      expect(progressStages).toContain('preparing');
      expect(progressStages).toContain('converting');
      expect(progressStages).toContain('downloading');
      expect(progressStages).toContain('complete');
    });

    it('should report watermarking stage when watermark is enabled', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: true,
        watermarkText: 'Test'
      };

      const progressStages: string[] = [];
      const onProgress = (progress: ExportProgress) => {
        progressStages.push(progress.stage);
      };

      await exporter.export(mockCanvas, config, onProgress);

      expect(progressStages).toContain('watermarking');
    });

    it('should report increasing progress values', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const progressValues: number[] = [];
      const onProgress = (progress: ExportProgress) => {
        progressValues.push(progress.progress);
      };

      await exporter.export(mockCanvas, config, onProgress);

      // Progress should increase
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
      }
      
      // Final progress should be 100
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });

    it('should include descriptive messages in progress updates', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const messages: string[] = [];
      const onProgress = (progress: ExportProgress) => {
        messages.push(progress.message);
      };

      await exporter.export(mockCanvas, config, onProgress);

      expect(messages.some(m => m.includes('Preparing'))).toBe(true);
      expect(messages.some(m => m.includes('Converting'))).toBe(true);
      expect(messages.some(m => m.includes('download'))).toBe(true);
      expect(messages.some(m => m.includes('complete'))).toBe(true);
    });
  });

  describe('Abort Functionality', () => {
    it('should abort export when abort() is called', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      // Start export and abort immediately
      const exportPromise = exporter.export(mockCanvas, config);
      exporter.abort();

      const result = await exportPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('aborted');
    });

    it('should allow new exports after abort', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      // First export - abort it
      const firstExport = exporter.export(mockCanvas, config);
      exporter.abort();
      await firstExport;

      // Second export - should succeed
      const secondExport = await exporter.export(mockCanvas, config);
      expect(secondExport.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty canvas error', async () => {
      // Create empty canvas (all transparent)
      const emptyCanvas = document.createElement('canvas');
      emptyCanvas.width = 100;
      emptyCanvas.height = 100;
      
      const emptyContext = {
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(100 * 100 * 4) // All zeros (transparent)
        }))
      } as any;
      
      vi.spyOn(emptyCanvas, 'getContext').mockReturnValue(emptyContext);

      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(emptyCanvas, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('upload an image');
    });

    it('should handle canvas with no context', async () => {
      const badCanvas = document.createElement('canvas');
      vi.spyOn(badCanvas, 'getContext').mockReturnValue(null);

      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(badCanvas, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Canvas error');
    });

    it('should return user-friendly error messages', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      // Mock toDataURL to throw an error
      vi.spyOn(mockCanvas, 'toDataURL').mockImplementation(() => {
        throw new Error('toDataURL failed');
      });

      const result = await exporter.export(mockCanvas, config);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      // Error should be user-friendly (no technical jargon)
      expect(result.error).not.toContain('toDataURL');
      expect(result.error).toContain('Failed to generate image');
    });

    it('should handle memory errors gracefully', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      // Mock toDataURL to throw memory error
      vi.spyOn(mockCanvas, 'toDataURL').mockImplementation(() => {
        throw new Error('Out of memory');
      });

      const result = await exporter.export(mockCanvas, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('too large');
    });
  });

  describe('Export Queue', () => {
    it('should queue multiple exports and process them sequentially', async () => {
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      // Start multiple exports simultaneously
      const export1 = exporter.export(mockCanvas, config);
      const export2 = exporter.export(mockCanvas, config);
      const export3 = exporter.export(mockCanvas, config);

      const results = await Promise.all([export1, export2, export3]);

      // All should succeed
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when clearCache() is called', () => {
      // This is a public method, so we can test it directly
      expect(() => exporter.clearCache()).not.toThrow();
    });

    it('should terminate worker when terminate() is called', () => {
      expect(() => exporter.terminate()).not.toThrow();
    });
  });
});
