# Modal Component - Quick Reference
**Last Updated:** December 6, 2025

---

## 🚀 Quick Start

```typescript
import { Modal, ModalActions } from './components/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="My Modal"
  size="md"
>
  <p>Content here</p>
</Modal>
```

---

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Controls visibility |
| `onClose` | `() => void` | required | Close handler |
| `title` | `string` | required | Modal title |
| `children` | `ReactNode` | required | Modal content |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `showCloseButton` | `boolean` | `true` | Show X button |
| `closeOnOverlayClick` | `boolean` | `true` | Close on overlay click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `footer` | `ReactNode` | `undefined` | Footer content |
| `className` | `string` | `''` | Additional classes |

---

## 📏 Sizes

- `sm` - 400px max width
- `md` - 600px max width (default)
- `lg` - 800px max width
- `xl` - 1200px max width
- `full` - 95vw max width

---

## 🎨 With Footer Actions

```typescript
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Action"
  footer={
    <ModalActions align="right">
      <button onClick={onClose} className="btn btn-secondary">
        Cancel
      </button>
      <button onClick={handleSave} className="btn btn-primary">
        Save
      </button>
    </ModalActions>
  }
>
  <p>Are you sure?</p>
</Modal>
```

---

## 🔄 Multi-Step Modal

```typescript
const [step, setStep] = useState<'select' | 'confirm'>('select');

const getTitle = () => {
  switch (step) {
    case 'select': return 'Select Options';
    case 'confirm': return 'Confirm Selection';
  }
};

const getFooter = () => {
  switch (step) {
    case 'select':
      return (
        <ModalActions align="right">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={() => setStep('confirm')} className="btn btn-primary">
            Next
          </button>
        </ModalActions>
      );
    case 'confirm':
      return (
        <ModalActions align="right">
          <button onClick={() => setStep('select')} className="btn btn-secondary">
            Back
          </button>
          <button onClick={handleSubmit} className="btn btn-primary">
            Confirm
          </button>
        </ModalActions>
      );
  }
};

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title={getTitle()}
  footer={getFooter()}
>
  {step === 'select' && <SelectContent />}
  {step === 'confirm' && <ConfirmContent />}
</Modal>
```

---

## 🚫 Prevent Closing

```typescript
<Modal
  isOpen={isPosting}
  onClose={onClose}
  title="Posting..."
  closeOnOverlayClick={false}
  closeOnEscape={false}
  showCloseButton={false}
>
  <LoadingSpinner />
</Modal>
```

---

## 🎯 ModalActions Alignment

```typescript
<ModalActions align="left">...</ModalActions>
<ModalActions align="center">...</ModalActions>
<ModalActions align="right">...</ModalActions>
<ModalActions align="space-between">...</ModalActions>
```

---

## ✅ Migrated Components - ALL COMPLETE!

1. ✅ CreateCampaignModal
2. ✅ ShareDialog (multi-step)
3. ✅ CampaignDetail (enhanced with tabs)
4. ✅ SettingsPanel
5. ✅ SocialPostPreview
6. ✅ ReferenceCreativeManager (2 modals)
7. ✅ Toolbar (useConfirm)
8. ✅ EffectPresetSelector (useConfirm)

**Status:** All modal migrations complete! 🎉

---

## 📚 Full Documentation

- `MODAL_STANDARDIZATION_GUIDE.md` - Complete guide
- `MODAL_MIGRATION_TASKS.md` - Migration plan
- `MODAL_STANDARDIZATION_FINAL.md` - Current status

---

## 🎨 Design System Variables

The Modal component uses these CSS variables:

```css
--color-bg-primary      /* Modal background */
--color-bg-secondary    /* Close button background */
--color-bg-tertiary     /* Close button hover */
--color-border          /* Borders */
--color-text            /* Title text */
--color-text-secondary  /* Close button text */
--color-primary         /* Primary actions */
```

---

## ♿ Accessibility Features

- ✅ ARIA attributes (`role="dialog"`, `aria-modal="true"`)
- ✅ Focus trap (Tab cycles within modal)
- ✅ Escape key support
- ✅ Body scroll lock
- ✅ Keyboard navigation
- ✅ Screen reader support

---

## 📱 Responsive

- Desktop: Respects size prop
- Mobile: Full screen, stacked buttons

---

## 🐛 Common Issues

### Modal not closing
```typescript
// ❌ Wrong
<Modal isOpen={true} onClose={onClose}>

// ✅ Correct
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
```

### Footer buttons not styled
```typescript
// ❌ Wrong
<button>Save</button>

// ✅ Correct
<button className="btn btn-primary">Save</button>
```

### Content too tall
```typescript
// Modal body scrolls automatically
// No need to add overflow styles
```

---

## 💡 Tips

1. Use `size="lg"` for forms
2. Use `size="sm"` for confirmations
3. Disable closing during async operations
4. Use ModalActions for consistent button layout
5. Keep content focused and concise

---

**Quick Reference v1.0**  
**Status:** ✅ Production Ready

