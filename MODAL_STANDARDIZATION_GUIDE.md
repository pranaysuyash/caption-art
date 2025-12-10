# Modal/Dialog Standardization Guide
**Date:** December 6, 2025  
**Status:** 🚧 In Progress

---

## Problem

The codebase has multiple inconsistent modal/dialog implementations:

1. **CreateCampaignModal** - Custom modal with `.modal-overlay` and `.modal-content`
2. **ShareDialog** - Inline styles with `.share-dialog-overlay`
3. **CampaignDetail** - Inline modals with inconsistent styling
4. **ReferenceCreativeManager** - Custom `.modal-overlay` implementation
5. **SettingsPanel** - Custom `.settings-panel-overlay`
6. **Toolbar** - Inline confirmation dialog
7. **EffectPresetSelector** - Native `confirm()` dialog
8. **DialogContext** - Standardized ConfirmDialog and PromptDialog (✅ Good!)

### Issues:
- ❌ Inconsistent styling and behavior
- ❌ Duplicate CSS across components
- ❌ Different overlay click behaviors
- ❌ Inconsistent escape key handling
- ❌ No focus trap in some modals
- ❌ Accessibility issues
- ❌ Hard to maintain

---

## Solution

Create a standardized `<Modal>` component that all modals should use.

### Features:
- ✅ Consistent styling via CSS variables
- ✅ Multiple sizes (sm, md, lg, xl, full)
- ✅ Overlay click to close (configurable)
- ✅ Escape key to close (configurable)
- ✅ Focus trap for accessibility
- ✅ Body scroll lock
- ✅ Smooth animations
- ✅ Responsive design
- ✅ ARIA attributes

---

## New Standardized Modal Component

### Location
- `frontend/src/components/Modal.tsx`
- `frontend/src/components/Modal.css`

### Usage

```typescript
import { Modal, ModalActions } from './Modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="My Modal Title"
        size="md" // sm | md | lg | xl | full
        footer={
          <ModalActions align="right">
            <button onClick={() => setIsOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Save
            </button>
          </ModalActions>
        }
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

### Props

```typescript
interface ModalProps {
  isOpen: boolean;              // Required: Controls visibility
  onClose: () => void;          // Required: Close handler
  title: string;                // Required: Modal title
  children: ReactNode;          // Required: Modal content
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';  // Optional: Default 'md'
  showCloseButton?: boolean;    // Optional: Default true
  closeOnOverlayClick?: boolean; // Optional: Default true
  closeOnEscape?: boolean;      // Optional: Default true
  footer?: ReactNode;           // Optional: Footer content
  className?: string;           // Optional: Additional classes
}
```

---

## Migration Checklist

### Phase 1: High Priority (User-Facing) ✅
- [x] Create standardized Modal component
- [x] Create Modal.css with design system variables
- [ ] Migrate CreateCampaignModal
- [ ] Migrate CampaignDetail modals (Brand Kit, Campaign Brief)
- [ ] Migrate ShareDialog
- [ ] Test all migrated modals

### Phase 2: Medium Priority
- [ ] Migrate ReferenceCreativeManager modals
- [ ] Migrate SettingsPanel
- [ ] Migrate EffectPresetSelector (replace native confirm)
- [ ] Migrate Toolbar confirmation
- [ ] Remove duplicate modal CSS

### Phase 3: Cleanup
- [ ] Remove old modal CSS classes
- [ ] Update documentation
- [ ] Add Storybook stories for Modal
- [ ] Add unit tests for Modal

---

## Migration Examples

### Before: CreateCampaignModal

```typescript
return (
  <div className='modal-overlay' onClick={onClose}>
    <div className='modal-content' onClick={(e) => e.stopPropagation()}>
      <div className='modal-header'>
        <h2>Create Campaign</h2>
        <button className='close-button' onClick={onClose}>×</button>
      </div>
      <form onSubmit={handleSubmit} className='campaign-form'>
        {/* content */}
        <div className='modal-actions'>
          <button type='button' onClick={onClose}>Cancel</button>
          <button type='submit'>Create Campaign</button>
        </div>
      </form>
    </div>
  </div>
);
```

### After: Using Standardized Modal

```typescript
import { Modal, ModalActions } from './Modal';

return (
  <Modal
    isOpen={true}
    onClose={onClose}
    title="Create Campaign"
    size="lg"
    footer={
      <ModalActions align="right">
        <button type='button' onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button type='submit' onClick={handleSubmit} className="btn btn-primary">
          Create Campaign
        </button>
      </ModalActions>
    }
  >
    <form onSubmit={handleSubmit} className='campaign-form'>
      {/* content */}
    </form>
  </Modal>
);
```

---

## Benefits

### For Developers:
- ✅ Single source of truth for modal behavior
- ✅ Less code to write
- ✅ Consistent API across all modals
- ✅ Built-in accessibility
- ✅ Easier to test

### For Users:
- ✅ Consistent experience across the app
- ✅ Better accessibility
- ✅ Smoother animations
- ✅ Predictable behavior

### For Maintenance:
- ✅ Single place to fix bugs
- ✅ Single place to add features
- ✅ Easier to update styling
- ✅ Less CSS duplication

---

## Design System Integration

The Modal component uses CSS variables from the design system:

```css
--color-bg-primary      /* Modal background */
--color-bg-secondary    /* Close button background */
--color-bg-tertiary     /* Close button hover */
--color-border          /* Borders */
--color-text            /* Title text */
--color-text-secondary  /* Close button text */
```

This ensures modals automatically adapt to theme changes.

---

## Accessibility Features

- ✅ **ARIA attributes**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- ✅ **Focus trap**: Tab cycles through modal elements only
- ✅ **Escape key**: Closes modal (configurable)
- ✅ **Body scroll lock**: Prevents background scrolling
- ✅ **Keyboard navigation**: Full keyboard support
- ✅ **Screen reader support**: Proper labeling and structure

---

## Testing Strategy

### Unit Tests
```typescript
describe('Modal', () => {
  it('renders when isOpen is true', () => {});
  it('does not render when isOpen is false', () => {});
  it('calls onClose when overlay is clicked', () => {});
  it('calls onClose when escape key is pressed', () => {});
  it('does not close on overlay click when closeOnOverlayClick is false', () => {});
  it('traps focus within modal', () => {});
  it('locks body scroll when open', () => {});
  it('restores body scroll when closed', () => {});
});
```

### Integration Tests
- Test with real forms
- Test with async operations
- Test with nested modals
- Test responsive behavior

---

## Next Steps

1. ✅ Create Modal component
2. ✅ Create Modal.css
3. ⏳ Migrate CreateCampaignModal (NEXT)
4. ⏳ Migrate CampaignDetail modals
5. ⏳ Migrate ShareDialog
6. ⏳ Test all migrations
7. ⏳ Remove old modal CSS
8. ⏳ Update documentation

---

## Notes

- Keep DialogContext (ConfirmDialog/PromptDialog) as-is - it's already well-designed
- Consider creating specialized modal variants (ConfirmModal, FormModal) if patterns emerge
- Add animation preferences for users who prefer reduced motion
- Consider adding modal stacking support for nested modals

---

## Questions?

Contact the frontend team or check the Modal component source code for implementation details.
