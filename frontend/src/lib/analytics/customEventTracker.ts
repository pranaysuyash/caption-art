/**
 * Custom Event Tracker
 * 
 * Allows triggering custom events with:
 * - Event name validation
 * - Custom properties (max 20)
 * - Automatic batching
 * - Offline queueing
 */

import { getAnalyticsManager } from './analyticsManager';
import { sanitizeProperties } from './eventTracker';

const MAX_PROPERTIES = 20;

/**
 * Event name validation rules:
 * - Must be lowercase with underscores
 * - Must start with a letter
 * - Can contain letters, numbers, and underscores
 * - Must be between 1 and 50 characters
 */
const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{0,49}$/;

/**
 * Validate event name follows naming conventions
 */
export function validateEventName(eventName: string): boolean {
  return EVENT_NAME_PATTERN.test(eventName);
}

/**
 * Validate and limit custom properties
 */
export function validateProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(properties);
  
  if (keys.length > MAX_PROPERTIES) {
    // Take only the first MAX_PROPERTIES
    const limitedProperties: Record<string, unknown> = {};
    for (let i = 0; i < MAX_PROPERTIES; i++) {
      limitedProperties[keys[i]] = properties[keys[i]];
    }
    return limitedProperties;
  }
  
  return properties;
}

/**
 * Track a custom event
 * 
 * @param eventName - Name of the event (must follow naming conventions)
 * @param properties - Optional custom properties (max 20)
 * @throws Error if event name is invalid
 */
export function trackCustomEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  // Validate event name
  if (!validateEventName(eventName)) {
    throw new Error(
      `Invalid event name: "${eventName}". Event names must be lowercase, ` +
      `start with a letter, contain only letters/numbers/underscores, and be 1-50 characters.`
    );
  }
  
  const manager = getAnalyticsManager();
  
  // Validate and limit properties
  let validatedProperties: Record<string, unknown> | undefined;
  if (properties) {
    const limited = validateProperties(properties);
    validatedProperties = sanitizeProperties(limited);
  }
  
  // Track the event (batching and offline queueing handled by AnalyticsManager)
  manager.track(eventName, validatedProperties);
}

/**
 * Check if the system is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get the current queue size (useful for monitoring offline events)
 */
export function getQueuedEventCount(): number {
  const manager = getAnalyticsManager();
  return manager.getQueueSize();
}
