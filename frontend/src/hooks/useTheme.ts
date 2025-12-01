/**
 * useTheme Hook
 * 
 * Custom hook for managing theme state using the new ThemeManager.
 * Provides backward compatibility with the old theme system.
 * 
 * Requirements: 6.1, 6.5, 7.1, 7.2, 7.3
 */

import { useState, useEffect } from 'react';
import { getThemeManager } from '../lib/themes/themeManager';
import type { ThemeState } from '../lib/themes/types';

export type Theme = 'light' | 'dark';

/**
 * Custom hook for managing theme state
 * Now integrated with the new ThemeManager system
 * Provides theme state, toggle function, and handles persistence
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [themeId, setThemeId] = useState<string>('neobrutalism');

  useEffect(() => {
    const manager = getThemeManager();
    
    // Get initial state
    const state = manager.getState();
    setTheme(state.mode);
    setThemeId(state.currentTheme);

    // Subscribe to theme changes
    const unsubscribe = manager.subscribeToChanges((newState: ThemeState) => {
      setTheme(newState.mode);
      setThemeId(newState.currentTheme);
    });

    return unsubscribe;
  }, []);

  const toggleTheme = () => {
    const manager = getThemeManager();
    manager.toggleMode();
  };

  const setThemeById = (id: string) => {
    const manager = getThemeManager();
    manager.setTheme(id);
  };

  return { 
    theme, 
    toggleTheme,
    themeId,
    setTheme: setThemeById
  };
}
