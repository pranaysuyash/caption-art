/**
 * ProgressTracker - Progress tracking system for long-running operations
 * Requirements: 1.3, 6.1, 6.2, 6.3, 6.4, 6.6
 * 
 * Provides:
 * - Progress state management (idle, running, success, error)
 * - Progress percentage tracking (0-100)
 * - Time estimation based on progress rate
 * - Cancellation support
 * - Sequential operation tracking
 */

export type ProgressState = 'idle' | 'running' | 'success' | 'error' | 'cancelled'

export interface ProgressStep {
  id: string
  name: string
  weight: number // Relative weight for progress calculation
  status: 'pending' | 'running' | 'complete' | 'error'
}

export interface ProgressInfo {
  state: ProgressState
  percentage: number // 0-100
  currentStep?: string
  totalSteps: number
  completedSteps: number
  estimatedTimeRemaining?: number // milliseconds
  elapsedTime: number // milliseconds
  canCancel: boolean
  message?: string
}

export interface ProgressTrackerOptions {
  operation: string
  steps?: ProgressStep[]
  canCancel?: boolean
  onProgress?: (info: ProgressInfo) => void
  onComplete?: () => void
  onError?: (error: Error) => void
  onCancel?: () => void
}

export class ProgressTracker {
  private state: ProgressState = 'idle'
  private percentage: number = 0
  private steps: ProgressStep[] = []
  private currentStepIndex: number = -1
  private startTime: number = 0
  private lastUpdateTime: number = 0
  private progressHistory: Array<{ time: number; percentage: number }> = []
  private readonly MAX_HISTORY = 10
  private cancelRequested: boolean = false
  private options: ProgressTrackerOptions

  constructor(options: ProgressTrackerOptions) {
    this.options = {
      canCancel: true,
      ...options,
    }

    if (options.steps) {
      this.steps = options.steps.map((step) => ({
        ...step,
        status: 'pending',
      }))
    }
  }

  /**
   * Start tracking progress
   */
  start(): void {
    if (this.state === 'running') {
      console.warn('ProgressTracker already running')
      return
    }

    this.state = 'running'
    this.percentage = 0
    this.startTime = Date.now()
    this.lastUpdateTime = this.startTime
    this.progressHistory = []
    this.cancelRequested = false

    if (this.steps.length > 0) {
      this.currentStepIndex = 0
      this.steps[0].status = 'running'
    }

    this.notifyProgress()
  }

  /**
   * Update progress percentage
   */
  updateProgress(percentage: number, message?: string): void {
    if (this.state !== 'running') {
      return
    }

    // Clamp percentage between 0 and 100
    this.percentage = Math.max(0, Math.min(100, percentage))

    // Record progress for time estimation
    const now = Date.now()
    this.progressHistory.push({
      time: now,
      percentage: this.percentage,
    })

    // Keep only recent history
    if (this.progressHistory.length > this.MAX_HISTORY) {
      this.progressHistory.shift()
    }

    this.lastUpdateTime = now

    this.notifyProgress(message)
  }

