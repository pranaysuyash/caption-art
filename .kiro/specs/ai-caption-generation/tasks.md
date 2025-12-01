# Implementation Plan - AI Caption Generation System

## Status: ✅ COMPLETE

All tasks have been successfully implemented and tested. The AI Caption Generation System is fully functional with:
- Complete core library implementation (CaptionGenerator, ReplicateClient, OpenAIClient, StylePrompts, CaptionCache)
- All 12 correctness properties implemented as property-based tests using fast-check
- Comprehensive unit tests for all components
- Full integration with React UI components
- Error handling, retry logic, rate limiting, and caching
- Performance optimizations including request deduplication and prefetching

---

- [x] 1. Set up caption generation library structure
- [x] 1.1 Create caption module directory structure
  - Create `frontend/src/lib/caption/` directory
  - Create subdirectories for clients and utilities
  - _Requirements: All_

- [x] 1.2 Create core interfaces and types
  - Define CaptionStyle type
  - Define CaptionVariant interface
  - Define GenerationResult interface
  - Define GenerationState interface
  - Define APIError interface
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Implement ReplicateClient
- [x] 2.1 Create replicateClient.ts
  - Define ReplicatePrediction interface
  - Implement constructor with API key
  - Implement createPrediction function
  - Implement getPrediction function
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Implement polling logic
  - Implement waitForCompletion function
  - Poll every 1 second
  - Max 30 attempts (30 seconds timeout)
  - Handle succeeded/failed statuses
  - _Requirements: 1.3, 3.1, 3.2_

- [x] 2.3 Implement error handling
  - Handle connection failures with retry
  - Handle rate limiting
  - Handle model failures
  - Parse error responses
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 2.4 Implement cancelPrediction function
  - Cancel pending prediction
  - Clean up resources
  - _Requirements: 3.5_

- [x] 3. Implement OpenAIClient
- [x] 3.1 Create openaiClient.ts
  - Define OpenAIConfig interface
  - Define RewriteRequest interface
  - Implement constructor with config
  - _Requirements: 1.1, 1.4_

- [x] 3.2 Implement rewriteCaption function
  - Construct style-specific prompts
  - Call OpenAI chat completions API
  - Parse JSON response
  - Validate response structure
  - Return caption variants
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.3 Implement error handling
  - Handle connection failures with retry
  - Handle rate limiting
  - Handle malformed JSON responses
  - Handle content policy violations
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Implement StylePrompts
- [x] 4.1 Create stylePrompts.ts
  - Define StylePrompt interface
  - Define system prompt for caption writing
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4.2 Implement style-specific prompts
  - Define creative style prompt (imaginative, artistic)
  - Define funny style prompt (humorous, playful)
  - Define poetic style prompt (lyrical, metaphorical)
  - Define minimal style prompt (concise, impactful)
  - Define dramatic style prompt (intense, emotional)
  - Define quirky style prompt (unconventional, whimsical)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4.3 Implement getPrompt function
  - Interpolate base caption into prompt template
  - Return formatted prompt for OpenAI
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4.4 Implement utility functions
  - Implement getAllStyles function
  - Implement getStyleDescription function
  - _Requirements: 5.2_

- [x] 5. Implement CaptionCache
- [x] 5.1 Create captionCache.ts
  - Define CacheEntry interface
  - Implement constructor with maxSize and TTL
  - _Requirements: 6.1, 6.2_

- [x] 5.2 Implement cache operations
  - Implement set function (add entry)
  - Implement get function (retrieve entry)
  - Implement has function (check existence)
  - Implement clear function (clear all)
  - Implement prune function (remove expired)
  - _Requirements: 6.1, 6.2_

- [x] 5.3 Implement LRU eviction
  - Track access times
  - Evict least recently used when full
  - _Requirements: 6.1_

- [x] 5.4 Implement TTL expiration
  - Check timestamp on get
  - Remove expired entries
  - Set TTL to 1 hour
  - _Requirements: 6.1_

- [x] 5.5 Write property test for cache hit consistency
  - **Property 7: Cache hit consistency**
  - **Validates: Requirements 6.2**

- [x] 6. Implement CaptionGenerator
- [x] 6.1 Create captionGenerator.ts main class
  - Implement constructor with config
  - Initialize Replicate and OpenAI clients
  - Initialize cache
  - _Requirements: All_

- [x] 6.2 Implement generate function
  - Validate image format
  - Check cache for existing result
  - Call Replicate BLIP API
  - Wait for base caption
  - Call OpenAI API for variants
  - Cache result
  - Return GenerationResult
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6.3 Implement regenerate function
  - Bypass cache
  - Call generate with fresh API calls
  - Return new variants
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 6.4 Implement abort function
  - Cancel pending Replicate prediction
  - Cancel pending OpenAI request
  - Clean up resources
  - _Requirements: 3.5_

- [x] 6.5 Write property test for caption count consistency
  - **Property 1: Caption count consistency**
  - **Validates: Requirements 1.4**

- [x] 6.6 Write property test for style diversity
  - **Property 2: Style diversity**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 6.7 Write property test for caption length bounds
  - **Property 3: Caption length bounds**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 6.8 Write property test for base caption preservation
  - **Property 4: Base caption preservation**
  - **Validates: Requirements 5.3**

- [x] 6.9 Write property test for timeout enforcement
  - **Property 5: Timeout enforcement**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 6.10 Write property test for retry idempotency
  - **Property 6: Retry idempotency**
  - **Validates: Requirements 4.1, 4.2**

