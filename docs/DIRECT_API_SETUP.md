# Direct API Setup Guide

The app now calls Replicate and OpenAI APIs directly from the browser - no AWS needed!

## Quick Start

### 1. Get API Keys

**Replicate (for image captioning and background removal):**
1. Go to https://replicate.com/account/api-tokens
2. Sign up/login
3. Create an API token
4. Copy the token (starts with `r8_`)

**OpenAI (for caption rewrites):**
1. Go to https://platform.openai.com/api-keys
2. Sign up/login
3. Create an API key
4. Copy the key (starts with `sk-`)

### 2. Configure Environment Variables

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local` and add your keys:
```env
VITE_REPLICATE_API_TOKEN=r8_your_actual_token_here
VITE_OPENAI_API_KEY=sk-your_actual_key_here
```

### 3. Install and Run

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## How It Works

### Image Upload Flow:
```
1. User uploads image
   ↓
2. Convert to base64 data URL
   ↓
3. Call Replicate BLIP API for caption
   ↓
4. Call OpenAI to rewrite caption 3 ways
   ↓
5. Call Replicate rembg for subject mask
   ↓
6. Display captions and render canvas
```

### API Calls:

**Caption Generation:**
```javascript
POST https://api.replicate.com/v1/predictions
{
  "version": "salesforce/blip:...",
  "input": {
    "image": "data:image/jpeg;base64,...",
    "task": "image_captioning"
  }
}
```

**Mask Generation:**
```javascript
POST https://api.replicate.com/v1/predictions
{
  "version": "cjwbw/rembg:...",
  "input": {
    "image": "data:image/jpeg;base64,..."
  }
}
```

**Caption Rewrite:**
```javascript
POST https://api.openai.com/v1/chat/completions
{
  "model": "gpt-3.5-turbo",
  "messages": [{
    "role": "user",
    "content": "Rewrite this caption..."
  }]
}
```

## Cost Breakdown

### Replicate Pricing:
- **BLIP (captioning)**: ~$0.0005 per prediction
- **rembg (background removal)**: ~$0.0023 per prediction
- **Total per image**: ~$0.0028 (₹0.23)

### OpenAI Pricing:
- **GPT-3.5-turbo**: ~$0.002 per request
- **Total per caption rewrite**: ~$0.002 (₹0.17)

### Combined Cost:
- **Per image processed**: ~$0.0048 (₹0.40)
- **100 images**: ~$0.48 (₹40)
- **1000 images**: ~$4.80 (₹400)

**Much cheaper than AWS!** 🎉

## Security Note

⚠️ **API keys are exposed in the browser!**

This is fine for:
- Personal use
- Local testing
- Low-traffic apps
- Prototypes

For production with many users, consider:
1. Moving to Vercel Functions (see `SIMPLIFIED_ARCHITECTURE.md`)
2. Adding rate limiting
3. Implementing user authentication

## Troubleshooting

### "API key not found" error:
- Make sure `.env.local` exists in the `frontend/` directory
- Restart the dev server after adding keys
- Check that keys start with `r8_` (Replicate) and `sk-` (OpenAI)

### CORS errors:
- Replicate and OpenAI APIs support CORS from browsers
- If you see CORS errors, check your API keys are valid

### "Prediction failed" error:
- Check your Replicate account has credits
- Verify the model versions are still active
- Check the browser console for detailed errors

### Slow response times:
- First prediction is slower (cold start)
- Subsequent predictions are faster
- Typical time: 3-10 seconds per image

## Features

✅ **No AWS setup needed**
✅ **No backend server required**
✅ **Direct API calls from browser**
✅ **Real AI caption generation**
✅ **Subject masking (text behind subject)**
✅ **No restrictions or paywalls**
✅ **Pay only for what you use**

## Scaling Later

When you're ready to scale:

1. **Add a backend** (Vercel Functions, Express, etc.)
2. **Move API keys** to server-side
3. **Add rate limiting** per user
4. **Implement caching** for common images
5. **Add user authentication**

See `SIMPLIFIED_ARCHITECTURE.md` for details.

## Next Steps

1. ✅ Get API keys
2. ✅ Configure `.env.local`
3. ✅ Run `npm run dev`
4. 🎨 Add neo-brutalism design (see `PARALLEL_WORK_PLAN.md`)
5. 🚀 Deploy to Vercel/Netlify when ready

---

**Questions?** Check the other docs:
- `SIMPLIFIED_ARCHITECTURE.md` - Architecture options
- `PARALLEL_WORK_PLAN.md` - UI integration plan
- `frontend-versions/README.md` - Version comparison
