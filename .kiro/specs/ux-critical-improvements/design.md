# Design Document

## Overview

This design addresses the top 10 UX priorities for Caption Art by implementing robust error handling, streamlined workflows, enhanced user guidance, and advanced creative features. The solution focuses on removing friction from the core user journey (upload → generate captions → apply text → export) while adding professional-grade text-mask interaction modes and polished micro-interactions throughout the interface.

The design maintains the existing React component architecture while introducing new UI components, state management patterns, and rendering algorithms to support the enhanced functionality.

## Architecture

The UX improvements follow a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Onboarding  │  │ Error Toast  │  │  Progress    │  │
│  │  Overlay     │  │  System      │  │  Indicators  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Caption     │  │  Text Editor │  │  Masking     │  │
│  │  Selector    │  │  Panel       │  │  Mode Panel  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  State Management Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Error       │  │  Onboarding  │  │  Text Style  │  │
│  │  Manager     │  │  State       │  │  State       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Progress    │  │  Caption     │  │  Masking     │  │
│  │  Tracker     │  │  Cache       │  │  Mode State  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Caption     │  │  Masking     │  │  Text        │  │
│  │  Generator   │  │  Engine      │  │  Renderer    │  │
│  │  (Enhanced)  │  │  (6 Modes)   │  │  (Advanced)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Error       │  │  Onboarding  │  │  Canvas      │  │
│  │  Recovery    │  │  Controller  │  │  Compositor  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Error Handling System

#### ErrorManager

```typescript
interface ErrorContext {
  operation: string
  timestamp: number
  retryCount: number
  recoverable: boolean
}

interface ErrorMessage {
  title: string
  description: string
  actions: ErrorAction[]
  severity: 'error' | 'warning' | 'info'
}

interface ErrorAction {
  label: string
  handler: () => void | Promise<void>
  primary?: boolean
}

class ErrorManager {
  private errorHistory: Map<string, ErrorContext>
  
  handleError(error: Error, context: ErrorContext): ErrorMessage
  canRetry(operationId: string): boolean
  getRecoveryActions(error: Error): ErrorAction[]
  logError(error: Error, context: ErrorContext): void
}
```

#### ErrorToast Component

```typescript
interface ErrorToastProps {
  message: ErrorMessage
  onDismiss: () => void
  onAction: (action: ErrorAction) => void
}

// Displays user-friendly error messages with recovery actions
// Positioned at top-right of viewport
// Auto-dismisses after 10 seconds for non-critical errors
// Persists for critical errors until user action
```

### 2. Click-to-Apply Caption System

#### CaptionSelector Component

```typescript
interface CaptionOption {
  id: string
  text: string
  confidence: number
  applied: boolean
}

interface CaptionSelectorProps {
  captions: CaptionOption[]
  selectedId: string | null
  onSelect: (caption: CaptionOption) => void
  onHover: (caption: CaptionOption | null) => void
}

// Displays generated captions as clickable cards
// Highlights currently applied caption
// Shows preview on hover
// Provides visual feedback on click
```

#### Caption Application Flow

```typescript
const applyCaptionToCanvas = (caption: CaptionOption) => {
  // 1. Update text state
  setText(caption.text)
  
  // 2. Save to history
  saveState(`Applied caption: "${caption.text}"`)
  
  // 3. Trigger canvas re-render
  renderCanvas()
  
  // 4. Update UI selection state
  setSelectedCaption(caption.id)
  
  // 5. Show success feedback
  showToast({ type: 'success', message: 'Caption applied' })
}
```

### 3. Onboarding System

#### OnboardingController

```typescript
interface OnboardingStep {
  id: string
  title: string
  description: string
  targetElement?: string // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
  sampleImage?: string
}

interface OnboardingState {
  completed: boolean
  currentStep: number
  dismissed: boolean
}

class OnboardingController {
  private steps: OnboardingStep[]
  private state: OnboardingState
  
  start(): void
  next(): void
  previous(): void
  skip(): void
  restart(): void
  isFirstVisit(): boolean
  markCompleted(): void
}
```

#### OnboardingOverlay Component

```typescript
interface OnboardingOverlayProps {
  step: OnboardingStep
  totalSteps: number
  currentStep: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
}

// Semi-transparent overlay with spotlight on target element
// Tooltip with step content
// Navigation buttons (Previous, Next, Skip)
// Progress indicator (e.g., "Step 2 of 5")
```

### 4. Progress Feedback System

#### ProgressTracker

