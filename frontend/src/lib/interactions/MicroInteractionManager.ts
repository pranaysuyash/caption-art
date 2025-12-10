/**
 * MicroInteractionManager - Manages visual feedback and micro-interactions
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 * 
 * Features:
 * - Hover state management
 * - Click animations
 * - Smooth slider interactions
 * - Draggable element visual cues
 * - Keyboard shortcuts overlay
 * - Immediate action feedback
 */

export interface InteractionConfig {
  enableHoverEffects?: boolean
  enableClickAnimations?: boolean
  enableDragCues?: boolean
  feedbackDelay?: number // Max delay for feedback (default: 100ms)
}

export interface KeyboardShortcut {
  key: string
  description: string
  action?: () => void
}

const DEFAULT_CONFIG: InteractionConfig = {
  enableHoverEffects: true,
  enableClickAnimations: true,
  enableDragCues: true,
  feedbackDelay: 100,
}

/**
 * MicroInteractionManager manages UI micro-interactions
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export class MicroInteractionManager {
  private config: InteractionConfig
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private overlayElement: HTMLElement | null = null

  constructor(config: InteractionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Apply hover effects to an element
   * Requirements: 10.1
   */
  applyHoverEffect(
    element: HTMLElement,
    options: {
      scale?: number
      translateY?: number
      shadow?: string
      brightness?: number
    } = {}
  ): () => void {
    if (!this.config.enableHoverEffects) return () => {}

    const {
      scale = 1.02,
      translateY = -2,
      shadow = '0 4px 12px rgba(0, 0, 0, 0.15)',
      brightness = 1.05,
    } = options

    const originalTransition = element.style.transition
    const originalTransform = element.style.transform
    const originalBoxShadow = element.style.boxShadow
    const originalFilter = element.style.filter

    // Set transition
    element.style.transition = 'all 0.2s ease'

    const handleMouseEnter = () => {
      element.style.transform = `scale(${scale}) translateY(${translateY}px)`
      element.style.boxShadow = shadow
      element.style.filter = `brightness(${brightness})`
    }

    const handleMouseLeave = () => {
      element.style.transform = originalTransform
      element.style.boxShadow = originalBoxShadow
      element.style.filter = originalFilter
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    // Return cleanup function
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.style.transition = originalTransition
      element.style.transform = originalTransform
      element.style.boxShadow = originalBoxShadow
      element.style.filter = originalFilter
    }
  }

  /**
   * Apply click animation to an element
   * Requirements: 10.2, 10.6
   */
  applyClickAnimation(
    element: HTMLElement,
    options: {
      scale?: number
      duration?: number
    } = {}
  ): () => void {
    if (!this.config.enableClickAnimations) return () => {}

    const { scale = 0.95, duration = 150 } = options

    const handleClick = () => {
      const originalTransform = element.style.transform

      // Scale down
      element.style.transform = `scale(${scale})`
      element.style.transition = `transform ${duration / 2}ms ease`

      // Scale back up
      setTimeout(() => {
        element.style.transform = originalTransform
      }, duration / 2)
    }

    element.addEventListener('click', handleClick)

    // Return cleanup function
    return () => {
      element.removeEventListener('click', handleClick)
    }
  }

  /**
   * Apply smooth slider interaction
   * Requirements: 10.3
   */
  applySmoothSlider(
    slider: HTMLInputElement,
    onUpdate: (value: number) => void
  ): () => void {
    let rafId: number | null = null

    const handleInput = () => {
      // Cancel previous animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }

      // Schedule update on next frame
      rafId = requestAnimationFrame(() => {
        const value = parseFloat(slider.value)
        onUpdate(value)
        rafId = null
      })
    }

    slider.addEventListener('input', handleInput)

    // Return cleanup function
    return () => {
      slider.removeEventListener('input', handleInput)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }

  /**
   * Apply draggable visual cues
   * Requirements: 10.4
   */
  applyDraggableCues(element: HTMLElement): () => void {
    if (!this.config.enableDragCues) return () => {}

    const originalCursor = element.style.cursor

    // Set cursor
    element.style.cursor = 'grab'

    const handleMouseDown = () => {
      element.style.cursor = 'grabbing'
    }

    const handleMouseUp = () => {
      element.style.cursor = 'grab'
    }

    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseup', handleMouseUp)

    // Return cleanup function
    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseup', handleMouseUp)
      element.style.cursor = originalCursor
    }
  }

  /**
   * Register a keyboard shortcut
   * Requirements: 10.5
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.key.toLowerCase(), shortcut)
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(key: string): void {
    this.shortcuts.delete(key.toLowerCase())
  }

  /**
   * Get all registered shortcuts
   * Requirements: 10.5
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Show keyboard shortcuts overlay
   * Requirements: 10.5
   */
  showShortcutsOverlay(): void {
    if (this.overlayElement) return // Already showing

    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    `

    const content = document.createElement('div')
    content.style.cssText = `
      background: white;
      border: 3px solid black;
      border-radius: 8px;
      box-shadow: 8px 8px 0 black;
      padding: 2rem;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    `

    const title = document.createElement('h2')
    title.textContent = 'Keyboard Shortcuts'
    title.style.cssText = `
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 700;
    `

    const list = document.createElement('div')
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `

    this.getAllShortcuts().forEach(shortcut => {
      const item = document.createElement('div')
      item.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 4px;
      `

      const desc = document.createElement('span')
      desc.textContent = shortcut.description
      desc.style.cssText = `
        font-size: 1rem;
        color: #1f2937;
      `

      const key = document.createElement('kbd')
      key.textContent = shortcut.key
      key.style.cssText = `
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        font-family: monospace;
        color: #1f2937;
        background: white;
        border: 2px solid black;
        border-radius: 4px;
      `

      item.appendChild(desc)
      item.appendChild(key)
      list.appendChild(item)
    })

    const hint = document.createElement('p')
    hint.textContent = 'Press any key or click outside to close'
    hint.style.cssText = `
      margin: 1.5rem 0 0 0;
      font-size: 0.875rem;
      color: #6b7280;
      text-align: center;
    `

    content.appendChild(title)
    content.appendChild(list)
    content.appendChild(hint)
    overlay.appendChild(content)

    const closeOverlay = () => {
      if (this.overlayElement) {
        document.body.removeChild(this.overlayElement)
        this.overlayElement = null
      }
    }

    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        closeOverlay()
      }
    })

    document.addEventListener('keydown', closeOverlay, { once: true })

    document.body.appendChild(overlay)
    this.overlayElement = overlay
  }

  /**
   * Hide keyboard shortcuts overlay
   */
  hideShortcutsOverlay(): void {
    if (this.overlayElement) {
      document.body.removeChild(this.overlayElement)
      this.overlayElement = null
    }
  }

  /**
   * Provide immediate visual feedback
   * Requirements: 10.6
   */
  provideFeedback(
    element: HTMLElement,
    type: 'success' | 'error' | 'info' = 'success'
  ): void {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
    }

    const originalBorder = element.style.border
    const originalBoxShadow = element.style.boxShadow

    // Apply feedback immediately (within 100ms requirement)
    element.style.border = `3px solid ${colors[type]}`
    element.style.boxShadow = `0 0 0 4px ${colors[type]}33`
    element.style.transition = 'all 0.2s ease'

    // Remove feedback after delay
    setTimeout(() => {
      element.style.border = originalBorder
      element.style.boxShadow = originalBoxShadow
    }, 500)
  }

  /**
   * Initialize keyboard shortcut listener
   * Requirements: 10.5
   */
  initializeShortcutListener(): () => void {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Show overlay on "?" key
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        this.showShortcutsOverlay()
        return
      }

      // Build shortcut key string
      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
      if (e.shiftKey) parts.push('Shift')
      if (e.altKey) parts.push('Alt')
      parts.push(e.key)

      const shortcutKey = parts.join('+').toLowerCase()

      // Execute shortcut action
      const shortcut = this.shortcuts.get(shortcutKey)
      if (shortcut?.action) {
        e.preventDefault()
        shortcut.action()
      }
    }

    document.addEventListener('keydown', handleKeyPress)

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      this.hideShortcutsOverlay()
    }
  }
}

/**
 * Global instance for easy access
 */
export const microInteractions = new MicroInteractionManager()
