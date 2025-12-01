/**
 * TransformControls - UI controls for text position, scale, and rotation
 * Provides sliders with neo-brutalism styling
 */

import { useRef, useEffect, useCallback } from 'react';
import type { Transform } from '../lib/canvas/types';
import { rafThrottle } from '../lib/canvas/performanceUtils';

export interface TransformControlsProps {
  /** Current transform values */
  transform: Transform;
  /** Callback when transform changes */
  onChange: (transform: Transform) => void;
}

/**
 * TransformControls component - provides UI for manipulating text transforms
 * Uses requestAnimationFrame throttling for smooth 60fps updates
 */
export function TransformControls({ transform, onChange }: TransformControlsProps) {
  // Create throttled onChange handler using RAF
  const throttledOnChangeRef = useRef(rafThrottle(onChange));

  // Update the throttled function when onChange changes
  useEffect(() => {
    throttledOnChangeRef.current = rafThrottle(onChange);
  }, [onChange]);

  const handlePositionXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const x = parseFloat(e.target.value);
    throttledOnChangeRef.current({ ...transform, x });
  }, [transform]);

  const handlePositionYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const y = parseFloat(e.target.value);
    throttledOnChangeRef.current({ ...transform, y });
  }, [transform]);

  const handleScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = parseFloat(e.target.value);
    throttledOnChangeRef.current({ ...transform, scale });
  }, [transform]);

  const handleRotationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rotation = parseFloat(e.target.value);
    throttledOnChangeRef.current({ ...transform, rotation });
  }, [transform]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)',
        padding: 'var(--spacing-xl)',
        background: 'var(--color-bg)',
        border: 'var(--border-width-medium) solid var(--color-border)',
        boxShadow: 'var(--shadow-offset-md) var(--shadow-offset-md) 0 var(--color-border)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--font-size-lg)',
          fontWeight: 700,
          margin: 0,
          color: 'var(--color-text)',
        }}
      >
        Transform Controls
      </h3>

      {/* Position X Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <label
          htmlFor="position-x"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          Position X: {(transform.x * 100).toFixed(0)}%
        </label>
        <input
          id="position-x"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={transform.x}
          onChange={handlePositionXChange}
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--color-bg-secondary)',
            border: 'var(--border-width-thin) solid var(--color-border)',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Position Y Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <label
          htmlFor="position-y"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          Position Y: {(transform.y * 100).toFixed(0)}%
        </label>
        <input
          id="position-y"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={transform.y}
          onChange={handlePositionYChange}
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--color-bg-secondary)',
            border: 'var(--border-width-thin) solid var(--color-border)',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Scale Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <label
          htmlFor="scale"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          Scale: {transform.scale.toFixed(2)}x
        </label>
        <input
          id="scale"
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={transform.scale}
          onChange={handleScaleChange}
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--color-bg-secondary)',
            border: 'var(--border-width-thin) solid var(--color-border)',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Rotation Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <label
          htmlFor="rotation"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          Rotation: {transform.rotation.toFixed(0)}°
        </label>
        <input
          id="rotation"
          type="range"
          min="0"
          max="360"
          step="1"
          value={transform.rotation}
          onChange={handleRotationChange}
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--color-bg-secondary)',
            border: 'var(--border-width-thin) solid var(--color-border)',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}
