// This file contains the original single-image editor moved to /playground
// Simplified version without complex imports

import { useState } from 'react'
import { ToastContainer, useToast } from '../Toast'

export function Playground() {
  const [imageObjUrl, setImageObjUrl] = useState<string>('')
  const toast = useToast()

  const onFile = async (f: File) => {
    try {
      // Create object URL
      const obj = URL.createObjectURL(f)
      setImageObjUrl(obj)
      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('File upload error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to process image. Please try again.'
      toast.error(errorMsg)
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-body, sans-serif)' }}>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />

      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--color-border, #e5e7eb)',
        backgroundColor: 'var(--color-background, #f8fafc)'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-heading, sans-serif)',
          fontSize: '1.5rem',
          margin: 0,
          color: 'var(--color-text, #1f2937)'
        }}>
          🎨 Caption Art Playground
        </h1>
        <p style={{
          color: 'var(--color-text-secondary, #6b7280)',
          margin: '0.5rem 0 0 0',
          fontSize: '0.875rem'
        }}>
          Legacy single-image editor. For agency workflows, use the main app.
        </p>
      </div>

      <div style={{ padding: '2rem' }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {!imageObjUrl ? (
            <div style={{
              border: '2px dashed var(--color-border, #d1d5db)',
              borderRadius: '8px',
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--color-background, #f8fafc)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
              <h2 style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontSize: '1.25rem',
                color: 'var(--color-text, #1f2937)',
                margin: '0 0 1rem 0'
              }}>
                Upload an image to get started
              </h2>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onFile(file)
                }}
                style={{
                  display: 'none'
                }}
                id="playground-file-input"
              />
              <label
                htmlFor="playground-file-input"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--color-primary, #2563eb)',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Choose Image
              </label>
            </div>
          ) : (
            <div>
              <div style={{
                maxWidth: '100%',
                margin: '0 auto 1rem',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img
                  src={imageObjUrl}
                  alt="Uploaded"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '1rem'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onFile(file)
                  }}
                  style={{
                    display: 'none'
                  }}
                  id="playground-replace-input"
                />
                <label
                  htmlFor="playground-replace-input"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--color-surface, white)',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Replace Image
                </label>

                <button
                  onClick={() => setImageObjUrl('')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--color-error-bg, #fef2f2)',
                    border: '1px solid var(--color-error, #dc2626)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: 'var(--color-error, #dc2626)'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}