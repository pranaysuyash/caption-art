/**
 * Web Worker for heavy mask processing operations
 * 
 * Offloads CPU-intensive tasks like quality assessment and refinement
 * to avoid blocking the main thread.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

interface WorkerMessage {
  type: 'assessQuality' | 'validateAlpha' | 'refineBlur';
  imageData: ImageData;
  options?: any;
}

interface WorkerResponse {
  type: 'assessQuality' | 'validateAlpha' | 'refineBlur';
  result: any;
  error?: string;
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, imageData, options } = event.data;

  try {
    let result: any;

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
        throw new Error(`Unknown worker task type: ${type}`);
    }

    const response: WorkerResponse = {
      type,
      result
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    self.postMessage(response);
  }
};

/**
 * Assess mask quality based on edge smoothness
 */
function assessQuality(imageData: ImageData): 'high' | 'medium' | 'low' {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  let edgePixels = 0;
  let smoothEdges = 0;

  // Sample edge pixels (alpha between 10 and 245)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];

      // Check if this is an edge pixel
      if (alpha > 10 && alpha < 245) {
        edgePixels++;

        // Check if neighboring pixels have gradual transition
        const neighbors = getNeighborAlphas(imageData, x, y);
        const isSmooth = neighbors.every(n => Math.abs(n - alpha) < 50);

        if (isSmooth) {
          smoothEdges++;
        }
      }
    }
  }

  // If no edge pixels found, quality is low
  if (edgePixels === 0) {
    return 'low';
  }

  // Calculate smooth ratio
  const smoothRatio = smoothEdges / edgePixels;

  // Determine quality based on smooth ratio
  if (smoothRatio > 0.8) {
    return 'high';
  } else if (smoothRatio > 0.5) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Get alpha values of neighboring pixels
 */
function getNeighborAlphas(imageData: ImageData, x: number, y: number): number[] {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const neighbors: number[] = [];

  // Check 8 neighbors
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];

  for (const [dx, dy] of offsets) {
    const nx = x + dx;
    const ny = y + dy;

    // Check bounds
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const i = (ny * width + nx) * 4;
      neighbors.push(data[i + 3]);
    }
  }

  return neighbors;
}

/**
 * Validate alpha channel properties
 */
function validateAlphaChannel(imageData: ImageData): {
  hasAlpha: boolean;
  allTransparent: boolean;
  allOpaque: boolean;
  hasNoise: boolean;
} {
  const data = imageData.data;
  let hasPartialAlpha = false;
  let hasFullyOpaque = false;
  let hasFullyTransparent = false;
  let partialAlphaCount = 0;
  let opaqueCount = 0;
  let transparentCount = 0;

  // Sample pixels to check alpha values
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

  // Check for noise
  const partialAlphaRatio = partialAlphaCount / totalPixels;
  const hasNoise = partialAlphaRatio > 0 && partialAlphaRatio < 0.001;

  return {
    hasAlpha: hasPartialAlpha || (hasFullyOpaque && hasFullyTransparent),
    allTransparent,
    allOpaque,
    hasNoise
  };
}

/**
 * Apply Gaussian blur to image data
 */
function applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
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
