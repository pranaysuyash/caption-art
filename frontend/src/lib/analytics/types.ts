/**
 * Analytics and Usage Tracking System Types
 */

export type AnalyticsEventName =
  | 'image_upload'
  | 'caption_generate'
  | 'export'
  | 'style_apply'
  | 'prompt_view'
  | 'upgrade_click'
  | 'conversion'
  | 'error';

export interface AnalyticsEvent {
  name: AnalyticsEventName | string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number;
  maxQueueSize: number;
}

export interface AnalyticsConsent {
  hasConsented: boolean | null;
  timestamp: number;
}

export interface AnalyticsService {
  track(event: AnalyticsEvent): void;
  flush(): Promise<void>;
}

export interface FlowStep {
  action: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface UserFlow {
  sessionId: string;
  steps: FlowStep[];
  startTime: number;
  endTime?: number;
  completed: boolean;
  abandonedAt?: string;
}

export interface FlowPath {
  path: string[];
  count: number;
  averageDuration: number;
}