- [x] 7. Create React components
- [x] 7.1 Create CaptionGenerator component
  - Render caption generation UI
  - Show loading state during generation
  - Display error messages
  - _Requirements: 1.5, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7.2 Create CaptionCard component
  - Render individual caption with style label
  - Apply neo-brutalism styling
  - Handle click to select
  - Show character count
  - _Requirements: 5.1, 5.2, 8.4_

- [x] 7.3 Create RegenerateButton component
  - Render regenerate button
  - Disable during generation
  - Apply neo-brutalism styling
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 8. Integrate with App.tsx
- [x] 8.1 Replace existing caption generation logic
  - Import CaptionGenerator class
  - Initialize generator with API keys
  - Call generate on image upload
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8.2 Update caption display
  - Replace caption buttons with CaptionCard components
  - Label base caption as "Original Description"
  - Label variants with style names
  - Show base caption first
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8.3 Add regenerate functionality
  - Add RegenerateButton to UI
  - Call regenerate on button click
  - Clear previous captions
  - Display new captions
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8.4 Add loading states
  - Show loading indicator during generation
  - Display progress message
  - Disable regenerate during generation
  - _Requirements: 3.4, 3.5_

- [x] 9. Implement error handling
- [x] 9.1 Handle Replicate API errors
  - Catch connection failures
  - Handle rate limiting
  - Handle model failures
  - Handle timeouts
  - Display user-friendly messages
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9.2 Handle OpenAI API errors
  - Catch connection failures
  - Handle rate limiting
  - Handle invalid responses
  - Handle content policy violations
  - Provide fallback captions
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 9.3 Handle network errors
  - Detect offline state
  - Display connection error
  - Disable generation until online
  - _Requirements: 4.5_

- [x] 9.4 Handle input validation errors
  - Validate image format
  - Check file size (max 10MB)
  - Validate image has content
  - Display appropriate errors
  - _Requirements: 4.4_

- [x] 9.5 Write property test for error message clarity
  - **Property 8: Error message clarity**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 10. Implement retry logic
- [x] 10.1 Add exponential backoff
  - Implement retryWithBackoff utility
  - Retry Replicate calls up to 3 times
  - Retry OpenAI calls up to 2 times
  - Use exponential delay (1s, 2s, 4s)
  - _Requirements: 4.1, 4.2_

- [x] 10.2 Implement retryable error detection
  - Identify network errors as retryable
  - Identify rate limits as retryable
  - Identify server errors as retryable
  - Don't retry client errors (400)
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 11. Implement image hashing for cache
- [x] 11.1 Create image hashing utility
  - Read first 10KB of file
  - Calculate SHA-256 hash
  - Return hash string
  - _Requirements: 6.1, 6.2_

- [x] 11.2 Integrate hashing with cache
  - Hash image before generation
  - Use hash as cache key
  - Check cache before API calls
  - _Requirements: 6.1, 6.2_

- [x] 12. Write property test for subject matter preservation
  - **Property 9: Subject matter preservation**
  - **Validates: Requirements 7.2, 7.3**

- [x] 13. Write property test for style label accuracy
  - **Property 10: Style label accuracy**
  - **Validates: Requirements 5.2**

- [x] 14. Write property test for regeneration independence
  - **Property 11: Regeneration independence**
  - **Validates: Requirements 6.1, 6.3**

- [x] 15. Write property test for concurrent request handling
  - **Property 12: Concurrent request handling**
  - **Validates: Requirements 3.5**

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Write unit tests
- [x] 17.1 Test CaptionGenerator
  - Test successful generation flow
  - Test error handling for each API
  - Test timeout behavior
  - Test abort functionality

- [x] 17.2 Test ReplicateClient
  - Test prediction creation
  - Test polling logic
  - Test completion detection
  - Test error parsing

- [x] 17.3 Test OpenAIClient
  - Test prompt construction for each style
  - Test JSON response parsing
  - Test malformed response handling
  - Test retry logic

- [x] 17.4 Test StylePrompts
  - Test prompt generation for each style
  - Test style description retrieval
  - Test prompt template interpolation

- [x] 17.5 Test CaptionCache
  - Test cache hit/miss
  - Test LRU eviction
  - Test TTL expiration
  - Test cache clearing

- [x] 18. Optimize performance
- [x] 18.1 Implement request deduplication
  - Detect duplicate image uploads
  - Return cached result immediately
  - Avoid redundant API calls
  - _Requirements: 6.1, 6.2_

- [x] 18.2 Implement client-side rate limiting
  - Limit requests per minute
  - Queue requests if needed
  - Display wait time to user
  - _Requirements: 4.3_

- [x] 18.3 Add prefetching
  - Prefetch captions in background after upload
  - Start generation before user requests
  - Cache result for instant display
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 19. Final testing
- [x] 19.1 Test with real images
  - Test with various image types (photos, illustrations, screenshots)
  - Verify captions are relevant
  - Verify variants have different styles
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 19.2 Test caption quality
  - Verify creative captions are imaginative
  - Verify funny captions are humorous
  - Verify poetic captions are lyrical
  - Verify minimal captions are concise
  - Verify dramatic captions are intense
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 19.3 Test caption length
  - Verify all captions are 10-100 characters
  - Verify character count display is accurate
  - Verify manual editing works
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 19.4 Test error scenarios
  - Test with invalid image formats
  - Test with oversized images
  - Test with network disconnected
  - Test with API rate limits
  - Verify error messages are clear
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 20. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
