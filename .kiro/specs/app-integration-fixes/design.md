# Design Document

## Overview

This design addresses the integration issues in App.tsx by properly importing dependencies, initializing state management, fixing type mismatches, and ensuring the history system integrates correctly with the React component lifecycle. The solution maintains the existing architecture while fixing compilation and runtime errors.

## Architecture

The fix follows the existing React component architecture:

```
App.tsx (Main Component)
├── Imports
│   ├── React hooks (useState, useRef, useEffect)
│   ├── HistoryManager (from lib/history)
│   ├── CanvasState type (from lib/history/types)
│   └── Toolbar component (from components)
├── State Management
│   ├── historyManagerRef (useRef<HistoryManager>)
│   ├── canUndo/canRedo (useState<boolean>)
│   └── Existing state variables
├── History Integration
│   ├── saveState() - Saves current state to history
│   ├── handleUndo() - Reverts to previous state
│   └── handleRedo() - Reapplies undone state
└── Effects
    ├── Initialize history manager on mount
    ├── Auto-save state on changes (debounced)
    └── Update undo/redo availability
```

## Components and Interfaces

### Import Additions

```typescript
import { useRef } from 'react' // Add to existing React imports
import { HistoryManager } from './lib/history/historyManager'
import { CanvasState } from './lib/history/types'
import { Toolbar } from './components/Toolbar'
```

### State Variables

```typescript
// History management refs and state
const historyManagerRef = useRef<HistoryManager | null>(null)
const [canUndo, setCanUndo] = useState<boolean>(false)
const [canRedo, setCanRedo] = useState<boolean>(false)
const [captions, setCaptions] = useState<string[]>([]) // Track generated captions
```

### History Integration Functions

```typescript
// Save current state to history
const saveState = (action: string) => {
  if (!historyManagerRef.current) return
  
  const state: CanvasState = {
    imageObjUrl: imageObjUrl || '',
    maskUrl: maskResult?.maskUrl || '',
    text,
    preset,
    fontSize,
    captions
  }
  
  historyManagerRef.current.saveState(action, state)
  setCanUndo(historyManagerRef.current.canUndo())
  setCanRedo(historyManagerRef.current.canRedo())
}

// Undo to previous state
const handleUndo = () => {
  if (!historyManagerRef.current) return
  
  const previousState = historyManagerRef.current.undo()
  if (previousState) {
    restoreState(previousState)
  }
  setCanUndo(historyManagerRef.current.canUndo())
  setCanRedo(historyManagerRef.current.canRedo())
}

// Redo to next state
const handleRedo = () => {
  if (!historyManagerRef.current) return
  
  const nextState = historyManagerRef.current.redo()
  if (nextState) {
    restoreState(nextState)
  }
  setCanUndo(historyManagerRef.current.canUndo())
  setCanRedo(historyManagerRef.current.canRedo())
}

// Restore state from history
const restoreState = (state: CanvasState) => {
  setImageObjUrl(state.imageObjUrl)
  setText(state.text)
  setPreset(state.preset)
  setFontSize(state.fontSize)
  setCaptions(state.captions)
  
  // Restore mask if URL changed
  if (state.maskUrl && state.maskUrl !== maskResult?.maskUrl) {
    // Trigger mask reload
  }
}
```

## Data Models

### CanvasState Structure

The CanvasState type is already defined in `lib/history/types.ts`:

```typescript
interface CanvasState {
  imageObjUrl: string
  maskUrl: string
  text: string
  preset: StylePreset
  fontSize: number
  captions: string[]
}
```

All state saving and restoration must conform to this structure.

### MaskResult Quality Values

The MaskResult type expects quality to be one of: `"high" | "medium" | "low"`

Current code incorrectly uses `"good"` which must be changed to `"high"`.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Undo/redo availability tracking

*For any* history operation (save, undo, redo), the canUndo and canRedo state variables should accurately reflect the history manager's canUndo() and canRedo() return values
**Validates: Requirements 2.5**

### Property 2: State structure completeness

*For any* saved canvas state, all required CanvasState properties (imageObjUrl, maskUrl, text, preset, fontSize, captions) should be present with correct types
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 3: State restoration completeness

*For any* undo or redo operation that returns a state, all CanvasState properties (imageObjUrl, maskUrl, text, preset, fontSize, captions) should be restored to their values from that history entry
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**

### Property 4: Mask quality type validity

*For any* mask result creation, if a quality value is provided, it should be one of: "high", "medium", or "low"
**Validates: Requirements 5.2**

## Error Handling

### Missing History Manager

If historyManagerRef.current is null when history operations are called, the functions should return early without throwing errors. This prevents crashes during component initialization.

### Invalid State Restoration

If a history entry contains invalid or incomplete state data, the restoration should be skipped and an error logged to the console. The current state should remain unchanged.

### Type Mismatches

TypeScript compilation should catch all type mismatches at build time. Runtime type checking is not required since TypeScript provides compile-time guarantees.

## Testing Strategy

### Unit Tests

- Test saveState() creates correct CanvasState structure
- Test handleUndo() restores previous state correctly
- Test handleRedo() restores next state correctly
- Test canUndo/canRedo state updates after operations
- Test restoreState() applies all properties
- Test mask quality type validation

### Integration Tests

- Test full undo/redo cycle with real state changes
- Test history manager initialization on component mount
- Test debounced state saving on user interactions
- Test state restoration triggers canvas re-render

### Property-Based Tests

Property-based testing will use **fast-check** library for TypeScript/JavaScript. Each property test should run a minimum of 100 iterations.

- Property 1: Test with random history manager configurations
- Property 2: Test with randomly generated CanvasState objects
- Property 3: Test with random sequences of history operations
- Property 4: Test with random state values for restoration
- Property 5: Test mask quality with random string inputs (should only accept valid values)

Each property-based test must be tagged with: `**Feature: app-integration-fixes, Property {number}: {property_text}**`