  /**
   * Complete current step and move to next
   */
  completeStep(stepId?: string): void {
    if (this.state !== 'running') {
      return
    }

    // Find and complete the step
    const stepIndex = stepId
      ? this.steps.findIndex((s) => s.id === stepId)
      : this.currentStepIndex

    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.steps[stepIndex].status = 'complete'

      // Move to next step
      if (stepIndex < this.steps.length - 1) {
        this.currentStepIndex = stepIndex + 1
        this.steps[this.currentStepIndex].status = 'running'
      }

      // Calculate overall progress based on completed steps
      this.updateProgressFromSteps()
    }
  }

  /**
   * Mark current step as error
   */
  errorStep(stepId?: string, error?: Error): void {
    const stepIndex = stepId
      ? this.steps.findIndex((s) => s.id === stepId)
      : this.currentStepIndex

    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.steps[stepIndex].status = 'error'
    }

    this.error(error)
  }

  /**
   * Complete the operation successfully
   */
  complete(message?: string): void {
    if (this.state !== 'running') {
      return
    }

    this.state = 'success'
    this.percentage = 100

    // Mark all steps as complete
    this.steps.forEach((step) => {
      if (step.status !== 'error') {
        step.status = 'complete'
      }
    })

    this.notifyProgress(message)
    this.options.onComplete?.()
  }

  /**
   * Mark operation as error
   */
  error(error?: Error): void {
    if (this.state !== 'running') {
      return
    }

    this.state = 'error'
    this.notifyProgress(error?.message)
    this.options.onError?.(error || new Error('Operation failed'))
  }

  /**
   * Cancel the operation
   */
  cancel(): void {
    if (this.state !== 'running' || !this.options.canCancel) {
      return
    }

    this.cancelRequested = true
    this.state = 'cancelled'
    this.notifyProgress('Operation cancelled')
    this.options.onCancel?.()
  }

  /**
   * Check if cancellation was requested
   */
  isCancelRequested(): boolean {
    return this.cancelRequested
  }

  /**
   * Get current progress info
   */
  getInfo(): ProgressInfo {
    const now = Date.now()
    const elapsedTime = now - this.startTime

    return {
      state: this.state,
      percentage: this.percentage,
      currentStep: this.getCurrentStepName(),
      totalSteps: this.steps.length,
      completedSteps: this.steps.filter((s) => s.status === 'complete').length,
      estimatedTimeRemaining: this.estimateTimeRemaining(),
      elapsedTime,
      canCancel: this.options.canCancel || false,
    }
  }

  /**
   * Reset tracker to idle state
   */
  reset(): void {
    this.state = 'idle'
    this.percentage = 0
    this.currentStepIndex = -1
    this.startTime = 0
    this.lastUpdateTime = 0
    this.progressHistory = []
    this.cancelRequested = false

    this.steps.forEach((step) => {
      step.status = 'pending'
    })
  }

  /**
   * Calculate progress from completed steps
   */
  private updateProgressFromSteps(): void {
    if (this.steps.length === 0) {
      return
    }

    const totalWeight = this.steps.reduce((sum, step) => sum + step.weight, 0)
    const completedWeight = this.steps
      .filter((s) => s.status === 'complete')
      .reduce((sum, step) => sum + step.weight, 0)

    // Add partial weight for current running step (assume 50% complete)
    const runningWeight = this.steps
      .filter((s) => s.status === 'running')
      .reduce((sum, step) => sum + step.weight * 0.5, 0)

    this.percentage = ((completedWeight + runningWeight) / totalWeight) * 100
    this.notifyProgress()
  }

  /**
   * Get current step name
   */
  private getCurrentStepName(): string | undefined {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex].name
    }
    return undefined
  }

  /**
   * Estimate time remaining based on progress rate
   * Requirements: 6.4
   */
  private estimateTimeRemaining(): number | undefined {
    if (this.progressHistory.length < 2 || this.percentage === 0) {
      return undefined
    }

    // Calculate average progress rate from history
    const oldest = this.progressHistory[0]
    const newest = this.progressHistory[this.progressHistory.length - 1]

    const timeDiff = newest.time - oldest.time
    const progressDiff = newest.percentage - oldest.percentage

    if (progressDiff <= 0 || timeDiff <= 0) {
      return undefined
    }

    // Calculate rate (percentage per millisecond)
    const rate = progressDiff / timeDiff

    // Estimate remaining time
    const remainingPercentage = 100 - this.percentage
    const estimatedMs = remainingPercentage / rate

    // Cap at reasonable maximum (1 hour)
    return Math.min(estimatedMs, 3600000)
  }

  /**
   * Notify progress listeners
   */
  private notifyProgress(message?: string): void {
    const info = this.getInfo()
    if (message) {
      info.message = message
    }
    this.options.onProgress?.(info)
  }
}

/**
 * Create a simple progress tracker for single operations
 */
export function createSimpleTracker(
  operation: string,
  canCancel: boolean = false
): ProgressTracker {
  return new ProgressTracker({
    operation,
    canCancel,
  })
}

/**
 * Create a multi-step progress tracker
 */
export function createStepTracker(
  operation: string,
  stepNames: string[],
  canCancel: boolean = false
): ProgressTracker {
  const steps: ProgressStep[] = stepNames.map((name, index) => ({
    id: `step_${index}`,
    name,
    weight: 1, // Equal weight for all steps
    status: 'pending',
  }))

  return new ProgressTracker({
    operation,
    steps,
    canCancel,
  })
}
