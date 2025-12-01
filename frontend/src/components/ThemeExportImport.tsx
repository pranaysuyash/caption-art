/**
 * ThemeExportImport Component
 * 
 * Provides UI for exporting and importing themes.
 * Allows users to share themes with others or use them on different devices.
 */

import React, { useState, useRef } from 'react'
import { getThemeManager } from '../lib/themes/themeManager'
import type { ThemeConfig } from '../lib/themes/types'

export interface ThemeExportImportProps {
  /** Callback when theme is imported successfully */
  onImportSuccess?: (theme: ThemeConfig) => void
  /** Callback when export is completed */
  onExportSuccess?: (themeId: string) => void
}

export function ThemeExportImport({ onImportSuccess, onExportSuccess }: ThemeExportImportProps) {
  const themeManager = getThemeManager()
  const [selectedThemeId, setSelectedThemeId] = useState<string>('')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState<string>('')
  const [exportStatus, setExportStatus] = useState<'idle' | 'success'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const availableThemes = themeManager.getAvailableThemes()

  const handleExport = () => {
    if (!selectedThemeId) {
      alert('Please select a theme to export')
      return
    }

    try {
      // Export theme as JSON
      const themeJson = themeManager.exportTheme(selectedThemeId)
      
      // Create blob and download
      const blob = new Blob([themeJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Get theme name for filename
      const theme = availableThemes.find(t => t.id === selectedThemeId)
      const filename = `${theme?.name.toLowerCase().replace(/\s+/g, '-') || 'theme'}.json`
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportStatus('success')
      setTimeout(() => setExportStatus('idle'), 3000)

      if (onExportSuccess) {
        onExportSuccess(selectedThemeId)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Failed to export theme: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      // Read file content
      const text = await file.text()
      
      // Import theme
      const importedTheme = themeManager.importTheme(text)
      
      setImportStatus('success')
      setImportMessage(`Successfully imported "${importedTheme.name}"`)
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setImportStatus('idle')
        setImportMessage('')
      }, 5000)

      if (onImportSuccess) {
        onImportSuccess(importedTheme)
      }
    } catch (error) {
      console.error('Import failed:', error)
      setImportStatus('error')
      setImportMessage(error instanceof Error ? error.message : 'Failed to import theme')
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setImportStatus('idle')
        setImportMessage('')
      }, 5000)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="theme-export-import">
      <div className="export-section">
        <h3>Export Theme</h3>
        <p>Export a theme to share with others or use on another device.</p>
        
        <div className="form-group">
          <label htmlFor="theme-select">Select Theme</label>
          <select
            id="theme-select"
            value={selectedThemeId}
            onChange={(e) => setSelectedThemeId(e.target.value)}
          >
            <option value="">-- Select a theme --</option>
            {availableThemes.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.name} {theme.category === 'custom' ? '(Custom)' : '(Preset)'}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={!selectedThemeId}
          className="export-button"
          aria-label="Export selected theme as JSON file"
        >
          Export Theme
        </button>

        {exportStatus === 'success' && (
          <div className="status-message success">
            Theme exported successfully!
          </div>
        )}
      </div>

      <div className="import-section">
        <h3>Import Theme</h3>
        <p>Import a theme from a JSON file.</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <button onClick={handleImportClick} className="import-button" aria-label="Choose theme JSON file to import">
          Choose File to Import
        </button>

        {importStatus === 'success' && (
          <div className="status-message success">
            {importMessage}
          </div>
        )}

        {importStatus === 'error' && (
          <div className="status-message error">
            {importMessage}
          </div>
        )}
      </div>

      <style>{`
        .theme-export-import {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 1.5rem;
          background: var(--color-bg-secondary);
          border: var(--border-width-medium) solid var(--color-border);
          border-radius: var(--border-radius-md);
        }

        .export-section,
        .import-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .export-section h3,
        .import-section h3 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--color-text);
        }

        .export-section p,
        .import-section p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: var(--font-weight-medium);
          color: var(--color-text);
          font-size: 0.875rem;
        }

        .form-group select {
          padding: 0.5rem;
          border: var(--border-width-thin) solid var(--color-border);
          border-radius: var(--border-radius-sm);
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 1rem;
          font-family: inherit;
        }

        .form-group select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary)33;
        }

        .export-button,
        .import-button {
          padding: 0.75rem 1.5rem;
          border: var(--border-width-medium) solid var(--color-border);
          border-radius: var(--border-radius-sm);
          background: var(--color-primary);
          color: white;
          font-size: 1rem;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--animation-duration-base) var(--animation-easing-smooth);
        }

        .export-button:hover:not(:disabled),
        .import-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .export-button:active:not(:disabled),
        .import-button:active {
          transform: translateY(0);
        }

        .export-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status-message {
          padding: 0.75rem 1rem;
          border-radius: var(--border-radius-sm);
          font-size: 0.875rem;
          font-weight: var(--font-weight-medium);
        }

        .status-message.success {
          background: var(--color-success)22;
          color: var(--color-success);
          border: var(--border-width-thin) solid var(--color-success);
        }

        .status-message.error {
          background: var(--color-error)22;
          color: var(--color-error);
          border: var(--border-width-thin) solid var(--color-error);
        }

        @media (prefers-reduced-motion: reduce) {
          .export-button,
          .import-button {
            transition: none;
          }

          .export-button:hover:not(:disabled),
          .import-button:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  )
}
