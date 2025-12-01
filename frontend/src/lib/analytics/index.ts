export { AnalyticsManager, initAnalyticsManager, getAnalyticsManager } from './analyticsManager';
export {
  trackImageUpload,
  trackCaptionGenerate,
  trackExport,
  trackStyleApply,
  sanitizeProperties,
} from './eventTracker';
export {
  FlowTracker,
  initFlowTracker,
  getFlowTracker,
  startFlow,
  recordFlowStep,
  completeFlow,
  abandonFlow,
  getSessionDuration,
  getCommonPaths,
} from './flowTracker';
export {
  trackError,
  setupGlobalErrorHandlers,
  getErrorContext,
  generateErrorGroupKey,
  isCriticalError,
} from './errorTracker';
export {
  trackCustomEvent,
  validateEventName,
  validateProperties,
  isOnline,
  getQueuedEventCount,
} from './customEventTracker';
export {
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
export {
  PrivacyManager,
  initPrivacyManager,
  getPrivacyManager,
  shouldShowConsentBanner,
  optIn,
  optOut,
  hasConsent,
  deleteAllAnalyticsData,
} from './privacyManager';
export {
  initPerformanceTracker,
  getPerformanceTracker,
  trackApiCall,
  trackProcessing,
  startTiming,
} from './performanceTracker';
export type {
  AnalyticsEvent,
  AnalyticsConfig,
  AnalyticsConsent,
  AnalyticsService,
  AnalyticsEventName,
  UserFlow,
  FlowStep,
  FlowPath,
} from './types';
export type { ErrorContext, TrackedError } from './errorTracker';
export type { FreeTierUsage, ConversionMetrics } from './conversionTracker';
export type { ConsentPreference } from './privacyManager';
export type { PerformanceMetric, AggregatedMetrics } from './performanceTracker';
