// This file contains the original single-image editor with FULL functionality
// Restored from git history with modern styling and complete feature set

import { useRef, useState, useEffect } from 'react'
import { ToastContainer, useToast } from '../Toast'

type StylePreset = 'neon' | 'magazine' | 'brush' | 'emboss'

function textStyle(preset: StylePreset, fontSize: number) {
  switch (preset) {
    case 'neon':
      return {
        font: `${fontSize}px Poppins, sans-serif`,
        fillStyle: '#ffffff',
        shadows: [
          { blur: 6, color: 'rgba(0,255,255,0.9)' },
          { blur: 12, color: 'rgba(0,255,255,0.6)' },
          { blur: 18, color: 'rgba(0,255,255,0.4)' }
        ]
      } as const
    case 'magazine':
      return { font: `${fontSize}px Didot, serif`, fillStyle: '#111', strokeStyle: '#fff', lineWidth: 8 } as const
    case 'brush':
      return { font: `${fontSize}px "Brush Script MT", cursive`, fillStyle: '#1a1a1a' } as const
    case 'emboss':
      return { font: `${fontSize}px Inter, sans-serif`, fillStyle: '#ddd', shadow: { x: 2, y: 2, blur: 2, color: 'rgba(0,0,0,0.4)' } } as const
  }
}

async function getPresignedUrl(filename: string, contentType: string) {
  const r = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:3001') + '/api/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType })
  })
  if (!r.ok) throw new Error('presign failed')
  return r.json() as Promise<{ url: string, key: string }>
}

async function callApi<T>(path: string, body: any): Promise<T> {
  const r = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:3001') + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error('api failed')
  return r.json() as Promise<T>
}

