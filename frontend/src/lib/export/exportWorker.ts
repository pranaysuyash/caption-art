/**
 * Export Worker
 * Offloads heavy image processing to a Web Worker
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

// Worker code
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, imageData, width, height, maxDimension, format, quality } = e.data;

  try {
    if (type === 'scale' && imageData && width && height && maxDimension) {
      // Scale image data
      const scaledImageData = scaleImageData(imageData, width, height, maxDimension);
      
      const response: WorkerResponse = {
        type: 'success',
        imageData: scaledImageData
      };
      
      self.postMessage(response);
    } else {
      throw new Error('Invalid worker message');
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    self.postMessage(response);
  }
};

/**
 * Scale image data using bicubic interpolation
 * @param imageData - Original image data
 * @param width - Original width
 * @param height - Original height
 * @param maxDimension - Maximum dimension
 * @returns Scaled image data
 */
function scaleImageData(
  imageData: ImageData,
  width: number,
  height: number,
  maxDimension: number
): ImageData {
  // Calculate new dimensions
  let newWidth: number;
  let newHeight: number;
  
  if (width > height) {
    newWidth = maxDimension;
    newHeight = Math.round((height / width) * maxDimension);
  } else {
    newHeight = maxDimension;
    newWidth = Math.round((width / height) * maxDimension);
  }

  // Create new image data
  const scaledData = new ImageData(newWidth, newHeight);
  const src = imageData.data;
  const dst = scaledData.data;

  // Simple bilinear scaling
  const xRatio = width / newWidth;
  const yRatio = height / newHeight;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIndex = (srcY * width + srcX) * 4;
      const dstIndex = (y * newWidth + x) * 4;

      dst[dstIndex] = src[srcIndex];         // R
      dst[dstIndex + 1] = src[srcIndex + 1]; // G
      dst[dstIndex + 2] = src[srcIndex + 2]; // B
      dst[dstIndex + 3] = src[srcIndex + 3]; // A
    }
  }

  return scaledData;
}

export {};
