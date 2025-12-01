# Design Document - AI Caption Generation System

## Overview

This design document outlines the technical approach for the AI Caption Generation System, which uses BLIP (Bootstrapping Language-Image Pre-training) for base image captioning and OpenAI's GPT models for generating stylistically diverse caption variants. The system provides 3-5 contextually relevant caption suggestions with different tones and styles.

The generation pipeline:
1. Image upload → Base64 encoding
2. BLIP model inference via Replicate API
3. Base caption extraction
4. LLM-powered style rewrites via OpenAI API
5. Caption variant display

## Architecture

### Component Structure

```
frontend/src/
├── lib/
│   ├── caption/
│   │   ├── captionGenerator.ts    # Main generation orchestrator
│   │   ├── replicateClient.ts     # Replicate API client
│   │   ├── openaiClient.ts        # OpenAI API client
│   │   ├── stylePrompts.ts        # Style-specific prompts
│   │   └── captionCache.ts        # Caching layer
│   └── utils/
│       ├── imageEncoder.ts        # Base64 encoding
│       └── retryHandler.ts        # Retry logic with backoff
└── components/
    ├── CaptionGenerator.tsx       # Main caption UI
    ├── CaptionCard.tsx            # Individual caption display
    └── RegenerateButton.tsx       # Regeneration control
```

### Data Flow

```
Image File → Base64 Encoder → Replicate BLIP API → Base Caption
                                                         ↓
                                                    OpenAI API → Style Variants
                                                         ↓
                                                    Caption Cache → UI Display
```

### API Integration Architecture

```
Frontend (Browser)
    ↓
Replicate API (BLIP Model)
    - Model: salesforce/blip
    - Input: Base64 image data
    - Output: Base caption string
    ↓
OpenAI API (GPT-3.5-turbo)
    - Model: gpt-3.5-turbo
    - Input: Base caption + style prompts
    - Output: JSON array of variants
    ↓
Frontend (Display)
```

## Components and Interfaces

### 1. CaptionGenerator

**Purpose**: Orchestrates the entire caption generation pipeline

**Interface**:
```typescript
interface CaptionGeneratorConfig {
  replicateApiKey: string
  openaiApiKey: string
  maxRetries: number
  timeout: number
}

interface GenerationResult {
  baseCaption: string
  variants: CaptionVariant[]
  generationTime: number
}

interface CaptionVariant {
  text: string
  style: CaptionStyle
  confidence?: number
}

type CaptionStyle = 'creative' | 'funny' | 'poetic' | 'minimal' | 'dramatic' | 'quirky'

class CaptionGenerator {
  constructor(config: CaptionGeneratorConfig)
  
  async generate(imageDataUrl: string): Promise<GenerationResult>
  async regenerate(imageDataUrl: string): Promise<GenerationResult>
  abort(): void
}
```

**Behavior**:
- Validates image format before processing
- Calls Replicate API for base caption
- Polls for BLIP model completion
- Calls OpenAI API for style rewrites
- Returns structured result with timing info
- Handles errors and timeouts gracefully

### 2. ReplicateClient

**Purpose**: Manages communication with Replicate API

**Interface**:
```typescript
interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed'
  output?: string
  error?: string
}

class ReplicateClient {
  constructor(apiKey: string)
  
  async createPrediction(imageDataUrl: string): Promise<ReplicatePrediction>
  async getPrediction(predictionId: string): Promise<ReplicatePrediction>
  async waitForCompletion(predictionId: string, timeout: number): Promise<string>
  cancelPrediction(predictionId: string): Promise<void>
}
```

**BLIP Model Configuration**:
- Model version: `salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746`
- Task: `image_captioning`
- Input format: Base64 data URL or public URL
- Polling interval: 1000ms
- Max polling attempts: 30 (30 seconds)

**Behavior**:
- Creates prediction with image input
- Polls status until completion or timeout
- Extracts caption from output
- Handles API errors and rate limits
- Implements exponential backoff on retries

### 3. OpenAIClient

**Purpose**: Manages communication with OpenAI API for caption rewrites

**Interface**:
```typescript
interface OpenAIConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

interface RewriteRequest {
  baseCaption: string
  styles: CaptionStyle[]
  maxLength: number
}

class OpenAIClient {
  constructor(config: OpenAIConfig)
  
  async rewriteCaption(request: RewriteRequest): Promise<CaptionVariant[]>
  async streamRewrite(request: RewriteRequest): AsyncGenerator<CaptionVariant>
}
```

