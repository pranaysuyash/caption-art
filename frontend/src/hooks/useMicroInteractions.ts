/**
 * useMicroInteractions - React hook for micro-interactions
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { useEffect, useRef } from 'react'
import { MicroInteractionManager, KeyboardShortcut } from '../lib/interactions/MicroInteractionManager'

export interface UseMicroInteractionsOptions {
  enableHoverEffects?: boolean
  enableClickAnimations?: boolean
  enableDragCues?: boolean
  shortcuts?: KeyboardShortcut[]
}

export function useMicroInteractions(options: UseMicroInteractionsOptions = {}) {
  const managerRef = useRef<MicroInteractionManager | null>(null)

  // Create manager instance
  if (!managerRef.current) {
    managerRef.current = new MicroInteractionManager({
      enableHoverEffects: options.enableHoverEffects,
      enableClickAnimations: options.enableClickAnimations,
      enableDragCues: options.enableDragCues,
    })
  }

  const manager = managerRef.current

  // Register shortcuts
  useEffect(() => {
    if (options.shortcuts) {
      options.shortcuts.forEach(shortcut => {
        manager.registerShortcut(shortcut)
      })
    }

    // Initialize keyboard listener
    const cleanup = manager.initializeShortcutListener()

    return () => {
      cleanup()
      if (options.shortcuts) {
        options.shortcuts.forEach(shortcut => {
          manager.unregisterShortcut(shortcut.key)
        })
      }
    }
  }, [manager, options.shortcuts])

  return {
    applyHoverEffect: manager.applyHoverEffect.bind(manager),
    applyClickAnimation: manager.applyClickAnimation.bind(manager),
    applySmoothSlider: manager.applySmoothSlider.bind(manager),
    applyDraggableCues: manager.applyDraggableCues.bind(manager),
    provideFeedback: manager.provideFeedback.bind(manager),
    showShortcutsOverlay: manager.showShortcutsOverlay.bind(manager),
    hideShortcutsOverlay: manager.hideShortcutsOverlay.bind(manager),
  }
}

/**
 * Hook for applying hover effect to a ref
 * Requirements: 10.1
 */
export function useHoverEffect<T extends HTMLElement>(
  options?: Parameters<MicroInteractionManager['applyHoverEffect']>[1]
) {
  const ref = useRef<T>(null)
  const { applyHoverEffect } = useMicroInteractions()

  useEffect(() => {
    if (ref.current) {
      return applyHoverEffect(ref.current, options)
    }
  }, [applyHoverEffect, options])

  return ref
}

/**
 * Hook for applying click animation to a ref
 * Requirements: 10.2
 */
export function useClickAnimation<T extends HTMLElement>(
  options?: Parameters<MicroInteractionManager['applyClickAnimation']>[1]
) {
  const ref = useRef<T>(null)
  const { applyClickAnimation } = useMicroInteractions()

  useEffect(() => {
    if (ref.current) {
      return applyClickAnimation(ref.current, options)
    }
  }, [applyClickAnimation, options])

  return ref
}

/**
 * Hook for applying draggable cues to a ref
 * Requirements: 10.4
 */
export function useDraggableCues<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const { applyDraggableCues } = useMicroInteractions()

  useEffect(() => {
    if (ref.current) {
      return applyDraggableCues(ref.current)
    }
  }, [applyDraggableCues])

  return ref
}
