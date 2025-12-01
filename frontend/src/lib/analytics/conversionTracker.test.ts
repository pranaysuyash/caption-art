/**
 * Conversion Tracker Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackFreeTierExport,
  trackFreeTierCaption,
  getFreeTierUsageStats,
  trackPromptView,
  trackUpgradeClick,
  trackConversion,
  calculateConversionMetrics,
  resetConversionMetrics,
  resetFreeTierUsage,
} from './conversionTracker';
import { getAnalyticsManager } from './analyticsManager';

describe('ConversionTracker', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset analytics manager
    const manager = getAnalyticsManager();
    manager.optIn();
    manager.clearQueue();
  });

  describe('Free Tier Usage Tracking', () => {
    it('should track free tier export usage', () => {
      const manager = getAnalyticsManager();
      const trackSpy = vi.spyOn(manager, 'track');

      trackFreeTierExport({ format: 'png' });

      expect(trackSpy).toHaveBeenCalledWith('free_tier_export', {
        format: 'png',
        totalExports: 1,
      });

      const usage = getFreeTierUsageStats();
      expect(usage.exportsCount).toBe(1);
      expect(usage.lastExportTimestamp).toBeDefined();
    });

    it('should increment export count on multiple exports', () => {
      trackFreeTierExport();
      trackFreeTierExport();
      trackFreeTierExport();

      const usage = getFreeTierUsageStats();
      expect(usage.exportsCount).toBe(3);
    });

    it('should track free tier caption usage', () => {
      const manager = getAnalyticsManager();
      const trackSpy = vi.spyOn(manager, 'track');

      trackFreeTierCaption({ style: 'professional' });

      expect(trackSpy).toHaveBeenCalledWith('free_tier_caption', {
        style: 'professional',
        totalCaptions: 1,
      });

      const usage = getFreeTierUsageStats();
      expect(usage.captionsCount).toBe(1);
      expect(usage.lastCaptionTimestamp).toBeDefined();
    });

    it('should increment caption count on multiple generations', () => {
      trackFreeTierCaption();
      trackFreeTierCaption();

      const usage = getFreeTierUsageStats();
      expect(usage.captionsCount).toBe(2);
    });

    it('should persist usage across page reloads', () => {
      trackFreeTierExport();
      trackFreeTierCaption();

      // Simulate page reload by getting fresh stats
      const usage = getFreeTierUsageStats();
      expect(usage.exportsCount).toBe(1);
      expect(usage.captionsCount).toBe(1);
    });

    it('should reset free tier usage', () => {
      trackFreeTierExport();
      trackFreeTierCaption();

      resetFreeTierUsage();

      const usage = getFreeTierUsageStats();
      expect(usage.exportsCount).toBe(0);
      expect(usage.captionsCount).toBe(0);
    });
  });

  describe('Conversion Funnel Tracking', () => {
    it('should track prompt views', () => {
      const manager = getAnalyticsManager();
      const trackSpy = vi.spyOn(manager, 'track');

      trackPromptView({ trigger: 'export_limit' });

      expect(trackSpy).toHaveBeenCalledWith('prompt_view', {
        trigger: 'export_limit',
        totalViews: 1,
      });
    });

    it('should track upgrade clicks', () => {
      const manager = getAnalyticsManager();
      const trackSpy = vi.spyOn(manager, 'track');

      trackUpgradeClick({ source: 'banner' });

      expect(trackSpy).toHaveBeenCalledWith('upgrade_click', {
        source: 'banner',
        totalClicks: 1,
      });
    });

    it('should track conversions', () => {
      const manager = getAnalyticsManager();
      const trackSpy = vi.spyOn(manager, 'track');

      trackConversion({ plan: 'pro' });

      expect(trackSpy).toHaveBeenCalledWith('conversion', {
        plan: 'pro',
        totalConversions: 1,
      });
    });

    it('should increment counts correctly', () => {
      trackPromptView();
      trackPromptView();
      trackUpgradeClick();
      trackConversion();

      const metrics = calculateConversionMetrics();
      expect(metrics.promptViews).toBe(2);
      expect(metrics.upgradeClicks).toBe(1);
      expect(metrics.conversions).toBe(1);
    });
  });

  describe('Conversion Rate Calculations', () => {
    it('should calculate click-through rate', () => {
      trackPromptView();
      trackPromptView();
      trackPromptView();
      trackPromptView();
      trackUpgradeClick();

      const metrics = calculateConversionMetrics();
      expect(metrics.clickThroughRate).toBe(0.25); // 1/4
    });

    it('should calculate conversion rate', () => {
      trackUpgradeClick();
      trackUpgradeClick();
      trackUpgradeClick();
      trackUpgradeClick();
      trackConversion();

      const metrics = calculateConversionMetrics();
      expect(metrics.conversionRate).toBe(0.25); // 1/4
    });

    it('should calculate overall conversion rate', () => {
      trackPromptView();
      trackPromptView();
      trackPromptView();
      trackPromptView();
      trackPromptView();
      trackUpgradeClick();
      trackUpgradeClick();
      trackConversion();

      const metrics = calculateConversionMetrics();
      expect(metrics.overallConversionRate).toBe(0.2); // 1/5
    });

    it('should handle zero views gracefully', () => {
      const metrics = calculateConversionMetrics();
      expect(metrics.clickThroughRate).toBe(0);
      expect(metrics.conversionRate).toBe(0);
      expect(metrics.overallConversionRate).toBe(0);
    });

    it('should handle zero clicks gracefully', () => {
      trackPromptView();
      trackPromptView();

      const metrics = calculateConversionMetrics();
      expect(metrics.conversionRate).toBe(0);
    });

    it('should calculate complete funnel metrics', () => {
      // Simulate a realistic funnel
      // 100 prompt views
      for (let i = 0; i < 100; i++) {
        trackPromptView();
      }
      
      // 20 upgrade clicks (20% CTR)
      for (let i = 0; i < 20; i++) {
        trackUpgradeClick();
      }
      
      // 5 conversions (25% conversion rate, 5% overall)
      for (let i = 0; i < 5; i++) {
        trackConversion();
      }

      const metrics = calculateConversionMetrics();
      expect(metrics.promptViews).toBe(100);
      expect(metrics.upgradeClicks).toBe(20);
      expect(metrics.conversions).toBe(5);
      expect(metrics.clickThroughRate).toBe(0.2);
      expect(metrics.conversionRate).toBe(0.25);
      expect(metrics.overallConversionRate).toBe(0.05);
    });

    it('should reset conversion metrics', () => {
      trackPromptView();
      trackUpgradeClick();
      trackConversion();

      resetConversionMetrics();

      const metrics = calculateConversionMetrics();
      expect(metrics.promptViews).toBe(0);
      expect(metrics.upgradeClicks).toBe(0);
      expect(metrics.conversions).toBe(0);
    });
  });

  describe('Integration with Analytics Manager', () => {
    it('should not track when user has not consented', () => {
      const manager = getAnalyticsManager();
      manager.optOut();
      
      trackFreeTierExport();
      
      // Event should not be in queue
      expect(manager.getQueueSize()).toBe(0);
    });

    it('should track when user has consented', () => {
      const manager = getAnalyticsManager();
      manager.optIn();
      
      trackFreeTierExport();
      
      // Event should be in queue
      expect(manager.getQueueSize()).toBeGreaterThan(0);
    });
  });
});
