# Social Media Integration UI Components

This document describes the UI components created for the social media integration feature.

## Components Overview

### 1. ShareDialog
**File:** `ShareDialog.tsx`

Main dialog component that orchestrates the entire sharing flow.

**Features:**
- Multi-step wizard (select → preview → posting → summary)
- Platform selection
- Caption editing
- Hashtag management
- Post scheduling
- Multi-platform posting
- Error handling

**Requirements:** 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5

**Usage:**
```tsx
<ShareDialog
  imageDataUrl={imageDataUrl}
  initialCaption="My caption"
  onClose={() => setShowDialog(false)}
  onSuccess={(result) => console.log(result)}
/>
```

### 2. PlatformSelector
**File:** `PlatformSelector.tsx`

Component for selecting one or multiple social media platforms.

**Features:**
- Single or multi-select mode
- Visual platform cards with icons
- Authentication status indicators
- Responsive grid layout

**Requirements:** 1.1, 7.1

**Usage:**
```tsx
<PlatformSelector
  selectedPlatforms={selectedPlatforms}
  onSelectionChange={setSelectedPlatforms}
  multiSelect={true}
  showAuthStatus={true}
/>
```

### 3. HashtagSelector
**File:** `HashtagSelector.tsx`

Component for selecting and managing hashtags.

**Features:**
- AI-generated hashtag suggestions
- Custom hashtag input
- Hashtag validation
- Visual chip-based selection
- Real-time suggestion generation

**Requirements:** 3.2, 3.3, 3.4, 3.5

**Usage:**
```tsx
<HashtagSelector
  imageDataUrl={imageDataUrl}
  caption={caption}
  selectedHashtags={hashtags}
  onHashtagsChange={setHashtags}
/>
```

### 4. SchedulePicker
**File:** `SchedulePicker.tsx`

Component for scheduling posts for future times.

**Features:**
- Toggle to enable/disable scheduling
- Date and time picker
- Future time validation
- Relative time display ("in 2 hours")
- Visual feedback for scheduled time

**Requirements:** 5.1, 5.2, 5.3

**Usage:**
```tsx
<SchedulePicker
  scheduledTime={scheduledTime}
  onScheduleChange={setScheduledTime}
  enabled={scheduleEnabled}
  onEnabledChange={setScheduleEnabled}
/>
```

### 5. MultiPlatformPostSummary
**File:** `MultiPlatformPostSummary.tsx`

Component for displaying results of multi-platform posting.

**Features:**
- Success/failure statistics
- Detailed results per platform
- Links to posted content
- Error messages with suggested actions
- Retry functionality for failed posts

**Requirements:** 7.5

**Usage:**
```tsx
<MultiPlatformPostSummary
  result={postResult}
  onClose={handleClose}
  onRetry={handleRetry}
/>
```

### 6. PlatformPresetSelector
**File:** `PlatformPresetSelector.tsx`

Component for selecting platform-specific image size presets.

**Features:**
- Platform tabs (Instagram, Twitter, Facebook, Pinterest)
- Visual preset cards with aspect ratio preview
- Current size indicator
- Preset descriptions and dimensions

**Requirements:** 2.1, 2.2, 2.3, 2.4, 2.5

**Usage:**
```tsx
<PlatformPresetSelector
  selectedPlatform={selectedPlatform}
  onPlatformChange={setSelectedPlatform}
  onPresetSelect={handlePresetSelect}
  currentWidth={1080}
  currentHeight={1080}
/>
```

### 7. Existing Components (Already Implemented)

- **SocialPostPreview** - Preview component showing how post will look on platform
- **SocialPostPreviewDialog** - Dialog wrapper for post preview
- **AccountManager** - Component for managing connected social media accounts

## Example Usage

See `ShareDialogExample.tsx` for a complete working example of the ShareDialog component.

## Testing

All components have basic rendering tests in `SocialMediaComponents.test.tsx`.

Run tests with:
```bash
npm test -- SocialMediaComponents.test.tsx
```

## Styling

All components use inline styles for portability and self-containment. Styles follow a consistent design system with:
- Primary color: #3b82f6 (blue)
- Success color: #10b981 (green)
- Error color: #ef4444 (red)
- Warning color: #f59e0b (amber)
- Neutral grays for backgrounds and borders

## Responsive Design

All components are responsive and work well on mobile devices with:
- Flexible grid layouts
- Touch-friendly button sizes
- Stacked layouts on small screens
- Horizontal scrolling for tabs where needed

## Accessibility

Components include:
- Semantic HTML elements
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus states for interactive elements
- Screen reader friendly text

## Integration

To integrate these components into your app:

1. Import the ShareDialog component
2. Provide an image data URL
3. Handle the onSuccess callback to get posting results
4. Handle the onClose callback to close the dialog

Example:
```tsx
import { ShareDialog } from './components';

function MyApp() {
  const [showShare, setShowShare] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowShare(true)}>
        Share to Social Media
      </button>
      
      {showShare && (
        <ShareDialog
          imageDataUrl={myImageDataUrl}
          initialCaption="Check this out!"
          onClose={() => setShowShare(false)}
          onSuccess={(result) => {
            console.log('Posted to', result.successCount, 'platforms');
          }}
        />
      )}
    </>
  );
}
```
