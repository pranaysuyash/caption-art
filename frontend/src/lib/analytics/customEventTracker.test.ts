/**
 * Custom Event Tracker Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateEventName,
  validateProperties,
  trackCustomEvent,
  isOnline,
  getQueuedEventCount,
} from './customEventTracker';
import { getAnalyticsManager } from './analyticsManager';

// Mock the analytics manager
vi.mock('./analyticsManager', () => {
  const mockTrack = vi.fn();
  const mockGetQueueSize = vi.fn(() => 0);
  
  return {
    getAnalyticsManager: vi.fn(() => ({
      track: mockTrack,
      getQueueSize: mockGetQueueSize,
      hasConsent: () => true,
    })),
  };
});

describe('validateEventName', () => {
  it('should accept valid event names', () => {
    expect(validateEventName('button_click')).toBe(true);
    expect(validateEventName('page_view')).toBe(true);
    expect(validateEventName('user_signup')).toBe(true);
    expect(validateEventName('a')).toBe(true);
    expect(validateEventName('event123')).toBe(true);
  });

  it('should reject event names with uppercase letters', () => {
    expect(validateEventName('Button_Click')).toBe(false);
    expect(validateEventName('BUTTON_CLICK')).toBe(false);
  });

  it('should reject event names starting with numbers', () => {
    expect(validateEventName('123event')).toBe(false);
  });

  it('should reject event names with special characters', () => {
    expect(validateEventName('button-click')).toBe(false);
    expect(validateEventName('button.click')).toBe(false);
    expect(validateEventName('button click')).toBe(false);
    expect(validateEventName('button@click')).toBe(false);
  });

  it('should reject event names longer than 50 characters', () => {
    const longName = 'a'.repeat(51);
    expect(validateEventName(longName)).toBe(false);
  });

  it('should accept event names exactly 50 characters', () => {
    const maxName = 'a' + '_'.repeat(49);
    expect(validateEventName(maxName)).toBe(true);
  });

  it('should reject empty event names', () => {
    expect(validateEventName('')).toBe(false);
  });
});

describe('validateProperties', () => {
  it('should return properties unchanged when under limit', () => {
    const props = { a: 1, b: 2, c: 3 };
    expect(validateProperties(props)).toEqual(props);
  });

  it('should limit properties to 20 when over limit', () => {
    const props: Record<string, number> = {};
    for (let i = 0; i < 25; i++) {
      props[`prop${i}`] = i;
    }
    
    const result = validateProperties(props);
    expect(Object.keys(result).length).toBe(20);
  });

  it('should keep the first 20 properties when limiting', () => {
    const props: Record<string, number> = {};
    for (let i = 0; i < 25; i++) {
      props[`prop${i}`] = i;
    }
    
    const result = validateProperties(props);
    expect(result).toHaveProperty('prop0');
    expect(result).toHaveProperty('prop19');
    expect(result).not.toHaveProperty('prop20');
  });

  it('should handle empty properties object', () => {
    expect(validateProperties({})).toEqual({});
  });

  it('should handle exactly 20 properties', () => {
    const props: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      props[`prop${i}`] = i;
    }
    
    const result = validateProperties(props);
    expect(Object.keys(result).length).toBe(20);
  });
});

describe('trackCustomEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track valid custom events', () => {
    const manager = getAnalyticsManager();
    trackCustomEvent('button_click', { button_id: 'submit' });
    
    expect(manager.track).toHaveBeenCalledWith(
      'button_click',
      expect.objectContaining({ button_id: 'submit' })
    );
  });

  it('should throw error for invalid event names', () => {
    expect(() => {
      trackCustomEvent('Invalid-Event');
    }).toThrow(/Invalid event name/);
  });

  it('should track events without properties', () => {
    const manager = getAnalyticsManager();
    trackCustomEvent('simple_event');
    
    expect(manager.track).toHaveBeenCalledWith('simple_event', undefined);
  });

  it('should sanitize properties before tracking', () => {
    const manager = getAnalyticsManager();
    trackCustomEvent('user_action', {
      action: 'click',
      email: 'test@example.com', // Should be filtered out
      count: 5,
    });
    
    expect(manager.track).toHaveBeenCalled();
    const callArgs = (manager.track as any).mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('email');
  });

  it('should limit properties to 20', () => {
    const manager = getAnalyticsManager();
    const props: Record<string, number> = {};
    for (let i = 0; i < 25; i++) {
      props[`prop${i}`] = i;
    }
    
    trackCustomEvent('event_with_many_props', props);
    
    expect(manager.track).toHaveBeenCalled();
    const callArgs = (manager.track as any).mock.calls[0];
    expect(Object.keys(callArgs[1]).length).toBeLessThanOrEqual(20);
  });
});

describe('isOnline', () => {
  it('should return navigator.onLine status', () => {
    // This will return the actual browser status
    const result = isOnline();
    expect(typeof result).toBe('boolean');
  });
});

describe('getQueuedEventCount', () => {
  it('should return queue size from analytics manager', () => {
    const count = getQueuedEventCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