**OpenAI Configuration**:
- Model: `gpt-3.5-turbo`
- Temperature: 0.8 (creative but controlled)
- Max tokens: 150 (sufficient for 5 captions)
- Response format: JSON array

**Behavior**:
- Constructs style-specific prompts
- Requests JSON-formatted response
- Parses and validates response structure
- Handles malformed JSON gracefully
- Implements retry logic for failures

### 4. StylePrompts

**Purpose**: Defines prompts for each caption style

**Interface**:
```typescript
interface StylePrompt {
  style: CaptionStyle
  systemPrompt: string
  userPromptTemplate: string
  examples: string[]
}

class StylePrompts {
  static getPrompt(style: CaptionStyle, baseCaption: string): string
  static getAllStyles(): CaptionStyle[]
  static getStyleDescription(style: CaptionStyle): string
}
```

**Style Definitions**:

- **Creative**: Imaginative, artistic language with metaphors
  - Prompt: "Rewrite this caption with imaginative, artistic language. Use vivid imagery and creative metaphors."
  
- **Funny**: Humorous, playful tone with wit
  - Prompt: "Rewrite this caption with humor and wit. Make it playful and entertaining."
  
- **Poetic**: Lyrical, metaphorical language with rhythm
  - Prompt: "Rewrite this caption poetically. Use lyrical language, metaphors, and rhythm."
  
- **Minimal**: Concise, impactful phrasing
  - Prompt: "Rewrite this caption minimally. Use the fewest words possible while maintaining impact."
  
- **Dramatic**: Intense, emotional language
  - Prompt: "Rewrite this caption dramatically. Use intense, emotional language that evokes strong feelings."
  
- **Quirky**: Unconventional, whimsical tone
  - Prompt: "Rewrite this caption quirkily. Use unconventional, whimsical language that's unexpected."

### 5. CaptionCache

**Purpose**: Caches generated captions to avoid redundant API calls

**Interface**:
```typescript
interface CacheEntry {
  imageHash: string
  result: GenerationResult
  timestamp: number
}

class CaptionCache {
  constructor(maxSize: number, ttl: number)
  
  set(imageHash: string, result: GenerationResult): void
  get(imageHash: string): GenerationResult | null
  has(imageHash: string): boolean
  clear(): void
  prune(): void
}
```

**Caching Strategy**:
- Hash images using SHA-256 of first 10KB
- Cache up to 50 entries
- TTL: 1 hour
- LRU eviction policy
- Clear on page refresh

## Data Models

### GenerationState

```typescript
interface GenerationState {
  status: 'idle' | 'generating-base' | 'generating-variants' | 'complete' | 'error'
  baseCaption: string | null
  variants: CaptionVariant[]
  error: string | null
  progress: number // 0-100
}
```

### APIError

