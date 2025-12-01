/**
 * Worker Manager
 * Manages Web Worker for heavy image processing
 * Validates: Requirements 5.2 (10.3)
 */

interface WorkerMessage {
  type: 'scale' | 'convert';
  imageData?: ImageData;
  width?: number;
  height?: number;
  maxDimension?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

interface WorkerResponse {
  type: 'success' | 'error';
  imageData?: ImageData;
  dataUrl?: string;
  error?: string;
}

export class WorkerManager {
  private worker: Worker | null = null;
  private workerSupported: boolean = false;

  constructor() {
    // Check if Web Workers are supported
    this.workerSupported = typeof Worker !== 'undefined';
  }

  /**
   * Check if Web Workers are supported
   * @returns true if supported
   */
  isSupported(): boolean {
    return this.workerSupported;
  }

  /**
   * Initialize the worker
   * @returns true if initialized successfully
   */
  async initialize(): Promise<boolean> {
    if (!this.workerSupported) {
      return false;
    }

    try {
      // Create worker from inline code
      const workerCode = `
        self.onmessage = (e) => {
          const { type, imageData, width, height, maxDimension } = e.data;
          
          try {
            if (type === 'scale' && imageData && width && height && maxDimension) {
              const scaledImageData = scaleImageData(imageData, width, height, maxDimension);
              self.postMessage({ type: 'success', imageData: scaledImageData });
            } else {
              throw new Error('Invalid worker message');
            }
          } catch (error) {
            self.postMessage({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        };
        
        function scaleImageData(imageData, width, height, maxDimension) {
          let newWidth, newHeight;
          
          if (width > height) {
            newWidth = maxDimension;
            newHeight = Math.round((height / width) * maxDimension);
          } else {
            newHeight = maxDimension;
            newWidth = Math.round((width / height) * maxDimension);
          }
          
          const scaledData = new ImageData(newWidth, newHeight);
          const src = imageData.data;
          const dst = scaledData.data;
          
          const xRatio = width / newWidth;
          const yRatio = height / newHeight;
          
          for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
              const srcX = Math.floor(x * xRatio);
              const srcY = Math.floor(y * yRatio);
              const srcIndex = (srcY * width + srcX) * 4;
              const dstIndex = (y * newWidth + x) * 4;
              
              dst[dstIndex] = src[srcIndex];
              dst[dstIndex + 1] = src[srcIndex + 1];
              dst[dstIndex + 2] = src[srcIndex + 2];
              dst[dstIndex + 3] = src[srcIndex + 3];
            }
          }
          
          return scaledData;
        }
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);
      
      return true;
    } catch (error) {
      console.warn('Failed to initialize Web Worker:', error);
      return false;
    }
  }

  /**
   * Scale image using Web Worker
   * @param canvas - Canvas to scale
   * @param maxDimension - Maximum dimension
   * @returns Promise resolving to scaled canvas
   */
  async scaleCanvas(
    canvas: HTMLCanvasElement,
    maxDimension: number
  ): Promise<HTMLCanvasElement> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Get image data from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Send to worker
    return new Promise<HTMLCanvasElement>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, 30000); // 30 second timeout

      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        clearTimeout(timeout);
        
        const response = e.data;
        
        if (response.type === 'success' && response.imageData) {
          // Create new canvas with scaled image data
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = response.imageData.width;
          scaledCanvas.height = response.imageData.height;
          
          const scaledCtx = scaledCanvas.getContext('2d');
          if (!scaledCtx) {
            reject(new Error('Failed to get scaled canvas context'));
            return;
          }
          
          scaledCtx.putImageData(response.imageData, 0, 0);
          resolve(scaledCanvas);
        } else {
          reject(new Error(response.error || 'Worker failed'));
        }
      };

      this.worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      const message: WorkerMessage = {
        type: 'scale',
        imageData,
        width: canvas.width,
        height: canvas.height,
        maxDimension
      };

      this.worker.postMessage(message);
    });
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
