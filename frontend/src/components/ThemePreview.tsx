/**
 * ThemePreview Component
 * 
 * Shows a thumbnail preview of a theme with sample components.
 * Displays theme name, description, and visual style samples.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

import { ThemeConfig } from '../lib/themes/types'
import './ThemePreview.css'

interface ThemePreviewProps {
  theme: ThemeConfig
  isActive: boolean
  onSelect: () => void
}

export function ThemePreview({ theme, isActive, onSelect }: ThemePreviewProps) {
  // Get colors for current mode (default to light for preview)
  const colors = theme.colors.light

  return (
    <button
      className={`theme-preview ${isActive ? 'theme-preview--active' : ''}`}
      onClick={onSelect}
      aria-label={`Select ${theme.name} theme`}
      aria-pressed={isActive}
    >
      {/* Theme thumbnail showing color palette and style */}
      <div className="theme-preview-thumbnail">
        {/* Color swatches */}
        <div className="theme-preview-colors">
          <div
            className="theme-preview-color"
            style={{ backgroundColor: colors.primary }}
            title="Primary color"
          />
          <div
            className="theme-preview-color"
            style={{ backgroundColor: colors.secondary }}
            title="Secondary color"
          />
          <div
            className="theme-preview-color"
            style={{ backgroundColor: colors.accent }}
            title="Accent color"
          />
        </div>

        {/* Sample components in theme style */}
        <div
          className="theme-preview-samples"
          style={{
            backgroundColor: colors.bg,
            color: colors.text,
            fontFamily: theme.typography.fontFamilyBody
          }}
        >
          {/* Sample button */}
          <div
            className="theme-preview-button"
            style={{
              backgroundColor: colors.primary,
              color: colors.bg,
              border: `${theme.borders.width.medium}px ${theme.borders.style} ${colors.border}`,
              borderRadius: `${theme.borders.radius.md}px`,
              boxShadow: theme.shadows.sm,
              fontFamily: theme.typography.fontFamilyBody,
              fontWeight: theme.typography.fontWeightMedium
            }}
          >
            Button
          </div>

          {/* Sample card */}
          <div
            className="theme-preview-card"
            style={{
              backgroundColor: colors.bgSecondary,
              border: `${theme.borders.width.thin}px ${theme.borders.style} ${colors.borderLight}`,
              borderRadius: `${theme.borders.radius.md}px`,
              boxShadow: theme.shadows.sm
            }}
          >
            <div
              className="theme-preview-card-title"
              style={{
                fontFamily: theme.typography.fontFamilyHeading,
                fontWeight: theme.typography.fontWeightBold,
                color: colors.text
              }}
            >
              Card
            </div>
            <div
              className="theme-preview-card-text"
              style={{
                color: colors.textSecondary,
                fontSize: '12px'
              }}
            >
              Sample text
            </div>
          </div>

          {/* Sample input */}
          <div
            className="theme-preview-input"
            style={{
              backgroundColor: colors.bg,
              border: `${theme.borders.width.thin}px ${theme.borders.style} ${colors.border}`,
              borderRadius: `${theme.borders.radius.sm}px`,
              color: colors.text
            }}
          >
            Input
          </div>
        </div>
      </div>

      {/* Theme info */}
      <div className="theme-preview-info">
        <div className="theme-preview-name">
          {theme.name}
          {isActive && <span className="theme-preview-badge">Active</span>}
        </div>
        <div className="theme-preview-description">{theme.description}</div>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="theme-preview-checkmark" aria-hidden="true">
          ✓
        </div>
      )}
    </button>
  )
}
