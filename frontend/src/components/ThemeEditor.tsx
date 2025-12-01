/**
 * ThemeEditor Component
 * 
 * Provides UI for creating and editing custom themes.
 * Includes controls for colors, typography, spacing, shadows, and borders.
 * Shows live preview of changes.
 */

import React, { useState, useEffect } from 'react'
import type { ThemeConfig, ColorPalette, Typography, Spacing, Shadows, Borders } from '../lib/themes/types'
import { getThemeManager } from '../lib/themes/themeManager'
import './ThemeEditor.css'

interface ThemeEditorProps {
  /** Initial theme to edit (optional - defaults to current theme) */
  initialTheme?: ThemeConfig
  /** Callback when theme is saved */
  onSave?: (theme: ThemeConfig) => void
  /** Callback when editor is closed */
  onClose?: () => void
}

export function ThemeEditor({ initialTheme, onSave, onClose }: ThemeEditorProps) {
  const themeManager = getThemeManager()
  const [theme, setTheme] = useState<ThemeConfig>(
    initialTheme || themeManager.getTheme()
  )
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'shadows' | 'borders'>('colors')
  const [themeName, setThemeName] = useState(theme.name)
  const [themeDescription, setThemeDescription] = useState(theme.description)

  const handleClose = () => {
    // Cleanup will happen in useEffect cleanup
    if (onClose) {
      onClose()
    }
  }

  // Store original theme to restore on close
  const [originalTheme] = useState(() => themeManager.getState())

  // Apply preview theme (create temporary theme for preview)
  useEffect(() => {
    const previewTheme: ThemeConfig = {
      ...theme,
      id: 'preview-temp',
      name: themeName || 'Preview',
      description: themeDescription || 'Preview theme',
      category: 'custom',
      version: '1.0.0'
    }
    
    // Create a temporary custom theme for preview
    try {
      // Check if preview theme already exists
      const existingThemes = themeManager.getAvailableThemes()
      const previewExists = existingThemes.find(t => t.id === 'preview-temp')
      
      if (previewExists) {
        themeManager.updateCustomTheme('preview-temp', previewTheme)
      } else {
        themeManager.createCustomTheme(previewTheme)
      }
      
      themeManager.setTheme('preview-temp', mode)
    } catch (error) {
      console.error('Failed to apply preview:', error)
    }
  }, [theme, mode, themeName, themeDescription, themeManager])

  // Cleanup: restore original theme and remove preview theme
  useEffect(() => {
    return () => {
      try {
        // Remove preview theme
        themeManager.deleteCustomTheme('preview-temp')
        // Restore original theme
        themeManager.setTheme(originalTheme.currentTheme, originalTheme.mode)
      } catch (error) {
        console.error('Failed to cleanup preview:', error)
      }
    }
  }, [themeManager, originalTheme])

  const handleColorChange = (colorKey: keyof ColorPalette, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [mode]: {
          ...prev.colors[mode],
          [colorKey]: value
        }
      }
    }))
  }

  const handleTypographyChange = (key: keyof Typography, value: any) => {
    setTheme(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value
      }
    }))
  }

  const handleSpacingChange = (index: number, value: number) => {
    setTheme(prev => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        scale: prev.spacing.scale.map((v, i) => i === index ? value : v)
      }
    }))
  }

  const handleShadowChange = (key: keyof Shadows, value: string) => {
    setTheme(prev => ({
      ...prev,
      shadows: {
        ...prev.shadows,
        [key]: value
      }
    }))
  }

  const handleBorderWidthChange = (key: 'thin' | 'medium' | 'thick', value: number) => {
    setTheme(prev => ({
      ...prev,
      borders: {
        ...prev.borders,
        width: {
          ...prev.borders.width,
          [key]: value
        }
      }
    }))
  }

  const handleBorderRadiusChange = (key: 'sm' | 'md' | 'lg' | 'full', value: number) => {
    setTheme(prev => ({
      ...prev,
      borders: {
        ...prev.borders,
        radius: {
          ...prev.borders.radius,
          [key]: value
        }
      }
    }))
  }

  const handleSave = () => {
    try {
      // Create the custom theme with updated metadata
      const customTheme = themeManager.createCustomTheme({
        ...theme,
        name: themeName,
        description: themeDescription
      })

      // Apply the newly created theme
      themeManager.setTheme(customTheme.id, mode)

      // Call onSave callback if provided
      if (onSave) {
        onSave(customTheme)
      }
    } catch (error) {
      console.error('Failed to save custom theme:', error)
      alert(`Failed to save theme: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const currentColors = theme.colors[mode]

  return (
    <div className="theme-editor">
      <div className="theme-editor-header">
        <h2>Theme Editor</h2>
        <button onClick={handleClose} className="close-button" aria-label="Close theme editor">×</button>
      </div>

      <div className="theme-editor-meta">
        <div className="form-group">
          <label htmlFor="theme-name">Theme Name</label>
          <input
            id="theme-name"
            type="text"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            placeholder="My Custom Theme"
          />
        </div>
        <div className="form-group">
          <label htmlFor="theme-description">Description</label>
          <input
            id="theme-description"
            type="text"
            value={themeDescription}
            onChange={(e) => setThemeDescription(e.target.value)}
            placeholder="A beautiful custom theme"
          />
        </div>
      </div>

      <div className="theme-editor-mode-toggle">
        <button
          className={mode === 'light' ? 'active' : ''}
          onClick={() => setMode('light')}
          aria-label="Edit light mode colors"
          aria-pressed={mode === 'light'}
        >
          Light Mode
        </button>
        <button
          className={mode === 'dark' ? 'active' : ''}
          onClick={() => setMode('dark')}
          aria-label="Edit dark mode colors"
          aria-pressed={mode === 'dark'}
        >
          Dark Mode
        </button>
      </div>

      <div className="theme-editor-tabs">
        <button
          className={activeTab === 'colors' ? 'active' : ''}
          onClick={() => setActiveTab('colors')}
          aria-label="Edit colors"
          aria-pressed={activeTab === 'colors'}
        >
          Colors
        </button>
        <button
          className={activeTab === 'typography' ? 'active' : ''}
          onClick={() => setActiveTab('typography')}
          aria-label="Edit typography"
          aria-pressed={activeTab === 'typography'}
        >
          Typography
        </button>
        <button
          className={activeTab === 'spacing' ? 'active' : ''}
          onClick={() => setActiveTab('spacing')}
          aria-label="Edit spacing"
          aria-pressed={activeTab === 'spacing'}
        >
          Spacing
        </button>
        <button
          className={activeTab === 'shadows' ? 'active' : ''}
          onClick={() => setActiveTab('shadows')}
          aria-label="Edit shadows"
          aria-pressed={activeTab === 'shadows'}
        >
          Shadows
        </button>
        <button
          className={activeTab === 'borders' ? 'active' : ''}
          onClick={() => setActiveTab('borders')}
          aria-label="Edit borders"
          aria-pressed={activeTab === 'borders'}
        >
          Borders
        </button>
      </div>

      <div className="theme-editor-content">
        {activeTab === 'colors' && (
          <div className="color-controls">
            <h3>Background Colors</h3>
            <ColorInput
              label="Primary Background"
              value={currentColors.bg}
              onChange={(v) => handleColorChange('bg', v)}
            />
            <ColorInput
              label="Secondary Background"
              value={currentColors.bgSecondary}
              onChange={(v) => handleColorChange('bgSecondary', v)}
            />
            <ColorInput
              label="Tertiary Background"
              value={currentColors.bgTertiary}
              onChange={(v) => handleColorChange('bgTertiary', v)}
            />

            <h3>Text Colors</h3>
            <ColorInput
              label="Primary Text"
              value={currentColors.text}
              onChange={(v) => handleColorChange('text', v)}
            />
            <ColorInput
              label="Secondary Text"
              value={currentColors.textSecondary}
              onChange={(v) => handleColorChange('textSecondary', v)}
            />
            <ColorInput
              label="Tertiary Text"
              value={currentColors.textTertiary}
              onChange={(v) => handleColorChange('textTertiary', v)}
            />

            <h3>Accent Colors</h3>
            <ColorInput
              label="Primary"
              value={currentColors.primary}
              onChange={(v) => handleColorChange('primary', v)}
            />
            <ColorInput
              label="Secondary"
              value={currentColors.secondary}
              onChange={(v) => handleColorChange('secondary', v)}
            />
            <ColorInput
              label="Accent"
              value={currentColors.accent}
              onChange={(v) => handleColorChange('accent', v)}
            />

            <h3>Semantic Colors</h3>
            <ColorInput
              label="Success"
              value={currentColors.success}
              onChange={(v) => handleColorChange('success', v)}
            />
            <ColorInput
              label="Warning"
              value={currentColors.warning}
              onChange={(v) => handleColorChange('warning', v)}
            />
            <ColorInput
              label="Error"
              value={currentColors.error}
              onChange={(v) => handleColorChange('error', v)}
            />
            <ColorInput
              label="Info"
              value={currentColors.info}
              onChange={(v) => handleColorChange('info', v)}
            />

            <h3>Border Colors</h3>
            <ColorInput
              label="Border"
              value={currentColors.border}
              onChange={(v) => handleColorChange('border', v)}
            />
            <ColorInput
              label="Light Border"
              value={currentColors.borderLight}
              onChange={(v) => handleColorChange('borderLight', v)}
            />
            <ColorInput
              label="Heavy Border"
              value={currentColors.borderHeavy}
              onChange={(v) => handleColorChange('borderHeavy', v)}
            />
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="typography-controls">
            <div className="form-group">
              <label>Heading Font</label>
              <input
                type="text"
                value={theme.typography.fontFamilyHeading}
                onChange={(e) => handleTypographyChange('fontFamilyHeading', e.target.value)}
                placeholder="'Inter', sans-serif"
              />
            </div>
            <div className="form-group">
              <label>Body Font</label>
              <input
                type="text"
                value={theme.typography.fontFamilyBody}
                onChange={(e) => handleTypographyChange('fontFamilyBody', e.target.value)}
                placeholder="'Inter', sans-serif"
              />
            </div>
            <div className="form-group">
              <label>Monospace Font</label>
              <input
                type="text"
                value={theme.typography.fontFamilyMono}
                onChange={(e) => handleTypographyChange('fontFamilyMono', e.target.value)}
                placeholder="'Monaco', monospace"
              />
            </div>
            <div className="form-group">
              <label>Base Font Size (px)</label>
              <input
                type="number"
                min="12"
                max="72"
                value={theme.typography.fontSizeBase}
                onChange={(e) => handleTypographyChange('fontSizeBase', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Normal Weight</label>
              <select
                value={theme.typography.fontWeightNormal}
                onChange={(e) => handleTypographyChange('fontWeightNormal', parseInt(e.target.value))}
              >
                <option value="100">100 - Thin</option>
                <option value="200">200 - Extra Light</option>
                <option value="300">300 - Light</option>
                <option value="400">400 - Normal</option>
                <option value="500">500 - Medium</option>
                <option value="600">600 - Semi Bold</option>
                <option value="700">700 - Bold</option>
                <option value="800">800 - Extra Bold</option>
                <option value="900">900 - Black</option>
              </select>
            </div>
            <div className="form-group">
              <label>Medium Weight</label>
              <select
                value={theme.typography.fontWeightMedium}
                onChange={(e) => handleTypographyChange('fontWeightMedium', parseInt(e.target.value))}
              >
                <option value="100">100 - Thin</option>
                <option value="200">200 - Extra Light</option>
                <option value="300">300 - Light</option>
                <option value="400">400 - Normal</option>
                <option value="500">500 - Medium</option>
                <option value="600">600 - Semi Bold</option>
                <option value="700">700 - Bold</option>
                <option value="800">800 - Extra Bold</option>
                <option value="900">900 - Black</option>
              </select>
            </div>
            <div className="form-group">
              <label>Bold Weight</label>
              <select
                value={theme.typography.fontWeightBold}
                onChange={(e) => handleTypographyChange('fontWeightBold', parseInt(e.target.value))}
              >
                <option value="100">100 - Thin</option>
                <option value="200">200 - Extra Light</option>
                <option value="300">300 - Light</option>
                <option value="400">400 - Normal</option>
                <option value="500">500 - Medium</option>
                <option value="600">600 - Semi Bold</option>
                <option value="700">700 - Bold</option>
                <option value="800">800 - Extra Bold</option>
                <option value="900">900 - Black</option>
              </select>
            </div>
            <div className="form-group">
              <label>Line Height</label>
              <input
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={theme.typography.lineHeightBase}
                onChange={(e) => handleTypographyChange('lineHeightBase', parseFloat(e.target.value))}
              />
            </div>
          </div>
        )}

        {activeTab === 'spacing' && (
          <div className="spacing-controls">
            <div className="form-group">
              <label>Base Unit (px)</label>
              <input
                type="number"
                min="1"
                max="32"
                value={theme.spacing.unit}
                onChange={(e) => setTheme(prev => ({
                  ...prev,
                  spacing: { ...prev.spacing, unit: parseInt(e.target.value) }
                }))}
              />
            </div>
            <h3>Spacing Scale</h3>
            {theme.spacing.scale.map((value, index) => (
              <div key={index} className="form-group">
                <label>Scale {index}</label>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => handleSpacingChange(index, parseInt(e.target.value))}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'shadows' && (
          <div className="shadow-controls">
            <div className="form-group">
              <label>Small Shadow</label>
              <input
                type="text"
                value={theme.shadows.sm}
                onChange={(e) => handleShadowChange('sm', e.target.value)}
                placeholder="0 1px 2px rgba(0,0,0,0.1)"
              />
            </div>
            <div className="form-group">
              <label>Medium Shadow</label>
              <input
                type="text"
                value={theme.shadows.md}
                onChange={(e) => handleShadowChange('md', e.target.value)}
                placeholder="0 4px 6px rgba(0,0,0,0.1)"
              />
            </div>
            <div className="form-group">
              <label>Large Shadow</label>
              <input
                type="text"
                value={theme.shadows.lg}
                onChange={(e) => handleShadowChange('lg', e.target.value)}
                placeholder="0 10px 15px rgba(0,0,0,0.1)"
              />
            </div>
            <div className="form-group">
              <label>Extra Large Shadow</label>
              <input
                type="text"
                value={theme.shadows.xl}
                onChange={(e) => handleShadowChange('xl', e.target.value)}
                placeholder="0 20px 25px rgba(0,0,0,0.1)"
              />
            </div>
            <div className="form-group">
              <label>Inner Shadow</label>
              <input
                type="text"
                value={theme.shadows.inner}
                onChange={(e) => handleShadowChange('inner', e.target.value)}
                placeholder="inset 0 2px 4px rgba(0,0,0,0.06)"
              />
            </div>
            {theme.shadows.glow !== undefined && (
              <div className="form-group">
                <label>Glow Shadow</label>
                <input
                  type="text"
                  value={theme.shadows.glow}
                  onChange={(e) => handleShadowChange('glow', e.target.value)}
                  placeholder="0 0 20px currentColor"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'borders' && (
          <div className="border-controls">
            <h3>Border Widths (px)</h3>
            <div className="form-group">
              <label>Thin</label>
              <input
                type="number"
                min="0"
                value={theme.borders.width.thin}
                onChange={(e) => handleBorderWidthChange('thin', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input
                type="number"
                min="0"
                value={theme.borders.width.medium}
                onChange={(e) => handleBorderWidthChange('medium', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Thick</label>
              <input
                type="number"
                min="0"
                value={theme.borders.width.thick}
                onChange={(e) => handleBorderWidthChange('thick', parseInt(e.target.value))}
              />
            </div>

            <h3>Border Radius (px)</h3>
            <div className="form-group">
              <label>Small</label>
              <input
                type="number"
                min="0"
                value={theme.borders.radius.sm}
                onChange={(e) => handleBorderRadiusChange('sm', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input
                type="number"
                min="0"
                value={theme.borders.radius.md}
                onChange={(e) => handleBorderRadiusChange('md', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Large</label>
              <input
                type="number"
                min="0"
                value={theme.borders.radius.lg}
                onChange={(e) => handleBorderRadiusChange('lg', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Full (rounded)</label>
              <input
                type="number"
                min="0"
                value={theme.borders.radius.full}
                onChange={(e) => handleBorderRadiusChange('full', parseInt(e.target.value))}
              />
            </div>

            <h3>Border Style</h3>
            <div className="form-group">
              <select
                value={theme.borders.style}
                onChange={(e) => setTheme(prev => ({
                  ...prev,
                  borders: { ...prev.borders, style: e.target.value as 'solid' | 'dashed' | 'dotted' }
                }))}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="theme-editor-preview">
        <h3>Live Preview</h3>
        <div className="preview-samples">
          <button className="preview-button">Button</button>
          <div className="preview-card">
            <h4>Card Title</h4>
            <p>This is a sample card with some text content.</p>
          </div>
          <input type="text" className="preview-input" placeholder="Input field" />
        </div>
      </div>

      <div className="theme-editor-actions">
        <button onClick={handleClose} className="cancel-button" aria-label="Cancel theme editing">Cancel</button>
        <button onClick={handleSave} className="save-button" aria-label="Save custom theme">Save Theme</button>
      </div>
    </div>
  )
}

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  // Handle gradient values by showing text input only
  const isGradient = value.includes('gradient(')
  
  return (
    <div className="color-input-group">
      <label>{label}</label>
      <div className="color-input-controls">
        {!isGradient && (
          <input
            type="color"
            value={value.startsWith('#') ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="color-picker"
          />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="color-text"
          placeholder="#000000 or rgb(0,0,0)"
        />
      </div>
    </div>
  )
}