```typescript
interface APIError {
  type: 'replicate' | 'openai' | 'network' | 'timeout' | 'rate-limit'
  message: string
  retryable: boolean
  retryAfter?: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Caption count consistency
*For any* successful generation, the result should contain exactly 1 base caption plus 3-5 style variants (total 4-6 captions)
**Validates: Requirements 1.4**

### Property 2: Style diversity
*For any* set of generated variants, no two captions should have identical text (case-insensitive comparison)
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: Caption length bounds
*For any* generated caption, the character count should be between 10 and 100 characters inclusive
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 4: Base caption preservation
*For any* generation result, the base caption should be the first element in the returned array
**Validates: Requirements 5.3**

### Property 5: Timeout enforcement
*For any* API call (Replicate or OpenAI), if the response time exceeds the configured timeout, an error should be thrown within 1 second of timeout
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Retry idempotency
*For any* failed API call that is retried, the final result (if successful) should be equivalent to a first-attempt success
**Validates: Requirements 4.1, 4.2**

### Property 7: Cache hit consistency
*For any* image that has been processed before, if the cache contains a valid entry, the returned result should match the cached result exactly
**Validates: Requirements 6.2**

### Property 8: Error message clarity
*For any* error condition, the error message should be user-friendly (no raw API errors or stack traces)
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 9: Subject matter preservation
*For any* base caption containing specific objects or scenes, all style variants should reference the same core subject matter
**Validates: Requirements 7.2, 7.3**

### Property 10: Style label accuracy
*For any* caption variant, the assigned style label should match the tone and language characteristics of that style's definition
**Validates: Requirements 5.2**

### Property 11: Regeneration independence
*For any* image, regenerating captions should produce different variants than the original generation (not cached)
**Validates: Requirements 6.1, 6.3**

### Property 12: Concurrent request handling
*For any* sequence of rapid generation requests, each request should complete independently without interfering with others
**Validates: Requirements 3.5**

## Error Handling

### Replicate API Errors

**Connection Failures**:
- Retry up to 3 times with exponential backoff
- Display: "Unable to connect to caption service. Retrying..."
- After max retries: "Caption generation unavailable. Please try again later."

**Rate Limiting**:
- Parse `Retry-After` header
- Display: "Too many requests. Please wait {seconds} seconds."
- Disable regenerate button until retry time passes

**Model Failures**:
- Log error details to console
- Display: "Caption generation failed. Please try a different image."
- Offer regenerate option

**Timeout**:
- Cancel pending request
- Display: "Caption generation timed out. Please try again."
- Offer regenerate option

### OpenAI API Errors

**Connection Failures**:
- Retry up to 2 times
- Display: "Generating caption variations..."
- Fallback: Return base caption with simple variations

**Rate Limiting**:
- Display: "Service busy. Please wait a moment."
- Retry after delay

**Invalid Response**:
- Parse JSON carefully
- If malformed, extract text manually
- Display: "Some caption variations may be incomplete."

**Content Policy Violations**:
- Display: "Unable to generate variations for this image."
- Return base caption only

### Network Errors

**Offline Detection**:
- Check `navigator.onLine`
- Display: "No internet connection. Please check your network."
- Disable generation until online

**CORS Errors**:
- Log to console for debugging
- Display: "Configuration error. Please contact support."

### Input Validation Errors

**Invalid Image Format**:
- Check file type before processing
- Display: "Unsupported image format. Please use JPG or PNG."

**Image Too Large**:
- Check file size (max 10MB)
- Display: "Image too large. Please use an image under 10MB."

**Empty Image**:
- Validate image has content
- Display: "Invalid image file. Please try another."

## Testing Strategy

### Unit Tests

**CaptionGenerator**:
- Test successful generation flow
- Test error handling for each API
- Test timeout behavior
- Test abort functionality

**ReplicateClient**:
- Test prediction creation
- Test polling logic
- Test completion detection
- Test error parsing

**OpenAIClient**:
- Test prompt construction for each style
- Test JSON response parsing
- Test malformed response handling
- Test retry logic

**StylePrompts**:
- Test prompt generation for each style
- Test style description retrieval
- Test prompt template interpolation

**CaptionCache**:
- Test cache hit/miss
- Test LRU eviction
- Test TTL expiration
- Test cache clearing

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

**Property 1: Caption count consistency**
- Generate random images
- Call generation function
- Count returned captions
- Verify count is 4-6

**Property 2: Style diversity**
- Generate random base captions
- Generate variants
- Compare all pairs of captions
- Verify no duplicates (case-insensitive)

**Property 3: Caption length bounds**
- Generate random images
- Generate captions
- Measure character count of each
- Verify 10 ≤ length ≤ 100

**Property 4: Base caption preservation**
- Generate random images
- Generate captions
- Verify first element is base caption
- Verify base caption unchanged in variants

**Property 5: Timeout enforcement**
- Mock API with random delays
- Set various timeout values
- Verify error thrown within 1s of timeout

**Property 6: Retry idempotency**
- Mock API with random failures
- Enable retries
- Compare successful retry result with first-attempt success
- Verify equivalence

**Property 7: Cache hit consistency**
- Generate random images
- Generate captions (cache miss)
- Generate again (cache hit)
- Verify results are identical

**Property 8: Error message clarity**
- Generate random error conditions
- Capture error messages
- Verify no stack traces or raw API errors
- Verify messages are user-friendly

**Property 9: Subject matter preservation**
- Generate random base captions with specific subjects
- Generate style variants
- Extract subject nouns from all captions
- Verify core subjects appear in all variants

**Property 10: Style label accuracy**
- Generate random base captions
- Generate variants for each style
- Analyze language characteristics
- Verify matches style definition

**Property 11: Regeneration independence**
- Generate random images
- Generate captions
- Regenerate captions
- Verify variants are different

**Property 12: Concurrent request handling**
- Generate random sequences of requests
- Execute concurrently
- Verify all complete successfully
- Verify no interference between requests

### Integration Tests

**Full Generation Pipeline**:
- Upload real image
- Generate captions
- Verify base caption is relevant
- Verify variants have different styles
- Verify all captions are appropriate length

**API Integration**:
- Test with real Replicate API
- Test with real OpenAI API
- Verify responses are valid
- Verify error handling works

**Cache Integration**:
- Generate captions for image
- Clear UI but keep cache
- Generate again
- Verify instant return from cache

**Error Recovery**:
- Simulate network failures
- Verify retry logic works
- Verify user sees appropriate messages
- Verify system recovers gracefully

## Implementation Notes

### API Key Security

**Environment Variables**:
```typescript
// vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.VITE_REPLICATE_API_TOKEN': JSON.stringify(process.env.VITE_REPLICATE_API_TOKEN),
    'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY)
  }
})
```

**Security Considerations**:
- Never commit API keys to version control
- Use `.env.local` for local development
- Use environment variables in production
- Consider backend proxy for production (keys not exposed)

### Polling Strategy

**Replicate Polling**:
```typescript
async function pollForCompletion(predictionId: string): Promise<string> {
  const maxAttempts = 30
  const pollInterval = 1000 // 1 second
  
  for (let i = 0; i < maxAttempts; i++) {
    const prediction = await getPrediction(predictionId)
    
    if (prediction.status === 'succeeded') {
      return prediction.output
    }
    
    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Prediction failed')
    }
    
    await sleep(pollInterval)
  }
  
  throw new Error('Timeout waiting for prediction')
}
```

### Retry Logic with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (!isRetryable(error)) {
        throw error
      }
      
      const delay = Math.min(1000 * Math.pow(2, i), 10000)
      await sleep(delay)
    }
  }
  
  throw lastError!
}
```

