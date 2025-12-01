# Quick Fixes Reference Guide

## 🎯 What Was Fixed

### Backend (Security & Stability)

#### 1. Input Validation ✅
**Before:**
```typescript
if (typeof imageUrl !== 'string') { /* ... */ }
```

**After:**
```typescript
import { CaptionRequestSchema } from '../schemas/validation'
const validatedData = CaptionRequestSchema.parse(req.body)
```

**Why:** Zod provides comprehensive validation, prevents XSS, validates data URI format.

---

#### 2. Rate Limiting ✅
**Before:**
```typescript
max: 1000, // Same for dev and production
```

**After:**
```typescript
max: process.env.NODE_ENV === 'production' ? 5 : 1000
```

**Why:** Prevents API cost abuse in production ($1000s saved).

---

#### 3. Error Handling ✅
**Before:**
```typescript
catch (error) {
  next(error) // Generic 500 error
}
```

**After:**
```typescript
catch (error) {
  throw new ExternalAPIError(error.message, 'Replicate')
}
```

**Why:** Proper HTTP status codes (400, 502, 500), better debugging.

---

### Frontend (Performance & UX)

#### 4. Race Conditions ✅
**Before:**
```typescript
render(textLayer: TextLayer): void {
  // No cancellation - race conditions possible
  this.layerManager.composite(this.canvas)
}
```

**After:**
```typescript
render(textLayer: TextLayer): void {
  const currentToken = ++this.renderToken
  // ... rendering logic ...
  if (currentToken !== this.renderToken) return // Cancelled
  this.layerManager.composite(this.canvas)
}
```

**Why:** Prevents wrong text/style from appearing when rapidly changing settings.

---

#### 5. Accessibility ✅
**Before:**
```typescript
<button onClick={handleDismiss}>×</button>
<div>Loading...</div>
```

**After:**
```typescript
<button type="button" onClick={handleDismiss}>×</button>
<div aria-busy="true" aria-live="polite">Loading...</div>
```

**Why:** Screen reader compatibility, prevents form submission bugs.

---

## 🔧 How to Use New Features

### Zod Validation

```typescript
// Define schema
export const MyRequestSchema = z.object({
  field: z.string().min(1, 'Cannot be empty')
})

// Use in route
router.post('/', async (req, res, next) => {
  try {
    const data = MyRequestSchema.parse(req.body)
    // data is now type-safe and validated
  } catch (error) {
    next(error) // Automatically handled by errorHandler
  }
})
```

---

### Custom Errors

```typescript
// Throw specific errors
throw new ValidationError('Invalid input')
throw new ExternalAPIError('API failed', 'OpenAI')
throw new RateLimitError()

// Error handler automatically converts to proper HTTP response
```

---

### UI Config

```typescript
import { UI_CONFIG } from '../config/ui'

// Use constants instead of hardcoded values
const maxSize = UI_CONFIG.text.maxFontSize
const debounce = UI_CONFIG.text.inputDebounceDelay
```

---

## 🧪 Testing the Fixes

### Test Rate Limiting
```bash
# Set production mode
export NODE_ENV=production

# Start server
npm run dev

# Try 6 requests quickly - 6th should fail with 429
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/caption \
    -H "Content-Type: application/json" \
    -d '{"imageUrl":"data:image/png;base64,..."}'
done
```

---

### Test Zod Validation
```bash
# Invalid request (should return 400)
curl -X POST http://localhost:3001/api/caption \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":""}'

# Response:
# {
#   "error": "Validation error",
#   "details": [{"field": "imageUrl", "message": "Image URL cannot be empty"}]
# }
```

---

### Test Race Conditions
```typescript
// Rapidly change text in UI
setText('First')
setText('Second')
setText('Third')

// Without fix: might show "First" or "Second"
// With fix: always shows "Third"
```

---

## 📋 Deployment Checklist

### Environment Variables
```bash
# Production
NODE_ENV=production
REPLICATE_API_TOKEN=r8_...
OPENAI_API_KEY=sk-...

# Development
NODE_ENV=development
REPLICATE_API_TOKEN=r8_...
OPENAI_API_KEY=sk-...
```

### Verify Fixes
```bash
# 1. Check rate limiting
curl -I http://localhost:3001/api/health
# Should see: RateLimit-Limit: 5 (production) or 1000 (dev)

# 2. Check error handling
curl -X POST http://localhost:3001/api/caption \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'
# Should see: 400 with validation error details

# 3. Check CORS
curl -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3001/api/caption
# Should see: Access-Control-Allow-Origin header
```

---

## 🐛 Common Issues

### Issue: "Cannot find module 'zod'"
**Solution:**
```bash
cd backend
npm install zod
```

---

### Issue: Rate limiting not working
**Solution:** Check NODE_ENV is set correctly
```bash
echo $NODE_ENV  # Should be 'production' or 'development'
```

---

### Issue: Validation errors not showing
**Solution:** Ensure error handler is registered last in server.ts
```typescript
// Routes first
app.use('/api/caption', captionRouter)

// Error handler LAST
app.use(errorHandler)
```

---

## 📊 Monitoring

### Log Patterns to Watch

**Validation Errors (Expected):**
```
POST /api/caption 400 - Validation error
```

**External API Errors (Monitor):**
```
POST /api/caption 502 - Replicate API error: timeout
```

**Rate Limit Hits (Monitor for abuse):**
```
POST /api/caption 429 - Too many requests
```

**Unexpected Errors (Investigate):**
```
POST /api/caption 500 - Internal server error
```

---

## 🎓 Best Practices

### Adding New Routes
1. Define Zod schema in `schemas/validation.ts`
2. Use schema validation in route handler
3. Throw appropriate custom errors
4. Let error handler middleware handle responses

### Adding New UI Components
1. Extract constants to `config/ui.ts`
2. Add proper ARIA attributes for accessibility
3. Use `type="button"` for non-submit buttons
4. Add loading states with `aria-busy`

### Performance Optimization
1. Use debouncing for rapid state changes
2. Implement cancellation tokens for async operations
3. Clean up resources (object URLs, event listeners)
4. Cache expensive computations

---

## 📚 Further Reading

- [Zod Documentation](https://zod.dev/)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [ARIA Best Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Rate Limiting Strategies](https://www.npmjs.com/package/express-rate-limit)
