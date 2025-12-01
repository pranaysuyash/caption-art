/**
 * CanvasEditor - Main canvas component for the Canvas Text Compositing Engine
 * Renders the canvas element and manages the compositor lifecycle
 */

import { useEffect, useRef } from 'react';
import { Compositor } from '../lib/canvas/compositor';
import { isImageLoaded } from '../lib/canvas/imageLoader';
import type { TextLayer } from '../lib/canvas/types';

export interface CanvasEditorProps {
  /** Background image element */
  backgroundImage: HTMLImageElement | null;
  /** Optional mask image for text-behind effect */
  maskImage?: HTMLImageElement | null;
  /** Text layer configuration */
  textLayer: TextLayer;
  /** Maximum dimension for canvas scaling (default: 1080px) */
  maxDimension?: number;
  /** Callback when compositor is initialized */
  onCompositorReady?: (compositor: Compositor) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * CanvasEditor component - renders and manages the canvas compositing engine
 */
export function CanvasEditor({
  backgroundImage,
  maskImage,
  textLayer,
  maxDimension = 1080,
  onCompositorReady,
  onError,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compositorRef = useRef<Compositor | null>(null);

  // Initialize compositor when canvas and background image are ready
  useEffect(() => {
    if (!canvasRef.current || !backgroundImage) {
      return;
    }

    try {
      // Validate background image is loaded
      if (!isImageLoaded(backgroundImage)) {
        throw new Error('Background image is not loaded or is invalid');
      }
      
      // Validate mask image if provided
      if (maskImage && !isImageLoaded(maskImage)) {
        throw new Error('Mask image is not loaded or is invalid');
      }

      // Create new compositor instance
      const compositor = new Compositor({
        canvas: canvasRef.current,
        backgroundImage,
        maskImage: maskImage || undefined,
        maxDimension,
      });

      compositorRef.current = compositor;

      // Notify parent component
      if (onCompositorReady) {
        onCompositorReady(compositor);
      }

      // Initial render
      compositor.render(textLayer);
    } catch (error) {
      console.error('Failed to initialize compositor:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    }

    // Cleanup on unmount - Requirements: 8.5
    return () => {
      if (compositorRef.current) {
        // Clear canvas and cached layers
        compositorRef.current.clear();
        compositorRef.current.clearCache();
        compositorRef.current = null;
      }
    };
  }, [backgroundImage, maskImage, maxDimension, onCompositorReady, onError]);

  // Re-render when text layer changes
  useEffect(() => {
    if (compositorRef.current && backgroundImage) {
      try {
        compositorRef.current.render(textLayer);
      } catch (error) {
        console.error('Failed to render text layer:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    }
  }, [textLayer, backgroundImage, onError]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        border: `var(--border-width-medium) solid var(--color-border)`,
        boxShadow: `var(--shadow-offset-md) var(--shadow-offset-md) 0 var(--color-border)`,
      }}
    />
  );
}
