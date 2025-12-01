/**
 * WorkerManager - Manages Web Worker pool for mask processing
 * 
 * Provides a simple interface to offload heavy processing to Web Workers
 * without blocking the main thread.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

interface WorkerTask {
  type: 'assessQuality' | 'validateAlpha' | 'refineBlur';
  imageData: ImageData;
  options?: any;
}

interface WorkerResponse {
  type: string;
  result: any;
  error?: string;
}

/**
 * WorkerManager class for managing mask processing workers
 */
export class WorkerManager {
  private worker: Worker | null = null;
  private workerEnabled: boolean = true;

  constructor() {
    this.initWorker();
  }

  /**
   * Initialize Web Worker
   */
  private initWorker(): void {
    try {
      // Check if Web Workers are supported
      if (typeof Worker === 'undefined') {
        console.warn('Web Workers not supported, falling back to main thread');
        this.workerEnabled = false;
        return;
      }

      // Create worker from inline code (avoids separate file issues)
      const workerCode = this.getWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      this.worker = new Worker(workerUrl);
      
      // Clean up blob URL after worker is created
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.warn('Failed to create Web Worker:', error);
      this.workerEnabled = false;
    }
  }

  /**
   * Get worker code as string
   */
  private getWorkerCode(): string {
    return `
      self.onmessage = (event) => {
        const { type, imageData, options } = event.data;
        
        try {
          let result;
          
          switch (type) {
            case 'assessQuality':
              result = assessQuality(imageData);
              break;
            case 'validateAlpha':
              result = validateAlphaChannel(imageData);
              break;
            case 'refineBlur':
              result = applyGaussianBlur(imageData, options?.radius || 1);
              break;
            default:
              throw new Error('Unknown task type: ' + type);
          }
          
          self.postMessage({ type, result });
        } catch (error) {
          self.postMessage({ 
            type, 
            result: null, 
            error: error.message 
          });
        }
      };
      
      function assessQuality(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        let edgePixels = 0;
        let smoothEdges = 0;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const alpha = data[i + 3];
            
            if (alpha > 10 && alpha < 245) {
              edgePixels++;
              const neighbors = getNeighborAlphas(imageData, x, y);
              const isSmooth = neighbors.every(n => Math.abs(n - alpha) < 50);
              if (isSmooth) smoothEdges++;
            }
          }
        }
        
        if (edgePixels === 0) return 'low';
        const smoothRatio = smoothEdges / edgePixels;
        if (smoothRatio > 0.8) return 'high';
        if (smoothRatio > 0.5) return 'medium';
        return 'low';
      }
      
      function getNeighborAlphas(imageData, x, y) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const neighbors = [];
        const offsets = [
          [-1, -1], [0, -1], [1, -1],
          [-1, 0],           [1, 0],
          [-1, 1],  [0, 1],  [1, 1]
        ];
        
        for (const [dx, dy] of offsets) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            neighbors.push(data[i + 3]);
          }
        }
        return neighbors;
      }
      
      function validateAlphaChannel(imageData) {
        const data = imageData.data;
        let hasPartialAlpha = false;
        let hasFullyOpaque = false;
        let hasFullyTransparent = false;
        let partialAlphaCount = 0;
        let opaqueCount = 0;
        let transparentCount = 0;
        
        for (let i = 3; i < data.length; i += 4) {
          const alpha = data[i];
          if (alpha === 0) {
            transparentCount++;
            hasFullyTransparent = true;
          } else if (alpha === 255) {
            opaqueCount++;
            hasFullyOpaque = true;
          } else {
            partialAlphaCount++;
            hasPartialAlpha = true;
          }
        }
        
        const totalPixels = data.length / 4;
        const allTransparent = transparentCount === totalPixels;
        const allOpaque = opaqueCount === totalPixels;
        const partialAlphaRatio = partialAlphaCount / totalPixels;
        const hasNoise = partialAlphaRatio > 0 && partialAlphaRatio < 0.001;
        
        return {
          hasAlpha: hasPartialAlpha || (hasFullyOpaque && hasFullyTransparent),
          allTransparent,
          allOpaque,
          hasNoise
        };
      }
      
      function applyGaussianBlur(imageData, radius) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new ImageData(width, height);
        const kernelSize = Math.ceil(radius) * 2 + 1;
        const halfKernel = Math.floor(kernelSize / 2);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
            let count = 0;
            
            for (let ky = -halfKernel; ky <= halfKernel; ky++) {
              for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                const nx = x + kx;
                const ny = y + ky;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const i = (ny * width + nx) * 4;
                  sumR += data[i];
                  sumG += data[i + 1];
                  sumB += data[i + 2];
                  sumA += data[i + 3];
                  count++;
                }
              }
            }
            
            const i = (y * width + x) * 4;
            output.data[i] = sumR / count;
            output.data[i + 1] = sumG / count;
            output.data[i + 2] = sumB / count;
            output.data[i + 3] = sumA / count;
          }
        }
        return output;
      }
    `;
  }

  /**
   * Execute a task in the worker
   * 
   * @param task - Task to execute
   * @returns Promise resolving to task result
   */
  async execute<T>(task: WorkerTask): Promise<T> {
    // If worker is not available, return null to fall back to main thread
    if (!this.workerEnabled || !this.worker) {
      throw new Error('Worker not available');
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, result, error } = event.data;

        if (type === task.type) {
          this.worker?.removeEventListener('message', handleMessage);

          if (error) {
            reject(new Error(error));
          } else {
            resolve(result);
          }
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage(task);

      // Timeout after 30 seconds
      setTimeout(() => {
        this.worker?.removeEventListener('message', handleMessage);
        reject(new Error('Worker task timed out'));
      }, 30000);
    });
  }

  /**
   * Assess mask quality using worker
   * 
   * @param imageData - Image data to assess
   * @returns Quality rating
   */
  async assessQuality(imageData: ImageData): Promise<'high' | 'medium' | 'low'> {
    try {
      return await this.execute<'high' | 'medium' | 'low'>({
        type: 'assessQuality',
        imageData
      });
    } catch (error) {
      // Fall back to main thread if worker fails
      throw error;
    }
  }

  /**
   * Validate alpha channel using worker
   * 
   * @param imageData - Image data to validate
   * @returns Validation result
   */
  async validateAlpha(imageData: ImageData): Promise<{
    hasAlpha: boolean;
    allTransparent: boolean;
    allOpaque: boolean;
    hasNoise: boolean;
  }> {
    try {
      return await this.execute({
        type: 'validateAlpha',
        imageData
      });
    } catch (error) {
      // Fall back to main thread if worker fails
      throw error;
    }
  }

  /**
   * Apply Gaussian blur using worker
   * 
   * @param imageData - Image data to blur
   * @param radius - Blur radius
   * @returns Blurred image data
   */
  async applyBlur(imageData: ImageData, radius: number): Promise<ImageData> {
    try {
      return await this.execute<ImageData>({
        type: 'refineBlur',
        imageData,
        options: { radius }
      });
    } catch (error) {
      // Fall back to main thread if worker fails
      throw error;
    }
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

  /**
   * Check if worker is available
   */
  isAvailable(): boolean {
    return this.workerEnabled && this.worker !== null;
  }
}
