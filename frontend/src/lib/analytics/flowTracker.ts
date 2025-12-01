/**
 * Flow Tracker
 * 
 * Tracks user flows through the application:
 * - Records action sequences
 * - Tracks abandonment points
 * - Measures time per step
 * - Tracks session duration
 * - Identifies common paths
 */

import { getAnalyticsManager } from './analyticsManager';
import type { UserFlow, FlowStep, FlowPath } from './types';

const STORAGE_KEY_SESSION = 'analytics_session_id';
const STORAGE_KEY_CURRENT_FLOW = 'analytics_current_flow';
const STORAGE_KEY_FLOW_HISTORY = 'analytics_flow_history';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export class FlowTracker {
  private sessionId: string;
  private currentFlow: UserFlow | null = null;
  private lastActivityTime: number = Date.now();
  private sessionStartTime: number = Date.now();

  constructor() {
    this.sessionId = this.initializeSession();
    this.loadCurrentFlow();
    this.setupActivityTracking();
  }

  /**
   * Initialize or restore session ID
   */
  private initializeSession(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSION);
      if (stored) {
        const { id, timestamp } = JSON.parse(stored);
        // Check if session is still valid
        if (Date.now() - timestamp < SESSION_TIMEOUT) {
          return id;
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }

    // Create new session
    const newSessionId = this.generateSessionId();
    this.saveSession(newSessionId);
    return newSessionId;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save session to localStorage
   */
  private saveSession(sessionId: string): void {
    try {
      localStorage.setItem(
        STORAGE_KEY_SESSION,
        JSON.stringify({ id: sessionId, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Load current flow from localStorage
   */
  private loadCurrentFlow(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_FLOW);
      if (stored) {
        this.currentFlow = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load current flow:', error);
    }
  }

  /**
   * Save current flow to localStorage
   */
  private saveCurrentFlow(): void {
    try {
      if (this.currentFlow) {
        localStorage.setItem(STORAGE_KEY_CURRENT_FLOW, JSON.stringify(this.currentFlow));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_FLOW);
      }
    } catch (error) {
      console.error('Failed to save current flow:', error);
    }
  }

  /**
   * Setup activity tracking to detect session timeout
   */
  private setupActivityTracking(): void {
    // Track user activity
    const updateActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - this.lastActivityTime;

      // If session timed out, start new session
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        this.endSession();
        this.sessionId = this.generateSessionId();
        this.saveSession(this.sessionId);
        this.sessionStartTime = now;
      }

      this.lastActivityTime = now;
    };

    // Listen for user activity
    if (typeof window !== 'undefined') {
      window.addEventListener('click', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('scroll', updateActivity);
      window.addEventListener('mousemove', updateActivity);
    }
  }

  /**
   * Start tracking a new flow
   */
  public startFlow(): void {
    // End previous flow if exists
    if (this.currentFlow && !this.currentFlow.completed) {
      this.abandonFlow();
    }

    this.currentFlow = {
      sessionId: this.sessionId,
      steps: [],
      startTime: Date.now(),
      completed: false,
    };

    this.saveCurrentFlow();
  }

  /**
   * Record a step in the current flow
   */
  public recordStep(action: string, metadata?: Record<string, unknown>): void {
    if (!this.currentFlow) {
      this.startFlow();
    }

    const now = Date.now();
    const previousStep = this.currentFlow!.steps[this.currentFlow!.steps.length - 1];
    const duration = previousStep ? now - previousStep.timestamp : undefined;

    const step: FlowStep = {
      action,
      timestamp: now,
      duration,
      metadata,
    };

    this.currentFlow!.steps.push(step);
    this.saveCurrentFlow();

    // Track step as analytics event
    const manager = getAnalyticsManager();
    manager.track('flow_step', {
      sessionId: this.sessionId,
      action,
      stepNumber: this.currentFlow!.steps.length,
      duration,
      metadata,
    });
  }

  /**
   * Complete the current flow
   */
  public completeFlow(): void {
    if (!this.currentFlow) {
      return;
    }

    this.currentFlow.completed = true;
    this.currentFlow.endTime = Date.now();

    // Calculate total duration
    const totalDuration = this.currentFlow.endTime - this.currentFlow.startTime;

    // Track completion
    const manager = getAnalyticsManager();
    manager.track('flow_completed', {
      sessionId: this.sessionId,
      steps: this.currentFlow.steps.map(s => s.action),
      totalSteps: this.currentFlow.steps.length,
      totalDuration,
    });

    // Save to history
    this.saveToHistory(this.currentFlow);

    // Clear current flow
    this.currentFlow = null;
    this.saveCurrentFlow();
  }

  /**
   * Mark current flow as abandoned
   */
  public abandonFlow(): void {
    if (!this.currentFlow || this.currentFlow.completed) {
      return;
    }

    const lastStep = this.currentFlow.steps[this.currentFlow.steps.length - 1];
    this.currentFlow.abandonedAt = lastStep?.action || 'start';
    this.currentFlow.endTime = Date.now();

    // Track abandonment
    const manager = getAnalyticsManager();
    manager.track('flow_abandoned', {
      sessionId: this.sessionId,
      steps: this.currentFlow.steps.map(s => s.action),
      abandonedAt: this.currentFlow.abandonedAt,
      stepsCompleted: this.currentFlow.steps.length,
    });

    // Save to history
    this.saveToHistory(this.currentFlow);

    // Clear current flow
    this.currentFlow = null;
    this.saveCurrentFlow();
  }

  /**
   * Save completed or abandoned flow to history
   */
  private saveToHistory(flow: UserFlow): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FLOW_HISTORY);
      const history: UserFlow[] = stored ? JSON.parse(stored) : [];
      
      history.push(flow);

      // Keep only last 100 flows
      const trimmedHistory = history.slice(-100);

      localStorage.setItem(STORAGE_KEY_FLOW_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to save flow to history:', error);
    }
  }

  /**
   * Get session duration in milliseconds
   */
  public getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current flow
   */
  public getCurrentFlow(): UserFlow | null {
    return this.currentFlow;
  }

  /**
   * Get flow history
   */
  public getFlowHistory(): UserFlow[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FLOW_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load flow history:', error);
      return [];
    }
  }

  /**
   * Identify common paths from flow history
   */
  public getCommonPaths(): FlowPath[] {
    const history = this.getFlowHistory();
    const pathMap = new Map<string, { count: number; durations: number[] }>();

    for (const flow of history) {
      const path = flow.steps.map(s => s.action);
      const pathKey = path.join(' -> ');
      const duration = flow.endTime ? flow.endTime - flow.startTime : 0;

      if (!pathMap.has(pathKey)) {
        pathMap.set(pathKey, { count: 0, durations: [] });
      }

      const pathData = pathMap.get(pathKey)!;
      pathData.count++;
      if (duration > 0) {
        pathData.durations.push(duration);
      }
    }

    // Convert to FlowPath array
    const paths: FlowPath[] = [];
    for (const [pathKey, data] of pathMap.entries()) {
      const averageDuration = data.durations.length > 0
        ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length
        : 0;

      paths.push({
        path: pathKey.split(' -> '),
        count: data.count,
        averageDuration,
      });
    }

    // Sort by count (most common first)
    return paths.sort((a, b) => b.count - a.count);
  }

  /**
   * End current session and track session duration
   */
  public endSession(): void {
    const sessionDuration = this.getSessionDuration();

    // Abandon any incomplete flow
    if (this.currentFlow && !this.currentFlow.completed) {
      this.abandonFlow();
    }

    // Track session end
    const manager = getAnalyticsManager();
    manager.track('session_end', {
      sessionId: this.sessionId,
      duration: sessionDuration,
    });
  }

  /**
   * Clear all flow history
   */
  public clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_FLOW_HISTORY);
    } catch (error) {
      console.error('Failed to clear flow history:', error);
    }
  }
}

