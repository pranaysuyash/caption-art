/**
 * ExportProgress Component
 * Displays export progress with progress bar, stage message, and percentage
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { ExportProgress as ExportProgressType } from '../lib/export/types'

export interface ExportProgressProps {
  progress: ExportProgressType
}

export function ExportProgress({ progress }: ExportProgressProps) {
  const { stage, progress: percentage, message } = progress

  // Map stages to icons
  const stageIcons: Record<typeof stage, string> = {
    preparing: '⚙️',
    watermarking: '🖼️',
    converting: '🔄',
    downloading: '📥',
    complete: '✅'
  }

  return (
    <div
      className="export-progress"
      style={{
        border: 'var(--border-width-medium) solid var(--color-border)',
        background: 'var(--color-bg)',
        padding: 'var(--spacing-xl)',
        boxShadow: 'var(--shadow-offset-md) var(--shadow-offset-md) 0 var(--color-border)',
        animation: 'fadeIn 0.3s var(--ease-smooth)'
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header with stage and percentage */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}
        >
          <span style={{ fontSize: 'var(--font-size-xl)' }}>
            {stageIcons[stage]}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--color-text)'
            }}
          >
            {message}
          </span>
        </div>
        
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            color: 'var(--color-accent-turquoise)'
          }}
          aria-label={`${percentage} percent complete`}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="progress-bar-container"
        style={{
          width: '100%',
          height: '24px',
          background: 'var(--color-bg-secondary)',
          border: 'var(--border-width-medium) solid var(--color-border)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          className="progress-bar-fill"
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: 'var(--color-accent-turquoise)',
            transition: 'width 0.3s var(--ease-smooth)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Shimmer effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              animation: 'shimmer 2s infinite'
            }}
          />
        </div>
      </div>

      {/* Stage indicator dots */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--spacing-sm)',
          marginTop: 'var(--spacing-lg)'
        }}
      >
        {(['preparing', 'watermarking', 'converting', 'downloading', 'complete'] as const).map((s) => {
          const stages = ['preparing', 'watermarking', 'converting', 'downloading', 'complete']
          const currentIndex = stages.indexOf(stage)
          const dotIndex = stages.indexOf(s)
          const isActive = dotIndex <= currentIndex
          
          return (
            <div
              key={s}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isActive ? 'var(--color-accent-turquoise)' : 'var(--color-bg-secondary)',
                border: 'var(--border-width-thin) solid var(--color-border)',
                transition: 'background 0.3s var(--ease-smooth)'
              }}
              aria-label={`Stage ${s}: ${isActive ? 'complete' : 'pending'}`}
            />
          )
        })}
      </div>
    </div>
  )
}
