# Requirements Document

## Introduction

The main App.tsx component has integration issues preventing it from compiling and running. The component references history management functionality and UI components that exist in the codebase but are not properly imported or integrated. This spec addresses fixing the broken imports, state management, and type mismatches to restore the application to a working state.

## Glossary

- **App Component**: The main React component (App.tsx) that orchestrates the entire application
- **History Manager**: The undo/redo system that manages canvas state history
- **Canvas State**: A snapshot of the canvas at a point in time including image, text, style, and mask data
- **Toolbar Component**: The UI component providing undo/redo/export buttons
- **Type Safety**: Ensuring all TypeScript types are correctly defined and used

## Requirements

### Requirement 1: Fix Missing Imports

**User Story:** As a developer, I want all required dependencies properly imported, so that the application compiles without errors.

#### Acceptance Criteria

1. WHEN the App component is loaded THEN the system SHALL import HistoryManager from the history module
2. WHEN the App component is loaded THEN the system SHALL import CanvasState type from the history types module
3. WHEN the App component is loaded THEN the system SHALL import Toolbar component from the components module
4. WHEN TypeScript compiles the App component THEN the system SHALL resolve all type references without errors

### Requirement 2: Initialize History Management State

**User Story:** As a user, I want the undo/redo system to be properly initialized, so that I can revert and reapply my changes.

#### Acceptance Criteria

1. WHEN the App component mounts THEN the system SHALL create a historyManagerRef using useRef hook
2. WHEN the App component mounts THEN the system SHALL initialize canUndo state as false
3. WHEN the App component mounts THEN the system SHALL initialize canRedo state as false
4. WHEN the history manager is created THEN the system SHALL configure it with a maximum size of 50 states
5. WHEN history state changes THEN the system SHALL update canUndo and canRedo state variables accordingly

### Requirement 3: Fix CanvasState Type Mismatch

**User Story:** As a developer, I want the canvas state to match the defined type structure, so that state serialization works correctly.

#### Acceptance Criteria

1. WHEN saving canvas state THEN the system SHALL include imageObjUrl property matching the CanvasState type
2. WHEN saving canvas state THEN the system SHALL include maskUrl property matching the CanvasState type
3. WHEN saving canvas state THEN the system SHALL include text property matching the CanvasState type
4. WHEN saving canvas state THEN the system SHALL include preset property matching the CanvasState type
5. WHEN saving canvas state THEN the system SHALL include fontSize property matching the CanvasState type
6. WHEN saving canvas state THEN the system SHALL include captions array property matching the CanvasState type
7. WHEN restoring canvas state THEN the system SHALL handle all CanvasState properties without type errors

### Requirement 4: Integrate History Manager with State Updates

**User Story:** As a user, I want my canvas changes automatically saved to history, so that I can undo them later.

#### Acceptance Criteria

1. WHEN text content changes THEN the system SHALL save the new state to history after a debounce period
2. WHEN style preset changes THEN the system SHALL save the new state to history after a debounce period
3. WHEN font size changes THEN the system SHALL save the new state to history after a debounce period
4. WHEN transform changes THEN the system SHALL save the new state to history after a debounce period
5. WHEN mask changes THEN the system SHALL save the new state to history after a debounce period
6. WHEN saving state THEN the system SHALL use the saveState method with an appropriate action description

### Requirement 5: Fix Mask Quality Type Error

**User Story:** As a developer, I want mask quality values to match the expected type, so that TypeScript compilation succeeds.

#### Acceptance Criteria

1. WHEN setting mask quality THEN the system SHALL use only values from the type union: "high", "medium", or "low"
2. WHEN mask generation completes THEN the system SHALL assign a valid quality value to the MaskResult
3. WHEN TypeScript compiles mask-related code THEN the system SHALL not produce type errors for quality property

### Requirement 6: Ensure Proper State Restoration

**User Story:** As a user, I want undo/redo to restore all canvas properties, so that my work is accurately recovered.

#### Acceptance Criteria

1. WHEN undo is triggered THEN the system SHALL restore imageObjUrl from the previous state
2. WHEN undo is triggered THEN the system SHALL restore maskUrl from the previous state
3. WHEN undo is triggered THEN the system SHALL restore text from the previous state
4. WHEN undo is triggered THEN the system SHALL restore preset from the previous state
5. WHEN undo is triggered THEN the system SHALL restore fontSize from the previous state
6. WHEN undo is triggered THEN the system SHALL restore captions from the previous state
7. WHEN redo is triggered THEN the system SHALL restore all properties from the next state
