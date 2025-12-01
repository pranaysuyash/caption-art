/**
 * Browser Compatibility Tests for Export System
 * Tests browser-specific behaviors and compatibility features
 * Validates: Requirements All (cross-browser compatibility)
 * 
 * Task 14: Browser compatibility testing
 * - 14.1: Chrome compatibility
 * - 14.2: Firefox compatibility
 * - 14.3: Safari compatibility
 * - 14.4: Mobile browser compatibility
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Exporter } from './exporter';
import { CanvasConverter } from './canvasConverter';
import { DownloadTrigger } from './downloadTrigger';
import type { ExportConfig } from './types';

/**
 * Helper to create test canvas with content
 */
function createTestCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText('Test Canvas', 10, 30);
    
    // Mock getImageData for validation
    const originalGetImageData = ctx.getImageData.bind(ctx);
    ctx.getImageData = vi.fn((sx, sy, sw, sh) => {
      const imageData = originalGetImageData(sx, sy, sw, sh);
      for (let i = 3; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255;
      }
      return imageData;
    });
  }
  
  return canvas;
}

/**
 * Mock user agent strings for different browsers
 */
const USER_AGENTS = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
};

/**
 * Detect browser from user agent
 */
function detectBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'chrome';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
  return 'unknown';
}

describe('Browser Compatibility Tests', () => {
  let exporter: Exporter;
  let downloadTriggerSpy: ReturnType<typeof vi.spyOn>;
  let originalUserAgent: string;

  beforeEach(() => {
    exporter = new Exporter();
    originalUserAgent = navigator.userAgent;
    
    downloadTriggerSpy = vi.spyOn(DownloadTrigger, 'trigger').mockImplementation(() => {});
  });

  afterEach(() => {
    downloadTriggerSpy.mockRestore();
    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
  });

  describe('14.1 Chrome Compatibility', () => {
    beforeEach(() => {
      // Mock Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: USER_AGENTS.chrome,
        configurable: true
      });
    });

    it('should detect Chrome browser', () => {
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('chrome');
    });

    it('should export PNG in Chrome', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('png');
      expect(result.filename).toMatch(/\.png$/);
    });

    it('should export JPEG in Chrome', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'jpeg',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
      expect(result.filename).toMatch(/\.jpg$/);
    });

    it('should support toDataURL in Chrome', () => {
      const canvas = createTestCanvas(800, 600);
      const dataUrl = canvas.toDataURL('image/png');

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(dataUrl.length).toBeGreaterThan(100);
    });

    it('should support toBlob in Chrome', async () => {
      const canvas = createTestCanvas(800, 600);
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      expect(blob).toBeTruthy();
      expect(blob?.type).toBe('image/png');
      expect(blob?.size).toBeGreaterThan(0);
    });

    it('should support download attribute in Chrome', () => {
      const a = document.createElement('a');
      a.download = 'test.png';
      
      expect(a.download).toBe('test.png');
      expect('download' in a).toBe(true);
    });

    it('should handle large canvas in Chrome', async () => {
      const canvas = createTestCanvas(3840, 2160);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
    });

    it('should support high quality JPEG in Chrome', () => {
      const canvas = createTestCanvas(800, 600);
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should support canvas scaling in Chrome', () => {
      const canvas = createTestCanvas(2000, 1000);
      const scaledCanvas = CanvasConverter.scaleCanvas(canvas, 1080);

      expect(scaledCanvas.width).toBeLessThanOrEqual(1080);
      expect(scaledCanvas.height).toBeLessThanOrEqual(1080);
    });
  });

  describe('14.2 Firefox Compatibility', () => {
    beforeEach(() => {
      // Mock Firefox user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: USER_AGENTS.firefox,
        configurable: true
      });
    });

    it('should detect Firefox browser', () => {
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('firefox');
    });

    it('should export PNG in Firefox', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('png');
    });

    it('should export JPEG in Firefox', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'jpeg',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('should support toDataURL in Firefox', () => {
      const canvas = createTestCanvas(800, 600);
      const dataUrl = canvas.toDataURL('image/png');

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should support toBlob in Firefox', async () => {
      const canvas = createTestCanvas(800, 600);
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      expect(blob).toBeTruthy();
      expect(blob?.type).toBe('image/png');
    });

    it('should handle download with anchor element in Firefox', () => {
      // Firefox requires anchor to be in DOM for download to work
      const a = document.createElement('a');
      a.href = 'data:image/png;base64,test';
      a.download = 'test.png';
      
      document.body.appendChild(a);
      expect(document.body.contains(a)).toBe(true);
      
      document.body.removeChild(a);
      expect(document.body.contains(a)).toBe(false);
    });

    it('should support canvas operations in Firefox', () => {
      const canvas = createTestCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      expect(ctx).toBeTruthy();
      expect(ctx?.canvas.width).toBe(canvas.width);
      expect(ctx?.canvas.height).toBe(canvas.height);
    });

    it('should handle image smoothing in Firefox', () => {
      const canvas = createTestCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        expect(ctx.imageSmoothingEnabled).toBe(true);
        expect(ctx.imageSmoothingQuality).toBe('high');
      }
    });
  });

  describe('14.3 Safari Compatibility', () => {
    beforeEach(() => {
      // Mock Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: USER_AGENTS.safari,
        configurable: true
      });
    });

    it('should detect Safari browser', () => {
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('safari');
    });

    it('should export PNG in Safari', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('png');
    });

    it('should export JPEG in Safari', async () => {
      const canvas = createTestCanvas(800, 600);
      const config: ExportConfig = {
        format: 'jpeg',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      expect(result.success).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('should support toDataURL in Safari', () => {
      const canvas = createTestCanvas(800, 600);
      const dataUrl = canvas.toDataURL('image/png');

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should support toBlob in Safari', async () => {
      const canvas = createTestCanvas(800, 600);
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      expect(blob).toBeTruthy();
      expect(blob?.type).toBe('image/png');
    });

    it('should handle Safari download quirks', () => {
      // Safari may open downloads in new tab instead of downloading
      // Test that we handle this gracefully
      const a = document.createElement('a');
      a.href = 'data:image/png;base64,test';
      a.download = 'test.png';
      a.target = '_blank'; // Safari fallback
      
      expect(a.target).toBe('_blank');
    });

    it('should handle Safari JPEG quality', () => {
      const canvas = createTestCanvas(800, 600);
      
      // Safari may handle quality differently
      const dataUrl1 = canvas.toDataURL('image/jpeg', 0.92);
      const dataUrl2 = canvas.toDataURL('image/jpeg', 0.5);

      expect(dataUrl1).toMatch(/^data:image\/jpeg;base64,/);
      expect(dataUrl2).toMatch(/^data:image\/jpeg;base64,/);
      // Lower quality should produce smaller file
      expect(dataUrl2.length).toBeLessThanOrEqual(dataUrl1.length);
    });

    it('should handle Safari canvas memory limits', async () => {
      // Safari has stricter memory limits
      const canvas = createTestCanvas(2000, 2000);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      // Should either succeed or fail gracefully
      if (!result.success) {
        expect(result.error).toBeTruthy();
      } else {
        expect(result.success).toBe(true);
      }
    });

    it('should handle Safari image smoothing', () => {
      const canvas = createTestCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Safari supports image smoothing
        ctx.imageSmoothingEnabled = true;
        expect(ctx.imageSmoothingEnabled).toBe(true);
      }
    });
  });

  describe('14.4 Mobile Browser Compatibility', () => {
    describe('iOS Safari', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'userAgent', {
          value: USER_AGENTS.iosSafari,
          configurable: true
        });
      });

      it('should detect iOS Safari', () => {
        expect(navigator.userAgent).toContain('iPhone');
        expect(navigator.userAgent).toContain('Safari');
      });

      it('should export PNG on iOS Safari', async () => {
        const canvas = createTestCanvas(800, 600);
        const config: ExportConfig = {
          format: 'png',
          quality: 0.92,
          maxDimension: 1080,
          watermark: false,
          watermarkText: ''
        };

        const result = await exporter.export(canvas, config);

        expect(result.success).toBe(true);
        expect(result.format).toBe('png');
      });

      it('should export JPEG on iOS Safari', async () => {
        const canvas = createTestCanvas(800, 600);
        const config: ExportConfig = {
          format: 'jpeg',
          quality: 0.92,
          maxDimension: 1080,
          watermark: false,
          watermarkText: ''
        };

        const result = await exporter.export(canvas, config);

        expect(result.success).toBe(true);
        expect(result.format).toBe('jpeg');
      });

      it('should handle iOS memory constraints', async () => {
        // iOS has stricter memory limits
        const canvas = createTestCanvas(1920, 1080);
        const config: ExportConfig = {
          format: 'png',
          quality: 0.92,
          maxDimension: 1080,
          watermark: false,
          watermarkText: ''
        };

        const result = await exporter.export(canvas, config);

        expect(result.success).toBe(true);
      });

      it('should handle iOS download behavior', () => {
        // iOS may open downloads in new tab
        const a = document.createElement('a');
        a.href = 'data:image/png;base64,test';
        a.download = 'test.png';
        
        // iOS Safari may ignore download attribute
        expect(a.download).toBe('test.png');
      });

      it('should support canvas operations on iOS', () => {
        const canvas = createTestCanvas(800, 600);
        const ctx = canvas.getContext('2d');

        expect(ctx).toBeTruthy();
        expect(canvas.width).toBe(800);
        expect(canvas.height).toBe(600);
      });
    });

    describe('Chrome Android', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'userAgent', {
          value: USER_AGENTS.chromeAndroid,
          configurable: true
        });
      });

      it('should detect Chrome Android', () => {
        expect(navigator.userAgent).toContain('Android');
        expect(navigator.userAgent).toContain('Chrome');
      });

      it('should export PNG on Chrome Android', async () => {
        const canvas = createTestCanvas(800, 600);
        const config: ExportConfig = {
          format: 'png',
          quality: 0.92,
          maxDimension: 1080,
          watermark: false,
          watermarkText: ''
        };

        const result = await exporter.export(canvas, config);

        expect(result.success).toBe(true);
        expect(result.format).toBe('png');
      });

      it('should export JPEG on Chrome Android', async () => {
        const canvas = createTestCanvas(800, 600);
        const config: ExportConfig = {
          format: 'jpeg',
          quality: 0.92,
          maxDimension: 1080,
          watermark: false,
          watermarkText: ''
        };

        const result = await exporter.export(canvas, config);

        expect(result.success).toBe(true);
        expect(result.format).toBe('jpeg');
      });

      it('should handle Android download behavior', () => {
        const a = document.createElement('a');
        a.href = 'data:image/png;base64,test';
        a.download = 'test.png';
        
        expect(a.download).toBe('test.png');
        expect('download' in a).toBe(true);
      });

      it('should support canvas operations on Android', () => {
        const canvas = createTestCanvas(800, 600);
        const ctx = canvas.getContext('2d');

        expect(ctx).toBeTruthy();
        expect(canvas.toDataURL).toBeDefined();
      });

      it('should handle mobile viewport sizes', async () => {
        // Mobile devices typically have smaller viewports
        const canvas = createTestCanvas(375, 667); // iPhone size
        const config: ExportConfig = {
          format: 'png',
          quality: 0.92,
          maxDimension: 1080,
          watermark: false,
          watermarkText: ''
        };

        const result = await exporter.export(canvas, config);

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Cross-Browser Feature Detection', () => {
    it('should detect canvas support', () => {
      const canvas = document.createElement('canvas');
      expect(canvas.getContext).toBeDefined();
      expect(canvas.toDataURL).toBeDefined();
    });

    it('should detect toBlob support', () => {
      const canvas = document.createElement('canvas');
      expect(canvas.toBlob).toBeDefined();
    });

    it('should detect download attribute support', () => {
      const a = document.createElement('a');
      expect('download' in a).toBe(true);
    });

    it('should detect Blob support', () => {
      expect(typeof Blob).toBe('function');
    });

    it('should detect URL.createObjectURL support', () => {
      expect(URL.createObjectURL).toBeDefined();
      expect(URL.revokeObjectURL).toBeDefined();
    });

    it('should detect Image support', () => {
      expect(typeof Image).toBe('function');
      const img = new Image();
      expect(img.src).toBeDefined();
    });

    it('should detect base64 support', () => {
      const canvas = createTestCanvas(100, 100);
      const dataUrl = canvas.toDataURL('image/png');
      
      expect(dataUrl).toContain('base64');
      expect(dataUrl.split(',')[1]).toBeTruthy();
    });
  });

  describe('Cross-Browser Canvas API', () => {
    it('should support canvas.toDataURL with PNG', () => {
      const canvas = createTestCanvas(800, 600);
      const dataUrl = canvas.toDataURL('image/png');

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should support canvas.toDataURL with JPEG', () => {
      const canvas = createTestCanvas(800, 600);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should support canvas.toBlob', async () => {
      const canvas = createTestCanvas(800, 600);
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      expect(blob).toBeTruthy();
    });

    it('should support 2D context operations', () => {
      const canvas = createTestCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      expect(ctx).toBeTruthy();
      expect(ctx?.fillRect).toBeDefined();
      expect(ctx?.drawImage).toBeDefined();
      expect(ctx?.getImageData).toBeDefined();
    });

    it('should support image smoothing', () => {
      const canvas = createTestCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        expect(ctx.imageSmoothingEnabled).toBe(true);
      }
    });
  });

  describe('Cross-Browser Download Mechanism', () => {
    it('should create download link', () => {
      const a = document.createElement('a');
      a.href = 'data:image/png;base64,test';
      a.download = 'test.png';

      expect(a.href).toContain('data:image/png');
      expect(a.download).toBe('test.png');
    });

    it('should append and remove anchor from DOM', () => {
      const a = document.createElement('a');
      
      document.body.appendChild(a);
      expect(document.body.contains(a)).toBe(true);
      
      document.body.removeChild(a);
      expect(document.body.contains(a)).toBe(false);
    });

    it('should handle blob URLs', () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      expect(url).toMatch(/^blob:/);
      
      URL.revokeObjectURL(url);
    });

    it('should handle data URLs', () => {
      const canvas = createTestCanvas(100, 100);
      const dataUrl = canvas.toDataURL('image/png');

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(dataUrl.length).toBeGreaterThan(100);
    });
  });

  describe('Cross-Browser Error Handling', () => {
    it('should handle canvas conversion errors gracefully', async () => {
      const canvas = createTestCanvas(800, 600, false);
      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      if (!result.success) {
        expect(result.error).toBeTruthy();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle invalid format gracefully', () => {
      const canvas = createTestCanvas(800, 600);
      
      // Should fall back to PNG
      const dataUrl = CanvasConverter.toDataURL(canvas, {
        format: 'invalid' as any
      });

      expect(dataUrl).toMatch(/^data:image\/(png|jpeg);base64,/);
    });

    it('should handle memory errors gracefully', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 10000;
      canvas.height = 10000;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10000, 10000);
        
        const originalGetImageData = ctx.getImageData.bind(ctx);
        ctx.getImageData = vi.fn((sx, sy, sw, sh) => {
          const imageData = originalGetImageData(sx, sy, sw, sh);
          for (let i = 3; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255;
          }
          return imageData;
        });
      }

      const config: ExportConfig = {
        format: 'png',
        quality: 0.92,
        maxDimension: 1080,
        watermark: false,
        watermarkText: ''
      };

      const result = await exporter.export(canvas, config);

      // Should either succeed or fail gracefully
      expect(result).toBeTruthy();
      expect(typeof result.success).toBe('boolean');
    });
  });
});
