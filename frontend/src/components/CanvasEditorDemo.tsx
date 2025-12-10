/**
 * CanvasEditorDemo - Demo page with sample images
 * Shows the canvas editor with pre-loaded images
 */

import React, { useState } from 'react';
import { CanvasEditorPage } from './CanvasEditorPage';

// Sample images (you can replace these with actual URLs or local images)
const SAMPLE_IMAGES = [
  {
    id: 'sample-1',
    name: 'Portrait',
    background: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop',
    mask: null, // Will need to be generated
  },
  {
    id: 'sample-2',
    name: 'Landscape',
    background: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    mask: null,
  },
  {
    id: 'sample-3',
    name: 'Product',
    background: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
    mask: null,
  },
];

export function CanvasEditorDemo() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setSelectedImage(null);
    }
  };

  const handleExport = (dataUrl: string) => {
    // Download the exported image
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `canvas-export-${Date.now()}.png`;
    a.click();
  };

  const handleClose = () => {
    setSelectedImage(null);
    setUploadedImage(null);
  };

  // Show editor if image is selected or uploaded
  if (selectedImage || uploadedImage) {
    const backgroundImage = uploadedImage || selectedImage;
    
    return (
      <CanvasEditorPage
        backgroundImage={backgroundImage!}
        initialText="Your Text Here"
        onExport={handleExport}
        onClose={handleClose}
      />
    );
  }

  // Show image selection screen
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg, #f5f5f5)',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-heading, sans-serif)',
          fontSize: '2.5rem',
          fontWeight: 900,
          marginBottom: '1rem',
          color: 'var(--color-text, #000000)',
        }}>
          Canvas Editor Demo
        </h1>
        
        <p style={{
          fontSize: '1.125rem',
          color: 'var(--color-text-secondary, #666666)',
          marginBottom: '2rem',
        }}>
          Choose a sample image or upload your own to start editing
        </p>

        {/* Upload section */}
        <div style={{
          background: 'var(--color-bg-secondary, #ffffff)',
          border: 'var(--border-width-medium, 2px) solid var(--color-border, #000000)',
          boxShadow: 'var(--shadow-offset-md, 4px) var(--shadow-offset-md, 4px) 0 var(--color-border, #000000)',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '1rem',
            color: 'var(--color-text, #000000)',
          }}>
            Upload Your Image
          </h2>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{
              padding: '0.75rem',
              border: 'var(--border-width-medium, 2px) solid var(--color-border, #000000)',
              background: 'var(--color-bg, #f5f5f5)',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Sample images */}
        <div>
          <h2 style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '1rem',
            color: 'var(--color-text, #000000)',
          }}>
            Or Choose a Sample
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}>
            {SAMPLE_IMAGES.map((image) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(image.background)}
                style={{
                  background: 'var(--color-bg-secondary, #ffffff)',
                  border: 'var(--border-width-medium, 2px) solid var(--color-border, #000000)',
                  boxShadow: 'var(--shadow-offset-md, 4px) var(--shadow-offset-md, 4px) 0 var(--color-border, #000000)',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-offset-lg, 6px) var(--shadow-offset-lg, 6px) 0 var(--color-border, #000000)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-offset-md, 4px) var(--shadow-offset-md, 4px) 0 var(--color-border, #000000)';
                }}
              >
                <img
                  src={image.background}
                  alt={image.name}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div style={{
                  padding: '1rem',
                  textAlign: 'left',
                }}>
                  <h3 style={{
                    fontFamily: 'var(--font-heading, sans-serif)',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--color-text, #000000)',
                  }}>
                    {image.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
