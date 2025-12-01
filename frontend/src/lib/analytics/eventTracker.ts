/**
 * Event Tracker
 * 
 * Tracks specific user events:
 * - image_upload events
 * - caption_generate events
 * - export events
 * - style_apply events
 * 
 * Ensures PII is excluded from all tracked events
 */

import { getAnalyticsManager } from './analyticsManager';

/**
 * PII patterns to detect and exclude
 */
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\d{3}-\d{2}-\d{4}/g,
  creditCard: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
};

/**
 * Sanitize a value to remove PII
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    let sanitized = value;
    
    // Remove email addresses
    sanitized = sanitized.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
    
    // Remove phone numbers
    sanitized = sanitized.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
    
    // Remove SSNs
    sanitized = sanitized.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');
    
    // Remove credit card numbers
    sanitized = sanitized.replace(PII_PATTERNS.creditCard, '[CC_REDACTED]');
    
    return sanitized;
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  
  if (value !== null && typeof value === 'object') {
    return sanitizeProperties(value as Record<string, unknown>);
  }
  
  return value;
}

/**
 * Sanitize event properties to remove PII
 */
export function sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(properties)) {
    // Skip keys that commonly contain PII
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('email') ||
      lowerKey.includes('name') ||
      lowerKey.includes('phone') ||
      lowerKey.includes('address') ||
      lowerKey.includes('ssn') ||
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret')
    ) {
      continue;
    }
    
    sanitized[key] = sanitizeValue(value);
  }
  
  return sanitized;
}

/**
 * Track image upload event
 */
export function trackImageUpload(properties?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();
  const sanitized = properties ? sanitizeProperties(properties) : undefined;
  manager.track('image_upload', sanitized);
}

/**
 * Track caption generation event
 */
export function trackCaptionGenerate(properties?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();
  const sanitized = properties ? sanitizeProperties(properties) : undefined;
  manager.track('caption_generate', sanitized);
}

/**
 * Track export event
 */
export function trackExport(format: string, properties?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();
  const sanitized = properties ? sanitizeProperties(properties) : {};
  manager.track('export', { ...sanitized, format });
}

/**
 * Track style preset application event
 */
export function trackStyleApply(presetName: string, properties?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();
  const sanitized = properties ? sanitizeProperties(properties) : {};
  manager.track('style_apply', { ...sanitized, presetName });
}
