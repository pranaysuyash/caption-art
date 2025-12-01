/**
 * ConsentBanner Component Tests
 * 
 * Tests the consent banner UI component for analytics tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getAnalyticsManager } from '../lib/analytics/analyticsManager';

describe('ConsentBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should integrate with AnalyticsManager for consent state', () => {
    const manager = getAnalyticsManager();
    
    // Initially should show banner
    expect(manager.shouldShowConsentBanner()).toBe(true);
    expect(manager.hasConsent()).toBe(false);
    
    // After opt-in, should not show banner
    manager.optIn();
    expect(manager.shouldShowConsentBanner()).toBe(false);
    expect(manager.hasConsent()).toBe(true);
  });

  it('should handle opt-out correctly', () => {
    const manager = getAnalyticsManager();
    
    manager.optIn();
    expect(manager.hasConsent()).toBe(true);
    
    manager.optOut();
    expect(manager.hasConsent()).toBe(false);
  });

  it('should persist consent preference across sessions', () => {
    const manager1 = getAnalyticsManager();
    manager1.optIn();
    
    // Simulate new session by creating new manager instance
    const manager2 = getAnalyticsManager();
    expect(manager2.hasConsent()).toBe(true);
    expect(manager2.shouldShowConsentBanner()).toBe(false);
  });

  it('should clear analytics queue on opt-out', () => {
    const manager = getAnalyticsManager();
    
    manager.optIn();
    manager.track('test_event');
    expect(manager.getQueueSize()).toBeGreaterThan(0);
    
    manager.optOut();
    expect(manager.getQueueSize()).toBe(0);
  });
});
