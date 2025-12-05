/**
 * dateUtils.ts
 * Shared utilities for date formatting to prevent "Invalid Date" errors.
 */

/**
 * Formats a date string or Date object into a human-readable string.
 * Returns a fallback string (default "—") if the date is invalid or missing.
 * 
 * @param date - The date to format (string, Date, or null/undefined)
 * @param options - Intl.DateTimeFormatOptions
 * @param fallback - String to return if date is invalid (default: "—")
 */
export function formatDate(
  date: string | Date | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
  fallback: string = '—'
): string {
  if (!date) return fallback;

  try {
    const d = new Date(date);
    // Check if date is valid
    if (Number.isNaN(d.getTime())) {
      return fallback;
    }
    return d.toLocaleDateString('en-US', options);
  } catch (err) {
    return fallback;
  }
}

/**
 * Formats a date relative to now (e.g. "2 days ago")
 * @param date - The date to format
 */
export function formatRelativeTime(date: string | Date | number | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(d);
  } catch (err) {
    return '—';
  }
}