```typescript
interface ProgressState {
  operation: string
  status: 'idle' | 'running' | 'success' | 'error'
  progress: number // 0-100
  message: string
  estimatedTimeRemaining?: number // seconds
  cancellable: boolean
}

class ProgressTracker {
  private state: ProgressState
  
  start(operation: string, cancellable: boolean): void
  update(progress: number, message: string): void
  estimateTimeRemaining(progress: number, startTime: number): number
  complete(): void
  fail(error: Error): void
  cancel(): void
}
```

#### ProgressIndicator Component

```typescript
interface ProgressIndicatorProps {
  state: ProgressState
  onCancel?: () => void
}

// Shows operation name and current status
// Progress bar with percentage
// Estimated time remaining (if available)
// Cancel button (if cancellable)
// Smooth animations for progress updates
```

### 5. Advanced Masking Modes

#### MaskingEngine

```typescript
type MaskingMode = 
  | 'full-behind'
  | 'weave-through'
  | 'partial-overlap'
  | 'horizontal-split'
  | 'vertical-split'
  | 'character-by-character'

interface MaskingConfig {
  mode: MaskingMode
  threshold?: number // For split modes (0-1)
  weaveFrequency?: number // For weave mode
  overlapAmount?: number // For partial overlap (0-1)
}

class MaskingEngine {
  applyMask(
    textCanvas: HTMLCanvasElement,
    maskImage: HTMLImageElement,
    config: MaskingConfig
  ): HTMLCanvasElement
  
  private applyFullBehind(textCanvas, mask): HTMLCanvasElement
  private applyWeaveThrough(textCanvas, mask, frequency): HTMLCanvasElement
  private applyHorizontalSplit(textCanvas, mask, threshold): HTMLCanvasElement
  private applyVerticalSplit(textCanvas, mask, threshold): HTMLCanvasElement
  private applyCharacterByCharacter(textCanvas, mask): HTMLCanvasElement
  
  generatePreview(mode: MaskingMode): string // Returns thumbnail URL
}
```

#### Masking Mode Algorithms

**Full Behind:**
```
For each pixel in text canvas:
  If mask alpha > 0:
    Set text pixel alpha = 0
```

**Weave Through:**
```
Divide text into horizontal bands based on frequency
For each band (alternating):
  If band index is even:
    Apply full-behind masking
  Else:
    Keep text in front
```

**Horizontal Split:**
```
For each pixel in text canvas:
  If pixel.y > threshold * canvas.height:
    If mask alpha > 0:
      Set text pixel alpha = 0
```

**Vertical Split:**
```
For each pixel in text canvas:
  If pixel.x > threshold * canvas.width:
    If mask alpha > 0:
      Set text pixel alpha = 0
```

**Character-by-Character:**
```
For each character in text:
  Render character to temporary canvas
  Apply full-behind masking to character canvas
  Composite character canvas to main canvas
```

### 6. Professional Text Editor

#### TextStyleConfig

```typescript
interface TextStyleConfig {
  fontFamily: string
  fontSize: number
  fontWeight: number // 100-900
  fontStyle: 'normal' | 'italic'
  color: string // CSS color
  letterSpacing: number // pixels
  lineHeight: number // multiplier
  textAlign: 'left' | 'center' | 'right'
  
  // Effects
  shadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
  outline?: {
    width: number
    color: string
  }
  gradient?: {
    type: 'linear' | 'radial'
    stops: Array<{ offset: number; color: string }>
    angle?: number // degrees, for linear
  }
  rotation: number // degrees
}

interface TextPreset {
  id: string
  name: string
  thumbnail: string
  config: TextStyleConfig
}
```

#### AdvancedTextRenderer

```typescript
class AdvancedTextRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    text: string,
    style: TextStyleConfig,
    position: { x: number; y: number }
  ): void
  
  private applyGradient(ctx, gradient): CanvasGradient
  private applyOutline(ctx, text, outline): void
  private applyShadow(ctx, shadow): void
  private applyRotation(ctx, rotation, center): void
  
  measureText(text: string, style: TextStyleConfig): TextMetrics
  suggestFontPairings(primaryFont: string): string[]
}
```

### 7. Canvas Compositor Fixes

#### CompositorEngine (Enhanced)

```typescript
interface CompositionLayers {
  background: HTMLImageElement
  mask: HTMLImageElement
  text: HTMLCanvasElement
  maskingMode: MaskingMode
}

class CompositorEngine {
  compose(layers: CompositionLayers): HTMLCanvasElement
  
  private ensureAspectRatio(image, targetSize): HTMLCanvasElement
  private removeWhiteSilhouettes(mask): HTMLImageElement
  private blendLayers(bottom, top, blendMode): HTMLCanvasElement
  private validateMaskQuality(mask, expectedQuality): boolean
}
```

