import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { getThemeManager } from '../lib/themes/themeManager';
import { ThemeConfig } from '../lib/themes/types';

export const ThemeSwitcher: React.FC = () => {
  const { themeId, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const manager = getThemeManager();
  const [themes, setThemes] = React.useState(manager.getAvailableThemes());

  // Subscribe to theme changes to update the list
  React.useEffect(() => {
    const unsubscribe = manager.subscribeToChanges(() => {
      setThemes(manager.getAvailableThemes());
    });
    return unsubscribe;
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleThemeSelect = (id: string) => {
    setTheme(id);
  };

  const handleColorChange = (color: string) => {
    const currentTheme = themes.find(t => t.id === themeId);
    if (!currentTheme) return;

    // If it's already a custom theme, update it
    if (currentTheme.category === 'custom') {
      const updatedColors = { ...currentTheme.colors };
      updatedColors.light.primary = color;
      updatedColors.dark.primary = color;
      // Also update brand color mapping if needed, but ThemeEngine handles mapping
      
      manager.updateCustomTheme(currentTheme.id, { colors: updatedColors });
    } else {
      // Create a new custom theme from preset
      const newTheme = manager.createCustomThemeFromPreset(currentTheme.id, `Custom ${currentTheme.name}`);
      const updatedColors = { ...newTheme.colors };
      updatedColors.light.primary = color;
      updatedColors.dark.primary = color;
      
      manager.updateCustomTheme(newTheme.id, { colors: updatedColors });
      setTheme(newTheme.id);
    }
  };

  const currentTheme = themes.find(t => t.id === themeId) || themes[0];

  // Pre-defined colors for quick selection
  const quickColors = [
    '#2563eb', // Blue
    '#16a34a', // Green
    '#dc2626', // Red
    '#9333ea', // Purple
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#db2777', // Pink
    '#4f46e5', // Indigo
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-bg-secondary transition-colors"
        aria-label="Select theme"
      >
        <div 
          className="w-4 h-4 rounded-full border border-border" 
          style={{ background: currentTheme?.colors.light.primary }}
        />
        <span className="text-sm font-medium hide-mobile">{currentTheme?.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-surface shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold mb-3">Primary Color</h3>
            <div className="flex flex-wrap gap-2">
              {quickColors.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform"
                  style={{ background: color }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={currentTheme?.colors.light.primary}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
              />
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto p-2">
            <h3 className="text-xs font-semibold text-text-secondary px-2 py-1 uppercase tracking-wider">Themes</h3>
            <div className="grid grid-cols-1 gap-1">
              {themes.map((theme: ThemeConfig) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    themeId === theme.id ? 'bg-bg-secondary ring-1 ring-border' : 'hover:bg-bg-secondary'
                  }`}
                >
                  <div className="flex -space-x-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-border z-10" 
                      style={{ background: theme.colors.light.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-border" 
                      style={{ background: theme.colors.light.bg }}
                    />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="font-medium truncate w-full text-left">{theme.name}</span>
                  </div>
                  {themeId === theme.id && (
                    <svg className="w-4 h-4 ml-auto text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
