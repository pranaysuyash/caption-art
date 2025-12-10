/**
 * OnboardingOverlay - Visual overlay for onboarding flow
 * Requirements: 4.1, 4.2, 4.3, 4.7
 * 
 * Features:
 * - Semi-transparent overlay with spotlight
 * - Tooltip with step content
 * - Highlight target UI elements
 * - Navigation buttons (Previous, Next, Skip)
 * - Progress indicator
 */

import { useEffect, useState, useRef } from 'react'
import { OnboardingStep } from '../lib/onboarding/OnboardingController'

export interface OnboardingOverlayProps {
  step: OnboardingStep
  currentStepIndex: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  hasPrevious: boolean
  hasNext: boolean
}

export function OnboardingOverlay({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  hasPrevious,
  hasNext,
}: OnboardingOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Find and highlight target element
  useEffect(() => {
    if (!step.targetSelector) {
      setTargetRect(null)
      return
    }

    const targetElement = document.querySelector(step.targetSelector)
    if (!targetElement) {
      console.warn(`Onboarding target not found: ${step.targetSelector}`)
      setTargetRect(null)
      return
    }

    const rect = targetElement.getBoundingClientRect()
    setTargetRect(rect)

    // Scroll target into view
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [step.targetSelector])

  // Calculate tooltip position
  useEffect(() => {
    if (!tooltipRef.current) return

    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const padding = 20
    const arrowSize = 12

    let top = 0
    let left = 0

    if (step.position === 'center' || !targetRect) {
      // Center of screen
      top = (window.innerHeight - tooltipRect.height) / 2
      left = (window.innerWidth - tooltipRect.width) / 2
    } else {
      // Position relative to target
      switch (step.position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - padding - arrowSize
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
          break
        case 'bottom':
          top = targetRect.bottom + padding + arrowSize
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
          left = targetRect.left - tooltipRect.width - padding - arrowSize
          break
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
          left = targetRect.right + padding + arrowSize
          break
      }

      // Keep tooltip within viewport
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))
    }

    setTooltipPosition({ top, left })
  }, [step.position, targetRect])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-content"
    >
      {/* Overlay with spotlight */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight border */}
      {targetRect && (
        <div
          style={{
            position: 'absolute',
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            border: '3px solid var(--color-primary, #3b82f6)',
            borderRadius: '8px',
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
            pointerEvents: 'none',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          maxWidth: '400px',
          backgroundColor: 'var(--color-bg-primary, white)',
          border: '3px solid var(--color-border, #000)',
          borderRadius: '8px',
          boxShadow: '8px 8px 0 var(--color-border, #000)',
          padding: '1.5rem',
          pointerEvents: 'auto',
        }}
      >
        {/* Progress indicator */}
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-primary, #3b82f6)',
            marginBottom: '0.5rem',
          }}
        >
          Step {currentStepIndex + 1} of {totalSteps}
        </div>

        {/* Title */}
        <h2
          id="onboarding-title"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            color: 'var(--color-text, #1f2937)',
          }}
        >
          {step.title}
        </h2>

        {/* Content */}
        <p
          id="onboarding-content"
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--color-text-secondary, #6b7280)',
            marginBottom: '1.5rem',
          }}
        >
          {step.content}
        </p>

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {hasPrevious && (
              <button
                onClick={onPrevious}
                className="btn btn-secondary"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                }}
              >
                ← Previous
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onSkip}
              className="btn btn-ghost"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
              }}
            >
              Skip Tour
            </button>

            <button
              onClick={onNext}
              className="btn btn-primary"
              style={{
                padding: '0.5rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {hasNext ? 'Next →' : 'Get Started! 🎉'}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            marginTop: '1rem',
          }}
        >
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor:
                  index === currentStepIndex
                    ? 'var(--color-primary, #3b82f6)'
                    : 'var(--color-border, #e5e7eb)',
                transition: 'background-color 0.2s ease',
              }}
              aria-label={`Step ${index + 1}${index === currentStepIndex ? ' (current)' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1);
          }
        }
      `}</style>
    </div>
  )
}
