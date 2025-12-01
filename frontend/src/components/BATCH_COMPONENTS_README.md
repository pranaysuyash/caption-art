# Batch Processing UI Components

This document describes the UI components created for the batch processing system.

## Components Overview

### 1. BatchUploadZone
**Requirements: 1.1, 1.2, 1.3, 1.4, 1.5**

Upload zone for batch processing that accepts up to 50 images.

**Props:**
- `onFilesAdded: (files: File[]) => void` - Callback when files are added
- `disabled?: boolean` - Whether the upload zone is disabled
- `currentBatchSize: number` - Current number of images in batch

**Features:**
- Drag and drop support
- Multiple file selection
- Shows remaining slots (max 50 images)
- Disabled state when batch is full

**Usage:**
```tsx
<BatchUploadZone
  onFilesAdded={handleFilesAdded}
  disabled={isProcessing}
  currentBatchSize={images.length}
/>
```

---

### 2. BatchPreviewGrid
**Requirements: 4.1, 4.2, 4.3, 4.4, 4.5**

Grid layout for displaying batch images with thumbnails and details.

**Props:**
- `images: BatchImage[]` - Array of batch images
- `onSelectImage: (imageId: string) => void` - Callback when image is selected
- `onRemoveImage: (imageId: string) => void` - Callback when image is removed
- `selectedImageId?: string | null` - ID of currently selected image

**Features:**
- Responsive grid layout
- Thumbnail display for performance
- Hover tooltips with image details
- Selected image indicator
- Remove button for each image
- Large preview of selected image
- Invalid image indicators

**Usage:**
```tsx
<BatchPreviewGrid
  images={images}
  onSelectImage={handleSelectImage}
  onRemoveImage={handleRemoveImage}
  selectedImageId={selectedImageId}
/>
```

---

### 3. BatchControls
**Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 5.1, 8.1, 8.2**

Control panel for batch operations including styling and export.

**Props:**
- `onApplyCaption: (caption: string) => void` - Callback to apply caption to all
- `onApplyStyle: (preset: StylePreset, fontSize: number) => void` - Callback to apply style
- `onExportAll: () => void` - Callback to export all images
- `onCancel: () => void` - Callback to cancel processing
- `isProcessing: boolean` - Whether batch is currently processing
- `batchSize: number` - Number of images in batch
- `currentCaption: string` - Current caption text
- `currentPreset: StylePreset` - Current style preset
- `currentFontSize: number` - Current font size

**Features:**
- Caption input (applies to all images)
- Style preset selector
- Font size slider
- Export all button
- Cancel button (shown during processing)
- Batch size indicator

**Usage:**
```tsx
<BatchControls
  onApplyCaption={handleApplyCaption}
  onApplyStyle={handleApplyStyle}
  onExportAll={handleExportAll}
  onCancel={handleCancel}
  isProcessing={isProcessing}
  batchSize={images.length}
  currentCaption={caption}
  currentPreset={preset}
  currentFontSize={fontSize}
/>
```

---

### 4. BatchProgressBar
**Requirements: 6.1, 6.2, 6.3, 6.4, 6.5**

Progress bar for displaying batch processing progress.

**Props:**
- `progressState: ProgressState | null` - Current progress state
- `visible: boolean` - Whether to show the progress bar

**Features:**
- Animated progress bar
- Percentage display
- Current file being processed
- Time remaining estimate
- Completion summary with success/failure counts

**Usage:**
```tsx
<BatchProgressBar
  progressState={progressState}
  visible={isProcessing}
/>
```

---

### 5. BatchSummary
**Requirements: 1.5, 6.5, 8.3**

Summary display for batch operation results.

**Props:**
- `summary: BatchSummary | null` - Summary data
- `visible: boolean` - Whether to show the summary
- `onClose?: () => void` - Optional callback to close summary
- `title?: string` - Optional custom title

**Features:**
- Total/successful/failed counts
- List of failed images with error messages
- Success message when all images succeed
- Close button

**Usage:**
```tsx
<BatchSummary
  summary={summary}
  visible={showSummary}
  onClose={() => setShowSummary(false)}
  title="Upload Summary"
/>
```

---

## Complete Example

See `BatchProcessingExample.tsx` for a complete implementation showing how to use all components together.

The example demonstrates:
1. Uploading multiple images
2. Previewing and managing images
3. Applying batch styling
4. Exporting with progress tracking
5. Viewing summary

## Styling

All components use CSS classes defined in `frontend/src/styles/components.css`. The styles follow the neo-brutalism design system with:
- Bold borders
- Box shadows
- Bright accent colors
- Responsive layouts
- Touch-friendly targets on mobile

## Accessibility

All components include:
- Proper ARIA labels
- Keyboard navigation support
- Focus indicators
- Screen reader support
- Minimum touch target sizes (44px × 44px on mobile)

## Testing

Unit tests are provided in `BatchPreviewGrid.test.tsx` demonstrating how to test the components.
