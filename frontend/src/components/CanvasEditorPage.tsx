/**
 * CanvasEditorPage - Complete canvas editing experience
 * Integrates CanvasEditor, MaskingModeSelector, and ProfessionalTextEditor
 * Requirements: 7.1-7.8, 8.1-8.8
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CanvasEditor } from './CanvasEditor';
import { MaskingModeSelector } from './MaskingModeSelector';
import { ProfessionalTextEditor } from './ProfessionalTextEditor';
import { useTextStyle } from '../hooks/useTextStyle';
import { Compositor } from '../lib/canvas/compositor';
import type { MaskingMode } from '../lib/masking/MaskingEngine';
import type { TextLayer } from '../lib/canvas/types';
import type { TextStyle } from './ProfessionalTextEditor';
import './CanvasEditorPage.css';

export interface CanvasEditorPageProps {
  /** Background image URL or File */
  backgroundImage?: string | File;
  /** Mask image URL or File */
  maskImage?: string | File;
  /** Initial text */
  initialText?: string;
  /** Callback when export is requested */
  onExport?: (dataUrl: string) => void;
  /** Callback when close is requested */
  onClose?: () => void;
}

/**
 * CanvasEditorPage component - full-featured canvas editor
 */
export function CanvasEditorPage({
  backgroundImage,
  maskImage,
  initialText = 'Your Text Here',
  onExport,
  onClose,
}: CanvasEditorPageProps) {
  // State
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [maskImg, setMaskImg] = useState<HTMLImageElement | null>(null);
  const [text, setText] = useState(initialText);
  const [maskingMode, setMaskingMode] = useState<MaskingMode>('full-behind');
  const [compositor, setCompositor] = useState<Compositor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Text style management
  const textStyle = useTextStyle();
  
  // Canvas refs for preview generation
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load images
  useEffect(() => {
    if (!backgroundImage) return;

    setLoading(true);
    setError(null);

    const loadImage = (src: string | File): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        
        if (typeof src === 'string') {
          img.src = src;
        } else {
          const url = URL.createObjectURL(src);
          img.src = url;
        }
      });
    };

    Promise.all([
      loadImage(backgroundImage),
      maskImage ? loadImage(maskImage) : Promise.resolve(null),
    ])
      .then(([bg, mask]) => {
        setBgImage(bg);
        setMaskImg(mask);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [backgroundImage, maskImage]);

  // Update compositor when masking mode changes
  useEffect(() => {
    if (compositor) {
      compositor.setMaskingMode(maskingMode);
      // Re-render with current text
      renderText();
    }
  }, [maskingMode, compositor]);

  // Render text with current style
  const renderText = useCallback(() => {
    if (!compositor) return;

    const textLayer: TextLayer = {
      text,
      preset: 'neon', // Default preset
      fontSize: textStyle.style.fontSize,
      transform: {
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: textStyle.style.rotation,
      },
    };

    try {
      compositor.render(textLayer);
    } catch (err) {
      console.error('Failed to render text:', err);
      setError('Failed to render text');
    }
  }, [compositor, text, textStyle.style]);

  // Update text rendering when text or style changes
  useEffect(() => {
    renderText();
  }, [renderText]);

  // Handle compositor ready
  const handleCompositorReady = useCallback((comp: Compositor) => {
    setCompositor(comp);
    comp.setMaskingMode(maskingMode);
  }, [maskingMode]);

  // Handle masking mode change
  const handleMaskingModeChange = useCallback((mode: MaskingMode) => {
    setMaskingMode(mode);
  }, []);

  // Handle text style change
  const handleTextStyleChange = useCallback((newStyle: TextStyle) => {
    textStyle.updateStyle(newStyle);
  }, [textStyle]);

  // Handle export
  const handleExport = useCallback(() => {
    if (!compositor) return;

    const dataUrl = compositor.getDataURL('png');
    if (onExport) {
      onExport(dataUrl);
    } else {
      // Default: download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `canvas-export-${Date.now()}.png`;
      a.click();
    }
  }, [compositor, onExport]);

  // Loading state
  if (loading) {
    return (
      <div className="canvas-editor-page">
        <div className="canvas-editor-loading">
          <div className="canvas-editor-spinner" />
          <p>Loading images...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="canvas-editor-page">
        <div className="canvas-editor-error">
          <h2>Error</h2>
          <p>{error}</p>
          {onClose && (
            <button onClick={onClose} className="canvas-editor-button">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  // No image state
  if (!bgImage) {
    return (
      <div className="canvas-editor-page">
        <div className="canvas-editor-empty">
          <h2>No Image</h2>
          <p>Please provide a background image to edit.</p>
          {onClose && (
            <button onClick={onClose} className="canvas-editor-button">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-editor-page">
      {/* Header */}
      <div className="canvas-editor-header">
        <h1 className="canvas-editor-title">Canvas Editor</h1>
        <div className="canvas-editor-actions">
          <button
            onClick={handleExport}
            className="canvas-editor-button canvas-editor-button--primary"
            disabled={!compositor}
          >
            Export
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="canvas-editor-button canvas-editor-button--secondary"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="canvas-editor-content">
        {/* Left panel - Canvas */}
        <div className="canvas-editor-canvas-panel">
          <div className="canvas-editor-canvas-container">
            <CanvasEditor
              backgroundImage={bgImage}
              maskImage={maskImg}
              textLayer={{
                text,
                preset: 'neon',
                fontSize: textStyle.style.fontSize,
                transform: {
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  rotation: textStyle.style.rotation,
                },
              }}
              onCompositorReady={handleCompositorReady}
              onError={(err) => setError(err.message)}
            />
          </div>

          {/* Text input */}
          <div className="canvas-editor-text-input">
            <label htmlFor="canvas-text">Text</label>
            <input
              id="canvas-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text..."
              className="canvas-editor-input"
            />
          </div>

          {/* Masking mode selector */}
          {maskImg && (
            <div className="canvas-editor-masking-section">
              <MaskingModeSelector
                selectedMode={maskingMode}
                onModeChange={handleMaskingModeChange}
                textCanvas={textCanvasRef.current || undefined}
                maskCanvas={maskCanvasRef.current || undefined}
                showPreviews={true}
              />
            </div>
          )}
        </div>

        {/* Right panel - Text editor */}
        <div className="canvas-editor-text-panel">
          <ProfessionalTextEditor
            style={textStyle.style}
            onChange={handleTextStyleChange}
            availableFonts={[
              'Arial',
              'Helvetica',
              'Georgia',
              'Times New Roman',
              'Courier New',
              'Verdana',
              'Impact',
              'Comic Sans MS',
            ]}
            onSavePreset={(name) => {
              textStyle.savePreset(name);
            }}
          />
        </div>
      </div>
    </div>
  );
}
