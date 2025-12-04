/**
 * Vitest setup file
 * Sets up canvas support for tests that require canvas operations
 */

import { createCanvas, Canvas, Image, ImageData as CanvasImageData } from 'canvas';
import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Declare global types for Node.js environment
declare global {
  // eslint-disable-next-line no-var
  var HTMLCanvasElement: typeof globalThis.HTMLCanvasElement;
  // eslint-disable-next-line no-var
  var Image: typeof globalThis.Image;
  // eslint-disable-next-line no-var
  var ImageData: typeof globalThis.ImageData;
  // eslint-disable-next-line no-var
  var URL: typeof globalThis.URL;
}

// Store canvas instances to maintain state
const canvasMap = new WeakMap<HTMLCanvasElement, Canvas>();

// Export canvasMap for use in tests
export { canvasMap };

// Polyfill HTMLCanvasElement for jsdom
globalThis.HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextType: string) {
  if (contextType === '2d') {
    // Reuse the same canvas instance for this element
    let canvas = canvasMap.get(this);
    if (!canvas) {
      canvas = createCanvas(this.width, this.height);
      canvasMap.set(this, canvas);
    } else {
      // Update dimensions if changed
      canvas.width = this.width;
      canvas.height = this.height;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Patch drawImage to handle HTMLCanvasElement
    const originalDrawImage = (ctx as any).drawImage.bind(ctx);
    (ctx as any).drawImage = function(image: any, ...args: any[]) {
      // If image is an HTMLCanvasElement, get the underlying Canvas
      if (image instanceof globalThis.HTMLCanvasElement) {
        const sourceCanvas = canvasMap.get(image);
        if (sourceCanvas) {
          return originalDrawImage(sourceCanvas, ...args);
        }
      }
      return originalDrawImage(image, ...args);
    };
    
    return ctx;
  }
  return null;
} as any;

// Polyfill HTMLCanvasElement.toDataURL
globalThis.HTMLCanvasElement.prototype.toDataURL = function (this: HTMLCanvasElement, type?: string, quality?: number) {
  let canvas = canvasMap.get(this);
  if (!canvas) {
    canvas = createCanvas(this.width, this.height);
    canvasMap.set(this, canvas);
  }
  return canvas.toDataURL(type as any, quality as any);
} as any;

// Polyfill HTMLCanvasElement.toBlob
globalThis.HTMLCanvasElement.prototype.toBlob = function (
  this: HTMLCanvasElement,
  callback: (blob: Blob | null) => void,
  type?: string,
  quality?: number
) {
  let canvas = canvasMap.get(this);
  if (!canvas) {
    canvas = createCanvas(this.width, this.height);
    canvasMap.set(this, canvas);
  }
  
  try {
    const dataUrl = canvas.toDataURL(type as any, quality as any);
    // Convert data URL to blob
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    const blob = new Blob([u8arr], { type: mime });
    callback(blob);
  } catch (error) {
    callback(null);
  }
} as any;

// Make Image available globally
globalThis.Image = Image as any;

// Make ImageData available globally  
globalThis.ImageData = CanvasImageData as any;

// Polyfill URL.createObjectURL and revokeObjectURL for blob handling
const objectURLMap = new Map<string, Blob>();
let objectURLCounter = 0;

globalThis.URL.createObjectURL = function (blob: Blob): string {
  const url = `blob:test-${objectURLCounter++}`;
  objectURLMap.set(url, blob);
  return url;
};

globalThis.URL.revokeObjectURL = function (url: string): void {
  objectURLMap.delete(url);
};

// Load CSS files for property-based tests
// This ensures CSS custom properties are available in the test environment
try {
  const designSystemCSS = readFileSync(join(__dirname, 'src/styles/design-system.css'), 'utf-8');
  const componentsCSS = readFileSync(join(__dirname, 'src/styles/components.css'), 'utf-8');
  const animationsCSS = readFileSync(join(__dirname, 'src/styles/animations.css'), 'utf-8');
  
  // Create style elements and inject CSS
  const styleElement = document.createElement('style');
  styleElement.textContent = designSystemCSS + '\n' + componentsCSS + '\n' + animationsCSS;
  document.head.appendChild(styleElement);
} catch (error) {
  // CSS files might not be available in all test contexts
  console.warn('Could not load CSS files for tests:', error);
}
