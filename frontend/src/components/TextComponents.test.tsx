/**
 * Basic rendering tests for text editing UI components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextAlignmentControls } from './TextAlignmentControls';
import { FontUploader } from './FontUploader';
import { TextEffectsPanel } from './TextEffectsPanel';
import { EffectPresetSelector } from './EffectPresetSelector';
import { FontManager } from '../lib/text/fontLoader';
import { createDefaultEffects } from '../lib/text/textEffects';

describe('TextAlignmentControls', () => {
  it('renders alignment options', () => {
    const onChange = vi.fn();
    render(<TextAlignmentControls alignment="left" onChange={onChange} />);
    
    expect(screen.getByText('Text Alignment')).toBeInTheDocument();
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Center')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
    expect(screen.getByText('Justify')).toBeInTheDocument();
  });
});

describe('FontUploader', () => {
  it('renders upload button', () => {
    const fontManager = new FontManager();
    render(<FontUploader fontManager={fontManager} />);
    
    expect(screen.getByText('Custom Fonts')).toBeInTheDocument();
    expect(screen.getByText('Upload Font')).toBeInTheDocument();
  });
});

describe('TextEffectsPanel', () => {
  it('renders effect tabs', () => {
    const effects = createDefaultEffects();
    const onChange = vi.fn();
    render(<TextEffectsPanel effects={effects} onChange={onChange} />);
    
    expect(screen.getByText('Text Effects')).toBeInTheDocument();
    expect(screen.getByText('outline')).toBeInTheDocument();
    expect(screen.getByText('gradient')).toBeInTheDocument();
    expect(screen.getByText('pattern')).toBeInTheDocument();
  });
});

describe('EffectPresetSelector', () => {
  it('renders save preset button', () => {
    const effects = createDefaultEffects();
    const onPresetLoad = vi.fn();
    render(<EffectPresetSelector currentEffects={effects} onPresetLoad={onPresetLoad} />);
    
    expect(screen.getByText('Effect Presets')).toBeInTheDocument();
    expect(screen.getByText('Save Current Effects')).toBeInTheDocument();
  });
});
