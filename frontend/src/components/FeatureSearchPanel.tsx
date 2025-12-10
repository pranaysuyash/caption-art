/**
 * FeatureSearchPanel - Search features and view keyboard shortcuts
 * Requirements: 5.6
 */

import { useState } from 'react'
import { FeatureConfig } from '../lib/disclosure/ProgressiveDisclosureManager'

export interface FeatureSearchPanelProps {
  isOpen: boolean
  onClose: () => void
  features: FeatureConfig[]
  onSearch: (query: string) => FeatureConfig[]
  onFeatureClick?: (featureId: string) => void
}

export function FeatureSearchPanel({
  isOpen,
  onClose,
  features,
  onSearch,
  onFeatureClick,
}: FeatureSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FeatureConfig[]>([])

  if (!isOpen) return null

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.trim()) {
      setSearchResults(onSearch(value))
    } else {
      setSearchResults([])
    }
  }

  const handleFeatureClick = (featureId: string) => {
    if (onFeatureClick) {
      onFeatureClick(featureId)
    }
    onClose()
  }

  const displayFeatures = query.trim() ? searchResults : features

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-search-title"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '70vh',
          backgroundColor: 'var(--color-bg-primary, white)',
          border: '3px solid var(--color-border, #000)',
          borderRadius: '8px',
          boxShadow: '8px 8px 0 var(--color-border, #000)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '2px solid var(--color-border, #e5e7eb)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <h2
              id="feature-search-title"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--color-text, #1f2937)',
              }}
            >
              {query.trim() ? 'Search Features' : 'Keyboard Shortcuts'}
            </h2>

            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                padding: '0.5rem',
                fontSize: '1.5rem',
                color: 'var(--color-text-secondary, #6b7280)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          {/* Search input */}
          <input
            type="text"
            placeholder="Search features... (e.g., 'export', 'mask', 'text')"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              color: 'var(--color-text, #1f2937)',
              backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
              border: '2px solid var(--color-border, #000)',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Feature list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
          }}
        >
          {displayFeatures.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-text-secondary, #6b7280)',
              }}
            >
              {query.trim() ? 'No features found' : 'No features available'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {displayFeatures.map(feature => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    textAlign: 'left',
                    backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
                    border: '2px solid var(--color-border, #e5e7eb)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border, #e5e7eb)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--color-text, #1f2937)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {feature.name}
                    </div>
                    {feature.description && (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-secondary, #6b7280)',
                        }}
                      >
                        {feature.description}
                      </div>
                    )}
                  </div>

                  {/* Keyboard shortcut badge */}
                  {feature.keyboardShortcut && (
                    <div
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        color: 'var(--color-text, #1f2937)',
                        backgroundColor: 'var(--color-bg-primary, white)',
                        border: '2px solid var(--color-border, #000)',
                        borderRadius: '4px',
                      }}
                    >
                      {feature.keyboardShortcut}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '1rem 1.5rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary, #6b7280)',
            backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
            borderTop: '2px solid var(--color-border, #e5e7eb)',
          }}
        >
          Press <kbd style={{ fontWeight: 600 }}>?</kbd> to open this panel anytime
        </div>
      </div>
    </div>
  )
}
