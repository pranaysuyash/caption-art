/**
 * Batch Manager
 * 
 * Handles multiple file uploads (max 50), displays thumbnails,
 * validates each file, and generates summary.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { FileValidator } from '../upload/fileValidator';
import { BatchImage, BatchSummary } from './types';

const MAX_BATCH_SIZE = 50;

export class BatchManager {
  private images: BatchImage[] = [];

  /**
   * Adds multiple files to the batch
   * Requirement 1.1: Accept up to 50 images
   * Requirement 1.2: Display thumbnails of all images
   * Requirement 1.3: Validate each image individually
   * Requirement 1.4: Skip failed validation and continue with valid images
   * 
   * @param files - Array of files to add to the batch
   * @returns Promise resolving to array of BatchImage objects
   */
  async addFiles(files: File[]): Promise<BatchImage[]> {
    // Requirement 1.1: Enforce max batch size of 50
    const filesToAdd = files.slice(0, MAX_BATCH_SIZE - this.images.length);
    
    const batchImages: BatchImage[] = [];

    for (const file of filesToAdd) {
      const id = this.generateId();
      
      // Requirement 1.2: Create thumbnail for display
      const thumbnail = await this.createThumbnail(file);
      
      // Requirement 1.3: Validate each file individually
      const validationResult = FileValidator.validate(file);
      
      const batchImage: BatchImage = {
        id,
        file,
        thumbnail,
        status: validationResult.valid ? 'valid' : 'invalid',
        error: validationResult.error,
        validationResult,
      };

      batchImages.push(batchImage);
      this.images.push(batchImage);
    }

    return batchImages;
  }

  /**
   * Generates a summary of successful and failed uploads
   * Requirement 1.5: Display summary of successful and failed uploads
   * 
   * @returns BatchSummary object with counts and failed image details
   */
  generateSummary(): BatchSummary {
    const successful = this.images.filter(img => img.status === 'valid').length;
    const failed = this.images.filter(img => img.status === 'invalid').length;
    
    const failedImages = this.images
      .filter(img => img.status === 'invalid')
      .map(img => ({
        filename: img.file.name,
        error: img.error || 'Unknown error',
      }));

    return {
      total: this.images.length,
      successful,
      failed,
      failedImages,
    };
  }

  /**
   * Gets all images in the batch
   * @returns Array of BatchImage objects
   */
  getImages(): BatchImage[] {
    return [...this.images];
  }

  /**
   * Gets the current batch size
   * @returns Number of images in the batch
   */
  getBatchSize(): number {
    return this.images.length;
  }

  /**
   * Checks if the batch is at maximum capacity
   * @returns true if batch has reached max size of 50
   */
  isFull(): boolean {
    return this.images.length >= MAX_BATCH_SIZE;
  }

  /**
   * Checks if the batch is empty
   * Requirement 7.4: Exit batch mode when all images are removed
   * 
   * @returns true if batch has no images
   */
  isEmpty(): boolean {
    return this.images.length === 0;
  }

  /**
   * Removes an image from the batch by ID
   * Requirement 7.1: Remove image from the batch
   * Requirement 7.2: Update the batch count (implicit via array modification)
   * Requirement 7.3: Not affect other images in the batch
   * Requirement 7.5: Free memory used by the image
   * 
   * @param id - ID of the image to remove
   * @returns true if image was removed, false if not found
   */
  removeImage(id: string): boolean {
    const index = this.images.findIndex(img => img.id === id);
    if (index !== -1) {
      const image = this.images[index];
      
      // Requirement 7.5: Free memory by revoking object URLs
      if (image.thumbnail && image.thumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(image.thumbnail);
      }
      
      // Requirement 7.1 & 7.3: Remove from array without affecting others
      this.images.splice(index, 1);
      
      return true;
    }
    return false;
  }

  /**
   * Clears all images from the batch
   * Requirement 7.5: Free memory used by images
   */
  clear(): void {
    // Free memory by revoking object URLs
    this.images.forEach(image => {
      if (image.thumbnail && image.thumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(image.thumbnail);
      }
    });
    
    this.images = [];
  }

  /**
   * Creates a thumbnail URL for an image file
   * @param file - File to create thumbnail from
   * @returns Promise resolving to data URL of thumbnail
   */
  private async createThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generates a unique ID for a batch image
   * @returns Unique string ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Gets the maximum allowed batch size
   * @returns Maximum batch size (50)
   */
  static getMaxBatchSize(): number {
    return MAX_BATCH_SIZE;
  }
}
