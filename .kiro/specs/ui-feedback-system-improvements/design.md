# Design Document

## Overview

This design establishes a comprehensive user feedback system to replace all browser-native dialogs (alert, confirm, prompt) with custom React components that integrate with the application's design system. The solution provides Toast notifications for non-blocking feedback, ConfirmDialog for user confirmations, and PromptDialog for text input, all with proper accessibility support.

## Architecture

### Component Hierarchy

```
App
├── ToastContainer (existing, enhanced)
├── DialogProvider (new)
│   ├── ConfirmDialog (new)
│   └── PromptDialog (new)
└── Application Content
```

### State Management

- Toast state: Managed by `useToast` hook (existing)
- Dialog state: Managed by `DialogProvider` context (new)
- Each dialog type maintains its own queue to handle multiple simultaneous requests

### Component Communication

- Toasts: Imperative API via `useToast` hook
- Dialogs: Imperative API via `useConfirm` and `usePrompt` hooks
- All components use React Context for state sharing

## Components and Interfaces

### ConfirmDialog Component

```typescript
interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'warning'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}
```

Features:
- Modal overlay with backdrop
- Customizable button labels
- Visual variants for different severity levels
- Async action support with loading states
- Keyboard navigation (Enter to confirm, Escape to cancel)

### PromptDialog Component

```typescript
interface PromptDialogProps {
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
  validate?: (value: string) => string | null
  onConfirm: (value: string) => void | Promise<void>
  onCancel: () => void
}
```

Features:
- Text input field with label
- Optional validation function
- Error message display
- Async submission support
- Keyboard navigation

### DialogProvider Context

```typescript
interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  prompt: (options: PromptOptions) => Promise<string | null>
}

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'warning'
}

interface PromptOptions {
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
  validate?: (value: string) => string | null
}
```

### Hooks

```typescript
// Returns promise-based confirm function
function useConfirm(): (options: ConfirmOptions) => Promise<boolean>

// Returns promise-based prompt function  
function usePrompt(): (options: PromptOptions) => Promise<string | null>
```

## Data Models

### Dialog Queue Entry

```typescript
interface DialogQueueEntry<T> {
  id: string
  type: 'confirm' | 'prompt'
  options: ConfirmOptions | PromptOptions
  resolve: (value: T) => void
  reject: (reason?: any) => void
}
```

### Toast Enhancement

The existing Toast component already supports the necessary features. No data model changes needed.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dialog resolution consistency

*For any* dialog (confirm or prompt), when the user takes an action (confirm, cancel, or close), the promise returned by the dialog function should resolve exactly once with the appropriate value
**Validates: Requirements 2.1, 3.1**

### Property 2: Focus trap containment

*For any* open modal dialog, pressing Tab or Shift+Tab should cycle focus only among focusable elements within that dialog, never escaping to the underlying page
**Validates: Requirements 5.2**

### Property 3: Escape key cancellation

*For any* open dialog, pressing the Escape key should cancel the dialog and resolve the promise with the cancellation value (false for confirm, null for prompt)
**Validates: Requirements 5.3**

### Property 4: Focus restoration

*For any* dialog that opens, when the dialog closes, focus should return to the element that had focus immediately before the dialog opened
**Validates: Requirements 5.4**

### Property 5: Toast ARIA compliance

*For any* toast notification displayed, the toast element should have appropriate ARIA attributes (role="alert" or role="status", aria-live, aria-atomic)
**Validates: Requirements 5.1**

### Property 6: Dialog queue ordering

*For any* sequence of dialog requests, dialogs should be displayed in the order they were requested, with only one dialog visible at a time
**Validates: Requirements 4.1, 4.2**

### Property 7: Validation enforcement

*For any* prompt dialog with a validation function, the confirm button should be disabled or the dialog should not close when the validation function returns an error message
**Validates: Requirements 3.4**

### Property 8: Backdrop click cancellation

*For any* dialog, clicking on the backdrop (outside the dialog content) should cancel the dialog with the same behavior as clicking the cancel button
**Validates: Requirements 2.4**

### Property 9: Browser dialog elimination

*For any* component in the application, after migration, there should be zero calls to window.alert(), window.confirm(), or window.prompt()
**Validates: Requirements 1.5, 2.5, 3.5, 6.4**

### Property 10: Async action handling

*For any* dialog with an async confirm action, the dialog should show a loading state during execution and should not close until the action completes or fails
**Validates: Requirements 2.2, 3.3**

## Error Handling

### Dialog Errors

- **Validation errors**: Display inline error message below input field
- **Async action errors**: Show error toast and keep dialog open for retry
- **Multiple dialog requests**: Queue subsequent requests, show one at a time

### Toast Errors

- **Duplicate toasts**: Allow duplicates but limit total visible toasts to 5
- **Toast overflow**: Remove oldest toast when limit exceeded

### Focus Management Errors

- **No focusable elements**: Ensure dialog container itself is focusable
- **Focus restoration failure**: Fall back to document.body if original element is unmounted

## Testing Strategy

### Unit Tests

- Test ConfirmDialog rendering with different variants
- Test PromptDialog validation logic
- Test dialog queue management
- Test focus trap implementation
- Test keyboard event handlers
- Test promise resolution for all user actions

### Property-Based Tests

Property-based testing will use `@fast-check/vitest` for React/TypeScript. Each property test should run a minimum of 100 iterations.

- Property 1: Dialog resolution consistency - Generate random dialog sequences and verify each resolves exactly once
- Property 2: Focus trap containment - Generate random Tab/Shift+Tab sequences and verify focus stays within dialog
- Property 3: Escape key cancellation - Test Escape key on random dialog states
- Property 4: Focus restoration - Generate random dialog open/close sequences
- Property 5: Toast ARIA compliance - Generate random toast configurations and verify ARIA attributes
- Property 6: Dialog queue ordering - Generate random dialog request sequences
- Property 7: Validation enforcement - Generate random input values and validation functions
- Property 8: Backdrop click cancellation - Test backdrop clicks on random dialog states
- Property 9: Browser dialog elimination - Scan codebase for browser dialog usage
- Property 10: Async action handling - Generate random async actions with various completion times

### Integration Tests

- Test complete user flows with multiple dialogs
- Test dialog interactions with existing Toast system
- Test accessibility with screen reader simulation
- Test keyboard-only navigation through entire dialog lifecycle

### Migration Testing

- Verify each replaced alert() maintains equivalent functionality
- Verify each replaced confirm() maintains equivalent functionality  
- Verify each replaced prompt() maintains equivalent functionality
- Test edge cases from original implementations

## Implementation Notes

### Styling

- Use existing design system variables
- Match neo-brutalism theme if active
- Ensure sufficient color contrast for accessibility
- Provide smooth animations for dialog appearance/dismissal

### Performance

- Lazy load dialog components
- Use React.memo for dialog components
- Debounce rapid dialog requests
- Clean up event listeners on unmount

### Browser Compatibility

- Test focus trap in all major browsers
- Ensure backdrop click works on mobile
- Test keyboard navigation across browsers
- Verify ARIA support in assistive technologies
