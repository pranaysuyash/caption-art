# Text Editing UI Components

This document describes the four new UI components for advanced text editing features.

## Components

### 1. TextAlignmentControls

Provides buttons for selecting text alignment (left, center, right, justify).

**Usage:**
```tsx
import { TextAlignmentControls } from './components';
import type { TextAlignment } from './lib/text/alignmentManager';

function MyComponent() {
  const [alignment, setAlignment] = useState<TextAlignment>('left');
  
  return (
    <TextAlignmentControls
      alignment={alignment}
      onChange={setAlignment}
      disabled={false}
    />
  );
}
```

**Props:**
- `alignment`: Current alignment ('left' | 'center' | 'right' | 'justify')
- `onChange`: Callback when alignment changes
- `disabled?`: Disable all controls (optional)

---

### 2. FontUploader

Allows users to upload custom fonts (TTF, OTF, WOFF, WOFF2) and select from system fonts.

**Usage:**
```tsx
import { FontUploader } from './components';
import { FontManager } from './lib/text/fontLoader';

function MyComponent() {
  const [fontManager] = useState(() => new FontManager());
  const [selectedFont, setSelectedFont] = useState('Arial');
  
  return (
    <FontUploader
      fontManager={fontManager}
      selectedFont={selectedFont}
      onFontSelect={setSelectedFont}
      onFontLoaded={(font) => console.log('Font loaded:', font.name)}
      onError={(error) => console.error('Font error:', error)}
      disabled={false}
    />
  );
}
```

**Props:**
- `fontManager`: FontManager instance
- `onFontLoaded?`: Callback when font loads successfully
- `onError?`: Callback when font loading fails
- `selectedFont?`: Currently selected font family
- `onFontSelect?`: Callback when font selection changes
- `disabled?`: Disable all controls (optional)

---

### 3. TextEffectsPanel

Provides controls for configuring text effects (outline, gradient, pattern).

**Usage:**
```tsx
import { TextEffectsPanel } from './components';
import { createDefaultEffects } from './lib/text/textEffects';
import type { TextEffects } from './lib/text/textEffects';

function MyComponent() {
  const [effects, setEffects] = useState<TextEffects>(createDefaultEffects());
  
  return (
    <TextEffectsPanel
      effects={effects}
      onChange={setEffects}
      disabled={false}
    />
  );
}
```

**Props:**
- `effects`: Current text effects configuration
- `onChange`: Callback when effects change
- `disabled?`: Disable all controls (optional)

**Features:**
- **Outline Tab**: Enable/disable outline, adjust width (1-10px), select color
- **Gradient Tab**: Enable/disable gradient, choose linear/radial, adjust angle, manage color stops
- **Pattern Tab**: Enable/disable pattern, upload pattern image, adjust scale (10%-200%)

---

### 4. EffectPresetSelector

Manages saving, loading, and deleting text effect presets.

**Usage:**
```tsx
import { EffectPresetSelector } from './components';
import type { TextEffects } from './lib/text/textEffects';

function MyComponent() {
  const [effects, setEffects] = useState<TextEffects>(createDefaultEffects());
  
  return (
    <EffectPresetSelector
      currentEffects={effects}
      onPresetLoad={setEffects}
      onSuccess={(msg) => console.log(msg)}
      onError={(err) => console.error(err)}
      disabled={false}
    />
  );
}
```

**Props:**
- `currentEffects`: Current text effects configuration
- `onPresetLoad`: Callback when a preset is loaded
- `onSuccess?`: Callback when operation succeeds
- `onError?`: Callback when operation fails
- `disabled?`: Disable all controls (optional)

**Features:**
- Save current effects as a named preset
- Load saved presets
- Delete presets
- Presets are persisted to localStorage

---

## Integration Example

Here's a complete example showing all components working together:

```tsx
import { useState } from 'react';
import {
  TextAlignmentControls,
  FontUploader,
  TextEffectsPanel,
  EffectPresetSelector
} from './components';
import { FontManager } from './lib/text/fontLoader';
import { createDefaultEffects } from './lib/text/textEffects';
import type { TextAlignment } from './lib/text/alignmentManager';
import type { TextEffects } from './lib/text/textEffects';

function TextEditor() {
  const [alignment, setAlignment] = useState<TextAlignment>('left');
  const [fontManager] = useState(() => new FontManager());
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [effects, setEffects] = useState<TextEffects>(createDefaultEffects());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <TextAlignmentControls
        alignment={alignment}
        onChange={setAlignment}
      />
      
      <FontUploader
        fontManager={fontManager}
        selectedFont={selectedFont}
        onFontSelect={setSelectedFont}
        onFontLoaded={(font) => console.log('Loaded:', font.name)}
        onError={(err) => alert(err)}
      />
      
      <TextEffectsPanel
        effects={effects}
        onChange={setEffects}
      />
      
      <EffectPresetSelector
        currentEffects={effects}
        onPresetLoad={setEffects}
        onSuccess={(msg) => console.log(msg)}
        onError={(err) => alert(err)}
      />
    </div>
  );
}
```

## Styling

All components use CSS variables from the design system:
- `--color-bg`, `--color-bg-secondary`
- `--color-text`, `--color-text-secondary`
- `--color-border`
- `--color-accent-turquoise`, `--color-accent-coral`
- `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`
- `--font-heading`, `--font-body`
- `--font-size-xs`, `--font-size-sm`, `--font-size-md`, `--font-size-lg`
- `--border-width-thin`, `--border-width-medium`
- `--shadow-offset-sm`, `--shadow-offset-md`
- `--transition-base`, `--ease-smooth`

Components follow the neo-brutalism design style with bold borders and shadows.