// Singleton instance
let flowTrackerInstance: FlowTracker | null = null;

/**
 * Initialize the flow tracker
 */
export function initFlowTracker(): FlowTracker {
  if (!flowTrackerInstance) {
    flowTrackerInstance = new FlowTracker();
  }
  return flowTrackerInstance;
}

/**
 * Get the flow tracker instance
 */
export function getFlowTracker(): FlowTracker {
  if (!flowTrackerInstance) {
    flowTrackerInstance = new FlowTracker();
  }
  return flowTrackerInstance;
}

// Convenience functions for common flow tracking operations

/**
 * Start tracking a new user flow
 */
export function startFlow(): void {
  const tracker = getFlowTracker();
  tracker.startFlow();
}

/**
 * Record a step in the current flow
 */
export function recordFlowStep(action: string, metadata?: Record<string, unknown>): void {
  const tracker = getFlowTracker();
  tracker.recordStep(action, metadata);
}

/**
 * Complete the current flow
 */
export function completeFlow(): void {
  const tracker = getFlowTracker();
  tracker.completeFlow();
}

/**
 * Abandon the current flow
 */
export function abandonFlow(): void {
  const tracker = getFlowTracker();
  tracker.abandonFlow();
}

/**
 * Get session duration
 */
export function getSessionDuration(): number {
  const tracker = getFlowTracker();
  return tracker.getSessionDuration();
}

/**
 * Get common user paths
 */
export function getCommonPaths(): FlowPath[] {
  const tracker = getFlowTracker();
  return tracker.getCommonPaths();
}