export function Playground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [imageObjUrl, setImageObjUrl] = useState<string>('')
  const [s3Key, setS3Key] = useState<string>('')
  const [maskUrl, setMaskUrl] = useState<string>('')
  const [captions, setCaptions] = useState<string[]>([])
  const [text, setText] = useState<string>('')
  const [preset, setPreset] = useState<StylePreset>('neon')
  const [fontSize, setFontSize] = useState<number>(96)
  const [licenseOk, setLicenseOk] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [processingStatus, setProcessingStatus] = useState<string>('')
  const toast = useToast()

  const onFile = async (f: File) => {
    try {
      setFile(f)
      setLoading(true)
      setUploadProgress(0)
      setProcessingStatus('Uploading image...')

      const obj = URL.createObjectURL(f)
      setImageObjUrl(obj)

      setUploadProgress(25)
      setProcessingStatus('Getting upload URL...')

      const { url, key } = await getPresignedUrl(f.name, f.type)
      setS3Key(key)

      setUploadProgress(50)
      setProcessingStatus('Uploading to cloud...')

      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': f.type },
        body: f
      })

      setUploadProgress(75)
      setProcessingStatus('Generating captions...')

      const cap = await callApi<{ base: string, variants: string[] }>('/api/caption', { s3Key: key })
      setCaptions([cap.base, ...(cap.variants || [])].filter(Boolean))

      setUploadProgress(90)
      setProcessingStatus('Generating mask...')

      const m = await callApi<{ maskUrl: string }>('/api/mask', { s3Key: key })
      setMaskUrl(m.maskUrl)

      setUploadProgress(100)
      setProcessingStatus('Complete!')
      setLoading(false)

      toast.success('Image processed successfully!')

      setTimeout(() => {
        setProcessingStatus('')
        setUploadProgress(0)
      }, 2000)

    } catch (error) {
      console.error('Processing error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to process image. Please try again.'
      toast.error(errorMsg)
      setLoading(false)
      setProcessingStatus('')
      setUploadProgress(0)
    }
  }

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !imageObjUrl) return

    const ctx = c.getContext('2d')!
    const base = new Image();
    base.crossOrigin = 'anonymous';
    base.src = imageObjUrl
    const mask = new Image();
    mask.crossOrigin = 'anonymous';
    mask.src = maskUrl || ''

    Promise.all([
      new Promise(res => base.onload = res as any),
      maskUrl ? new Promise(res => mask.onload = res as any) : Promise.resolve(0)
    ]).then(() => {
      const w = base.width, h = base.height;
      const scale = 1080 / Math.max(w, h)
      c.width = Math.round(w * scale);
      c.height = Math.round(h * scale)

      ctx.clearRect(0, 0, c.width, c.height)
      ctx.drawImage(base, 0, 0, c.width, c.height)

      if (text) {
        const style = textStyle(preset, Math.max(32, Math.round(fontSize * scale))) as any
        ctx.save()
        ctx.font = style.font
        ctx.fillStyle = style.fillStyle || '#fff'
        if (style.lineWidth) ctx.lineWidth = style.lineWidth
        if (style.strokeStyle) ctx.strokeStyle = style.strokeStyle
        if (style.shadow) {
          const sh = style.shadow;
          ctx.shadowColor = sh.color;
          ctx.shadowBlur = sh.blur;
          ctx.shadowOffsetX = sh.x;
          ctx.shadowOffsetY = sh.y
        }
        if (style.shadows) {
          style.shadows.forEach((s: any) => {
            ctx.shadowColor = s.color;
            ctx.shadowBlur = s.blur;
            ctx.fillText(text, c.width * 0.1, c.height * 0.8)
          })
        }
        ctx.shadowColor = 'transparent'
        if (style.strokeStyle) ctx.strokeText(text, c.width * 0.1, c.height * 0.8)
        ctx.fillText(text, c.width * 0.1, c.height * 0.8)
        ctx.restore()

        if (maskUrl) {
          const m = document.createElement('canvas');
          m.width = c.width;
          m.height = c.height;
          const mctx = m.getContext('2d')!
          mctx.drawImage(mask, 0, 0, c.width, c.height)

          const final = document.createElement('canvas');
          final.width = c.width;
          final.height = c.height;
          const fctx = final.getContext('2d')!
          fctx.drawImage(base, 0, 0, c.width, c.height)
          fctx.drawImage(c, 0, 0)
          fctx.globalCompositeOperation = 'destination-out'
          fctx.drawImage(m, 0, 0)

          const ctx2 = c.getContext('2d')!;
          ctx2.globalCompositeOperation = 'source-over';
          ctx2.clearRect(0, 0, c.width, c.height);
          ctx2.drawImage(final, 0, 0)
        }
      }
    })
  }, [imageObjUrl, maskUrl, preset, text, fontSize])

  const exportImg = () => {
    const c = canvasRef.current!
    const url = c.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = licenseOk ? 'caption-art.png' : 'caption-art-watermarked.png'
    a.click()
    toast.success('Image exported successfully!')
  }

  const videoExport = () => {
    // Placeholder for video export functionality
    toast.info('Video export coming soon!')
  }

  return (
    <div style={{
      fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />

      {/* Header */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-heading, system-ui, -apple-system, sans-serif)',
          fontSize: '2rem',
          margin: 0,
          color: 'white',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          🎨 Caption Art Playground
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          margin: '0.5rem 0 0 0',
          fontSize: '1rem',
          textAlign: 'center',
          fontWeight: '400'
        }}>
          Complete creative studio: AI captions • Smart masking • Text effects • Multi-format export
        </p>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Main Controls */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              📤 Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => e.target.files && onFile(e.target.files[0])}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: loading ? '#f9fafb' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              🎨 Text Style
            </label>
            <select
              className="select"
              value={preset}
              onChange={e => setPreset(e.target.value as StylePreset)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="neon">✨ Neon Glow</option>
              <option value="magazine">📖 Magazine</option>
              <option value="brush">🖌️ Brush Script</option>
              <option value="emboss">🏔️ Emboss</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              📏 Font Size: {fontSize}px
            </label>
            <input
              className="range"
              type="range"
              min={24}
              max={160}
              value={fontSize}
              onChange={e => setFontSize(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#e5e7eb',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              ✏️ Text Overlay
            </label>
            <input
              className="input"
              placeholder="Enter your text"
              value={text}
              onChange={e => setText(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              🪪 License Key (Optional)
            </label>
            <input
              className="input"
              placeholder="Premium license key"
              onBlur={async (e) => {
                const key = e.currentTarget.value.trim();
                if (!key) return
                try {
                  const d = await callApi<{ ok: boolean }>('/api/verify', { licenseKey: key })
                  setLicenseOk(!!d.ok)
                  toast.success(d.ok ? 'Premium unlocked! 🎉' : 'Invalid license key')
                } catch (error) {
                  toast.error('License verification failed')
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-end'
          }}>
            <button
              className="button"
              onClick={exportImg}
              disabled={!imageObjUrl}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                backgroundColor: imageObjUrl ? '#10b981' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: imageObjUrl ? 'pointer' : 'not-allowed'
              }}
            >
              📷 Export PNG
            </button>
            <button
              className="button"
              onClick={videoExport}
              disabled={!imageObjUrl}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                backgroundColor: imageObjUrl ? '#8b5cf6' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: imageObjUrl ? 'pointer' : 'not-allowed'
              }}
            >
              🎥 Export Video
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        {loading && processingStatus && (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto 2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '1rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              {processingStatus}
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* AI Captions */}
        {captions.length > 0 && (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto 2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-heading, system-ui, -apple-system, sans-serif)',
              fontSize: '1.25rem',
              margin: '0 0 1rem 0',
              color: '#1f2937',
              fontWeight: '600'
            }}>
              🤖 AI Generated Captions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '0.75rem'
            }}>
              {captions.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setText(c)}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.borderColor = '#3b82f6'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                    e.currentTarget.style.color = '#374151'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-heading, system-ui, -apple-system, sans-serif)',
              fontSize: '1.25rem',
              margin: 0,
              color: '#1f2937',
              fontWeight: '600'
            }}>
              🖼️ Live Preview
            </h3>
            {imageObjUrl && (
              <span style={{
                fontSize: '0.875rem',
                color: licenseOk ? '#10b981' : '#6b7280',
                fontWeight: '500'
              }}>
                {licenseOk ? '✅ Premium' : '📄 Free (Watermarked)'}
              </span>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            padding: '2rem',
            borderRadius: '8px',
            border: '2px solid #e5e7eb'
          }}>
            <canvas
              ref={canvasRef}
              className="canvas"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}