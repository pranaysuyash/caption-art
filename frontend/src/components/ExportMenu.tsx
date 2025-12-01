/**
 * Export Menu Component
 * Provides social media export presets for quick exports
 */

import { useState } from 'react'
import { Exporter } from '../lib/canvas/exporter'
import { useToast } from './Toast'

interface ExportPreset {
  name: string
  width: number
  height: number
  format: 'png' | 'jpeg'
  quality?: number
  icon: string
}

const EXPORT_PRESETS: ExportPreset[] = [
  { name: 'Instagram Post', width: 1080, height: 1080, format: 'jpeg', quality: 0.9, icon: '📷' },
  { name: 'Instagram Story', width: 1080, height: 1920, format: 'jpeg', quality: 0.9, icon: '📱' },
  { name: 'Twitter Post', width: 1200, height: 675, format: 'jpeg', quality: 0.9, icon: '🐦' },
  { name: 'Facebook Post', width: 1200, height: 630, format: 'jpeg', quality: 0.9, icon: '👍' },
  { name: 'LinkedIn Post', width: 1200, height: 627, format: 'jpeg', quality: 0.9, icon: '💼' },
  { name: 'Original Size (PNG)', width: 0, height: 0, format: 'png', icon: '🖼️' }
]

export interface ExportMenuProps {
  canvas: HTMLCanvasElement | null
  disabled?: boolean
  watermark?: boolean
  watermarkText?: string
}

export function ExportMenu({ canvas, disabled, watermark, watermarkText }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const toast = useToast()
  
  const handleExport = async (preset: ExportPreset) => {
    if (!canvas) {
      toast.error('No image to export')
      return
    }
    
    const loadingId = toast.loading(`Exporting ${preset.name}...`)
    
    try {
      if (preset.width === 0) {
        // Original size
        await Exporter.export(canvas, {
          format: preset.format,
          quality: preset.quality || 0.92,
          watermark,
          watermarkText
        })
      } else {
        // Resize and export
        const resizedCanvas = resizeCanvas(canvas, preset.width, preset.height)
        await Exporter.export(resizedCanvas, {
          format: preset.format,
          quality: preset.quality || 0.92,
          watermark,
          watermarkText
        })
      }
      
      toast.dismiss(loadingId)
      toast.success(`Exported as ${preset.name}!`)
      setIsOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
      toast.dismiss(loadingId)
      
      // Get user-friendly error message
      const errorMessage = Exporter.getErrorMessage(error)
      toast.error(errorMessage, {
        label: 'Retry',
        onClick: () => handleExport(preset)
      })
    }
  }
  
  return (
    <div className="export-menu" style={{ position: 'relative' }}>
      <button
        className="button button-primary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-label="Export image"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        📥 Export
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div
            className="export-dropdown"
            style={{
              position: 'absolute',
              top: 'calc(100% + var(--spacing-sm))',
              right: 0,
              background: 'var(--color-bg)',
              border: 'var(--border-width-medium) solid var(--color-border)',
              boxShadow: 'var(--shadow-offset-lg) var(--shadow-offset-lg) 0 var(--color-border)',
              borderRadius: '4px',
              padding: 'var(--spacing-sm)',
              minWidth: '250px',
              zIndex: 1000
            }}
            role="menu"
          >
            <div style={{ 
              padding: 'var(--spacing-sm)', 
              borderBottom: '1px solid var(--color-border)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-sm)' }}>
                Export Presets
              </strong>
            </div>
            
            {EXPORT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                className="export-preset-button"
                onClick={() => handleExport(preset)}
                role="menuitem"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-md)',
                  border: 'var(--border-width-thin) solid var(--color-border)',
                  background: 'var(--color-bg)',
                  cursor: 'pointer',
                  marginBottom: 'var(--spacing-xs)',
                  transition: 'all var(--transition-base)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--font-size-sm)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-secondary)'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span style={{ fontSize: '18px' }}>{preset.icon}</span>
                  <span style={{ fontWeight: 600 }}>{preset.name}</span>
                </span>
                {preset.width > 0 && (
                  <span style={{ 
                    fontSize: 'var(--font-size-xs)', 
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'monospace'
                  }}>
                    {preset.width}×{preset.height}
                  </span>
                )}
              </button>
            ))}
            
            <div style={{ 
              marginTop: 'var(--spacing-sm)',
              padding: 'var(--spacing-sm)',
              borderTop: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)'
            }}>
              💡 Tip: Use Ctrl+S to quick export
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Resize canvas to target dimensions while maintaining aspect ratio
 */
function resizeCanvas(
  source: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')
  
  // Calculate scaling to cover (crop to fit)
  const scale = Math.max(
    targetWidth / source.width,
    targetHeight / source.height
  )
  
  const scaledWidth = source.width * scale
  const scaledHeight = source.height * scale
  
  // Center the image
  const x = (targetWidth - scaledWidth) / 2
  const y = (targetHeight - scaledHeight) / 2
  
  // Fill background with white
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetWidth, targetHeight)
  
  // Draw scaled image
  ctx.drawImage(source, x, y, scaledWidth, scaledHeight)
  
  return canvas
}
