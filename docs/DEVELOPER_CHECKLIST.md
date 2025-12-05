# Developer Checklist - Caption Art

## 🔧 Setup Verification

### Environment Setup

- [ ] Node.js >= 18.x installed
- [ ] npm >= 9.x installed
- [ ] Git configured
- [ ] Code editor with TypeScript support

### Repository Setup

```bash
# Clone
git clone <repo-url>
cd caption-art

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### Environment Variables

- [ ] `backend/.env` exists with all required keys:

  - [ ] `REPLICATE_API_TOKEN` (from https://replicate.com/account/api-tokens)
  - [ ] `OPENAI_API_KEY` (from https://platform.openai.com/api-keys)
  - [ ] `NODE_ENV=development`
  - [ ] `PORT=3001`

- [ ] `frontend/.env.local` exists with:
  - [ ] `VITE_API_BASE=http://localhost:3001`
  - [ ] NO API keys (security)

### Verification

```bash
# Run fix verification
npm run verify-fixes

# Expected: ✅ All critical fixes verified successfully!
```

---

## 🚀 Development Workflow

### Starting Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev

# Should see:
# [server] Server running on http://localhost:3001
# [server] Environment: development
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev

# Should see:
# VITE v5.x.x  ready in Xms
# ➜  Local:   http://localhost:5173/
```

### Accessing the Application

- [ ] Frontend: http://localhost:5173
- [ ] Backend API: http://localhost:3001
- [ ] Health Check: http://localhost:3001/health

---

## ✅ Pre-Commit Checklist

### Code Quality

- [ ] No console.logs in production code (except in catch blocks)
- [ ] TypeScript errors resolved for changed files
- [ ] Proper error handling added
- [ ] Comments added for complex logic

### Testing

- [ ] Run `npm run verify-fixes` - all passing
- [ ] Manual test of changed features
- [ ] Check for regression in existing features
- [ ] Test in different browsers if UI changes

### Security

- [ ] No API keys committed
- [ ] No sensitive data in logs
- [ ] Input validation added where needed
- [ ] Authentication checks in place

### Documentation

- [ ] Update IMPLEMENTATION_FIXES.md if adding features
- [ ] Update README.md if changing setup
- [ ] Add inline code comments for complex logic
- [ ] Update type definitions if changing APIs

---

## 🐛 Debugging Checklist

### Frontend Issues

**Caption generation fails:**

```bash
# Check network tab in DevTools
# Look for failed /api/caption request
# Verify request body includes `imageUrl` not `s3Key`

# Check console for errors
# Should see detailed error messages
```

**App crashes:**

```bash
# Check if ErrorBoundary is catching it
# Should show "Something went wrong" screen
# Check browser console for error details
```

**Images not uploading:**

```bash
# Check file size (max 10MB)
# Check file type (JPG, PNG, GIF)
# Verify S3 presigned URL is generated
# Check network tab for PUT request to S3
```

### Backend Issues

**API calls failing:**

```bash
# Check backend logs
cd backend && npm run dev

# Verify API keys are set
cat backend/.env | grep API_KEY

# Test endpoint directly
curl -X POST http://localhost:3001/api/caption \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/test.jpg", "tone": "default"}'
```

**Server won't start:**

```bash
# Check port availability
lsof -i :3001

# Kill existing process if needed
kill -9 <PID>

# Check environment variables
cat backend/.env

# Check for syntax errors
cd backend && npm run build
```

---

## 🧪 Testing Checklist

### Manual Testing

**Upload Flow:**

- [ ] Drag and drop image
- [ ] Click to select image
- [ ] Test with JPG
- [ ] Test with PNG
- [ ] Test with GIF
- [ ] Test with large file (>10MB) - should reject
- [ ] Test with non-image (PDF) - should reject

**Caption Generation:**

- [ ] Select "default" tone
- [ ] Select "witty" tone
- [ ] Select "inspirational" tone
- [ ] Select "formal" tone
- [ ] Click "Generate"
- [ ] Verify captions appear
- [ ] Copy caption to clipboard
- [ ] Select different caption

**Canvas Operations:**

- [ ] Text displays correctly
- [ ] Drag text around canvas
- [ ] Change font size
- [ ] Change text style preset
- [ ] Mask applied correctly (text behind subject)
- [ ] Download image with caption

**Error Handling:**

- [ ] Disconnect internet → Should show error
- [ ] Upload invalid file → Should show error
- [ ] API rate limit → Should show error
- [ ] Canvas crash → Should show ErrorBoundary

**Authentication:**

- [ ] Visit / without login → Redirects to /playground
- [ ] Can use playground without login
- [ ] Agency routes require login
- [ ] Login redirects to /agency/workspaces

### Automated Testing

```bash
# Run verification
npm run verify-fixes

