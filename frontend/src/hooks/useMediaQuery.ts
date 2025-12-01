import { useState, useEffect } from 'react'

export type LayoutMode = 'desktop' | 'tablet' | 'mobile'

const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
}

/**
 * Hook to detect responsive breakpoints and return current layout mode
 * Returns:
 * - 'mobile' when width < 768px
 * - 'tablet' when width >= 768px && width < 1024px
 * - 'desktop' when width >= 1024px
 */
export function useMediaQuery(): LayoutMode {
  const getLayoutMode = (): LayoutMode => {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    if (width < BREAKPOINTS.MOBILE) return 'mobile'
    if (width < BREAKPOINTS.TABLET) return 'tablet'
    return 'desktop'
  }

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(getLayoutMode)

  useEffect(() => {
    let timeoutId: number | undefined

    const handleResize = () => {
      // Debounce resize events (300ms) to prevent jank
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
      
      timeoutId = window.setTimeout(() => {
        setLayoutMode(getLayoutMode())
      }, 300)
    }

    window.addEventListener('resize', handleResize)
    
    // Initial check
    setLayoutMode(getLayoutMode())

    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  return layoutMode
}
