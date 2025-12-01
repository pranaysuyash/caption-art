/**
 * Privacy Manager
 * 
 * Manages user privacy preferences for analytics tracking:
 * - Display consent banner (Requirement 4.1)
 * - Handle opt-out (Requirement 4.2)
 * - Handle opt-in (Requirement 4.3)
 * - Delete collected data on opt-out (Requirement 4.4)
 * - Persist preference (Requirement 4.5)
 */

import { getAnalyticsManager } from './analyticsManager';

const STORAGE_KEY_CONSENT = 'analytics_consent';
const STORAGE_KEY_QUEUE = 'analytics_queue';
const STORAGE_KEY_FLOW = 'analytics_flow';
const STORAGE_KEY_CONVERSION = 'analytics_conversion';
const STORAGE_KEY_FREE_TIER = 'analytics_free_tier';

export interface ConsentPreference {
  hasConsented: boolean;
  timestamp: number;
  version?: string; // For tracking consent version changes
}

export class PrivacyManager {
  private analyticsManager = getAnalyticsManager();

  /**
   * Check if user has given consent
   * Requirement 4.3
   */
  public hasConsent(): boolean {
    return this.analyticsManager.hasConsent();
  }

  /**
   * Check if consent banner should be displayed
   * Requirement 4.1
   */
  public shouldShowConsentBanner(): boolean {
    return this.analyticsManager.shouldShowConsentBanner();
  }

  /**
   * Get current consent preference
   */
  public getConsentPreference(): ConsentPreference | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONSENT);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get consent preference:', error);
    }
    return null;
  }

  /**
   * User opts in to analytics tracking
   * Requirement 4.3
   */
  public optIn(): void {
    this.analyticsManager.optIn();
    
    // Track the opt-in event itself (now that we have consent)
    this.analyticsManager.track('privacy_opt_in', {
      timestamp: Date.now(),
    });
  }

  /**
   * User opts out of analytics tracking
   * Requirements 4.2, 4.4
   */
  public optOut(): void {
    // Delete all collected data before opting out
    this.deleteAllData();
    
    // Set opt-out preference
    this.analyticsManager.optOut();
  }

  /**
   * Delete all collected analytics data
   * Requirement 4.4
   */
  public deleteAllData(): void {
    try {
      // Clear event queue
      localStorage.removeItem(STORAGE_KEY_QUEUE);
      
      // Clear flow tracking data
      localStorage.removeItem(STORAGE_KEY_FLOW);
      
      // Clear conversion tracking data
      localStorage.removeItem(STORAGE_KEY_CONVERSION);
      
      // Clear free tier usage data
      localStorage.removeItem(STORAGE_KEY_FREE_TIER);
      
      // Clear any other analytics-related data
      this.clearAnalyticsData();
      
      // Clear the analytics manager's queue
      this.analyticsManager.clearQueue();
    } catch (error) {
      console.error('Failed to delete analytics data:', error);
    }
  }

  /**
   * Clear all analytics data from localStorage
   * Helper method to find and remove all analytics-related keys
   */
  private clearAnalyticsData(): void {
    try {
      const keysToRemove: string[] = [];
      
      // Find all keys that start with 'analytics_'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('analytics_')) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all analytics keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear analytics data:', error);
    }
  }

  /**
   * Update consent preference
   * Requirement 4.5
   */
  public updateConsent(hasConsented: boolean): void {
    if (hasConsented) {
      this.optIn();
    } else {
      this.optOut();
    }
  }

  /**
   * Reset consent (for testing or re-prompting)
   */
  public resetConsent(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_CONSENT);
    } catch (error) {
      console.error('Failed to reset consent:', error);
    }
  }

  /**
   * Export user's analytics data (for GDPR compliance)
   */
  public exportUserData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    
    try {
      // Get consent preference
      const consent = this.getConsentPreference();
      if (consent) {
        data.consent = consent;
      }
      
      // Get queued events
      const queue = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (queue) {
        data.queuedEvents = JSON.parse(queue);
      }
      
      // Get flow data
      const flow = localStorage.getItem(STORAGE_KEY_FLOW);
      if (flow) {
        data.flowData = JSON.parse(flow);
      }
      
      // Get conversion data
      const conversion = localStorage.getItem(STORAGE_KEY_CONVERSION);
      if (conversion) {
        data.conversionData = JSON.parse(conversion);
      }
      
      // Get free tier data
      const freeTier = localStorage.getItem(STORAGE_KEY_FREE_TIER);
      if (freeTier) {
        data.freeTierData = JSON.parse(freeTier);
      }
    } catch (error) {
      console.error('Failed to export user data:', error);
    }
    
    return data;
  }

  /**
   * Check if analytics is currently enabled
   */
  public isAnalyticsEnabled(): boolean {
    return this.hasConsent();
  }

  /**
   * Get consent timestamp
   */
  public getConsentTimestamp(): number | null {
    const preference = this.getConsentPreference();
    return preference?.timestamp ?? null;
  }
}

// Singleton instance
let privacyManagerInstance: PrivacyManager | null = null;

/**
 * Initialize the privacy manager
 */
export function initPrivacyManager(): PrivacyManager {
  if (!privacyManagerInstance) {
    privacyManagerInstance = new PrivacyManager();
  }
  return privacyManagerInstance;
}

/**
 * Get the privacy manager instance
 */
export function getPrivacyManager(): PrivacyManager {
  if (!privacyManagerInstance) {
    privacyManagerInstance = new PrivacyManager();
  }
  return privacyManagerInstance;
}

/**
 * Convenience function to check if consent banner should be shown
 * Requirement 4.1
 */
export function shouldShowConsentBanner(): boolean {
  return getPrivacyManager().shouldShowConsentBanner();
}

/**
 * Convenience function to opt in
 * Requirement 4.3
 */
export function optIn(): void {
  getPrivacyManager().optIn();
}

/**
 * Convenience function to opt out
 * Requirements 4.2, 4.4
 */
export function optOut(): void {
  getPrivacyManager().optOut();
}

/**
 * Convenience function to check consent
 */
export function hasConsent(): boolean {
  return getPrivacyManager().hasConsent();
}

/**
 * Convenience function to delete all data
 * Requirement 4.4
 */
export function deleteAllAnalyticsData(): void {
  getPrivacyManager().deleteAllData();
}
