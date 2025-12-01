import React, { useState } from 'react'
import { StoryManager, StoryFrame } from '../lib/story/storyManager'
import './StoryMode.css'

interface StoryModeProps {
  initialImage: string
  initialCaption: string
  onClose: () => void
  onExport: (frames: StoryFrame[]) => void
}

export function StoryMode({ initialImage, initialCaption, onClose, onExport }: StoryModeProps) {
  const [frames, setFrames] = useState<StoryFrame[]>([
    {
      id: '1',
      imageUrl: initialImage,
      caption: initialCaption,
      prompt: 'Initial scene',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [styleContext, setStyleContext] = useState('Cinematic, high contrast, 8k resolution')

  const handleGenerateNext = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const lastFrame = frames[frames.length - 1]
      
      // Generate next frame
      const response = await StoryManager.generateNextFrame(
        lastFrame.caption || 'A mysterious scene',
        styleContext
      )

      const newFrame: StoryFrame = {
        id: Date.now().toString(),
        imageUrl: response.nextImageUrl,
        caption: response.nextPrompt, // Using the prompt as the caption for now
        prompt: response.nextPrompt,
      }

      setFrames((prev) => [...prev, newFrame])
    } catch (err) {
      console.error('Failed to generate frame:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate next frame')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="story-mode">
      <div className="story-mode__header">
        <h2>AI Storyboard</h2>
        <div className="story-mode__actions">
          <button className="button button-secondary" onClick={onClose}>
            Close
          </button>
          <button 
            className="button button-primary" 
            onClick={() => onExport(frames)}
            disabled={frames.length < 2}
          >
            Export Video
          </button>
        </div>
      </div>

      <div className="story-mode__content">
        <div className="story-mode__main-view">
          {/* Display the latest frame */}
          <div className="story-mode__preview">
            <img 
              src={frames[frames.length - 1].imageUrl} 
              alt="Current frame" 
              className="story-mode__image"
            />
            <div className="story-mode__caption">
              {frames[frames.length - 1].caption}
            </div>
          </div>

          {/* Controls */}
          <div className="story-mode__controls">
            <div className="story-mode__input-group">
              <label>Style Context</label>
              <input 
                type="text" 
                value={styleContext}
                onChange={(e) => setStyleContext(e.target.value)}
                placeholder="e.g. Cyberpunk, Anime, Oil Painting"
                className="story-mode__input"
              />
            </div>
            
            {error && <div className="story-mode__error">{error}</div>}
            
            <button 
              className="button button-primary story-mode__generate-btn"
              onClick={handleGenerateNext}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Generating Next Scene...
                </>
              ) : (
                'Generate Next Frame ✨'
              )}
            </button>
          </div>
        </div>

        {/* Filmstrip */}
        <div className="story-mode__filmstrip">
          {frames.map((frame, index) => (
            <div key={frame.id} className="story-mode__thumbnail">
              <span className="story-mode__frame-number">{index + 1}</span>
              <img src={frame.imageUrl} alt={`Frame ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
