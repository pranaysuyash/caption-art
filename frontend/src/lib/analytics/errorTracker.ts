/**
 * Error Tracker
 * 
 * Captures and reports application errors:
 * - Error messages and stack traces
 * - Context (browser, OS, version)
 * - Error grouping
 * - Critical error alerts
 * - Sensitive data exclusion
 */

import { getAnalyticsManager } from './analyticsManager';

/**
 * Browser information
 */
interface BrowserInfo {
  name: string;
  version: string;
  userAgent: string;
}

/**
 * Operating system information
 */
interface OSInfo {
  name: string;
  version: string;
}

/**
 * Error context information
 */
export interface ErrorContext {
  browser: BrowserInfo;
  os: OSInfo;
  appVersion: string;
  url: string;
  timestamp: number;
}

/**
 * Tracked error information
 */
export interface TrackedError {
  message: string;
  stack?: string;
  context: ErrorContext;
  groupKey: string;
  isCritical: boolean;
}

/**
 * Sensitive data patterns to exclude from error messages
 */
const SENSITIVE_PATTERNS = {
  apiKey: /api[_-]?key[=:]\s*['"]?[\w-]+['"]?/gi,
  token: /token[=:]\s*['"]?[\w.-]+['"]?/gi,
  password: /password[=:]\s*['"]?[^\s'"]+['"]?/gi,
  secret: /secret[=:]\s*['"]?[\w-]+['"]?/gi,
  authorization: /authorization:\s*['"]?[^\s'"]+['"]?/gi,
};

/**
 * Get browser information
 */
function getBrowserInfo(): BrowserInfo {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';

  // Detect browser
  if (ua.includes('Firefox/')) {
    name = 'Firefox';
    version = ua.match(/Firefox\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    name = 'Chrome';
    version = ua.match(/Chrome\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    name = 'Safari';
    version = ua.match(/Version\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Edg/')) {
    name = 'Edge';
    version = ua.match(/Edg\/([\d.]+)/)?.[1] || 'Unknown';
  }

  return { name, version, userAgent: ua };
}

/**
 * Get operating system information
 */
function getOSInfo(): OSInfo {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';

  if (ua.includes('Windows')) {
    name = 'Windows';
    if (ua.includes('Windows NT 10.0')) version = '10';
    else if (ua.includes('Windows NT 6.3')) version = '8.1';
    else if (ua.includes('Windows NT 6.2')) version = '8';
    else if (ua.includes('Windows NT 6.1')) version = '7';
  } else if (ua.includes('Mac OS X')) {
    name = 'macOS';
    version = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || 'Unknown';
  } else if (ua.includes('Linux')) {
    name = 'Linux';
  } else if (ua.includes('Android')) {
    name = 'Android';
    version = ua.match(/Android ([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    name = 'iOS';
    version = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || 'Unknown';
  }

  return { name, version };
}

/**
 * Get application version
 */
function getAppVersion(): string {
  // In a real app, this would come from package.json or build config
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
}

/**
 * Sanitize error message to remove sensitive data
 */
function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  // Remove sensitive patterns
  for (const [key, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    sanitized = sanitized.replace(pattern, `[${key.toUpperCase()}_REDACTED]`);
  }

  return sanitized;
}

/**
 * Sanitize stack trace to remove sensitive data
 */
function sanitizeStackTrace(stack: string | undefined): string | undefined {
  if (!stack) return undefined;

  let sanitized = stack;

  // Remove sensitive patterns
  for (const [key, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    sanitized = sanitized.replace(pattern, `[${key.toUpperCase()}_REDACTED]`);
  }

  return sanitized;
}

/**
 * Generate a group key for similar errors
 * Groups errors by message and first line of stack trace
 */
export function generateErrorGroupKey(message: string, stack?: string): string {
  // Use message as base
  let key = message;

  // Add first meaningful line from stack trace
  if (stack) {
    const lines = stack.split('\n');
    const firstMeaningfulLine = lines.find(line => 
      line.trim() && !line.includes('Error:') && line.includes('at ')
    );
    if (firstMeaningfulLine) {
      // Extract just the function/file part, not line numbers
      const match = firstMeaningfulLine.match(/at\s+([^(]+)/);
      if (match) {
        key += `|${match[1].trim()}`;
      }
    }
  }

  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `error_${Math.abs(hash)}`;
}

/**
 * Determine if an error is critical
 * Critical errors include:
 * - Network failures
 * - API errors
 * - Data corruption
 * - Security issues
 */
export function isCriticalError(error: Error): boolean {
  const message = error.message.toLowerCase();

  const criticalKeywords = [
    'network',
    'api',
    'fetch failed',
    'cors',
    'unauthorized',
    'forbidden',
    'security',
    'corruption',
    'data loss',
    'fatal',
  ];

  return criticalKeywords.some(keyword => message.includes(keyword));
}

/**
 * Get error context
 */
export function getErrorContext(): ErrorContext {
  return {
    browser: getBrowserInfo(),
    os: getOSInfo(),
    appVersion: getAppVersion(),
    url: window.location.href,
    timestamp: Date.now(),
  };
}

/**
 * Track an error
 */
export function trackError(error: Error, additionalContext?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();

  // Get context
  const context = getErrorContext();

  // Sanitize error data
  const sanitizedMessage = sanitizeErrorMessage(error.message);
  const sanitizedStack = sanitizeStackTrace(error.stack);

  // Generate group key
  const groupKey = generateErrorGroupKey(sanitizedMessage, sanitizedStack);

  // Determine if critical
  const critical = isCriticalError(error);

  // Create tracked error
  const trackedError: TrackedError = {
    message: sanitizedMessage,
    stack: sanitizedStack,
    context,
    groupKey,
    isCritical: critical,
  };

  // Track the error event
  manager.track('error', {
    ...trackedError,
    ...additionalContext,
  });

  // Send immediate alert for critical errors
  if (critical) {
    sendCriticalErrorAlert(trackedError);
  }
}

/**
 * Send alert for critical errors
 */
function sendCriticalErrorAlert(error: TrackedError): void {
  // In a real app, this would send to an alerting service
  console.error('CRITICAL ERROR ALERT:', error);

  // Could also use navigator.sendBeacon for reliability
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(error)], { type: 'application/json' });
    navigator.sendBeacon('/api/critical-error', blob);
  }
}

/**
 * Set up global error handlers
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    trackError(error, {
      type: 'unhandled_rejection',
    });
  });
}
