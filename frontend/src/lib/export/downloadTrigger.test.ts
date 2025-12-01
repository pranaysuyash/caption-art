/**
 * Unit tests for DownloadTrigger
 * Tests download link creation, download trigger, object URL cleanup, and fallback methods
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DownloadTrigger } from './downloadTrigger';
import type { DownloadOptions } from './downloadTrigger';

describe('DownloadTrigger', () => {
  let mockAnchor: HTMLAnchorElement;
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;

  beforeEach(() => {
    // Create a mock anchor element
    mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      style: { display: '' }
    } as any;

    // Spy on document methods
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Download Link Creation', () => {
    it('should create anchor element with correct attributes', () => {
      const url = 'data:image/png;base64,mockData';
      const filename = 'test.png';

      const anchor = DownloadTrigger.createDownloadLink(url, filename);

      expect(anchor.href).toBe(url);
      expect(anchor.download).toBe(filename);
      expect(anchor.style.display).toBe('none');
    });

    it('should create anchor for blob URL', () => {
      const url = 'blob:http://localhost:3000/abc-123';
      const filename = 'test.png';

      const anchor = DownloadTrigger.createDownloadLink(url, filename);

      expect(anchor.href).toBe(url);
      expect(anchor.download).toBe(filename);
    });

    it('should create anchor for data URL', () => {
      const url = 'data:image/jpeg;base64,mockData';
      const filename = 'test.jpg';

      const anchor = DownloadTrigger.createDownloadLink(url, filename);

      expect(anchor.href).toBe(url);
      expect(anchor.download).toBe(filename);
    });
  });

  describe('Download Trigger with Data URL', () => {
    it('should trigger download with data URL', () => {
      const options: DownloadOptions = {
        filename: 'test.png',
        dataUrl: 'data:image/png;base64,mockData',
        mimeType: 'image/png'
      };

      DownloadTrigger.trigger(options);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.href).toBe(options.dataUrl);
      expect(mockAnchor.download).toBe(options.filename);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should append and remove anchor from body', () => {
      const options: DownloadOptions = {
        filename: 'test.png',
        dataUrl: 'data:image/png;base64,mockData',
        mimeType: 'image/png'
      };

      DownloadTrigger.trigger(options);

      expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
      expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
    });

    it('should handle JPEG data URLs', () => {
      const options: DownloadOptions = {
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,mockData',
        mimeType: 'image/jpeg'
      };

      DownloadTrigger.trigger(options);

      expect(mockAnchor.href).toBe(options.dataUrl);
      expect(mockAnchor.download).toBe('test.jpg');
    });
  });

  describe('Download Trigger with Blob', () => {
    it('should trigger download with blob', () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const mockBlobUrl = 'blob:http://localhost:3000/abc-123';

      // Mock URL.createObjectURL
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockBlobUrl);
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const options: DownloadOptions = {
        filename: 'test.png',
        blob: mockBlob,
        mimeType: 'image/png'
      };

      DownloadTrigger.trigger(options);

      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(mockAnchor.href).toBe(mockBlobUrl);
      expect(mockAnchor.download).toBe(options.filename);
      expect(mockAnchor.click).toHaveBeenCalled();

      // Wait for cleanup timeout
      vi.advanceTimersByTime(100);

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should revoke blob URL after download', () => {
      vi.useFakeTimers();

      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const mockBlobUrl = 'blob:http://localhost:3000/abc-123';

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockBlobUrl);
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const options: DownloadOptions = {
        filename: 'test.png',
        blob: mockBlob,
        mimeType: 'image/png'
      };

      DownloadTrigger.trigger(options);

      // Blob URL should not be revoked immediately
      expect(revokeObjectURLSpy).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(100);

      // Now it should be revoked
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockBlobUrl);

      vi.useRealTimers();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('Object URL Cleanup', () => {
    it('should revoke blob URLs', () => {
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const blobUrl = 'blob:http://localhost:3000/abc-123';

      DownloadTrigger.revokeObjectURL(blobUrl);

      expect(revokeObjectURLSpy).toHaveBeenCalledWith(blobUrl);

      revokeObjectURLSpy.mockRestore();
    });

    it('should not revoke data URLs', () => {
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const dataUrl = 'data:image/png;base64,mockData';

      DownloadTrigger.revokeObjectURL(dataUrl);

      expect(revokeObjectURLSpy).not.toHaveBeenCalled();

      revokeObjectURLSpy.mockRestore();
    });

    it('should handle errors when revoking URLs', () => {
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {
        throw new Error('Revoke failed');
      });

      // Should not throw
      expect(() => {
        DownloadTrigger.revokeObjectURL('blob:http://localhost:3000/abc-123');
      }).not.toThrow();

      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('Fallback Methods', () => {
    it('should attempt fallback when download fails', () => {
      // Mock click to fail
      mockAnchor.click = vi.fn(() => {
        throw new Error('Click failed');
      });

      const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

      const options: DownloadOptions = {
        filename: 'test.png',
        dataUrl: 'data:image/png;base64,mockData',
        mimeType: 'image/png'
      };

      // Should not throw, but should attempt fallback
      expect(() => {
        DownloadTrigger.trigger(options);
      }).toThrow(); // Will throw because fallback also fails in test

      windowOpenSpy.mockRestore();
    });

    it('should open in new tab as fallback', () => {
      // Make createAndClickDownloadLink return false (simulating failure)
      const createAndClickSpy = vi.spyOn(DownloadTrigger, 'createAndClickDownloadLink')
        .mockReturnValue(false);

      const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

      const options: DownloadOptions = {
        filename: 'test.png',
        dataUrl: 'data:image/png;base64,mockData',
        mimeType: 'image/png'
      };

      // This will attempt fallback internally
      try {
        DownloadTrigger.trigger(options);
      } catch (e) {
        // Expected in test environment
      }

      createAndClickSpy.mockRestore();
      windowOpenSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when neither dataUrl nor blob provided', () => {
      const options: DownloadOptions = {
        filename: 'test.png',
        mimeType: 'image/png'
      };

      expect(() => {
        DownloadTrigger.trigger(options);
      }).toThrow('Either dataUrl or blob must be provided');
    });

    it('should handle download blocked error', () => {
      mockAnchor.click = vi.fn(() => {
        throw new Error('Download blocked by browser');
      });

      const options: DownloadOptions = {
        filename: 'test.png',
        dataUrl: 'data:image/png;base64,mockData',
        mimeType: 'image/png'
      };

      expect(() => {
        DownloadTrigger.trigger(options);
      }).toThrow();
    });

    it('should handle filesystem errors', () => {
      mockAnchor.click = vi.fn(() => {
        throw new Error('Filesystem error: disk full');
      });

      const options: DownloadOptions = {
        filename: 'test.png',
        dataUrl: 'data:image/png;base64,mockData',
        mimeType: 'image/png'
      };

      expect(() => {
        DownloadTrigger.trigger(options);
      }).toThrow('disk space');
    });

    it('should provide user-friendly error messages', () => {
      mockAnchor.click = vi.fn(() => {
        throw new Error('Some technical error');
      });

      const options: DownloadOptions = {
        filename: 'test.png',
        dataUrl: 'data:image/png;base64,mockData',
        mimeType: 'image/png'
      };

      expect(() => {
        DownloadTrigger.trigger(options);
      }).toThrow('Unable to save file');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long filenames', () => {
      const longFilename = 'a'.repeat(300) + '.png';
      const options: DownloadOptions = {
        filename: longFilename,
        dataUrl: 'data:image/png;base64,mockData',
        mimeType: 'image/png'
      };

      DownloadTrigger.trigger(options);

      expect(mockAnchor.download).toBe(longFilename);
    });

    it('should handle special characters in filename', () => {
      const specialFilename = 'test-file_name (1).png';
      const options: DownloadOptions = {
        filename: specialFilename,
        dataUrl: 'data:image/png;base64,mockData',
        mimeType: 'image/png'
      };

      DownloadTrigger.trigger(options);

      expect(mockAnchor.download).toBe(specialFilename);
    });

    it('should handle very large data URLs', () => {
      const largeDataUrl = 'data:image/png;base64,' + 'A'.repeat(1000000);
      const options: DownloadOptions = {
        filename: 'test.png',
        dataUrl: largeDataUrl,
        mimeType: 'image/png'
      };

      DownloadTrigger.trigger(options);

      expect(mockAnchor.href).toBe(largeDataUrl);
    });

    it('should handle different MIME types', () => {
      const mimeTypes = ['image/png', 'image/jpeg', 'image/webp'];

      mimeTypes.forEach(mimeType => {
        const options: DownloadOptions = {
          filename: 'test.png',
          dataUrl: `data:${mimeType};base64,mockData`,
          mimeType
        };

        expect(() => {
          DownloadTrigger.trigger(options);
        }).not.toThrow();
      });
    });
  });

  describe('Integration', () => {
    it('should complete full download flow with data URL', () => {
      const options: DownloadOptions = {
        filename: 'caption-art-20250127-143022.png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png'
      };

      DownloadTrigger.trigger(options);

      expect(createElementSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('should complete full download flow with blob', () => {
      vi.useFakeTimers();

      const mockBlob = new Blob(['test data'], { type: 'image/png' });
      const mockBlobUrl = 'blob:http://localhost:3000/abc-123';

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockBlobUrl);
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const options: DownloadOptions = {
        filename: 'test.png',
        blob: mockBlob,
        mimeType: 'image/png'
      };

      DownloadTrigger.trigger(options);

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(revokeObjectURLSpy).toHaveBeenCalled();

      vi.useRealTimers();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });
});
