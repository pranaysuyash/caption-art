/**
 * OnboardingController - Manages onboarding flow and state
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7
 * 
 * Features:
 * - Define onboarding steps with content and targets
 * - Step navigation (next, previous, skip)
 * - First-visit detection using localStorage
 * - Completion tracking
 * - Restart functionality
 */

export interface OnboardingStep {
  id: string
  title: string
  content: string
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: () => void
}

export interface OnboardingState {
  currentStepIndex: number
  isActive: boolean
  isCompleted: boolean
  hasSeenOnboarding: boolean
}

const STORAGE_KEY = 'caption-art-onboarding'

/**
 * OnboardingController manages the onboarding flow
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7
 */
export class OnboardingController {
  private steps: OnboardingStep[]
  private state: OnboardingState
  private listeners: Set<(state: OnboardingState) => void> = new Set()

  constructor(steps: OnboardingStep[]) {
    this.steps = steps
    
    // Load state from localStorage - Requirement: 4.5
    const savedState = this.loadState()
    
    this.state = {
      currentStepIndex: 0,
      isActive: false,
      isCompleted: savedState?.isCompleted || false,
      hasSeenOnboarding: savedState?.hasSeenOnboarding || false,
    }
  }

  /**
   * Start onboarding flow
   * Requirements: 4.1, 4.2
   */
  start(): void {
    if (this.steps.length === 0) {
      console.warn('No onboarding steps defined')
      return
    }

    this.state = {
      ...this.state,
      currentStepIndex: 0,
      isActive: true,
      hasSeenOnboarding: true,
    }

    this.saveState()
    this.notifyListeners()
  }

  /**
   * Go to next step
   * Requirements: 4.7
   */
  next(): void {
    if (!this.state.isActive) return

    const nextIndex = this.state.currentStepIndex + 1

    if (nextIndex >= this.steps.length) {
      // Reached the end
      this.complete()
    } else {
      this.state.currentStepIndex = nextIndex
      this.saveState()
      this.notifyListeners()
    }
  }

  /**
   * Go to previous step
   * Requirements: 4.7
   */
  previous(): void {
    if (!this.state.isActive) return

    const prevIndex = this.state.currentStepIndex - 1

    if (prevIndex < 0) {
      // Already at first step
      return
    }

    this.state.currentStepIndex = prevIndex
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Skip onboarding
   * Requirements: 4.3
   */
  skip(): void {
    this.state = {
      ...this.state,
      isActive: false,
      isCompleted: true,
      hasSeenOnboarding: true,
    }

    this.saveState()
    this.notifyListeners()
  }

  /**
   * Complete onboarding
   * Requirements: 4.3, 4.5
   */
  complete(): void {
    this.state = {
      ...this.state,
      isActive: false,
      isCompleted: true,
      hasSeenOnboarding: true,
    }

    this.saveState()
    this.notifyListeners()
  }

  /**
   * Restart onboarding
   * Requirements: 4.6
   */
  restart(): void {
    this.state = {
      currentStepIndex: 0,
      isActive: true,
      isCompleted: false,
      hasSeenOnboarding: true,
    }

    this.saveState()
    this.notifyListeners()
  }

  /**
   * Reset onboarding (clear all state)
   * Requirements: 4.6
   */
  reset(): void {
    this.state = {
      currentStepIndex: 0,
      isActive: false,
      isCompleted: false,
      hasSeenOnboarding: false,
    }

    this.clearState()
    this.notifyListeners()
  }

  /**
   * Check if this is the first visit
   * Requirements: 4.1, 4.5
   */
  isFirstVisit(): boolean {
    return !this.state.hasSeenOnboarding
  }

  /**
   * Check if onboarding should auto-start
   * Requirements: 4.1
   */
  shouldAutoStart(): boolean {
    return this.isFirstVisit() && !this.state.isCompleted
  }

  /**
   * Get current step
   * Requirements: 4.2
   */
  getCurrentStep(): OnboardingStep | null {
    if (!this.state.isActive || this.state.currentStepIndex >= this.steps.length) {
      return null
    }

    return this.steps[this.state.currentStepIndex]
  }

  /**
   * Get current state
   */
  getState(): OnboardingState {
    return { ...this.state }
  }

  /**
   * Get all steps
   */
  getSteps(): OnboardingStep[] {
    return [...this.steps]
  }

  /**
   * Get total number of steps
   */
  getTotalSteps(): number {
    return this.steps.length
  }

  /**
   * Check if there's a next step
   * Requirements: 4.7
   */
  hasNext(): boolean {
    return this.state.currentStepIndex < this.steps.length - 1
  }

  /**
   * Check if there's a previous step
   * Requirements: 4.7
   */
  hasPrevious(): boolean {
    return this.state.currentStepIndex > 0
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: OnboardingState) => void): () => void {
    this.listeners.add(listener)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.getState())
    })
  }

  /**
   * Save state to localStorage
   * Requirements: 4.5
   */
  private saveState(): void {
    try {
      const stateToSave = {
        isCompleted: this.state.isCompleted,
        hasSeenOnboarding: this.state.hasSeenOnboarding,
        lastUpdated: Date.now(),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Failed to save onboarding state:', error)
    }
  }

  /**
   * Load state from localStorage
   * Requirements: 4.5
   */
  private loadState(): { isCompleted: boolean; hasSeenOnboarding: boolean } | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null

      const parsed = JSON.parse(saved)
      
      // Validate structure
      if (
        typeof parsed.isCompleted === 'boolean' &&
        typeof parsed.hasSeenOnboarding === 'boolean'
      ) {
        return {
          isCompleted: parsed.isCompleted,
          hasSeenOnboarding: parsed.hasSeenOnboarding,
        }
      }

      return null
    } catch (error) {
      console.error('Failed to load onboarding state:', error)
      return null
    }
  }

  /**
   * Clear state from localStorage
   * Requirements: 4.6
   */
  private clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear onboarding state:', error)
    }
  }
}

/**
 * Create default onboarding steps for Caption Art
 * Requirements: 4.2, 4.4
 */
export function createDefaultOnboardingSteps(): OnboardingStep[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to Caption Art! 🎨',
      content: 'Create stunning images with text that appears behind your subject. Let\'s show you how it works!',
      position: 'center',
    },
    {
      id: 'upload',
      title: 'Upload Your Image',
      content: 'Start by uploading an image. Drag and drop or click to browse. Works best with images that have a clear subject.',
      targetSelector: '[data-onboarding="upload-zone"]',
      position: 'bottom',
    },
    {
      id: 'caption',
      title: 'Generate AI Captions',
      content: 'Our AI will analyze your image and generate creative captions. Click any caption to apply it to your image.',
      targetSelector: '[data-onboarding="caption-generator"]',
      position: 'left',
    },
    {
      id: 'text-behind',
      title: 'Text Behind Subject',
      content: 'The magic happens here! Your text will automatically appear behind your subject, creating a professional 3D effect.',
      targetSelector: '[data-onboarding="canvas"]',
      position: 'right',
    },
    {
      id: 'customize',
      title: 'Customize Your Design',
      content: 'Adjust font, size, color, and effects to make your design perfect. Use the toolbar to access all customization options.',
      targetSelector: '[data-onboarding="toolbar"]',
      position: 'bottom',
    },
    {
      id: 'export',
      title: 'Export & Share',
      content: 'When you\'re happy with your design, export it in high quality and share it on social media!',
      targetSelector: '[data-onboarding="export-button"]',
      position: 'left',
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      content: 'You\'re ready to create amazing designs. You can restart this tour anytime from Settings.',
      position: 'center',
    },
  ]
}
