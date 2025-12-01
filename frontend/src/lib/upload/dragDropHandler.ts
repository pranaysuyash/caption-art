/**
 * DragDropHandler - Handles drag-and-drop file upload functionality
 * 
 * Requirements:
 * - 1.2: Highlight zone with visual feedback on drag-over
 * - 1.3: Accept file on drop
 * - 1.5: Prevent default browser behavior
 */

export interface DragDropCallbacks {
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (files: File[]) => void;
}

export class DragDropHandler {
  private element: HTMLElement;
  private callbacks: DragDropCallbacks;
  private dragCounter: number = 0;

  constructor(element: HTMLElement, callbacks: DragDropCallbacks) {
    this.element = element;
    this.callbacks = callbacks;
    this.attachEventListeners();
  }

  /**
   * Attach drag-and-drop event listeners to the element
   */
  private attachEventListeners(): void {
    this.element.addEventListener('dragenter', this.handleDragEnter);
    this.element.addEventListener('dragover', this.handleDragOver);
    this.element.addEventListener('dragleave', this.handleDragLeave);
    this.element.addEventListener('drop', this.handleDrop);
  }

  /**
   * Handle drag enter event
   * Requirement 1.2: Provide visual feedback
   */
  private handleDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    
    this.dragCounter++;
    
    if (this.dragCounter === 1 && this.callbacks.onDragOver) {
      this.callbacks.onDragOver(event);
    }
  };

  /**
   * Handle drag over event
   * Requirement 1.5: Prevent default browser behavior
   */
  private handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    
    // Set dropEffect to indicate this is a copy operation
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  };

  /**
   * Handle drag leave event
   * Requirement 1.2: Remove visual feedback when drag leaves
   */
  private handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    
    this.dragCounter--;
    
    if (this.dragCounter === 0 && this.callbacks.onDragLeave) {
      this.callbacks.onDragLeave(event);
    }
  };

  /**
   * Handle drop event
   * Requirement 1.3: Accept file on drop
   * Requirement 1.5: Prevent default browser behavior
   */
  private handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    
    this.dragCounter = 0;
    
    // Remove visual feedback
    if (this.callbacks.onDragLeave) {
      this.callbacks.onDragLeave(event);
    }
    
    // Extract files from DataTransfer
    const files = this.extractFiles(event.dataTransfer);
    
    if (files.length > 0 && this.callbacks.onDrop) {
      this.callbacks.onDrop(files);
    }
  };

  /**
   * Extract files from DataTransfer object
   * Handles both files and items API
   */
  private extractFiles(dataTransfer: DataTransfer | null): File[] {
    if (!dataTransfer) {
      return [];
    }

    const files: File[] = [];

    // Try using DataTransferItemList first (more modern API)
    if (dataTransfer.items) {
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
    } else if (dataTransfer.files) {
      // Fallback to FileList
      for (let i = 0; i < dataTransfer.files.length; i++) {
        files.push(dataTransfer.files[i]);
      }
    }

    return files;
  }

  /**
   * Remove event listeners and clean up
   */
  public destroy(): void {
    this.element.removeEventListener('dragenter', this.handleDragEnter);
    this.element.removeEventListener('dragover', this.handleDragOver);
    this.element.removeEventListener('dragleave', this.handleDragLeave);
    this.element.removeEventListener('drop', this.handleDrop);
  }
}

/**
 * Helper function to create a DragDropHandler instance
 */
export function createDragDropHandler(
  element: HTMLElement,
  callbacks: DragDropCallbacks
): DragDropHandler {
  return new DragDropHandler(element, callbacks);
}
