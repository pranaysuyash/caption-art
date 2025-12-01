import React, { useRef, useEffect } from 'react';

interface VideoPreviewModalProps {
  videoBlob: Blob | null;
  onClose: () => void;
  onDiscard: () => void;
}

export function VideoPreviewModal({ videoBlob, onClose, onDiscard }: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      // Create object URL for the blob
      const url = URL.createObjectURL(videoBlob);
      urlRef.current = url;
      videoRef.current.src = url;
      
      // Cleanup
      return () => {
        URL.revokeObjectURL(url);
        urlRef.current = null;
      };
    }
  }, [videoBlob]);

  const handleDownload = () => {
    if (!urlRef.current) return;
    
    const a = document.createElement('a');
    a.href = urlRef.current;
    a.download = `caption-art-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onClose();
  };

  if (!videoBlob) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>Preview Recording</h2>
        
        <div style={{ 
          position: 'relative',
          width: '100%',
          maxHeight: '60vh',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <video 
            ref={videoRef} 
            controls 
            autoPlay 
            loop
            style={{ maxWidth: '100%', maxHeight: '60vh' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button 
            onClick={onDiscard}
            aria-label="Discard recording"
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #444',
              background: 'transparent',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Discard
          </button>
          <button 
            onClick={handleDownload}
            aria-label="Download video recording"
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Download Video
          </button>
        </div>
      </div>
    </div>
  );
}
