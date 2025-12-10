/**
 * ProgressiveDisclosureManager - Manages UI view states and feature visibility
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 * 
 * Features:
 * - Compact/expanded view state management
 * - View preference persistence in localStorage
 * - Feature visibility tracking
 * - Usage frequency tracking
 * - Keyboard shortcut hints
 */

export type ViewMode = 'compact' | 'expanded'

export interface FeatureConfig {
  id: string
  name: string
  category: 'critical' | 'advanced' | 'rarely-used'
  defaultVisible: boolean
  keyboardShortcut?: string
  description?: string
}

export interface ViewState {
  mode: ViewMode
  expandedSections: Set<string>
  hiddenFeatures: Set<string>
  featureUsageCount: Map<string, number>
}

const STORAGE_KEY = 'caption-art-disclosure'
const USAGE_THRESHOLD_FREQUENT = 10 // Features used 10+ times are considered frequent

/**
 * ProgressiveDisclosureManager manages feature visibility and view states
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export class ProgressiveDisclosureManager {
  private state: ViewState
  private features: Map<string, FeatureConfig> = new Map()
  private listeners: Set<(state: ViewState) => void> = new Set()

  constructor(features: FeatureConfig[] = []) {
    // Initialize features
    features.forEach(feature => {
      this.features.set(feature.id, feature)
    })

    // Load state from localStorage - Requirement: 5.3
    this.state = this.loadState()
  }

  /**
   * Get current view mode
   * Requirements: 5.1
   */
  getViewMode(): ViewMode {
    return this.state.mode
  }

  /**
   * Set view mode (compact or expanded)
   * Requirements: 5.1, 5.3
   */
  setViewMode(mode: ViewMode): void {
    this.state.mode = mode
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Toggle view mode between compact and expanded
   * Requirements: 5.1, 5.3
   */
  toggleViewMode(): void {
    const newMode = this.state.mode === 'compact' ? 'expanded' : 'compact'
    this.setViewMode(newMode)
  }

  /**
   * Check if a section is expanded
   * Requirements: 5.2
   */
  isSectionExpanded(sectionId: string): boolean {
    return this.state.expandedSections.has(sectionId)
  }

  /**
   * Expand a section
   * Requirements: 5.2, 5.3
   */
  expandSection(sectionId: string): void {
    this.state.expandedSections.add(sectionId)
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Collapse a section
   * Requirements: 5.2, 5.3
   */
  collapseSection(sectionId: string): void {
    this.state.expandedSections.delete(sectionId)
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Toggle section expansion
   * Requirements: 5.2, 5.3
   */
  toggleSection(sectionId: string): void {
    if (this.isSectionExpanded(sectionId)) {
      this.collapseSection(sectionId)
    } else {
      this.expandSection(sectionId)
    }
  }

  /**
   * Check if a feature is visible
   * Requirements: 5.1, 5.4, 5.5
   */
  isFeatureVisible(featureId: string): boolean {
    const feature = this.features.get(featureId)
    if (!feature) return false

    // Hidden features are never visible
    if (this.state.hiddenFeatures.has(featureId)) {
      return false
    }

    // In expanded mode, all non-hidden features are visible
    if (this.state.mode === 'expanded') {
      return true
    }

    // In compact mode, only critical features and frequently used features are visible
    if (feature.category === 'critical') {
      return true
    }

    // Check if feature is frequently used - Requirement: 5.5
    const usageCount = this.state.featureUsageCount.get(featureId) || 0
    if (usageCount >= USAGE_THRESHOLD_FREQUENT) {
      return true
    }

    return false
  }

  /**
   * Get all visible features
   * Requirements: 5.1, 5.4, 5.5
   */
  getVisibleFeatures(): FeatureConfig[] {
    return Array.from(this.features.values()).filter(feature =>
      this.isFeatureVisible(feature.id)
    )
  }

  /**
   * Get all hidden features (for indicators)
   * Requirements: 5.2
   */
  getHiddenFeatures(): FeatureConfig[] {
    return Array.from(this.features.values()).filter(
      feature => !this.isFeatureVisible(feature.id)
    )
  }

  /**
   * Get count of hidden features in a category
   * Requirements: 5.2
   */
  getHiddenFeatureCount(category?: string): number {
    const hidden = this.getHiddenFeatures()
    if (!category) return hidden.length
    return hidden.filter(f => f.category === category).length
  }

  /**
   * Track feature usage
   * Requirements: 5.5
   */
  trackFeatureUsage(featureId: string): void {
    const currentCount = this.state.featureUsageCount.get(featureId) || 0
    this.state.featureUsageCount.set(featureId, currentCount + 1)
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Get feature usage count
   * Requirements: 5.5
   */
  getFeatureUsageCount(featureId: string): number {
    return this.state.featureUsageCount.get(featureId) || 0
  }

  /**
   * Check if feature is frequently used
   * Requirements: 5.5
   */
  isFeatureFrequentlyUsed(featureId: string): boolean {
    return this.getFeatureUsageCount(featureId) >= USAGE_THRESHOLD_FREQUENT
  }

  /**
   * Hide a feature
   * Requirements: 5.2, 5.3
   */
  hideFeature(featureId: string): void {
    this.state.hiddenFeatures.add(featureId)
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Show a feature
   * Requirements: 5.2, 5.3
   */
  showFeature(featureId: string): void {
    this.state.hiddenFeatures.delete(featureId)
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Get feature by ID
   */
  getFeature(featureId: string): FeatureConfig | undefined {
    return this.features.get(featureId)
  }

  /**
   * Get all features
   */
  getAllFeatures(): FeatureConfig[] {
    return Array.from(this.features.values())
  }

  /**
   * Search features by name or description
   * Requirements: 5.6
   */
  searchFeatures(query: string): FeatureConfig[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.features.values()).filter(
      feature =>
        feature.name.toLowerCase().includes(lowerQuery) ||
        feature.description?.toLowerCase().includes(lowerQuery) ||
        feature.keyboardShortcut?.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Get keyboard shortcut for a feature
   * Requirements: 5.6
   */
  getKeyboardShortcut(featureId: string): string | undefined {
    return this.features.get(featureId)?.keyboardShortcut
  }

  /**
   * Get all keyboard shortcuts
   * Requirements: 5.6
   */
  getAllKeyboardShortcuts(): Array<{ feature: FeatureConfig; shortcut: string }> {
    return Array.from(this.features.values())
      .filter(feature => feature.keyboardShortcut)
      .map(feature => ({
        feature,
        shortcut: feature.keyboardShortcut!,
      }))
  }

  /**
   * Get current state
   */
  getState(): ViewState {
    return {
      mode: this.state.mode,
      expandedSections: new Set(this.state.expandedSections),
      hiddenFeatures: new Set(this.state.hiddenFeatures),
      featureUsageCount: new Map(this.state.featureUsageCount),
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: ViewState) => void): () => void {
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
    const state = this.getState()
    this.listeners.forEach(listener => {
      listener(state)
    })
  }

  /**
   * Save state to localStorage
   * Requirements: 5.3
   */
  private saveState(): void {
    try {
      const stateToSave = {
        mode: this.state.mode,
        expandedSections: Array.from(this.state.expandedSections),
        hiddenFeatures: Array.from(this.state.hiddenFeatures),
        featureUsageCount: Array.from(this.state.featureUsageCount.entries()),
        lastUpdated: Date.now(),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Failed to save disclosure state:', error)
    }
  }

  /**
   * Load state from localStorage
   * Requirements: 5.3
   */
  private loadState(): ViewState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        return this.getDefaultState()
      }

      const parsed = JSON.parse(saved)

      return {
        mode: parsed.mode || 'compact',
        expandedSections: new Set(parsed.expandedSections || []),
        hiddenFeatures: new Set(parsed.hiddenFeatures || []),
        featureUsageCount: new Map(parsed.featureUsageCount || []),
      }
    } catch (error) {
      console.error('Failed to load disclosure state:', error)
      return this.getDefaultState()
    }
  }

  /**
   * Get default state
   */
  private getDefaultState(): ViewState {
    return {
      mode: 'compact',
      expandedSections: new Set(),
      hiddenFeatures: new Set(),
      featureUsageCount: new Map(),
    }
  }

  /**
   * Reset state to defaults
   */
  reset(): void {
    this.state = this.getDefaultState()
    this.saveState()
    this.notifyListeners()
  }
}

/**
 * Create default feature configuration for Caption Art
 * Requirements: 5.1, 5.4, 5.5
 */
export function createDefaultFeatures(): FeatureConfig[] {
  return [
    // Critical features - always visible in compact mode
    {
      id: 'upload',
      name: 'Upload Image',
      category: 'critical',
      defaultVisible: true,
      keyboardShortcut: 'Ctrl+O',
      description: 'Upload an image to add text behind subject',
    },
    {
      id: 'caption-generate',
      name: 'Generate Caption',
      category: 'critical',
      defaultVisible: true,
      keyboardShortcut: 'Ctrl+G',
      description: 'Generate AI captions for your image',
    },
    {
      id: 'text-edit',
      name: 'Edit Text',
      category: 'critical',
      defaultVisible: true,
      keyboardShortcut: 'Ctrl+T',
      description: 'Edit text content and styling',
    },
    {
      id: 'export',
      name: 'Export Image',
      category: 'critical',
      defaultVisible: true,
      keyboardShortcut: 'Ctrl+E',
      description: 'Export your composition',
    },

    // Advanced features - visible in expanded mode or when frequently used
    {
      id: 'mask-regenerate',
      name: 'Regenerate Mask',
      category: 'advanced',
      defaultVisible: false,
      keyboardShortcut: 'Ctrl+M',
      description: 'Regenerate subject mask with different settings',
    },
    {
      id: 'text-effects',
      name: 'Text Effects',
      category: 'advanced',
      defaultVisible: false,
      keyboardShortcut: 'Ctrl+Shift+E',
      description: 'Apply shadows, outlines, and gradients to text',
    },
    {
      id: 'font-upload',
      name: 'Upload Custom Font',
      category: 'advanced',
      defaultVisible: false,
      description: 'Upload and use custom fonts',
    },
    {
      id: 'batch-process',
      name: 'Batch Processing',
      category: 'advanced',
      defaultVisible: false,
      keyboardShortcut: 'Ctrl+B',
      description: 'Process multiple images at once',
    },

    // Rarely used features - hidden by default
    {
      id: 'history',
      name: 'History Panel',
      category: 'rarely-used',
      defaultVisible: false,
      keyboardShortcut: 'Ctrl+H',
      description: 'View and manage edit history',
    },
    {
      id: 'preferences',
      name: 'Preferences',
      category: 'rarely-used',
      defaultVisible: false,
      keyboardShortcut: 'Ctrl+,',
      description: 'Customize app settings and preferences',
    },
    {
      id: 'keyboard-shortcuts',
      name: 'Keyboard Shortcuts',
      category: 'rarely-used',
      defaultVisible: false,
      keyboardShortcut: '?',
      description: 'View all keyboard shortcuts',
    },
  ]
}
