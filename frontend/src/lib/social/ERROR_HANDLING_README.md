# Social Media Error Handling

This document describes the error handling system for social media posting operations.

## Overview

The error handling system provides comprehensive error management for all social media posting operations, including:

- **Authentication Errors** (Requirement 8.1): When OAuth tokens are invalid or expired
- **Image Size Errors** (Requirement 8.2): When images exceed platform size limits
- **Rate Limit Errors** (Requirement 8.3): When API rate limits are exceeded
- **Network Errors** (Requirement 8.4): When network connectivity issues occur
- **Unknown Errors** (Requirement 8.5): For unexpected errors with support contact

## Error Types

### AuthenticationError
Thrown when authentication fails or tokens are invalid.

```typescript
const error = new AuthenticationError('instagram');
// Message: "Authentication failed for instagram. Please reconnect your account."
```

**User Actions:**
- Reconnect Account (primary)
- Cancel

### ImageSizeError
Thrown when an image exceeds the platform's size limit.

```typescript
const error = new ImageSizeError('instagram', 10485760, 8388608);
// Message: "Image size (10.00MB) exceeds instagram limit of 8MB. Please resize your image."
```

**User Actions:**
- Resize Image (primary)
- Choose Different Platform

### RateLimitError
Thrown when API rate limits are exceeded.

```typescript
const error = new RateLimitError('twitter', 300); // 300 seconds = 5 minutes
// Message: "Rate limit exceeded for twitter. Please wait 5 minutes before trying again."
```

**User Actions:**
- Retry in X minutes (primary, if retry callback provided)
- Cancel

### NetworkError
Thrown when network connectivity issues occur.

```typescript
const error = new NetworkError('facebook');
// Message: "Network error while posting to facebook. Please check your connection and try again."
```

**User Actions:**
- Retry Now (primary, if retry callback provided)
- Cancel

### UnknownSocialMediaError
Thrown for unexpected errors.

```typescript
const error = new UnknownSocialMediaError('pinterest', 'Unexpected error occurred');
```

**User Actions:**
- Contact Support (primary)
- Close

## Usage

### Basic Error Handling

```typescript
import { platformManager, errorHandler } from '../lib/social';

try {
  const result = await platformManager.postToPlatform(
    'instagram',
    preparedImage,
    'My caption',
    ['#hashtag']
  );

  if (!result.success && result.errorDetails) {
    // Display error to user
    console.log(result.errorDetails.userMessage);
    
    // Show available actions
    result.errorDetails.actions.forEach(action => {
      // Render button with action.label
      // On click: action.action()
    });
  }
} catch (error) {
  const errorDetails = errorHandler.handleError(
    error as Error,
    'instagram',
    async () => {
      // Retry callback
      await platformManager.postToPlatform(...);
    }
  );
}
```

### Parsing API Responses

```typescript
import { ErrorHandler } from '../lib/social';

const response = await fetch('/api/post');
if (!response.ok) {
  const error = ErrorHandler.fromApiResponse(
    {
      status: response.status,
      statusText: response.statusText,
      data: await response.json()
    },
    'instagram'
  );
  
  const errorDetails = errorHandler.handleError(error, 'instagram');
}
```

### Error Logging

```typescript
import { ErrorHandler } from '../lib/social';

try {
  // ... posting logic
} catch (error) {
  const formatted = ErrorHandler.formatErrorForLogging(error);
  console.error('Posting failed:', formatted);
  
  // Send to logging service
  logToService(formatted);
}
```

## Error Handling Flow

1. **Error Occurs**: During posting operation
2. **Error Classification**: Determine error type (auth, size, rate limit, network, unknown)
3. **User-Friendly Message**: Generate appropriate message for user
4. **Action Suggestions**: Provide actionable buttons (reconnect, resize, retry, etc.)
5. **Retry Logic**: If applicable, allow user to retry with appropriate delay
6. **Support Contact**: For unknown errors, provide support contact information

## Integration with PlatformManager

The `PlatformManager` automatically uses the error handler for all posting operations:

```typescript
const result = await platformManager.postToPlatform(...);

if (!result.success) {
  // result.error contains the error message
  // result.errorDetails contains the full ErrorHandlingResult
  
  if (result.errorDetails) {
    // Display user-friendly message
    showToast(result.errorDetails.userMessage);
    
    // Show action buttons
    renderActions(result.errorDetails.actions);
  }
}
```

## Custom Events

The error handler dispatches custom events for certain actions:

### Re-authentication Event
```typescript
window.addEventListener('social-media-reauth', (event) => {
  const { platform } = event.detail;
  // Trigger OAuth flow for platform
});
```

### Resize Suggestion Event
```typescript
window.addEventListener('social-media-resize', (event) => {
  const { platform, maxSize } = event.detail;
  // Show resize UI with maxSize constraint
});
```

## Testing

The error handler includes comprehensive unit tests covering:

- All error types and their properties
- Error parsing from generic errors
- API response parsing
- Error formatting for logging
- Action generation for each error type

Run tests:
```bash
npm test errorHandler.test.ts --run
```

## Example Component

See `SocialMediaErrorExample.tsx` for a complete example of error handling in a React component.
