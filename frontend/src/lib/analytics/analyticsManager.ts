/**
 * Analytics Manager
 * 
 * Main analytics orchestrator that handles:
 * - Initialization of analytics service
 * - Opt-in/opt-out management
 * - Event queue management
 * - Batching and sending events
 */

import type { AnalyticsEvent, AnalyticsConfig, AnalyticsConsent } from './types';

const STORAGE_KEY_CONSENT = 'analytics_consent';
const STORAGE_KEY_QUEUE = 'analytics_queue';

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  maxQueueSize: 100,
};

export class AnalyticsManager {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: number | null = null;
  private consent: AnalyticsConsent | null = null;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadConsent();
    this.loadQueue();
    this.startFlushTimer();
  }

  /**
   * Load consent preference from localStorage
   */
  private loadConsent(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONSENT);
      if (stored) {
        this.consent = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load analytics consent:', error);
    }
  }

  /**
   * Save consent preference to localStorage
   */
  private saveConsent(): void {
    try {
      if (this.consent) {
        localStorage.setItem(STORAGE_KEY_CONSENT, JSON.stringify(this.consent));
      }
    } catch (error) {
      console.error('Failed to save analytics consent:', error);
    }
  }

  /**
   * Load queued events from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (stored) {
        this.eventQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load analytics queue:', error);
      this.eventQueue = [];
    }
  }

  /**
   * Save event queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Failed to save analytics queue:', error);
    }
  }

  /**
   * Start the automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop the automatic flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Check if user has consented to analytics
   */
  public hasConsent(): boolean {
    return this.consent?.hasConsented === true;
  }

  /**
   * Check if consent banner should be shown
   */
  public shouldShowConsentBanner(): boolean {
    return this.consent === null || this.consent.hasConsented === null;
  }

  /**
   * User opts in to analytics
   */
  public optIn(): void {
    this.consent = {
      hasConsented: true,
      timestamp: Date.now(),
    };
    this.saveConsent();
    this.startFlushTimer();
  }

  /**
   * User opts out of analytics
   */
  public optOut(): void {
    this.consent = {
      hasConsented: false,
      timestamp: Date.now(),
    };
    this.saveConsent();
    this.clearQueue();
    this.stopFlushTimer();
  }

  /**
   * Track an analytics event
   */
  public track(eventName: string, properties?: Record<string, unknown>): void {
    // Don't track if user hasn't consented
    if (!this.hasConsent()) {
      return;
    }

    // Don't track if analytics is disabled
    if (!this.config.enabled) {
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    this.eventQueue.push(event);

    // Enforce max queue size
    if (this.eventQueue.length > this.config.maxQueueSize) {
      this.eventQueue = this.eventQueue.slice(-this.config.maxQueueSize);
    }

    this.saveQueue();

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush queued events to analytics service
   */
  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    if (!this.hasConsent()) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];
    this.saveQueue();

    try {
      // TODO: Send events to actual analytics service
      // For now, just log them
      console.log('Analytics events:', eventsToSend);
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events on failure
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
      if (this.eventQueue.length > this.config.maxQueueSize) {
        this.eventQueue = this.eventQueue.slice(-this.config.maxQueueSize);
      }
      this.saveQueue();
    }
  }

  /**
   * Clear all queued events
   */
  public clearQueue(): void {
    this.eventQueue = [];
    try {
      localStorage.removeItem(STORAGE_KEY_QUEUE);
    } catch (error) {
      console.error('Failed to clear analytics queue:', error);
    }
  }

  /**
   * Get current queue size
   */
  public getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Destroy the analytics manager
   */
  public destroy(): void {
    this.stopFlushTimer();
    this.flush();
  }
}

// Singleton instance
let analyticsManagerInstance: AnalyticsManager | null = null;

/**
 * Initialize the analytics manager
 */
export function initAnalyticsManager(config?: Partial<AnalyticsConfig>): AnalyticsManager {
  if (!analyticsManagerInstance) {
    analyticsManagerInstance = new AnalyticsManager(config);
  }
  return analyticsManagerInstance;
}

/**
 * Get the analytics manager instance
 */
export function getAnalyticsManager(): AnalyticsManager {
  if (!analyticsManagerInstance) {
    analyticsManagerInstance = new AnalyticsManager();
  }
  return analyticsManagerInstance;
}
