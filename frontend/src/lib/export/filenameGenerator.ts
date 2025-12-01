/**
 * Filename Generator for Export System
 * Generates descriptive filenames for exported images
 */

export interface FilenameOptions {
  format: 'png' | 'jpeg';
  watermarked: boolean;
  timestamp?: Date;
  customText?: string;
}

export class FilenameGenerator {
  /**
   * Generate a filename based on the provided options
   * Format: caption-art-YYYYMMDD-HHMMSS[-watermarked].{png|jpg}
   */
  static generate(options: FilenameOptions): string {
    const timestamp = options.timestamp || new Date();
    
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hours = String(timestamp.getHours()).padStart(2, '0');
    const minutes = String(timestamp.getMinutes()).padStart(2, '0');
    const seconds = String(timestamp.getSeconds()).padStart(2, '0');
    
    const timestampStr = `${year}${month}${day}-${hours}${minutes}${seconds}`;
    const watermarkSuffix = options.watermarked ? '-watermarked' : '';
    const extension = options.format === 'png' ? 'png' : 'jpg';
    
    let filename = `caption-art-${timestampStr}${watermarkSuffix}.${extension}`;
    
    // Apply custom text if provided
    if (options.customText) {
      const sanitizedText = this.sanitize(options.customText);
      filename = `caption-art-${sanitizedText}-${timestampStr}${watermarkSuffix}.${extension}`;
    }
    
    return filename;
  }

  /**
   * Sanitize a filename to ensure filesystem compatibility
   * - Remove special characters
   * - Replace spaces with hyphens
   * - Limit length to 255 characters
   */
  static sanitize(filename: string): string {
    // Replace spaces with hyphens
    let sanitized = filename.replace(/\s+/g, '-');
    
    // Remove special characters, keep only alphanumeric, hyphens, and underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9-_]/g, '');
    
    // Remove multiple consecutive hyphens
    sanitized = sanitized.replace(/-+/g, '-');
    
    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');
    
    // Limit length to 255 characters (filesystem limit)
    // Reserve space for timestamp, watermark suffix, and extension (~40 chars)
    const maxLength = 200;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }

  /**
   * Ensure filename is unique by checking against existing filenames
   * Appends counter (-1, -2, etc.) if needed
   */
  static ensureUnique(filename: string, existingFilenames: string[] = []): string {
    if (!existingFilenames.includes(filename)) {
      return filename;
    }
    
    // Extract base name and extension
    const lastDotIndex = filename.lastIndexOf('.');
    const baseName = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    
    // Try appending counter until we find a unique name
    let counter = 1;
    let uniqueFilename = `${baseName}-${counter}${extension}`;
    
    while (existingFilenames.includes(uniqueFilename)) {
      counter++;
      uniqueFilename = `${baseName}-${counter}${extension}`;
    }
    
    return uniqueFilename;
  }
}
