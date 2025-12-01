/**
 * Auto-placement utilities for the Canvas Text Compositing Engine
 * Analyzes images to find optimal text placement positions
 */

/**
 * Grid cell with position and score
 */
export interface GridCell {
  x: number;
  y: number;
  score: number;
}

/**
 * Region representing a contiguous area
 */
export interface Region {
  cells: GridCell[];
  centerX: number;
  centerY: number;
  size: number;
}

/**
 * Convert image to grayscale
 * @param imageData - Image data from canvas
 * @returns Grayscale values (0-255) as flat array
 */
export function imageToGrayscale(imageData: ImageData): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const grayscale = new Uint8ClampedArray(width * height);

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    // Use luminosity method for grayscale conversion
    // Weights based on human perception: 0.299R + 0.587G + 0.114B
    grayscale[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return grayscale;
}

/**
 * Calculate gradient magnitude for edge detection
 * Uses Sobel operator for gradient calculation
 * @param grayscale - Grayscale image data
 * @param width - Image width
 * @param height - Image height
 * @returns Gradient magnitude values (0-255)
 */
export function calculateGradientMagnitude(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number
): Float32Array {
  const gradient = new Float32Array(width * height);

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      // Apply Sobel kernels
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          const pixelValue = grayscale[idx];

          gx += pixelValue * sobelX[kernelIdx];
          gy += pixelValue * sobelY[kernelIdx];
        }
      }

      // Calculate magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      gradient[y * width + x] = magnitude;
    }
  }

  return gradient;
}

/**
 * Score grid cells based on gradient magnitude
 * Lower scores indicate emptier areas (better for text placement)
 * @param gradient - Gradient magnitude array
 * @param width - Image width
 * @param height - Image height
 * @param gridSize - Size of each grid cell in pixels
 * @returns Array of scored grid cells
 */
export function scoreGridCells(
  gradient: Float32Array,
  width: number,
  height: number,
  gridSize: number = 50
): GridCell[] {
  const cells: GridCell[] = [];
  const cols = Math.floor(width / gridSize);
  const rows = Math.floor(height / gridSize);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const startX = col * gridSize;
      const startY = row * gridSize;
      const endX = Math.min(startX + gridSize, width);
      const endY = Math.min(startY + gridSize, height);

      let sum = 0;
      let count = 0;

      // Calculate average gradient in this cell
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          sum += gradient[y * width + x];
          count++;
        }
      }

      const avgGradient = count > 0 ? sum / count : 0;

      cells.push({
        x: col,
        y: row,
        score: avgGradient,
      });
    }
  }

  return cells;
}

/**
 * Find contiguous regions of low-gradient cells
 * Uses flood-fill algorithm to group adjacent low-gradient cells
 * @param cells - Scored grid cells
 * @param cols - Number of columns in grid
 * @param rows - Number of rows in grid
 * @param threshold - Maximum gradient score to consider as "empty"
 * @returns Array of contiguous regions, sorted by size (largest first)
 */
export function findContiguousRegions(
  cells: GridCell[],
  cols: number,
  rows: number,
  threshold?: number
): Region[] {
  // Calculate threshold as median score if not provided
  const sortedScores = cells.map((c) => c.score).sort((a, b) => a - b);
  const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
  const scoreThreshold = threshold ?? medianScore;

  const visited = new Set<number>();
  const regions: Region[] = [];

  // Helper to get cell index
  const getCellIndex = (x: number, y: number): number => y * cols + x;

  // Helper to check if cell is valid and unvisited
  const isValidCell = (x: number, y: number): boolean => {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
    const idx = getCellIndex(x, y);
    if (visited.has(idx)) return false;
    return cells[idx].score <= scoreThreshold;
  };

  // Flood fill to find contiguous region
  const floodFill = (startX: number, startY: number): GridCell[] => {
    const region: GridCell[] = [];
    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    const startIdx = getCellIndex(startX, startY);
    visited.add(startIdx);

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const idx = getCellIndex(x, y);
      region.push(cells[idx]);

      // Check 4-connected neighbors
      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ];

      for (const neighbor of neighbors) {
        if (isValidCell(neighbor.x, neighbor.y)) {
          const neighborIdx = getCellIndex(neighbor.x, neighbor.y);
          visited.add(neighborIdx);
          queue.push(neighbor);
        }
      }
    }

    return region;
  };

  // Find all regions
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = getCellIndex(col, row);
      if (!visited.has(idx) && cells[idx].score <= scoreThreshold) {
        const regionCells = floodFill(col, row);

        if (regionCells.length > 0) {
          // Calculate region center
          const sumX = regionCells.reduce((sum, cell) => sum + cell.x, 0);
          const sumY = regionCells.reduce((sum, cell) => sum + cell.y, 0);

          regions.push({
            cells: regionCells,
            centerX: sumX / regionCells.length,
            centerY: sumY / regionCells.length,
            size: regionCells.length,
          });
        }
      }
    }
  }

  // Sort by size (largest first)
  regions.sort((a, b) => b.size - a.size);

  return regions;
}