# Run backend tests (if available)
cd backend && npm test

# Run frontend tests (if available)
cd frontend && npm test
```

---

## 📦 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No console errors in production build
- [ ] Environment variables documented
- [ ] API keys in secure storage (AWS Secrets Manager, etc.)
- [ ] CORS configured for production domains
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry, etc.)

### Build Verification

```bash
# Build backend
cd backend && npm run build
# Should complete without errors

# Build frontend
cd frontend && npm run build
# Should complete without errors
```

### Production Environment Variables

- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` set to frontend domain
- [ ] `API_BASE` set to production backend URL
- [ ] All API keys in secure vault
- [ ] Database connection string (if applicable)

### Post-Deployment

- [ ] Health check endpoint responding
- [ ] Frontend loads correctly
- [ ] Test upload flow
- [ ] Test caption generation
- [ ] Check error logs
- [ ] Verify API keys not exposed

---

## 🔍 Code Review Checklist

### General

- [ ] Code follows existing patterns
- [ ] No obvious bugs or logic errors
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable

### Frontend

- [ ] Components are properly typed
- [ ] No prop drilling (use context if needed)
- [ ] Error boundaries in place
- [ ] Loading states shown
- [ ] Proper cleanup in useEffect

### Backend

- [ ] Input validation with Zod schemas
- [ ] Proper error responses
- [ ] Authentication checks
- [ ] Rate limiting applied
- [ ] Logging for important operations

### Security

- [ ] No hardcoded secrets
- [ ] Input sanitization
- [ ] XSS prevention
- [ ] CSRF protection (if applicable)
- [ ] SQL injection prevention (if using DB)

---

## 📊 Performance Checklist

### Frontend

- [ ] Images optimized before upload
- [ ] Lazy loading for heavy components
- [ ] Debouncing for frequent operations
- [ ] Canvas rendering optimized
- [ ] No unnecessary re-renders

### Backend

- [ ] Response times < 2s for caption generation
- [ ] Caching for repeated requests
- [ ] Connection pooling (if using DB)
- [ ] Async processing for heavy operations
- [ ] Rate limiting to prevent abuse

---

## 🎯 Feature Checklist

### Consumer Features (Playground)

- [x] Image upload (drag & drop, click)
- [x] Caption generation with tones
- [x] Text styling presets
- [x] Download with caption
- [ ] Batch upload (multiple images)
- [ ] Multi-language support
- [ ] Custom caption styles
- [ ] Social media format presets

### Agency Features

- [x] Workspace management
- [x] Campaign creation
- [x] Brand kit storage
- [ ] Approval grid UI
- [ ] Export functionality UI
- [ ] Team collaboration
- [ ] Content calendar
- [ ] Performance analytics

### AI Features

- [x] BLIP image captioning
- [x] OpenAI caption rewriting
- [x] Replicate background removal
- [ ] Model selection dropdown
- [ ] Hashtag generation
- [ ] Alt-text generation
- [ ] Multi-language captions

---

## 🔗 Quick Links

- **Documentation:** [README.md](../README.md)
- **Fixes Summary:** [SUMMARY.md](../SUMMARY.md)
- **Detailed Fixes:** [IMPLEMENTATION_FIXES.md](../IMPLEMENTATION_FIXES.md)
- **Quick Reference:** [QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
- **Testing Guide:** [TESTING_GUIDE.md](../TESTING_GUIDE.md)
- **User Flows:** [USER_FLOW_GUIDE.md](../USER_FLOW_GUIDE.md)

---

## 🆘 Common Issues & Solutions

### "Failed to fetch" on caption generation

**Solution:** Verify imageUrl parameter is being sent, not s3Key

### API keys exposed in browser

**Solution:** Remove from frontend/.env.local, keep only in backend/.env

### App crashes on errors

**Solution:** Ensure ErrorBoundary is wrapping components

### Can't access without login

**Solution:** Default route should redirect to /playground, not /login

### TypeScript errors

**Solution:** Existing errors in codebase are known, focus on your changes

---

**Last Updated:** December 4, 2025  
**Version:** 1.0.0  
**Status:** ✅ All Critical Fixes Implemented
