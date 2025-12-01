/**
 * ExportButton Component
 * Provides a button to trigger image export with loading state
 * Requirements: 1.1, 5.3, 5.4
 */

import { ButtonHTMLAttributes } from 'react'

export interface ExportButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isExporting?: boolean
  onExport?: () => void
}

export function ExportButton({ 
  isExporting = false, 
  onExport,
  disabled,
  children = '📥 Export',
  ...props 
}: ExportButtonProps) {
  return (
    <button
      className="button button-primary"
      onClick={onExport}
      disabled={disabled || isExporting}
      aria-label="Export image"
      aria-busy={isExporting}
      {...props}
    >
      {isExporting ? (
        <>
          <span className="loading-spinner" style={{ fontSize: '1em', marginRight: '8px' }} aria-hidden="true">
            ⏳
          </span>
          Exporting...
        </>
      ) : (
        children
      )}
    </button>
  )
}
