/**
 * Progress Tracker
 * 
 * Displays progress bar, updates percentage, shows current image,
 * and estimates time remaining for batch operations.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

export interface ProgressState {
  /** Current image being processed (0-based index) */
  currentIndex: number;
  /** Total number of images to process */
  total: number;
  /** Number of successfully processed images */
  successful: number;
  /** Number of failed images */
  failed: number;
  /** Current image filename */
  currentFilename: string;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining: number;
  /** Whether processing is complete */
  isComplete: boolean;
}

export interface ProgressTrackerOptions {
  /** Total number of items to process */
  total: number;
  /** Callback function called on progress updates */
  onProgress?: (state: ProgressState) => void;
}

export class ProgressTracker {
  private currentIndex: number = 0;
  private total: number;
  private successful: number = 0;
  private failed: number = 0;
  private currentFilename: string = '';
  private startTime: number = 0;
  private onProgress?: (state: ProgressState) => void;

  constructor(options: ProgressTrackerOptions) {
    this.total = options.total;
    this.onProgress = options.onProgress;
  }

  /**
   * Starts tracking progress
   * Requirement 6.1: Display a progress bar
   */
  start(): void {
    this.startTime = Date.now();
    this.currentIndex = 0;
    this.successful = 0;
    this.failed = 0;
    this.currentFilename = '';
    this.notifyProgress();
  }

  /**
   * Updates progress for the current item
   * Requirement 6.2: Update the progress percentage
   * Requirement 6.3: Show which image is currently being processed
   * 
   * @param filename - Name of the current file being processed
   */
  updateCurrent(filename: string): void {
    this.currentFilename = filename;
    this.notifyProgress();
  }

  /**
   * Marks the current item as successful and advances to the next
   * Requirement 6.2: Update the progress percentage
   */
  markSuccess(): void {
    this.successful++;
    this.currentIndex++;
    this.currentFilename = '';
    this.notifyProgress();
  }

  /**
   * Marks the current item as failed and advances to the next
   * Requirement 6.2: Update the progress percentage
   */
  markFailure(): void {
    this.failed++;
    this.currentIndex++;
    this.currentFilename = '';
    this.notifyProgress();
  }

  /**
   * Completes the progress tracking
   * Requirement 6.5: Display a completion summary
   */
  complete(): void {
    this.currentIndex = this.total;
    this.currentFilename = '';
    this.notifyProgress();
  }

  /**
   * Gets the current progress state
   * 
   * @returns Current progress state
   */
  getState(): ProgressState {
    return {
      currentIndex: this.currentIndex,
      total: this.total,
      successful: this.successful,
      failed: this.failed,
      currentFilename: this.currentFilename,
      percentage: this.calculatePercentage(),
      estimatedTimeRemaining: this.estimateTimeRemaining(),
      isComplete: this.currentIndex >= this.total,
    };
  }

  /**
   * Calculates the current progress percentage
   * Requirement 6.2: Update the progress percentage
   * 
   * @returns Progress percentage (0-100)
   */
  private calculatePercentage(): number {
    if (this.total === 0) return 0;
    return Math.round((this.currentIndex / this.total) * 100);
  }

  /**
   * Estimates the time remaining for completion
   * Requirement 6.4: Estimate time remaining
   * 
   * @returns Estimated time remaining in milliseconds
   */
  private estimateTimeRemaining(): number {
    if (this.currentIndex === 0 || this.startTime === 0) {
      return 0;
    }

    const elapsedMs = Date.now() - this.startTime;
    const avgTimePerItem = elapsedMs / this.currentIndex;
    const remainingItems = this.total - this.currentIndex;
    
    return Math.round(avgTimePerItem * remainingItems);
  }

  /**
   * Notifies listeners of progress updates
   */
  private notifyProgress(): void {
    if (this.onProgress) {
      this.onProgress(this.getState());
    }
  }

  /**
   * Formats time in milliseconds to a human-readable string
   * 
   * @param ms - Time in milliseconds
   * @returns Formatted time string (e.g., "2m 30s", "45s")
   */
  static formatTime(ms: number): string {
    if (ms < 1000) {
      return 'less than 1s';
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${seconds}s`;
  }

  /**
   * Resets the progress tracker to initial state
   */
  reset(): void {
    this.currentIndex = 0;
    this.successful = 0;
    this.failed = 0;
    this.currentFilename = '';
    this.startTime = 0;
  }
}
