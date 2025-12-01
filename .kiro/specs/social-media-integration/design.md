# Design Document - Social Media Integration

## Overview

Technical approach for direct sharing to social platforms with platform-specific presets and hashtag suggestions.

## Architecture

```
frontend/src/lib/social/
├── platformManager.ts        # Platform integration
├── oauthHandler.ts           # Authentication
├── platformPresets.ts        # Size presets
├── hashtagGenerator.ts       # Hashtag suggestions
└── postScheduler.ts          # Scheduled posting
```

## Correctness Properties

### Property 1: Platform preset dimensions
*For any* platform preset, the canvas dimensions should match the platform's recommended size exactly
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 2: Hashtag validation
*For any* generated or custom hashtag, it should start with # and contain no spaces
**Validates: Requirements 3.4**

### Property 3: Multi-platform consistency
*For any* multi-platform post, the image content should be identical across all platforms
**Validates: Requirements 7.2, 7.3**

### Property 4: OAuth token security
*For any* connected account, the OAuth token should never be exposed in client-side logs or errors
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 5: Schedule validation
*For any* scheduled post, the scheduled time should be in the future
**Validates: Requirements 5.2**

Property-based testing library: **fast-check** (JavaScript/TypeScript)