**White Silhouette Fix:**
```
Problem: Mask edges show white artifacts
Solution: 
  1. Convert mask to pure alpha channel (remove RGB data)
  2. Apply slight blur to mask edges (1-2px)
  3. Use destination-out blend mode for masking
  4. Ensure mask and image are same dimensions
```

**Aspect Ratio Fix:**
```
Problem: CSS object-fit causes clipping issues
Solution:
  1. Calculate target dimensions maintaining aspect ratio
  2. Render to canvas at exact pixel dimensions
  3. Center image within canvas if needed
  4. Avoid CSS transforms for final composition
```

### 8. Visual Feedback System

#### MicroInteractionManager

```typescript
interface HoverState {
  element: HTMLElement
  originalStyle: CSSStyleDeclaration
  hoverStyle: Partial<CSSStyleDeclaration>
}

interface ClickAnimation {
  element: HTMLElement
  animation: 'ripple' | 'scale' | 'flash'
  duration: number
}

class MicroInteractionManager {
  registerHoverEffect(element: HTMLElement, style: Partial<CSSStyleDeclaration>): void
  registerClickAnimation(element: HTMLElement, animation: ClickAnimation): void
  showKeyboardShortcuts(): void
  hideKeyboardShortcuts(): void
  provideHapticFeedback(type: 'light' | 'medium' | 'heavy'): void
}
```

## Data Models

### Enhanced Caption Result

```typescript
interface CaptionResult {
  captions: CaptionOption[]
  generatedAt: number
  model: string
  processingTime: number
}

interface CaptionOption {
  id: string
  text: string
  confidence: number
  applied: boolean
  style?: string // Suggested style preset
}
```

### Error State

```typescript
interface ErrorState {
  id: string
  error: Error
  context: ErrorContext
  message: ErrorMessage
  dismissed: boolean
  timestamp: number
}
```

### Onboarding Progress

```typescript
interface OnboardingProgress {
  completed: boolean
  currentStep: number
  stepsCompleted: string[]
  dismissed: boolean
  lastShownAt: number
}
```

### Masking Configuration

