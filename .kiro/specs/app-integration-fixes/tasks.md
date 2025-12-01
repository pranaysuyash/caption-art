# Implementation Plan

## Status: ✅ COMPLETE

All tasks have been successfully implemented and tested. The App.tsx component now has:
- Proper imports for HistoryManager, CanvasState, and Toolbar
- History management state variables (historyManagerRef, canUndo, canRedo, captions)
- Complete state management functions (saveState, restoreState, handleUndo, handleRedo)
- Fixed mask quality type error (using "high" instead of "good")
- Auto-save integration with debounced state changes
- Caption tracking for history
- All property-based tests passing (100 iterations each)
- All integration tests passing

---

- [x] 1. Fix imports and add missing dependencies in App.tsx
  - Add useRef to React imports
  - Import HistoryManager from './lib/history/historyManager'
  - Import CanvasState from './lib/history/types'
  - Import Toolbar from './components/Toolbar'
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Add history management state variables
  - [x] 2.1 Create historyManagerRef using useRef<HistoryManager | null>(null)
    - Initialize ref to null
    - _Requirements: 2.1_
  
  - [x] 2.2 Add canUndo state variable initialized to false
    - Use useState<boolean>(false)
    - _Requirements: 2.2_
  
  - [x] 2.3 Add canRedo state variable initialized to false
    - Use useState<boolean>(false)
    - _Requirements: 2.3_
  
  - [x] 2.4 Add captions state variable initialized to empty array
    - Use useState<string[]>([])
    - Track generated caption suggestions
    - _Requirements: 3.6_

- [x] 3. Implement history manager initialization
  - [x] 3.1 Create useEffect hook for history manager initialization
    - Check if historyManagerRef.current is null
    - Create new HistoryManager with maxSize: 50
    - Assign to historyManagerRef.current
    - Run only on component mount (empty dependency array)
    - _Requirements: 2.1, 2.4_

- [x] 4. Implement state management functions
  - [x] 4.1 Create saveState function
    - Accept action parameter (string)
    - Build CanvasState object with all required properties
    - Call historyManagerRef.current.saveState(action, state)
    - Update canUndo and canRedo states
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.6_
  
  - [x] 4.2 Write property test for state structure completeness
    - **Property 2: State structure completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
  
  - [x] 4.3 Create restoreState function
    - Accept CanvasState parameter
    - Update all state variables from the CanvasState
    - Handle imageObjUrl, text, preset, fontSize, captions
    - Handle maskUrl restoration
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 4.4 Write property test for state restoration completeness
    - **Property 3: State restoration completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**
  
  - [x] 4.5 Update handleUndo function
    - Call historyManagerRef.current.undo()
    - If state returned, call restoreState(state)
    - Update canUndo and canRedo states
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 4.6 Update handleRedo function
    - Call historyManagerRef.current.redo()
    - If state returned, call restoreState(state)
    - Update canUndo and canRedo states
    - _Requirements: 6.7_
  
  - [x] 4.7 Write property test for undo/redo availability tracking
    - **Property 1: Undo/redo availability tracking**
    - **Validates: Requirements 2.5**

- [x] 5. Fix mask quality type error
  - [x] 5.1 Change mask quality value from "good" to "high"
    - Update handleRegenerateMask function
    - Ensure quality matches MaskResult type
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 5.2 Write property test for mask quality type validity
    - **Property 4: Mask quality type validity**
    - **Validates: Requirements 5.2**

- [x] 6. Integrate auto-save with state changes
  - [x] 6.1 Update text/preset/fontSize/transform effect
    - Add debounced saveState call
    - Use 500ms timeout
    - Clear timeout on cleanup
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 6.2 Update mask effect to trigger saveState
    - Call saveState when maskResult changes
    - _Requirements: 4.5_

- [x] 7. Update caption handling
  - [x] 7.1 Update CaptionGenerator onCaptionSelect
    - Also update captions state array when caption is selected
    - Ensure captions are tracked for history
    - _Requirements: 3.6_

- [x] 8. Checkpoint - Ensure all tests pass
  - All tests passing ✅

- [x] 9. Integration testing
  - [x] 9.1 Test full undo/redo cycle
    - Make changes to text, style, transform
    - Verify undo restores previous states
    - Verify redo reapplies changes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 9.2 Test history manager initialization
    - Mount component
    - Verify historyManagerRef is initialized
    - Verify maxSize is 50
    - _Requirements: 2.1, 2.4_
  
  - [x] 9.3 Test canUndo/canRedo state updates
    - Perform history operations
    - Verify UI state matches history manager state
    - _Requirements: 2.5_
