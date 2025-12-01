# Advanced Text Editing Features

This module provides advanced text editing capabilities for the canvas renderer, including multi-line text, alignment options, custom font loading, and text effects.

## Features

### 1. Multi-line Text Support
- Automatic line break handling (`\n`, `\r\n`, `\r`)
- Configurable line spacing
- Proper bounds calculation for multi-line text

### 2. Text Alignment
- Left alignment
- Center alignment
- Right alignment
- Justify alignment (with word spacing)

### 3. Custom Font Loading
- Support for TTF, OTF, WOFF, and WOFF2 formats
- CSS Font Loading API integration
- Error handling with fallback to system fonts

### 4. Text Effects
- **Outline**: Configurable stroke width (1-10px) and color
- **Gradient Fill**: Linear and radial gradients with multiple color stops
- **Pattern Fill**: Repeating image patterns with adjustable scale
- **Effect Layering**: Proper rendering order (outline → fill)

### 5. Effect Presets
- Save and load effect combinations
- Persistent storage in localStorage
- Easy preset management

## Usage

### Basic Usage with Compositor

```typescript
import { Compositor } from './lib/canvas/compositor';
import type { AdvancedTextLayer } from './lib/canvas/textRenderer';

// Create compositor
const compositor = new Compositor({
  canvas: canvasElement,
  backgroundImage: imageElement,
  maxDimension: 1080,
});

// Render with advanced text features
const textLayer: AdvancedTextLayer = {
  text: 'Hello\nWorld',
  fontFamily: 'Arial',
  fontSize: 48,
  lineSpacing: 1.5,
  alignment: 'center',
  effects: {
    fillColor: '#ffffff',
    outline: {
      enabled: true,
      width: 3,
      color: '#000000',
    },
    gradient: {
      enabled: false,
      type: 'linear',
      colorStops: [],
      angle: 0,
    },
    pattern: {
      enabled: false,
      image: null,
      scale: 1.0,
    },
  },
  transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
};

compositor.renderAdvanced(textLayer);
```

### Using Custom Fonts

```typescript
import { FontManager } from './lib/text';

const fontManager = new FontManager();

// Load a custom font
const result = await fontManager.loadFont(fontFile);

if (result.success && result.font) {
  console.log('Font loaded:', result.font.family);
  
  // Use the font in rendering
  const textLayer: AdvancedTextLayer = {
    text: 'Custom Font Text',
    fontFamily: result.font.family,
    fontSize: 48,
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
  };
  
  compositor.renderAdvanced(textLayer);
} else {
  console.error('Font loading failed:', result.error);
}
```

### Using Gradient Effects

```typescript
const textLayer: AdvancedTextLayer = {
  text: 'Gradient Text',
  fontFamily: 'Arial',
  fontSize: 48,
  effects: {
    fillColor: '#000000', // Fallback color
    outline: { enabled: false, width: 2, color: '#ffffff' },
    gradient: {
      enabled: true,
      type: 'linear',
      colorStops: [
        { color: '#ff0000', position: 0 },
        { color: '#00ff00', position: 0.5 },
        { color: '#0000ff', position: 1 },
      ],
      angle: 45, // 45 degrees
    },
    pattern: { enabled: false, image: null, scale: 1.0 },
  },
  transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
};

compositor.renderAdvanced(textLayer);
```

### Using Pattern Effects

```typescript
// Load pattern image
const patternImage = new Image();
patternImage.src = 'pattern.png';
await new Promise(resolve => patternImage.onload = resolve);

const textLayer: AdvancedTextLayer = {
  text: 'Pattern Text',
  fontFamily: 'Arial',
  fontSize: 48,
  effects: {
    fillColor: '#000000',
    outline: { enabled: false, width: 2, color: '#ffffff' },
    gradient: { enabled: false, type: 'linear', colorStops: [], angle: 0 },
    pattern: {
      enabled: true,
      image: patternImage,
      scale: 0.5, // 50% scale
    },
  },
  transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
};

compositor.renderAdvanced(textLayer);
```

### Managing Effect Presets

```typescript
import { PresetManager } from './lib/text';

// Save a preset
await PresetManager.savePreset('My Cool Effect', textLayer.effects);

// Load a preset
const effects = await PresetManager.loadPreset('My Cool Effect');
if (effects) {
  textLayer.effects = effects;
  compositor.renderAdvanced(textLayer);
}

// Get all preset names
const presetNames = await PresetManager.getPresetNames();
console.log('Available presets:', presetNames);

// Delete a preset
await PresetManager.deletePreset('My Cool Effect');
```

### Direct Rendering (without Compositor)

```typescript
import { AdvancedTextRenderer } from './lib/text';
import type { AdvancedTextConfig } from './lib/text';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const config: AdvancedTextConfig = {
  text: 'Direct Render',
  fontFamily: 'Arial',
  fontSize: 48,
  lineSpacing: 1.2,
  alignment: 'center',
  effects: {
    fillColor: '#ffffff',
    outline: { enabled: false, width: 2, color: '#000000' },
    gradient: { enabled: false, type: 'linear', colorStops: [], angle: 0 },
    pattern: { enabled: false, image: null, scale: 1.0 },
  },
  transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
};

AdvancedTextRenderer.render(ctx, config, canvas.width, canvas.height);
```

## API Reference

### AdvancedTextLayer

```typescript
interface AdvancedTextLayer {
  text: string;                    // Text content (may contain \n for line breaks)
  fontFamily?: string;             // Font family (default: 'Arial, sans-serif')
  fontSize: number;                // Font size in pixels
  lineSpacing?: number;            // Line spacing multiplier (default: 1.2)
  alignment?: TextAlignment;       // Text alignment (default: 'center')
  effects?: TextEffects;           // Text effects configuration
  transform: Transform;            // Position and transform
}
```

### TextEffects

```typescript
interface TextEffects {
  fillColor: string;               // Base fill color
  outline: OutlineEffect;          // Outline configuration
  gradient: GradientEffect;        // Gradient configuration
  pattern: PatternEffect;          // Pattern configuration
}
```

### OutlineEffect

```typescript
interface OutlineEffect {
  enabled: boolean;                // Enable outline
  width: number;                   // Stroke width (1-10px)
  color: string;                   // Stroke color
}
```

### GradientEffect

```typescript
interface GradientEffect {
  enabled: boolean;                // Enable gradient
  type: 'linear' | 'radial';      // Gradient type
  colorStops: ColorStop[];         // Color stops (min 2)
  angle: number;                   // Angle in degrees (0-360)
}

interface ColorStop {
  color: string;                   // Color value
  position: number;                // Position (0-1)
}
```

### PatternEffect

```typescript
interface PatternEffect {
  enabled: boolean;                // Enable pattern
  image: HTMLImageElement | null;  // Pattern image
  scale: number;                   // Scale factor (0.1-2.0)
}
```

## Backward Compatibility

The original `TextRenderer.renderText()` method is still available and works as before. The new advanced features are accessed through `TextRenderer.renderAdvanced()` or `Compositor.renderAdvanced()`.

```typescript
// Old method (still works)
TextRenderer.renderText(ctx, text, style, transform);

// New method (advanced features)
TextRenderer.renderAdvanced(ctx, advancedTextLayer, canvasWidth, canvasHeight);
```
