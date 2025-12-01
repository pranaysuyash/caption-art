# Implementation Plan - Canvas History and Undo/Redo System

- [x] 1. Set up history library structure
- [x] 1.1 Create history module
  - Create `frontend/src/lib/history/` directory
  - Define HistoryEntry interface
  - Define CanvasState interface
  - _Requirements: All_

- [x] 2. Implement HistoryStack
- [x] 2.1 Create historyStack.ts
  - Implement push operation
  - Implement pop operation
  - Implement size limit (50 entries)
  - Implement clear operation
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2.2 Write property test for history stack limit
  - **Property 2: History stack limit**
  - **Validates: Requirements 5.1, 5.3**

- [x] 3. Implement HistoryManager
- [x] 3.1 Create historyManager.ts
  - Implement saveState function
  - Implement undo function
  - Implement redo function
  - Implement canUndo/canRedo functions
  - Implement clear function
  - Implement getHistory function
  - Implement jumpTo function
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.2 Write property test for undo-redo round-trip
  - **Property 1: Undo-redo round-trip**
  - **Validates: Requirements 1.1, 1.4, 2.1, 2.4**

- [x] 3.3 Write property test for redo stack clearing
  - **Property 3: Redo stack clearing**
  - **Validates: Requirements 2.5**

- [x] 4. Implement state serialization
- [x] 4.1 Create stateSerializer.ts
  - Implement serialize function (deep clone)
  - Implement deserialize function
  - Implement diff calculation (store only changes)
  - _Requirements: 5.2, 5.4_

- [x] 4.2 Write property test for state immutability
  - **Property 4: State immutability**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 5. Implement automatic state saving
- [x] 5.1 Create autoSave logic
  - Debounce text changes (500ms)
  - Save immediately on preset change
  - Debounce transform changes (500ms)
  - Save immediately on image upload
  - Save immediately on mask generation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement keyboard shortcuts
- [x] 6.1 Create keyboardHandler.ts
  - Detect platform (Windows/Mac)
  - Register Ctrl+Z / Cmd+Z for undo
  - Register Ctrl+Y / Cmd+Shift+Z for redo
  - Prevent shortcuts in text inputs
  - Prevent default browser behavior
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 6.2 Write property test for keyboard shortcut consistency
  - **Property 5: Keyboard shortcut consistency**
  - **Validates: Requirements 7.1, 7.2**

- [x] 7. Implement history persistence
- [x] 7.1 Add localStorage integration
  - Save history stack on changes
  - Load history stack on mount
  - Validate restored entries
  - Handle localStorage full
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. Create React components
- [x] 8.1 Create HistoryControls component
  - Render undo button
  - Render redo button
  - Disable when unavailable
  - Show tooltips with action names
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.2_

- [x] 8.2 Create HistoryList component
  - Display list of recent actions
  - Highlight current state
  - Allow clicking to jump to state
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [x] 8.3 Create HistoryTooltip component
  - Show action that will be undone/redone
  - Display on hover
  - _Requirements: 3.2, 3.3_

- [x] 9. Integrate with App.tsx
- [x] 9.1 Initialize HistoryManager
  - Create history manager instance
  - Load persisted history
  - Connect to canvas state
  - _Requirements: 8.1, 8.2_

- [x] 9.2 Connect undo/redo to UI
  - Add HistoryControls to toolbar
  - Handle undo/redo button clicks
  - Handle keyboard shortcuts
  - Update canvas on state change
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 7.1, 7.2_

- [x] 9.3 Implement auto-save triggers
  - Save on text change (debounced)
  - Save on preset change
  - Save on transform change (debounced)
  - Save on image upload
  - Save on mask generation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10. Implement clear history
- [x] 10.1 Add clear functionality
  - Prompt for confirmation
  - Clear undo and redo stacks
  - Keep current state
  - Disable undo/redo buttons
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Write unit tests
- [x] 11.1 Test HistoryStack
- [x] 11.2 Test HistoryManager
- [x] 11.3 Test state serialization
- [x] 11.4 Test keyboard shortcuts
- [x] 11.5 Test persistence

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Final testing
- [x] 13.1 Test undo/redo functionality
- [x] 13.2 Test keyboard shortcuts
- [x] 13.3 Test history persistence
- [x] 13.4 Test auto-save triggers
- [x] 13.5 Test clear history

- [x] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
