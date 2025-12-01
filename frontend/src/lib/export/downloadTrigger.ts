/**
 * Download Trigger Module
 * Handles browser download initiation for exported images
 */

export interface DownloadOptions {
  filename: string;
  dataUrl?: string;
  blob?: Blob;
  mimeType: string;
}

/**
 * Triggers a browser download for the provided image data
 * Uses data URL or blob URL depending on what's provided
 * Falls back to opening in new tab if download is blocked
 */
export class DownloadTrigger {
  /**
   * Main trigger function that initiates the download
   * @param options - Download configuration including filename and data
   * Validates: Requirements 1.4, 7.2 (9.4)
   */
  static trigger(options: DownloadOptions): void {
    try {
      if (options.blob) {
        // Method 2: Use blob URL (better for large files)
        const url = URL.createObjectURL(options.blob);
        const success = this.createAndClickDownloadLink(url, options.filename);
        
        // Clean up blob URL after a short delay
        setTimeout(() => {
          this.revokeObjectURL(url);
        }, 100);
        
        if (!success) {
          // Download was blocked, try fallback (9.4)
          console.warn('Download blocked, attempting fallback');
          this.fallbackToNewTab(url);
          // Note: We don't throw here because fallback was attempted
          // In a real app, you might show a toast notification instead
        }
      } else if (options.dataUrl) {
        // Method 1: Use data URL (simple, works for smaller files)
        const success = this.createAndClickDownloadLink(options.dataUrl, options.filename);
        
        if (!success) {
          // Download was blocked, try fallback (9.4)
          console.warn('Download blocked, attempting fallback');
          this.fallbackToNewTab(options.dataUrl);
          // Note: We don't throw here because fallback was attempted
          // In a real app, you might show a toast notification instead
        }
      } else {
        throw new Error('Either dataUrl or blob must be provided');
      }
    } catch (error) {
      console.error('Download failed:', error);
      this.handleDownloadError(error, options);
      
      // Re-throw with user-friendly message (9.4)
      if (error instanceof Error) {
        if (error.message.includes('blocked')) {
          throw error; // Already user-friendly
        }
        if (error.message.includes('filesystem') || error.message.includes('disk')) {
          throw new Error('Unable to save file. Please check available disk space.');
        }
      }
      throw new Error('Unable to save file. Please try again.');
    }
  }

  /**
   * Creates a download link element and triggers a click
   * @param url - Data URL or blob URL
   * @param filename - Name for the downloaded file
   * @returns true if successful, false otherwise
   */
  static createAndClickDownloadLink(url: string, filename: string): boolean {
    try {
      const anchor = this.createDownloadLink(url, filename);
      
      // Append to body (required for Firefox)
      document.body.appendChild(anchor);
      
      // Trigger download
      anchor.click();
      
      // Cleanup
      document.body.removeChild(anchor);
      
      return true;
    } catch (error) {
      console.error('Failed to create download link:', error);
      return false;
    }
  }

  /**
   * Creates an anchor element configured for download
   * @param url - Data URL or blob URL
   * @param filename - Name for the downloaded file
   * @returns Configured anchor element
   */
  static createDownloadLink(url: string, filename: string): HTMLAnchorElement {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    return anchor;
  }

  /**
   * Revokes a blob URL to free up memory
   * @param url - Blob URL to revoke
   */
  static revokeObjectURL(url: string): void {
    try {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to revoke object URL:', error);
    }
  }

  /**
   * Fallback method: opens the image in a new tab
   * Used when download is blocked by browser (9.4)
   * @param url - Data URL or blob URL
   */
  private static fallbackToNewTab(url: string): void {
    try {
      console.warn('Download blocked, opening in new tab');
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        // Popup was blocked - this is a warning, not a fatal error
        console.error('Popup blocked. User needs to allow popups or manually save.');
        // Don't throw - the fallback was attempted
      }
    } catch (error) {
      console.error('Failed to open in new tab:', error);
      // Don't throw - the fallback was attempted
    }
  }

  /**
   * Handles download errors and provides user feedback
   * @param error - The error that occurred
   * @param options - Original download options
   */
  private static handleDownloadError(error: unknown, options: DownloadOptions): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Download error details:', {
      error: errorMessage,
      filename: options.filename,
      mimeType: options.mimeType,
      hasDataUrl: !!options.dataUrl,
      hasBlob: !!options.blob
    });

    // Provide manual save instructions
    console.log('Manual save instructions:');
    console.log('1. Right-click on the canvas');
    console.log('2. Select "Save image as..."');
    console.log('3. Choose a location and save');
  }
}