```typescript
interface MaskingState {
  mode: MaskingMode
  config: MaskingConfig
  previewUrl: string | null
  lastApplied: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Error messages are specific and actionable

*For any* API error or system failure, the error message displayed should contain specific information about the failure cause and not be a generic message like "Failed to fetch"
**Validates: Requirements 1.1, 3.1**

### Property 2: Retry functionality for failed operations

*For any* failed caption generation attempt, a retry button should be present in the error UI and clicking it should re-attempt the operation
**Validates: Requirements 1.2, 3.3**

### Property 3: Progress indicators during operations

*For any* caption generation operation in progress, the UI should display a progress indicator with status text
**Validates: Requirements 1.3, 6.1**

### Property 4: Click-to-apply caption workflow

*For any* generated caption, clicking it should immediately update the text state and trigger canvas rendering with that caption text
**Validates: Requirements 2.1, 2.3**

### Property 5: Caption selection visual feedback

*For any* applied caption, the UI should highlight that caption differently from non-applied captions
**Validates: Requirements 2.2, 2.5**

### Property 6: Caption application saves to history

*For any* caption that is applied to the canvas, the action should be saved to the undo history stack
**Validates: Requirements 2.4**

### Property 7: Caption hover preview without application

*For any* caption hover event, a preview indicator should appear but the actual text state should not change until clicked
**Validates: Requirements 2.6**

### Property 8: Recoverable errors provide recovery actions

*For any* recoverable error, the error message should include either a retry button or step-by-step recovery instructions
**Validates: Requirements 3.2, 3.3**

### Property 9: Non-recoverable errors suggest alternatives

*For any* non-recoverable error, the error message should include suggestions for alternative workflows
**Validates: Requirements 3.4**

### Property 10: Error prioritization in display

*For any* set of multiple simultaneous errors, they should be displayed in order of severity with critical errors first
**Validates: Requirements 3.5**

### Property 11: Error dismissal clears UI

*For any* error that is dismissed, the error UI should be cleared while the error is logged for debugging
**Validates: Requirements 3.6**

### Property 12: Onboarding step navigation

*For any* onboarding step, users should be able to navigate both forward and backward through the steps
**Validates: Requirements 4.7**

### Property 13: Onboarding completion persistence

*For any* completed onboarding session, the completion status should be stored in local storage and persist across sessions
**Validates: Requirements 4.5**

### Property 14: Hidden feature indicators

*For any* advanced feature that is hidden in compact view, a visual indicator should be present showing that additional features exist
**Validates: Requirements 5.2**

### Property 15: View preference persistence

*For any* toggle between compact and expanded views, the preference should be saved and restored on next visit
**Validates: Requirements 5.3**

### Property 16: Feature search provides hints

*For any* feature search query, the results should include keyboard shortcuts or quick access hints
**Validates: Requirements 5.6**

### Property 17: Sequential operation progress tracking

*For any* sequence of multiple operations, progress should be displayed for each step individually
**Validates: Requirements 6.2**

### Property 18: Measurable progress display

*For any* operation with measurable progress, a percentage or progress bar should be displayed
**Validates: Requirements 6.3**

### Property 19: Time estimation display

*For any* operation with estimable duration, the estimated time remaining should be displayed
**Validates: Requirements 6.4**

### Property 20: Operation completion feedback

*For any* completed operation, visual confirmation of success should be provided
**Validates: Requirements 6.5**

### Property 21: Cancellable operations have cancel button

*For any* cancellable operation, a cancel button should be present and functional
**Validates: Requirements 6.6**

### Property 22: Full behind masking algorithm

*For any* text rendered with "full behind" masking mode, all text pixels that overlap with mask pixels (alpha > 0) should have their alpha set to 0
**Validates: Requirements 7.2**

### Property 23: Weave through masking algorithm

*For any* text rendered with "weave through" masking mode, text should alternate between behind and in front of the subject in horizontal bands
**Validates: Requirements 7.3**

### Property 24: Horizontal split masking algorithm

*For any* text rendered with "horizontal split" masking mode, only text pixels below the threshold should be masked
**Validates: Requirements 7.4**

### Property 25: Vertical split masking algorithm

*For any* text rendered with "vertical split" masking mode, only text pixels to one side of the threshold should be masked
**Validates: Requirements 7.5**

### Property 26: Character-by-character masking algorithm

*For any* text rendered with "character-by-character" masking mode, each character should be masked independently
**Validates: Requirements 7.6**

### Property 27: Masking mode preview on hover

*For any* masking mode option, hovering over it should display a preview thumbnail without changing the current mode
**Validates: Requirements 7.7**

### Property 28: Masking mode change triggers re-render

*For any* masking mode change, the canvas should immediately re-render with the new mode applied
**Validates: Requirements 7.8**

### Property 29: Real-time text property updates

*For any* text property change (font, size, color, spacing, etc.), the canvas should update in real-time without requiring a separate apply action
**Validates: Requirements 8.5**

### Property 30: Font pairing suggestions

*For any* font selection, the system should display font pairing suggestions
**Validates: Requirements 8.6**

### Property 31: Preset application

*For any* text style preset that is applied, all text properties should update to match the preset configuration
**Validates: Requirements 8.7**

### Property 32: Custom preset saving

*For any* custom text style created by the user, it should be saveable as a personal preset and persist across sessions
**Validates: Requirements 8.8**

### Property 33: No white silhouettes in compositing

*For any* text composited with a mask, the output should not contain white silhouettes or artifacts around the subject edges
**Validates: Requirements 9.1**

### Property 34: Masking only applies with text

*For any* canvas state with empty text, masking effects should not be applied to the image
**Validates: Requirements 9.2**

### Property 35: Aspect ratio preservation

*For any* image with non-standard aspect ratio, the canvas should maintain correct proportions without clipping
**Validates: Requirements 9.3**

### Property 36: Correct alpha blending

*For any* layer composition, alpha channel operations should be mathematically correct
**Validates: Requirements 9.4**

### Property 37: Mask quality consistency

*For any* generated mask, the edge quality should match the selected quality setting
**Validates: Requirements 9.5**

### Property 38: Export matches preview

*For any* canvas export, the exported image should match the on-screen preview
**Validates: Requirements 9.6**

### Property 39: Hover state visual changes

*For any* interactive element, hovering should produce visible style changes
**Validates: Requirements 10.1**

### Property 40: Click animation feedback

*For any* button click, a click animation should be displayed providing tactile feedback
**Validates: Requirements 10.2**

### Property 41: Smooth slider interaction

*For any* before/after slider drag operation, the view should update smoothly at 60fps or higher
**Validates: Requirements 10.3**

### Property 42: Draggable element visual cues

*For any* draggable element, visual cues (cursor change, icon, etc.) should indicate drag capability
**Validates: Requirements 10.4**

### Property 43: Immediate action feedback

*For any* user action, visual confirmation should be provided within 100ms
**Validates: Requirements 10.6**

## Error Handling

### Caption Generation Errors

**Network Failures:**
- Detect offline state using `navigator.onLine`
- Display: "No internet connection. Please check your network and try again."
- Provide retry button that re-checks connectivity before attempting

**API Rate Limits:**
- Detect 429 status codes
- Display: "Too many requests. Please wait [X] seconds before trying again."
- Disable retry button with countdown timer

**API Errors:**
- Parse error responses for specific messages
- Display: "Caption generation failed: [specific reason]"
- Provide retry button with exponential backoff

**Timeout Errors:**
- Set 30-second timeout for caption generation
- Display: "Request timed out. The server may be busy."
- Provide retry button

### Masking Errors

**Invalid Mask Data:**
- Validate mask image format and dimensions
- Fall back to no masking if mask is invalid
- Display warning: "Mask quality issue detected. Using original image."

**Compositor Errors:**
- Catch canvas rendering exceptions
- Display: "Rendering error occurred. Please try a different masking mode."
- Log detailed error for debugging

### Onboarding Errors

**Storage Errors:**
- Catch localStorage quota exceeded errors
- Fall back to session storage
- Display: "Unable to save preferences. They will reset when you close the browser."

### Text Rendering Errors

**Font Loading Failures:**
- Detect font load failures
- Fall back to system fonts
- Display: "Custom font unavailable. Using default font."

**Invalid Style Values:**
- Validate all style inputs
- Clamp values to valid ranges
- Display: "Invalid value. Using closest valid option."

## Testing Strategy

### Unit Tests

**Error Handling:**
- Test ErrorManager handles different error types correctly
- Test error message generation for various failure scenarios
- Test retry logic with exponential backoff
- Test error prioritization algorithm

**Caption System:**
- Test caption click applies text correctly
- Test caption hover shows preview without applying
- Test caption selection state updates
- Test caption history integration

**Onboarding:**
- Test OnboardingController step navigation
- Test onboarding completion persistence
- Test onboarding restart functionality
- Test first-visit detection

**Masking Modes:**
- Test each masking algorithm with sample data
- Test masking mode switching
- Test preview generation for each mode
- Test masking with empty text

**Text Rendering:**
- Test AdvancedTextRenderer with various styles
- Test gradient application
- Test outline and shadow rendering
- Test rotation transforms

**Compositor:**
- Test aspect ratio preservation
- Test alpha blending operations
- Test white silhouette removal
- Test export consistency

### Integration Tests

**End-to-End Caption Workflow:**
- Upload image → Generate captions → Click caption → Verify canvas updates
- Test with API failures and recovery
- Test with multiple caption selections
- Test undo/redo with caption changes

**Onboarding Flow:**
- Test complete onboarding sequence
- Test skip and restart functionality
- Test persistence across sessions

**Masking Mode Workflow:**
- Test switching between all 6 masking modes
- Test mode changes with different text and images
- Test preview generation

**Text Editing Workflow:**
- Test real-time updates for all text properties
- Test preset application
- Test custom preset saving and loading

### Property-Based Tests

Property-based testing will use **fast-check** library for TypeScript/JavaScript. Each property test should run a minimum of 100 iterations.

**Error Handling Properties:**
- Property 1: Test with random error types and contexts
- Property 2: Test with random retry counts
- Property 3: Test with random operation states

**Caption Properties:**
- Property 4: Test with random caption lists
- Property 5: Test with random caption selections
- Property 6: Test with random hover events

**Masking Properties:**
- Property 22-26: Test each masking algorithm with random text, masks, and configurations
- Property 27-28: Test mode switching with random sequences

**Text Rendering Properties:**
- Property 29-32: Test with random text styles and configurations

**Compositor Properties:**
- Property 33-38: Test with random images, masks, and aspect ratios

**Interaction Properties:**
- Property 39-43: Test with random user interactions

Each property-based test must be tagged with: `**Feature: ux-critical-improvements, Property {number}: {property_text}**`

### Visual Regression Tests

- Capture screenshots of all masking modes
- Capture screenshots of error states
- Capture screenshots of onboarding steps
- Capture screenshots of text rendering with various styles
- Compare against baseline images

### Performance Tests

- Measure caption generation response time
- Measure masking mode switching time (should be < 100ms)
- Measure text property update time (should be < 16ms for 60fps)
- Measure canvas export time
- Measure onboarding overlay render time

### Accessibility Tests

- Test keyboard navigation through onboarding
- Test screen reader announcements for errors
- Test focus management in modals and overlays
- Test color contrast for all UI elements
- Test keyboard shortcuts functionality
