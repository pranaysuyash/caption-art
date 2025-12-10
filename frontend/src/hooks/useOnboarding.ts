/**
 * useOnboarding - React hook for onboarding integration
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7
 */

import { useState, useEffect, useRef } from 'react'
import {
  OnboardingController,
  OnboardingStep,
  OnboardingState,
  createDefaultOnboardingSteps,
} from '../lib/onboarding/OnboardingController'

export interface UseOnboardingOptions {
  steps?: OnboardingStep[]
  autoStart?: boolean
}

export interface UseOnboardingReturn {
  state: OnboardingState
  currentStep: OnboardingStep | null
  totalSteps: number
  start: () => void
  next: () => void
  previous: () => void
  skip: () => void
  restart: () => void
  reset: () => void
  hasNext: boolean
  hasPrevious: boolean
  isFirstVisit: boolean
}

/**
 * Hook for managing onboarding flow
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7
 */
export function useOnboarding(options: UseOnboardingOptions = {}): UseOnboardingReturn {
  const {
    steps = createDefaultOnboardingSteps(),
    autoStart = true,
  } = options

  // Create controller instance (only once)
  const controllerRef = useRef<OnboardingController | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = new OnboardingController(steps)
  }

  const controller = controllerRef.current

  // State
  const [state, setState] = useState<OnboardingState>(controller.getState())
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(
    controller.getCurrentStep()
  )

  // Subscribe to controller changes
  useEffect(() => {
    const unsubscribe = controller.subscribe((newState) => {
      setState(newState)
      setCurrentStep(controller.getCurrentStep())
    })

    return unsubscribe
  }, [controller])

  // Auto-start on first visit - Requirement: 4.1
  useEffect(() => {
    if (autoStart && controller.shouldAutoStart()) {
      controller.start()
    }
  }, [autoStart, controller])

  return {
    state,
    currentStep,
    totalSteps: controller.getTotalSteps(),
    start: () => controller.start(),
    next: () => controller.next(),
    previous: () => controller.previous(),
    skip: () => controller.skip(),
    restart: () => controller.restart(),
    reset: () => controller.reset(),
    hasNext: controller.hasNext(),
    hasPrevious: controller.hasPrevious(),
    isFirstVisit: controller.isFirstVisit(),
  }
}
