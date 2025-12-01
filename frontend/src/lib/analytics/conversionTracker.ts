/**
 * Conversion Tracker
 * 
 * Tracks conversion metrics:
 * - Free tier usage
 * - Upgrade prompt views
 * - Upgrade clicks
 * - Conversions
 * - Conversion rate calculations
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { getAnalyticsManager } from './analyticsManager';

/**
 * Storage keys for conversion tracking
 */
const STORAGE_KEY_FREE_TIER_USAGE = 'conversion_free_tier_usage';
const STORAGE_KEY_PROMPT_VIEWS = 'conversion_prompt_views';
const STORAGE_KEY_UPGRADE_CLICKS = 'conversion_upgrade_clicks';
const STORAGE_KEY_CONVERSIONS = 'conversion_conversions';

/**
 * Free tier usage data
 */
export interface FreeTierUsage {
  exportsCount: number;
  captionsCount: number;
  lastExportTimestamp?: number;
  lastCaptionTimestamp?: number;
}

/**
 * Conversion funnel metrics
 */
export interface ConversionMetrics {
  promptViews: number;
  upgradeClicks: number;
  conversions: number;
  clickThroughRate: number; // clicks / views
  conversionRate: number; // conversions / clicks
  overallConversionRate: number; // conversions / views
}

/**
 * Get free tier usage from storage
 */
function getFreeTierUsage(): FreeTierUsage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FREE_TIER_USAGE);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load free tier usage:', error);
  }
  
  return {
    exportsCount: 0,
    captionsCount: 0,
  };
}

/**
 * Save free tier usage to storage
 */
function saveFreeTierUsage(usage: FreeTierUsage): void {
  try {
    localStorage.setItem(STORAGE_KEY_FREE_TIER_USAGE, JSON.stringify(usage));
  } catch (error) {
    console.error('Failed to save free tier usage:', error);
  }
}

/**
 * Get count from storage
 */
function getCount(key: string): number {
  try {
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error(`Failed to load count for ${key}:`, error);
    return 0;
  }
}

/**
 * Save count to storage
 */
function saveCount(key: string, count: number): void {
  try {
    localStorage.setItem(key, count.toString());
  } catch (error) {
    console.error(`Failed to save count for ${key}:`, error);
  }
}

/**
 * Track free tier export usage
 * Requirement 6.1: Track free tier usage
 */
export function trackFreeTierExport(properties?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();
  
  // Update free tier usage count
  const usage = getFreeTierUsage();
  usage.exportsCount += 1;
  usage.lastExportTimestamp = Date.now();
  saveFreeTierUsage(usage);
  
  // Track the event
  manager.track('free_tier_export', {
    ...properties,
    totalExports: usage.exportsCount,
  });
}

/**
 * Track free tier caption generation usage
 * Requirement 6.1: Track free tier usage
 */
export function trackFreeTierCaption(properties?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();
  
  // Update free tier usage count
  const usage = getFreeTierUsage();
  usage.captionsCount += 1;
  usage.lastCaptionTimestamp = Date.now();
  saveFreeTierUsage(usage);
  
  // Track the event
  manager.track('free_tier_caption', {
    ...properties,
    totalCaptions: usage.captionsCount,
  });
}

/**
 * Get current free tier usage
 */
export function getFreeTierUsageStats(): FreeTierUsage {
  return getFreeTierUsage();
}

/**
 * Track upgrade prompt view
 * Requirement 6.2: Record prompt_view event
 */
export function trackPromptView(properties?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();
  
  // Increment prompt view count
  const count = getCount(STORAGE_KEY_PROMPT_VIEWS);
  saveCount(STORAGE_KEY_PROMPT_VIEWS, count + 1);
  
  // Track the event
  manager.track('prompt_view', {
    ...properties,
    totalViews: count + 1,
  });
}

/**
 * Track upgrade click
 * Requirement 6.3: Record upgrade_click event
 */
export function trackUpgradeClick(properties?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();
  
  // Increment upgrade click count
  const count = getCount(STORAGE_KEY_UPGRADE_CLICKS);
  saveCount(STORAGE_KEY_UPGRADE_CLICKS, count + 1);
  
  // Track the event
  manager.track('upgrade_click', {
    ...properties,
    totalClicks: count + 1,
  });
}

/**
 * Track conversion (completed purchase)
 * Requirement 6.4: Record conversion event
 */
export function trackConversion(properties?: Record<string, unknown>): void {
  const manager = getAnalyticsManager();
  
  // Increment conversion count
  const count = getCount(STORAGE_KEY_CONVERSIONS);
  saveCount(STORAGE_KEY_CONVERSIONS, count + 1);
  
  // Track the event
  manager.track('conversion', {
    ...properties,
    totalConversions: count + 1,
  });
}

/**
 * Calculate conversion rates
 * Requirement 6.5: Calculate conversion rates
 */
export function calculateConversionMetrics(): ConversionMetrics {
  const promptViews = getCount(STORAGE_KEY_PROMPT_VIEWS);
  const upgradeClicks = getCount(STORAGE_KEY_UPGRADE_CLICKS);
  const conversions = getCount(STORAGE_KEY_CONVERSIONS);
  
  // Calculate rates (avoid division by zero)
  const clickThroughRate = promptViews > 0 ? upgradeClicks / promptViews : 0;
  const conversionRate = upgradeClicks > 0 ? conversions / upgradeClicks : 0;
  const overallConversionRate = promptViews > 0 ? conversions / promptViews : 0;
  
  return {
    promptViews,
    upgradeClicks,
    conversions,
    clickThroughRate,
    conversionRate,
    overallConversionRate,
  };
}

/**
 * Reset conversion metrics (for testing or new campaigns)
 */
export function resetConversionMetrics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PROMPT_VIEWS);
    localStorage.removeItem(STORAGE_KEY_UPGRADE_CLICKS);
    localStorage.removeItem(STORAGE_KEY_CONVERSIONS);
  } catch (error) {
    console.error('Failed to reset conversion metrics:', error);
  }
}

/**
 * Reset free tier usage (for testing or new billing period)
 */
export function resetFreeTierUsage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_FREE_TIER_USAGE);
  } catch (error) {
    console.error('Failed to reset free tier usage:', error);
  }
}
