import React, { useRef, useState, useEffect } from 'react'

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
  const r = await fetch(import.meta.env.VITE_API_BASE + '/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType })
  })
  if (!r.ok) throw new Error('presign failed')
  return r.json() as Promise<{ url: string, key: string }>
}

async function callApi<T>(path: string, body: any): Promise<T> {
  const r = await fetch(import.meta.env.VITE_API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error('api failed')
  return r.json() as Promise<T>
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [imageObjUrl, setImageObjUrl] = useState<string>('')
  const [s3Key, setS3Key] = useState<string>('')
  const [maskUrl, setMaskUrl] = useState<string>('')
  const [captions, setCaptions] = useState<string[]>([])
  const [text, setText] = useState<string>('')
  const [preset, setPreset] = useState<StylePreset>('neon')
  const [fontSize, setFontSize] = useState<number>(96)
  const [licenseOk, setLicenseOk] = useState<boolean>(true) // Always true for local testing

  const onFile = async (f: File) => {
    setFile(f)
    const obj = URL.createObjectURL(f)
    setImageObjUrl(obj)

    const { url, key } = await getPresignedUrl(f.name, f.type)
    await fetch(url, { method: 'PUT', headers: { 'Content-Type': f.type }, body: f })
    setS3Key(key)

    const cap = await callApi<{ base: string, variants: string[] }>('/caption', { s3Key: key })
    setCaptions([cap.base, ...(cap.variants || [])].filter(Boolean))

    const m = await callApi<{ maskPngUrl: string }>('/mask', { s3Key: key })
    setMaskUrl(m.maskPngUrl)
  }

  useEffect(() => {
    const c = canvasRef.current; if (!c || !imageObjUrl) return
    const ctx = c.getContext('2d')!
    const base = new Image(); base.crossOrigin = 'anonymous'; base.src = imageObjUrl
    const mask = new Image(); mask.crossOrigin = 'anonymous'; mask.src = maskUrl || ''

    Promise.all([
      new Promise(res => base.onload = res as any),
      maskUrl ? new Promise(res => mask.onload = res as any) : Promise.resolve(0)
    ]).then(() => {
      const w = base.width, h = base.height; const scale = 1080 / Math.max(w, h)
      c.width = Math.round(w * scale); c.height = Math.round(h * scale)

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
          const sh = style.shadow; ctx.shadowColor = sh.color; ctx.shadowBlur = sh.blur; ctx.shadowOffsetX = sh.x; ctx.shadowOffsetY = sh.y
        }
        if (style.shadows) {
          style.shadows.forEach((s: any) => { ctx.shadowColor = s.color; ctx.shadowBlur = s.blur; ctx.fillText(text, c.width * 0.1, c.height * 0.8) })
        }
        ctx.shadowColor = 'transparent'
        if (style.strokeStyle) ctx.strokeText(text, c.width * 0.1, c.height * 0.8)
        ctx.fillText(text, c.width * 0.1, c.height * 0.8)
        ctx.restore()

        if (maskUrl) {
          const m = document.createElement('canvas'); m.width = c.width; m.height = c.height; const mctx = m.getContext('2d')!
          mctx.drawImage(mask, 0, 0, c.width, c.height)

          const final = document.createElement('canvas'); final.width = c.width; final.height = c.height; const fctx = final.getContext('2d')!
          fctx.drawImage(base, 0, 0, c.width, c.height)
          fctx.drawImage(c, 0, 0)
          fctx.globalCompositeOperation = 'destination-out'
          fctx.drawImage(m, 0, 0)

          const ctx2 = c.getContext('2d')!; ctx2.globalCompositeOperation = 'source-over'; ctx2.clearRect(0, 0, c.width, c.height); ctx2.drawImage(final, 0, 0)
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
  }

  return (
    <div className="container">
      <h1>Contextual Captioner + Text Art</h1>
      <div className="row" style={{ marginTop: 12 }}>
        <input type="file" accept="image/*" onChange={e => e.target.files && onFile(e.target.files[0])} />
        <select className="select" value={preset} onChange={e => setPreset(e.target.value as StylePreset)}>
          <option value="neon">Neon</option>
          <option value="magazine">Magazine</option>
          <option value="brush">Brush</option>
          <option value="emboss">Emboss</option>
        </select>
        <input className="range" type="range" min={24} max={160} value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} />
        <input className="input" placeholder="Enter your text" value={text} onChange={e => setText(e.target.value)} />
        {/* License input removed for local testing */}
        <button className="button" onClick={exportImg}>Export</button>
      </div>

      {captions.length > 0 && (
        <div className="caption-grid" style={{ marginTop: 12 }}>
          {captions.map((c, i) => (
            <button key={i} onClick={() => setText(c)}>{c}</button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <canvas ref={canvasRef} className="canvas" />
      </div>

      <div style={{ marginTop: 12 }}>
        <span className="badge">Local Testing Mode - No Restrictions</span>
      </div>
    </div>
  )
}
