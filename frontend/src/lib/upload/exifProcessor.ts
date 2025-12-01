/**
 * EXIF Data Processing
 * 
 * Handles reading EXIF metadata, correcting image orientation, and stripping EXIF data
 */

import type { EXIFData } from './types';

/**
 * Read EXIF data from an image file
 * Returns null if no EXIF data is found or if reading fails
 */
export async function readEXIF(file: File): Promise<EXIFData | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const view = new DataView(arrayBuffer);

    // Check for JPEG signature (0xFF 0xD8)
    if (view.getUint8(0) !== 0xFF || view.getUint8(1) !== 0xD8) {
      return null;
    }

    let offset = 2;
    const length = view.byteLength;

    // Find APP1 marker (0xFF 0xE1) which contains EXIF data
    while (offset < length) {
      if (view.getUint8(offset) !== 0xFF) {
        return null;
      }

      const marker = view.getUint8(offset + 1);
      
      if (marker === 0xE1) {
        // Found APP1 marker
        return parseEXIFData(view, offset + 4);
      }

      // Move to next marker
      offset += 2 + view.getUint16(offset + 2);
    }

    return null;
  } catch (error) {
    console.error('Error reading EXIF data:', error);
    return null;
  }
}

/**
 * Parse EXIF data from the APP1 marker
 */
function parseEXIFData(view: DataView, offset: number): EXIFData | null {
  try {
    // Check for "Exif\0\0" identifier
    if (view.getUint32(offset) !== 0x45786966) {
      return null;
    }
    offset += 6;

    // Check byte order (II = little-endian, MM = big-endian)
    const byteOrder = view.getUint16(offset);
    const littleEndian = byteOrder === 0x4949;

    // Check TIFF marker (0x002A)
    const tiffMarker = view.getUint16(offset + 2, littleEndian);
    if (tiffMarker !== 0x002A) {
      return null;
    }

    // Get IFD0 offset
    const ifd0Offset = view.getUint32(offset + 4, littleEndian);
    const exifData: EXIFData = { orientation: 1 };

    // Read IFD0 entries
    const ifd0Start = offset + ifd0Offset;
    const numEntries = view.getUint16(ifd0Start, littleEndian);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifd0Start + 2 + (i * 12);
      const tag = view.getUint16(entryOffset, littleEndian);

      // Orientation tag (0x0112)
      if (tag === 0x0112) {
        exifData.orientation = view.getUint16(entryOffset + 8, littleEndian);
      }
      // Make tag (0x010F)
      else if (tag === 0x010F) {
        const valueOffset = view.getUint32(entryOffset + 8, littleEndian);
        exifData.make = readString(view, offset + valueOffset, littleEndian);
      }
      // Model tag (0x0110)
      else if (tag === 0x0110) {
        const valueOffset = view.getUint32(entryOffset + 8, littleEndian);
        exifData.model = readString(view, offset + valueOffset, littleEndian);
      }
      // DateTime tag (0x0132)
      else if (tag === 0x0132) {
        const valueOffset = view.getUint32(entryOffset + 8, littleEndian);
        exifData.dateTime = readString(view, offset + valueOffset, littleEndian);
      }
    }

    return exifData;
  } catch (error) {
    console.error('Error parsing EXIF data:', error);
    return null;
  }
}

/**
 * Read a null-terminated string from DataView
 */
function readString(view: DataView, offset: number, littleEndian: boolean): string {
  let str = '';
  let i = 0;
  while (offset + i < view.byteLength) {
    const char = view.getUint8(offset + i);
    if (char === 0) break;
    str += String.fromCharCode(char);
    i++;
  }
  return str;
}

/**
 * Correct image orientation based on EXIF data
 * Returns a canvas with the corrected image
 */
export async function correctOrientation(
  image: HTMLImageElement,
  orientation: number
): Promise<HTMLCanvasElement> {
  // Ensure image is loaded
  if (!image.complete) {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use naturalWidth/naturalHeight which are the actual image dimensions
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  // Set canvas dimensions based on orientation
  // Orientations 5-8 require swapping width and height
  if (orientation >= 5 && orientation <= 8) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  // Apply transformations based on orientation
  switch (orientation) {
    case 1:
      // Normal - no transformation needed
      ctx.drawImage(image, 0, 0, width, height);
      break;
    case 2:
      // Flip horizontal
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0, width, height);
      break;
    case 3:
      // Rotate 180°
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      ctx.drawImage(image, 0, 0, width, height);
      break;
    case 4:
      // Flip vertical
      ctx.translate(0, height);
      ctx.scale(1, -1);
      ctx.drawImage(image, 0, 0, width, height);
      break;
    case 5:
      // Rotate 90° CCW and flip horizontal
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      ctx.drawImage(image, 0, -height, width, height);
      break;
    case 6:
      // Rotate 90° CW
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -height);
      ctx.drawImage(image, 0, 0, width, height);
      break;
    case 7:
      // Rotate 90° CW and flip horizontal
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(width, -height);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0, width, height);
      break;
    case 8:
      // Rotate 90° CCW
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-width, 0);
      ctx.drawImage(image, 0, 0, width, height);
      break;
    default:
      // Unknown orientation - draw normally
      ctx.drawImage(image, 0, 0, width, height);
  }

  return canvas;
}

/**
 * Strip EXIF data from an image blob
 * Returns a new blob without EXIF metadata
 */
export async function stripEXIF(blob: Blob): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);

    // Check for JPEG signature
    if (view.getUint8(0) !== 0xFF || view.getUint8(1) !== 0xD8) {
      // Not a JPEG, return as-is
      return blob;
    }

    const newData: number[] = [0xFF, 0xD8]; // JPEG signature
    let offset = 2;

    // Copy all segments except APP1 (EXIF)
    while (offset < view.byteLength) {
      if (view.getUint8(offset) !== 0xFF) {
        break;
      }

      const marker = view.getUint8(offset + 1);
      const segmentLength = view.getUint16(offset + 2);

      // Skip APP1 marker (0xE1) which contains EXIF
      if (marker !== 0xE1) {
        // Copy this segment
        for (let i = 0; i < segmentLength + 2; i++) {
          newData.push(view.getUint8(offset + i));
        }
      }

      offset += 2 + segmentLength;

      // If we've reached the image data (SOS marker 0xDA), copy the rest
      if (marker === 0xDA) {
        for (let i = offset; i < view.byteLength; i++) {
          newData.push(view.getUint8(i));
        }
        break;
      }
    }

    return new Blob([new Uint8Array(newData)], { type: blob.type });
  } catch (error) {
    console.error('Error stripping EXIF data:', error);
    return blob;
  }
}

/**
 * EXIFProcessor class for backward compatibility
 */
export class EXIFProcessor {
  static async readEXIF(file: File): Promise<EXIFData | null> {
    return readEXIF(file);
  }

  static async correctOrientation(
    image: HTMLImageElement,
    orientation: number
  ): Promise<HTMLCanvasElement> {
    return correctOrientation(image, orientation);
  }

  static async stripEXIF(blob: Blob): Promise<Blob> {
    return stripEXIF(blob);
  }
}
