/**
 * Property-Based Tests for DownloadTrigger
 * 
 * **Feature: export-download-system, Property 11: Download trigger success**
 * **Validates: Requirements 1.4**
 * 
 * For any successful export, a browser download should be initiated
 * (or fallback to new tab if blocked)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { DownloadTrigger, DownloadOptions } from './downloadTrigger';

describe('DownloadTrigger - Property-Based Tests', () => {
  let originalCreateElement: typeof document.createElement;
  let originalOpen: typeof window.open;
  let createdElements: HTMLElement[] = [];

  beforeEach(() => {
    // Store original functions
    originalCreateElement = document.createElement.bind(document);
    originalOpen = window.open;

    // Mock document.createElement to track anchor elements
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        createdElements.push(element);
        // Mock click to prevent actual download
        vi.spyOn(element, 'click').mockImplementation(() => {});
      }
      return element;
    });

    // Mock appendChild and removeChild
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node as any);

    // Mock window.open
    vi.spyOn(window, 'open').mockImplementation(() => null);

    // Mock URL.createObjectURL and revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock-url') as any;
    URL.revokeObjectURL = vi.fn() as any;
  });

  afterEach(() => {
    createdElements = [];
    vi.restoreAllMocks();
  });

  /**
   * Property 11: Download trigger success
   * For any valid download options with dataUrl, a download link should be created and clicked
   */
  it('Property 11: should create and click download link for any valid dataUrl', () => {
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9.-]/g, '_')),
          format: fc.constantFrom('png', 'jpeg'),
          quality: fc.double({ min: 0.5, max: 1.0 }),
        }),
        (config) => {
          // Generate a valid data URL
          const mimeType = config.format === 'png' ? 'image/png' : 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
          
          const options: DownloadOptions = {
            filename: `${config.filename}.${config.format === 'png' ? 'png' : 'jpg'}`,
            dataUrl,
            mimeType,
          };

          // Clear previous elements
          createdElements = [];

          // Trigger download
          DownloadTrigger.trigger(options);

          // Verify an anchor element was created
          const anchors = createdElements.filter(el => el.tagName === 'A') as HTMLAnchorElement[];
          expect(anchors.length).toBeGreaterThan(0);

          // Verify the anchor has correct attributes
          const anchor = anchors[0];
          expect(anchor.href).toBe(dataUrl);
          expect(anchor.download).toBe(options.filename);

          // Verify click was called
          expect(anchor.click).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Download trigger success (blob variant)
   * For any valid download options with blob, a blob URL should be created and used
   */
  it('Property 11: should create blob URL and trigger download for any valid blob', () => {
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.replace(/[^a-zA-Z0-9.-]/g, '_')),
          format: fc.constantFrom('png', 'jpeg'),
          blobSize: fc.integer({ min: 100, max: 10000 }),
        }),
        (config) => {
          // Create a mock blob
          const mimeType = config.format === 'png' ? 'image/png' : 'image/jpeg';
          const blob = new Blob(['x'.repeat(config.blobSize)], { type: mimeType });
          
          const options: DownloadOptions = {
            filename: `${config.filename}.${config.format === 'png' ? 'png' : 'jpg'}`,
            blob,
            mimeType,
          };

          // Clear previous elements
          createdElements = [];

          // Trigger download
          DownloadTrigger.trigger(options);

          // Verify URL.createObjectURL was called
          expect(URL.createObjectURL).toHaveBeenCalledWith(blob);

          // Verify an anchor element was created
          const anchors = createdElements.filter(el => el.tagName === 'A') as HTMLAnchorElement[];
          expect(anchors.length).toBeGreaterThan(0);

          // Verify the anchor has correct attributes
          const anchor = anchors[0];
          expect(anchor.href).toBe('blob:mock-url');
          expect(anchor.download).toBe(options.filename);

          // Verify click was called
          expect(anchor.click).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Fallback behavior
   * If download link creation fails, window.open should be called as fallback
   */
  it('Property 11: should fallback to window.open when download link fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.string({ minLength: 1, maxLength: 100 }),
          format: fc.constantFrom('png', 'jpeg'),
        }),
        (config) => {
          const mimeType = config.format === 'png' ? 'image/png' : 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,test`;
          
          // Mock createElement to throw error
          vi.spyOn(document, 'createElement').mockImplementation(() => {
            throw new Error('Mock error');
          });

          const options: DownloadOptions = {
            filename: config.filename,
            dataUrl,
            mimeType,
          };

          // Trigger download (should catch error and fallback)
          DownloadTrigger.trigger(options);

          // Verify window.open was called as fallback
          expect(window.open).toHaveBeenCalledWith(dataUrl, '_blank');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Blob URL cleanup
   * For any blob download, URL.revokeObjectURL should be called to clean up
   */
  it('Property 11: should revoke blob URLs after download', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          filename: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim() || 'file'),
          format: fc.constantFrom('png', 'jpeg'),
        }),
        async (config) => {
          const mimeType = config.format === 'png' ? 'image/png' : 'image/jpeg';
          const blob = new Blob(['test'], { type: mimeType });
          
          const options: DownloadOptions = {
            filename: config.filename,
            blob,
            mimeType,
          };

          // Clear mock calls
          vi.clearAllMocks();

          // Trigger download
          DownloadTrigger.trigger(options);

          // Wait for cleanup timeout
          await new Promise(resolve => setTimeout(resolve, 150));

          // Verify URL.revokeObjectURL was called
          expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
        }
      ),
      { numRuns: 50 } // Fewer runs due to async nature
    );
  });
});