### Image Hashing for Cache

```typescript
async function hashImage(file: File): Promise<string> {
  // Read first 10KB for fast hashing
  const chunk = file.slice(0, 10240)
  const buffer = await chunk.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

### OpenAI Prompt Engineering

**System Prompt**:
```
You are a creative caption writer. Generate short, engaging captions for images.
Keep captions under 100 characters. Return results as a JSON array of strings.
```

**User Prompt Template**:
```
Base caption: "{baseCaption}"

Rewrite this caption in the following styles:
1. Creative: Use imaginative, artistic language
2. Funny: Add humor and wit
3. Poetic: Use lyrical, metaphorical language
4. Minimal: Use fewest words possible
5. Dramatic: Use intense, emotional language

Return as JSON array: ["creative caption", "funny caption", ...]
```

### Performance Optimization

- Use `AbortController` for cancellable requests
- Implement request deduplication (same image uploaded twice)
- Cache API responses in memory
- Lazy load caption generation (only when needed)
- Prefetch captions in background after image upload

### Browser Compatibility

- Use `fetch` API (widely supported)
- Polyfill `AbortController` for older browsers
- Handle CORS properly
- Test in Chrome, Firefox, Safari
- Test on mobile browsers

### Accessibility

- Announce caption generation status to screen readers
- Provide loading indicators
- Use semantic HTML for caption display
- Ensure keyboard navigation works
- Provide skip option for slow connections

### Cost Optimization

- Cache aggressively to reduce API calls
- Use GPT-3.5-turbo (cheaper than GPT-4)
- Limit caption length to reduce tokens
- Batch requests when possible
- Monitor API usage and set budgets

### Rate Limiting

**Client-Side Rate Limiting**:
```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private requestsPerMinute = 10
  
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      this.process()
    })
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    const fn = this.queue.shift()!
    
    await fn()
    await sleep(60000 / this.requestsPerMinute)
    
    this.processing = false
    this.process()
  }
}
```

### Monitoring and Logging

- Log API response times
- Track success/failure rates
- Monitor cache hit rates
- Log error types and frequencies
- Track user regeneration patterns
