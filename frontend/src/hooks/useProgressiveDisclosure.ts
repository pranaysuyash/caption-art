/**
 * useProgressiveDisclosure - React hook for progressive disclosure
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { useState, useEffect, useRef } from 'react'
import {
  ProgressiveDisclosureManager,
  ViewMode,
  ViewState,
  FeatureConfig,
  createDefaultFeatures,
} from '../lib/disclosure/ProgressiveDisclosureManager'

export interface UseProgressiveDisclosureOptions {
  features?: FeatureConfig[]
}

export interface UseProgressiveDisclosureReturn {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
  isSectionExpanded: (sectionId: string) => boolean
  expandSection: (sectionId: string) => void
  collapseSection: (sectionId: string) => void
  toggleSection: (sectionId: string) => void
  isFeatureVisible: (featureId: string) => boolean
  getVisibleFeatures: () => FeatureConfig[]
  getHiddenFeatures: () => FeatureConfig[]
  getHiddenFeatureCount: (category?: string) => number
  trackFeatureUsage: (featureId: string) => void
  searchFeatures: (query: string) => FeatureConfig[]
  getKeyboardShortcut: (featureId: string) => string | undefined
  getAllKeyboardShortcuts: () => Array<{ feature: FeatureConfig; shortcut: string }>
  state: ViewState
}

/**
 * Hook for managing progressive disclosure
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export function useProgressiveDisclosure(
  options: UseProgressiveDisclosureOptions = {}
): UseProgressiveDisclosureReturn {
  const { features = createDefaultFeatures() } = options

  // Create manager instance (only once)
  const managerRef = useRef<ProgressiveDisclosureManager | null>(null)
  if (!managerRef.current) {
    managerRef.current = new ProgressiveDisclosureManager(features)
  }

  const manager = managerRef.current

  // State
  const [state, setState] = useState<ViewState>(manager.getState())

  // Subscribe to manager changes
  useEffect(() => {
    const unsubscribe = manager.subscribe(newState => {
      setState(newState)
    })

    return unsubscribe
  }, [manager])

  return {
    viewMode: state.mode,
    setViewMode: (mode: ViewMode) => manager.setViewMode(mode),
    toggleViewMode: () => manager.toggleViewMode(),
    isSectionExpanded: (sectionId: string) => manager.isSectionExpanded(sectionId),
    expandSection: (sectionId: string) => manager.expandSection(sectionId),
    collapseSection: (sectionId: string) => manager.collapseSection(sectionId),
    toggleSection: (sectionId: string) => manager.toggleSection(sectionId),
    isFeatureVisible: (featureId: string) => manager.isFeatureVisible(featureId),
    getVisibleFeatures: () => manager.getVisibleFeatures(),
    getHiddenFeatures: () => manager.getHiddenFeatures(),
    getHiddenFeatureCount: (category?: string) => manager.getHiddenFeatureCount(category),
    trackFeatureUsage: (featureId: string) => manager.trackFeatureUsage(featureId),
    searchFeatures: (query: string) => manager.searchFeatures(query),
    getKeyboardShortcut: (featureId: string) => manager.getKeyboardShortcut(featureId),
    getAllKeyboardShortcuts: () => manager.getAllKeyboardShortcuts(),
    state,
  }
}
