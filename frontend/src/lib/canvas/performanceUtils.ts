/**
 * Performance utilities for canvas rendering optimization
 * Provides debouncing and requestAnimationFrame helpers
 */

/**
 * Debounce function that delays execution until after wait milliseconds
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function using requestAnimationFrame for smooth 60fps updates
 * @param func - Function to throttle
 * @returns Throttled function
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let latestArgs: Parameters<T> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    latestArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs !== null) {
          func(...latestArgs);
          latestArgs = null;
        }
        rafId = null;
      });
    }
  };
}

/**
 * Cancel a pending requestAnimationFrame
 * @param rafId - The RAF ID to cancel
 */
export function cancelRaf(rafId: number | null): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
}
